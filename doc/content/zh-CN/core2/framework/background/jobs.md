---
title: 后台任务与执行器
description: 用 @nocobase/jobs 把耗时处理交给后台执行，了解如何定义、注册和投递任务，应用与插件的职责划分，以及存储、失败和停止的处理。
---

耗时的处理可以交给 `@nocobase/jobs`，请求只负责接收任务。宿主的 `jobExecutorServiceToken` 位于 `@nocobase/app-server/jobs`，通过它可以取得按插件或业务范围隔离的执行器。

## 定义任务

把实现放在应用或插件的服务端目录中，例如 `server/jobs/count-orders-job.ts`：

```ts
import { Job, type JobExecutionContext } from '@nocobase/jobs';

export class CountOrdersJob extends Job<{ orderIds: string[] }> {
  static readonly jobName: string = 'orders.count';

  async execute(context: JobExecutionContext): Promise<void> {
    context.signal.throwIfAborted();
    for (let index = 0; index < this.payload.orderIds.length; index += 1) {
      context.signal.throwIfAborted();
      await context.reportProgress(
        ((index + 1) / this.payload.orderIds.length) * 100,
      );
    }
  }
}
```

载荷是可以持久化的 JSON 数据，任务的每次尝试都会创建一个新实例。只传递记录 ID 和必要的参数；不要传递连接、服务容器、函数、`Date`、`bigint` 或 `undefined`。需要日期时，传递 ISO 字符串。

## 注册与投递

把应用或插件的 `app.container` 传给启动逻辑，通过公开的 Token 解析宿主的服务：

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ServiceResolver } from '@nocobase/service-provider';
import { CountOrdersJob } from './count-orders-job.js';

export async function startOrderJobs(container: ServiceResolver) {
  const service = container.resolve(jobExecutorServiceToken);
  const executor = service.getJobExecutor('@example/orders');
  executor.registerJob(CountOrdersJob);
  await executor.setup();
  const receipt = await executor.addJob(
    new CountOrdersJob({ orderIds: ['order-1', 'order-2'] }),
  );
  return { executor, receipt };
}
```

所有消费任务的进程，都应在 `setup()` 之前注册任务类。生产者所在的进程知道这个类，并不代表其他进程已经注册了它。只投递、不消费的进程可以使用 `setup({ consume: false })`。在实际业务中，在 Provider 的启动阶段初始化执行器，在接口或业务服务中调用 `addJob()`，并在关闭阶段等待执行器的 `shutdown()` 完成。

回执表示任务已经被接收，并不表示处理成功。`jobName`、应用的命名空间和执行器的 scope 共同决定持久化任务的身份；已有的任务尚未处理完时，不要随意更改名称。

## 应用与插件的职责

应用提供 jobs 的配置和适配器；插件使用稳定的包名作为 scope，并注册自己的任务。示例为了看清流程，把初始化和一次投递写在了一起；实际接入时，应保存执行器，在业务触发时再投递。插件只关闭自己的执行器，不关闭宿主共享的 Jobs 服务。

提交任务不会自动与业务数据库的事务组成原子操作。对于不能遗漏的后续处理，应设计持久化的待处理记录或 Outbox，并让任务的消费保持幂等。应用中的接入见 [后台任务与定时执行](../../developing-apps/background-tasks.md)，插件中完整的 Provider 示例见插件开发中的 [后台任务与执行器](../../extension-development/background-jobs.md)。

## 存储、失败与停止

开发时可以使用 memory，跨进程消费时使用 Redis。内存适配器无法在进程崩溃后可靠地恢复；Redis 的可靠性也仍然取决于它的持久化和淘汰策略。

重试可能会再次执行业务操作，因此外部请求和数据库写入都需要幂等设计。`reportProgress()` 用于报告进度，不能作为业务完成的唯一依据；本地事件也不是持久化的任务历史。执行时要检查 `signal` 并配合停止，避免在服务关闭时继续使用已经释放的资源。

周期任务见 [周期调度](scheduling.md)；需要消息通道和更细致的生产、消费控制时，见 [消息队列](queues.md)。

## 接口与实现

- [Job contracts and execution](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/jobs/README.md)
- [Host jobs service](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/jobs/index.ts)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/jobs/token.ts)
