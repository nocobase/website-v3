---
title: Server business services
description: Organize business rules, register dependencies through ServiceProvider and reuse services from HTTP, commands and jobs.
---

A business service owns operation rules, a route adapts HTTP requests into calls, and a Provider assembles dependencies. Keep simple calculations as functions. Extract a service class when several entry points share logic or an operation needs databases, transactions and other services.

## Organize the files

`server/providers/` is the template's registration entry. Business classes can live beside their Providers. As the application grows, you can create `server/services/` for implementations while keeping Providers in `server/providers/`. Neither directory automatically discovers services: imports and `server/providers/index.ts` connect them.

This guide keeps `server/providers/tutorial-project-service.ts` so the project example remains compatible with the database and page guides.

## Prerequisites

The project/task example retains default template `1.0.0-beta.78` and its `tutorialTasks`/`tutorialProjects` collections. Follow [Create tables and initialize data](data-models-and-migrations.md#prepare-the-example-application) to prepare a separate app, including access to the private `nocobase/app-tutorials` repository. It does not continue the current getting-started `tasks` example. You can still read the code and responsibility boundaries without repository access.

## Write the business service

Create `server/providers/tutorial-project-service.ts`. Expand the complete implementation to copy it:

<details>
<summary>Project business service</summary>

```ts
import { randomUUID } from 'node:crypto';
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export interface ProjectView {
  id: string;
  name: string;
  createdAt: string;
}
export interface TaskProjectView {
  id: string;
  projectId: string | null;
  updatedAt: string;
}
export class ProjectUnavailableError extends Error {
  constructor() {
    super('The selected project is unavailable.');
  }
}
export class TaskUnavailableError extends Error {
  constructor() {
    super('The task is unavailable.');
  }
}
const projectView = (row: Record<string, unknown>): ProjectView => ({
  id: String(row.id),
  name: String(row.name),
  createdAt: new Date(row.createdAt as string | Date).toISOString(),
});

export class TutorialProjectService {
  constructor(private readonly database: DatabaseManager) {}

  async list(
    policy: RepositoryPolicy,
    input: { page: number; pageSize: number },
  ) {
    const projects = this.database
      .repository('tutorialProjects')
      .withPolicy(policy);
    const rows = await projects.findMany({
      select: (s) => s.fields('id', 'name', 'createdAt'),
      limit: input.pageSize,
      offset: (input.page - 1) * input.pageSize,
      sort: (s) => [s.field('createdAt').desc(), s.field('id').desc()],
    });
    return {
      data: rows.map(projectView),
      meta: { ...input, total: await projects.count() },
    };
  }

  async create(
    policy: RepositoryPolicy,
    input: { name: string },
  ): Promise<ProjectView> {
    const result = await this.database
      .repository('tutorialProjects')
      .withPolicy(policy)
      .createOne({
        select: (s) => s.fields('id', 'name', 'createdAt'),
        values: { id: randomUUID(), name: input.name, createdAt: new Date() },
      });
    return projectView(result.record);
  }

  async assignTask(
    policies: { tasks: RepositoryPolicy; projects: RepositoryPolicy },
    taskId: string,
    projectId: string | null,
  ): Promise<TaskProjectView> {
    return this.database.transaction(async (connection) => {
      const tasks = connection
        .repository('tutorialTasks')
        .withPolicy(policies.tasks);
      const task = await tasks.findOne({
        filter: { id: taskId },
        select: (s) => s.fields('id'),
      });
      if (!task) throw new TaskUnavailableError();
      if (projectId !== null) {
        const project = await connection
          .repository('tutorialProjects')
          .withPolicy(policies.projects)
          .findOne({
            filter: { id: projectId },
            select: (s) => s.fields('id'),
          });
        if (!project) throw new ProjectUnavailableError();
      }
      const result = await tasks.updateOne({
        select: (s) => s.fields('id', 'projectId', 'updatedAt'),
        filter: { id: taskId },
        values: { projectId, updatedAt: new Date() },
      });
      return {
        id: taskId,
        projectId: result.record.projectId as string | null,
        updatedAt: new Date(
          result.record.updatedAt as string | Date,
        ).toISOString(),
      };
    });
  }
}
```

</details>

`list()` uses `withPolicy()` to constrain readable records before paging, sorting and counting. The sort includes the unique `id`, keeping records with identical creation times in a stable order. The service returns explicitly selected fields and converts timestamps to ISO strings.

`create()` generates the ID and timestamp on the server; the caller provides only the name. Creating a project does not assign new permissions to its creator. Reading it afterwards still requires the configured read action and record scope.

`assignTask()` reads the task, checks the target project and updates the task in one transaction. Each collection uses its own policy. Being allowed to change a task does not grant access to every project, and being able to view a project in the list does not necessarily make it selectable for this operation. Clearing an association skips the target lookup but still requires the assignment action and task scope.

`ProjectUnavailableError` and `TaskUnavailableError` are domain errors translated by the route below. Repository's own permission and record-not-found errors are handled by the framework. Do not catch every exception and turn it into either success or invalid input.

## Register and call the service

Declare the contract with `createServiceToken<TutorialProjectService>()`, then register its factory with `container.singleton()` in `ServiceProvider.register()`. The factory resolves the application database through `databaseManagerToken`; routes resolve the service with the same token. [Authentication, permissions and data scopes](authentication-and-permissions.md) contains the complete `server/providers/tutorial-projects.ts` and entry registration. That Provider also declares business operations; copying service registration alone omits required authorization setup.

`register()` describes dependency creation, `boot()` performs work requiring ready services, and `shutdown()` releases executors or subscriptions owned by the Provider. Consuming a database does not transfer ownership of its connection lifecycle. See [ServiceProvider](../extension-development/service-provider.md) and [Service container and dependency injection](../framework/services/container.md).

Newer default templates also register `SubmissionProvider` in `server/providers/index.ts`. Preserve it when adding Providers: it configures Repository write idempotency and receipt cleanup, rather than being a placeholder for application code.

## Pass request state as arguments

Requests share singleton services. Never store the current user, policy, transaction connection or request input in service fields. The example passes `RepositoryPolicy` and validated input into each method. Policies must come from trusted authorization decisions, not client-submitted objects.

HTTP routes obtain identities and policies. CLI commands, jobs and schedules have no browser request, so define their execution identity and allowed scopes explicitly. Reusing a service neither inherits a request identity nor grants administrator access. Deferred jobs also need an explicit decision about rechecking permission at execution time.

## Transactions and external effects

`assignTask()` reads and writes through the transaction callback's connection. Do not mix outside Repositories into that callback or retain its connection in singleton fields.

The transaction commits or rolls back this database work together, but the example does not implement version preconditions. Sequential successful updates to the same task overwrite earlier values. Add and verify version conditions when conflict protection is required; see [Transactions and data consistency](transactions-and-consistency.md).

Mail and task submission do not roll back with database changes. Normally commit before triggering external effects. If committed changes must eventually be delivered, persist pending-delivery records with the business changes and provide recovery. See [Background jobs and scheduled execution](background-tasks.md).

## Verify

- Lists and totals use the same policy, and pagination returns only permitted fields.
- An ineligible project leaves the previous assignment unchanged.
- Calls with different policies do not share user state.
- Commands and jobs respect their own execution identities and scopes.

Beyond rule tests, use real databases and authorization services to verify transactions and scopes. The full project endpoint tests are linked from [Historical project API example](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/core/developing-apps/apis-and-services.md).
