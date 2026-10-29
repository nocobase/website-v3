---
title: Build your first app (V2)
description: "Build a team task app with an AI Agent: create tasks, assign owners and dates, and try the permissions of different members."
---

This tutorial builds a team task app you can actually use: create tasks, assign owners, set due dates and track progress. The app supports search, filtering and pagination, and gives managers, members and readers different permissions.

![Team task list with assignees, due dates, progress and pagination.](/assets/core/tutorials/team-tasks/task-list.png)

An AI Agent does the development. You get the app running and walk through a round of task collaboration yourself; to understand the code behind it, read the implementation walkthrough afterward.

## 1. Prepare the project

Follow [Create an app](../getting-started/create-app.md) to prepare a NocoBase 3 development project that starts and lets you sign in. Open a coding Agent session in the application root and make sure it can read the project's `AGENTS.md` and `.agents/skills/`. These files provide guidance that matches the project's installed version; if they are missing, see [Develop with an Agent](../developing-apps/develop-with-an-agent.md) first.

This walkthrough used Node.js 24, pnpm 11.7, default template `1.0.0-beta.84` and SQLite. For a new project, follow the versions installed at creation and the guidance that comes with them.

To open the app, use the complete `Local:` URL printed by `pnpm dev`, keeping any base path such as `/main/`. The development port may move up when it is in use, so do not guess the address from the configured value. For access from your local network, ask the Agent to configure the listening host and port and set `app.publicOrigin` to the origin you actually use.

## 2. Ask the Agent to build the app

Send the following request to the Agent:

```text
Build a team task app with a title, description, assignee, due date, and status: todo, in progress, or done.
Support creation, details, editing, deletion, search, status filters, pagination, and English and Chinese UI text.
Managers can manage all tasks; members can only view and update progress on their assigned tasks; readers can only view all tasks.
Provide user and role administration so I can add test members and assign roles.
Follow the project's AGENTS.md and Skills to develop and test the app, preserving existing features and data.
Start the app and report its URL, how to prepare test accounts and roles, check results, and anything not verified.
```

Following the project guidance, the Agent changes pages, tables, APIs and permissions. Supply any database or startup details your project needs. When it finishes, open the URL it gives you and sign in as the project's configured initial administrator.

The same request can produce different page layouts and file structures. The steps below use the app built in this walkthrough, with English screenshots and matching English sample data. You can switch languages from the app's language menu; button names and positions depend on your app.

## 3. Try task collaboration

### Prepare a test member

Open **System settings → Users → New user** and add the test member Alice: username `alice`, plus an email and an initial password. In **Permission sets**, keep the default `Member` and add `Task member`. Note the sign-in details for use in another browser or private window later.

The example has three task roles: `Task manager`, `Task member` and `Task reader`. `Member` is a general role and does not receive task permissions automatically in this example. When you check member restrictions, do not also assign `Task manager` or `System administrator`; those roles widen the data and actions available.

### Create and assign a task

Open **Tasks → New task** and create a task:

- Title: `Prepare the project kickoff`.
- Description: `Draft the agenda and list the decisions to confirm.`
- Assignee: Alice.
- Due date: any future date.
- Status: `To do`.

After saving, confirm the task appears in the list. Click its title to open the details and check the assignee, date and description; then edit the description, save, and reopen the details to confirm the change took effect.

![Task form with title, description, assignee and due date.](/assets/core/tutorials/team-tasks/task-create.png)

### Update progress and confirm it is saved

Choose **Start** from the actions menu at the end of the task row; the status changes to **In progress**. Refresh the browser and confirm that the task and its new status are still there. Search for `kickoff` from the title, then filter by **In progress**, and confirm the task is found.

![Task detail drawer showing status, assignee, due date and description.](/assets/core/tutorials/team-tasks/task-detail.png)

### Switch accounts to check permissions

Keep the administrator window open and create another task, `Review the project budget`, leaving its assignee as **Unassigned**. Then sign in as the test member in another browser or private window:

1. Open the task list: `Prepare the project kickoff` should be visible, and `Review the project budget` should not.
2. Choose **Mark as done** from the actions menu of the member's own task; the status changes to **Done**. The member can update progress but cannot edit the task details or delete the task.
3. Go back to the administrator window and refresh, and confirm the task's status is now Done.

