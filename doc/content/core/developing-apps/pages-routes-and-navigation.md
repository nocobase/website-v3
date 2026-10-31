---
title: Pages, routes and navigation
description: Use a dedicated routing app to learn page registration, parameters, drawers and dialogs, tabs, navigation, breadcrumbs, access control and component overrides.
---

Use `defineAppRoutes()` to declare page addresses, components, navigation and access rules. The project example below puts these usages in one application so you can try each one and inspect its source.

## Run the example

The [example app][app] uses default template `1.0.0-beta.85` and locks `@nocobase/app-client` to `4.0.0-beta.5`. It requires Node.js 24 and pnpm 11.7.0.

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 58ae0befa2272cbc1f4c946db699bd3b93661486
cd apps/pages-routes-navigation
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

SQLite is the demonstration and verification environment for this example. It needs no separate database service; it is not a routing requirement. To open the app from another device, set the listening address and `app.publicOrigin` as described in the [example README][readme], then open `/main/` on that address. The local `config.yml` defines the initial account under `users.initialAdmin`.

The home page links to each demo. Projects and tasks are public fictional fixtures. **New draft** demonstrates routing and form state without saving business records. Users, roles and authentication use the app's real SQLite database.

![The example home page links to each routing demo](/assets/core/developing-apps/pages-routes-and-navigation/home.png)

All paths below are relative to the application. With the default `/main` deployment prefix, `/projects` appears as `/main/projects` in the browser. Keep that prefix out of route declarations. Both documentation languages use these English screenshots.

## Register a page and load its component

Open **Project list** from the example home page to see the list and its sidebar entry. [client/pages/projects/routes.ts][routes] declares the page, and [client/routes.ts][collection] collects the contribution for the runtime:

```ts
// client/pages/projects/routes.ts (excerpt)
import { FolderKanban } from 'lucide-react';
import { defineAppRoutes } from '@nocobase/app-client/plugins';

export const projectRoutes = defineAppRoutes([
  {
    name: 'business',
    navigation: { title: 'demo.business', order: 10 },
    children: [
      {
        name: 'projects',
        path: '/projects',
        auth: 'required',
        authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },
        navigation: { title: 'demo.projects', icon: FolderKanban },
        componentLoader: () => import('./index.js'),
        // The complete example also declares children here.
      },
    ],
  },
]);
```
```ts
// client/routes.ts
import { projectRoutes, appendedRoutes } from './pages/projects/routes.js';
// Retain the template appRoutes and systemSettingsRoutes.
export default [appRoutes, appendedRoutes, projectRoutes, systemSettingsRoutes];
```

`defineAppRoutes()` takes a readonly array of definitions and returns a frozen `{ parent: 'app', routes: [...] }` contribution. It does not load components immediately. Runtime `routes` accepts one contribution or a flat array of contributions; the template already imports this file in `client/runtime.ts`. Calling the function in an unused file does not register anything. Do not mutate the returned object or pass an array of contributions back into `defineAppRoutes()`.

`componentLoader` returns `Promise<{ default: Component }>`. This dynamic import loads the default export from [index.tsx][list], which uses the template's `PageContainer`, `PageHeader` and `DataTable`. A loader receives no path parameters and is not a data fetching function. For named exports, see [standalone pages](#standalone-page-and-named-export).

![A static project page with a default component export and navigation entry](/assets/core/developing-apps/pages-routes-and-navigation/projects.png)

## Path parameters and query state

Enter `Harbor` in **Search projects**. The address becomes `/projects?q=Harbor`; selecting **Harbor launch** opens `/projects/p100?q=Harbor`. `useSearchParams()` reads and updates the query. `useParams()` reads the string `projectId` in the detail page.

This excerpt from [index.tsx][list] simplifies the table cell and omits filtering:

