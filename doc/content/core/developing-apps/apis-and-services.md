---
title: Routes and HTTP APIs
description: Write and register application routes, choose Repository data APIs or business endpoints, and verify API contracts.
---

Write endpoints in `server/routes/` and register them in `server/routes/index.ts`. The application runtime mounts these contributions under its API root; creating a file alone does not expose an endpoint.

This guide starts with route registration and Repository data APIs, then retains the complete HTTP implementation of the project example. See [Server business services](server-business-services.md), [Request validation and error handling](request-validation-and-errors.md) and [Authentication, permissions and data scopes](authentication-and-permissions.md) for the other parts.

## Where endpoints belong

| Location | Purpose |
| --- | --- |
| `server/routes/<feature>.ts` | Declare custom Hono endpoints with `defineApiRoutes()`, or Repository operations with `defineRepositoryApiRoutes()` |
| `server/routes/index.ts` | Aggregate application routes, appending to existing contributions |
| `server/runtime.ts` | The template already connects the route entry; adding endpoints normally needs no runtime change |
| `server/app.ts` | Application middleware and assembly; see [Server runtime](../framework/runtime/server.md) |

Business API declarations omit `/api` and the deployment base path: `/projects` becomes `<APP_BASE_PATH>/api/projects`. For protocols such as webhooks that need root routes, see [Routes and request context](../framework/http/routes.md).

## Choosing endpoint and service boundaries

| Situation | Approach |
| --- | --- |
| A simple operation on one collection | Use [Repository data APIs](../framework/http/repository-routes.md), configuring operations, policies, authentication and business input validation |
| An operation involves multiple record types or explicit business rules | Write a business service and let the route handle the HTTP boundary |
| Multiple entry points need the same rules | Reuse the service and define the identity, policies and validated input each caller supplies |
| A service needs dependencies such as the database | Register it in a Provider and resolve it through a token |

Changing a task's project checks both the task and the target project, so this example uses custom routes and a business service. A service is not an internal bypass around authorization: its caller must supply policies appropriate to the operation.

## Use Repository data APIs

`defineRepositoryApiRoutes()` exposes standard operations on one Collection. This independent example assumes a migration has created `categories` with public `id` and `title` fields. It does not depend on the historical project example below. Save it as `server/routes/public-categories.ts`:

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

Add the contribution to `server/routes/index.ts`:

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

Clients can call `api.repository('publicCategories')`. Raw HTTP operations use paths such as `POST <APP_BASE_PATH>/api/publicCategories/findMany`, including reads. This declaration creates neither database tables nor management pages.

The example explicitly allows anonymous reads and denies every write. Protected business data requires identity and authorization-derived policies. `actions` selects exposed operations; `policy` controls records, fields and writes. See [Repository data APIs](../framework/http/repository-routes.md) for dynamic policies, write idempotency and full input contracts.

## Prepare the project example

