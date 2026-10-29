---
title: Build your first app
description: Start from a one-sentence business request and build a team task app for assigning work, scheduling dates and tracking progress.
---

This tutorial builds a team task app you can actually use: tasks have a title, description, assignee, due date and progress, and you can create, view, edit, delete, search, filter and page through them.

![Team task list with assignees, due dates, progress and pagination.](/assets/core/tutorials/quickstart/task-list.png)

Before you start, prepare a project with [Create an app](../getting-started/create-app.md). The two paths below reach the same result; choose either one.

## With an Agent

Open your Agent in the application directory and tell it:

```text
Build me a team task management app where we can assign people, set due dates, and track progress. Run it so I can try it.
```

The Agent follows the project's `AGENTS.md` and Skills to build the table, APIs, pages, permissions and checks. Your job is to check the business result: create a task, assign someone, change its progress, then refresh the page to confirm the data is still there. If anything feels awkward, just describe it, for example "Open the task details when I click the title, then let me decide whether to edit."

The screenshots show the result of this run. The same request may produce different layouts and code, and you do not need to turn every implementation detail into the prompt.

![Task details in a drawer.](/assets/core/tutorials/quickstart/task-detail.png)

## Without an Agent

This path unpacks what the Agent does behind the scenes: create the table, implement the backend and frontend, connect permissions, then verify. Each step shows the key code. Code marked as an excerpt belongs in the corresponding file; the GitHub links point to a fixed revision of the complete implementation.

### 1. Create the task table

You only need one new business table, `tasks`. Users, sign-in and roles reuse the built-in capabilities, so there is no separate user table or permission system.

| Field | Purpose |
| --- | --- |
| `id` | Task ID |
| `title` | Required title, at most 120 characters after trimming |
| `description` | Task description, at most 2,000 characters |
| `status` | Progress: `todo`, `inProgress` or `done` |
| `assigneeId` | ID of an existing user, nullable |
| `dueDate` | Calendar date in `YYYY-MM-DD` format, nullable |
| `createdAt`, `updatedAt` | Creation and update times |

Declare the fields and indexes in [database/main/migrations/202610250101_create_tasks.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/database/main/migrations/202610250101_create_tasks.ts):

<details>
<summary>Expand the complete migration</summary>

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610250101_create_tasks',
  async up({ builder }) {
    await builder.createCollection('tasks', (c) => {
      c.string('id', { length: 36, primaryKey: true, nullable: false });
      c.string('title', { length: 120, nullable: false });
      c.text('description', { nullable: false, defaultValue: '' });
      c.string('status', { length: 16, nullable: false, defaultValue: 'todo' });
      c.string('assigneeId', { length: 255, nullable: true });
      c.string('dueDate', { length: 10, nullable: true });
      c.datetime('createdAt', { nullable: false });
      c.datetime('updatedAt', { nullable: false });
      c.index(['assigneeId', 'status']);
      c.index('dueDate');
      c.index('updatedAt');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('tasks');
  },
});
```

</details>

The migration only owns the table structure; business validation of the fields happens in the backend. The application checks assignees through the user service instead of reading or changing the authentication plugin's internal tables. Applying the migration also generates the Collection files:

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
pnpm nocobase collections doctor
```

The result is in `database/main/collections/tasks/`; do not edit these generated files by hand. Sample tasks are runtime data and do not belong in the initialization seeds the application requires.

### 2. Implement the backend

The backend has three parts: input validation, a business service and HTTP routes. Once a request passes authentication and authorization, the route validates the input and hands the business work to the service.

**Validate input.** [server/tasks/schemas.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/tasks/schemas.ts) defines separate inputs for creating, editing and updating progress, so editing the details cannot accidentally overwrite the progress:

<details>
<summary>Expand input validation</summary>

```ts
export const taskStatus = z.enum(['todo', 'inProgress', 'done']);
export const taskDetails = z.strictObject({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(''),
  assigneeId: z.string().min(1).max(255).nullable().default(null),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return (
        !Number.isNaN(date.valueOf()) &&
        date.toISOString().slice(0, 10) === value
      );
    })
    .nullable()
    .default(null),
});
export const createTask = taskDetails.extend({
  status: taskStatus.default('todo'),
});
export const editTask = taskDetails.extend({
  expectedUpdatedAt: z.iso.datetime(),
});
export const progressTask = z.strictObject({
  status: taskStatus,
  expectedUpdatedAt: z.iso.datetime(),
});
```

</details>

**Save tasks.** [server/tasks/service.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/tasks/service.ts) uses a Repository with a permission policy. This is the actual `TaskService.create`; `validateOwner` uses the user service to reject missing or disabled assignees:

