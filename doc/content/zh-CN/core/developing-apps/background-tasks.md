---
title: 后台任务与定时执行
description: 在应用中注册后台任务与周期规则，复用业务服务，并管理执行器的启动、投递与关闭。
---

耗时操作可以交给后台任务；周期清理或汇总可以由代码声明定时执行。本篇按默认模板 `1.0.0-beta.84` 的服务端入口组织一个可运行的任务示例，不依赖历史项目教程。

## 先选择执行方式

| 需求 | 使用方式 |
| --- | --- |
| 当前请求需要立即知道业务结果 | 直接调用服务 |
| 请求只需提交工作，允许稍后完成 | `JobExecutor` 与 `Job` |
| 应用代码声明每天或固定间隔执行 | `ScheduleExecutor` |
| 管理员需要查看计划、启停规则及查看执行记录 | 接入定时任务插件 |

执行器由 `@nocobase/app-server/jobs` 的 `jobExecutorServiceToken` 提供。`@nocobase/jobs` 提供任务契约；低层消息队列是另一层能力，见[队列](../framework/background/queues.md)。

## 定义任务

按需新建 `server/jobs/report-job.ts`。`jobs/` 是应用自己的组织目录，并非默认模板自动扫描的入口：

```ts
import { Job, type JobExecutionContext } from '@nocobase/jobs';

export type GenerateReport = (
  reportId: string,
  signal: AbortSignal,
) => Promise<void>;

export function createReportJob(generateReport: GenerateReport) {
  return class ReportJob extends Job<{ reportId: string }> {
    static readonly jobName: string = 'reports.generate';

    async execute(context: JobExecutionContext): Promise<void> {
      context.signal.throwIfAborted();
      await generateReport(this.payload.reportId, context.signal);
      await context.reportProgress(100);
    }
  };
}
```

任务构造函数只接收可持久化的 JSON 载荷。依赖通过工厂函数绑定，不把数据库连接、服务容器、函数或请求对象放进载荷。`jobName` 是稳定的任务类型名称；所有消费进程都必须在启动消费前注册同名实现。

`generateReport` 是实际业务实现；它接收业务 ID 和取消信号，可以调用[服务端业务服务](server-business-services.md)。下面先绑定日志输出，验证运行链路，不会真正生成报表文件。

## 在 Provider 中启动与关闭

新建 `server/providers/reports.ts`：

```ts
import type { Application } from '@nocobase/app-server/application';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import type { JobExecutor, JobReceipt, ScheduleExecutor } from '@nocobase/jobs';
import { createServiceToken, ServiceProvider } from '@nocobase/service-provider';
import { createReportJob } from '../jobs/report-job.js';

export interface ReportJobs {
  enqueue(reportId: string): Promise<JobReceipt>;
}
export const reportJobsToken = createServiceToken<ReportJobs>('app/report-jobs');

export default class ReportsProvider extends ServiceProvider<Application> {
  readonly name = 'app/reports';
  private jobs?: JobExecutor;
  private schedule?: ScheduleExecutor;
  private ReportJob?: ReturnType<typeof createReportJob>;
  private acceptingJobs = false;

  override register(): void {
    this.app.container.singleton(reportJobsToken, () => ({
      enqueue: async (reportId: string) => {
        if (!this.acceptingJobs || !this.jobs || !this.ReportJob) {
          throw new Error('Report jobs are not ready.');
        }
        return this.jobs.addJob(new this.ReportJob({ reportId }));
      },
    }));
  }

  override async boot(): Promise<void> {
    const executors = this.app.container.resolve(jobExecutorServiceToken);
    const logger = this.app.container.resolve(loggingToken).getLogger('reports');
    this.ReportJob = createReportJob(async (reportId, signal) => {
      signal.throwIfAborted();
      // Runnable demonstration: replace this log with your report service.
      logger.info({ reportId }, 'Report job executed');
    });
    this.jobs = executors.getJobExecutor('app.reports');
    this.jobs.registerJob(this.ReportJob);
    await this.jobs.setup();
    this.acceptingJobs = true;

    this.schedule = executors.getScheduleExecutor('app.reports.schedule');
    await this.schedule.addJob({
      name: 'daily-report',
      options: { cron: '0 2 * * *', tz: 'Asia/Shanghai' },
      payload: {},
      execute: async ({ scheduledAt, signal }) => {
        signal.throwIfAborted();
        await this.app.container.resolve(reportJobsToken)
          .enqueue(`daily-${scheduledAt.toISOString()}`);
      },
    });
    await this.schedule.setup();
  }

  override async shutdown(): Promise<void> {
    try {
      await this.schedule?.shutdown();
    } finally {
      this.acceptingJobs = false;
      await this.jobs?.shutdown();
    }
  }
}
```