The project/task example retains default template `1.0.0-beta.78` and its `tutorialTasks`/`tutorialProjects` collections. Follow [Create tables and initialize data](data-models-and-migrations.md#prepare-the-example-application) to prepare a separate app, including access to the private `nocobase/app-tutorials` repository. It does not continue the current getting-started `tasks` example. You can still read the code and responsibility boundaries without repository access.

Implement `TutorialProjectService` from [Server business services](server-business-services.md), then register the complete Provider, permissions and roles from [Authentication, permissions and data scopes](authentication-and-permissions.md). The routes below import those files.

## Example API contract

These paths are relative to the application's API root. For an application at `/main/`, that root is `/main/api`:

- `GET /tutorialProjects`: list projects within the operation's authorized scope, with pagination.
- `POST /tutorialProjects`: create a project and return `201` with `{ data }`.
- `PATCH /tutorialTasks/{id}/project`: change the task's project association; `projectId: null` removes the association.

The project association has its own subresource endpoint and permission. The existing `PATCH /tutorialTasks/{id}` still only completes or reopens a task and does not accept `projectId`. Task list responses gain `projectId`, without automatically returning project names or exposing project details.

## With an agent

Give the agent this chapter as context from the application directory, then describe the request below. Field, API and component details are in the manual steps; the agent should follow them alongside the project's guidance.

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

## Declare and register business routes

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

Do not put `/api` or the deployment base path into route definitions; `defineApiRoutes()` and the runtime add them. Authentication middleware covers only the paths owned by this file. An endpoint must not rely on another route contribution happening to register authentication first.

Each endpoint authenticates and authorizes before `apiValidator()` runs. `describeRoute()` declares the operation, responses and errors; input schemas also appear in the API document. Pagination is bounded, names are trimmed and length-checked, and `strictObject()` rejects extra fields. The association endpoint cannot also modify the task title or completion state.

All project IDs in this example are generated by `randomUUID()`, so they are validated with `z.uuid()`. User IDs elsewhere in the application are not necessarily UUIDs; do not apply this rule to the existing assignee field.

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

Make two small changes so the existing task list can return the saved association:

- Add `projectId` to `taskData`'s `.read([...])` fields in `server/providers/tutorial-tasks.ts`. Do not add it to the original create or complete action's writable fields.
- Add `projectId: z.uuid().nullable()` to `taskSchema` in `server/routes/tutorial-tasks.ts`, keeping the documented response aligned with the data. Leave `createInput` and `updateInput` unchanged.

## Include endpoints in the API document

Every `/api` route should declare `describeRoute()` with a stable `operationId`, group, purpose, success responses and error responses. `apiValidator()` supplies the input schema. Update response schemas alongside endpoint changes so documentation matches actual responses.

The running application serves its API description at `<APP_BASE_PATH>/api/swagger` and its interactive page at `<APP_BASE_PATH>/api/swagger/docs`. Register routes in `server/routes/index.ts`; a declaration in an unregistered file does not become a callable endpoint.

## Verify endpoint behavior

Run `pnpm dev` in the local example and sign in at the complete application URL printed in the terminal. Open `<APP_BASE_PATH>/api/swagger/docs` on the same application, for example `/main/api/swagger/docs`. The API documentation uses the signed-in session, so no administrator password needs to be stored in the article or code.

Find `Tutorial projects` to see the three endpoints added in this chapter. Expand an endpoint, select **Try it out**, enter its parameters, then select **Execute** to send the request.

![The Tutorial projects API group lists project queries, project creation and task-project assignment](/assets/core/developing-apps/apis-and-services/api-overview.png)

Verify the following sequence:

1. Call `POST /tutorialProjects` with `{ "name": "Product launch" }`. Expect `201` and record `data.id`.
2. Call `GET /tutorialProjects?page=1&pageSize=20`. Check the project and `meta.page`, `meta.pageSize` and `meta.total`.
3. Take a task ID from the existing task list and call the association endpoint with the new project ID as `projectId`.
4. Query the task list again and confirm that `projectId` persists. Send null to remove the association.
5. Use a valid UUID that does not identify a project. Expect `400`, `error.reason: PROJECT_UNAVAILABLE` and a field violation for `projectId`, with the previous association unchanged.
6. Sign in as an ordinary user with only task-completion permission. They can complete a task, but the association endpoint returns `403`.

![A successful task-project request returns 200 with the task id, projectId and updatedAt in data](/assets/core/developing-apps/apis-and-services/assign-project-success.png)

After assignment, check the `200` status under **Server response** and the returned `projectId`, then query the task list to confirm persistence. The screenshot uses local example IDs; use IDs from your own records when following along.

![An unavailable project returns 400 with PROJECT_UNAVAILABLE and a field violation for projectId](/assets/core/developing-apps/apis-and-services/project-unavailable.png)

A missing project returns `PROJECT_UNAVAILABLE` with `fieldViolations` identifying `projectId`. Read the task again to confirm that its previous project association is unchanged.

The error cases are distinct: anonymous requests return `401`; missing operation grants return `403`; an authorized operation with a missing or out-of-scope task returns `404`; a missing or unselectable project referenced in the body returns the same `400` field error. Identical responses for missing and out-of-scope records avoid revealing hidden record existence.

## Add real endpoint tests


Create `tests/server/tutorial-tasks-project-api.test.ts`. It uses the existing test configuration, real sign-in and permissions, and an isolated database. Authentication and database services are not replaced.

[Download the complete endpoint tests](/assets/core/downloads/tutorial-tasks-project-api.test.ts) and save them at that path. The file preserves this example's success, denial and data-scope checks for inspection or reuse.

Run the new tests and the existing task regression suite:

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/server/tutorial-tasks-project-api.test.ts
pnpm exec vitest run --config vitest.tutorial.config.ts
pnpm exec vitest run tests/logic/authorization-assignment-safety.test.ts
pnpm typecheck
```

The tests check more than `200`: invalid inputs do not write data, unavailable projects preserve the previous association, task and project scopes are enforced independently, revocation blocks subsequent requests, and the API document contains the new operations and input definitions. This example was verified with SQLite.


## Continue reading

See [Server business services](server-business-services.md) for transaction and concurrency boundaries, and [Authentication, permissions and data scopes](authentication-and-permissions.md) for the access test matrix. Continue with [UI components and interactions](pages-and-interactions.md) to connect the endpoints to pages.
