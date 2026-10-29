---
title: Background jobs and scheduled execution
description: Register background jobs and recurring rules in an application, reuse business services, and manage how executors start, accept work and shut down.
---

Slow operations can be handed to background jobs, and recurring cleanup or summaries can be declared in code as scheduled execution. This guide builds a runnable job example on the server entries of default template `1.0.0-beta.84`; it does not depend on the historical project tutorial.

## Choose how the work runs

| Need | Approach |
| --- | --- |
| The current request needs the business result right away | Call the service directly |
| The request only submits work, which may finish later | `JobExecutor` and `Job` |
| Application code declares daily or fixed-interval runs | `ScheduleExecutor` |
| Administrators need to create, enable and disable rules and view execution records | Integrate the scheduled tasks plugin |

Executors are provided by `jobExecutorServiceToken` from `@nocobase/app-server/jobs`, and `@nocobase/jobs` provides the job contracts. Lower-level message queues are a separate capability; see [Message queues](../framework/background/queues.md).

## Define the job

Create `server/jobs/report-job.ts` as needed. `jobs/` is the application's own organizational directory, not an entry the default template scans automatically:

```ts
import { Job, type JobExecutionContext } from '@nocobase/jobs';

export type GenerateReport = (
  reportId: string,
  signal: AbortSignal,
) => Promise<void>;

export function createReportJob(generateReport: GenerateReport) {
  return class ReportJob extends Job<{ reportId: string }> {
    static readonly jobName: string = 'reports.generate';

    async execute(context: JobExecutionContext): Promise<void> {
      context.signal.throwIfAborted();
      await generateReport(this.payload.reportId, context.signal);
      await context.reportProgress(100);
    }
  };
}
```

A job's constructor only receives a JSON payload that can be persisted. Dependencies are bound through the factory function; never put database connections, the service container, functions or request objects into the payload. `jobName` is a stable job type name, and every consuming process must register an implementation under the same name before it starts consuming.

`generateReport` is the actual business implementation; it receives the business ID and a cancellation signal and can call a [server business service](server-business-services.md). Below, it is first bound to a log line to verify the execution path; it does not actually generate a report file.

## Start and stop in a Provider

Create `server/providers/reports.ts`:

```ts
import type { Application } from '@nocobase/app-server/application';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import type { JobExecutor, JobReceipt, ScheduleExecutor } from '@nocobase/jobs';
import { createServiceToken, ServiceProvider } from '@nocobase/service-provider';
import { createReportJob } from '../jobs/report-job.js';

export interface ReportJobs {
  enqueue(reportId: string): Promise<JobReceipt>;
}
export const reportJobsToken = createServiceToken<ReportJobs>('app/report-jobs');

export default class ReportsProvider extends ServiceProvider<Application> {
  readonly name = 'app/reports';
  private jobs?: JobExecutor;
  private schedule?: ScheduleExecutor;
  private ReportJob?: ReturnType<typeof createReportJob>;
  private acceptingJobs = false;

  override register(): void {
    this.app.container.singleton(reportJobsToken, () => ({
      enqueue: async (reportId: string) => {
        if (!this.acceptingJobs || !this.jobs || !this.ReportJob) {
          throw new Error('Report jobs are not ready.');
        }
        return this.jobs.addJob(new this.ReportJob({ reportId }));
      },
    }));
  }

  override async boot(): Promise<void> {
    const executors = this.app.container.resolve(jobExecutorServiceToken);
    const logger = this.app.container.resolve(loggingToken).getLogger('reports');
    this.ReportJob = createReportJob(async (reportId, signal) => {
      signal.throwIfAborted();
      // Runnable demonstration: replace this log with your report service.
      logger.info({ reportId }, 'Report job executed');
    });
    this.jobs = executors.getJobExecutor('app.reports');
    this.jobs.registerJob(this.ReportJob);
    await this.jobs.setup();
    this.acceptingJobs = true;

    this.schedule = executors.getScheduleExecutor('app.reports.schedule');
    await this.schedule.addJob({
      name: 'daily-report',
      options: { cron: '0 2 * * *', tz: 'Asia/Shanghai' },
      payload: {},
      execute: async ({ scheduledAt, signal }) => {
        signal.throwIfAborted();
        await this.app.container.resolve(reportJobsToken)
          .enqueue(`daily-${scheduledAt.toISOString()}`);
      },
    });
    await this.schedule.setup();
  }

  override async shutdown(): Promise<void> {
    try {
      await this.schedule?.shutdown();
    } finally {
      this.acceptingJobs = false;
      await this.jobs?.shutdown();
    }
  }
}
```

