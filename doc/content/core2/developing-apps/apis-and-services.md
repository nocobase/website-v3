---
title: Routes and HTTP APIs
description: Write and register application APIs, choose between Repository data endpoints and business routes, and maintain API documentation and endpoint verification.
---

Application APIs are written in `server/routes/` and registered through `server/routes/index.ts`. The application runtime mounts these declarations under the API root; having a file in the directory does not mean the endpoint is live.

This guide first explains how routes connect to the application and how Repository data endpoints work, then gives the project example's complete HTTP implementation. Business logic, input validation and permission configuration are covered in [Server business services](server-business-services.md), [Request validation and error handling](request-validation-and-errors.md) and [Authentication, permissions and data scopes](authentication-and-permissions.md).

## Where endpoints belong

| Location | Purpose |
| --- | --- |
| `server/routes/<feature>.ts` | Declare custom Hono routes with `defineApiRoutes()`, or Repository operations with `defineRepositoryApiRoutes()` |
| `server/routes/index.ts` | Collects the application's APIs; keep the existing declarations and append new ones |
| `server/runtime.ts` | The template already connects the route entry to the runtime, so adding endpoints usually needs no change here |
| `server/app.ts` | Application-level middleware and runtime assembly; see [Server runtime](../framework/runtime/server.md) for the mechanism |

Business API declarations omit `/api` and the deployment base path: `/projects`, for example, is mounted as `<APP_BASE_PATH>/api/projects`. For entries such as webhooks that really need a root-path protocol, see [Routes and request context](../framework/http/routes.md); do not change how the whole API is mounted just to shorten a path.

## Decide the boundary between endpoint and service

| Situation | Approach |
| --- | --- |
| A simple operation on a single collection | Use [Repository data APIs](../framework/http/repository-routes.md), configuring the exposed operations, policies, authentication and business input validation |
| One operation involves several kinds of record, or explicit business rules | Write a business service and let the route handle only the HTTP boundary |
| Several entry points need the same business rules | Reuse one service, and make explicit the identity, policies and validated input each entry point provides |
| The service depends on resources such as the database | Register the service in a Provider and obtain it from the container through a Token |

Changing a task's project in this example requires checking both the task and the target project, so it uses a custom route plus a business service. A service is not an internal channel that bypasses permissions: every entry point that calls it must still supply the permission policy that applies to the operation.

## Use Repository data APIs

`defineRepositoryApiRoutes()` suits standard queries or changes on a single Collection. The independent example below assumes a migration has created a `categories` table with `id` and `title` fields that may be read publicly; it does not depend on the historical project example later on. Save it as `server/routes/public-categories.ts`:

```ts
import { defineRepositoryApiRoutes } from '@nocobase/app-server/router';

export default defineRepositoryApiRoutes({
  repositories: [{
    name: 'publicCategories',
    collection: 'categories',
    actions: { findMany: { maxLimit: 50 }, findOne: {}, count: {} },
    policy: {
      read: { scope: true, fields: ['id', 'title'] },
      create: false,
      update: false,
      delete: false,
    },
  }],
});
```

Then add the declaration to `server/routes/index.ts`:

```ts
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';
import categoryRoutes from './public-categories.js';

const routes: readonly AppRouteContribution<Application>[] = [
  // Keep the application's existing route contributions here.
  categoryRoutes,
];
export default routes;
```

Clients can call it through `api.repository('publicCategories')`; over plain HTTP the paths look like `POST <APP_BASE_PATH>/api/publicCategories/findMany`, and queries use POST too. The declaration creates no database table and generates no management page.

This example explicitly allows anonymous reads and forbids every write. When real business data needs authentication, connect policies derived from identity and authorization. `actions` decides which operations are exposed, and `policy` decides which records and fields may be accessed and whether writes are allowed; you need both. For dynamic policies, idempotent Repository writes and the complete input format, see [Repository data APIs](../framework/http/repository-routes.md).

## Prepare the project example

