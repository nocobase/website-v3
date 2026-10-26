---
title: Business services and HTTP APIs
description: Separate HTTP routes, business services and Providers, with input validation, authorization, errors and API documentation.
---

An HTTP endpoint turns an external request into a business operation. Its contract includes input, permissions, results and failures. Business rules can live in a service for reuse by multiple entry points.

This guide uses project listing, creation and task assignment to explain these conventions. You can read it independently of the tutorial. To run the code, prepare the project table and task relationship from [Data models and migrations](data-models-and-migrations.md), plus the existing task endpoints. The example uses default template `1.0.0-beta.78` and adds no migration or plugin. The `tutorialTasks`/`tutorialProjects` model belongs to the separate historical project example, not the current getting-started `tasks` model. Confirm the baseline in [Data models and migrations](data-models-and-migrations.md) before running it.

## Choosing endpoint and service boundaries

| Situation | Approach |
| --- | --- |
| A simple operation on one collection | Consider the framework's Repository route capabilities; still configure authentication, authorization, input and documentation |
| An operation involves multiple record types or explicit business rules | Write a business service and let the route handle the HTTP boundary |
| Multiple entry points need the same rules | Reuse the service and define the identity, policies and validated input each caller supplies |
| A service needs dependencies such as the database | Register it in a Provider and resolve it through a token |

Changing a task's project checks both the task and the target project, so this example uses custom routes and a business service. A service is not an internal bypass around authorization: its caller must supply policies appropriate to the operation.

## Example API contract

These paths are relative to the application's API root. For an application at `/main/`, that root is `/main/api`:

- `GET /tutorialProjects`: list projects within the operation's authorized scope, with pagination.
- `POST /tutorialProjects`: create a project and return `201` with `{ data }`.
- `PATCH /tutorialTasks/{id}/project`: change the task's project association; `projectId: null` removes the association.

The project association has its own subresource endpoint and permission. The existing `PATCH /tutorialTasks/{id}` still only completes or reopens a task and does not accept `projectId`. Task list responses gain `projectId`, without automatically returning project names or exposing project details.

## Separate three responsibilities

**Routes handle HTTP.** They authenticate, authorize, validate inputs, declare API documentation and translate errors into the appropriate response. Only validated inputs reach the service.

**Services handle business behavior.** They query and create projects and enforce assignment rules. Each operation receives its authorization policies and binds them to Repository reads and writes. Services do not read Hono Context or return HTTP Response objects.

**Providers assemble dependencies.** They register the service and its token, declare project permissions and let routes resolve the same service from the application container.

## Input, response and error conventions

Validate input with `apiValidator()` and let business code read only validated values. Clients must not freely set server-generated IDs, creation times or fields outside the action. Select response fields explicitly; use the same permission policy and filters for list rows and totals.

| Outcome | Behavior in this example |
| --- | --- |
| Successful query | `200` with `{ data, meta }`; `meta` contains pagination details |
| Successful creation | `201` with `{ data }` |
| Successful update | `200` with `{ data }`, containing only this operation's result fields |
| Invalid input | `400` with a standard API error and field details where applicable |
| Unauthenticated or denied action | `401` or `403`, respectively, without business writes |
| Task missing or outside the operation's scope | `404`, without disclosing out-of-scope record details |
| Target project missing or ineligible | `400` with a consistent project field error; the old association remains |

Use `ApiError` and the shared handler rather than a custom error JSON format or a `200` response for failures. Translate known business failures into specific API errors; leave unknown exceptions to the standard handler instead of treating them all as invalid input.

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

## Without an agent

### Write an HTTP-independent business service

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

### Register the service and permissions

Create `server/providers/tutorial-projects.ts`:

<details>
<summary>Provider and permission declarations</summary>

