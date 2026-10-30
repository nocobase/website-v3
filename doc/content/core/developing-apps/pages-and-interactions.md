---
title: UI components and interactions
description: Add shadcn and NocoBase UI Library components, organize business components, and implement complete list, form and dialog interactions.
---

Build business pages from existing application components, shadcn primitives, and components and blocks from the NocoBase UI Library. The application owns the source and can adapt it to its needs. Pages connect those components to data, permissions and action feedback.

## Choose and add components

### Start with existing application components

Inspect existing pages and `client/components/` to see what you can use or adapt. Use the project's shadcn components for buttons, inputs, dialogs and other primitives to keep common interactions consistent.

Add a missing primitive from the application root:

```bash
pnpm exec shadcn add button input
```

Aliases in `components.json` determine placement. When a file already exists, compare changes and preserve application customizations. See the [shadcn CLI](https://ui.shadcn.com/docs/cli#add) for command options.

### Add components and blocks from the NocoBase UI Library

The [NocoBase UI Library](https://ui.nocobase.com/) distributes editable source through shadcn UI Registry. Read an asset's description, examples and dependencies first. Blocks that use business plugins also need the corresponding plugins, APIs and permissions.

The default template configures `@nocobase` in `components.json`. If an existing project lacks it, merge this entry into `registries`, keeping its style settings, aliases and other registries:

```json
{
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  }
}
```

For example, if the application lacks the page heading component, run from the application root:

```bash
pnpm exec shadcn add @nocobase/page-header
```

This asset writes `client/components/page-header.tsx`. Import `PageHeader` from `#components/page-header` and provide a title, with an optional description and actions. Review generated files, dependencies and stylesheet changes before connecting it to a page.

Connect copy to application [translations](localization.md) and follow [theme and style conventions](themes-and-styles.md) for colors and spacing. When taking upstream updates, compare changes and preserve business customizations, especially permission checks and form behavior.

<details>
<summary>Add local UI source assets</summary>

Team-provided Registry assets can also be added locally. For example, a built asset might be available at `packages/announcements-ui/public/r/announcement-list.json` in the workspace:

```bash
pnpm exec shadcn add ./packages/announcements-ui/public/r/announcement-list.json
```

Pass the individual asset JSON containing component source, relative to the application directory where you run the command. The local file needs no HTTP server. Other Registry items and npm dependencies declared by the asset may still need network access.

To create and distribute your own assets, see [Optionally distribute UI source assets](../extension-development/frontend-components.md#optionally-distribute-ui-source-assets).

</details>

## Write and reuse business components

### Organize files by where they are used

Keep components used by one page beside that page. Move them to a shared location when several pages need them. For example:

```tree
client/
├── pages/
│   └── projects/
│       ├── index.tsx             # Page and business integration
│       └── components/           # Page-specific components (optional)
├── components/
│   ├── ui/                      # shadcn primitives
│   └── projects/                # Shared project components (optional)
├── hooks/                       # Reusable interaction logic (optional)
├── extensions/                  # Modular UI source assets (optional)
├── locales/                     # Translations
├── react-providers.ts           # Application-wide React Provider registration
└── styles.css                   # Stylesheet entry
```

`client/extensions/` can organize added UI source by module. Installation targets depend on asset declarations and project configuration. Connect files through ordinary imports; placing a file in this directory does not register a plugin, route or service.

### Assign component and state responsibilities

For a Projects page:

| Part | Responsibility |
| --- | --- |
| Page | Connect routes, permissions and data; compose headings, lists and forms |
| List component | Display records, pagination and action entry points using data and callbacks from the page |
| Form component | Maintain drafts, field errors and submission state; handle saving and cancellation |
| Business Hook | Reuse request or interaction logic with explicit initialization, reset and cleanup conditions |

Use props for data, copy and event callbacks, and Context when components need shared values. Extract components as a need emerges; business components do not all have to follow the same pattern.

A custom Hook reuses logic. Calling it more than once does not automatically share state. Search, sorting and pagination belong to URL state; API results are server state; unsubmitted input is a form draft. Refreshing a list should not reset that draft. See [Data requests and state management](data-requests-and-state.md) for implementation details.

### Use React Context and Providers

Use React Context when several components need shared selections or editing state. Compose a Provider within the relevant page or subtree when only those components need it.

Register application-wide Providers through `client/react-providers.ts`: write a component that accepts and renders `children`, then append it to the existing `defineClientReactProviders(...)` declaration with a `name`, `component` and suitable `layer`. Providers that depend on application context usually use the `application` layer. Preserve the template's existing theme and Toast declarations.

A React Provider supplies context to the component tree. A ServiceProvider in `client/service-provider.ts` registers business services in the service container and manages their lifecycle. Registering a service does not make its fields reactive React state; components still need state or subscriptions to update.

See [React Provider registration](../framework/runtime/react-providers.md) for mounting layers and ordering, and [Client business services](client-business-services.md) for business capabilities shared across pages.

## Implement list, form and dialog interactions

### Example and prerequisites

The following interfaces cover a project list, project creation and changing a task's project. The [incremental source package](/assets/core/downloads/team-tasks-pages-and-interactions.zip) contains added and modified files, a patch and instructions. It includes no configuration, accounts, database or dependencies.

To run it, first complete the historical project examples in [Create tables and initialize data](data-models-and-migrations.md) and [Routes and HTTP APIs](apis-and-services.md), retaining their migrations, services, routes and permissions. The baseline is `@nocobase/app-template-default@1.0.0-beta.78`, with no additional plugin required. **The incremental package does not apply to the current getting-started example's `tasks` table and three-stage progress.** Review the patch before merging it into an application with custom changes.

In **System settings → Permission management**, configure a role with Projects page access and view/create actions, plus Tasks page access and the action to change a task's project. Set separate task and project scopes for assignment, then assign the role to specific users through user management. Page access does not grant data operations, and viewing a project does not grant permission to assign a task to it. The server must authorize every request independently.

This example includes no project details, deletion or approval flow. Saves use last-successful-write-wins behavior without a concurrency version check. Search matches names by containment, and sorting uses creation time; it does not provide Chinese pinyin sorting.

### Display the project list

`client/pages/projects/index.tsx` uses `PageContainer`, `PageHeader` and `DataTable` to compose the heading, create action, search and table. Keep a single page container; see [Page layouts](page-layouts.md) for layout changes.

![Project list with name search, creation-time sorting and pagination](/assets/core/developing-apps/pages-and-interactions/projects-list.png)

Keep search, sorting and pagination in the URL, preserving query parameters when opening and closing dialogs. Use server-side pagination and sorting, with creation time descending by default and a matching table-header indicator.

| State | Page feedback |
| --- | --- |
| Initial load | Show skeletons; creation is not shown yet |
| Refresh | Keep existing rows with a loading indicator |
| No projects | Show an empty state with one create action when allowed |
| Search results | Explain when there are no matches; keep Clear filters and the header create action available with or without matches, subject to create permission |
| Request failed | Explain the failure; allow retry for network or server errors |
| Session expired or permission denied | Hide stale data and offer sign-in or administrator guidance |

<details>
<summary>List requests in the example</summary>

`useUrlSearch()` manages search input and IME composition; `useTableUrlState()` manages page number, page size and sorting. Request data through `useApiClient()`:

```tsx
api.request({
  path: 'tutorialProjects',
  query: { q: search, order, page: pageIndex + 1, pageSize },
  signal: controller.signal,
});
```

Call `controller.abort()` in the effect cleanup and check cancellation before updating state so an older response cannot replace newer results. Only a successful `total` for the current query should correct an out-of-range page.

Enable `manualPagination` and `manualSorting`, supplying the server's rows and total. See [API Client](../framework/http/api-client.md) for the general request mechanism.

</details>

### Create a project

`client/pages/projects/create.tsx` presents a form in `RouteDialog`. `react-hook-form` manages input, and `zodResolver` requires a trimmed name of 1–120 characters.

![New project dialog over the project list](/assets/core/developing-apps/pages-and-interactions/create-project.png)

Make each submission state clear to the user:

1. On validation failure, display the error below the name field and associate it with the input using `aria-invalid` and `aria-describedby`.
2. While saving, disable Submit and Cancel, make the input read-only, and use a synchronous submission lock to prevent consecutive clicks from sending multiple requests.
3. For server field errors, preserve input, show the error and focus the field. Show other failures in a form alert.
4. On success, use the returned project to update the list, confirm the created project by name and close the dialog.

A new project may belong outside the current page. This example inserts it immediately only on a matching first page sorted descending. Otherwise, it preserves filters and pagination and offers Show latest projects.

### Change a task's project

Task row actions use `useCan()` to control visibility. When completion/reopening and project assignment are both available, put them in one action menu. Show a single button when only one action is available.

![Change project in the task row menu](/assets/core/developing-apps/pages-and-interactions/task-actions.png)

`client/pages/tasks/[taskId]/project.tsx` loads the latest task and eligible projects when opened. Options are paged in groups of 20, with Previous and Next to reach further projects.

![Changing a task project with options scoped to the assignment action](/assets/core/developing-apps/pages-and-interactions/change-project.png)

**Keep options and the selected value separate.** Use the first response to initialize the selection; later pages update only the options. Retain the selected value and name even when that project is not on the current page. Retrying a failed load must also preserve the draft.

If the current project is outside the allowed scope, display Project unavailable without exposing its name or treating it as an unset association. The server checks the task and target project again on submission; permissions observed when opening the dialog do not authorize a later save.

Submit only the selected project ID, or `null` to clear the association:

```tsx
const { data } = await api.request({
  path: `tutorialTasks/${encodeURIComponent(taskId)}/project`,
  method: 'PATCH',
  json: { projectId },
});
```

Merge the returned `id`, `projectId` and `updatedAt` into the existing task, then refresh the list. This avoids overwriting its title, assignee or completion status with an older task object. Reopening the dialog reads the latest association again.

### Handle closing and failures

During a save, the close button, Cancel, Escape, browser Back and in-app navigation must check the same pending state to prevent leaving the editor before the request completes.

<details>
<summary>Guard RouteDialog closing</summary>

```tsx
<RouteDialog
  title={t('projects.new')}
  className="sm:max-w-md"
  beforeClose={() => !pendingRef.current}
  footer={<Footer pending={pending} />}
>
  <ProjectForm />
</RouteDialog>
```

Pending saves must also block browser Back and in-app navigation. The source package’s `usePendingNavigation` calls `useNavigationGuard` from `@nocobase/app-client`, checking the same pending ref. It registers `beforeunload` only during a save to request the browser’s warning on reload or tab close. `beforeClose` alone does not cover these navigation paths.

This illustrates component relationships. In the full source, the form synchronizes pending state with the parent, and the footer's `form` attribute connects its submit button to the form. Keep those connections when using the source package.

</details>

On closing, restore the list's filters, sorting and pagination. Return focus to the trigger, or to the parent page heading if the trigger disappeared or the dialog opened from a direct link. Confirming an IME candidate must not submit the form.

| Situation | Behavior |
| --- | --- |
| Unchanged form | Disable Save and explain that there are no changes |
| Unavailable target project | Associate the error with Project, focus the selector and retain the draft |
| Missing or out-of-scope task | End editing and return to the refreshed list |
| Expired session | Offer sign-in |
| Revoked action permission | Explain the denial without an ineffective Retry button |
| Network or server failure | Keep input and allow retry |

![A real API rejection displayed under the Project field](/assets/core/developing-apps/pages-and-interactions/project-validation.png)

<details>
<summary>Project example API and route integration</summary>

**Pages and APIs**

Page paths are relative to the application entry. API paths are relative to its API root. Do not hard-code `/main` or a server address in the components.

| Page route | Presentation | API |
| --- | --- | --- |
| `/projects` | Project list | `GET /tutorialProjects` |
| `/projects/create` | Create dialog | `POST /tutorialProjects` |
| `/tasks/:taskId/project` | Assignment dialog | `GET` and `PATCH /tutorialTasks/:id/project` |

Extend the previous list endpoint with `q` and `order`: a name contains search and ascending or descending creation-time sorting, newest first by default. Break timestamp ties with `id`. Apply the same filter and authorization policy to the rows and `total`.

The assignment dialog also needs a read endpoint. Read the task through the `assignTask` task policy, then load options and the current project name through that action's project policy:

```ts
{
  data: {
    task: { id, title, projectId, projectName },
    options: [{ id, name, createdAt }],
  },
  meta: { page, pageSize, total },
}
```

`projectName` can be `null` when the existing project is now outside the allowed scope. Display Project unavailable without exposing its name or treating it as an unset association. Saving still checks the task and target project again; an earlier editor response is not lasting authorization.

The complete changes are in the package's `server/providers/tutorial-project-service.ts`, `tutorial-projects.ts` and `server/routes/tutorial-projects.ts`. The new GET endpoint declares `describeRoute()` and validates inputs with `apiValidator()`. No new migration is needed.

**Page, navigation and dialog routes**

Add Projects to `defineAppRoutes()` in `client/routes.ts`, preserving the existing Tasks, authentication and settings routes:

```tsx
{
  name: 'projects',
  path: '/projects',
  auth: 'required',
  authz: {
    resource: { type: 'page', id: 'projects' },
    action: 'access',
  },
  navigation: { title: 'projects.title', icon: FolderKanban },
  breadcrumb: { title: 'projects.title' },
  componentLoader: () => import('./pages/projects/index.js'),
  children: [
    {
      name: 'projectCreate',
      path: 'create',
      authz: {
        resource: { type: 'composite', id: 'tutorial.projects' },
        action: 'create',
      },
      breadcrumb: { title: 'projects.new' },
      componentLoader: () => import('./pages/projects/create.js'),
    },
  ],
}
```

Import `FolderKanban` from `lucide-react`. The `navigation` declaration supplies the sidebar entry. Each page module default-exports a React component, and the parent renders `<Outlet />` for child routes.

Add `:taskId/project` to the existing `tasks.children`, guarded by `tutorial.projects/assignTask`.

Preserve the list query when opening a dialog:

```tsx
<Button
  nativeButton={false}
  render={<Link to={{ pathname: 'create', search: location.search }} />}
>
  {t('projects.new')}
</Button>
```

This makes copied links, refreshes and closing predictable. For example, `/projects/create?q=launch&page=2` opens over the corresponding project list and returns to the same query when closed.

See [Pages, routes and navigation](pages-routes-and-navigation.md) for route declarations and overlays.

</details>

## Develop pages with an agent

From an application directory that already has project and task features, give the development agent this article as a reference and describe the pages and business rules you need:

```text
Add pages for the existing project features, following the application's style with English and Chinese text.
The project list should support name search, creation-time sorting and pagination, with a dialog to create projects.
Let me change or clear a task's project from its row. Only offer projects the current user is allowed to assign; keep existing permissions.
Keep my selection when paging through projects and my input if saving fails. Update the list after saving, and preserve its filters and page when closing the dialog.
```

The API, permission and component integration requirements are described above. For your own business page, replace the page names and operations, then review the result using the checks below.

## Verify interaction behavior

- Check pages with data, empty results, loading and failures, including both languages, light and dark themes, and narrow layouts.
- Verify field validation, duplicate submission and retry behavior. Failed saves must retain input, and paging options must retain the selection.
- Check dialog closing, direct links, reloads and browser history for correct list context and focus restoration. Complete actions using a keyboard and an IME.
- Use an ordinary account to test allowed and denied actions, checking entry-point visibility, task scopes and project-option scopes separately. Hidden buttons cannot replace server authorization.
- After adding or changing components, run the project's type checks, relevant tests and build to verify imports, dependencies and stylesheet integration.

Component tests cover input and interactions. Real API and browser tests cover authorization, persistence and page integration. See [Testing and acceptance](testing-and-acceptance.md) for test organization.

<details>
<summary>Run the historical project example tests</summary>

These files and commands belong to the incremental source package above. Run them from the application root after merging the example; use the corresponding test files in your own application.

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/server/tutorial-tasks-project-api.test.ts
pnpm exec vitest run tests/components/tutorial-projects.test.tsx
pnpm exec vitest run tests/logic/client-routes.test.ts tests/logic/page-permission-titles.test.ts tests/logic/app-locale-coverage.test.ts tests/logic/authorization-assignment-safety.test.ts
pnpm typecheck
```

Run browser tests against a separate local test application: they create projects and tasks. Set `APP_URL` to the complete application entry printed by `pnpm dev`, and use a local test account:

```bash
APP_URL=http://127.0.0.1:13321/main/ pnpm exec playwright test tests/playwright/tutorial-projects.test.ts
```

Set `TUTORIAL_USERNAME` and `TUTORIAL_PASSWORD` as needed; keep production credentials out of scripts. Creation, assignment, clearing and scopes use a real database. Component tests substitute only necessary session, transport and jsdom browser-capability boundaries.

</details>