The projects-and-tasks example stays on default template `1.0.0-beta.78` and uses the `tutorialTasks` and `tutorialProjects` tables. Before running it, follow [Create tables and initialize data](data-models-and-migrations.md#prepare-the-example-application) to prepare a separate application, which includes access to the private `nocobase/app-tutorials` repository; it cannot be run directly after the current getting-started `tasks` example. Without access to that repository, you can still read the code and the explanation of responsibilities.

First complete `TutorialProjectService` from [Server business services](server-business-services.md), then register the complete Provider, permission capabilities and roles as described in [Authentication, permissions and data scopes](authentication-and-permissions.md). The routes below use those files.

## The example's API contract

All paths below are relative to the application's API root. For an application at `/main/`, for example, the full API root is `/main/api`:

- `GET /tutorialProjects`: list, page by page, the projects the current action is allowed to see.
- `POST /tutorialProjects`: create a project and return `201` with `{ data }`.
- `PATCH /tutorialTasks/{id}/project`: change which project a task belongs to; `projectId: null` clears the association.

The project association has its own subresource endpoint and its own permission. The existing `PATCH /tutorialTasks/{id}` still only completes or reopens a task and does not accept `projectId`. Task list responses gain a `projectId` field, but they do not return project names automatically or expose project details.

## With an Agent

In the application directory, give this guide to the Agent as context, then describe the request below. The specific conventions for fields, APIs and components are in the manual steps that follow, and the Agent applies them together with the project guidance.

```text
Using the existing project data model, please provide APIs to list and create projects and change a task's project for later pages to use.

Paginate the project list. Both records and totals must include only projects the current user may view.
Changing a task's project should allow an eligible project or no project.
Being able to view a project does not necessarily allow assigning tasks to it; check the permissions for both the task and the target project.
If the project no longer exists or cannot be selected, report that it cannot be selected, preserve the old assignment and avoid disclosing inaccessible project information.

Control viewing, creation and assignment separately, without automatically granting ordinary users access.
Keep task completion and reopening unchanged; those actions must not allow project reassignment.
Follow the project's development guidance, make these business rules reusable, and document usage in the application's API documentation.

Use real test accounts and data to verify allowed and denied actions, and report the results.
Do not add project pages, approvals, notifications or background jobs yet.
```

## Declare and register the business routes

Create `server/routes/tutorial-projects.ts`:

<details>
<summary>Project API routes</summary>

```ts
import { Hono, type MiddlewareHandler } from 'hono';
import { z } from 'zod';
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  listResponse,
  defineApiRoutes,
} from '@nocobase/app-server/router';
import { describeRoute } from '@nocobase/app-server/router';
import type { RepositoryPolicy } from '@nocobase/db';
import { tutorialProjectServiceToken } from '../providers/tutorial-projects.js';
import {
  ProjectUnavailableError,
  TaskUnavailableError,
  type ProjectView,
  type TaskProjectView,
} from '../providers/tutorial-project-service.js';

const projectSchema: z.ZodType<ProjectView> = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
});
const taskProjectSchema: z.ZodType<TaskProjectView> = z.object({
  id: z.uuid(),
  projectId: z.uuid().nullable(),
  updatedAt: z.iso.datetime(),
});
const listInput = z.strictObject({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
const createInput = z.strictObject({ name: z.string().trim().min(1).max(120) });
const assignInput = z.strictObject({ projectId: z.uuid().nullable() });
type ProjectEnv = {
  Variables: AuthorizationEnv['Variables'] & {
    projectPolicy: RepositoryPolicy;
    taskPolicy: RepositoryPolicy;
  };
};

export default defineApiRoutes<Application>((app) => {
  const router = new Hono<ProjectEnv>();
  const auth = app.container.resolve(authenticationToken);
  const authz = app.container.resolve(authorizationToken);
  const service = app.container.resolve(tutorialProjectServiceToken);
  // Scope authentication to these endpoints; do not depend on another contribution.
  router.use('/tutorialProjects', auth.required(), authz.middleware());
  router.use('/tutorialTasks/:id/project', auth.required(), authz.middleware());
  router.onError((error, c) =>
    apiErrorHandler(
      error instanceof ProjectUnavailableError
        ? new ApiError({
            status: 'INVALID_ARGUMENT',
            reason: 'PROJECT_UNAVAILABLE',
            domain: 'tutorialProjects',
            message: error.message,
            fieldViolations: [
              {
                field: 'projectId',
                description: 'Choose an available project.',
              },
            ],
          })
        : error instanceof TaskUnavailableError
          ? new ApiError({
              status: 'NOT_FOUND',
              reason: 'TASK_NOT_FOUND',
              domain: 'tutorialProjects',
              message: error.message,
            })
          : error,
      c,
    ),
  );
  const permit =
    (action: 'read' | 'create' | 'assignTask'): MiddlewareHandler<ProjectEnv> =>
    async (c, next) => {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'tutorial.projects' },
        action,
      });
      const projects = decision.conditions?.database?.tutorialProjects;
      const tasks = decision.conditions?.database?.tutorialTasks;
      if (
        decision.effect === 'deny' ||
        !projects ||
        (action === 'assignTask' && !tasks)
      ) {
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          reason: 'PROJECT_ACTION_DENIED',
          domain: 'tutorialProjects',
          message: 'This project action is not allowed.',
        });
      }
      c.set('projectPolicy', projects);
      if (tasks) c.set('taskPolicy', tasks);
      await next();
    };
  router.get(
    '/tutorialProjects',
    permit('read'),
    describeRoute({
      tags: ['Tutorial projects'],
      summary: 'List projects',
      operationId: 'listTutorialProjects',
      responses: { 200: listResponse(projectSchema), ...apiErrorResponses },
    }),
    apiValidator('query', listInput),
    async (c) =>
      c.json(await service.list(c.get('projectPolicy'), c.req.valid('query'))),
  );
  router.post(
    '/tutorialProjects',
    permit('create'),
    describeRoute({
      tags: ['Tutorial projects'],
      summary: 'Create a project',
      operationId: 'createTutorialProject',
      responses: { 201: dataResponse(projectSchema), ...apiErrorResponses },
    }),
    apiValidator('json', createInput),
    async (c) =>
      c.json(
        {
          data: await service.create(
            c.get('projectPolicy'),
            c.req.valid('json'),
          ),
        },
        201,
      ),
  );
  router.patch(
    '/tutorialTasks/:id/project',
    permit('assignTask'),
    describeRoute({
      tags: ['Tutorial projects'],
      summary: 'Change a task project',
      operationId: 'assignTutorialTaskProject',
      responses: {
        200: dataResponse(taskProjectSchema),
        400: apiErrorResponse(400),
        404: apiErrorResponse(404),
        ...apiErrorResponses,
      },
    }),
    apiValidator('param', z.object({ id: z.uuid() })),
    apiValidator('json', assignInput),
    async (c) =>
      c.json({
        data: await service.assignTask(
          { tasks: c.get('taskPolicy'), projects: c.get('projectPolicy') },
          c.req.valid('param').id,
          c.req.valid('json').projectId,
        ),
      }),
  );
  return new Hono().route('/', router);
});
```

</details>

The paths omit `/api` and the deployment base path, which `defineApiRoutes()` and the application runtime add. The authentication middleware only covers the paths owned by this file; an endpoint must not rely on another route file happening to register authentication first.

Every endpoint authenticates first, then authorizes, and only then runs `apiValidator()`. `describeRoute()` declares the operation, responses and errors, and the input schemas also go into the API documentation. Pagination parameters are bounded, names are trimmed and length-limited, and `strictObject()` rejects extra fields, so the association endpoint cannot be used to change a task's title or completion status on the side.

All project IDs in this example are generated with `randomUUID()`, so they are validated with `z.uuid()`. User IDs in the application are not necessarily UUIDs, so do not apply this rule to the existing assignee field.

Update `server/routes/index.ts`:

```ts
import projectRoutes from './tutorial-projects.js';
import taskRoutes from './tutorial-tasks.js';
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';

const routes: readonly AppRouteContribution<Application>[] = [
  taskRoutes,
  projectRoutes,
];

export default routes;
```

Two small changes let the existing task list API read the new association:

- In `server/providers/tutorial-tasks.ts`, add `projectId` to the `.read([...])` field list of `taskData`. Do not add it to the writable fields of the existing create or complete actions.
- In `taskSchema` in `server/routes/tutorial-tasks.ts`, add `projectId: z.uuid().nullable()`, so the documented response matches the actual data. Leave the existing `createInput` and `updateInput` unchanged.

## Put endpoints into the API documentation

Every `/api` route should declare `describeRoute()` with a stable `operationId`, a group, a description of its purpose, and its success and error responses. The input definitions come from the schemas used by `apiValidator()`. When you change an endpoint, update its response schema at the same time so the documentation and the actual responses stay consistent.

A running application serves the API description at `<APP_BASE_PATH>/api/swagger` and an interactive page at `<APP_BASE_PATH>/api/swagger/docs`. The route must also be added to `server/routes/index.ts`: a declaration in a file that is never registered does not become a callable endpoint.

## Verify endpoint behavior

Run `pnpm dev` in the local example and sign in through the complete application entry printed in the terminal. Then open `<APP_BASE_PATH>/api/swagger/docs` on the same application, such as `/main/api/swagger/docs`. The API documentation reuses the current sign-in session, so no administrator password needs to be stored in articles or code.

Find the `Tutorial projects` group in the documentation to see the three endpoints added in this guide. Expand an endpoint, click **Try it out** to fill in the parameters, then click **Execute** to send the request.

![The Tutorial projects group in the API documentation: list projects, create a project and change a task's project](/assets/core/developing-apps/apis-and-services/api-overview.png)

Verify in this order:

1. Call `POST /tutorialProjects` with `{ "name": "Product launch" }`; it should return `201`. Note the `data.id`.
2. Call `GET /tutorialProjects?page=1&pageSize=20` and check the projects along with `meta.page`, `meta.pageSize` and `meta.total`.
3. Take a task ID from the existing task list, call the association endpoint, and put the new project's ID in `projectId`.
4. Query the task list again to confirm the task's `projectId` was saved; sending `null` should clear the association.
5. Use a well-formed UUID that matches no project as the project ID; you should get `400` with `error.reason` set to `PROJECT_UNAVAILABLE` and `fieldViolations` pointing to `projectId`, while the existing association stays unchanged.
6. Switch to an ordinary user who only has the permission to complete tasks, and confirm they can complete a task while the association endpoint returns `403`.

![Changing a task's project succeeds: the real request returns 200, and the response data contains the task id, projectId and updatedAt](/assets/core/developing-apps/apis-and-services/assign-project-success.png)

After a successful change, check the `200` status and the `projectId` under **Server response**, then confirm through the task list API that the result was saved. The IDs in the screenshot come from the local example; when following along, use the IDs of the records you created.

![Pointing to a project that does not exist: the real request returns 400 with reason PROJECT_UNAVAILABLE, and fieldViolations points to projectId](/assets/core/developing-apps/apis-and-services/project-unavailable.png)

When the project does not exist, the response returns `PROJECT_UNAVAILABLE` and marks `projectId` through `fieldViolations`; reading the task again should show that its original project association is unchanged.

Each error case is distinct: a request without sign-in returns `401`; a request without the action grant returns `403`; with the action grant, a task that does not exist or is outside the action's scope returns `404`; a project in the request body that does not exist or may not be chosen returns the same `400` field error. Giving "out of scope" and "does not exist" the same response prevents the API from being used to probe for hidden records.

## Add real endpoint tests

Create `tests/server/tutorial-tasks-project-api.test.ts`. It uses the application's existing test configuration, real sign-in, real permissions and an isolated database, without replacing the authentication or database services.

[Download the complete endpoint test](/assets/core/downloads/tutorial-tasks-project-api.test.ts) and save it at that path. The file contains this example's complete checks for successful, rejected and data-scope cases, for you to read or copy.

Run the new tests together with the regression tests of the existing task feature:

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/server/tutorial-tasks-project-api.test.ts
pnpm exec vitest run --config vitest.tutorial.config.ts
pnpm exec vitest run tests/logic/authorization-assignment-safety.test.ts
pnpm typecheck
```

These tests check more than `200`: invalid input writes no data; an unavailable project leaves the existing association unchanged; the task scope and the project scope each take effect; requests are rejected after a permission is revoked; and the API documentation contains the new routes and input definitions. This example was verified on SQLite.

## Continue reading

For transaction and concurrency boundaries, see [Server business services](server-business-services.md); for the matrix of allowed and rejected cases, see [Authentication, permissions and data scopes](authentication-and-permissions.md). Next, follow [UI components and interactions](pages-and-interactions.md) to connect these endpoints to pages.
