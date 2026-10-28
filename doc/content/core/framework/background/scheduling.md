---
title: Periodic scheduling
---

`ScheduleExecutor` triggers work using Cron or fixed intervals. Use it for code-defined cleanup, summaries and synchronization. Use the scheduler plugin when operators need task lists, enable/disable controls and execution records.

## Declare a schedule

Resolve `jobExecutorServiceToken` and call this startup function from a Provider:

```ts
import type { JobExecutorService } from '@nocobase/jobs';

export async function startOrderSchedule(
  service: JobExecutorService,
  runDigest: (signal: AbortSignal) => Promise<void>,
) {
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

`runDigest` is a business function supplied by the caller. Register rules before `setup()` so handlers exist when consumption begins. A stable name updates an existing rule; changing it does not remove the old rule.

## Time settings

| Setting | Meaning |
| --- | --- |
| `cron` | Five- or six-field Cron expression |
| `every` | Interval in milliseconds; mutually exclusive with `cron` |
| `tz` | Cron timezone; UTC by default |
| `startDate` / `endDate` | Scheduling boundaries |
| `limit` | Maximum number of occurrences |
| `immediately` | Immediate first execution for Cron, subject to start-time settings |

Declare the business timezone explicitly. Scheduling is not a real-time guarantee: load, downtime and retries affect actual execution. Prefer repeatable jobs with explicit business time windows.

## Updates and shutdown

`addJob()` uses a stable name to create or update a rule. An unchanged definition preserves its schedule. Changed rules can reschedule future occurrences and restart their occurrence limit, so plan rule migrations explicitly.

Call `shutdown()` when the application stops; persistent rules remain. `removeJob()` deletes a rule as a business operation and should not run on every process shutdown. Configure concurrency, retries and retention through host jobs configuration.

Handlers should observe cancellation and remain idempotent. Local events do not provide global history. Use a plugin for history, permissions and management pages. See [Background jobs](jobs.md).

## Interfaces and implementation

- [Schedule executor](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/jobs/README.md)
