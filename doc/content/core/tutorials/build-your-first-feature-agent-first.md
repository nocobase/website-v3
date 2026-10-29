---
title: Build your first app (Agent-first)
description: Build a team task app with an AI agent, create and assign tasks, set due dates, and try different member permissions.
---

Build a team task app you can use: create tasks, assign owners, set due dates, and track progress. The app also supports search, filtering, and pagination, with different permissions for managers, members, and readers.

![Team task list with assignees, due dates, progress, and pagination.](/assets/core/tutorials/team-tasks/task-list.png)

This tutorial uses an AI agent to develop the app. Get it running, then try a round of task collaboration yourself. Read the optional implementation walkthrough afterward to understand the code.

## 1. Prepare the project

Follow [Create an app](../getting-started/create-app.md) to prepare a NocoBase 3 development project that runs and supports sign-in. Open a Coding Agent session in the application root and make sure it can read `AGENTS.md` and `.agents/skills/`. These files provide guidance for the installed version. If they are missing, see [Develop with an agent](../developing-apps/develop-with-an-agent.md).

This walkthrough used Node.js 24, pnpm 11.7, default template `1.0.0-beta.84`, and SQLite. For a new project, follow the guidance shipped with its installed version.

Open the complete `Local:` URL printed by `pnpm dev`, including any `/main/` base path. For LAN access, ask the agent to configure the listening host and port and set `app.publicOrigin` to the actual origin. Development startup may select another available port, so check its output.

## 2. Ask the agent to build the app

Send the following request to the agent:

```text
Build a team task app with a title, description, assignee, due date, and status: todo, in progress, or done.
Support creation, details, editing, deletion, search, status filters, pagination, and English and Chinese UI text.
Managers can manage all tasks; members can only view and update progress on their assigned tasks; readers can only view all tasks.
Provide user and role administration so I can add test members and assign roles.
Follow the project's AGENTS.md and Skills to develop and test the app, preserving existing features and data.
Start the app and report its URL, how to prepare test accounts and roles, check results, and anything not verified.
```

The agent uses project guidance to add pages, a table, APIs, and permissions. Supply any database or startup configuration needed for your project. When it finishes, open the URL it provides and sign in with the project's configured initial administrator.

The same request can produce different layouts and file structures. The steps below use the app built during this walkthrough, with English screenshots and matching sample data. Follow the equivalent buttons and pages in your app.

## 3. Try task collaboration

### Prepare a member

Open **System settings → Users → New user**. Add Alice with username `alice`, an email, and an initial password. In **Permission sets**, keep the default `Member` and add `Task member`. Keep the sign-in details ready for another browser or private window.

`Member` is a general role and receives no task access automatically in this example. Do not also assign `Task manager` or `System administrator` when checking member restrictions: their grants expand access. The three task roles are `Task manager`, `Task member`, and `Task reader`.

### Create and assign a task

Open **Tasks → New task** and create a task:

- Title: Prepare the project kickoff.
- Description: Draft the agenda and list the decisions to confirm.
- Assignee: Alice.
- Due date: A future date.
- Status: To do.

After saving, confirm the task appears in the list. Open its title and check the assignee, date, and description. Edit the description, save, and reopen the task to confirm the change.

![Task form with title, description, assignee, and due date.](/assets/core/tutorials/team-tasks/task-create.png)

### Update progress and confirm persistence

Choose **Start** from the task row's actions menu. The status changes to **In progress**. Refresh the browser. Confirm both the task and its new status remain. Search for “kickoff” and filter by In progress to find the task again.

![Task detail drawer showing status, assignee, due date, and description.](/assets/core/tutorials/team-tasks/task-detail.png)

### Switch accounts to check permissions

Keep the administrator window open and create **Review the project budget**, leaving its assignee as **Unassigned**. Sign in as the member in another browser or private window:

1. Open the task list. “Prepare the project kickoff” should be visible, but “Review the project budget” should not.
2. Choose **Mark as done** from the assigned task’s actions menu. The status changes to **Done**. The member should be able to update progress, but not edit task details or delete the task.
3. Return to the administrator window and refresh. Confirm the status is now Done.

To try the reader role too, create another ordinary account with the default `Member` plus `Task reader`, without other task roles. It should see both tasks but have no create or edit access.

![Permission management with the three task roles.](/assets/core/tutorials/team-tasks/roles.png)

### Refine the app from your experience

If behavior differs from your expectations, tell the agent which role you used, what you did, and what happened. For example:

```text
I signed in with an account that has only the task member role, but I can still see tasks not assigned to me.
Check the record scope permissions, fix the issue, add a regression test, and tell me how to verify it again.
```

You can also request interaction changes, such as opening details before deciding whether to edit. Repeat the affected steps after each change.

## 4. Confirm completion and keep building

**Done when**: You can create and assign tasks, update progress, and retain the data after refreshing. Members see only their assigned tasks and can update progress; administrators can see those updates.

Ask the agent to summarize the files changed, tests actually run, results, and anything not verified. Trying the UI does not replace server authorization tests. Have the agent confirm that direct API requests also enforce permissions and that tests cover persistence and input validation. See [Testing and acceptance](../developing-apps/testing-and-acceptance.md) for test organization and commands.

You have now built your first app and completed its basic walkthrough. Continue adding business features with the agent. When preparing to go live, follow [Choose a deployment method](../deployment/choose-a-deployment-method.md) and complete the checks needed for deployment. The remaining sections are optional implementation reading.

## Implementation walkthrough (optional)

This section explains how the example connects UI actions to data and permissions, helping you understand the agent's changes. You do not need to copy these excerpts to complete the walkthrough above.

