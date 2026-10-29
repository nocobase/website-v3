---
title: 后台任务与执行器
description: 在插件中声明公告摘要任务，通过应用 Jobs 服务取得执行器，注册、投递并清理任务资源。
---

本篇让公告插件异步生成文本摘要，说明 `server/jobs/` 与 Provider、应用 Jobs 服务如何配合。示例只截取前 80 个 Unicode 码点并记录到日志，不使用 AI、不写数据库，也不提供任务管理页面。需要持久业务结果时，将日志回调替换为自己的业务服务。

任务契约与后端机制见[后台任务与执行器](../framework/background/jobs.md)，定时规则见[周期调度](../framework/background/scheduling.md)。插件目录不会自动注册任务，任务后端由应用配置。

## 前提与相关文件

沿用已有 `@nocobase/app-plugin-announcements` 的 Server 入口。应用需要提供 `jobExecutorServiceToken` 和 `loggingToken`，默认应用模板包含相应能力。本篇不依赖客户端、数据库或前一篇预览服务。

新建插件时可以选择 `server.jobs`。已有插件增加下面的文件与声明，保留现有 Server 贡献。核对 `@nocobase/jobs`、`@nocobase/app-server`、`@nocobase/service-provider` 的依赖，沿用创建工具的分类和兼容版本。路径相对于插件根目录。

## 使用 Agent

```prompt
为公告插件增加异步摘要任务，截取前 80 个 Unicode 码点并记录到日志。
通过宿主 Jobs 服务按插件包名取得执行器，先注册任务类再启动消费。
提供 enqueue 服务，启动前和关闭后拒绝投递。载荷只传 JSON 文本，
关闭时等待自有执行器结束，不关闭宿主 Jobs 或日志服务。
验证真实 memory 执行、失败重试、取消及启动失败后的清理。
```

## 定义任务

新增 `server/jobs/summary.ts`：

```ts
import { Job, type JobClass, type JobExecutionContext } from '@nocobase/jobs';

export interface SummaryPayload { readonly text: string; }
export type WriteSummary = (summary: string, signal: AbortSignal) => Promise<void>;

export function createSummaryJob(writeSummary: WriteSummary): JobClass<SummaryPayload> {
  return class SummaryJob extends Job<SummaryPayload> {
    public static readonly jobName: string = '@nocobase/app-plugin-announcements/summary';
    public async execute(context: JobExecutionContext): Promise<void> {
      context.signal.throwIfAborted();
      const summary = Array.from(this.payload.text.trim()).slice(0, 80).join('');
      await writeSummary(summary, context.signal);
      await context.reportProgress(100);
    }
  };
}
```

任务构造函数只接收可持久化的 JSON 载荷；业务依赖通过工厂闭包绑定，不放进载荷。任务类型名在文件或类更名后仍应保持稳定，以便所有消费进程识别已排队的工作。

本例使用短文本载荷。实际处理业务记录时通常传记录 ID，并由执行服务重新读取、校验权限和版本。取消信号要传递给耗时业务操作；执行器重试可能让同一操作再次发生，业务写入仍需幂等。

## 注册执行器与投递服务

新增或合并 `server/jobs/provider.ts`：

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import type { JobClass, JobExecutor, JobReceipt } from '@nocobase/jobs';
import { createServiceToken, ServiceProvider, type ServiceContainer, type ServiceToken } from '@nocobase/service-provider';
import { createSummaryJob, type SummaryPayload } from './summary.js';

export interface AnnouncementSummaryJobs {
  enqueue(text: string): Promise<JobReceipt>;
}
export const announcementSummaryJobsToken: ServiceToken<AnnouncementSummaryJobs> =
  createServiceToken<AnnouncementSummaryJobs>('@nocobase/app-plugin-announcements/summary-jobs');

export interface AnnouncementJobsApplication { readonly container: ServiceContainer; }
export class AnnouncementJobsProvider extends ServiceProvider<AnnouncementJobsApplication> {
  public readonly name: string = '@nocobase/app-plugin-announcements/jobs';
  private executor: JobExecutor | undefined;
  private SummaryJob: JobClass<SummaryPayload> | undefined;
  private accepting: boolean = false;

