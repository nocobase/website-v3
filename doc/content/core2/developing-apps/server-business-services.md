---
title: Server business services
description: Organize the application's business rules, register dependencies through a ServiceProvider, and reuse them from HTTP, commands and jobs.
---

The responsibilities are clearly divided: a business service owns the business rules of an operation, a route turns an HTTP request into a call to the service, and a Provider assembles dependencies. Keep simple calculations as functions; extract a service class when several entry points reuse the same logic, or when an operation needs the database, transactions and other services.

## How to organize the files

`server/providers/` is the template's existing registration entry, and business classes can sit next to their Providers. As the application grows, you can create `server/services/` and move implementations there, while Providers stay in `server/providers/`. Directories are never scanned or registered automatically; what actually connects a service is its import path and `server/providers/index.ts`.

This guide keeps the project example's original `server/providers/tutorial-project-service.ts`, so it can be read together with the database and page guides.

## Prerequisites

The projects-and-tasks example stays on default template `1.0.0-beta.78` and uses the `tutorialTasks` and `tutorialProjects` tables. Before running it, follow [Create tables and initialize data](data-models-and-migrations.md#prepare-the-example-application) to prepare a separate application, which includes access to the private `nocobase/app-tutorials` repository; it cannot be run directly after the current getting-started `tasks` example. Without access to that repository, you can still read the code and the explanation of responsibilities.

## Write the business service

Create `server/providers/tutorial-project-service.ts`. The complete code is below; expand it to copy:

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

`list()` first restricts the readable records with `withPolicy()`, then pages, sorts and counts them. The sort includes the unique `id`, so paging stays stable when several projects share a creation time. It returns only explicitly selected fields and converts times to ISO strings.

`create()` has the server generate the ID and creation time; the caller provides only the name. Creating a project gives the creator no new permissions; whether they can query it afterwards still depends on the view permission and data scope configured in their roles.

`assignTask()` reads the task, checks the target project and then updates the task, all in one transaction. Each kind of record uses its own policy: being able to change a task does not mean being able to choose any project, and being able to see a project in the project list does not mean being able to choose it in this action. Clearing the association does not look up a target project, but still requires the action permission for changing project assignments and the task scope.

`ProjectUnavailableError` and `TaskUnavailableError`, thrown by the service, are business errors that the route later converts into API errors. Errors produced by Repository itself, such as permission errors or missing records, are left to the framework; there is no need to catch every exception and turn it into "success" or "invalid argument".

## Register and call the service

Declare the dependency contract with `createServiceToken<TutorialProjectService>()`, and register the factory with `container.singleton()` in `ServiceProvider.register()`. The factory obtains the application database from `databaseManagerToken`, and routes resolve the service through the same Token. The complete `server/providers/tutorial-projects.ts` and its entry registration are in [Authentication, permissions and data scopes](authentication-and-permissions.md). That Provider also declares this example's business actions, so do not copy only the service registration and miss the authorization configuration.

Each of the Provider's three lifecycle methods has its own job: `register()` describes how dependencies are created, `boot()` handles work that needs other services to be ready, and `shutdown()` releases executors or subscriptions the Provider created itself. Using the database service does not mean owning the database connection's lifecycle, so never close the shared database. For the full mechanism, see [ServiceProviders and service lifecycle](../extension-development/service-provider.md) and [Service containers](../framework/services/container.md).

In newer default templates, `server/providers/index.ts` also contains `SubmissionProvider`; keep it when appending your own Provider. It handles the idempotency configuration and receipt cleanup for Repository writes, and is not a placeholder for a business example to replace.

## Pass request state as arguments

A singleton service is shared by many requests, so never store the current user, permission policy, transaction connection or request input in its fields. The example passes `RepositoryPolicy` and the validated input as method arguments; the policy must come from a trusted authorization result, never directly from an object submitted by the client.

Identity and policy are obtained by the HTTP route. CLI commands, jobs and scheduled runs have no browser request, so they must define their own executing identity and allowed data scope. Reusing a service neither inherits the original request's identity nor makes the caller an administrator. When a job runs later, also decide whether permissions are checked again at execution time.

## Transactions and external effects

`assignTask()` reads and updates through the connection provided by the transaction callback. Do not mix Repositories from outside the transaction into the callback, and do not store the transaction connection in a singleton's fields.

The transaction makes this group of database operations commit or roll back together, but the example does not implement a version precondition. When two people change the same task one after another, the later successful write overwrites the earlier one. If you need conflict protection, add and verify a version condition separately; see [Transactions and data consistency](transactions-and-consistency.md).

External effects such as sending mail or submitting jobs do not roll back with the database. The usual approach is to commit first and then trigger the external effect; if delivery must eventually happen once the change is committed, persist a pending-delivery record together with the business change and design a recovery process. For connecting background work, see [Background jobs and scheduled execution](background-tasks.md).

## Verify

- The list and its total use the same policy, and paging returns only permitted fields.
- When the target project may not be chosen, the task's existing association stays unchanged.
- When different requests pass different policies, the service does not share user state between them.
- Calls from CLI commands or jobs follow their own executing identity and data scope.

Besides rule tests, verify transactions and data scopes with a real database and permission services; the project example's complete endpoint tests are in [Routes and HTTP APIs](apis-and-services.md).
