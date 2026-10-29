---
title: UI components and interactions
description: Build on shadcn primitives and the NocoBase UI Library, organize business components freely, implement list, form and dialog interactions, and verify user actions.
---

When developing applications and plugins, you can write and organize frontend components freely, with shadcn for primitives. When building modular interfaces, start by checking the components and blocks distributed through the [NocoBase UI Library](https://ui.nocobase.com/), then adapt and combine them for your business.

This guide first covers how to organize components and use source assets, then explains business interactions through three interfaces: a project list, project creation and changing a task's project. For the full project example's version and prerequisites, see [Before you start](#before-you-start); the component organization and Library usage apply directly to your own project.

## Write and organize components

Start by looking at the application's existing pages and components to see what you can use as is and what needs adjusting. The following is one possible organization; adapt it to the project's size and business boundaries:

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

A small component used by only one page can stay next to that page, and move to a shared location once several places use it. Components can receive data through Props, or use Hooks, contexts or client services as needed; business components do not all have to follow the same pattern.

Use the project's shadcn components for basic interactions such as buttons, inputs and dialogs. When a primitive is missing, add it with the project's existing CLI from the application root, for example:

```bash
pnpm exec shadcn add button input
```

The alias configuration in `components.json` decides where components are written. If a target file already exists, review the differences and keep the application's own customizations; see the [shadcn CLI](https://ui.shadcn.com/docs/cli#add) for details.

The project example later in this guide uses the following components and mechanisms. The template or the Library provides a general implementation, and the business page connects its own data, permissions and feedback:

| Need | Component or mechanism in this example | What the business page still owns |
| --- | --- | --- |
| Page title and content layout | `PageContainer`, `PageHeader` | The title, actions and content; avoid nesting page containers |
| Lists and pagination | `DataTable` | Column definitions, data within the permission scope, totals and server-side pagination |
| Creation or editing dialogs | `RouteDialog` | The form, submission, close guards and return context |
| Form validation | `react-hook-form` and `zodResolver` | Business validation, field errors returned by the server, and focus |
| Calling application APIs | `useApiClient()` | Request parameters, cancelling stale requests and handling results |
| Action visibility | `useCan()` | Controlling entry points per action, while the server still authorizes independently |

Import components through the application's existing entries such as `#components/...`, and use semantic theme styles and translated text; see [Localization](localization.md) and [Themes and styles](themes-and-styles.md) for the conventions.

## Use the NocoBase UI Library

The [NocoBase UI Library](https://ui.nocobase.com/) distributes editable component and block source through shadcn UI Registry. Once an Agent or developer adds an asset to the application, the files can be read, changed and combined directly.

### Find and add assets

First read the component's description, examples and installation command in the Library, to understand which interface problem it solves and which dependencies or application capabilities it needs. An added component still has to be connected to a page; for blocks that involve business plugins, also prepare the plugins, APIs and permissions described by the asset.

Check `components.json` in the application root. The default template already configures `@nocobase`; if an existing project lacks it, merge the entry below into the existing `registries`, keeping the current style settings, aliases and other Registry entries:

```json
{
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  }
}
```

See [shadcn components.json](https://ui.shadcn.com/docs/components-json#registries) for the configuration. For example, when the application has no page title component, add one like this:

```bash
pnpm exec shadcn add @nocobase/page-header
```

This asset is written to `client/components/page-header.tsx`. Import `PageHeader` through the application's existing `#components/page-header` entry, pass the page title, and add a description and actions as needed. If the project already has this component, use or adapt the existing file first.

### Modify and combine

After adding an asset, review the generated files, dependencies and style changes before connecting it to the business. You can adjust the component's layout, add or remove actions, or split a large block into components that fit the application better; connect its text to the application's localization and follow the theme conventions for colors and spacing.

For example, when `PageHeader` is used on the project list, the page passes in the translated title and a **New project** action, a list component shows the business data and a form component handles input. Source assets only provide a starting point for the interface; the business behavior is implemented by the application.

From then on, the application maintains these files. When you add an asset again or take an upstream update, compare the differences and keep business changes, especially permission checks, form behavior and localization.

`client/extensions/` can organize added components, Hooks and other UI source by module. Where an asset is actually written depends on its declaration and the project configuration, and not every asset goes there. The files are connected to pages through ordinary imports; placing them in this directory does not register a plugin, route or service automatically.

### Use local source assets

Registry assets provided by your team can also be added locally. For example, with a built asset at `packages/announcements-ui/public/r/announcement-list.json` in the workspace:

```bash
pnpm exec shadcn add ./packages/announcements-ui/public/r/announcement-list.json
```

What you pass is a single asset JSON that contains the component source, with a path relative to the application directory where you run the command. It can come from a local build or another project, and no HTTP server is needed for a local file; other Registry items and npm dependencies declared by the asset may still need network access. The CLI accepts names, URLs and local paths; see the [shadcn CLI](https://ui.shadcn.com/docs/cli#add).

## Use React Context and Providers

When several components need to share a selection, an editing state or other interface context, use React Context. A Provider needed only by one page or component subtree can be composed right there.

A Provider that must cover the whole application is connected through `client/react-providers.ts`: write a React component that accepts and renders `children`, then append it to the existing `defineClientReactProviders(...)` declaration with a `name`, a `component` and a suitable `layer`. Providers that depend on application context usually use the `application` layer; keep the template's existing theme and Toast declarations.

The two kinds of Provider have different jobs. A React Provider supplies context to the component tree; a client ServiceProvider registers business services in the service container and manages their lifecycle, through `client/service-provider.ts`. They can work together when a service must reach components, but registering a service does not turn its fields into reactive React state; components still need React state or an explicit subscription mechanism to update.

For Provider layers, ordering and plugin contributions, see [React Providers](../framework/runtime/react-providers.md); for registering and obtaining services, see [Client services](../framework/services/integration.md#client-services); for application startup and runtime assembly, see [Client runtime](../framework/runtime/client.md).

## Implement business interactions

Once components are connected to pages, you still need to define how loading, empty results, pending submissions, failures and successes behave. The existing project feature below illustrates these interactions. Request parameters and response data follow the business API; for the general request mechanism, see [API Client](../framework/http/api-client.md).

Request Hooks, URL state, race handling and refreshing after a save are also covered in [Data requests and state management](data-requests-and-state.md), and page containers and the application shell in [Page layouts](page-layouts.md). This guide keeps the complete interaction example so it can be read in one go.

### Separate three kinds of state

**URL state** holds a view that can be shared and restored, such as the search text, sort order, page and the routed dialog that is open. Closing a dialog should still return to the matching list context.

**Server state** includes records, options, totals and the permission result for the current action. Read again when the search or page changes, and never let an older request's result overwrite a newer one. When saving, the server still checks permissions; permission seen when the dialog opened is not a permanent grant.

**Form drafts** hold input the user has not submitted yet, the selected project and field errors. Paging through options, network failures and retries must not clear a draft by accident; an edit ends only on a successful submission or when the user explicitly discards it.

Each kind of state has its own purpose, and they must not be mixed. Copying a whole list record into a dialog and writing all of it back can overwrite fields someone else changed; keeping the selected value only in the current options page loses the selection when paging.

### Example interfaces

The example adds a project list and two dialogs, reusing the application template's page, table and form components:

- **Project list**: search by name, sort by creation time and browse page by page.
- **New project**: enter a name, save it once it passes validation, and return to the original list.
- **Change task project**: read the task's current project, choose a project that may be assigned, or clear the association.

![Project list with name search, creation-time sorting and pagination](/assets/core/developing-apps/pages-and-interactions/projects-list.png)

This guide does not add project details, deletion or an approval flow. The task list keeps its existing columns and opens **Change project** from a row action; the dialog shows the task's current project.

### Before you start

Before running this example, complete the examples in [Create tables and initialize data](data-models-and-migrations.md) and [Routes and HTTP APIs](apis-and-services.md), keeping their migrations, services, routes and permission declarations. The example is based on `@nocobase/app-template-default@1.0.0-beta.78` and needs no new plugin.

This chapter's incremental package only applies to the historical project example above, not to the current getting-started application with its `tasks` table and three-stage progress.

This guide involves several frontend files. You can download the [incremental source package](/assets/core/downloads/team-tasks-pages-and-interactions.zip), which contains the added and changed files, an incremental patch and instructions. It starts from the state after those two examples and contains no configuration, accounts, database or dependency directories.

Published examples are still located through the repository's chapter tags; this chapter's source is provided with the documentation first and does not depend on an unpublished tag. If your application already has its own changes, review the patch before merging so you do not overwrite business code.

### With an Agent

In the application directory, give this guide to the Agent as context, then describe the request below. The specific conventions for fields, APIs and components are in the manual steps that follow, and the Agent applies them together with the project guidance.

```text
Please make the existing project features usable through pages, following the application's visual style with English and Chinese text.
Use shadcn primitives and consult the components and blocks in the NocoBase UI Library first.
Inspect existing components, add source assets as needed, and adapt and compose them while preserving current customizations.

I need a Projects page with name search, creation-time sorting and pagination, plus a New project dialog.
Add Change project to task row actions. The dialog should show the current assignment, let me select an eligible project, or clear it.
Load current information when opening it, and retain my selection when paging through available projects.
Only offer projects allowed for this assignment operation; viewing permission alone must not grant assignment access.

Show progress while loading and explain empty data or searches with no matches.
Place validation messages beside their fields. Keep input and allow retry if saving fails.
Prevent duplicate submissions, update the list and confirm success after saving, and preserve filters and page position when closing dialogs.
Request sign-in when the session expires, explain insufficient permissions, and stop editing if the task no longer exists.

Follow the project's guidance and retain existing permissions without automatically assigning roles.
Verify creation, assignment, clearing and denied actions, as well as keyboard use, Chinese input and narrow screens.
Do not add project details, deletion or workflows yet. Report changes and verification results.
```

### Without an Agent

#### Map pages to APIs

Page routes are relative to the application entry, and API paths are relative to the application's API root; do not hard-code `/main` or a server address anywhere in the code.

| Page route | Presentation | API used |
| --- | --- | --- |
| `/projects` | Project list | `GET /tutorialProjects` |
| `/projects/create` | Creation dialog | `POST /tutorialProjects` |
| `/tasks/:taskId/project` | Change project dialog | `GET` and `PATCH /tutorialTasks/:id/project` |

The project list from the business services and HTTP API chapter only has pagination parameters; this chapter adds `q` and `order`: a name search that matches by containment, and ascending or descending sorting by creation time, newest first by default. Equal creation times are ordered stably by `id`, and the rows and `total` use the same filter and permission policy.

The change dialog also needs a read endpoint. It first reads the current task within the task scope of the `assignTask` action, then reads the options and the current project's name within that action's project scope:

```ts
{
  data: {
    task: { id, title, projectId, projectName },
    options: [{ id, name, createdAt }],
  },
  meta: { page, pageSize, total },
}
```

`projectName` can be `null`: the project the task is already linked to may now be outside the allowed scope. In that case the interface shows **Project unavailable**, without revealing the project's name or treating it as "no project set". Saving still rechecks the task and the target project; the result seen when the dialog opened is not a lasting grant.

The complete changes are in the package's `server/providers/tutorial-project-service.ts`, `tutorial-projects.ts` and `server/routes/tutorial-projects.ts`. The new GET endpoint also declares its documentation with `describeRoute()` and validates parameters with `apiValidator()`; no new migration is needed.

#### Declare pages, menus and dialogs as routes

Add the project page to `defineAppRoutes()` in `client/routes.ts`, keeping the existing task, sign-in and system settings routes:

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

`FolderKanban` is imported from `lucide-react`. The menu entry is generated from `navigation`, so the sidebar needs no change. Each page module default-exports a React component, and the parent page keeps an `<Outlet />` to render child routes.

The task's **Change project** route goes into the existing `tasks.children` with the path `:taskId/project`, guarded by the `tutorial.projects/assignTask` action permission.

When opening the dialog, keep the list's query parameters:

```tsx
<Button
  nativeButton={false}
  render={<Link to={{ pathname: 'create', search: location.search }} />}
>
  {t('projects.new')}
</Button>
```

This gives copied links, refreshes and closing the dialog a clear destination. For example, `/projects/create?q=launch&page=2` still opens over the matching project list, and closing it returns to the same query.

#### Keep the list state in the URL

`client/pages/projects/index.tsx` uses the template's `PageContainer`, `PageHeader` and `DataTable`. `useUrlSearch()` manages the search text and IME composition, and `useTableUrlState()` manages the page, page size and sorting.

Requests go through `useApiClient()`:

```tsx
api.request({
  path: 'tutorialProjects',
  query: { q: search, order, page: pageIndex + 1, pageSize },
  signal: controller.signal,
});
```

Call `controller.abort()` in the effect's cleanup and check for cancellation before updating state, so a response to an earlier search cannot overwrite newer results. Only a `total` returned successfully for the current query may be used to correct a page number that is out of range.

The table enables `manualPagination` and `manualSorting` and uses the rows and total returned by the server. The default sort indicator in the interface must also show creation time descending; setting the default only in the API is not enough.

Different states need different feedback:

| State | What the page shows |
| --- | --- |
| First load | Skeletons, with no creation entry yet |
| Refreshing an existing list | Keeps the current rows and shows a loading indicator |
| No projects | An empty state; with permission, the single creation entry is in the empty state |
| No search results | A no-results message, keeping the header's creation entry and **Clear filters** |
| Search has results | **Clear filters** stays available too |
| Request failed | A clear error; network or server errors allow retrying |
| Session expired or permission denied | Hides stale data and suggests signing in again or contacting an administrator |

#### Implement the creation form

`client/pages/projects/create.tsx` uses `RouteDialog`, and this single-field dialog uses the `sm:max-w-md` width. The form is managed by `react-hook-form`, and `zodResolver` checks that the name has 1–120 characters after trimming.

![The creation dialog opened over the project list](/assets/core/developing-apps/pages-and-interactions/create-project.png)

Handle the submission in this order:

1. Validate before submitting; show the error under the name field and connect it with `aria-invalid` and `aria-describedby`.
2. While the request is pending, disable **Submit** and **Cancel**, make the input read-only, and use a ref to prevent duplicate submissions and races with closing.
3. When the server returns an error for the name field, keep the input, show the error back on the field and focus it; show other failures as a form-level alert.
4. On success, update the list with the project returned by the API, show a message naming the project, then close the dialog.

The dialog's close button, **Cancel** and the Escape key are all guarded through the template's `beforeClose`:

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

A pending save must also block browser Back and in-app navigation. The source package's `usePendingNavigation` calls `useNavigationGuard` from `@nocobase/app-client` and uses the same ref to tell whether the request is still pending; it also registers `beforeunload` only during the save, so the browser warns when the user reloads or closes the tab. `beforeClose` alone does not cover these navigation paths.

The code above only sketches how the components relate: in the full code, the form synchronizes its pending state to the parent, and the footer is connected to the form through its `form` attribute. Do not replace the source package's files with this unconnected sketch.

A newly created record does not necessarily belong on the visible page. For example, when the list is sorted by creation time ascending, sits on page two, or the search text does not match the new project, the record must not be forced to the top of the list. This example inserts the new record immediately only on "the first page, sorted descending, matching the search"; otherwise it keeps the current context, says which project was created, and offers a **Show latest projects** action.

#### Open the change project dialog from a task row

When a task supports both **Complete / Reopen** and **Change project**, put both into one row action menu; when only one action is available, show it as a single button. Whether each action is visible is decided by its own `useCan()` result.

![The Change project entry in the task row's action menu](/assets/core/developing-apps/pages-and-interactions/task-actions.png)

When `client/pages/tasks/[taskId]/project.tsx` opens, it requests the latest task and the project options. The picker loads 20 projects per page and uses **Previous** and **Next** to browse further, so the first page is never mistaken for the complete list.

![Changing a task's project, with options loaded according to the action's permission](/assets/core/developing-apps/pages-and-interactions/change-project.png)

**Options pagination and the form draft are two separate pieces of state.** The first read initializes the selection; after that, paging only updates the options. The selected project keeps its name and value even when it is not on the current options page, and retrying after a failed load must not reset the user's input.

On save, submit the selected project's ID, or `null` for **No project**:

```tsx
const { data } = await api.request({
  path: `tutorialTasks/${encodeURIComponent(taskId)}/project`,
  method: 'PATCH',
  json: { projectId },
});
```

The API returns only `id`, `projectId` and `updatedAt`. Merge these fields into the existing task data, then reload the list; do not overwrite the title, assignee or completion status with the older task object cached in the dialog. When the dialog is opened again, it reads the latest association from the server again.

#### Let users carry on after a failure

| Situation | Handling |
| --- | --- |
| Nothing changed yet | Disable saving and explain that there is nothing to save |
| The target project is unavailable | Attach the error to the project field, focus the picker and keep the draft |
| The task no longer exists or is out of scope | Stop editing, and return to the refreshed task list after closing |
| The session expired | Offer a way to sign in again |
| The action permission was revoked | Explain that permission is missing, without an ineffective Retry button |
| Network or server error | Keep what was entered and allow retrying |

![The real API rejects an invalid project, and the error appears under the picker](/assets/core/developing-apps/pages-and-interactions/project-validation.png)

The form must also handle the keyboard well: confirming an IME candidate must not submit the form; a pending save must not be submitted twice; after the dialog closes, focus returns to the entry that opened it, or to the parent page's heading if that entry is gone or the dialog was opened from a direct link.

## Extract components and reuse interaction logic

Build the page around the actual business first, then extract components along repeated content and boundaries of change. In this example, the page can own routing, permissions and data access, the list can own row presentation and action entries, and the form can own the draft, field errors and submission.

| What needs reuse | How it can be extracted |
| --- | --- |
| Presentation shared by several pages | A component that receives data, text and event callbacks, with business context passed in by the page |
| Editing forms for the same business object | Shared fields and validation, with explicit initial values, pending state, and save and cancel behavior |
| Interaction flows repeated in several places | A Hook that documents its inputs, outputs, reset conditions and resource cleanup |
| Business capabilities across pages | A client service where appropriate; see [Client business services](client-business-services.md) for implementing and connecting it |

Props suit explicit data and callbacks; React Context can provide shared values to a group of components; client services can encapsulate business capabilities used across pages. Combine them as needed, and make clear who owns each piece of state and how components subscribe to changes. Note that a custom Hook reuses logic: calling the same Hook several times does not make the calls share state.

When extracting a Hook, do not merge URL state, remote data and unsubmitted drafts into one state. For example, paging through project options updates only the options and keeps the form's selection, while editing a different record after closing the dialog requires a freshly initialized draft. Even when a component uses `useCan()` to control action entries, the API still authorizes independently.

Reuse within an application works directly through components, Hooks or local shared packages. To publish components as source assets that Agents can take, change and combine in other projects, see [Optionally distribute UI source assets](../extension-development/frontend-components.md#optionally-distribute-ui-source-assets).

## Test and verify

When checking components, cover presentation, interaction and application integration:

- In the real page, check normal data, empty results, loading and failure states, in both languages, both light and dark themes, and a narrow layout.
- Use component tests to verify input validation, duplicate submission, keeping the draft after a failure, and keeping the selected value after paging through the picker.
- Use the keyboard to check focus, dialog closing and IME behavior; use an ordinary user to check action entries and server-side rejections.
- After adding or adjusting Library assets, run the project's type checks, relevant tests and build, to confirm imports, dependencies and styles are all connected.

For test organization and verification scope, see [Testing and acceptance](testing-and-acceptance.md). The test files and commands below belong to this guide's historical project source package; in your own application, choose the matching test files.

### Permissions and tests of the project example

Using the business permissions from the API example, configure the chosen roles in **System settings → Permission management**:

- Access to the **Projects** page, plus the view and create actions needed.
- Access to the **Tasks** page, plus the **Change task project** action.
- For changing assignments, separate scopes for tasks and for the projects that may be chosen.

Then assign the roles to specific users in user management. Being able to open the project page does not mean being able to read or create projects, and being able to view a project does not mean being allowed to assign tasks to it. Hidden buttons are only interface feedback; the server still checks every request independently.

The source package includes real API tests, component tests and a browser test:

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/server/tutorial-tasks-project-api.test.ts
pnpm exec vitest run tests/components/tutorial-projects.test.tsx
pnpm exec vitest run tests/logic/client-routes.test.ts tests/logic/page-permission-titles.test.ts tests/logic/app-locale-coverage.test.ts tests/logic/authorization-assignment-safety.test.ts
pnpm typecheck
```

The browser test runs against a separate local test application and creates projects and tasks. Set `APP_URL` to the complete application entry printed by `pnpm dev`, and run it with a local test account:

```bash
APP_URL=http://127.0.0.1:13321/main/ pnpm exec playwright test tests/playwright/tutorial-projects.test.ts
```

The test account can be set through the `TUTORIAL_USERNAME` and `TUTORIAL_PASSWORD` environment variables; never put production credentials in scripts. Creation, assignment, clearing and permission scopes are verified on a real database; component tests use substitutes only at the necessary boundaries of sessions, network transport and jsdom browser capabilities.

### Example boundaries

The project model, business APIs and page actions are now connected. When you add other business pages later, you can follow the same order: settle data and permissions first, then declare routes and components, and finally complete loading, failure and save feedback and verification.

This example still uses a "last successful save wins" rule and adds no concurrency version check. Search only matches names by containment, and creation time is the only sort order; sorting by Chinese pinyin is not supported.