Add the Provider to `server/providers/index.ts`, keeping the existing registrations:

```ts
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';
import SubmissionProvider from './submission.js';
import ReportsProvider from './reports.js';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  SubmissionProvider,
  // Keep any other Providers already registered by your application.
  ReportsProvider,
];
export default serviceProviders;
```

The default template's `SubmissionProvider` already configures idempotency for Repository writes and registers an hourly recurring job that cleans up expired receipts. Adding business jobs does not mean replacing it, and do not register a second copy of the same cleanup rule.

## Submit work from a business entry

Once the application has started and the entry point has finished its identity and permission checks, resolve `reportJobsToken` from the same container and call `await app.container.resolve(reportJobsToken).enqueue(reportId)`. Validate `reportId` first. The API may return `202` with the job ID, but that receipt only means the job was accepted, not that the business work succeeded; the job's history or completion state must be persisted separately, and local events cannot serve as state shared across instances.

The recurring rule in this example submits one job every day at 02:00 Shanghai time. A successful run of the rule only means the submission succeeded; generating the report may still fail later. If you need to show results, link the scheduled firing, the job ID and the business outcome together. If the recurring work itself is short, you can also call the business service directly in `execute()` instead of submitting another job.

## Schedules, retries and data consistency

- Use either `cron` or `every`, not both; `every` is in milliseconds. With Cron, always state `tz` explicitly.
- Keep scopes, job types and rule names stable. When changing a rule, keep its name; renaming does not delete the old rule automatically. Call `shutdown()` when the application stops, and `removeJob()` only when the business really means to delete a rule.
- Retries can cause repeated execution. The report ID in the example can serve as the basis for business deduplication, but the executor does not deduplicate by that ID automatically; the real generation service must be idempotent itself.
- Writing data and submitting a job are not one transaction. When delivery must be reliable, persist pending-delivery records and provide recovery logic; see [Server business services](server-business-services.md).
- Background jobs have no browser request identity. Decide explicitly whether a job is a system job or a user job and what permission scope it has; never treat a permission policy supplied by the client as a trusted payload.

Without `jobs.default` configured, the template uses a single-process memory executor that writes its state to `storage/jobs/` on a normal shutdown. It cannot guarantee recovery after a crash, and it does not distribute work across instances. Multi-instance deployments should configure a shared execution backend; for configuration and retry parameters, see [Background jobs and executors](../framework/background/jobs.md) and [Periodic scheduling](../framework/background/scheduling.md). Note that the `jobs` configuration here is separate from the lower-level `queue` configuration.

## Verify

1. Start the application and confirm that all existing Providers are kept and the new job is not registered twice.
2. Submit a test ID from an authorized entry point, and confirm you get a receipt and a `Report job executed` log line with the same ID.
3. In an isolated test environment, temporarily replace Cron and the time zone with `every: 1000` to confirm recurring submission works; after verifying, restore the daily schedule.
4. Make the business function throw or honor cancellation, and verify failure, retry and shutdown behavior; running the same business ID again must not produce duplicate business results.
5. Verify multi-process consumption and recovery on the real target backend; tests with the memory executor cannot replace deployment verification.

Tests of the business rules can call `ReportJob.execute()` directly, while submission, consumption, recurring rules and shutdown need tests with a real executor.
