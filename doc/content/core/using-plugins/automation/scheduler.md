---
title: "Scheduled tasks"
description: "Declare business schedules, inspect occurrences and control execution."
---

`@nocobase/app-plugin-scheduler` declares schedules in code, delegates execution to host Jobs and records each occurrence. Use it for synchronization, reports and periodic business checks.

## Integration

Register Server, Client and the required CLI entry, apply migrations and compose `JobExecutorServiceProvider`. The application builds management pages on `/api/scheduler`.

Schedules use `jobs.default`, or the configuration named by `scheduler.jobs` / `SCHEDULER_JOBS`. Memory serves one process; Redis coordinates multiple instances. Keep the selected configuration's `attempts` at `1`; business targets own failure recovery.

## Declare a schedule

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

## Inspect and control

| Operation | Endpoint |
| --- | --- |
| List | `GET /api/scheduler/schedules` |
| Detail | `GET /api/scheduler/schedules/:id` |
| Occurrences | `GET /api/scheduler/schedules/:id/occurrences` |
| Enable/disable | `POST /api/scheduler/schedules/:id/enable` or `/disable` |

All require `page:scheduler.schedules/access`. Raw target configuration is not returned; there is no arbitrary-code or Cron editor.

With CLI registered, `pnpm nocobase scheduler sync` synchronizes declarations. Use `--finalize` only with a complete deployment manifest, since it deactivates missing definitions.

## Verification

Test timezone, next execution, occurrences and business results with a short test interval, then verify disabling. Async targets should recover through inspection if completion notification is lost.

Keep dependencies alive until Scheduler `drain()` settles during shutdown. It does not wait for all external or human work. Related: [Background jobs](../../framework/background/jobs.md), [Scheduling](../../framework/background/scheduling.md), [Manage plugins](../../developing-apps/manage-plugins.md).

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-scheduler).
