---
title: Periodic scheduling
description: Trigger jobs on a Cron expression or a fixed interval with ScheduleExecutor, and learn how to declare rules, the time settings, and how rules are updated and shut down.
---

`ScheduleExecutor` triggers jobs on a Cron expression or a fixed interval, and suits cleanup, summary and synchronization jobs declared in application code. When operators need a manageable list of scheduled jobs, enable and disable controls and execution records, connect the scheduler plugin.

## Declaring rules

Resolve the service from the host's `jobExecutorServiceToken` and call the following startup function from a Provider:

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ServiceResolver } from '@nocobase/service-provider';

export async function startOrderSchedule(
  container: ServiceResolver,
  runDigest: (signal: AbortSignal) => Promise<void>,
) {
  const service = container.resolve(jobExecutorServiceToken);
  const executor = service.getScheduleExecutor('@example/orders');
  await executor.addJob({
    name: 'daily-digest',
    payload: {},
    options: { cron: '0 2 * * *', tz: 'Asia/Shanghai' },
    execute: async ({ signal }) => runDigest(signal),
  });
  await executor.setup();
  return executor;
}
```

`runDigest` is a business function provided by the caller. Register rules before `setup()`, so that the handlers are available when consumption begins. Using the same stable name updates an existing rule; renaming does not automatically remove the rule under the old name.

## Time settings

| Setting | Meaning |
| --- | --- |
| `cron` | A five- or six-field Cron expression |
| `every` | A fixed interval in milliseconds; use either this or `cron` |
| `tz` | The time zone used by Cron; UTC by default |
| `startDate` / `endDate` | Time boundaries for scheduling |
| `limit` | The maximum number of triggers |
| `immediately` | Trigger once immediately when a Cron rule is first registered; subject to the start time settings |

Declare the business time zone explicitly instead of relying on the time zone of the deployment machine. Periodic scheduling is not a real-time guarantee: process load, pauses and retries can all affect when jobs actually run. Summary jobs work best when they take a business time window as input and can be run repeatedly.

## Updates and shutdown

`addJob()` writes or updates a rule under a stable name; an unchanged definition does not reset the schedule for no reason. Changing a rule can reschedule later runs and recalculate the trigger limit, so plan how old rules are migrated explicitly.

When the application shuts down, call `shutdown()` to release the executor; persisted rules are kept. `removeJob()` is for deleting a rule as a business operation and should not be called every time the process shuts down. Configure concurrency, retries and retention through the host's jobs configuration.

Job handling should respond to cancellation signals and stay idempotent. Local execution events are not a global execution history; when you need history, permission control and management pages, use the plugin. See also [Background jobs and executors](jobs.md).

## Interfaces and implementation

- [Schedule executor](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/jobs/README.md)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/jobs/token.ts)