> [!NOTE]
> The code and screenshots below use default template `1.0.0-beta.84`; see [Example source](#example-source). Your app should follow its own project guidance and public APIs. Layout, file organization, and specific validation rules may differ.

### Pages and navigation

The default template supplies the application shell, sign-in, and foundational services. The task feature reuses these and registers a page and sidebar entry in `client/routes.ts`:

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

`navigation` creates the menu entry, `componentLoader` loads the page, and `authz` declares page access permissions. This excerpt omits child routes. Actual URLs may include a base path such as `/main/`, handled by the runtime.

The list uses the existing `PageContainer`, `PageHeader`, and `DataTable`. Search, status, pagination, and sorting are stored in the URL so they survive navigation to details and back. The API filters and paginates data on the server.

See the [page routes](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/routes.ts) and [task list](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/index.tsx).

### Details and forms

`detail.tsx` uses `RouteDrawer` for details, and `form.tsx` uses `RouteDialog` for creation and editing. Drawers and dialogs have their own routes so refresh, browser Back, and direct links can restore the corresponding UI.

The form uses existing inputs, a user picker, and a calendar. It saves through `useApiClient` and updates the UI with the returned data. This is the request excerpt:

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

`submission` comes from `useSubmission`. After an uncertain response, it retains the original input and operation key for retry. The server uses `executeIdempotentMutation` to commit the task write and receipt in one transaction, preventing duplicate creation.

Editing task details and updating progress are separate actions, allowing progress permission to be granted independently. Failed saves retain input, pending saves prevent repeated clicks, and deletion requires confirmation. English and Chinese text lives in `client/locales/tasks.ts` and is merged into the application's language resources.

See the [form](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/form.tsx), [details](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/detail.tsx), and [task actions](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/task-actions.tsx).

### Table and APIs

Tasks are stored in a new `tasks` table. Users and sign-in continue to use built-in capabilities.

| Field | Purpose |
| --- | --- |
| `id` | Server-generated task identifier |
| `title`, `description` | Title and description |
| `status` | Todo, in progress, or done |
| `assigneeId`, `dueDate` | Optional assignee and due date |
| `createdAt`, `updatedAt` | Creation and update times |

A migration declares the table structure, and tooling generates Collection files. `server/tasks/schemas.ts` defines input validation, `service.ts` handles business logic, and `server/routes/tasks.ts` exposes list, detail, and write endpoints. This example requires nonempty trimmed titles of at most 120 characters and descriptions of at most 2,000 characters. Assignees must be valid users, and due dates must be valid calendar dates.

The service and routes are added to `server/providers/index.ts` and `server/routes/index.ts` so they load with the application. Routes validate requests with `apiValidator()` and declare API documentation with `describeRoute()`. The service accesses the database through a Repository.

See the [migration](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/database/main/migrations/202610250101_create_tasks.ts), [validation](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/schemas.ts), [service provider](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/providers/tasks.ts), and [HTTP routes](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/routes/tasks.ts).

### Roles and record scopes

The example registers the template's prepared user and permission administration pages and declares five task actions: read, create, edit, update progress, and delete.

| Role | Allowed actions | Record scope |
| --- | --- | --- |
| Task manager | All task actions | All tasks |
| Task member | Read and update progress | Assigned tasks |
| Task reader | Read | All tasks |

A role seed provides initial configuration, after which administrators assign roles to specific users. It does not overwrite administrator changes on each startup or automatically grant task access to every signed-in user.

The UI displays permitted actions, while the server independently authorizes requests. After obtaining the current user's policy, the service applies it to every read and write. For example, reading details uses:

```ts
const row = await this.db
  .repository('tasks')
  .withPolicy(policy)
  .findOne({ filter: { id } });
```

Knowing another task's ID therefore does not bypass the member's record scope. See [permissions](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/permissions.ts), the [task service](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/service.ts), and [role initialization](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/database/main/seeds/202610250102_task_roles.ts).

### Further verification

The example also handles failed saves, repeated clicks, and stale edits. When multiple people edit a task, requests carry the version originally read. A changed version returns `409` and asks the user to reload, preventing silent overwrites. These behaviors are useful to understand as you refine the app.

For deeper checks, use [Testing and acceptance](../developing-apps/testing-and-acceptance.md) and the [example tests](https://github.com/nocobase/docs-examples-v3/tree/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/tests) to verify migrations, API authorization, retained input after failures, and edits from two windows. Concurrency details and target database behavior need verification in your actual environment. The example does not establish that these checks ran in your app.

## Example source

The complete application is in [nocobase/docs-examples-v3/apps/team-tasks](https://github.com/nocobase/docs-examples-v3/tree/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks) at commit `0185e4bfa9d7ef05dd180245005a6c1024fe41de`. The application [README](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/README.MD) provides setup, a source map, and test commands. The [walkthrough findings](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/docs/walkthrough.md) record fixes and unverified areas. Inline excerpts explain key implementation details; complete files include imports, registration, and error handling.

<details>
<summary>Get and run the complete application</summary>

With Node.js 24 and pnpm 11.7 available, obtain the code in a new directory to avoid overwriting your development project:

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

The example uses dependencies published on npmjs.org, with versions pinned by its lockfile. Open the full `Local:` URL printed in the terminal and sign in with the application's configured initial administrator. Create test members and assign task roles in user management. Runtime configuration, the database, and screenshot sample data are not distributed with the source.

</details>

## Related documentation

- [Develop with an agent](../developing-apps/develop-with-an-agent.md): maintain project rules, describe requirements, and review delivery.
- [Testing and acceptance](../developing-apps/testing-and-acceptance.md): fixtures, isolated databases, and browser verification.
- [Choose a deployment method](../deployment/choose-a-deployment-method.md): prepare deployment after acceptance.
