---
title: Queues, producers and consumers
---

`@nocobase/queue` provides message production and consumption. Start with [Jobs](jobs.md) for most background work; use queues directly when you need channels, delays, priorities, batching or rate limits.

## Host service

Resolve `queueServiceToken` from `@nocobase/app-server/queue` to share connections and lifecycle. `producer(name)` and `consumer(name)` address the same queue, while channels distinguish message purposes.

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

The business layer supplies `refresh`, including payload validation. Register consumers in Provider `boot()`; the host Queue Provider starts consumption in `start()`. Publish after startup completes. Retain the unregister function from `consume()` and await it before releasing business dependencies.

## Delivery behavior

Handlers registered in one process run concurrently for a message claimed by that process. Any failure can retry the entire message, repeating handlers that already succeeded. Different processes compete for messages; delivery is not broadcast.

`withChannel()` filters channels without validating payloads. A `publish()` receipt confirms acceptance rather than completion. Custom Job IDs deduplicate while the job remains in the queue, not forever; retain business idempotency keys where required.

## Configuration and durability

Queue adapters are named `inMemory` and `redis`, unlike the jobs adapter named `memory`. Configuration covers defaults, connections, namespaces, concurrency, retries, backoff and rate limits. A queue binds its configuration on first resolution; later callers cannot reinterpret the same queue with another configuration.

Memory suits local development. Saving state during clean shutdown does not guarantee recovery after abrupt exit. Redis needs appropriate persistence and resource limits. Batch inputs are checked before submission, but network or server failures can still leave a partially submitted batch.

Observe cancellation signals. Do not await self-unregistration from a handler, which can wait on its own completion. Persist authoritative business outcomes so repeated delivery and recovery are safe.

## Interfaces and implementation

- [Queue API and guarantees](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/queue/README.md)
