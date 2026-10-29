---
title: Message queues
description: Produce and consume messages with @nocobase/queue, and learn how to connect to the host's queue service, the consumption semantics, and configuration and durability considerations.
---

`@nocobase/queue` provides message production and consumption. Most background work can start with [Background jobs and executors](jobs.md); use queues directly when you need channels, delays, priorities, batch submission or rate limiting.

## The host service

Applications share queue connections and lifecycle through `queueServiceToken` from `@nocobase/app-server/queue`. `producer(name)` and `consumer(name)` use the same queue name, and messages are then distinguished by channel.

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

`refresh` here is provided by the business layer and validates the message before performing the operation. The Provider registers consumers in `boot()`, and the host's Queue Provider starts consuming in `start()`; submit messages only after startup completes. Keep the unregister function returned by `consume()`, wait for it during shutdown, and only then release business dependencies.

Applications and plugins can both pass `app.container` to these two functions. Queue names should reflect the business or plugin they belong to, and producers and consumers should follow the same convention. Connections, adapters and namespaces are configured centrally by the application; a plugin only unregisters the consumers it registered and does not stop the Queue service shared by the host.

When you need job classes, execution progress and recurring rules, prefer Jobs; when pages need to subscribe to business changes, use [Realtime messages and topic subscriptions](../realtime/topics.md). A queue suits having one worker process handle each message, and is not responsible for broadcasting to every online page.

## Consumption semantics

Several handlers registered in the same process handle the messages that process claims in parallel; if any one of them fails, the whole message may be retried, so handlers that already succeeded may run again. Different processes compete to claim messages; this is not a broadcast to all processes.

`withChannel()` only filters by channel and does not validate payloads. The receipt from `publish()` means the message was accepted, not that it has been consumed. A custom Job ID deduplicates while the queue retains that job, but cannot replace a business idempotency key.

## Configuration and durability

The queue adapters are named `inMemory` and `redis`, which differ from the `memory` name in the jobs configuration. Queue configuration covers defaults, connections, namespaces, concurrency, retries, backoff and rate limits; a queue binds its configuration on first resolution and cannot be reinterpreted later with a different configuration.

In-memory queues suit single-machine development; state saved during a clean shutdown is not guaranteed to recover after the process exits abruptly. Redis needs suitable data persistence and resource limits. Batched messages are checked before submission, but network or Redis server errors can still leave only part of a batch submitted.

Handlers should respond to cancellation signals. Do not wait inside a handler for its own unregistration, or it may end up waiting for itself to finish. Store success records and business results in reliable storage, so that repeated delivery and failure recovery are safe.

## Interfaces and implementation

- [Queue API and guarantees](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/queue/README.md)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/queue/token.ts)
