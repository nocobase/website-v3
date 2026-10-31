---
title: Pages, routes and navigation
description: Use a dedicated routing app to learn page registration, parameters, drawers and dialogs, tabs, navigation, breadcrumbs, access control and component overrides.
---

Use `defineAppRoutes()` to declare page addresses, components, navigation and access rules. To run the [example app][app] and prepare an account, see [environment and startup](#environment-and-startup).

## Register pages

### Declare routes and connect them to the runtime

Declare pages in [client/pages/projects/routes.ts][routes] and collect them for the runtime in [client/routes.ts][collection]. This excerpt keeps the project list declaration and omits its outer group and child routes:

```ts
// client/pages/projects/routes.ts (excerpt: outer group and child routes omitted)
import { FolderKanban } from 'lucide-react';
import { defineAppRoutes } from '@nocobase/app-client/plugins';

export const projectRoutes = defineAppRoutes([
  {
    name: 'projects',
    path: '/projects',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },
    navigation: { title: 'demo.projects', icon: FolderKanban },
    componentLoader: () => import('./index.js'),
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

Open **Project list** from the example home page to see the registered page and its navigation entry. Its `authz` requires project access, which the example administrator has.

![A static project page with a default component export and navigation entry](/assets/core/developing-apps/pages-routes-and-navigation/projects.png)

[View source][routes]

### Load page components

`componentLoader` must return `Promise<{ default: Component }>`. The project list uses `import('./index.js')` to load the default export from [index.tsx][list]. The page uses the template's reusable `PageContainer`, `PageHeader` and `DataTable` components.

A module can also provide a named export. The standalone project route uses `ProjectPage` from [workspace.tsx][workspace], adapting it to the required structure:

```ts
// client/pages/projects/routes.ts
componentLoader: () =>
  import('./workspace.js').then((module) => ({ default: module.ProjectPage })),
```

Select **Open as a full page** in the project drawer to see this named export at `/project-pages/p100`.

A loader receives no route parameters and is not a data fetching function. Read parameters inside the component, and see [data requests and state management](data-requests-and-state.md) for fetching data. Do not return a JSX element directly from the loader.

![The standalone project page loaded through a named export](/assets/core/developing-apps/pages-routes-and-navigation/standalone.png)

[View source][workspace]

## Path parameters and page navigation

### Static paths and dynamic parameters

A route's `path` is relative to the application. With the default `/main` deployment prefix, `/projects` appears as `/main/projects` in the browser. Keep `/main` out of route declarations.

The [example routes][routes] use both static paths and dynamic parameters:

| Application path | Purpose |
| --- | --- |
| `/projects` | Project list |
| `/projects/new` | Draft form; static `new` takes precedence over `:projectId` |
| `/projects/:projectId` | Open details by project ID |
| `/projects/:projectId/tasks/:taskId` | Identify both a project and a task |

[detail.tsx][detail] uses React Router's [`useParams()`](https://reactrouter.com/api/hooks/useParams) to read a parameter and find its demonstration record:

```tsx
import { useParams } from 'react-router';
import { projects } from './data.js';

// Inside the ProjectDetail component
const { projectId } = useParams();
const project = projects.find((item) => item.id === projectId);
```

Parameter values are strings, and children can read parent parameters. `/projects/p100` resolves Harbor launch; `/projects/missing` displays a missing-record message. The template handles route matching; the page implements record lookup and missing-record handling.

![An unknown project displays a missing-record message](/assets/core/developing-apps/pages-routes-and-navigation/missing.png)

[View source][detail]

### Query parameters and navigation

Enter `Harbor` in **Search projects**. The address becomes `/projects?q=Harbor`; selecting **Harbor launch** opens `/projects/p100?q=Harbor`. [index.tsx][list] updates the query through React Router's [`useSearchParams()`](https://reactrouter.com/api/hooks/useSearchParams). This excerpt omits table configuration and unrelated component props:

```tsx
// client/pages/projects/index.tsx
const location = useLocation();
const [search, setSearch] = useSearchParams();
const query = search.get('q') ?? '';

<Input
  value={query}
  onChange={(event) => {
    const next = new URLSearchParams(search);
    if (event.target.value) next.set('q', event.target.value);
    else next.delete('q');
    setSearch(next, { replace: true });
  }}
/>

// Inside the DataTable name cell
<RecordLink to={{ pathname: row.original.id, search: location.search }}>
  {row.original.name}
</RecordLink>
```

`RecordLink` wraps React Router's [`Link`](https://reactrouter.com/api/components/Link). Relative `p100` extends the list path. Pass the query explicitly: nesting does not preserve it automatically. The list filters its fixtures by `q`; `setSearch(next, { replace: true })` avoids creating a history entry for each edit.

![The q query filters the list and is included in detail links](/assets/core/developing-apps/pages-routes-and-navigation/filtered.png)

[View source][list]

## Nested routes and page presentation

### Standalone pages and child routes

A page can be registered independently or as another page's child. The difference is whether it renders through the parent's content outlet:

| Declaration | Example address | Content location |
| --- | --- | --- |
| Sibling of the list | `/project-pages/p100` | Standalone page, outside the list outlet |
| Inside the list's `children` | `/projects/p100` | The list's `Outlet` |

The standalone page in [routes.ts][routes] is a sibling of the list and reuses `ProjectPage`:

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

See the screenshot under [Load page components](#load-page-components): the standalone page reuses the named export without the list outlet.

Select **Open as a full page** in the drawer to open this independent page. To host details within the list instead, declare the hierarchy through `children`:

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

The parent must render React Router's [`Outlet`](https://reactrouter.com/api/components/Outlet). This list also passes its query through `context`; the detail component reads it with `useOutletContext()`:

```tsx
// client/pages/projects/index.tsx
const context = useMemo(() => ({ listSearch: location.search }), [location.search]);

<Outlet context={context} />
```

`children` defines the hierarchy, and `Outlet` supplies a rendering location. The page component chooses whether to embed content, cover the parent, or display a drawer or dialog. A child route declaration does not create those presentations automatically.

[View source][routes]

### Embedded child pages and default tabs

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

[View source][reports]

### Child pages that cover parent content

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

The workspace still renders through the list's outlet. Its heading and breadcrumb use the project name; see [static and dynamic breadcrumbs](#static-and-dynamic-breadcrumbs) for that configuration.

![RouteChildPage covers the list content while keeping application navigation](/assets/core/developing-apps/pages-routes-and-navigation/workspace.png)

[View source][workspace]

### Route drawers and nested dialogs

[detail.tsx][detail] uses the template's `RouteDrawer` to display the project. This excerpt omits record lookup, missing-record handling and other buttons:

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

Selecting a project opens the drawer over the filtered list. Opening or refreshing `/projects/p100?q=Harbor` restores this page state.

![The detail drawer keeps the filtered list behind it](/assets/core/developing-apps/pages-routes-and-navigation/drawer.png)

Select **Prepare launch checklist** to open `/projects/p100/tasks/t200?q=Harbor`. [task.tsx][task] reads its own parameter and the parent parameter, then renders `RouteDialog`:

```tsx
// client/pages/projects/task.tsx (excerpt)
const { projectId, taskId } = useParams();

<RouteDialog title={task.name} footer={<CloseTask />}>
  <p>{t('demo.taskPath', { projectId, taskId })}</p>
</RouteDialog>
```

Keep the second `Outlet` inside the detail drawer: it renders the task dialog. **Back to project** closes only the inner dialog. Closing the drawer then returns to the list.

![A task dialog above the project drawer reads both path parameters](/assets/core/developing-apps/pages-routes-and-navigation/task.png)

[View detail source][detail] · [View task source][task]

## Return navigation and leave confirmation

### Return to the parent and preserve query parameters

Try the draft dialog from `/projects?q=Harbor`: **New draft** opens `/projects/new?q=Harbor`. Enter a name and select **Preview draft**, then **Finish preview** to return to `/projects?q=Harbor` with the search preserved. These actions do not create a project.

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

`close()` returns to the matched parent route and preserves the query, avoiding assumptions about the last URL segment. The close icon, Escape and backdrop use the same close flow. For ordinary programmatic navigation, see React Router's [`useNavigate()`](https://reactrouter.com/api/hooks/useNavigate).

[View source][draft]

### Confirm before leaving unsaved changes

After entering a name, select Close. **Discard this unsaved draft?** lets you keep editing or discard and return to the list:

```tsx
// client/pages/projects/new.tsx (excerpt)
const dirtyRef = useRef(false);
const pendingDecisionRef = useRef<{
  promise: Promise<boolean>;
  resolve: (allowed: boolean) => void;
} | null>(null);
const [confirmOpen, setConfirmOpen] = useState(false);

const canLeave = useCallback((): boolean | Promise<boolean> => {
  if (!dirtyRef.current) return true;
  if (!pendingDecisionRef.current) {
    let resolve!: (allowed: boolean) => void;
    const promise = new Promise<boolean>((done) => { resolve = done; });
    pendingDecisionRef.current = { promise, resolve };
    setConfirmOpen(true);
  }
  return pendingDecisionRef.current.promise;
}, []);

useNavigationGuard(canLeave);
// RouteDialog also receives canLeave as beforeClose.
// AlertDialog buttons call decide(false) or decide(true).
const decide = (allowed: boolean) => {
  setConfirmOpen(false);
  if (allowed) dirtyRef.current = false;
  pendingDecisionRef.current?.resolve(allowed);
  pendingDecisionRef.current = null;
};
useEffect(() => () => pendingDecisionRef.current?.resolve(false), []);
```

The same asynchronous decision is passed to `RouteDialog.beforeClose` and `useNavigationGuard()`. They cover overlay close and application navigation, including browser history traversal. The default template places `NavigationGuardProvider` outside the routes. Returning `false` blocks departure, `true` allows it, and a Promise waits for the choice.

While confirmation is open, overlapping requests share one Promise so a single choice settles every waiter without overwriting a callback. Resolve any pending request with `false` on unmount. Clear the dirty flag when allowing departure to avoid a second confirmation during the close navigation.

The full implementation also handles `beforeunload` for reloads and leaving the site. The browser supplies that native confirmation text; application navigation guards do not replace it.

![An asynchronous navigation guard waits for the discard decision](/assets/core/developing-apps/pages-routes-and-navigation/guard.png)

[View source][draft]

## Navigation menus and breadcrumbs

### Menu configuration, groups and selection

A route's `navigation` creates its menu entry. A pathless **Projects** group organizes the list; omitting the complete page declaration, its group looks like this:

```ts
{
  name: 'business',
  navigation: { title: 'demo.business', order: 10 },
  children: [
    // Place the projects page declaration here.
  ],
}
```

Reports uses an **Insights** group with the `/reports` prefix. A group has no component and organizes its children without needing its own `Outlet`:

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

[View source][routes]

### Static and dynamic breadcrumbs

`breadcrumb` and `usePageBreadcrumb()` connect route metadata and page content to the application template breadcrumb.

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

The screenshot under [Child pages that cover parent content](#child-pages-that-cover-parent-content) shows **Project list → Harbor launch**. Selecting **Project list** returns with `q=Harbor`. The template remembers queries from visited ancestors in the current hierarchy, but a deep link or reload may lack that history. Specify `to` explicitly when returning with a query must work in those cases.

[View source][workspace]

## Authentication and page permissions

### Sign-in requirements and page layouts

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

[View source][routes]

### Permission declarations, inheritance and denied access

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

[View source][routes]

## Route composition, attachment and overrides

### Attach within and across packages

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

[reporting-plugin.ts][plugin] is a client contribution factory kept in this app. `@example/project-reporting` demonstrates a plugin namespace; it is not a separate npm package to install. Use `package:group` to attach across packages:

```ts
// client/reporting-plugin.ts
{
  parent: 'pages-routes-navigation:reportsGroup',
  name: 'snapshot',
  path: 'snapshot',
  authz: 'skip',
  navigation: { title: 'demo.snapshot', order: 20 },
  componentLoader: () => import('./pages/examples/plugin-original.js'),
}
```

Attaching this entry to the app's `reportsGroup` produces `/reports/snapshot`. The route and translation namespace still belong to the plugin, which registers both locales. The shipped configuration enables a [component override](#replace-page-components). Temporarily clear the override array in `client/route-overrides.ts` to see the original page below, then restore it.

![The original reporting contribution, captured with the component override temporarily cleared](/assets/core/developing-apps/pages-routes-and-navigation/plugin-original.png)

`parent` is allowed only on contribution root entries and must target a group, not a page. Missing targets, cycles and `parent` inside existing `children` fail validation. Add page children through `children`. Siblings sort by `navigation.order`; equal values keep existing children first, then appended contributions in registration order.

[View app route source][routes] · [View plugin contribution source][plugin]

### Enable routes through plugin options

A plugin's `routes` can be a synchronous function of its registration options. [reporting-plugin.ts][plugin] uses `enabled` to decide whether to contribute its page:

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

`routes(options)` is a synchronous registration function returning one contribution or a flat array. It does not run again when React state or the current user changes. To try disabling the contribution, change `enabled` to `false` and clear the [component override](#replace-page-components) array to `[]` so it does not target an absent route. Restore both afterward. An isolated test also covers this option.

![Disabling the reporting contribution removes Reporting snapshot from Insights](/assets/core/developing-apps/pages-routes-and-navigation/plugin-disabled.png)

[View source][plugin]

### Replace page components

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

[View override source][overrides] · [View runtime registration source][runtime]

## Loading states and error handling

### Page loading and failures

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

[View loader source][routes] · [View template error handling source][client-route]

### Handle unmatched addresses

**Try an unknown address** opens the unregistered `/unknown-example`. The current [app-router.tsx][app-router] redirects it to the home page. This fallback belongs to the application template; `defineAppRoutes()` does not accept `path: '*'`.

![The template redirects an unknown address to the example home page](/assets/core/developing-apps/pages-routes-and-navigation/unknown.png)

[View source][app-router]

## Route configuration reference

### Configuration fields and defaults

| Field | Page | Pure group |
| --- | --- | --- |
| `name` | Required, unique within its package | Required, unique within its package |
| `path` | Required | Optional prefix for children |
| `componentLoader` | Required | Not allowed |
| `children` | Optional | Required; may be empty |
| `navigation` | Optional; `{ title, icon?, order? }` | Required |
| `breadcrumb` | Optional; `{ title }` | Optional |
| `auth` | Optional; roots default to `required`, descendants inherit | Optional; passed to descendants |
| `authz` | Optional; declare explicitly on the first page | Not allowed |
| `parent` | Optional, contribution roots only | Optional, contribution roots only |

Names start with a letter or digit and may then contain letters, digits, dots, underscores and hyphens. Titles are strings and icons are components, not per-user configuration callbacks. React Router fields such as `index`, `element`, `loader`, `action` and `errorElement` are not fields of this declaration API.

[View source][routes]

### Path rules and conflict checks

- Top-level page paths start with `/`. Child paths append to the parent: both `new` and `/new` append; the latter does not jump to the root. Repeated and trailing slashes are normalized.
- Keep queries and hashes out of `path`. Wildcards `*`, optional parameters `?`, backslashes, and `.` or `..` segments are unsupported.
- Page addresses are unique across the app and its plugins. Conflicts ignore static segment case and parameter names: `/Projects` conflicts with `/projects`, and `/:id` conflicts with `/:projectId`. Static `new` can coexist with `:projectId`.
- Names must be unique within a package across files, groups and levels. Different packages may reuse a name, but not a page address.
- Only the application may contribute `/`. `/login`, `/register`, `/forgot-password` and `/reset-password` must use `auth: 'guest'`.

Invalid definitions stay out of the running app. [routing-contract.test.ts][contract-tests] reproduces rejection cases in isolation.

## Example source and setup

### Environment and startup

The [example app][app] uses default template `1.0.0-beta.85` and locks `@nocobase/app-client` to `4.0.0-beta.5`. It requires Node.js 24 and pnpm 11.7.0.

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 2700e75f5ed0d927c0c37b53e4ffdf105961cc52
cd apps/pages-routes-navigation
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

SQLite is the demonstration and verification environment for this example. It needs no separate database service; it is not a routing requirement. To open the app from another device, set the listening address and `app.publicOrigin` as described in the [example README][readme], then open `/main/` on that address. The local `config.yml` defines the initial account under `users.initialAdmin`.

The home page links to each demo. Projects and tasks are public fictional fixtures. **New draft** demonstrates routing and form state without saving business records. Users, roles and authentication use the app's real SQLite database.

![The example home page links to each routing demo](/assets/core/developing-apps/pages-routes-and-navigation/home.png)

### Verify the example

Run from the example directory:

```bash
pnpm typecheck
pnpm exec vitest run tests/client/client-routes.test.ts tests/client/routing-contract.test.ts tests/client/routing-behavior.test.tsx tests/client/app-locale-coverage.test.ts tests/client/page-permission-titles.test.ts
pnpm build
```

Client interaction tests use controlled authorization responses to check nested close, query preservation, default tabs, denied access and draft confirmation. They do not replace real-account checks. The [README][readme] records browser verification, screenshot reproduction commands and the tested environment.

[app]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation
[readme]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/README.MD
[routes]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/projects/routes.ts
[collection]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/routes.ts
[list]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/projects/index.tsx
[detail]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/projects/detail.tsx
[task]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/projects/task.tsx
[workspace]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/projects/workspace.tsx
[draft]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/projects/new.tsx
[reports]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/reports/index.tsx
[permission-titles]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/pages/settings/page-permission-titles.ts
[plugin]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/reporting-plugin.ts
[client-route]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/routing/client-route.tsx
[app-router]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/routing/app-router.tsx
[contract-tests]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/tests/client/routing-contract.test.ts
[overrides]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/route-overrides.ts
[runtime]: https://github.com/nocobase/docs-examples-v3/tree/2700e75f5ed0d927c0c37b53e4ffdf105961cc52/apps/pages-routes-navigation/client/runtime.ts
