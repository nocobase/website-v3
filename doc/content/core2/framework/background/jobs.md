---
title: Background jobs and executors
description: Hand long-running work to the background with @nocobase/jobs, and learn how to define, register and submit jobs, how responsibilities split between applications and plugins, and how storage, failure and shutdown are handled.
---

Long-running work can be handed to `@nocobase/jobs`, so that the request only has to accept the job. The host's `jobExecutorServiceToken` lives in `@nocobase/app-server/jobs`, and through it you get executors isolated by plugin or business scope.

## Defining a job

Put the implementation in the server directory of the application or plugin, for example `server/jobs/count-orders-job.ts`:

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

The payload is persistable JSON data, and every attempt of a job creates a new instance. Pass only record IDs and the necessary parameters; do not pass connections, service containers, functions, `Date`, `bigint` or `undefined`. When you need a date, pass an ISO string.

## Registering and submitting

Pass the application's or plugin's `app.container` to the startup logic, and resolve the host's service through its public Token:

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

Every process that consumes jobs must register the job classes before `setup()`. The producer's process knowing the class does not mean other processes have registered it. A process that only submits and does not consume can use `setup({ consume: false })`. In real business code, initialize the executor during the Provider's startup stage, call `addJob()` from endpoints or business services, and wait for the executor's `shutdown()` during the shutdown stage.

A receipt means the job was accepted, not that it was processed successfully. `jobName`, the application namespace and the executor's scope together determine the identity of a persisted job; do not rename them casually while existing jobs are still pending.

## Responsibilities of applications and plugins

The application provides the jobs configuration and adapters; plugins use a stable package name as their scope and register their own jobs. To make the flow easy to follow, the example puts initialization and one submission together; in a real integration, keep the executor and submit when the business event happens. A plugin closes only its own executors, not the Jobs service shared by the host.

Submitting a job does not automatically form an atomic operation with a business database transaction. For follow-up work that must not be lost, design persisted pending records or an outbox, and keep job consumption idempotent. For integration in an application, see [Background jobs and scheduled execution](../../developing-apps/background-tasks.md); for a complete Provider example in a plugin, see [Background jobs and executors](../../extension-development/background-jobs.md) in the plugin guides.

## Storage, failure and shutdown

Use memory during development and Redis for consumption across processes. The memory adapter cannot recover reliably after a process crash, and Redis's reliability still depends on its persistence and eviction policies.

Retries can run business operations again, so external requests and database writes need idempotent design. `reportProgress()` reports progress and cannot be the only evidence that business work is complete; local events are not persisted job history either. Check `signal` while running and cooperate with stopping, so that work does not keep using released resources when the service shuts down.

For recurring jobs, see [Periodic scheduling](scheduling.md); when you need message channels and finer control over production and consumption, see [Message queues](queues.md).

## Interfaces and implementation

- [Job contracts and execution](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/jobs/README.md)
- [Host jobs service](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/jobs/index.ts)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/jobs/token.ts)
