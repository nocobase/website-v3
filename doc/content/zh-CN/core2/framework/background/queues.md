---
title: 消息队列
description: 用 @nocobase/queue 生产和消费消息，了解宿主队列服务的接入方式、消费语义，以及配置与持久化方面的注意事项。
---

`@nocobase/queue` 提供消息的生产与消费。大多数后台业务可以先使用 [后台任务与执行器](jobs.md)；需要通道、延迟、优先级、批量投递或限流控制时，再直接使用队列。

## 宿主服务

应用通过 `@nocobase/app-server/queue` 中的 `queueServiceToken` 共享队列的连接和生命周期。`producer(name)` 和 `consumer(name)` 使用相同的队列名，消息再按 channel 区分用途。

```ts
import { queueServiceToken } from '@nocobase/app-server/queue';
import { withChannel } from '@nocobase/queue';
import type { ServiceResolver } from '@nocobase/service-provider';

export function consumeOrderRefresh(
  container: ServiceResolver,
  refresh: (message: unknown, signal: AbortSignal) => Promise<void>,
) {
  const queue = container.resolve(queueServiceToken);
  return queue.consumer('orders').consume(
    withChannel('refresh', async (_channel, message, signal) => {
      await refresh(message, signal);
    }),
  );
}

export async function requestOrderRefresh(container: ServiceResolver, orderId: string) {
  const queue = container.resolve(queueServiceToken);
  return queue.producer('orders').publish('refresh', { orderId });
}
```

这里的 `refresh` 由业务层提供，负责校验消息并执行操作。Provider 在 `boot()` 中注册消费者，宿主的 Queue Provider 在 `start()` 中开始消费；投递应在启动完成之后进行。请保存 `consume()` 返回的注销函数，关闭时等待它完成，再释放业务依赖。

应用和插件都可以把 `app.container` 传给这两个函数。队列名应体现它所属的业务或插件，并让生产者和消费者遵循相同的约定。连接、适配器和命名空间由应用统一配置；插件只注销自己注册的消费者，不停止宿主共享的 Queue 服务。

需要任务类、执行进度和周期规则时，优先使用 Jobs；需要页面订阅业务变更时，使用 [实时消息与主题订阅](../realtime/topics.md)。队列适合让某一个工作进程处理消息，不负责向每个在线的页面广播。

## 消费语义

同一个进程中注册的多个处理器，会并行处理这个进程领取到的消息；其中任何一个失败，都可能导致整条消息重试，因此其他已经成功的处理器也可能再执行一次。不同进程之间是竞争领取消息，并不是向所有进程广播。

`withChannel()` 只负责筛选通道，不校验载荷。`publish()` 的回执表示消息已被接收，不代表已经消费完成。自定义的 Job ID 可以在队列保留该任务期间去重，但不能代替业务上的幂等键。

## 配置与持久化

队列适配器的名称是 `inMemory` 和 `redis`，与 jobs 配置中的 `memory` 名称不同。队列配置包括默认项、连接、命名空间、并发数、重试、退避和限流等；同一个队列在第一次解析时就绑定了配置，之后不能再用另一份配置重新解释它。

内存队列适合单机开发；正常关闭时保存的状态，不能保证在进程突然退出后恢复。Redis 需要配置相应的数据持久化和资源限制。批量投递的消息会先经过输入检查，但网络或 Redis 服务端出错时，仍然可能只有部分消息投递成功。

处理器应响应取消信号。不要在处理器内部等待注销它自己，否则可能会等待自身完成而无法结束。请把成功记录和业务结果保存在可靠的存储中，以便应对重复投递和故障恢复。

## 接口与实现

- [Queue API and guarantees](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/queue/README.md)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/queue/token.ts)
