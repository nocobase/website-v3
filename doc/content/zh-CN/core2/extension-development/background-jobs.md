---
title: 后台任务与执行器
description: 在插件中声明公告摘要任务，通过应用的 Jobs 服务取得执行器，完成注册、投递和任务资源的清理。
---

本篇让公告插件异步生成文本摘要，说明 `server/jobs/` 如何与 Provider 以及应用的 Jobs 服务配合。示例只截取文本的前 80 个 Unicode 码点并记录到日志中，不使用 AI、不写数据库，也不提供任务管理页面。如果需要持久保存的业务结果，请把日志回调替换为你自己的业务服务。

任务契约和后端机制见 [后台任务与执行器](../framework/background/jobs.md)，定时规则见 [周期调度](../framework/background/scheduling.md)。插件的目录不会自动注册任务，任务的后端由应用配置。

## 前提与相关文件

沿用已有的 `@nocobase/app-plugin-announcements` 的 Server 入口。应用需要提供 `jobExecutorServiceToken` 和 `loggingToken`，默认的应用模板已经具备这些能力。本篇不依赖客户端、数据库或上一篇的预览服务。

新建插件时可以选择 `server.jobs`。已有的插件只需增加下面的文件和声明，并保留现有的 Server 贡献。请核对 `@nocobase/jobs`、`@nocobase/app-server` 和 `@nocobase/service-provider` 的依赖，沿用创建工具确定的分类和兼容版本。路径相对于插件根目录。

## 使用 Agent

```text
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

任务的构造函数只接收可以持久化的 JSON 载荷；业务依赖通过工厂闭包绑定，不放进载荷中。即使文件或类改名，任务类型名也应保持不变，以便所有负责消费的进程都能识别已经排队的工作。

本例使用一段短文本作为载荷。实际处理业务记录时，通常只传记录 ID，由执行服务重新读取数据、校验权限和版本。取消信号要一直传递到耗时的业务操作；执行器的重试可能导致同一个操作再次发生，所以业务写入仍需保证幂等。

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

Provider 在 `register()` 中暴露投递服务，在 `start()` 中解析宿主的服务、注册任务类并启动执行器。在调用 `setup()` 之前，必须注册当前消费进程需要的全部任务类。执行器的引用在启动之前就保存下来，这样即使启动失败，清理时也能找到它；只有启动成功之后才接受投递。

关闭时，先停止接受新的任务，再等待自有执行器的 `shutdown()` 完成。不要在插件中关闭整个宿主的 Jobs 或 Logging 服务。示例的回调只写日志，正式的业务应替换为能够处理重试、取消和幂等的实现。

## 接入 Server 声明

在已有的 `server/plugin.ts` 中导入 `AnnouncementJobsProvider`，并加入 `serviceProviders`。下面是已有业务 Provider 数组时的写法，请保留路由、语言和数据库等其他字段：

```ts
serviceProviders: [...serviceProviders, AnnouncementJobsProvider],
```

如果已经通过 `server/providers/index.ts` 汇总了这个 Jobs Provider，就不要在这里重复追加。`jobs/` 只是组织源码的目录，任务也不会通过旧的 `queue.jobs` 声明被发现。

如果需要让应用或其他插件提交任务，在 `server/index.ts` 中保留默认导出，并增加：

```ts
export { announcementSummaryJobsToken } from './jobs/provider.js';
export type { AnnouncementSummaryJobs } from './jobs/provider.js';
```

应用在 `server/plugins.ts` 中注册插件之后，已经完成身份、权限和输入检查的业务入口，就可以调用 `app.container.resolve(announcementSummaryJobsToken).enqueue(text)`。投递应在应用启动完成之后进行，不能在路由工厂创建期间提前提交；在 CLI 中调用时，需要在 `withApp()` 中启动应用之后再投递，并等待所需的工作结束。

回执只表示后端已经接受了任务，并不代表摘要已经生成成功。HTTP 接口可以返回任务回执，但不能把它当作业务完成的结果；需要可以查询的状态时，请另外维护持久的任务记录。示例中的错误是服务层的异常，HTTP 和 CLI 应按各自的约定进行转换，不要直接返回异常栈。

## 后端、重试与交付

`jobs` 配置由宿主决定。默认的 memory 后端适合单进程开发，它在正常关闭时保存的状态，并不能保证进程崩溃后的恢复；多进程部署需要共享的后端，并在每个消费进程中注册同名的任务实现。不要让插件为了自己的任务而替换应用的全局配置。

重试并不会让外部的副作用自动变成幂等。本例中重复写日志是可以接受的；正式保存摘要时，应使用业务 ID、版本或唯一约束来控制重复的结果。数据库提交和任务投递也不在同一个事务中，可靠投递的方案见 [后台任务与定时执行](../developing-apps/background-tasks.md)。周期触发属于可选的扩展，按 [周期调度](../framework/background/scheduling.md) 接入即可，不需要在本篇中再配置一个定时器。

任务代码会随 Server 构建进入插件的产物。升级时，请保留仍有排队任务在使用的 `jobName` 和执行器 scope，并明确旧载荷的兼容方式；不能仅仅因为文件或包的显示名称变了，就随意给它们改名。

## 验证任务执行与清理

沿用脚手架的 Node 测试环境，使用真实的 memory 执行器。下面的 `tests/server/jobs.test.ts` 把状态放在临时目录中，并观察日志回调；测试中直接导入的 `@nocobase/logging`，需要声明为兼容的开发依赖：

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

还要覆盖：非法输入、业务函数抛错后的重试、已取消的信号、执行器启动失败，以及应用整体的关闭顺序。把日志替换为实际的业务服务之后，还要验证相同业务 ID 的重复执行不会产生重复的结果。memory 后端上的测试，不能证明 Redis、多进程或真实部署中的恢复行为。

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

最后，在目标 App 中通过已授权的入口投递一条测试文本，核对回执和日志，并检查关闭时没有遗留的任务继续访问已经释放的资源。
