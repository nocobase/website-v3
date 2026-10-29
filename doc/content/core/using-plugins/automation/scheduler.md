---
title: "Scheduled tasks"
description: "Declare business schedules, inspect occurrences and control execution."
---

## Capabilities

`@nocobase/app-plugin-scheduler` declares schedules in code, delegates execution to host Jobs and records each occurrence. Use it for synchronization, reports and periodic business checks.

Schedules and targets are declared in code, with application-owned management UI and no arbitrary Cron or code editor.

## Scenarios and examples

### Example: a daily business report

Generate a report at 02:00 UTC. Implement the target, declare its schedule, and let administrators inspect occurrences and disable it when necessary.

**Development prompt** (for a Coding Agent working in the application directory):

```prompt
Generate a business summary every day at 02:00 UTC. Give authorized managers a schedule list, execution history and enable/disable controls.
Show whether a run was triggered, whether the summary finished and why it failed, rather than only reporting that it was scheduled.
Disabling the schedule must prevent new scheduled runs without changing other schedules.
Use isolated test data and a short interval to check timing, actual output, failures and disabling, then restore the intended schedule.
```

**Done when**: The schedule produces a real report in its declared timezone and stops creating new scheduled work after disabling.

## Key principles and implementation

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Server Provider and target | Register target, validation and stable key | Startup synchronization discovers business schedules |
| Jobs config and shutdown | Select executor and keep dependencies until drain | Coordinate scheduling and shutdown |
| Schedule management UI | Read schedules and occurrences with guarded controls | Administrators inspect triggers and control future execution |

### Integration

Register Server, Client and the required CLI entry, apply migrations and compose `JobExecutorServiceProvider`. The application builds management pages on `/api/scheduler`.

Schedules use `jobs.default`, or the configuration named by `scheduler.jobs` / `SCHEDULER_JOBS`. Memory serves one process; Redis coordinates multiple instances. Redis integration varies by version; check the [Jobs version note](../../framework/background/jobs.md#storage-failure-and-shutdown). Keep the selected configuration's `attempts` at `1`; business targets own failure recovery.

### Declare a schedule

During a Provider's `register()` or `boot()`, resolve `schedulerServiceToken` from `/server/tokens`:

1. Call `registerTarget()` with a type, validation and start behavior.
2. Call `defineSchedule()` with an application-wide stable key, rule and target.
3. For asynchronous work, supply status inspection and report final outcomes through the returned target handle.

After registering `app.daily-report`, schedule it for 02:00 UTC daily:

```ts
scheduler.defineSchedule({
  key: 'daily-report',
  title: 'Daily report',
  schedule: { cron: '0 0 2 * * *', timezone: 'UTC' },
  target: { type: 'app.daily-report', config: {} },
});
```

`scheduler` is the resolved service. The application still implements the target. Startup synchronization reads these declarations; this is not a runtime schedule-creation API.

### Inspect and control

| Operation | Endpoint |
| --- | --- |
| List | `GET /api/scheduler/schedules` |
| Detail | `GET /api/scheduler/schedules/:id` |
| Occurrences | `GET /api/scheduler/schedules/:id/occurrences` |
| Enable/disable | `POST /api/scheduler/schedules/:id/enable` or `/disable` |

All require `page:scheduler.schedules/access`. Raw target configuration is not returned; there is no arbitrary-code or Cron editor.

With CLI registered, `pnpm nocobase scheduler sync` synchronizes declarations. Use `--finalize` only with a complete deployment manifest, since it deactivates missing definitions.

## AI development constraints and verification

### Plugin-specific development constraints

- A declaration does not implement its target. Check registration, validation and actual business outputs.
- Use appropriate Jobs coordination for multiple instances; a memory-backed local check is not distributed acceptance.
- Test async inspection after a lost completion callback, and finalize only complete manifests to avoid deactivating valid schedules.

### Verification

Test timezone, next execution, occurrences and business results with a short test interval, then verify disabling. Async targets should recover through inspection if completion notification is lost.

Keep dependencies alive until Scheduler `drain()` settles during shutdown. It does not wait for all external or human work. Related: [Background jobs](../../framework/background/jobs.md), [Scheduling](../../framework/background/scheduling.md), [Manage plugins](../../developing-apps/manage-plugins.md).

These are checks to run after integration. See [Example versions and verification scope](../overview.md#example-versions-and-verification-scope) for the documented baseline and executed checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-scheduler).