```ts
async create(policy: RepositoryPolicy, input: TaskInput) {
  await this.validateOwner(input.assigneeId);
  const now = new Date();
  const result = await this.db
    .repository('tasks')
    .withPolicy(policy)
    .createOne({
      values: { ...input, id: randomUUID(), createdAt: now, updatedAt: now },
    });
  return rowSchema.parse(result.record);
}
```

The same service also provides listing, details, editing, progress changes and deletion. The list is filtered, sorted, paginated and counted in the database; editing and deletion check `expectedUpdatedAt` and return `409` when someone else has changed the record, so nobody's changes are silently overwritten.

**Register the endpoints.** [server/routes/tasks.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/routes/tasks.ts) installs the authentication and authorization middleware on the task subrouter. `gate` resolves the permission policy for the action before input validation runs. The create endpoint looks like this:

```ts
tasks.post(
  '/',
  gate('create'),
  describeRoute({
    tags: ['Tasks'],
    operationId: 'createTask',
    summary: 'Create a task',
    responses: { '201': dataResponse(taskSchema), ...errors },
  }),
  apiValidator('json', createTask),
  async (c) => {
    const row = await service.create(c.get('taskPolicy'), c.req.valid('json'));
    return c.json(
      { data: (await service.present([row], c.get('authz')))[0] },
      201,
    );
  },
);
```

`describeRoute` also declares the API documentation, and `apiValidator` validates the request. Success returns `{ data }`, and failures use the standard `ApiError`. Connect the task routes and service to the application's existing registration entries:

`server/routes/index.ts`

```ts
import { taskRoutes } from './tasks.js';
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';

const routes: readonly AppRouteContribution<Application>[] = [taskRoutes];

export default routes;
```

`server/providers/index.ts`

```ts
import TasksProvider from './tasks.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  TasksProvider,
];

export default serviceProviders;
```

The complete service registration is in [server/providers/tasks.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/providers/tasks.ts). Once signed in, you can inspect the Tasks API declarations at the application's `/api/swagger`.

### 3. Implement the frontend

The frontend adds a task list, a detail drawer and a create/edit dialog, reusing the template's layout, table, form and feedback components.

**Pages and sidebar.** Register the routes in [client/routes.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/routes.ts); `navigation` creates the sidebar entry. The details and dialogs have their own URLs, so the list's query conditions survive opening, refreshing and closing them:

<details>
<summary>Expand the task route excerpt</summary>

```ts
{
  name: 'tasks',
  path: '/tasks',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'tasks' }, action: 'access' },
  navigation: { title: 'tasks.title', icon: ListTodo, order: 10 },
  componentLoader: () => import('./pages/tasks/index.js'),
  children: [
    { name: 'taskCreate', path: 'new', componentLoader: () => import('./pages/tasks/form.js') },
    { name: 'taskEdit', path: 'edit/:taskId', componentLoader: () => import('./pages/tasks/form.js') },
    {
      name: 'taskDetail', path: ':taskId',
      componentLoader: () => import('./pages/tasks/detail.js'),
      children: [{ name: 'taskDetailEdit', path: 'edit', componentLoader: () => import('./pages/tasks/form.js') }],
    },
  ],
}
```

</details>

**The list.** [client/pages/tasks/index.tsx](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/index.tsx) keeps the search text, status, sort order and page in the URL, requests the API through `useApiClient`, and passes the result to `DataTable`. The key configuration:

```tsx
<DataTable
  columns={columns}
  data={result.data}
  getRowId={(row) => row.id}
  manualPagination
  rowCount={result.meta.total}
  paginationState={pagination}
  pageSizeOptions={[10, 20, 50]}
  manualSorting
  sortingState={sorting}
  loading={loading}
/>
```

In the complete file, `onPaginationChange` and `onSortingChange` update the URL and trigger a new query. The list also distinguishes four states: empty at first, no matches for the filters, loading and failed. Task titles open the details through `RecordLink`.

**Forms and saving.** [client/pages/tasks/form.tsx](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/form.tsx) reloads the task when the edit dialog opens. Here is the save request: creation includes the initial progress, while editing submits only the task details and the version:

```ts
const values = {
  title: fields.title.trim(),
  description: fields.description.trim(),
  assigneeId: fields.assignee?.id ?? null,
  dueDate: fields.dueDate,
  ...(creating ? { status: fields.status } : { expectedUpdatedAt: version }),
};
const { data } = await api.request<{ data: Task }>({
  path: creating ? 'tasks' : `tasks/${taskId}`,
  method: creating ? 'POST' : 'PATCH',
  json: values,
});
```

The form validates on submit and shows errors next to their fields. A failed save keeps the input, and a pending save blocks repeated submission and closing the dialog. After a successful save, the view is first updated from the returned task, then the list is refreshed; if only the list refresh fails, the form says separately that the task was saved and does not ask the user to submit again.