To try the reader role as well, create another ordinary test account with the default `Member` plus `Task reader`, without any other task role. This account should see both tasks but be unable to create or change them.

![Permission management with the three task roles.](/assets/core/tutorials/team-tasks/roles.png)

### Refine the app from what you find

When something does not behave as expected, tell the Agent which role you used, what you did and what actually happened. For example:

```text
I signed in with an account that has only the task member role, but I can still see tasks not assigned to me.
Check the record scope permissions, fix the issue, add a regression test, and tell me how to verify it again.
```

You can also ask for interaction changes, such as "clicking a title opens the details first, and I decide there whether to edit". After each change, repeat the affected steps.

## 4. Confirm completion and keep building

**Done when**: you can create tasks, assign owners and update progress, and the data is still there after a refresh; members see only the tasks assigned to them and can update their progress; administrators can see the members' updates.

Ask the Agent to summarize the files it actually changed, the tests it ran and their results, and to list separately anything not verified. Trying the pages does not replace server-side authorization tests: have the Agent confirm that direct API calls also enforce permissions, and that the tests cover data persistence and input validation. For test organization and commands, see [Testing and acceptance](../developing-apps/testing-and-acceptance.md).

You have now built your first app and tried its basics. Keep asking the Agent for more business features; when you prepare to go live, follow [Choose a deployment method](../deployment/choose-a-deployment-method.md) for the pre-deployment checks. The rest of this page is optional reading for those who want the implementation details.

## Implementation walkthrough (optional)

This section explains how the example connects UI actions to data and permissions, so you can understand the Agent's changes. You do not need to copy these excerpts to complete the walkthrough above.

