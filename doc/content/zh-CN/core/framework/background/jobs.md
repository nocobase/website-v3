---
title: 后台任务与执行器
---

耗时处理可以交给 `@nocobase/jobs`，让请求只负责接收任务。宿主的 `jobExecutorServiceToken` 位于 `@nocobase/app-server/jobs`；通过它取得按插件或业务范围隔离的执行器。

## 定义任务

将实现放在应用或插件的服务端目录，例如 `server/jobs/count-orders-job.ts`：

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

载荷是可持久化的 JSON 数据，任务每次尝试都创建新实例。只传记录 ID 和必要参数；不要传连接、服务容器、函数、`Date`、`bigint` 或 `undefined`。需要日期时传 ISO 字符串。

## 注册与投递

将从容器解析的 `JobExecutorService` 交给启动逻辑：

```ts
import type { JobExecutorService } from '@nocobase/jobs';
import { CountOrdersJob } from './count-orders-job.js';

export async function startOrderJobs(service: JobExecutorService) {
  const executor = service.getJobExecutor('@example/orders');
  executor.registerJob(CountOrdersJob);
  await executor.setup();
  const receipt = await executor.addJob(
    new CountOrdersJob({ orderIds: ['order-1', 'order-2'] }),
  );
  return { executor, receipt };
}
```

所有消费进程都应在 `setup()` 前注册任务类。生产者本地知道这个类，不代表其他进程已经注册它。只投递的进程可用 `setup({ consume: false })`。实际业务中在 Provider 启动阶段初始化执行器，在接口或业务服务中 `addJob()`，关闭阶段等待执行器 `shutdown()`。

回执表示任务已被接收，不表示处理成功。`jobName`、应用命名空间和执行器 scope 共同影响持久任务的身份，已有任务尚未处理完时不要随意更名。

## 存储、失败和停止

开发可用 memory，跨进程消费使用 Redis。内存适配器不能提供进程崩溃后的可靠恢复；Redis 的可靠性仍依赖其持久化和淘汰策略。

重试可能再次执行业务操作，外部请求和数据库写入需要幂等设计。`reportProgress()` 报告进度，不能作为业务完成的唯一依据；本地事件也不是持久任务历史。执行时检查 `signal` 并配合停止，避免关闭服务时继续使用已经释放的资源。

周期任务见[周期调度](scheduling.md)，需要消息通道和更细的生产消费控制时见[队列](queues.md)。

## 接口与实现

- [Job contracts and execution](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/jobs/README.md)
- [Host jobs service](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/jobs/index.ts)