![Create dialog with description, assignee and due date.](/assets/core/tutorials/quickstart/task-create.png)

The assignee picker is in [client/pages/tasks/assignee-picker.tsx](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/assignee-picker.tsx), and dates use `Calendar` with `Popover`; the details are in [client/pages/tasks/detail.tsx](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/detail.tsx). Editing, progress and deletion actions are collected in [client/pages/tasks/task-actions.tsx](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/task-actions.tsx); before deleting, the confirmation names the task and says that deletion cannot be undone.

**English and Chinese text.** The text is collected in [client/locales/tasks.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/locales/tasks.ts) and merged into both language resources. Components only reference translation keys:

```ts
// client/locales/en-US.ts
import { tasksEn } from './tasks.js';
const enUS = { ...systemEnUS, tasks: tasksEn };

// client/locales/zh-CN.ts
import { tasksZh } from './tasks.js';
const zhCN: AppResource = { ...systemZhCN, tasks: tasksZh };
```

### 4. Connect permissions

Page access and data operations are authorized separately. Hiding a button only affects the interface; the backend must still check every request and its record scope.

[server/tasks/permissions.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/tasks/permissions.ts) declares five actions and an "assigned to me" record scope:

<details>
<summary>Expand permission declarations</summary>

```ts
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import { defineDatabasePermission } from '@nocobase/app-plugin-authorization/server';
import { buildFilter } from '@nocobase/repository-input';
import metadata from '../../package.json' with { type: 'json' };
import type { TaskRow } from './schemas.js';
export const label = (key: string) => ({
  ns: metadata.name,
  key: `tasks.${key}`,
});
const fields = [
  'id',
  'title',
  'description',
  'status',
  'assigneeId',
  'dueDate',
  'createdAt',
  'updatedAt',
] as const;
const data = defineDatabasePermission((p) =>
  p.collection<TaskRow>('tasks').title(label('title')).read(fields),
);
export const assignedTasks = defineRecordAccess('tasks.assigned', (access) =>
  access
    .title(label('assignedScope'))
    .collections('tasks')
    .resolver(({ principal }) =>
      principal.type === 'user'
        ? buildFilter((f) => f.string('assigneeId').eq(principal.id))
        : false,
    ),
);
export const taskPermissions = defineCompositeResource('tasks', (r) =>
  r
    .title(label('title'))
    .action('read', (a) =>
      a.title(label('readPermission')).grant('tasks', data),
    )
    .action('create', (a) =>
      a.title(label('createPermission')).grant('tasks', data.create(fields)),
    )
    .action('edit', (a) =>
      a
        .title(label('editPermission'))
        .grant(
          'tasks',
          data.update([
            'title',
            'description',
            'assigneeId',
            'dueDate',
            'updatedAt',
          ]),
        ),
    )
    .action('progress', (a) =>
      a
        .title(label('progressPermission'))
        .grant('tasks', data.update(['status', 'updatedAt'])),
    )
    .action('delete', (a) =>
      a.title(label('deletePermission')).grant('tasks', data.delete()),
    ),
);
export type TaskAction = 'read' | 'create' | 'edit' | 'progress' | 'delete';
```

</details>

The routes obtain the permission policy through this service method, and every read and write uses `withPolicy(policy)`:

```ts
async policy(
  authz: AuthorizationContext,
  action: TaskAction,
): Promise<RepositoryPolicy> {
  const decision = await authz.authorize({
    resource: { type: 'composite', id: 'tasks' },
    action,
  });
  const policy = decision.conditions?.database?.tasks;
  if (decision.effect === 'deny' || !policy)
    throw taskError('PERMISSION_DENIED', 'TASK_ACTION_DENIED');
  return policy;
}
```

Next, a one-time seed initializes three roles that administrators can later edit. The seed only provides the initial configuration and does not overwrite administrators' changes on every startup:

| Role | Initial permissions |
| --- | --- |
| Task manager | View, create, edit, change progress and delete all tasks |
| Task member | View and update progress on tasks assigned to them |
| Task reader | View all tasks, without changing them |

<details>
<summary>Expand role initialization</summary>