> [!NOTE]
> The code and screenshots below are based on default template `1.0.0-beta.84`; the complete implementation is in [Example source](#example-source). Your app should follow its own project guidance and public APIs; its layout, file organization and validation rules may differ.

### Pages and navigation

The default template already provides the application shell, sign-in and foundational services, and the task feature reuses them. The page and its sidebar entry are registered in `client/routes.ts`:

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

`navigation` creates the menu entry, `componentLoader` loads the task page, and `authz` declares the page's access permission. The excerpt omits child routes; base paths such as `/main/` in the actual URL are handled by the runtime.

The list page uses the existing `PageContainer`, `PageHeader` and `DataTable`. The search text, status, page and sort order are kept in the URL, so they are restored when you open the details and come back; filtering and pagination happen on the server.

See the [page routes](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/routes.ts) and the [task list](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/index.tsx).

### Details and forms

`detail.tsx` shows the details in a `RouteDrawer`, and `form.tsx` shows the creation and editing form in a `RouteDialog`. The drawer and the dialog have their own routes, so refreshing, the browser's Back button and direct links all restore the matching view.

The form uses existing inputs, a user picker and a calendar. It saves by calling the task API through `useApiClient` and updates the view with the returned data. The request looks like this:

```ts
const result = await submission.run(values, (key, signal, snapshot) =>
  api.request<{ data: Task }>({
    path: creating ? 'tasks' : `tasks/${taskId}`,
    method: creating ? 'POST' : 'PATCH',
    headers: { 'Idempotency-Key': key },
    signal,
    json: snapshot,
  }),
);
```

`submission` comes from `useSubmission`. When the outcome of a save is uncertain, it keeps the original request and operation key, and a retry reuses the same key; on the server, `executeIdempotentMutation` writes the task and its receipt in one transaction, which prevents duplicate creation.

The example separates editing task details from updating progress, so members can be granted the progress permission on its own. A failed save keeps the input, a pending save blocks repeated clicks, and deletion asks for confirmation. The English and Chinese text is collected in `client/locales/tasks.ts` and merged into the application's two language resources.

See the [form](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/form.tsx), the [details](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/detail.tsx) and the [task actions](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/task-actions.tsx).

### Table and APIs

Tasks are stored in a new `tasks` table; users and sign-in keep using the built-in capabilities.

| Field | Purpose |
| --- | --- |
| `id` | Server-generated task identifier |
| `title`, `description` | Title and description |
| `status` | Progress: to do, in progress or done |
| `assigneeId`, `dueDate` | Optional assignee and due date |
| `createdAt`, `updatedAt` | Creation and update times |

A migration declares the table structure, and the tooling generates the Collection files from it. `server/tasks/schemas.ts` defines input validation, `service.ts` handles the business logic, and `server/routes/tasks.ts` exposes the list, detail and write endpoints. For example, this app requires a title that is not empty after trimming and has at most 120 characters, and a description of at most 2,000 characters; the assignee must be a valid user and the due date a valid calendar date.

The service and the routes must be added to `server/providers/index.ts` and `server/routes/index.ts` respectively before the feature loads with the application. The routes validate requests with `apiValidator()` and declare API documentation with `describeRoute()`; the service accesses the database through a Repository.

See the [migration](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/database/main/migrations/202610250101_create_tasks.ts), [input validation](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/schemas.ts), the [service provider](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/providers/tasks.ts) and the [HTTP routes](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/routes/tasks.ts).

### Roles and record scopes

The example registers the user and permission administration pages that come with the template, and declares five task actions: view, create, edit, update progress and delete.

| Role | Allowed actions | Record scope |
| --- | --- | --- |
| Task manager | All task actions | All tasks |
| Task member | View and update progress | Tasks assigned to them |
| Task reader | View | All tasks |

The role seed only provides the initial configuration, after which administrators assign the roles to specific users. It does not overwrite administrators' changes on every startup, and it does not grant task permissions to every signed-in user automatically.

The client decides which entries to show based on permissions, but the server still checks every request independently. The business service first obtains the current user's permission policy and applies it to every subsequent query and write. Reading the details, for example:

```ts
const row = await this.db
  .repository('tasks')
  .withPolicy(policy)
  .findOne({ filter: { id } });
```

So even if a member gets hold of another task's ID, they cannot bypass their record scope. See the [permission declarations](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/permissions.ts), the [task service](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/service.ts) and the [role initialization](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/database/main/seeds/202610250102_task_roles.ts).

### Further verification

The example also handles failed saves, repeated clicks and edits based on a stale version. When several people edit the same task, each request carries the version that was read; if the version has changed, the API returns `409` and asks the user to reload, instead of silently overwriting someone else's change. These behaviors matter as you keep refining the app.

For deeper checks, use [Testing and acceptance](../developing-apps/testing-and-acceptance.md) and the [example tests](https://github.com/nocobase/docs-examples-v3/tree/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/tests) to verify the migrations, API permissions, input kept after failures, and the outcome of editing one task from two windows. Concurrency details and behavior on the target database must be verified in your actual environment; the example shown here does not mean these checks have run in your app.

## Example source

The complete code is in [nocobase/docs-examples-v3/apps/team-tasks](https://github.com/nocobase/docs-examples-v3/tree/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks) at commit `0185e4bfa9d7ef05dd180245005a6c1024fe41de`. The application's [README](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/README.MD) gives the run steps, a file map and the test commands; the [walkthrough findings](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/docs/walkthrough.md) record version differences, fixes and unverified areas. The excerpts on this page only illustrate key implementation points; the complete files also contain imports, registration and error handling.

<details>
<summary>Get and run the complete application</summary>

With Node.js 24 and pnpm 11.7 ready, get the code in a new directory so you do not overwrite the project you are developing:

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

Choose SQLite when initializing the configuration to reproduce this walkthrough's environment. The example uses dependencies published on npmjs.org, with versions pinned by its lockfile. Open the complete `Local:` URL printed in the terminal, sign in as the initial administrator from the application's configuration, then add test members in user management and assign them task roles. The runtime configuration, the database and the sample data in the screenshots are not distributed with the source.

</details>

## Related documentation

- [Develop with an Agent](../developing-apps/develop-with-an-agent.md): maintain project rules, describe requirements and review what is delivered.
- [Testing and acceptance](../developing-apps/testing-and-acceptance.md): test fixtures, isolated databases and browser verification.
- [Choose a deployment method](../deployment/choose-a-deployment-method.md): prepare deployment after acceptance.
