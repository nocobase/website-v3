---
title: Background jobs and executors
description: Declare an announcement summary job in a plugin, get an executor through the application's Jobs service, and register, submit and clean up job resources.
---

This guide has the announcements plugin generate text summaries asynchronously, showing how `server/jobs/` works with a Provider and the application's Jobs service. The example only takes the first 80 Unicode code points of the text and writes them to the log; it uses no AI, writes no database and provides no job management page. When you need durable business results, replace the logging callback with your own business service.

For job contracts and backend mechanisms, see [Background jobs and executors](../framework/background/jobs.md); for recurring rules, see [Periodic scheduling](../framework/background/scheduling.md). The plugin's directories do not register jobs automatically, and the job backend is configured by the application.

## Prerequisites and files

The guide continues with the Server entry of the existing `@nocobase/app-plugin-announcements`. The application must provide `jobExecutorServiceToken` and `loggingToken`, which the default application template already has. This guide depends on no client code, database or the preview service from the previous guide.

When creating a new plugin you can choose `server.jobs`. An existing plugin only needs the files and declarations below, keeping its existing Server contributions. Check the dependencies on `@nocobase/jobs`, `@nocobase/app-server` and `@nocobase/service-provider`, keeping the categories and compatible versions the generator chose. Paths are relative to the plugin root.

## Use an Agent

```text
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

A job's constructor only receives a JSON payload that can be persisted; business dependencies are bound through the factory closure, not put into the payload. The job type name must stay the same even when the file or class is renamed, so every consuming process can recognize work that is already queued.

This example uses a short piece of text as the payload. When processing real business records, you usually pass only the record ID and let the executing service read the data again and check permissions and versions. The cancellation signal must be passed all the way to slow business operations; executor retries may cause the same operation to happen again, so business writes must still be idempotent.

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

The Provider exposes the submission service in `register()`, and in `start()` it resolves the host's services, registers the job class and starts the executor. Every job class the current consuming process needs must be registered before calling `setup()`. The executor reference is stored before startup, so cleanup can find it even if startup fails, and submissions are accepted only after startup succeeds.

On shutdown, first stop accepting new jobs, then wait for the owned executor's `shutdown()` to finish. Do not shut down the host's whole Jobs or Logging service from the plugin. The example's callback only writes logs; real business work should be replaced with an implementation that handles retries, cancellation and idempotency.

## Contribute the Server Provider

Import `AnnouncementJobsProvider` in the existing `server/plugin.ts` and add it to `serviceProviders`. Below is the form when a business Provider array already exists; keep the other fields such as routes, languages and database:

```ts
serviceProviders: [...serviceProviders, AnnouncementJobsProvider],
```

If this Jobs Provider is already aggregated through `server/providers/index.ts`, do not append it here again. `jobs/` is only a source organization directory, and jobs are not discovered through the old `queue.jobs` declaration either.

If applications or other plugins need to submit jobs, keep the default export in `server/index.ts` and add:

```ts
export { announcementSummaryJobsToken } from './jobs/provider.js';
export type { AnnouncementSummaryJobs } from './jobs/provider.js';
```

Once the application registers the plugin in `server/plugins.ts`, business entries that have finished identity, permission and input checks can call `app.container.resolve(announcementSummaryJobsToken).enqueue(text)`. Submit only after the application has started, never early while the route factory is being created; from the CLI, start the application inside `withApp()` before submitting, and wait for the required work to finish.

A receipt only means the backend accepted the job; it does not mean the summary was generated successfully. An HTTP API may return the job receipt, but must not treat it as the business being complete; when a queryable status is needed, maintain a separate durable job record. The errors in the example are service-layer exceptions; HTTP and CLI entries should convert them according to their own contracts, never returning stack traces directly.

## Backends, retries and delivery

The `jobs` configuration is decided by the host. The default memory backend suits single-process development; the state it saves on a normal shutdown does not guarantee recovery after a crash. Multi-process deployments need a shared backend, with an implementation of the same name registered in every consuming process. Do not let a plugin replace the application's global configuration for the sake of its own jobs.

Retries do not make external side effects idempotent automatically. Writing the log twice is acceptable in this example; when saving summaries for real, use business IDs, versions or unique constraints to control duplicate results. The database commit and the job submission are not in the same transaction either; for reliable delivery, see [Background jobs and scheduled execution](../developing-apps/background-tasks.md). Periodic triggering is an optional extension; connect it following [Periodic scheduling](../framework/background/scheduling.md), with no need to configure another timer in this guide.

Job code goes into the plugin's build output with the Server build. When upgrading, keep the `jobName` and executor scope that queued jobs still use, and define how old payloads remain compatible; never rename them just because the display name of a file or package changed.

## Verify execution and cleanup

Keep the scaffold's Node test environment and use a real memory executor. The `tests/server/jobs.test.ts` below keeps its state in a temporary directory and observes the logging callback; `@nocobase/logging`, which the test imports directly, must be declared as a compatible development dependency:

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

Also cover invalid input, retries after the business function throws, an already-cancelled signal, executor startup failure, and the shutdown order of the whole application. After replacing the logging with a real business service, also verify that running the same business ID again produces no duplicate results. Tests on the memory backend cannot prove recovery behavior with Redis, multiple processes or a real deployment.

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

Finally, submit a test text through an authorized entry in the target App, check the receipt and the log, and confirm that on shutdown no leftover jobs keep accessing resources that were already released.
