---
title: Background jobs and executors
---

Use `@nocobase/jobs` for work that should outlive an HTTP request. Resolve `jobExecutorServiceToken` from `@nocobase/app-server/jobs` to obtain executors scoped to a plugin or business area.

## Define a job

Place a task in a server directory, for example `server/jobs/count-orders-job.ts`:

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

Payloads are persistent JSON values, and each attempt creates a fresh instance. Pass record IDs and required parameters, not connections, containers, functions, `Date`, `bigint` or `undefined`. Represent dates as ISO strings.

## Register and submit

Pass the application or plugin host’s `app.container` to startup code and resolve the shared service through its public Token:

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

Every consumer process registers task classes before `setup()`. Registration in the producer does not register a remote worker. Producer-only processes can call `setup({ consume: false })`. In an application, initialize the executor in a Provider's startup, submit from routes or business services, and await `shutdown()` during cleanup.

A receipt confirms acceptance, not completion. The application namespace, executor scope and stable `jobName` identify persistent work. Avoid renaming them while pending tasks still depend on them.

## Application and plugin responsibilities

The application supplies jobs configuration and adapters. Plugins use a stable package scope and register their own jobs. The example combines initialization and one submission to show the flow; real integration retains the executor and submits when business events occur. A plugin closes its executors, not the shared host Jobs service.

Job submission is not automatically atomic with a business database transaction. Work that must not be lost needs a durable pending record or outbox and idempotent consumption. See [Application background tasks](../../developing-apps/background-tasks.md) and the complete [Plugin Provider example](../../extension-development/background-jobs.md).

## Storage, failure and shutdown

Memory suits development; use Redis for distributed consumers. Memory cannot guarantee recovery after a process crash. Redis durability still depends on persistence and eviction settings.

Retries can repeat business operations, so make external calls and database writes idempotent. `reportProgress()` reports progress rather than authoritative business completion; local events are not durable task history. Observe the abort `signal` and finish cleanup before dependent resources close.

See [Scheduling](scheduling.md) for recurring work and [Queues](queues.md) for channels and lower-level producer/consumer control.

> [!NOTE]
> The examples retain the pinned source baseline listed below. [Newer development source](https://github.com/nocobase/nocobase/blob/a0b45681ee0a6940068abdff4c61b57ae888dd6d/packages/libs/jobs/README.md) moves Redis support into the commercial `@nocobase/app-plugin-jobs-redis` plugin. That implementation requires a compatible package and Server registration before selecting `redis`. Older npm installations may use the earlier integration; check the [installed version](../../reference/compatibility.md#documentation-baselines-and-installed-versions) and its bundled guidance first.

## Interfaces and implementation

- [Job contracts and execution](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/jobs/README.md)
- [Host jobs service](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/jobs/index.ts)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/jobs/token.ts)