```tsx
// client/pages/projects/index.tsx (excerpt)
const location = useLocation();
const [search, setSearch] = useSearchParams();
const query = search.get('q') ?? '';

<RecordLink to={{ pathname: project.id, search: location.search }}>
  {project.name}
</RecordLink>
<Outlet context={{ listSearch: location.search }} />
```

`RecordLink` wraps React Router's `Link`. The relative `p100` path extends the list path. Pass the query explicitly: a parent/child relationship does not preserve it automatically. The `Outlet` context lets the detail component read the list query through `useOutletContext()`.

![The q query filters the list and is included in detail links](/assets/core/developing-apps/pages-routes-and-navigation/filtered.png)

## Detail drawer and nested dialog

### Open a drawer through a child route

Declare children of the project list so details render in its `Outlet`:

```ts
// Children of the projects page (excerpt)
children: [
  {
    name: 'projectDetail',
    path: ':projectId',
    componentLoader: () => import('./detail.js'),
    children: [
      {
        name: 'projectTask',
        path: 'tasks/:taskId',
        componentLoader: () => import('./task.js'),
      },
    ],
  },
],
```

[detail.tsx][detail] presents the record with the template's `RouteDrawer`. This excerpt omits record lookup, missing-record handling and other buttons:

```tsx
// client/pages/projects/detail.tsx (excerpt)
const { projectId } = useParams();
const { listSearch } = useOutletContext<{ listSearch: string }>();

<RouteDrawer title={project.name} footer={<CloseButton />}>
  <RecordLink to={{ pathname: `tasks/${task.id}`, search: listSearch }}>
    {task.name}
  </RecordLink>
  <Outlet />
</RouteDrawer>
```

Selecting a project opens a drawer over the filtered list. Opening or refreshing `/projects/p100?q=Harbor` restores this state. **Back to list** returns to `/projects?q=Harbor`. A nonexistent record such as `/projects/missing` produces a missing-record message.

![The detail drawer keeps the filtered list behind it](/assets/core/developing-apps/pages-routes-and-navigation/drawer.png)
![An unknown project displays a missing-record message](/assets/core/developing-apps/pages-routes-and-navigation/missing.png)

### Open a task dialog inside the drawer

Select **Prepare launch checklist** to open `/projects/p100/tasks/t200?q=Harbor`. [task.tsx][task] reads its own parameter and the parent parameter, then renders `RouteDialog`:

```tsx
// client/pages/projects/task.tsx (excerpt)
const { projectId, taskId } = useParams();

<RouteDialog title={task.name} footer={<CloseTask />}>
  <p>{t('demo.taskPath', { projectId, taskId })}</p>
</RouteDialog>
```

`children` declares the hierarchy, `Outlet` places the content, and `RouteDrawer` or `RouteDialog` determines its presentation. Keep the second `Outlet` inside the detail drawer. **Back to project** closes only the inner dialog. Closing the drawer then returns to the list.

![A task dialog above the project drawer reads both path parameters](/assets/core/developing-apps/pages-routes-and-navigation/task.png)

## Full child page and breadcrumbs

### Cover the parent content

Select **Open workspace** in the drawer to open `/projects/workspace/p100?q=Harbor`. [workspace.tsx][workspace] uses the template's `RouteChildPage` to cover the parent content while keeping the application navigation available:

```tsx
// Another child of the projects page
{
  name: 'projectWorkspace',
  path: 'workspace/:projectId',
  breadcrumb: { title: 'demo.workspace' },
  componentLoader: () => import('./workspace.js'),
}

// client/pages/projects/workspace.tsx
export default function ProjectWorkspace() {
  return <RouteChildPage><ProjectPage /></RouteChildPage>;
}
```

This is still a child route, so the parent must retain its `Outlet`. For ordinary embedded content, render directly in the outlet, as the report tabs do below.

### Dynamic labels and return addresses

`breadcrumb: { title: 'demo.workspace' }` supplies a static route title. Once the project is available, `usePageBreadcrumb()` replaces it with the project name:

