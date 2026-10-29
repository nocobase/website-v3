---
title: Background jobs and executors
description: Define a plugin announcement-summary job, obtain an executor from the App and register, enqueue and release owned resources.
---

This article generates announcement summaries asynchronously, connecting `server/jobs/`, a Provider and the App's Jobs service. The example takes the first 80 Unicode code points and logs them. It uses no AI or database and provides no task-management page. Replace the logging callback with a business service when durable results are needed.

Shared contracts and backends are covered in [Background jobs and executors](../framework/background/jobs.md), and periodic rules in [Scheduling](../framework/background/scheduling.md). A plugin directory does not register jobs automatically; the App chooses the backend.

## Prerequisites and files

Use the existing Server entry of `@nocobase/app-plugin-announcements`. The App must provide `jobExecutorServiceToken` and `loggingToken`, as the default template does. Client code, databases and the preceding preview service are not prerequisites.

A new plugin can select `server.jobs`. Add these files and declarations to an existing plugin, preserving Server contributions. Check dependencies on `@nocobase/jobs`, `@nocobase/app-server` and `@nocobase/service-provider`, retaining scaffold classifications and compatible versions. Paths are relative to the plugin root.

## Use an Agent

```prompt
Add an asynchronous announcement-summary job that logs the first 80 Unicode code points.
Obtain a package-scoped executor from the host Jobs service and register the job
class before starting consumption. Expose enqueue, rejecting submissions before
startup and after shutdown. Use JSON text payloads. Await owned-executor shutdown
without closing host Jobs or logging services. Verify real memory execution,
retry, cancellation and cleanup after failed startup.
```

## Define the job

Add `server/jobs/summary.ts`:

```ts
import { Job, type JobClass, type JobExecutionContext } from '@nocobase/jobs';

export interface SummaryPayload { readonly text: string; }
export type WriteSummary = (summary: string, signal: AbortSignal) => Promise<void>;

export function createSummaryJob(writeSummary: WriteSummary): JobClass<SummaryPayload> {
  return class SummaryJob extends Job<SummaryPayload> {
    public static readonly jobName: string = '@nocobase/app-plugin-announcements/summary';
    public async execute(context: JobExecutionContext): Promise<void> {
      context.signal.throwIfAborted();
      const summary = Array.from(this.payload.text.trim()).slice(0, 80).join('');
      await writeSummary(summary, context.signal);
      await context.reportProgress(100);
    }
  };
}
```

The job constructor accepts only persistable JSON payloads. Bind business dependencies through the factory closure, not the payload. Keep the task-type name stable across file or class renames so every consumer recognizes queued work.

This example carries short text. For business records, usually carry an ID and have the execution service re-read data and check authorization and version. Pass cancellation to slow operations. Retries may repeat an operation, so business writes must remain idempotent.

## Register the executor and submission service

Add or merge `server/jobs/provider.ts`:

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import type { JobClass, JobExecutor, JobReceipt } from '@nocobase/jobs';
import { createServiceToken, ServiceProvider, type ServiceContainer, type ServiceToken } from '@nocobase/service-provider';
import { createSummaryJob, type SummaryPayload } from './summary.js';

export interface AnnouncementSummaryJobs {
  enqueue(text: string): Promise<JobReceipt>;
}
export const announcementSummaryJobsToken: ServiceToken<AnnouncementSummaryJobs> =
  createServiceToken<AnnouncementSummaryJobs>('@nocobase/app-plugin-announcements/summary-jobs');

export interface AnnouncementJobsApplication { readonly container: ServiceContainer; }
export class AnnouncementJobsProvider extends ServiceProvider<AnnouncementJobsApplication> {
  public readonly name: string = '@nocobase/app-plugin-announcements/jobs';
  private executor: JobExecutor | undefined;
  private SummaryJob: JobClass<SummaryPayload> | undefined;
  private accepting: boolean = false;

