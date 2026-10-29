---
title: "Scheduled tasks"
description: "Declare scheduled business jobs, check execution records, and enable or disable jobs."
---

## Capabilities

`@nocobase/app-plugin-scheduler` lets you declare scheduled jobs in code, hands scheduling to the host's Jobs, and records the result of every trigger. It suits periodic synchronization, summary reports and routine business checks.

Schedules and their targets are declared in code, and the management page is connected by the application; the plugin provides no editor for arbitrary Cron expressions or code.

## Scenarios and examples

### Example: a daily business summary

Generate a summary report every day at 02:00 UTC. Implement the target first, then declare the schedule; administrators check the trigger records in the list and disable the schedule when needed.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use Scheduler to generate a daily business report at 02:00 UTC. Implement and
register app.daily-report first, then declare a stable schedule key and integrate
host Jobs. Add protected list, occurrence and enable/disable controls, not an
arbitrary-code editor. Test timezone, business results, failures and disabling
with isolated data and a short interval. For async work, add status inspection.
Do not finalize an incomplete manifest.
```

**Done when**: the schedule triggers in the specified time zone and produces a real summary, and after it is disabled, no new scheduled runs occur.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| Server Provider and target implementation | Register the target, configuration validation and a stable schedule key | Synchronization at startup recognizes business schedules |
| Jobs configuration and the shutdown flow | Choose an executor, and keep the dependencies `drain` needs | Scheduling runs according to the deployment and shuts down correctly |
| Job management page | Query schedules and records, and connect the enable/disable permission | Administrators can check triggers and control future runs |

### Integration and configuration

Register the Server, Client and any CLI entry you need, run the migrations, and confirm the application has combined `JobExecutorServiceProvider`. The plugin does not register a job management page automatically; the application connects the list, details and enable/disable actions through `/api/scheduler`.

Scheduling uses `jobs.default` by default, and you can select another Jobs configuration through `scheduler.jobs` or `SCHEDULER_JOBS`. The memory executor suits a single process; when several instances schedule together, use Redis. Keep `attempts` at `1` in the chosen configuration, because failure and recovery of business targets are handled by the actual business.

### Define a job

In a Provider's `register()` or `boot()` phase, resolve `schedulerServiceToken` from `/server/tokens`, then:

1. Declare the target's type, configuration validation and start logic with `registerTarget()`.
2. Declare a stable key unique across the application, the timing rule and the target with `defineSchedule()`.
3. For targets that complete asynchronously, also provide a status check and report the final result through the handle returned at registration.

For example, after the `app.daily-report` target is registered, declare the summary job for 02:00 UTC every day like this:

```ts
scheduler.defineSchedule({
  key: 'daily-report',
  title: 'Daily report',
  schedule: { cron: '0 0 2 * * *', timezone: 'UTC' },
  target: { type: 'app.daily-report', config: {} },
});
```

`scheduler` is the resolved service. This is only the schedule declaration; the application still has to implement the report target itself. Declarations are read during synchronization at startup, so do not treat this as an HTTP API for adding jobs at any time while running.

### View and manage

| Operation | API |
| --- | --- |
| List | `GET /api/scheduler/schedules` |
| Details | `GET /api/scheduler/schedules/:id` |
| Trigger records | `GET /api/scheduler/schedules/:id/occurrences` |
| Enable or disable | `POST /api/scheduler/schedules/:id/enable` or `/disable` |

These APIs require the `page:scheduler.schedules/access` permission. The API returns no raw target configuration and provides no editor for arbitrary code or Cron.

With the CLI registered, you can run `pnpm nocobase scheduler sync` to synchronize declarations. Use `--finalize` to disable definitions that have disappeared from the list only when the deployment is confirmed to hold the complete list of schedules, so an incomplete list is never used as grounds for deletion.

## AI development constraints and verification

### Development constraints for this plugin

- Declaring a schedule is not the same as implementing the business target; check the target's registration, configuration validation and real business output.
- Multi-instance deployments need a suitable Jobs configuration; verification on a single-process memory executor does not count as distributed acceptance.
- Verify that state recovers after an asynchronous completion notice is lost; use `finalize` only with a complete list, to avoid stopping jobs by mistake.

### Verify results

Use a short-interval test job to check the time zone, the next run time, the trigger records and the business result, then verify that disabling stops new scheduled runs. For asynchronous targets, also verify that the state can still be recovered through the status check after the completion callback is lost.

When the application shuts down, the services it depends on must stay available until the Scheduler's `drain()` completes; it does not wait for all external business or human tasks to finish. Related documentation: [Background jobs and executors](../../framework/background/jobs.md), [Periodic scheduling](../../framework/background/scheduling.md), [Manage plugins](../../developing-apps/manage-plugins.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-scheduler).
