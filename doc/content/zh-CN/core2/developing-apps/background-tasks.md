---
title: 后台任务与定时执行
description: 在应用中注册后台任务和周期规则，复用业务服务，并管理执行器的启动、投递与关闭。
---

耗时的操作可以交给后台任务，周期性的清理或汇总可以在代码中声明为定时执行。本篇按默认模板 `1.0.0-beta.84` 的服务端入口，组织一个可以运行的任务示例；它不依赖历史项目教程。

## 先选择执行方式

| 需求 | 使用方式 |
| --- | --- |
| 当前请求需要立即知道业务结果 | 直接调用服务 |
| 请求只需提交工作，允许稍后完成 | `JobExecutor` 与 `Job` |
| 在应用代码中声明每天或按固定间隔执行 | `ScheduleExecutor` |
| 管理员需要创建、启停规则并查看执行记录 | 接入定时任务插件 |

执行器由 `@nocobase/app-server/jobs` 的 `jobExecutorServiceToken` 提供，`@nocobase/jobs` 提供任务契约。更底层的消息队列是另一层能力，见 [消息队列](../framework/background/queues.md)。

## 定义任务

按需新建 `server/jobs/report-job.ts`。`jobs/` 是应用自己的组织目录，并不是默认模板会自动扫描的入口：

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

任务的构造函数只接收可以持久化的 JSON 载荷。依赖通过工厂函数绑定，不要把数据库连接、服务容器、函数或请求对象放进载荷。`jobName` 是稳定的任务类型名称；所有负责消费的进程，都必须在开始消费之前注册同名的实现。

`generateReport` 是实际的业务实现，它接收业务 ID 和取消信号，可以调用 [服务端业务服务](server-business-services.md)。下面先绑定一个日志输出来验证运行链路，并不会真正生成报表文件。

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

把 Provider 加入 `server/providers/index.ts`，并保留已有的注册：

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

默认模板的 `SubmissionProvider` 已经配置了 Repository 写入的幂等，并注册了每小时清理过期回执的周期任务。新增业务任务时无需替换它，也不要再注册一份相同的清理规则。

## 从业务入口投递

在应用已经启动、入口也完成了身份和权限检查之后，从同一个容器解析 `reportJobsToken`，调用 `await app.container.resolve(reportJobsToken).enqueue(reportId)`。`reportId` 应先经过校验。接口可以返回 `202` 和任务 ID，但这个回执只表示任务已被接收，并不代表业务已经成功；任务的历史或完成状态需要另行持久化，不能把本地事件当作跨实例的状态。

本例的周期规则在上海时区每天 02:00 投递一次任务。周期规则执行成功只表示投递完成，报表的生成仍可能在稍后失败；如果需要展示结果，应把周期触发、任务 ID 和业务结果关联起来。如果周期操作本身很短，也可以在 `execute()` 中直接调用业务服务，不必再投递一次。

## 周期、重试与数据一致性

- `cron` 与 `every` 二选一，`every` 的单位是毫秒。使用 Cron 时，请显式写明 `tz`。
- scope、任务类型和规则名称都要保持稳定。修改规则时沿用原名称；改名不会自动删除旧规则。应用关闭时调用 `shutdown()`；只有业务上确实要删除规则时，才调用 `removeJob()`。
- 重试可能导致重复执行。上例中的报表 ID 可以作为业务去重的依据，但执行器不会自动按这个 ID 去重，真正的生成服务必须自己实现幂等。
- 数据写入和任务投递不在同一个事务中。需要可靠交付时，持久化待投递的记录，并提供恢复逻辑，见 [服务端业务服务](server-business-services.md)。
- 后台任务没有浏览器请求的身份。请明确它是系统任务还是用户任务，以及相应的权限范围；不要把客户端提供的权限策略直接当作可信的载荷。

未配置 `jobs.default` 时，模板使用单进程的 memory 执行器，在正常关闭时把状态写入 `storage/jobs/`。它不能保证崩溃后恢复，也不负责在多个实例之间分配工作。多实例部署应配置共享的执行后端；具体配置和重试参数见 [后台任务与执行器](../framework/background/jobs.md) 和 [周期调度](../framework/background/scheduling.md)。注意，这里的 `jobs` 配置与更底层的 `queue` 配置是分开的。

## 验证

1. 启动应用，确认原有的 Provider 都已保留，新增任务没有被重复注册。
2. 从已授权的入口投递一个测试 ID，确认收到回执，并出现带有相同 ID 的 `Report job executed` 日志。
3. 在隔离的测试环境中，临时用 `every: 1000` 代替 Cron 和时区，确认周期投递生效；验证完成后，恢复为每天执行。
4. 让业务函数抛出错误或响应取消，验证失败、重试和关闭的行为；重复执行相同的业务 ID 时，不能产生重复的业务结果。
5. 在真实的目标后端上验证多进程消费和恢复；memory 执行器的测试不能代替部署验证。

业务规则的测试可以直接调用 `ReportJob.execute()`；投递、消费、定时规则和关闭，则需要使用真实的执行器测试。
