---
title: Build your first app
description: Add task management to your existing app with an Agent, then explore the key code for its data, APIs, and pages.
---

In this guide, you'll add a task management page to the app you just created. You'll be able to create tasks, set due dates, and mark tasks as done.

![Task management page showing task titles, due dates, and progress.](/assets/core/tutorials/team-tasks/task-list.png)

The screenshot and code come from the complete task example linked below, which also includes assignees, search, and permissions. For your first try, focus on creating a task and marking it done. Your generated layout may differ from the screenshot.

## Prepare

Complete [Create an app](../getting-started/create-app.md) and confirm you can start it and sign in. Open an Agent session in that app's project directory to continue development.

## Build the app

### Describe what you need

Send this request to the Agent:

```text
Add a task management page to this app. I want to create tasks, set due dates, and mark tasks as done. When it's ready, run it so I can try it.
```

### Generate the app

The Agent adds the task table, APIs, and pages to your current project. The app's `AGENTS.md` and Skills provide implementation guidance; you describe the features you want.

If the Agent asks for details, answer based on your needs. For example, progress could use To do, In progress, and Done. Get the basic features working first and add other requirements after trying them.

### Open the app

When it's ready, open the complete URL the Agent provides and sign in with your existing administrator account. Keep the port and any path such as `/main/`.

Open the task page, create a task named “Prepare the project kickoff,” and choose a future due date. Save it, mark it as done, and refresh the page to confirm the task and its completed state are still there. You've now built your first business feature in your own app.

If something doesn't work as expected, tell the Agent what you did and what happened. For example: “I marked the task as done, but it goes back to To do when I refresh. Can you fix that?”

## Understand the generated code

Once the app is running, read this section if you'd like to know where data is stored, how page actions work, and where to start making changes.

The snippets below use the [complete task example](https://github.com/nocobase/docs-examples-v3/tree/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks) as a reference, omitting some imports, helpers, and UI code. Your Agent may generate different files and implementations; use the example to help you explore them.

### Where the code lives

These are the main files for the task feature:

```tree
database/main/migrations/
└── 202610250101_create_tasks.ts  # Task table
server/
├── routes/tasks.ts              # Task APIs
└── tasks/
    ├── schemas.ts              # Input validation
    └── service.ts              # Task reads and writes
client/
├── routes.ts                   # Page and menu registration
└── pages/tasks/
    ├── index.tsx               # Task list
    └── form.tsx                # Create and edit form
```

To change the list or form, start in `client/pages/tasks/`. To change the rules for saving a task, look in `server/tasks/`. Adding a field that must be stored also involves a database migration.

### How task data is defined

The [task migration](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/database/main/migrations/202610250101_create_tasks.ts) defines the task table through `builder.createCollection('tasks', ...)`. Here are the three fields used in your first try:

```ts
c.string('title', { length: 120, nullable: false });
c.string('status', { length: 16, nullable: false, defaultValue: 'todo' });
c.string('dueDate', { length: 10, nullable: true });
```

`title` stores the task name, `dueDate` stores its due date, and `status` stores progress. The example uses `todo`, `inProgress`, and `done` for To do, In progress, and Done, with `todo` as the default for new tasks.

By default, the app runs pending migrations at startup to apply these definitions to the database. Page fields correspond to this stored data, so saved tasks can be read again after a refresh. See [Data models and migrations](../developing-apps/data-models-and-migrations.md) for more on writing migrations.

### How creating a task works

Take the Save action you just tried and follow it from the form to the database write.

**The page submits data.** [client/pages/tasks/form.tsx](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/pages/tasks/form.tsx) gets an API client through `useApiClient`. Here is the request inside the form's submission callback:

```ts
return api.request<{ data: Task }>({
  path: creating ? 'tasks' : `tasks/${taskId}`,
  method: creating ? 'POST' : 'PATCH',
  json: snapshot,
  headers: { 'Idempotency-Key': key },
  signal,
});
```

For a new task, `creating` is true: the request uses `POST` to send the form contents, `snapshot`, to the task API. Editing uses `PATCH`. The surrounding `useSubmission` supplies the submitted values, operation key `key`, and cancellation signal `signal`. The operation key prevents retries from creating duplicate tasks.

**The backend receives the request.** Here is the creation endpoint in [server/routes/tasks.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/routes/tasks.ts). It is mounted under the task router, so its full path includes the app's base path and `/api/tasks`:

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
  apiValidator('header', z.object({ 'idempotency-key': z.string() })),
  apiValidator('json', createTask),
  async (c) => {
    return c.json(await mutation(c, 'create', c.req.valid('json')), 201);
  },
);
```

`gate('create')` checks creation permission, `apiValidator` validates the request, and `describeRoute` declares API documentation. Once validation passes, `mutation` calls the task service and handles receipts for repeated submissions.

**The service saves the data.** The `create` method in [server/tasks/service.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/server/tasks/service.ts) writes through a Repository. Here is the database write:

```ts
const result = await this.db
  .repository('tasks')
  .withPolicy(policy)
  .createOne({
    values: { ...input, id: randomUUID(), createdAt: now, updatedAt: now },
  });
```

`input` contains the validated task values; the server supplies the ID and timestamps. `withPolicy(policy)` applies the current user's permission policy to the write. The service returns the new task, and the API sends the result back to the page to complete creation.

The example uses the app's existing sign-in and authorization features. For permission rules, see [Authentication, permissions and data access](../developing-apps/authentication-and-permissions.md).

### How the task page joins the app

[client/routes.ts](https://github.com/nocobase/docs-examples-v3/blob/0185e4bfa9d7ef05dd180245005a6c1024fe41de/apps/team-tasks/client/routes.ts) registers the task page. This snippet omits the child routes for creation, editing, and details:

```ts
{
  name: 'tasks',
  path: '/tasks',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'tasks' }, action: 'access' },
  navigation: { title: 'tasks.title', icon: ListTodo, order: 10 },
  componentLoader: () => import('./pages/tasks/index.js'),
  // Child routes omitted
}
```

`path` sets the page address, `componentLoader` points to the task list component, and `navigation` configures the sidebar entry. `auth` requires sign-in, while `authz` declares page access permissions.

The list uses the template's `DataTable` to display tasks, and the form uses existing UI components to collect input. To change the layout, start with `index.tsx` and `form.tsx`. To change the menu entry, look at this route configuration. See [Components and interactions](../developing-apps/pages-and-interactions.md) for more page development examples.

## Keep developing

After trying the app, ask for one small addition:

```text
Add a search box so I can find tasks by name.
```

When it's ready, open the page and search for the task you created. You can also add progress filters, assignees, or role permissions later, working on one concrete requirement at a time.

To explore development further, see:

- [Develop with an Agent](../developing-apps/develop-with-an-agent.md): describe requirements, check results, and keep iterating.
- [Data models and migrations](../developing-apps/data-models-and-migrations.md): add fields, define relations, and adjust data structures.
- [Components and interactions](../developing-apps/pages-and-interactions.md): build tables, forms, and other page interactions.
- [Testing and acceptance](../developing-apps/testing-and-acceptance.md): verify features and permissions, and check for regressions.

### Example source

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

Choose SQLite during `config init` to match the walkthrough. `i18n.defaultLocale=en-US` sets English as the default to match the screenshots; omit it if unnecessary. Open the full `Local:` URL and sign in as the initial administrator. A fresh installation has an empty task list; follow [Open the app](#open-the-app) to create your first task. Configuration, databases and screenshot sample data are not distributed with the source.

</details>
