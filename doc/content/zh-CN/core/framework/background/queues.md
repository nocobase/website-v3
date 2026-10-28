---
title: 队列、生产者与消费者
---

`@nocobase/queue` 提供消息生产与消费。大多数后台业务可先用[Jobs](jobs.md)；需要通道、延迟、优先级、批量投递或限流控制时，再直接使用队列。

## 宿主服务

应用通过 `@nocobase/app-server/queue` 的 `queueServiceToken` 共享队列连接和生命周期。`producer(name)` 和 `consumer(name)` 使用同一队列名，消息再按 channel 区分用途。

```ts
import { withChannel, type QueueService } from '@nocobase/queue';

export function consumeOrderRefresh(
  queue: QueueService,
  refresh: (message: unknown, signal: AbortSignal) => Promise<void>,
) {
  return queue.consumer('orders').consume(
    withChannel('refresh', async (_channel, message, signal) => {
      await refresh(message, signal);
    }),
  );
}

export async function requestOrderRefresh(queue: QueueService, orderId: string) {
  return queue.producer('orders').publish('refresh', { orderId });
}
```

这里的 `refresh` 由业务层提供，负责校验消息并执行操作。Provider 在 `boot()` 注册消费者，宿主 Queue Provider 在 `start()` 启动消费；投递应发生在启动完成后。保存 `consume()` 返回的注销函数，关闭时等待它完成，再释放业务依赖。

## 消费语义

同一进程注册的处理器会并行处理该进程领取的消息，任一失败都可能让整条消息重试。因此其他已经成功的处理器也可能再次执行。不同进程之间竞争领取消息，这不是向所有进程广播。

`withChannel()` 只筛选通道，不校验载荷。`publish()` 的回执表示接收成功，不代表消费完成。自定义 Job ID 可在队列保留该任务期间去重，但不能替代业务幂等键。

## 配置与持久化

队列适配器名称是 `inMemory` 和 `redis`，与 jobs 的 `memory` 配置名称不同。队列配置包含默认项、连接、命名空间、并发、重试、退避和限流等；同一队列第一次解析时绑定配置，后续不能用另一配置重解释它。

内存队列适合单机开发，正常关闭时保存的状态不能保证突然退出后恢复。Redis 需要匹配数据持久化和资源限制。批量消息会先做输入检查，但网络或 Redis 服务端失败仍可能导致部分投递成功。

处理器应响应取消信号。不要在处理器内部等待注销自身，否则可能等待自己的完成。将成功记录与业务结果保存在可靠存储中，便于重复投递和故障恢复。

## 接口与实现

- [Queue API and guarantees](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/queue/README.md)
