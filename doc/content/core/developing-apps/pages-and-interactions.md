---
title: UI components and interactions
description: Use shadcn primitives and the NocoBase UI Library to organize business components, implement list, form and dialog interactions, and verify user behavior.
---

Applications and plugins can freely write and organize frontend components, using shadcn for primitives. When building modular interfaces, first consult the components and blocks distributed through the [NocoBase UI Library](https://ui.nocobase.com/), then adapt and compose them for your business.

This guide covers component organization and source assets, then illustrates business interactions with a project list, project creation and task project assignment. See [Before you start](#before-you-start) for the full example's version and prerequisites. Apply the organization and Library guidance to your own project as needed.

## Write and organize components

Inspect existing pages and components to decide what you can use or adapt. The following is one possible organization; adjust it to the project's size and business boundaries:

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

Small components can stay beside their page until they need a shared location. Components can receive Props or use Hooks, contexts and client services when appropriate; business components do not all need to follow the same pattern.

Use the project's shadcn components for primitives such as buttons, inputs and dialogs. Add a missing primitive with the project's CLI from the application root, for example:

```bash
pnpm exec shadcn add button input
```

Aliases in `components.json` determine placement. Review differences and preserve application customizations when files already exist. See the [shadcn CLI](https://ui.shadcn.com/docs/cli#add) for command details.

The project example below uses these components and mechanisms. The template or Library supplies general implementations; the business page connects its data, permissions and feedback:

| Need | Component or mechanism used here | What the business page still owns |
| --- | --- | --- |
| Page heading and layout | `PageContainer`, `PageHeader` | Titles, actions and content; avoid nested page containers |
| Lists and pagination | `DataTable` | Columns, scoped data, totals and server pagination |
| Create or edit dialogs | `RouteDialog` | Forms, submission, close guards and return context |
| Form validation | `react-hook-form` and `zodResolver` | Business validation, server field errors and focus |
| Application API requests | `useApiClient()` | Parameters, cancellation of stale requests and result handling |
| Action visibility | `useCan()` | Control action entry points while retaining independent server authorization |

Import components through application entries such as `#components/...`. Use semantic theme styles and translated copy; see [Localization](localization.md) and [Themes and styles](themes-and-styles.md).

## Use the NocoBase UI Library

The [NocoBase UI Library](https://ui.nocobase.com/) distributes editable component and block source through shadcn UI Registry. After adding an asset to an application, an agent or developer can read, modify and compose its files directly.

### Find and add assets

Check the Library's descriptions, examples and installation commands to understand the interface an asset provides and its dependency or application requirements. Added components still need page integration. For blocks that use business plugins, follow the asset's instructions to prepare the corresponding plugins, APIs and permissions.

Check `components.json` in the application root. The default template configures `@nocobase`. If an existing project lacks it, merge this entry into its `registries`, preserving existing style settings, aliases and other registries:

```json
{
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  }
}
```

See [shadcn components.json](https://ui.shadcn.com/docs/components-json#registries) for configuration details. For example, add the page heading component if the application does not already have it:

```bash
pnpm exec shadcn add @nocobase/page-header
```

This asset writes `client/components/page-header.tsx`. Import `PageHeader` through the application's existing `#components/page-header` entry and provide a title, with an optional description and actions. If the component already exists, use or adapt the existing file first.

### Modify and compose

Review generated files, dependencies and stylesheet changes before integrating the asset. Adjust layouts, change actions or split a larger block into components that fit the application. Connect copy to application translations and follow its theme conventions for colors and spacing.

For example, a Projects page passes a translated title and New project action to `PageHeader`, while a list displays business data and a form handles input. Source assets provide an interface starting point; the application implements the business behavior.

The application maintains these files. When adding an asset again or taking an upstream update, compare changes and retain business customizations, especially permission checks, form behavior and translations.

Use `client/extensions/` to organize added components, Hooks and other UI source by module when appropriate. Installation targets depend on the asset declaration and project configuration; not every asset belongs here. Connect these files through ordinary imports. Placing a file in this directory does not automatically register a plugin, route or service.

### Use local source assets

Team-provided Registry assets can also be added locally. For example, a built asset might be available at `packages/announcements-ui/public/r/announcement-list.json` in the workspace:

```bash
pnpm exec shadcn add ./packages/announcements-ui/public/r/announcement-list.json
```

Pass the individual asset JSON containing component source, relative to the application directory where you run the command. It can come from a local build or another project and needs no HTTP server for the local file. Other Registry items and npm dependencies declared by the asset may still need network access. The CLI accepts names, URLs and local paths; see the [shadcn CLI](https://ui.shadcn.com/docs/cli#add).

## Use React Context and Providers

Use React Context when several components need shared selections, editing state or other interface context. Compose a Provider directly in the relevant page or subtree when only that part of the interface needs it.

Register application-wide Providers through `client/react-providers.ts`. Write a React component that accepts and renders `children`, then append it to the existing `defineClientReactProviders(...)` declaration with a `name`, `component` and suitable `layer`. Providers that need application context usually use the `application` layer. Preserve the template's existing theme and Toast declarations.

A React Provider supplies context to the component tree. A client ServiceProvider registers business services in the service container and manages their lifecycle, through `client/service-provider.ts`. They can work together when components need a service, but registering a service does not make its fields reactive React state. Components still need React state or an explicit subscription mechanism to update.

See [React Providers](../framework/runtime/react-providers.md) for mounting layers, ordering and plugin contributions, and [Client services](../framework/services/integration.md#client-services) for service registration and access. Startup and runtime composition belong to [Client runtime](../framework/runtime/client.md).

## Implement business interactions

After connecting components to pages, define loading, empty, submitting, failure and success behavior. The existing project feature below illustrates these interactions. Follow the business API's input and response contract; see [API Client](../framework/http/api-client.md) for the general request mechanism.

See [Data requests and state management](data-requests-and-state.md) for request Hooks, URL state, races and refreshes after saving, and [Page layouts](page-layouts.md) for page containers and application shells. The complete interaction walkthrough remains below for reading in sequence.

### Separate three kinds of state

**URL state** captures a shareable, restorable view: search, sorting, pagination and the current routed dialog. Closing a dialog should return to that list context.

**Server state** contains records, options, totals and operation permission results. Read again when search or pagination changes; old requests must not replace newer results. The server still checks permissions when saving: permission observed when opening a dialog is not permanent authorization.

**Form drafts** contain unsubmitted input, selected projects and field errors. Paging options, network failures and retries must not accidentally clear them. End editing after a successful submission or an explicit decision to discard it.

These states have distinct purposes. Copying a whole list record into a dialog and writing it all back can overwrite another person's changes. Storing the selection only in the current options page loses it when paging.

### Example interfaces

Add a project list and two dialogs using the application's existing page, table and form components:

- **Project list:** search by name, sort by creation time and browse server-side pages.
- **New project:** validate a name, save it and return to the original list.
- **Change task project:** load the current association, choose an allowed project or clear the association.

![Project list with name search, creation-time sorting and pagination](/assets/core/developing-apps/pages-and-interactions/projects-list.png)

This chapter adds no project detail, deletion or approval flow. The Tasks table keeps its existing columns. Its row action opens Change project, where the current association is displayed.

### Before you start

Running this example requires the examples in [Create tables and initialize data](data-models-and-migrations.md) and [Routes and HTTP APIs](apis-and-services.md), retaining their migrations, services, routes and permissions. The example uses `@nocobase/app-template-default@1.0.0-beta.78` and needs no new plugin.

This incremental package targets the historical project example above, not the current getting-started application with its `tasks` table and three-stage progress.

Several frontend files work together here. Download the [incremental source package](/assets/core/downloads/team-tasks-pages-and-interactions.zip) for the added and modified files, a patch and instructions. It starts from the state after those two examples and contains no configuration, accounts, database or dependencies.

Repository chapter tags remain the reference for published examples. This chapter's source is supplied with the documentation without depending on an unpublished tag. If your application already has custom changes, inspect and merge the patch instead of overwriting business code.

### With an agent

Give the agent this chapter as context from the application directory, then describe the request below. Field, API and component details are in the manual steps; the agent should follow them alongside the project's guidance.

```prompt
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

### Without an agent

#### Map pages to APIs

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

#### Declare pages, navigation and dialogs in routes

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

#### Keep list state in the URL

`client/pages/projects/index.tsx` uses `PageContainer`, `PageHeader` and `DataTable`. `useUrlSearch()` manages the search input and IME composition, while `useTableUrlState()` manages page number, page size and sorting.

Load data through `useApiClient()`:

```tsx
api.request({
  path: 'tutorialProjects',
  query: { q: search, order, page: pageIndex + 1, pageSize },
  signal: controller.signal,
});
```

Abort in the effect cleanup and check cancellation before updating state. An older search response must not overwrite newer results. Only a successful count for the current query should normalize an out-of-range page.

Enable `manualPagination` and `manualSorting`, supplying the server's rows and total. The default header indicator must also show Created descending; a server default alone is insufficient.

| State | Presentation |
| --- | --- |
| Initial load | Skeletons; creation is not shown yet |
| Refresh | Keep existing rows with a loading indicator |
| No projects | Empty state with the sole create action when allowed |
| No search matches | No-results message, header create action and Clear filters |
| Search has matches | Keep Clear filters available too |
| Request failed | Explain the failure; allow retry for network/server errors |
| Session expired or permission denied | Hide stale data and offer sign-in or administrator guidance |

#### Build the create form

`client/pages/projects/create.tsx` uses `RouteDialog` with `sm:max-w-md` for its single field. `react-hook-form` manages the form, and `zodResolver` requires a trimmed name of 1–120 characters.

![New project dialog over the project list](/assets/core/developing-apps/pages-and-interactions/create-project.png)

Handle the submission lifecycle explicitly:

1. Validate on submit. Associate the name error with `aria-invalid` and `aria-describedby`.
2. Disable Submit and Cancel while pending, make the input read-only, and use a ref to prevent duplicate requests and close races.
3. Map server name violations back to the field, preserve its value and focus it. Show other failures in a form alert.
4. Update the list using the returned project, show a named success message and close.

Guard the dialog's close button, Cancel and Escape with the template's `beforeClose`:

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

A newly created row may belong outside the visible page: an oldest-first list, a later page or a nonmatching search are examples. Insert immediately only on a matching first page sorted descending. Otherwise preserve context, confirm the saved project by name and offer Show latest projects.

#### Open the assignment dialog from a task

When completion/reopening and project assignment are both available, put them in one row menu. When only one action is available, show a single button. Each action uses its own `useCan()` result.

![Change project in the task row menu](/assets/core/developing-apps/pages-and-interactions/task-actions.png)

`client/pages/tasks/[taskId]/project.tsx` loads the latest task and allowed projects when opened. Options are paged in groups of 20 with Previous and Next; the first page is not presented as the complete list.

![Changing a task project with options scoped to the assignment action](/assets/core/developing-apps/pages-and-interactions/change-project.png)

**Options pagination and the form draft are separate state.** Initialize the selection from the first response only. Later option pages must preserve the draft and its label, even when the selected project is on another page. Retrying a failed load must not reset input.

Save the selected ID, or `null` for No project:

```tsx
const { data } = await api.request({
  path: `tutorialTasks/${encodeURIComponent(taskId)}/project`,
  method: 'PATCH',
  json: { projectId },
});
```

The response contains only `id`, `projectId` and `updatedAt`. Merge those fields into the existing task, then refresh the list. Do not overwrite its title, assignee or completion status using an older editor object. Reopening reads the association from the server again.

#### Give failures a useful next step

| Situation | Behavior |
| --- | --- |
| Unchanged form | Disable Save and explain that there are no changes |
| Unavailable target project | Associate the error with Project, focus the trigger and retain the draft |
| Missing or out-of-scope task | End editing and return to the refreshed list |
| Expired session | Offer sign-in |
| Revoked action permission | Explain the denial without an ineffective Retry button |
| Network or server failure | Keep input and allow retry |

![A real API rejection displayed under the Project field](/assets/core/developing-apps/pages-and-interactions/project-validation.png)

Keyboard behavior matters too: confirming an IME candidate must not submit; pending saves must not submit twice; closing returns focus to the trigger, or to the parent heading when the trigger disappeared or the dialog opened from a direct link.

## Extract components and reusable interaction logic

Implement the business page first, then extract components around repeated content and change boundaries. In this example, the page can own route, permission and data integration, the list owns rows and action entry points, and the form owns drafts, field errors and submission interactions.

| What needs reuse | Possible extraction |
| --- | --- |
| Presentation shared by several pages | Receive data, copy and event callbacks as props, with business context supplied by the page |
| Editing forms for the same business | Share fields and validation with explicit initial values, pending state, save and cancel behavior |
| Repeated interaction flows | Extract a Hook with clear inputs, outputs, reset conditions and resource cleanup |
| Business capabilities shared across pages | Use a client service when appropriate; see [Client business services](client-business-services.md) for implementation and application integration |

Props express explicit data and callbacks. React Context supplies shared values to a group of components, while client services can encapsulate business capabilities used across pages. Combine them as needed, making state ownership and subscriptions clear. Extracting a custom Hook reuses logic; separate calls do not automatically share the same state.

When extracting a Hook, keep URL state, remote data and unsubmitted drafts distinct. Paging project options should preserve the form selection, while starting an editor for a different record should initialize a new draft. A component using `useCan()` to control actions still relies on independent endpoint authorization.

Reuse within an application can use components, Hooks or local shared packages directly. To publish components as source assets for agents to take, modify and compose in other projects, see [Optionally distribute UI source assets](../extension-development/frontend-components.md#optionally-distribute-ui-source-assets).

## Test and verify

Cover presentation, interaction and application integration:

- Check real pages with data, empty results, loading and failure states, including both languages, light and dark themes, and narrow layouts.
- Use component tests for validation, duplicate submission, retaining drafts after failure, and selection across option pages.
- Check keyboard focus, dialog closing and IME behavior. Use an ordinary account to verify both action visibility and server denials.
- After adding or adapting Library assets, run the project's type checks, relevant tests and build to verify imports, dependencies and styles.

See [Testing and acceptance](testing-and-acceptance.md) for test organization and scope. The files and commands below belong to this guide's historical project source package; choose the corresponding tests in your own application.

### Project example permissions and tests

Use System settings → Permission management to configure explicit roles:

- Projects page access and the required view/create actions.
- Tasks page access and Change task project.
- Separate task and project scopes for assignment.

Assign the role to specific people through user management. Page access does not grant data access or creation. Viewing a project does not necessarily allow assigning a task to it. Hidden buttons are feedback; the server independently checks every request.

The package includes real API tests, component tests and a browser test:

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

### Example boundaries

The model, business APIs and page interactions now work together. For another business page, follow the same sequence: establish data and permissions, declare routes and components, then complete loading, failure, save feedback and verification.

The example still uses last-successful-write-wins behavior, without a concurrency version check. Search matches names by containment; sorting is by creation time, with no claim of Chinese pinyin ordering.