  public override register(): void {
    this.app.container.singleton(announcementSummaryJobsToken, () => ({
      enqueue: async (text: string): Promise<JobReceipt> => {
        if (!this.accepting || !this.executor || !this.SummaryJob) {
          throw new Error('Announcement jobs are not ready.');
        }
        if (!text.trim() || text.length > 2000) throw new Error('Invalid announcement text.');
        return this.executor.addJob(new this.SummaryJob({ text }));
      },
    }));
  }
  public override async start(): Promise<void> {
    const logger = this.app.container.resolve(loggingToken).getLogger('announcements');
    const service = this.app.container.resolve(jobExecutorServiceToken);
    this.SummaryJob = createSummaryJob(async (summary, signal) => {
      signal.throwIfAborted();
      logger.info({ summary }, 'Announcement summary generated');
    });
    this.executor = service.getJobExecutor('@nocobase/app-plugin-announcements');
    this.executor.registerJob(this.SummaryJob);
    await this.executor.setup();
    this.accepting = true;
  }
  public override async shutdown(): Promise<void> {
    this.accepting = false;
    const executor = this.executor;
    this.executor = undefined;
    this.SummaryJob = undefined;
    await executor?.shutdown();
  }
}
```

The Provider exposes submission in `register()` and resolves host services, registers the job class and starts its executor in `start()`. Register all classes this consumer needs before `setup()`. Store the executor reference before startup so cleanup can find it even if startup fails; accept submissions only after setup succeeds.

Shutdown first stops new submissions, then awaits the owned executor's `shutdown()`. Do not close the host's entire Jobs or Logging service from a plugin. The callback only logs; replace it with business behavior supporting retries, cancellation and idempotency for production use.

## Contribute the Server Provider

Import `AnnouncementJobsProvider` in the existing `server/plugin.ts` and add it to `serviceProviders`. With an existing business-Provider array, use this field while preserving routes, locales, database resources and other fields:

```ts
serviceProviders: [...serviceProviders, AnnouncementJobsProvider],
```

If `server/providers/index.ts` already aggregates the Jobs Provider, do not append it again here. `jobs/` only organizes source; the legacy `queue.jobs` declaration does not discover these tasks.

To let Apps or other plugins submit work, preserve the default export in `server/index.ts` and add:

```ts
export { announcementSummaryJobsToken } from './jobs/provider.js';
export type { AnnouncementSummaryJobs } from './jobs/provider.js';
```

After the App registers the Server entry, a business entry that has checked identity, authorization and input calls `app.container.resolve(announcementSummaryJobsToken).enqueue(text)`. Submit after App startup, not during route-factory creation. A CLI must start the App inside `withApp()` before submitting and await the work it requires.

A receipt means backend acceptance, not summary completion. HTTP may return a receipt but must not treat it as a finished business result. Persist task records separately for queryable status. Example errors are service exceptions; HTTP and CLI entries translate them to their own error contracts rather than returning stack traces.

## Backends, retries and delivery

The host owns `jobs` configuration. Default memory execution suits single-process development; orderly-shutdown persistence does not guarantee crash recovery. Multi-process deployments need a shared backend and the same job implementation registered in every consumer. A plugin should not replace global application configuration for its own task.

Retries do not make external effects idempotent. Repeated logs are acceptable here; durable summaries need business IDs, versions or uniqueness constraints to prevent duplicate results. Database commit and enqueue are not one transaction. See [Background jobs and scheduled execution](../developing-apps/background-tasks.md) for reliable delivery considerations. Periodic triggering is optional; use [Scheduling](../framework/background/scheduling.md) instead of adding another timer in this tutorial.

Job code enters the plugin artifact with the Server build. Preserve `jobName` and executor scope while queued work still depends on them, and define compatibility for older payloads. Do not rename these identities merely because a file or display name changes.

## Verify execution and cleanup

Keep the scaffold's Node test environment and use a real memory executor. This `tests/server/jobs.test.ts` stores state in a temporary directory and observes the logging callback. Declare the directly imported `@nocobase/logging` as a compatible development dependency:

```ts
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import { createJobExecutorService } from '@nocobase/jobs';
import { createLogging } from '@nocobase/logging';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it, vi } from 'vitest';
import { AnnouncementJobsProvider, announcementSummaryJobsToken } from '../../server/jobs/provider.js';

it('runs accepted jobs and stops accepting after shutdown', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'announcement-jobs-'));
  const jobs = createJobExecutorService(undefined, { appName: 'test', storagePath: directory });
  const logging = createLogging();
  const log = vi.spyOn(logging.getLogger('announcements'), 'info').mockImplementation(() => {});
  const container = new ServiceContainer();
  container.instance(jobExecutorServiceToken, jobs);
  container.instance(loggingToken, logging);
  const provider = new AnnouncementJobsProvider({ container });
  provider.register();
  const submit = container.resolve(announcementSummaryJobsToken);
  try {
    await expect(submit.enqueue('Hello')).rejects.toThrow('not ready');
    await provider.start();
    const receipt = await submit.enqueue('  Hello 👋  ');
    expect(receipt.jobName).toBe('@nocobase/app-plugin-announcements/summary');
    await vi.waitFor(() => expect(log).toHaveBeenCalledWith(
      { summary: 'Hello 👋' }, 'Announcement summary generated',
    ));
    await provider.shutdown();
    await expect(submit.enqueue('Hello')).rejects.toThrow('not ready');
  } finally {
    try { await provider.shutdown(); } finally {
      try { await jobs.shutdown(); } finally {
        await logging.close();
        await rm(directory, { recursive: true, force: true });
      }
    }
  }
});
```

Also cover invalid input, retries after business failures, aborted signals, setup failures and whole-App shutdown order. After replacing logging with a business service, verify repeated business IDs do not create duplicate results. Memory tests do not establish Redis, multi-process or deployment recovery behavior.

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

Finally submit text from an authorized entry in the target App, check its receipt and log, and verify shutdown leaves no tasks accessing released resources.