```tsx
// client/pages/projects/workspace.tsx (excerpt)
usePageBreadcrumb(
  project
    ? [
        {
          label: t('demo.projects'),
          to: { pathname: '/projects', search: location.search },
        },
        { label: project.name },
      ]
    : undefined,
);
```

`label` is display text and `to` is an optional destination. The final item is not a link. Pass `undefined` or `null` to use the default route breadcrumb. The innermost active declaration takes precedence; unmounting restores the outer declaration.

The screenshot shows **Project list → Harbor launch**. Selecting **Project list** returns with `q=Harbor`. The template remembers queries from visited ancestors in the current hierarchy, but a deep link or reload may lack that history. Specify `to` explicitly when returning with a query must work in those cases.

![A full child page with the project name and query-preserving breadcrumb](/assets/core/developing-apps/pages-routes-and-navigation/workspace.png)

### Standalone page and named export

Back in the drawer, select **Open as a full page** to open `/project-pages/p100?q=Harbor`. This route is a sibling of the list. It reuses the named `ProjectPage` export without rendering through the list outlet:

```ts
// A sibling route of projects
{
  name: 'projectStandalone',
  path: '/project-pages/:projectId',
  authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },
  breadcrumb: { title: 'demo.projectPage' },
  componentLoader: () =>
    import('./workspace.js').then((module) => ({ default: module.ProjectPage })),
}
```

`.then()` adapts the named export to the required `default` structure; do not return a JSX element. The standalone page and workspace share content but have different route hierarchies.

![A standalone project page reuses the named export without the list outlet](/assets/core/developing-apps/pages-routes-and-navigation/standalone.png)

## Draft dialog and leave confirmation

### Open a form and close it through routing

Select **New draft** from the list to open `/projects/new`. Static `new` takes precedence over dynamic `:projectId`. Enter a name and select **Preview draft**, then **Finish preview** to return to the list. These actions do not create a project.

![The static new child route opens a draft form](/assets/core/developing-apps/pages-routes-and-navigation/draft.png)
![Draft preview with the action that closes the dialog](/assets/core/developing-apps/pages-routes-and-navigation/draft-preview.png)

The [complete form][draft] gets `close()` from `useRouteOverlay()` inside a component rendered in the dialog:

```tsx
// Call this inside a button component rendered within RouteDialog.
const { close } = useRouteOverlay();

<Button onClick={() => {
  onFinish(); // Clear the draft dirty flag in this example.
  void close();
}}>
  {t('demo.finishPreview')}
</Button>
```

`close()` returns to the matched parent route and preserves the query, avoiding assumptions about the last URL segment. The close icon, Escape and backdrop use the same close flow. Use React Router's `useNavigate()` for ordinary programmatic navigation; prefer the template close method for route overlays.

### Confirm before leaving an unsaved draft

After entering a name, select Close. **Discard this unsaved draft?** lets you keep editing or discard and return to the list:

```tsx
// client/pages/projects/new.tsx (excerpt)
const dirtyRef = useRef(false);
const pendingDecisionRef = useRef<((allowed: boolean) => void) | null>(null);
const [confirmOpen, setConfirmOpen] = useState(false);

const canLeave = useCallback((): boolean | Promise<boolean> => {
  if (!dirtyRef.current) return true;
  return new Promise<boolean>((resolve) => {
    pendingDecisionRef.current = resolve;
    setConfirmOpen(true);
  });
}, []);

useNavigationGuard(canLeave);
// RouteDialog also receives canLeave as beforeClose.
// AlertDialog buttons call decide(false) or decide(true).
const decide = (allowed: boolean) => {
  setConfirmOpen(false);
  if (allowed) dirtyRef.current = false;
  pendingDecisionRef.current?.(allowed);
  pendingDecisionRef.current = null;
};
```