  public override register(): void {
    this.app.container.singleton(announcementSummaryJobsToken, () => ({
      enqueue: async (text: string): Promise<JobReceipt> => {
        if (!this.accepting || !this.executor || !this.SummaryJob) {
          throw new Error('Announcement jobs are not ready.');
        }
        if (!text.trim() || text.length > 2000) throw new Error('Invalid announcement text.');
        return this.executor.addJob(new this.SummaryJob({ text }));
      },
    }));
  }
  public override async start(): Promise<void> {
    const logger = this.app.container.resolve(loggingToken).getLogger('announcements');
    const service = this.app.container.resolve(jobExecutorServiceToken);
    this.SummaryJob = createSummaryJob(async (summary, signal) => {
      signal.throwIfAborted();
      logger.info({ summary }, 'Announcement summary generated');
    });
    this.executor = service.getJobExecutor('@nocobase/app-plugin-announcements');
    this.executor.registerJob(this.SummaryJob);
    await this.executor.setup();
    this.accepting = true;
  }
  public override async shutdown(): Promise<void> {
    this.accepting = false;
    const executor = this.executor;
    this.executor = undefined;
    this.SummaryJob = undefined;
    await executor?.shutdown();
  }
}
```

Provider 在 `register()` 暴露投递服务，在 `start()` 解析宿主服务、注册任务类并启动执行器。`setup()` 之前必须注册当前消费进程需要的全部任务类。执行器引用在启动前保存，因此启动失败后的清理也能找到它；只有启动成功后才接受投递。

关闭时先停止接受新任务，再等待自有执行器 `shutdown()`。不要从插件关闭整个宿主 Jobs 或 Logging 服务。回调只写日志，正式业务应替换为能够处理重试、取消和幂等的实现。

## 接入 Server 声明

在已有 `server/plugin.ts` 导入 `AnnouncementJobsProvider`，加入 `serviceProviders`。以下是已有业务 Provider 数组时的字段写法，保留路由、语言和数据库等其他字段：

```ts
serviceProviders: [...serviceProviders, AnnouncementJobsProvider],
```

如果已经通过 `server/providers/index.ts` 汇总了这个 Jobs Provider，就不要在这里再次追加。`jobs/` 只是源码组织目录，不通过旧的 `queue.jobs` 声明发现任务。

需要让应用或其他插件提交任务时，在 `server/index.ts` 保留默认导出，并增加：

```ts
export { announcementSummaryJobsToken } from './jobs/provider.js';
export type { AnnouncementSummaryJobs } from './jobs/provider.js';
```

应用在 `server/plugins.ts` 注册插件后，已完成身份、权限和输入检查的业务入口可以调用 `app.container.resolve(announcementSummaryJobsToken).enqueue(text)`。应在应用启动完成后投递，不能在路由工厂创建期间提前提交；CLI 调用需要在 `withApp()` 中启动应用再投递，并等待所需工作结束。

回执只表示后端接受任务，不代表摘要生成成功。HTTP 可以返回任务回执，但不能把它当作业务完成结果；需要可查询的状态时另行维护持久任务记录。示例的错误为服务层异常，HTTP 和 CLI 应按各自合同转换，不直接返回异常栈。

## 后端、重试与交付

`jobs` 配置由宿主决定。默认 memory 适合单进程开发，正常关闭时的状态保存不能保证进程崩溃恢复；多进程部署需要共享后端并在每个消费进程注册同名任务实现。不要让插件为了自己的任务替换应用全局配置。

重试不会自动让外部副作用幂等。本例重复写日志可以接受，正式摘要保存应使用业务 ID、版本或唯一约束控制重复结果。数据库提交和任务投递也不是同一个事务，可靠投递方案见[后台任务与定时执行](../developing-apps/background-tasks.md)。周期触发属于可选扩展，按[周期调度](../framework/background/scheduling.md)接入，无需在本篇再配置一个定时器。

任务代码随 Server 构建进入插件产物。升级时保留仍有排队任务使用的 `jobName` 和执行器 scope，并明确旧载荷的兼容方式。它们不能只因文件或包的显示名称变化就随意更名。

## 验证任务执行与清理

沿用脚手架的 Node 测试环境，使用真实 memory 执行器。下面的 `tests/server/jobs.test.ts` 将状态放在临时目录，并观察日志回调；测试直接导入的 `@nocobase/logging` 需作为兼容的开发依赖声明：

```ts
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import { createJobExecutorService } from '@nocobase/jobs';
import { createLogging } from '@nocobase/logging';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it, vi } from 'vitest';
import { AnnouncementJobsProvider, announcementSummaryJobsToken } from '../../server/jobs/provider.js';

it('runs accepted jobs and stops accepting after shutdown', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'announcement-jobs-'));
  const jobs = createJobExecutorService(undefined, { appName: 'test', storagePath: directory });
  const logging = createLogging();
  const log = vi.spyOn(logging.getLogger('announcements'), 'info').mockImplementation(() => {});
  const container = new ServiceContainer();
  container.instance(jobExecutorServiceToken, jobs);
  container.instance(loggingToken, logging);
  const provider = new AnnouncementJobsProvider({ container });
  provider.register();
  const submit = container.resolve(announcementSummaryJobsToken);
  try {
    await expect(submit.enqueue('Hello')).rejects.toThrow('not ready');
    await provider.start();
    const receipt = await submit.enqueue('  Hello 👋  ');
    expect(receipt.jobName).toBe('@nocobase/app-plugin-announcements/summary');
    await vi.waitFor(() => expect(log).toHaveBeenCalledWith(
      { summary: 'Hello 👋' }, 'Announcement summary generated',
    ));
    await provider.shutdown();
    await expect(submit.enqueue('Hello')).rejects.toThrow('not ready');
  } finally {
    try { await provider.shutdown(); } finally {
      try { await jobs.shutdown(); } finally {
        await logging.close();
        await rm(directory, { recursive: true, force: true });
      }
    }
  }
});
```

再覆盖非法输入、业务函数抛错后重试、已取消信号、执行器启动失败和应用整体关闭顺序。替换日志为实际业务服务后，还要验证相同业务 ID 的重复执行不会产生重复结果。memory 测试不证明 Redis、多进程或真实部署恢复行为。

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

最后在目标 App 的已授权入口投递一条测试文本，核对回执与日志，并检查关闭时没有遗留任务继续访问已经释放的资源。
