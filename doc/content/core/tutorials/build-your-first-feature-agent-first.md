---
title: Build your first app with an AI agent
description: Develop a team task app with an AI agent, understand each UI and code change, and check implementation quality with project rules, code review, and real tests.
---

Build a team task application for creating tasks, assigning owners, setting due dates, and tracking progress, with role-based access to records and actions.

![Tasks page with search and status filters above the table, row actions on the right, and pagination below.](/assets/core/tutorials/quickstart/task-list.png)

Before starting, follow [Create an app](../getting-started/create-app.md) to prepare a NocoBase 3 development project that runs and supports sign-in. Use the prompt to build the feature, then examine its UI and code and verify data, permissions, and interactions.

## Use an AI agent

Open a Coding Agent session in the application root and send the prompt below. The project's `AGENTS.md` and `.agents/skills/` provide development guidance for its installed version. If that guidance is missing, see [Develop with an agent](../developing-apps/develop-with-an-agent.md).

```text
Follow this project’s AGENTS.md and relevant Skills to build a team task app.
Tasks have a title, description, assignee, due date, and status: todo, in progress, or done.
Require nonempty trimmed titles of at most 120 characters; descriptions allow 2,000. Assignee and due date are optional.
Support lists, details, creation, editing, deletion, search, status filters, sorting, pagination, and English and Chinese copy.

Managers manage all tasks; members only view and update progress on assigned tasks; readers can view all tasks but cannot write.
Provide user and role administration, assigning business roles to explicit test users.
Preserve existing features and data. Keep input after failed saves and prevent silent overwrites between editors.

Run relevant tests and start the app. Report its URL, how to use test roles, the main changes, and verification results.
Explicitly identify anything you could not verify.
```

Open the actual application URL supplied by the agent. Create a task, assign an owner and date, change its progress, and refresh. Then use the implementation sections below to review the UI, code, and verification results.

## Principles and implementation

Each section connects a visible change to its implementation and verification. Project guidance helps the agent select APIs for the installed version; server validation, authorization policies, and tests check the resulting behavior.