```ts
import metadata from '../../package.json' with { type: 'json' };
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  createServiceToken,
  ServiceProvider,
} from '@nocobase/service-provider';
import { defineCompositeResource } from '@nocobase/authorization/core';
import {
  authorizationToken,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import { TutorialProjectService } from './tutorial-project-service.js';

export const tutorialProjectServiceToken =
  createServiceToken<TutorialProjectService>('app/tutorial-projects');
const projects = defineDatabasePermission((p) =>
  p.collection('tutorialProjects').read(['id', 'name', 'createdAt']),
);
const tasks = defineDatabasePermission((p) =>
  p
    .collection('tutorialTasks')
    .read(['id', 'projectId', 'updatedAt'])
    .update(['projectId', 'updatedAt']),
);
export const projectPermissions = defineCompositeResource(
  'tutorial.projects',
  (r) =>
    r
      .title({ key: 'projects.title', ns: metadata.name })
      .action('read', (a) =>
        a
          .title({ key: 'projects.read', ns: metadata.name })
          .grant('projects', projects),
      )
      .action('create', (a) =>
        a
          .title({ key: 'projects.create', ns: metadata.name })
          .grant('projects', projects.create(['id', 'name', 'createdAt'])),
      )
      .action('assignTask', (a) =>
        a
          .title({ key: 'projects.assignTask', ns: metadata.name })
          .grant('tasks', tasks)
          .grant('projects', projects),
      ),
);

export default class TutorialProjectsProvider extends ServiceProvider<Application> {
  public readonly name = 'app/tutorial-projects';
  public override register(): void {
    this.app.container.singleton(
      tutorialProjectServiceToken,
      () =>
        new TutorialProjectService(
          this.app.container.resolve(databaseManagerToken),
        ),
    );
  }
  public override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'tutorialProjects',
      title: { key: 'projects.title', ns: metadata.name },
    });
    const resource = authz.compositeResources.define(projectPermissions);
    authz.ui.place(resource, { section: 'tutorial' });
  }
}
```

</details>

`register()` binds the service factory. The container resolves the database and constructs the service when needed. `boot()` registers the project collection and three actions: view projects, create projects and change a task's project. The last action has separate `tasks` and `projects` scopes for editable tasks and selectable projects.

Registration only describes available capabilities; it creates no role assignments. `TutorialTasksProvider` already registers the task collection. Keep the new provider after it to reuse the existing tutorial permission section.

Update `server/providers/index.ts`, retaining the existing provider:

```ts
import TutorialProjectsProvider from './tutorial-projects.js';
import TutorialTasksProvider from './tutorial-tasks.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  TutorialTasksProvider,
  TutorialProjectsProvider,
];

export default serviceProviders;
```

Add these properties to the application locale object in `client/locales/en-US.ts`:

```ts
projects: {
  title: 'Projects',
  read: 'View projects',
  create: 'Create projects',
  assignTask: 'Change task project',
},
```

Add the corresponding properties in `client/locales/zh-CN.ts`:

```ts
projects: {
  title: '项目',
  read: '查看项目',
  create: '新建项目',
  assignTask: '修改任务项目',
},
```

These are object-property fragments. Merge them into the existing locale objects; do not replace other copy or edit `client/locales/system/`.

### Declare and register the routes

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

Append this entry to `permissionWorkspaceSelection.business` in `client/pages/settings/permission-workspace.ts`, keeping the existing task entry:

```ts
{
  type: 'composite',
  id: 'tutorial.projects',
  actions: ['read', 'create', 'assignTask'],
  scopeTitles: {
    tutorialTasks: { key: 'tasks.title' },
    tutorialProjects: { key: 'projects.title' },
  },
},
```

Server declarations define capabilities; this client configuration selects the business operations shown by the permission editor. Without it, the API enforces permissions that administrators cannot configure through the current editor.

### Configure roles and data scopes

An administrator can create or edit a role under System settings → Permission management. Find Projects in the existing task business section and select View projects, Create projects or Change task project. For assignment, configure task and project record scopes separately. Assign the role to named test users through Users.

![Project business permissions with View projects, Create projects and Change task project selected, including separate task and project scopes](/assets/core/developing-apps/apis-and-services/project-permissions.png)

The screenshot shows an unsaved **Project coordinator** role under **Business operations → Projects**. **All Records** is selected for this local demonstration. Choose scopes appropriate to the role's responsibilities, save the role, then assign it to specific users.

Users who need the existing task page also need its page permission and the relevant task actions. Page access does not authorize API calls, and project operations do not grant user-administration access.

The tests below create roles and assign them to isolated users through the real authorization service. Administrators configure roles in the actual application; do not add business grants to the inherited `member` role.

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