The same asynchronous decision is passed to `RouteDialog.beforeClose` and `useNavigationGuard()`. They cover overlay close and application navigation, including browser history traversal. The default template places `NavigationGuardProvider` outside the routes. Returning `false` blocks departure, `true` allows it, and a Promise waits for the choice. Clear the dirty flag when allowing departure to avoid a second confirmation during the close navigation.

The full implementation also handles `beforeunload` for reloads and leaving the site. The browser supplies that native confirmation text; application navigation guards do not replace it.

![An asynchronous navigation guard waits for the discard decision](/assets/core/developing-apps/pages-routes-and-navigation/guard.png)

## Default child page and tabs

Open **Project reports**. `/reports` redirects to `/reports/summary`; **Owners** switches to `/reports/owners`. [reports/index.tsx][reports] redirects only when the address exactly matches the parent:

```tsx
// client/pages/reports/index.tsx (excerpt)
const location = useLocation();
const parent = useResolvedPath('.');
if (matchPath({ path: parent.pathname, end: true }, location.pathname)) {
  return <Navigate replace to={{ pathname: 'summary', search: location.search }} />;
}

// These elements go in the navigation and content returned by the component.
<NavLink to={{ pathname: 'owners', search: location.search }}>
  {t('demo.owners')}
</NavLink>
<Outlet />
```

`Navigate replace` avoids adding a redundant parent entry to history. `end: true` prevents a direct visit to Owners from being redirected to Summary. `NavLink` identifies the active tab; `Outlet` renders its content. Both children inherit the report page's authorization.

![The parent report address opens Summary by default](/assets/core/developing-apps/pages-routes-and-navigation/summary.png)
![Opening Owners directly preserves that tab and its parent navigation](/assets/core/developing-apps/pages-routes-and-navigation/owners.png)

## Navigation and groups

Projects uses a pathless **Projects** group. Reports uses **Insights** with the `/reports` prefix. A group has no component and organizes children without needing its own `Outlet`:

```ts
{
  name: 'reportsGroup',
  path: '/reports',
  navigation: { title: 'demo.insights', order: 20 },
  children: [
    {
      name: 'reports',
      path: '/',
      authz: 'skip',
      navigation: { title: 'demo.reports', icon: ChartColumn },
      componentLoader: () => import('../reports/index.js'),
      children: [
        { name: 'reportSummary', path: 'summary',
          componentLoader: () => import('../reports/summary.js') },
        { name: 'reportOwners', path: 'owners',
          componentLoader: () => import('../reports/owners.js') },
      ],
    },
  ],
}
```

The child's `path: '/'` lands at the group address `/reports`. The group itself does not claim a page address. Only `navigation` creates a menu entry: details and tasks remain accessible through record links without adding menus.

`title` is text or a translation key; `icon` is a React component such as a Lucide icon, not a string or JSX element. `order` is a finite number, defaults to `0`, and sorts siblings in ascending order. Group headings do not show icons. A nested task keeps Project list selected. Authorization hides inaccessible pages and empty groups.

![Pathless and prefixed groups, with additional pages under Insights](/assets/core/developing-apps/pages-routes-and-navigation/navigation.png)

## Authentication and authorization

### Sign-in requirements and layouts

The [route definitions][routes] demonstrate all three `auth` values in separate route trees:

```ts
// Three independent routes, not a parent/child tree.
{ name: 'projects', path: '/projects', auth: 'required', /* ... */ }
{ name: 'welcome', path: '/welcome', auth: 'guest', authz: 'skip', /* ... */ }
{ name: 'publicProjects', path: '/public-projects', auth: 'optional', authz: 'skip', /* ... */ }
```

| Usage | Action | Default template behavior |
| --- | --- | --- |
| `required` | Open `/projects` in a signed-out window | Redirects to `/login`; signed-in pages use the application layout with its sidebar |
| `guest` | Open `/welcome` while signed out | Shows the guest welcome page; signed-in visitors are redirected away |
| `optional` | Open `/public-projects` signed in or out | Both identities can open the standalone layout |

