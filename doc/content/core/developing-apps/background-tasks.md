---
title: Background jobs and scheduled execution
description: Register application jobs and schedules, reuse business services and manage executor startup, submission and shutdown.
---

Move slow work into background jobs and declare recurring cleanup or summaries as schedules. This runnable example follows default template `1.0.0-beta.84` and does not depend on the historical project tutorial.

## Choose an execution model

| Need | Approach |
| --- | --- |
| The current request needs the business result immediately | Call the service directly |
| The request can submit work for later completion | `JobExecutor` and `Job` |
| Application code defines daily or interval execution | `ScheduleExecutor` |
| Administrators need rule management and execution history | Integrate the scheduler plugin |

Resolve executors through `jobExecutorServiceToken` from `@nocobase/app-server/jobs`. `@nocobase/jobs` supplies the contracts. Lower-level messaging is separate; see [Queues](../framework/background/queues.md).

## Define the job

Create `server/jobs/report-job.ts`. The optional `jobs/` directory organizes application code; the template does not automatically scan it:

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

Job constructors accept only persistable JSON payloads. Bind dependencies through the factory rather than putting connections, containers, functions or request objects into payloads. `jobName` is a stable type name; every consumer process must register its implementation before consumption starts.

`generateReport` provides business behavior using a report ID and cancellation signal; it can call a [server-side service](server-business-services.md). The Provider below binds logging to demonstrate execution. It does not generate report files.

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

Add the Provider to `server/providers/index.ts`, preserving existing registrations:

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

The default `SubmissionProvider` already configures Repository write idempotency and an hourly expired-receipt cleanup schedule. Keep it; do not register a second copy of that cleanup rule.

## Submit from a business entry point

After application startup and entry-point authentication/authorization, resolve the token from the same container and call `await app.container.resolve(reportJobsToken).enqueue(reportId)`. Validate `reportId` first. An endpoint may return `202` and the job ID, but the receipt means accepted, not completed. Persist history or completion state separately; local events are not shared state across instances.

The example submits a job at 02:00 in Shanghai each day. Schedule success means submission succeeded; report generation can fail later. Correlate the firing, job ID and business result when displaying status. Short periodic work can call a service directly from `execute()` without another queued job.

## Scheduling, retries and consistency

- Choose either `cron` or `every`; `every` uses milliseconds. Specify `tz` for Cron.
- Keep scopes, job types and rule names stable. Update existing names; renaming does not remove old rules. Use `shutdown()` when stopping and `removeJob()` for intentional rule deletion.
- Retries can repeat execution. The report ID can support business deduplication, but executors do not automatically deduplicate by it. The actual report service must implement idempotency.
- Database changes and submission are not one transaction. Persist pending deliveries and provide recovery when reliability requires it; see [Server-side services](server-business-services.md).
- Background work has no browser identity. Define system or user task scopes explicitly rather than trusting client-supplied policies in payloads.

Without `jobs.default`, the template uses a single-process memory executor and writes state under `storage/jobs/` on normal shutdown. This does not guarantee crash recovery or distribute work across instances. Configure a shared backend for multiple instances. See [Background jobs and executors](../framework/background/jobs.md) and [Scheduled execution](../framework/background/scheduling.md) for configuration and retries. `jobs` and the lower-level `queue` have separate configuration.

## Verify

1. Start the app with existing Providers preserved and no duplicate job registration.
2. Submit a test ID from an authorized entry point. Check the receipt and matching `Report job executed` log.
3. In an isolated test environment, temporarily replace Cron and timezone with `every: 1000` to verify scheduled submission, then restore the daily rule.
4. Make the business function fail or honor cancellation. Verify failures, retries and shutdown; repeated business IDs must not produce duplicate results.
5. Verify multi-process consumption and recovery against the deployment backend; memory tests cannot establish that behavior.

Test business rules by invoking `ReportJob.execute()` directly, and use real executors for submission, consumption, schedules and shutdown.