> [!NOTE]
> Code and screenshots use default template `1.0.0-beta.81`; see [Example source](#example-source) for the complete implementation. Other application versions should follow their own guidance and public APIs. Layout and file organization can differ while meeting the same business rules and verification requirements.

### 1. Application structure and change scope

The default template supplies the application shell, sign-in, and foundational services. Task management adds business pages, a table, APIs, and permission declarations, and connects the prepared administration pages.

| Area | Implementation | What users can do |
| --- | --- | --- |
| Sidebar | Declare Tasks navigation in `client/routes.ts` | Enter the task list from the existing application |
| Task list | Add `client/pages/tasks/index.tsx` | Search, filter, sort, paginate, and see owners and progress |
| Details and forms | Add `detail.tsx`, `form.tsx`, and supporting components | Inspect, create, and edit tasks |
| System settings | Register prepared user and permission routes; extend task permission configuration | Add members, assign roles, and adjust task access |
| Server and database | Add a task migration, service, routes, and permission declarations | Persist page operations under authorization policies |

These changes belong to the application's source. The example keeps the existing layout, sign-in pages, and user system; the business feature does not require a separate shell or authentication implementation.

**Verify it.** Compare changed files and registration points with the table. Existing routes and service contributions should remain, and new pages and endpoints should be accessible. Use `git status --short` to include new files and `git diff` to inspect tracked changes. See [Develop with an agent](../developing-apps/develop-with-an-agent.md) for maintaining project rules.

### 2. Task list and navigation

The sidebar gains a Tasks entry. Its page has create and refresh buttons, title search, a status filter, and a table. Columns show the title, status, assignee, due date, and update time, with pagination below.

**Route changes.** Add the task route to `defineAppRoutes()` in `client/routes.ts`. This excerpt shows the entry; child routes are declared separately:

```ts
{
  name: 'tasks',
  path: '/tasks',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'tasks' }, action: 'access' },
  navigation: { title: 'tasks.title', icon: ListTodo, order: 10 },
  componentLoader: () => import('./pages/tasks/index.js'),
}
```

`navigation` generates the sidebar entry, `componentLoader` loads the page, and `authz` identifies its access permission. Adding this entry primarily changes the route declaration, without rewriting the sidebar. `/tasks` is application-relative; the runtime handles deployment prefixes such as `/main/`.

**List changes.** `client/pages/tasks/index.tsx` uses the existing `PageContainer`, `PageHeader`, and `DataTable` components, requesting tasks through `useApiClient`. It configures server pagination and sorting:

<details>
<summary>Expand pagination and sorting configuration</summary>

```tsx
<DataTable
  columns={columns}
  data={result.data}
  getRowId={(row) => row.id}
  manualPagination
  rowCount={result.meta.total}
  paginationState={pagination}
  manualSorting
  sortingState={sorting}
  loading={loading}
/>
```

</details>

In the complete file, pagination and sorting callbacks update the URL and trigger queries. Search, status, page, and sort order stay in the URL so returning from details restores them. The database also counts matching records and adds task ID as a sort condition to resolve equal dates consistently.

The list distinguishes an empty application from a search with no matches and offers appropriate actions for each. It cancels requests and checks request generations so older responses cannot replace current results after rapid filter changes.

See the [page routes](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/routes.ts) and [task list](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/index.tsx).

**Verify it.** Search and change pages, open details, then return or refresh and confirm the conditions remain. Switch filters rapidly and check that the final results match the current filter. Check both empty states, narrow layouts, and English and Chinese interfaces.

### 3. Details and editing interactions

Clicking a task title opens a right-hand drawer with its status, assignee, due date, update time, and description. The list remains behind it. Create and edit use dialogs with a searchable assignee picker and a calendar.

![Task detail drawer with edit, task actions, and a return-to-list action in the footer.](/assets/core/tutorials/quickstart/task-detail.png)

**Page composition.** `detail.tsx` uses `RouteDrawer`. `form.tsx` uses `RouteDialog` and serves both creation and editing. `assignee-picker.tsx` selects users, while `task-actions.tsx` groups editing, progress, and deletion.

Each interface has an application-relative path:

| Path | Interface |
| --- | --- |
| `/tasks` | Task list |
| `/tasks/new` | Create dialog over the list |
| `/tasks/:taskId` | Detail drawer |
| `/tasks/edit/:taskId` | Edit dialog opened from the list |
| `/tasks/:taskId/edit` | Edit dialog opened from details |

Matching routes to interfaces gives refresh, browser Back, and direct links defined behavior. The list renders child routes, and the detail page also renders a child outlet for editing.

**Form changes.** Opening an edit dialog makes `form.tsx` reload the task and retain its fields and `updatedAt`. Creation submits an initial status; editing submits task details and the version that was read:

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

Keeping progress in a separate action prevents a title edit from overwriting someone else's recent status update. It also allows members to receive progress permission alone.

![Task form using existing inputs for title, description, assignee, and due date; creation also allows an initial status.](/assets/core/tutorials/quickstart/task-create.png)

**Interaction safeguards.** A submission guard prevents the current form from sending repeated saves. Buttons and closing are blocked during a save. Failures retain drafts and associate errors with fields. Discarding unsaved changes requires confirmation. Before deletion, the example reads the current task and names it in a confirmation dialog.

After a successful save, the page first updates the list with the returned task, then queries again. A query failure reports that saving succeeded and keeps confirmed data visible, reducing the risk of someone submitting again after mistaking a failed refresh for a failed creation.

Copy lives in `client/locales/tasks.ts`, merged into `en-US.ts` and `zh-CN.ts`. Buttons, field errors, and permission labels all need translations, beyond the page title.

See the [form](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/form.tsx), [details](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/detail.tsx), and [task actions](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/client/pages/tasks/task-actions.tsx).

**Verify it.** Fail a save request before it writes in the test environment, checking that the draft and error remain visible. Restore the request, retry, and query the server to confirm exactly one new task. In a separate check, let saving succeed but fail the following list query; confirmed data should remain visible. Delay the save response and click repeatedly to check that the form sends one write request.

<details>
<summary>Inspect assertions for a failed save and retry</summary>

The example uses `beforeRequest` to fail transport while retaining the real application, authentication, and database. These excerpts from the [component test](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/tests/client/tasks.test.tsx) follow entering a title and failing its save, then restoring requests and retrying:

```ts
expect(title).toHaveValue('Write the project brief');
// After restoring the request and clicking Create to retry:
const response = await view.session.fetch('/tasks');
expect(await response.json()).toMatchObject({ meta: { total: 1 } });
```

These check both input and persistence. An assertion that the save function was called cannot establish that the data is correct.

</details>

### 4. Task table and HTTP APIs

Add `database/main/migrations/202610250101_create_tasks.ts` to create `tasks`:

| Fields | Stored data | Business constraints |
| --- | --- | --- |
| `id` | Task identifier | Generated on the server |
| `title`, `description` | Title and description | Require a trimmed title of at most 120 characters; description allows at most 2,000 |
| `status` | Progress | `todo`, `inProgress`, or `done` |
| `assigneeId` | Existing user ID | Optional; validate through the user service when supplied |
| `dueDate` | Due date | Optional `YYYY-MM-DD` calendar date |
| `createdAt`, `updatedAt` | Creation and update time | Generated on the server; update time also acts as an edit version |

The migration declares fields, defaults, and query indexes. Tools generate Collection files. After adding the migration, preview and apply changes from the application directory:

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
pnpm nocobase collections doctor
```

Migrations manage schema changes while preserving existing tables and data; tools maintain generated Collections. Later changes to released schema use new migrations rather than rewriting executed history. Tests or actual use create demonstration tasks; required initialization seeds do not contain them.

**Server changes.** Add `server/tasks/schemas.ts`, `service.ts`, and `server/routes/tasks.ts` for input definitions, business behavior, and HTTP requests. Task endpoints include:

| Endpoint, relative to the application's API base | Purpose |
| --- | --- |
| `GET /tasks` | Search, filter, sort, and paginate accessible tasks |
| `POST /tasks` | Create a task |
| `GET /tasks/:id` | Read details |
| `PATCH /tasks/:id` | Edit title, description, assignee, and date |
| `PATCH /tasks/:id/status` | Update progress |
| `DELETE /tasks/:id` | Delete a task, with a version query parameter |
| `GET /tasks/assignees` | Query valid assignees |

Editing, progress, and deletion also have endpoints to read the current record, such as `GET /tasks/:id/edit`. Each read uses the corresponding action's authorization.

The task subrouter installs its authentication and authorization middleware, validates requests with `apiValidator()`, and declares API documentation with `describeRoute()`. The server generates IDs and timestamps, checks assignees, and writes through a Repository. The frontend displays the confirmed result from `{ data }`.

**Registration changes.** `server/providers/tasks.ts` resolves database and user services from the container and registers `TaskService` and task permission declarations. Add it to `server/providers/index.ts`, and add task routes to `server/routes/index.ts`. Creating a class or route file without registering it does not load it into the application.

See the [migration](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/database/main/migrations/202610250101_create_tasks.ts), [service Provider](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/providers/tasks.ts), and [HTTP routes](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/routes/tasks.ts).

**Verify it.** Test migration application, rollback, and reapplication in an isolated database. Create a task through the real API, read it back, and compare fields. The record should survive refresh and application restart. Check the application's API document for the new endpoints to confirm Provider and route registration.

### 5. Roles and record permissions

Task management needs member and access administration. The example registers the prepared `systemSettingsRoutes` in `client/routes.ts`, exposing Users and Permission management in System settings and enabling task role administration.

![Permission management showing Task manager, Task member, and Task reader roles.](/assets/core/tutorials/quickstart/roles.png)

`server/tasks/permissions.ts` declares `read`, `create`, `edit`, `progress`, and `delete`, plus an assigned-to-me record scope. `client/pages/settings/permission-workspace.ts` adds these actions to the permission editor. The seed `database/main/seeds/202610250102_task_roles.ts` supplies initial grants:

| Role | Actions | Tasks |
| --- | --- | --- |
| Task manager | Read, create, edit, update progress, delete | All tasks |
| Task member | Read, update progress | Assigned tasks |
| Task reader | Read | All tasks |

Administrators assign these roles to specific users. Initialization preserves existing roles instead of overwriting administrator changes at startup, and does not automatically grant task access to everyone who signs in.

**How permissions constrain data.** `TaskService.policy()` resolves database policy for the current user and action, rejecting requests without a policy. Lists, totals, details, and writes all carry it. The central read call is:

```ts
const row = await this.db
  .repository('tasks')
  .withPolicy(policy)
  .findOne({ filter: { id } });
```

Even with another person's task ID, members can only query their authorized records. Hiding unavailable buttons improves the interface; the server still checks every request. Verify this with ordinary accounts and inspect additional role grants. Administrator-only testing cannot establish these boundaries.

See the [permission declarations](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/tasks/permissions.ts) and [role initialization](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/database/main/seeds/202610250102_task_roles.ts).

**Verify it.** Use ordinary accounts without extra grants: a user without a business grant receives `403`; a member requesting another person's task details or progress receives `404`; a reader making a direct write receives `403`. Read again after failed writes to confirm unchanged data. Run the authorization initialization test to check that task roles are not granted to everyone who signs in.

### 6. Input validation and concurrent updates

After checking normal page interactions, inspect what happens when the API receives invalid input. `schemas.ts` validates lengths, statuses, calendar dates, and query bounds on the server. For example, `2026-02-30` is rejected even though it matches the date string format.

Editing details and updating progress use separate strict input objects that reject unrelated fields:

```ts
export const editTask = taskDetails.extend({
  expectedUpdatedAt: z.iso.datetime(),
});
export const progressTask = z.strictObject({
  status: taskStatus,
  expectedUpdatedAt: z.iso.datetime(),
});
```

`taskDetails` contains only title, description, assignee, and due date. Client validation gives immediate feedback; server validation rejects requests that bypass the page.

**Rejecting stale versions.** Edit, progress, and delete requests carry the `expectedUpdatedAt` from their read. In a transaction, `TaskService.change()` loads an authorized record, compares versions, and constrains the write by both ID and version:

<details>
<summary>Expand the conditional version update</summary>

```ts
const filter = buildFilter((f) =>
  f.and([
    f.string('id').eq(id),
    f.date('updatedAt').notBefore(row.updatedAt),
    f.date('updatedAt').notAfter(row.updatedAt),
  ]),
);
const result = await repository.updateOne({
  filter,
  values: {
    ...values,
    updatedAt: new Date(Math.max(Date.now(), row.updatedAt.valueOf() + 1)),
  },
});
```

</details>

This excerpt runs inside the transaction. `repository` already has its policy and `row` has passed the version comparison. Keeping a version condition on the write detects changes after the read. The timestamp advances by at least one millisecond to avoid reusing the previous version. A version mismatch or a conditional write that finds no record becomes `409`; the page requires a reload before editing continues.

Version checks protect concurrent edits; the submission guard protects repeated clicks in the current form. Automatic retries or duplicate creates from multiple clients need a server-side idempotency design. Database lock waits and truly simultaneous writes also need validation against the target database.

See the [input schemas](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/tasks/schemas.ts) and [task service](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/server/tasks/service.ts).

**Verify it.** Bypass the form and submit a blank title or `2026-02-30`; expect a validation error with no record written. Read a task in two windows, save in A, then submit B's old version. B should receive `409`, and reading again should show A's result. Confirm discarding B's draft before reloading. Server tests use real authentication, authorization, and database operations, without replacing the decisions under test with fixed successful results.

## Checks and delivery

### Run relevant checks

Turn the verification points above into database, API, component, and browser tests. Assert business requirements; do not remove failures by broadening access, deleting assertions, or skipping cases. This command uses the pinned example's test files. Other projects should follow their configuration and confirm the expected cases actually appear in the report.

```bash
pnpm exec vitest run tests/database/tasks-migration.test.ts tests/server/tasks.test.ts tests/server/authorization-assignment-safety.test.ts tests/client/tasks.test.tsx
```

Route registration and permission labels are also checked in `tests/client/client-routes.test.ts` and `tests/client/page-permission-titles.test.ts`. Run lint, formatting, and type checks for affected code according to project guidance. This feature spans client, server, and database, so check the application build before delivery too:

```bash
pnpm typecheck
pnpm build
```

Type checking catches issues such as mismatched API parameters and return values; building checks module and artifact integration. The behavioral tests above still establish authorization and persistence. See [Testing and acceptance](../developing-apps/testing-and-acceptance.md) for test organization.

### Complete browser acceptance

Use a separate test application to perform each section's verification steps. Also complete creation, assignment, progress updates, refresh, and deletion, checking dialog focus, discard confirmation, and browser Back. See the example's [Playwright tests](https://github.com/nocobase/app-tutorials/blob/da050f4dd4d9ddc36c8585489bd002c6e01ad76f/tests/playwright/tasks.test.ts) for automation.

<details>
<summary>Expand browser test commands</summary>

Install the browser before the first run:

```bash
pnpm exec playwright install chromium
```

Start a separate test application and replace the URL and test credentials below. Tests create users and tasks. These variables belong to the pinned example; inspect a new project's own test configuration.

```bash
TUTORIAL_ORIGIN=http://127.0.0.1:13000 \
TUTORIAL_USERNAME='your-test-admin' TUTORIAL_PASSWORD='your-test-password' \
pnpm test:e2e
```

</details>

### Leave a verifiable delivery report

Ask the agent to report UI changes, changed files, key implementation decisions, and verification results, including the commands run and test scope. Identify unexecuted browser checks, untested database dialects, and remaining concurrency cases separately.

This article describes an example and verification methods; it does not establish that the checks ran in your application. After local acceptance, continue to [Choose a deployment method](../deployment/choose-a-deployment-method.md).

## Example source

The complete application is in [nocobase/app-tutorials](https://github.com/nocobase/app-tutorials/tree/da050f4dd4d9ddc36c8585489bd002c6e01ad76f) at commit `da050f4dd4d9ddc36c8585489bd002c6e01ad76f`. Repository access requires the appropriate GitHub permissions. Inline excerpts explain key implementation details; complete files include imports, registration, and error handling.

<details>
<summary>Get and run the complete application</summary>

With Node.js 24 and pnpm 11.7 available, obtain the code in a new directory to avoid overwriting your development project:

```bash
git clone --branch fix/v3-quickstart-npm https://github.com/nocobase/app-tutorials.git team-tasks
cd team-tasks
git checkout da050f4dd4d9ddc36c8585489bd002c6e01ad76f
pnpm install --frozen-lockfile
pnpm nocobase config init
pnpm nocobase config check
pnpm dev
```

The example uses dependencies published on npmjs.org, with versions pinned by its lockfile. Open the full `Local:` URL printed in the terminal and sign in with the application's configured initial administrator. Create test members and assign task roles in user management. Runtime configuration, the database, and screenshot sample data are not distributed with the source.

</details>

## Related documentation

- [Develop with an agent](../developing-apps/develop-with-an-agent.md): maintain project rules, describe requirements, and review delivery.
- [Testing and acceptance](../developing-apps/testing-and-acceptance.md): fixtures, isolated databases, and browser verification.
- [Choose a deployment method](../deployment/choose-a-deployment-method.md): prepare deployment after acceptance.