把 Provider 加入 `server/providers/index.ts`，保留已有注册：

```ts
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';
import SubmissionProvider from './submission.js';
import ReportsProvider from './reports.js';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  SubmissionProvider,
  // Keep any other Providers already registered by your application.
  ReportsProvider,
];
export default serviceProviders;
```

默认模板的 `SubmissionProvider` 已经配置 Repository 写入幂等，并注册每小时清理过期回执的周期任务。新增业务任务无需替换它，也不要再注册一份相同清理规则。

## 从业务入口投递

在应用已经启动、入口完成身份与权限检查后，从同一容器解析 `reportJobsToken`，调用 `await app.container.resolve(reportJobsToken).enqueue(reportId)`。`reportId` 应先校验。接口可以返回 `202` 和任务 ID，但这个回执只表示已经接收，不表示业务成功；任务历史或完成状态需要另行持久化，不能把本地事件当成跨实例状态。

本例的周期规则在上海时区每天 02:00 投递一次任务。它的执行成功表示投递完成，报表生成仍可能稍后失败；需要展示结果时，应关联周期触发、任务 ID 与业务结果。若周期操作本身很短，也可以在 `execute()` 中直接调用业务服务，不必再投递一次。

## 周期、重试与数据一致性

- `cron` 与 `every` 二选一；`every` 的单位是毫秒。Cron 显式写 `tz`。
- scope、任务类型和规则名称保持稳定。修改规则沿用名称；更名不会自动删除旧规则。关闭时用 `shutdown()`，业务删除规则才用 `removeJob()`。
- 重试可能重复执行。上例的报表 ID 可以作为业务去重依据，但执行器不会自动按该 ID 去重；真正的生成服务必须自行实现幂等。
- 数据写入与投递不是同一个事务。需要可靠交付时，持久化待投递记录并提供恢复逻辑，见[服务端业务服务](server-business-services.md)。
- 后台任务没有浏览器请求身份。明确系统任务或用户任务的权限范围，不要把客户端提供的权限策略直接作为可信载荷。

未配置 `jobs.default` 时，模板使用单进程 memory 执行器，在正常关闭时把状态写到 `storage/jobs/`。它不能保证崩溃恢复，也不负责多个实例之间分配工作。多实例应配置共享执行后端；具体配置与重试参数见[后台任务与执行器](../framework/background/jobs.md)和[周期调度](../framework/background/scheduling.md)。这里的 `jobs` 配置与低层 `queue` 配置分开。

## 验证

1. 启动应用，确认保留原有 Provider，新增任务没有重复注册。
2. 从已授权入口投递测试 ID，确认返回回执，并出现相同 ID 的 `Report job executed` 日志。
3. 在隔离测试环境临时使用 `every: 1000` 替代 Cron 与时区，确认周期投递；验证后恢复每天执行。
4. 让业务函数抛错或响应取消，验证失败、重试与关闭；重复执行相同业务 ID 时不能产生重复业务结果。
5. 用真实目标后端验证多进程消费与恢复，不能用 memory 测试代替部署验证。

业务规则的测试可以直接调用 `ReportJob.execute()`；投递、消费、定时规则和关闭则使用真实执行器测试。