![A required route sends a signed-out visitor to the login page](/assets/core/developing-apps/pages-routes-and-navigation/login.png)
![A guest route displays its welcome page before sign-in](/assets/core/developing-apps/pages-routes-and-navigation/guest.png)
![An optional route is available without signing in and uses a standalone layout](/assets/core/developing-apps/pages-routes-and-navigation/public.png)

Root routes default to `required`. Descendants inherit `auth` and cannot change it to another value. Authentication alone does not grant page access.

The current template redirects a protected visit to `/login` without automatically carrying the original destination. A guest page visited while signed in uses a safe in-app `redirect` query or returns home. For example, `/welcome?redirect=%2Freports%2Fowners` sends a signed-in visitor to Owners. Do not assume arbitrary deep links automatically resume after sign-in.

### Page grants, inheritance and denied access

The [complete routes][routes] use these authorization declarations:

```ts
// Project list and children without their own authorization declaration
 authz: { resource: { type: 'page', id: 'projects' }, action: 'access' }
// The draft page requires another page grant
 authz: { resource: { type: 'page', id: 'project-drafts' }, action: 'access' }
// Reports skip their own page authorization check but still require sign-in
 authz: 'skip'
// Administrator notes require an unrestricted identity
 authz: 'unrestricted'
```

In **System settings → Permission management → Roles and permissions**, create a `Project viewer` role granting only project page access. Create a demonstration user in **Users** and assign that role. Sign in with a separate browser session and follow the [README][readme] to verify:

- The list, details, tasks and workspace are accessible. A child without its own `authz` inherits the nearest ancestor page's effective value.
- **New draft** is hidden and `/projects/new` is denied. A child's own grant does not replace the parent's check.
- Reports remain available through `skip`, while still requiring sign-in.
- The administrator menu is hidden and `/admin-notes/child` is denied. The child's `skip` cannot bypass its parent's `unrestricted` requirement.

![A project viewer can use the list without draft or administrator controls](/assets/core/developing-apps/pages-routes-and-navigation/viewer.png)
![Project access alone is insufficient to open a new draft](/assets/core/developing-apps/pages-routes-and-navigation/draft-denied.png)
![A child with skip cannot bypass an unrestricted parent](/assets/core/developing-apps/pages-routes-and-navigation/admin-denied.png)

An administrator can open **Administrator notes → Open child page**. `unrestricted` means an identity with unrestricted access, not every signed-in user.

![An unrestricted account can open the administrator parent and child](/assets/core/developing-apps/pages-routes-and-navigation/admin.png)

With no ancestor page to inherit from, an omitted `authz` defaults to `unrestricted` for `required`, or `skip` for `guest` and `optional`. Declare it explicitly on the first page of each tree. Pure groups cannot declare `authz`.

`resource.type`, `resource.id` and `action` must be nonempty strings. Route names and permission IDs are separate; saved role grants refer to the resource ID. Pages without a navigation or breadcrumb title need a readable name in [page-permission-titles.ts][permission-titles], such as `projectCreate: 'demo.newDraft'`. `useCan()` controls buttons for the same permission. Frontend page grants do not secure APIs or data bundled into the client. This example's project data is public fiction; see [authentication, permissions and data scope](authentication-and-permissions.md) for business resources and server enforcement.

## Attach routes across files and packages

### Append to a group in the same package

Open **Export instructions** under **Insights** at `/reports/exports`. Another contribution attaches it through `parent: 'reportsGroup'`:

```ts
export const appendedRoutes = defineAppRoutes([
  {
    parent: 'reportsGroup',
    name: 'reportExports',
    path: 'exports',
    authz: 'skip',
    navigation: { title: 'demo.exports', order: 10 },
    componentLoader: () => import('../examples/exports.js'),
  },
]);
```