```ts
const taskRoles = [
  {
    key: 'task-manager',
    title: 'managerRole',
    actions: ['read', 'create', 'edit', 'progress', 'delete'],
    scope: 'allRecords',
  },
  {
    key: 'task-member',
    title: 'memberRole',
    actions: ['read', 'progress'],
    scope: 'tasks.assigned',
  },
  {
    key: 'task-reader',
    title: 'readerRole',
    actions: ['read'],
    scope: 'allRecords',
  },
].map(({ key, title, actions, scope }) =>
  definePermissionSet(key)
    .title({ ns: metadata.name, key: `tasks.${title}` })
    .grant({
      resource: { type: 'page', id: 'tasks' },
      actions: [{ action: 'access' }],
    })
    .grant({
      resource: { type: 'composite', id: 'tasks' },
      actions: actions.map((action) => ({
        action,
        policy: { type: 'composite', scopes: { tasks: scope } },
      })),
    })
    .build(),
);
// Inside the transactional seed run callback:
for (const role of taskRoles) {
  const existing = await query
    .selectFrom('authorizationPermissionSets')
    .select('id')
    .where('key', '=', role.key)
    .executeTakeFirst();
  if (existing) continue;
  const now = new Date();
  await query
    .insertInto('authorizationPermissionSets')
    .values({
      id: role.key,
      key: role.key,
      title: encodeAuthorizationTitle(role.title),
      grants: JSON.stringify(role.grants),
      createdAt: now,
      updatedAt: now,
    })
    .execute();
}
```

</details>

The complete seed is in [database/main/seeds/202610250102_task_roles.ts](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/database/main/seeds/202610250102_task_roles.ts). Then register the system settings pages the template prepares in `client/routes.ts`, and add the task actions to the permission editor:

```ts
// client/routes.ts
import systemSettingsRoutes from './pages/settings/routes.js';
const routes = [appRoutes, systemSettingsRoutes];

// client/pages/settings/permission-workspace.ts: business entry
{
  type: 'composite',
  id: 'tasks',
  actions: ['read', 'create', 'edit', 'progress', 'delete'],
  hiddenActionScopes: { create: ['tasks'] },
}
```

In **System settings → Users**, assign roles to specific people. Do not give business roles to every signed-in user, and do not widen the platform's default `member` role. To change actions or record scopes, edit the role in **Permission management**.

![Task roles in system settings.](/assets/core/tutorials/quickstart/roles.png)

### 5. Write tests

Once the feature is implemented, add its automated tests under `tests/`. Reuse the project's existing test configuration and tools, and verify business behavior against a real application and a test database. This example implements the following tests; the complete code is in the [tests directory](https://github.com/nocobase/app-tutorials/tree/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/tests):

```bash
tests/
├── database/
│   └── tasks-migration.test.ts                  # Create, roll back, and reapply the task table
├── server/
│   ├── tasks.test.ts                            # CRUD, validation, filters, pagination, and permissions
│   └── authorization-assignment-safety.test.ts  # Prevent automatic business role grants to all users
├── client/
│   ├── tasks.test.tsx                           # Form validation, save feedback, and read-only restrictions
│   ├── client-routes.test.ts                    # Page routes and access permission registration
│   └── page-permission-titles.test.ts           # English and Chinese permission labels
└── playwright/
    └── tasks.test.ts                            # Task actions, filters, pagination, and role-based flows
```

With the tests written, run the database, server and client tests from the application directory; there is no need to start the app first:

```bash
pnpm test
```

Browser tests run with `pnpm test:e2e`. They need a separate test application started beforehand, plus its URL and credentials.

Install Chromium before the first run:

```bash
pnpm exec playwright install chromium
```

Then replace the application URL and test administrator credentials below. The tests create users and tasks, so always use a separate test application:

```bash
TUTORIAL_ORIGIN=http://127.0.0.1:13000 \
TUTORIAL_USERNAME='your-test-admin' TUTORIAL_PASSWORD='your-test-password' \
pnpm test:e2e
```

### 6. Download and run the complete example

After reading the walkthrough above, you can download the finished example to compare complete files. The repository is currently private and requires GitHub access; get it in a new directory so you do not overwrite your own project.

```bash
git clone --branch fix/v3-quickstart-npm https://github.com/nocobase/app-tutorials.git team-tasks
cd team-tasks
git checkout da050f4dd4d9ddc36c8585489bd002c6e01ad76f
```

The example is based on default template `1.0.0-beta.81` and uses packages published on npmjs.org. With Node.js 24 and pnpm 11.7 ready, install the dependencies directly: the repository's `.npmrc` selects npmjs.org, and its lockfile pins the verified versions.

```bash
pnpm install --frozen-lockfile
pnpm nocobase config init
pnpm nocobase config check
pnpm dev
```

Open the `Local:` application entry printed in the terminal. Sign in for the first time as the initial administrator from the application's configuration; after adding teammates in user management and assigning them task roles, you can create your own tasks. The configuration, the database and the sample data in the screenshots are not distributed with the source repository.

## Deploy the application

Once the application is built and its tests pass, you can deploy it independently to production. Read [Choose a deployment method](../deployment/choose-a-deployment-method.md) and pick Docker or PM2 (app-installer) according to how your servers are operated; each method has steps with and without an Agent.

After deployment, check sign-in, task operations and role permissions, and confirm that data is still there after the application restarts.
