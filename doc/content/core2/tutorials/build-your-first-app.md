---
title: Build your first app
description: Build a team task application with assignees, due dates and progress tracking, where each role sees different tasks and actions.
---

By the end of this guide, you will have a usable team task application:

- Tasks have a title, description, assignee, due date and progress (To do, In progress, Done). Users can create, view, edit and delete tasks, search by title, filter by progress and paginate. The interface supports English and Chinese.
- Three task roles: managers manage all tasks; members see only tasks assigned to them and can only update progress; readers see all tasks but cannot change them.
- Automated tests covering table creation, APIs, permissions and pages.

![Team task list with progress, assignees, due dates and pagination.](/assets/core/tutorials/team-tasks/task-list.png)

Choose either approach below: ask an Agent to build it or write the code yourself. Both produce the same application. Then follow [Try the application](#try-the-application) to check the result.

## Prepare

Follow [Create an app](../getting-started/create-app.md) to create an application that starts and supports administrator sign-in. This walkthrough used Node.js 24, pnpm 11.7, default template `1.0.0-beta.84` and SQLite. Follow the version installed when you create your project and its accompanying guidance.

Commit the project to Git before starting so you can see exactly which files change.

## With an Agent

### 1. Describe the requirement

Start an Agent session in the application directory. Its `AGENTS.md` and `.agents/skills/` explain where code belongs and how to write migrations and permissions for the installed version. If `.agents/skills/` is missing, first run `pnpm nocobase skills sync` in that directory.

Send the Agent this request:

```text
Build a team task application with a title, description, assignee, due date and three progress states: To do, In progress and Done.
Support creation, details, editing, deletion, search, status filtering and pagination, with English and Chinese copy.
Managers can manage all tasks; members can only view tasks assigned to them and update their progress; readers can only view all tasks.
Provide user and role management so I can add test members and assign roles.
Follow the project's AGENTS.md and Skills for implementation and tests, preserving existing features and data.
Start the application when ready. Tell me the URL, how to prepare test accounts and roles, what you checked and what remains unverified.
```

This request states three things: task data and operations, who may do what, and what to deliver. Include permissions so the Agent checks each request on the server instead of only hiding buttons.

### 2. Check the delivery

The Agent creates the task table, APIs, pages and three task roles, writes and runs tests, and starts the application. It should report:

- The application URL and sign-in account.
- Changed files, executed tests and their results.
- Anything that remains unverified.

Open the complete URL, keeping a trailing path such as `/main/`, sign in as an administrator and follow [Try the application](#try-the-application).

The same request may produce different layouts and file organization on different runs. Screenshots and code here come from one walkthrough; use the labels and locations in your application. To understand what the Agent changed, compare it with “Without an Agent” below.

## Without an Agent

The following steps cover the table, backend, frontend, permissions and tests. Each provides key code; snippets need to be placed in the corresponding files. See [Example source](#example-source) for the complete implementation.

Starting from the default template, the changes involve:

| Location | Change |
| --- | --- |
| `database/main/migrations/`, `database/main/seeds/` | Create the task table and initialize three task roles |
| `server/tasks/` | Input validation, business service and permission declarations |
| `server/providers/`, `server/routes/` | Register the task service and HTTP APIs |
| `client/pages/tasks/` | List, details, forms and task actions |
| `client/routes.ts`, `client/pages/settings/` | Register task pages and system settings; show task actions in the permission editor |
| `client/locales/` | English and Chinese copy |
| `client/components/ui/calendar.tsx` | Calendar component added through shadcn |
| `tests/` | Task tests |

### 1. Create the task table

Add one business table, `tasks`. Use the application's existing users, sign-in and roles rather than building another user table or permission system.

| Field | Purpose |
| --- | --- |
| `id` | Server-generated task ID |
| `title` | Required title, trimmed and limited to 120 characters |
| `description` | Description, up to 2,000 characters |
| `status` | Progress: `todo`, `inProgress`, `done` |
| `assigneeId` | Existing user's ID, nullable |
| `dueDate` | Calendar date in `YYYY-MM-DD` format, nullable |
| `createdAt`, `updatedAt` | Creation and update timestamps |

Declare fields and indexes in [database/main/migrations/202610250101_create_tasks.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/database/main/migrations/202610250101_create_tasks.ts):

<details>
<summary>Show the complete migration</summary>

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

The migration defines structure; backend validation enforces business rules. Validate assignees through the user service rather than reading or writing authentication plugin internals.

With default settings, startup runs pending migrations and seeds automatically. To apply them without restarting, run these commands and generate Collection files:

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
pnpm nocobase collections generate
```

`--dry-run` previews the work without executing it. `collections generate` writes the schema to `database/main/collections/`. These files are generated; do not edit them by hand.

### 2. Implement the backend

The backend has three layers: input validation, a business service and HTTP APIs. Requests pass authentication and authorization, then input validation, before reaching the service.

**Input validation.** [server/tasks/schemas.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/schemas.ts) separates creation, editing and progress updates into three inputs. Editing task details cannot also change progress, allowing progress updates to be granted separately to members:

<details>
<summary>Show input validation</summary>

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

`expectedUpdatedAt` is the update timestamp returned when the task was read. On modification or deletion, the server compares it with the current value. If someone else changed the task, it returns `409` instead of overwriting their work.

**Business service.** Every read and write in [server/tasks/service.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/service.ts) applies the current user's permission policy through `withPolicy(policy)`. Here is task creation; `validateOwner` rejects nonexistent, disabled or non-person assignees:

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

The service also provides listing, details, eligible assignees, editing, progress updates and deletion. Search, filtering, sorting and pagination happen in the database, and the list returns a total count.

**HTTP APIs.** [server/routes/tasks.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/routes/tasks.ts) provides these endpoints, prefixed by the application base path, such as `/main`:

| Method and path | Purpose | Required permission |
| --- | --- | --- |
| `GET /api/tasks` | List with search, progress filtering, sorting and pagination | Read |
| `GET /api/tasks/:id` | Details | Read |
| `GET /api/tasks/assignees` | Eligible assignees | Create or edit |
| `POST /api/tasks` | Create | Create |
| `PATCH /api/tasks/:id` | Edit title, description, assignee and due date | Edit |
| `PATCH /api/tasks/:id/status` | Update progress | Progress |
| `DELETE /api/tasks/:id` | Delete | Delete |

Three additional read endpoints, `GET /api/tasks/:id/edit`, `/progress` and `/delete`, let the page confirm the user still has the corresponding permission on that task before editing, updating progress or deleting.

Authentication and authorization middleware are attached only to the task subrouter. `gate` obtains the policy for an action and rejects unauthorized callers. The creation endpoint is:

```ts
tasks.use('*', auth.required(), authz.middleware());
const gate =
  (action: TaskAction): MiddlewareHandler<Env> =>
  async (c, next) => {
    c.set('taskPolicy', await service.policy(c.get('authz'), action));
    await next();
  };

tasks.post(
  '/',
  gate('create'),
  describeRoute({
    tags: ['Tasks'],
    operationId: 'createTask',
    summary: 'Create a task',
    responses: { '201': dataResponse(taskSchema), ...errors },
  }),
  apiValidator('header', z.object({ 'idempotency-key': z.string() })),
  apiValidator('json', createTask),
  async (c) => {
    return c.json(await mutation(c, 'create', c.req.valid('json')), 201);
  },
);
```

`describeRoute` declares API documentation and `apiValidator` validates requests. Success returns `{ data }`; failures use the standard `ApiError`. Write endpoints require an `Idempotency-Key` header. Through `executeIdempotentMutation`, `mutation` puts the task write and operation receipt in one transaction. Repeating a submission with the same key returns the first result without creating a duplicate.

**Register the service and APIs.** [server/providers/tasks.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/providers/tasks.ts) registers the task service and permission declarations at startup:

<details>
<summary>Show TasksProvider</summary>

```ts
export const taskServiceToken =
  createServiceToken<TaskService>('team-tasks/tasks');
export default class TasksProvider extends ServiceProvider<Application> {
  readonly name = 'team-tasks/tasks';
  override async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({ name: 'tasks', title: label('title') });
    authz.recordAccess.define(assignedTasks);
    authz.ui.sections.add({
      name: 'tasks',
      parent: 'business',
      title: label('title'),
    });
    authz.ui.place(authz.compositeResources.define(taskPermissions), {
      section: 'tasks',
    });
    this.app.container.instance(
      taskServiceToken,
      new TaskService(
        this.app.container.resolve(databaseManagerToken),
        this.app.container.resolve(userAdministrationServiceToken),
      ),
    );
  }
}
```

</details>

Add the service and routes to the application's existing registration entry points. The template already includes `SubmissionProvider`, which handles operation receipts:

`server/providers/index.ts`

```ts
import TasksProvider from './tasks.js';
import SubmissionProvider from './submission.js';
import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  SubmissionProvider,
  TasksProvider,
];

export default serviceProviders;
```

`server/routes/index.ts`

```ts
import { taskRoutes } from './tasks.js';
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';

const routes: readonly AppRouteContribution<Application>[] = [taskRoutes];

export default routes;
```

After signing in, append `api/swagger/docs` to the application URL, for example `http://127.0.0.1:13000/main/api/swagger/docs`. These endpoints appear under Tasks.

### 3. Implement the frontend

Add a task list, detail drawer and create/edit dialogs using the template's layouts, tables, forms and feedback components.

**Add the calendar component.** Due-date selection needs a calendar, which the template does not include. Run this in the application directory:

```bash
yes n | pnpm exec shadcn add calendar
```

It generates `client/components/ui/calendar.tsx` and installs dependencies such as `react-day-picker`. `yes n` answers no to overwrite prompts, preserving existing template components.

**Pages and routes.** Register task pages in [client/routes.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/routes.ts). `navigation` creates the sidebar entry and `authz` declares page access permissions. Creation, editing and details use child routes with their own URLs, so refresh, Back and direct links restore the corresponding interface:

<details>
<summary>Show the task route snippet</summary>

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

In the same file, register the system settings pages prepared by the template. A new application does not show user and permission management; administrators need them to add members and assign roles once business features exist:

```ts
import systemSettingsRoutes from './pages/settings/routes.js';

const routes: readonly AppClientRouteContribution[] = [
  appRoutes,
  systemSettingsRoutes,
];
```

**List.** [client/pages/tasks/index.tsx](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/index.tsx) stores search, progress, page and sorting in the URL, requests the list through `useApiClient`, and passes results to the template's `DataTable`. This snippet omits event handlers:

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

In the complete file, `onPaginationChange` and `onSortingChange` update the URL and trigger a new query. The page distinguishes an initially empty list, no filter results, loading and load failures. Clicking a title opens details.

**Details and forms.** [detail.tsx](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/detail.tsx) uses `RouteDrawer` for details, and [form.tsx](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/form.tsx) uses `RouteDialog` for creation and editing. [assignee-picker.tsx](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/assignee-picker.tsx) searches `/api/tasks/assignees`; `Calendar` and `Popover` provide date selection.

![New task dialog with title, description, assignee, due date and progress.](/assets/core/tutorials/team-tasks/task-create.png)

Saving uses `useSubmission`. This simplified logic omits field validation and error handling. Creation includes initial progress; editing submits only task details and the version read earlier:

```ts
const submission = useSubmission({
  scope: `${session?.user.id}:tasks:${taskId ?? 'new'}:form`,
});

const values = {
  title: fields.title.trim(),
  description: fields.description.trim(),
  assigneeId: fields.assignee?.id ?? null,
  dueDate: fields.dueDate,
  ...(creating ? { status: fields.status } : { expectedUpdatedAt: version }),
};
const saved = await submission.run(values, async (key, signal, snapshot) =>
  api.request<{ data: Task }>({
    path: creating ? 'tasks' : `tasks/${taskId}`,
    method: creating ? 'POST' : 'PATCH',
    json: snapshot,
    headers: { 'Idempotency-Key': key },
    signal,
  }),
);
```

When the save result is uncertain, such as after a network interruption, `useSubmission` retains the original input and operation key. A retry uses the same key to avoid duplicate creation. Validate the form on submission, show errors beside fields, preserve input on failure and prevent duplicate submissions while saving.

**Task actions.** [task-actions.tsx](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/task-actions.tsx) centralizes editing, progress updates and deletion for each row's action menu. Each returned task includes `permissions`; unauthorized actions are hidden, and deletion requires confirmation.

**English and Chinese copy.** Keep copy in [client/locales/tasks.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/locales/tasks.ts) and add it to both languages' resources. Components use translation keys such as `t('tasks.title')`:

```ts
// client/locales/en-US.ts
import { tasksEn } from './tasks.js';

const enUS = {
  ...systemEnUS,
  tasks: tasksEn,
  ...fileUi,
};

// client/locales/zh-CN.ts
import { tasksZh } from './tasks.js';

const zhCN: AppResource = {
  ...systemZhCN,
  tasks: tasksZh,
  ...fileUi,
};
```

### 4. Integrate permissions

Check permissions at three levels: entering the task page, performing actions and accessing particular tasks. Showing or hiding frontend entries and buttons improves usability; the server enforces restrictions on every request.

**Declare actions and data access.** [server/tasks/permissions.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/permissions.ts) declares five actions: read, create, edit, progress and delete. Each can only read or write specified fields. It also declares an “assigned to me” data scope where `assigneeId` equals the current user:

<details>
<summary>Show permission declarations</summary>

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

The `TasksProvider` from step 2 registers these declarations with the authorization service at startup.

**Use policies in the service.** The route's `gate` calls this method to obtain the user's policy for the action and reject unauthorized callers:

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

The policy includes data access restrictions. Every service query and write applies it, including detail reads:

```ts
const row = await this.db
  .repository('tasks')
  .withPolicy(policy)
  .findOne({ filter: { id } });
```

Members cannot read or modify another person's task even if they know its ID and call the API directly.

**Initialize three roles.** Create them with a seed:

| Role | Actions | Data access |
| --- | --- | --- |
| Task manager | All actions | All tasks |
| Task member | Read and update progress | Tasks assigned to the member |
| Task reader | Read | All tasks |

The seed only writes a role when it does not exist. Startup does not overwrite later administrator changes or automatically assign these roles to anyone:

<details>
<summary>Show role initialization</summary>

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
export default defineSeed({
  name: '202610250102_task_roles',
  transaction: true,
  async run({ query }) {
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
  },
});
```

</details>

See the complete [database/main/seeds/202610250102_task_roles.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/database/main/seeds/202610250102_task_roles.ts) file.

**Show actions in the permission editor.** Add task actions to the business operations in [client/pages/settings/permission-workspace.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/settings/permission-workspace.ts), allowing administrators to adjust each role's actions and data access. A task does not yet exist during creation, so creation needs no data scope selector; hide it with `hiddenActionScopes`:

```ts
business: [
  {
    type: 'composite',
    id: 'tasks',
    actions: ['read', 'create', 'edit', 'progress', 'delete'],
    hiddenActionScopes: { create: ['tasks'] },
  },
],
```

Task child pages have no menu titles. Give them names for the permission editor in [client/pages/settings/page-permission-titles.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/settings/page-permission-titles.ts):

```ts
export const pagePermissionTitles: PagePermissionTitles = {
  taskCreate: 'tasks.new',
  taskEdit: 'tasks.edit',
  taskDetail: 'tasks.detail',
  taskDetailEdit: 'tasks.edit',
};
```

![Three task roles in permission management.](/assets/core/tutorials/team-tasks/roles.png)

### 5. Write tests

Keep tests in `tests/` and use the template's test configuration to run the real application on isolated databases. This example adds the tests below; see the complete [tests directory](https://github.com/nocobase/docs-examples-v3/tree/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/tests):

```tree
tests/
├── database/
│   └── tasks-migration.test.ts   # Fields and indexes after creation; table removal after rollback
├── server/
│   └── tasks.test.ts             # CRUD, validation, version conflicts, roles, data access and replay
├── client/
│   └── tasks.test.tsx            # Validation, single saves, retained input and read-only actions
└── playwright/
    └── tasks.test.ts             # Task operations, filters, pagination and role-based browser flows
```

After adding task pages and system settings, update the initial route and service assertions in the template's `tests/client/client-routes.test.ts`, `tests/client/foundation-integration.test.ts` and `tests/server/app-server.test.ts`.

Run database, server and client tests without starting the application first:

```bash
pnpm test
```

Before committing, run `pnpm check`, which runs package checks, lint, formatting checks, type checks, tests and the build in sequence.

Browser tests need a separately running test application. Install Chromium before the first run:

```bash
pnpm exec playwright install chromium
```

Set `TUTORIAL_ORIGIN` to the test application's origin without `/main`. If its administrator credentials differ from `nocobase` / `admin123`, specify `TUTORIAL_USERNAME` and `TUTORIAL_PASSWORD`:

```bash
TUTORIAL_ORIGIN=http://127.0.0.1:13000 pnpm exec playwright test tests/playwright/tasks.test.ts
```

The tests create tasks and four test accounts, including `taske2ealice`. Tasks are removed afterwards; accounts remain. Do not run them against an application in active use.

## Try the application

Follow the data used in the walkthrough. Screenshots and interface names below are in English. You can switch languages through the application's language menu.

### Add a member

Open **System settings → Users → New user** and add Alice. Use `alice` as the username, then enter an email and initial password. Keep the default `Member` role and add `Task member`.

`Member` is a general role with no task permissions. When checking a member's access, do not also assign `Task manager` or `System administrator`, which expand visible tasks and available actions.

### Create and assign a task

Open **Tasks → New task** and enter:

- Title: `Prepare the project kickoff`
- Description: `Draft the agenda and list the decisions to confirm.`
- Assignee: Alice
- Due date: a future date
- Progress: **To do**

After saving, the task appears in the list. Open its title and check the assignee, date and description. Edit the description, save and reopen it to confirm persistence.

![Task detail drawer with progress, assignee, due date and description.](/assets/core/tutorials/team-tasks/task-detail.png)

### Update progress

Choose **Start** from the row's action menu. Progress changes to **In progress**. Refresh the browser and confirm the task and its progress remain. Search for `kickoff` and filter by **In progress** to find it.

### Sign in as the member

In the administrator window, create another task, `Review the project budget`, leaving its assignee **Unassigned**. Then sign in as Alice in another browser or a private window:

1. Only `Prepare the project kickoff` appears; `Review the project budget` is hidden.
2. Choose **Mark as done** from the action menu. Progress changes to **Done**. Alice can update progress but cannot create, edit or delete tasks.
3. Refresh the administrator window and confirm the task now shows **Done**.

To check read-only access, add another account, keep `Member` and add only `Task reader`. It should see both tasks without being able to create or modify them.

**Done when**: The administrator can create tasks, assign them and update progress, with data surviving refresh. Alice sees only her assigned task and can mark it done. The administrator sees Alice's update after refreshing.

### Continue refining

If behavior differs from expectations, tell the Agent the account and roles used, your actions and what you saw. For example:

```text
An account with only the task member role can still see tasks assigned to other people.
Check its roles and the server-side data access policy. Fix it and verify with the same account, confirming that only its assigned tasks are visible.
```

Describe interaction improvements directly too, such as “Clicking a title should show details first, then let me choose whether to edit.” Repeat affected operations after each adjustment.

Page checks do not replace server tests. Ask the Agent to confirm direct API requests enforce permissions and tests cover persistence and input validation. See [Testing and acceptance](../developing-apps/testing-and-acceptance.md).

## Example source

The complete application is in [nocobase/docs-examples-v3/apps/team-tasks](https://github.com/nocobase/docs-examples-v3/tree/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks), pinned to commit `0185e4bfa9d7ef05dd180245005a6c1024fe41de`, based on default template `1.0.0-beta.84` and verified on SQLite. Its [README](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/README.MD) provides setup, a source map and test commands. The [walkthrough findings](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/docs/walkthrough.md) record observed issues, fixes and unverified areas, including PostgreSQL, MySQL and deployment.

<details>
<summary>Get and run the complete application</summary>

Prepare Node.js 24 and pnpm 11.7. Fetch the code in a new directory without overwriting your current project:

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 0185e4bfa9d7ef05dd180245005a6c1024fe41de
cd apps/team-tasks
pnpm install --frozen-lockfile
pnpm nocobase config init
pnpm nocobase config set i18n.defaultLocale=en-US
pnpm nocobase config check
pnpm dev
```

Choose SQLite during `config init` to match the walkthrough. `i18n.defaultLocale=en-US` sets English as the default to match the screenshots; omit it if unnecessary. Open the full `Local:` URL and sign in as the initial administrator. A fresh installation has an empty task list; follow [Try the application](#try-the-application) to add members and tasks. Configuration, databases and screenshot sample data are not distributed with the source.

</details>

## Troubleshooting

| Symptom | Action |
| --- | --- |
| The browser cannot find the page | Use the complete `Local:` URL printed by `pnpm dev`, including the port and trailing `/main/`. An occupied default port is replaced automatically |
| Access is needed from other devices on the LAN | Set `APP_SERVER_HOST=0.0.0.0` and `APP_SERVER_PORT` in `.env.local`, then run `pnpm nocobase config set app.publicOrigin=http://<lan-ip>:<port>`. Match the actual port printed by `pnpm dev` |
| Creating a user reports `Username is invalid` | Use letters and digits only, such as `alice`. Hyphenated usernames cause an error in this version |
| A member cannot see the task menu | Confirm `Task member` is assigned. `Member` alone does not grant task access |
| A member sees tasks not assigned to them | Check for `Task manager`, `Task reader` or `System administrator`. Keep only `Member` and `Task member`, then retry |
| Saving reports that someone else modified the task | Another window or user changed it first. Reload the latest task before saving; the draft is retained |
| A direct write request returns `400` | Creation, editing, progress updates and deletion require `Idempotency-Key`. Page forms supply it automatically |
| Saving times out on SQLite | Obtain authorization policies before opening the transaction. Inside it, use `users.withConnection(transaction)` so the user service uses the same connection rather than the outer one |
| `.agents/skills/` is missing | Run `pnpm nocobase skills sync` in the application directory |

## Next steps

- [Choose a deployment method](../deployment/choose-a-deployment-method.md): after tests pass, deploy with Docker or PM2. Verify sign-in, task actions, role permissions and persistence after a restart.
- [Develop with an Agent](../developing-apps/develop-with-an-agent.md): describe requirements, split tasks and check results.
- [Authentication, permissions and data access](../developing-apps/authentication-and-permissions.md): explore page authorization, business actions and data access.
- [Testing and acceptance](../developing-apps/testing-and-acceptance.md): use fixtures, isolated databases and browser verification.
