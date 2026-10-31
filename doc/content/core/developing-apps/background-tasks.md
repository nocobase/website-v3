---
title: Background jobs and scheduled execution
description: Define and submit background jobs, configure schedules, retries and graceful recovery, and choose an execution backend.
---

Use `JobExecutor` to generate reports in the background while the business entry point acknowledges the request. Use `ScheduleExecutor` to trigger work at a fixed interval or a specified time each day. Business code generates the report, handles repeated execution and saves the result.

The [order report example](https://github.com/nocobase/docs-examples-v3/tree/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks) generates real CSV files from fixed order data. It is a standalone server-only App, run through commands without pages, a database or commercial plugins. See [Example source and setup](#example-source-and-setup) for installation.

## Choose an execution model

| Need | Approach |
| --- | --- |
| The current request must receive the business result | Call the business service directly |
| Submit work once and allow it to finish later | `Job` and `JobExecutor` |
| Application code declares recurring cleanup, summaries or synchronization | `ScheduleExecutor` |
| Administrators need to enable rules and inspect execution records | [Scheduled tasks plugin](../using-plugins/automation/scheduler.md) |

Resolve the application's existing service through `jobExecutorServiceToken` from `@nocobase/app-server/jobs`. Ordinary jobs and schedules use the `jobs` configuration. For messaging capabilities such as delayed submission or priorities, see [Queues](../framework/background/queues.md), which use separate configuration.

## Define and submit background jobs

### Define the job and its parameters

Define the job in `server/jobs/report-job.ts`. The `jobs/` directory is an application convention; its contents are not scanned or registered automatically:

```ts
import { Job, type JobExecutionContext } from '@nocobase/jobs';

export interface ReportPayload {
  readonly reportId: string;
  readonly stepMs: number;
  readonly failure: 'none' | 'first' | 'always';
}

export type GenerateReport = (
  payload: ReportPayload,
  context: JobExecutionContext,
) => Promise<void>;

export function createReportJob(generateReport: GenerateReport) {
  return class ReportJob extends Job<ReportPayload> {
    static readonly jobName: string = 'reports.generate';

    async execute(context: JobExecutionContext): Promise<void> {
      context.signal.throwIfAborted();
      await generateReport(this.payload, context);
    }
  };
}
```

`reportId` identifies one business report. `stepMs` and `failure` are demonstration controls for slow work and failures; your business payload need not include them. The generator processes three fixed orders, reports progress after each, and writes the file.

Payloads contain only JSON data. Do not pass functions, database connections, request objects or `Date` instances; serialize dates as ISO strings. Submission snapshots the payload, and each execution attempt constructs a fresh job instance. Instance fields cannot preserve retry counts or recovery progress.

`createReportJob()` is the example's own factory function. Its closure binds the business dependency; it is not a framework injection API. The job constructor still accepts only the payload. Keep `jobName` stable, without whitespace or colons, and register the corresponding class in every consumer process.

[Job definition](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/jobs/report-job.ts) · [Report generator](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts)

### Register and start in a Provider

In `server/providers/reports.ts`, `register()` binds the report service to `reportJobsToken`:

```ts
override register(): void {
  this.app.container.singleton(reportJobsToken, () => new ReportJobs());
}
```

`start()` creates the job class and starts the executors. This excerpt shows startup; the complete Provider includes imports, field declarations and cleanup on failure:

```ts
const executors = this.app.container.resolve(jobExecutorServiceToken);
const reports = this.app.container.resolve(reportJobsToken);
const config = this.app.config.get<ReportsConfig>('reports')!;
const ReportJob = createReportJob((payload, context) =>
  generateReport(this.app.paths.storage('reports'), payload, context),
);

this.jobs = executors.getJobExecutor('app.reports');
this.schedules = executors.getScheduleExecutor('app.reports.schedule');
this.unsubscribe = this.jobs.subscribe((event) => reports.record(event));

this.jobs.registerJob(ReportJob);
await this.jobs.setup({ consume: config.consume });
reports.attach(this.jobs, ReportJob, this.schedules);
if (config.schedule) await reports.schedule(config.schedule);
await this.schedules.setup({ consume: config.consume });
```

The `reports` configuration uses `consume: true` by default. Register ordinary jobs before `setup()`, then accept submissions, so workers can handle tasks left from earlier runs. A producer-only process can use `setup({ consume: false })`. The first `setup()` fixes the consumption mode; later calls do not switch it. The producer-only case in `pnpm test` shows a new consumer executing work after the producer shuts down; [view the test](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/tests/reports.test.ts).

`app.reports` is the executor's business scope. Keep the application namespace, scope and job type names stable so upgrades can find existing work.

In a default-template app, append `ReportsProvider` to the existing `server/providers/index.ts` array and add the `reports` configuration it reads. Use the template's Jobs service and preserve existing Providers, including `SubmissionProvider`. Template beta.85 already registers hourly expired-receipt cleanup; do not add it again. See [Server-side services](server-business-services.md) for general Provider usage.

[Complete Provider](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/providers/reports.ts) · [Example application entry](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/app.ts)

### Submit a job and observe progress

In `server/reports/service.ts`, `ReportJobs.enqueue()` prepares and validates the payload, then submits it through `addJob()`:

```ts
const payload: ReportPayload = {
  reportId,
  stepMs: 30,
  failure: 'none',
  ...options,
};
validatePayload(payload);
if (!this.jobs || !this.ReportJob)
  throw new Error('Report jobs are not ready.');
return this.jobs.addJob(new this.ReportJob(payload));
```

The Provider supplies `this.jobs` and `this.ReportJob` through `attach()` after startup. The command then resolves this service:

```ts
const reports = app.container.resolve(reportJobsToken);
const receipt = await reports.enqueue('order-summary');
console.log('Accepted:', receipt.jobId);
```

Each `addJob()` call receives a new job ID. Reusing a `reportId` does not make the executor deduplicate submissions.

The receipt contains `jobId`, `jobName` and `enqueuedAt`. It acknowledges backend acceptance only. An HTTP entry point can return `202` and the job ID, but it must check authentication, authorization and input itself. Background jobs do not inherit a browser identity: user jobs need a trusted actor and an explicit authorization scope at execution time. The example commands run as the local operator and expose no HTTP interface.

Run `pnpm demo manual`. It prints an accepted job ID and, after completion, the CSV contents. The file is at `storage/reports/order-summary.csv` below the directory printed by the command:

```csv
orderId,customer,total
ORD-1001,Cedar Books,120
ORD-1002,Harbor Supply,75
ORD-1003,Maple Market,210
```

[Submission service](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/service.ts) · [Command entry](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/scripts/demo.ts)

The generator reports progress from 0 to 100 through its execution context. After processing each order, it calls:

```ts
await context.reportProgress((index + 1) * 30);
```

It reports `100` after publishing the file. The Provider subscribes before consumption starts:

```ts
this.unsubscribe = this.jobs.subscribe((event) => reports.record(event));
```

`JobStart`, `JobProgress`, `JobEnd` and `JobError` describe attempts executed by the current instance. Correlate a task by `jobId` and distinguish starts by `attempt`. A `JobError` may be followed by a retry, with progress starting over.

`pnpm demo manual` prints these execution events:

```text
JobStart attempt=1
JobProgress attempt=1 progress=30
JobProgress attempt=1 progress=60
JobProgress attempt=1 progress=90
JobProgress attempt=1 progress=100
JobEnd attempt=1
```

The example keeps events in a bounded in-memory array for command output; restarting clears it. Persist business records when you need status across instances or execution history. Neither the event array nor a progress percentage is a durable business result.

[Progress reporting](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts) · [Event recording](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/service.ts)

## Configure scheduled execution

### Run at a fixed interval

`ScheduleExecutor.addJob()` registers a handler and rule under a stable name. This is `ReportJobs.schedule()` in `server/reports/service.ts`: `scheduleName` is fixed at `order-summary`, and `ScheduleJobOption` is imported from `@nocobase/jobs`.

```ts
async schedule(options: ScheduleJobOption) {
  if (!this.schedules) throw new Error('Report schedules are not ready.');
  return this.schedules.addJob({
    name: scheduleName,
    options,
    payload: {},
    execute: async ({ scheduledAt, signal }) => {
      signal.throwIfAborted();
      await this.enqueue(`scheduled-${scheduledAt.getTime()}`);
    },
  });
}
```

The Provider declares the rule before calling the schedule executor's `setup()`. Startup writes the rule before consumption begins. `scheduledAt` is the planned firing time; actual execution may start later. The example includes it in the report ID so repeated submissions for that planned time produce the same business result.

Pass `every`, in milliseconds, for an interval:

```ts
await reports.schedule({ every: 200, limit: 2 });
```

Run `pnpm demo interval`. The rule fires twice, generates two reports and prints `Completed reports: 2`. `limit` restricts planned firings, not ordinary-job retry attempts.

A successful schedule handler only means the report was submitted; report generation can fail later. The command counts a report only after its job finishes. A short periodic operation can call a business service directly from its schedule handler without submitting another job.

[Rule and handler source](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/service.ts)

### Run with Cron and a timezone

To generate a report daily at 02:00 in a chosen timezone:

```ts
await reports.schedule({ cron: '0 2 * * *', tz: 'Asia/Shanghai' });
```

Replace the timezone with your business's IANA timezone. Omitting it uses UTC, not the server's local timezone. Cron accepts five or six fields and cannot be combined with `every`.

Run `pnpm demo cron` to execute the accelerated rule `{ cron: '*/1 * * * * *', tz: 'UTC', limit: 2 }` twice. `pnpm demo rules` registers the daily rule and displays its next planned time without waiting until the following day.

[Both Cron demonstrations](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/scripts/demo.ts)

### Update and remove rules

Call `addJob()` again with the same name to update a rule. Unchanged definitions retain their existing plan. Renaming leaves the old rule behind, so migrate or remove it explicitly.

`ReportJobs` queries and removes the rule through the executor's public API, using the same `scheduleName`:

```ts
async getSchedule() {
  if (!this.schedules) throw new Error('Report schedules are not ready.');
  return this.schedules.getJob(scheduleName);
}

async removeSchedule() {
  if (!this.schedules) throw new Error('Report schedules are not ready.');
  return this.schedules.removeJob(scheduleName);
}
```

The service calls the schedule executor's `getJob('order-summary')` and `removeJob('order-summary')`. Run `pnpm demo rules` to create an interval rule, update it to a daily Cron rule, print `nextRunAt` and remove it. The removal receipt says `Job removed`; the subsequent lookup returns `undefined`.

`removeJob()` deletes the rule and its pending firing while keeping the handler registered in this process. Use `shutdown()` when the application exits; do not remove rules on every shutdown. Register handlers again on restart because stored rules do not contain executable code.

[Rule management methods](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/service.ts)

## Handle failures and repeated execution

`attempts` comes from the executor's selected `jobs` configuration. It defaults to `1`, including the first execution. The example sets this in `server/config.ts`:

```ts
import type { AppJobsConfig } from '@nocobase/app-server/jobs';

export const jobs: AppJobsConfig = {
  default: 'memory',
  memory: { adapter: 'memory', concurrency: 1, attempts: 3 },
};
```

This allows up to three attempts for ordinary failures. `concurrency` applies per executor worker, not across the whole deployment. In a default-template app, add these values to the existing `server/config/jobs.ts` or deployment configuration.

Trigger a first-attempt failure with the demonstration option:

```ts
await reports.enqueue('order-summary', { failure: 'first', stepMs: 30 });
```

The generator reads `context.attempt` and throws after processing the first order on attempt 1. With `failure: 'always'`, it throws on every attempt.

- `pnpm demo retry`: attempt 1 fails at 30%; attempt 2 regenerates the report and completes.
- `pnpm demo failure`: all attempts fail, producing three `JobError` events and no CSV. The command exits successfully after verifying this expected failure.

`context.attempt` counts execution starts, including recovery. It is not the number of ordinary failures spent against the budget.

[Retry configuration](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/config.ts) · [Failure controls](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts)

Retries, recovery and repeated submissions can repeat business effects. Make the operation idempotent: generating the same report again should still leave one result. The example writes a complete temporary file, then atomically creates the destination CSV through a hard link. An existing file for the same `reportId` remains unchanged.

See the source link below for the file publication implementation. Database writes, inventory deductions and external calls need their own transactions, unique constraints or idempotency keys. One report ID identifies one data snapshot; use a new ID when the data scope changes.

Run `pnpm demo repeat`. Two submissions receive different job IDs but leave one unchanged CSV. Business database writes and job submission also do not share a transaction. Work that must not be lost needs a persistent pending-delivery record and recovery logic; see [Server-side services](server-business-services.md).

[Complete file publication logic](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts)

## Shut down executors and recover jobs

Stop recurring triggers first, stop accepting submissions, then shut down the ordinary executor. Keep the event subscription until shutdown finishes so it can receive the final interruption event:

```ts
override async shutdown(): Promise<void> {
  try {
    await this.schedules?.shutdown();
  } finally {
    this.app.container.resolve(reportJobsToken).stopAccepting();
    try {
      await this.jobs?.shutdown();
    } finally {
      this.unsubscribe?.();
    }
  }
}
```

`shutdown()` aborts running jobs' signals and waits for handlers to exit; it cannot forcibly terminate business code. Break long operations into batches, check `signal` and pass it to operations that support cancellation.

For unfinished work, call `signal.throwIfAborted()` after cancellation, or throw `JobInterruptedError` while the signal is aborted. An ordinary job can then be retained for recovery without spending its normal failure budget. A successful handler return still completes the job. Do not declare an interruption after committing the complete business effect.

The example simulates slow work with an abortable delay. It converts Node's timer `AbortError` to `signal.reason` so the executor recognizes an interruption rather than an ordinary failure.

Run `pnpm demo recovery`. After the first progress event, the command shuts down the App and constructs a new App using the same storage directory. Its output includes:

```text
Interrupted during shutdown; reopening the same storage.
JobEnd, attempt 2
```

The same job ID generates the report on attempt 2, restarting progress from the beginning. This verifies graceful recovery, not recovery after a killed process or machine failure.

[Shutdown logic](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/providers/reports.ts) · [Cancellation handling](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/reports/generate.ts)

## Configure the execution backend

### Single-process memory

Jobs core includes memory. When no configuration is selected and there is no `jobs.default`, it uses built-in memory as well. Set `jobs.default: memory` to make this deployment choice explicit.

Memory reads state at startup, changes it in memory during execution and writes it under `storage/jobs/` on graceful shutdown. A forced exit can lose new work or replay old work at the next start. Multiple processes cannot use it to distribute jobs and should not write the same state file concurrently.

Each demo creates an isolated storage directory. Only the recovery demo reopens that directory after shutdown. [Configuration and paths](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/server/app.ts)

### Commercial Redis plugin and multiple instances

> [!NOTE]
> The Redis execution backend is provided by the commercial `@nocobase/app-plugin-jobs-redis` plugin. Basic jobs, schedules and this page's memory example do not require it.

Before using Redis, obtain authorized plugin access, install and register its Server plugin on every producer and consumer, then define and select a Jobs configuration with `adapter: redis`. Configure connection and retention options according to the installed plugin version's instructions.

Setting only `jobs.default: redis` or a connection address is insufficient. Jobs core no longer bundles Redis. Selecting an unregistered implementation throws `JobsBackendNotRegisteredError` without falling back to memory. When upgrading an older app, explicitly retain `adapter: redis` along with the existing connection, namespace and scope.

Verify multi-instance consumption and failure recovery against the actual Redis deployment; memory results cannot establish that behavior. Redis still requires idempotent business effects. See the [Jobs source guide for this revision](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/jobs/README.md) for the backend integration contract.

## Example source and setup

[Complete example and verification notes](https://github.com/nocobase/docs-examples-v3/tree/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks). Use Node.js 24 and pnpm 11.7.0. The lockfile pins App Server `3.0.0-beta.5`, Jobs `1.0.0-beta.5` and ServiceProvider `0.0.2-beta.2`.

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 3cfe5c53612d783d038a7b2a46c7b05fda1e1c26
cd apps/background-tasks
pnpm install --frozen-lockfile
pnpm demo manual
```

Run all `pnpm demo` and verification commands from `apps/background-tasks`. Use the command in each section to run another scenario. Each command prints its isolated result directory and shuts down the App before exiting. No web server is needed.

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

The example uses a real NocoBase Application and requires an output filesystem that supports hard links. `pnpm build` compiles TypeScript rather than producing a deployment archive. The [example README](https://github.com/nocobase/docs-examples-v3/blob/3cfe5c53612d783d038a7b2a46c7b05fda1e1c26/apps/background-tasks/README.md) maps each usage to its source, command and verification.