<details>
<summary>Complete API tests</summary>

```ts
import { permissionWorkspaceCatalog } from '../../client/pages/settings/permission-workspace.js';
import type { AuthorizationOptionsResponse } from '@nocobase/app-plugin-authorization/client';
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { selection } from '@nocobase/authorization/core';
import { databaseManagerToken } from '@nocobase/db';
import { projectPermissions } from '../../server/providers/tutorial-projects.js';
import { taskPermissions } from '../../server/providers/tutorial-tasks.js';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'project-api-test-secret-at-least-32-characters',
      advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
    logging: { enabled: false },
  },
});
const json = (method: string, value: unknown) => ({
  method,
  headers: { 'content-type': 'application/json', origin: 'http://localhost' },
  body: JSON.stringify(value),
});

// Every case uses the real application, authentication and authorization services.
test('rejects anonymous and ungranted callers before validating their input', async ({
  testApp,
  request,
}) => {
  for (const [path, init] of [
    ['/tutorialProjects', undefined],
    ['/tutorialProjects', json('POST', { name: '' })],
    ['/tutorialTasks/not-an-id/project', json('PATCH', {})],
  ] as const)
    expect((await request(path, init)).status).toBe(401);
  const users = testApp.application.container.resolve(
    userAdministrationServiceToken,
  );
  const credentials = {
    email: 'ungranted-project@example.test',
    password: 'project-test-password',
  };
  await users.create({ name: 'No project grants', ...credentials });
  const member = await signIn(testApp, credentials);
  expect((await member.fetch('/tutorialProjects')).status).toBe(403);
  expect(
    (await member.fetch('/tutorialProjects', json('POST', { name: '' })))
      .status,
  ).toBe(403);
  expect(
    (await member.fetch('/tutorialTasks/not-an-id/project', json('PATCH', {})))
      .status,
  ).toBe(403);
});

test('creates validated projects and returns stable paged DTOs', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const db = testApp.application.container.resolve(databaseManagerToken);
  const before = await db.repository('tutorialProjects').count();
  for (const input of [
    { name: '' },
    { name: '   ' },
    { name: 'x'.repeat(121) },
    { name: 'Injected', id: randomUUID() },
  ]) {
    const response = await admin.fetch(
      '/tutorialProjects',
      json('POST', input),
    );
    expect(response.status).toBe(400);
  }
  expect(await db.repository('tutorialProjects').count()).toBe(before);
  const response = await admin.fetch(
    '/tutorialProjects',
    json('POST', { name: '  Product launch  ' }),
  );
  expect(response.status).toBe(201);
  const { data } = (await response.json()) as {
    data: { id: string; name: string; createdAt: string };
  };
  expect(data.name).toBe('Product launch');
  expect(Object.keys(data).sort()).toEqual(['createdAt', 'id', 'name']);
  expect(new Date(data.createdAt).toISOString()).toBe(data.createdAt);
  expect(
    await db
      .repository('tutorialProjects')
      .findOne({ filter: { id: data.id } }),
  ).toMatchObject({ name: data.name });
  const page = await admin.fetch('/tutorialProjects?page=1&pageSize=1');
  expect(await page.json()).toMatchObject({
    data: [data],
    meta: { page: 1, pageSize: 1, total: before + 1 },
  });
  for (const query of ['page=0', 'pageSize=101', 'pageSize=abc'])
    expect((await admin.fetch(`/tutorialProjects?${query}`)).status).toBe(400);
});

test('changes and clears a task project without changing other task fields', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const created = await admin.fetch(
    '/tutorialProjects',
    json('POST', { name: 'Assignment project' }),
  );
  const projectId = ((await created.json()) as { data: { id: string } }).data
    .id;
  const task = await admin.fetch(
    '/tutorialTasks',
    json('POST', { title: 'Prepare materials', dueDate: '2026-11-01' }),
  );
  const taskId = ((await task.json()) as { data: { id: string } }).data.id;
  const db = testApp.application.container.resolve(databaseManagerToken);
  const path = `/tutorialTasks/${taskId}/project`;
  for (const id of [projectId, null]) {
    const response = await admin.fetch(path, json('PATCH', { projectId: id }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { id: taskId, projectId: id },
    });
    const listing = await admin.fetch('/tutorialTasks?q=Prepare%20materials');
    expect(await listing.json()).toMatchObject({
      data: [expect.objectContaining({ id: taskId, projectId: id })],
    });
    expect(
      await db.repository('tutorialTasks').findOne({ filter: { id: taskId } }),
    ).toMatchObject({
      title: 'Prepare materials',
      completed: false,
      dueDate: '2026-11-01',
      projectId: id,
    });
  }
  const missing = await admin.fetch(
    path,
    json('PATCH', { projectId: randomUUID() }),
  );
  expect(missing.status).toBe(400);
  expect(await missing.json()).toMatchObject({
    error: {
      reason: 'PROJECT_UNAVAILABLE',
      fieldViolations: [{ field: 'projectId' }],
    },
  });
  expect(
    (
      await admin.fetch(
        `/tutorialTasks/${randomUUID()}/project`,
        json('PATCH', { projectId }),
      )
    ).status,
  ).toBe(404);
  for (const input of [
    {},
    { projectId: 'invalid' },
    { projectId, completed: true },
  ])
    expect((await admin.fetch(path, json('PATCH', input))).status).toBe(400);
  expect(
    await db.repository('tutorialTasks').findOne({ filter: { id: taskId } }),
  ).toMatchObject({ projectId: null, completed: false });
});

test('applies separate task and project scopes without borrowing broader read grants', async ({
  testApp,
}) => {
  const users = testApp.application.container.resolve(
    userAdministrationServiceToken,
  );
  const credentials = {
    email: 'scoped-project@example.test',
    password: 'project-test-password',
  };
  const user = await users.create({ name: 'Project operator', ...credentials });
  const member = await signIn(testApp, credentials);
  const db = testApp.application.container.resolve(databaseManagerToken);
  const projectIds = [randomUUID(), randomUUID()];
  const taskIds = [randomUUID(), randomUUID()];
  for (const id of projectIds)
    await db
      .repository('tutorialProjects')
      .createOne({ values: { id, name: id, createdAt: new Date() } });
  for (const id of taskIds)
    await db.repository('tutorialTasks').createOne({
      values: {
        id,
        title: 'Scoped task',
        completed: false,
        updatedAt: new Date(),
      },
    });
  const authz = testApp.application.container.resolve(authorizationToken);
  await authz.permissionSets.create({
    key: 'project-operator',
    grants: [
      projectPermissions.reference().grant({
        read: { projects: selection.records(projectIds) },
        assignTask: {
          projects: selection.records([projectIds[0]]),
          tasks: selection.records([taskIds[0]]),
        },
      }),
    ],
  });
  await authz.permissionSets.assign({
    id: 'project-operator-user',
    permissionSet: 'project-operator',
    subject: { type: 'user', id: user.id },
  });
  const list = await member.fetch('/tutorialProjects?pageSize=1');
  const body = (await list.json()) as {
    data: unknown[];
    meta: { total: number };
  };
  expect(list.status).toBe(200);
  expect(body.data).toHaveLength(1);
  expect(body.meta.total).toBe(2);
  expect(
    (
      await member.fetch(
        '/tutorialProjects',
        json('POST', { name: 'Forbidden' }),
      )
    ).status,
  ).toBe(403);
  const assign = (taskId: string, projectId: string) =>
    member.fetch(
      `/tutorialTasks/${taskId}/project`,
      json('PATCH', { projectId }),
    );
  expect((await assign(taskIds[0], projectIds[0])).status).toBe(200);
  const hidden = await assign(taskIds[0], projectIds[1]);
  expect(hidden.status).toBe(400);
  expect(await hidden.json()).toMatchObject({
    error: {
      reason: 'PROJECT_UNAVAILABLE',
      fieldViolations: [{ field: 'projectId' }],
    },
  });
  expect((await assign(taskIds[1], projectIds[0])).status).toBe(404);
  expect(
    await db
      .repository('tutorialTasks')
      .findOne({ filter: { id: taskIds[0] } }),
  ).toMatchObject({ projectId: projectIds[0] });
  expect(
    await db
      .repository('tutorialTasks')
      .findOne({ filter: { id: taskIds[1] } }),
  ).toMatchObject({ projectId: null });
  await authz.permissionSets.delete('project-operator');
  expect((await assign(taskIds[0], projectIds[0])).status).toBe(403);
});

test('does not let task completion grants change a project assignment', async ({
  testApp,
}) => {
  const users = testApp.application.container.resolve(
    userAdministrationServiceToken,
  );
  const credentials = {
    email: 'task-completer@example.test',
    password: 'project-test-password',
  };
  const user = await users.create({ name: 'Task completer', ...credentials });
  const member = await signIn(testApp, credentials);
  const authz = testApp.application.container.resolve(authorizationToken);
  await authz.permissionSets.create({
    key: 'task-completer',
    grants: [
      taskPermissions.reference().grant({ update: { tasks: 'allRecords' } }),
    ],
  });
  await authz.permissionSets.assign({
    id: 'task-completer-user',
    permissionSet: 'task-completer',
    subject: { type: 'user', id: user.id },
  });
  const id = randomUUID();
  const db = testApp.application.container.resolve(databaseManagerToken);
  await db.repository('tutorialTasks').createOne({
    values: {
      id,
      title: 'Complete only',
      completed: false,
      updatedAt: new Date(),
    },
  });
  expect(
    (
      await member.fetch(
        `/tutorialTasks/${id}`,
        json('PATCH', { completed: true }),
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await member.fetch(
        `/tutorialTasks/${id}/project`,
        json('PATCH', { projectId: null }),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await member.fetch(
        `/tutorialTasks/${id}`,
        json('PATCH', { projectId: randomUUID() }),
      )
    ).status,
  ).toBe(400);
});

test('publishes all endpoints and input schemas in the authenticated API document', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch('/swagger');
  expect(response.status).toBe(200);
  const document = (await response.json()) as {
    paths: Record<
      string,
      Record<string, { operationId: string; requestBody?: unknown }>
    >;
  };
  const projectPath = Object.keys(document.paths).find((p) =>
    p.endsWith('/tutorialProjects'),
  )!;
  const taskPath = Object.keys(document.paths).find((p) =>
    p.endsWith('/tutorialTasks/{id}/project'),
  )!;
  expect(document.paths[projectPath].get.operationId).toBe(
    'listTutorialProjects',
  );
  expect(document.paths[projectPath].post.operationId).toBe(
    'createTutorialProject',
  );
  expect(document.paths[projectPath].post.requestBody).toBeDefined();
  expect(document.paths[taskPath].patch.operationId).toBe(
    'assignTutorialTaskProject',
  );
  expect(document.paths[taskPath].patch.requestBody).toBeDefined();
});

test('exposes project actions in the actual permission editor catalog', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch('/authorization/permissionSets/options');
  expect(response.status).toBe(200);
  const { data } = (await response.json()) as {
    data: AuthorizationOptionsResponse;
  };
  const catalog = permissionWorkspaceCatalog(data, [], []);
  const project = catalog.sections
    .flatMap((section) => section.subsections)
    .flatMap((section) => section.resources ?? [])
    .find((resource) => resource.id === 'tutorial.projects');
  expect(project?.actions.map((action) => action.name)).toEqual([
    'read',
    'create',
    'assignTask',
  ]);
});
```

</details>

Run the new tests and the existing task regression suite:

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/server/tutorial-tasks-project-api.test.ts
pnpm exec vitest run --config vitest.tutorial.config.ts
pnpm exec vitest run tests/logic/authorization-assignment-safety.test.ts
pnpm typecheck
```

The tests check more than `200`: invalid inputs do not write data, unavailable projects preserve the previous association, task and project scopes are enforced independently, revocation blocks subsequent requests, and the API document contains the new operations and input definitions. This example was verified with SQLite.

## Scope of this chapter

The transaction groups this operation's database work so it succeeds or fails together. It does not implement version checks or promise a shared snapshot across separate list queries. If two people change the same task's project in sequence, the later successful write replaces the earlier one. Add and verify version preconditions when the business requires conflict protection.

Continue with [UI components and interactions](pages-and-interactions.md) to connect these APIs to a project list, create dialog and task assignment form, including loading states, field errors and submission feedback.