[client/routes.ts][collection] deliberately collects `appendedRoutes` before `projectRoutes`, showing that the target may be declared later. In a larger application, place contributions in separate files and collect them in a flat array.

![A separate same-package contribution appears under Insights](/assets/core/developing-apps/pages-routes-and-navigation/exports.png)

### Cross-package attachment and plugin options

[reporting-plugin.ts][plugin] is a client contribution factory kept in this app. `@example/project-reporting` demonstrates a plugin namespace; it is not a separate npm package to install. Use `package:group` to attach to the application's report group:

```ts
// client/reporting-plugin.ts (excerpt)
export default defineClientPlugin<{ enabled?: boolean }>({
  packageName: '@example/project-reporting',
  // The complete file also registers en-US and zh-CN locales.
  routes: (options) => defineAppRoutes(options.enabled === false ? [] : [
    {
      parent: 'pages-routes-navigation:reportsGroup',
      name: 'snapshot',
      path: 'snapshot',
      authz: 'skip',
      navigation: { title: 'demo.snapshot', order: 20 },
      componentLoader: () => import('./pages/examples/plugin-original.js'),
    },
  ]),
});

// Inside the defineClientPlugins array in client/plugins.ts
reportingPlugin({ enabled: true }),
```

`routes(options)` is a synchronous registration function returning one contribution or a flat array. It does not run again when React state or the current user changes. To try disabling the contribution, change `enabled` to `false` and clear the next section's override array to `[]` so it does not target an absent route. Restore both afterward. An isolated test also covers this option.

![Disabling the reporting contribution removes Reporting snapshot from Insights](/assets/core/developing-apps/pages-routes-and-navigation/plugin-disabled.png)

The page becomes `/reports/snapshot`, while its route ownership and translation namespace remain with the plugin. The example registers both plugin locales.

![The original reporting contribution, captured with the component override temporarily cleared](/assets/core/developing-apps/pages-routes-and-navigation/plugin-original.png)

`parent` is allowed only on contribution root entries and must target a group, not a page. Missing targets, cycles and `parent` inside existing `children` fail validation. Add page children through `children`. Siblings sort by `navigation.order`; equal values keep existing children first, then appended contributions in registration order.

### Override a plugin page component

The default example displays a custom **Reporting snapshot**. Target its `package:route` ID to replace the component:

```ts
// client/route-overrides.ts
import { defineClientRouteComponentOverrides } from '@nocobase/app-client/plugins';

export default defineClientRouteComponentOverrides([
  {
    routeId: '@example/project-reporting:snapshot',
    componentEntry: './client/pages/examples/plugin-custom',
    componentLoader: () => import('./pages/examples/plugin-custom.js'),
  },
]);

// client/runtime.ts (excerpt)
import routeComponentOverrides from './route-overrides.js';
const appRuntime = defineAppRuntime({
  // Retain createAppConfig, locales, routes, plugins and other existing options.
  routeComponentOverrides,
});
```

The runtime does not discover `route-overrides.ts` automatically: pass it explicitly to `defineAppRuntime()`. An override preserves the path, authorization, navigation, owning package and children. The component still runs under the original package's translation namespace. `componentEntry` records the source entry; `componentLoader` loads the component.

![The custom reporting component keeps its original menu entry and URL](/assets/core/developing-apps/pages-routes-and-navigation/plugin-custom.png)

Temporarily use an empty override array to see the original component, then restore it. Targets must be registered pages, not groups; each ID may be overridden only once. Do not register a duplicate path to replace a page.

## Loading, errors and unknown addresses

**Try a slow page** opens `/route-status/loading`. This [demonstration loader][routes] waits 1.2 seconds to expose the template's loading state:

```ts
{
  name: 'slowPage',
  path: '/route-status/loading',
  authz: 'skip',
  componentLoader: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return import('../examples/loaded.js');
  },
}
```
![The template loading state while the route component loads](/assets/core/developing-apps/pages-routes-and-navigation/loading.png)
![Page content after the component loads](/assets/core/developing-apps/pages-routes-and-navigation/loaded.png)

**Try a page error** opens `/route-status/error`. Its component deliberately throws to demonstrate the [ClientRoute][client-route] error interface. Do not keep this intentional exception in a production page. Reload after fixing the component or network problem. A rejected loader Promise reaches the same error interface.

![A component exception displays the error interface and retry action](/assets/core/developing-apps/pages-routes-and-navigation/error.png)

**Try an unknown address** opens the unregistered `/unknown-example`. The current [app-router.tsx][app-router] redirects it to the home page. This fallback belongs to the application template; `defineAppRoutes()` does not accept `path: '*'`.

![The template redirects an unknown address to the example home page](/assets/core/developing-apps/pages-routes-and-navigation/unknown.png)

## Configuration and boundaries

### Route fields

| Field | Page | Pure group |
| --- | --- | --- |
| `name` | Required, unique within its package | Required, unique within its package |
| `path` | Required | Optional prefix for children |
| `componentLoader` | Required | Not allowed |
| `children` | Optional | Required; may be empty |
| `navigation` | Optional; `{ title, icon?, order? }` | Required |
| `breadcrumb` | Optional; `{ title }` | Optional |
| `auth` | Optional; defaults to or inherits `required` | Optional; passed to descendants |
| `authz` | Optional; declare explicitly on the first page | Not allowed |
| `parent` | Optional, contribution roots only | Optional, contribution roots only |

Names start with a letter or digit and may then contain letters, digits, dots, underscores and hyphens. Titles are strings and icons are components, not per-user configuration callbacks. React Router fields such as `index`, `element`, `loader`, `action` and `errorElement` are not fields of this declaration API.

### Path rules and conflicts

- Top-level page paths start with `/`. Child paths append to the parent: both `new` and `/new` append; the latter does not jump to the root. Repeated and trailing slashes are normalized.
- Keep queries and hashes out of `path`. Wildcards `*`, optional parameters `?`, backslashes, and `.` or `..` segments are unsupported.
- Page addresses are unique across the app and its plugins. Conflicts ignore static segment case and parameter names: `/Projects` conflicts with `/projects`, and `/:id` conflicts with `/:projectId`. Static `new` can coexist with `:projectId`.
- Names must be unique within a package across files, groups and levels. Different packages may reuse a name, but not a page address.
- Only the application may contribute `/`. `/login`, `/register`, `/forgot-password` and `/reset-password` must use `auth: 'guest'`.

Invalid definitions stay out of the running app. [routing-contract.test.ts][contract-tests] reproduces rejection cases in isolation.

### Verify the example

Run from the example directory:

```bash
pnpm typecheck
pnpm exec vitest run tests/client/client-routes.test.ts tests/client/routing-contract.test.ts tests/client/routing-behavior.test.tsx tests/client/app-locale-coverage.test.ts tests/client/page-permission-titles.test.ts
pnpm build
```

Client interaction tests use controlled authorization responses to check nested close, query preservation, default tabs, denied access and draft confirmation. They do not replace real-account checks. The [README][readme] records browser verification, screenshot reproduction commands and the tested environment.

[app]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation
[readme]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/README.MD
[routes]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/projects/routes.ts
[collection]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/routes.ts
[list]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/projects/index.tsx
[detail]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/projects/detail.tsx
[task]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/projects/task.tsx
[workspace]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/projects/workspace.tsx
[draft]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/projects/new.tsx
[reports]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/reports/index.tsx
[permission-titles]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/settings/page-permission-titles.ts
[plugin]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/reporting-plugin.ts
[client-route]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/routing/client-route.tsx
[app-router]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/routing/app-router.tsx
[contract-tests]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/tests/client/routing-contract.test.ts
