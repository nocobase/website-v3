---
title: Pages, routing, and navigation
description: Complete defineAppRoutes usage, including page loading, path parameters, nested routes, navigation groups, breadcrumbs, access control, cross-module contributions, and configuration limits.
---

Use `defineAppRoutes()` in `client/routes.ts` to declare page URLs, load components, add menu entries, and set authentication and authorization requirements. Applications and plugins use the same route declarations.

## Basic usage

### Register a page

The following adds a `/projects` page that any signed-in user can access:

```ts
// client/routes.ts
import { FolderKanban } from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const projectRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'projects',
    path: '/projects',
    auth: 'required',
    authz: 'skip',
    navigation: {
      title: 'projects.title',
      icon: FolderKanban,
      order: 20,
    },
    componentLoader: () => import('./pages/projects/index.js'),
  },
]);

export default [projectRoutes];
```

In an existing app, add `projectRoutes` to the existing export array and retain its other routes. The default template already imports this file in `client/runtime.ts` and passes it to the `routes` property of `defineAppRuntime()`. Calling `defineAppRoutes()` in a file that nothing imports does not register a page.

The page module must default-export a React component:

```tsx
// client/pages/projects/index.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';

export default function ProjectsPage() {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader title={t('projects.title')} />
    </PageContainer>
  );
}
```

Merge `projects.title` into the existing `client/locales/en-US.ts` and `zh-CN.ts`, using “Projects” and “项目”. See [Localization](localization.md). Template imports use `.js` extensions even when the source file is `.tsx`.

For an application mounted at `/main/`, the page URL is `/main/projects`; its route `path` remains `/projects`. Here, `authz: 'skip'` adds no page authorization check, while authentication still applies. To restrict the page by role, use the declarations under [Access control](#authentication-and-authorization).

### Argument and return value

`defineAppRoutes()` takes a readonly array of route definitions and returns a route contribution object with this shape:

```ts
{
  parent: 'app',
  routes: [/* Page or group definitions */],
}
```

Its type is `AppClientAppRoutesContribution`, also available through the alias `AppClientRouteContribution`. This is a declaration collected by the runtime, not a React component; declaring it does not immediately execute `componentLoader`. The returned declaration is frozen. Assemble your array first rather than calling `push()` or modifying route entries afterwards.

The contribution's `parent: 'app'` identifies the application route surface. It is separate from an individual route's [`parent`](#append-to-a-group-in-another-file-or-plugin), which attaches that route to a group.

## Page paths and component loading

### Static paths and dynamic parameters

| Path | Purpose | Example URL |
| --- | --- | --- |
| `/projects` | A fixed page | `/projects` |
| `/projects/:projectId` | A record selected by a parameter | `/projects/p100` |
| `/projects/:projectId/tasks/:taskId` | Multiple path parameters | `/projects/p100/tasks/t200` |

Dynamic pages normally omit `navigation`: a fixed menu entry cannot supply a value for `:projectId`. A detail page can be a separate route or a child of the list. A separate route replaces the page; a child renders in the parent's `Outlet`.

Read parameters with React Router's [`useParams()`](https://reactrouter.com/api/hooks/useParams). Values are strings, and child pages can also read their parents' parameters:

```tsx
import { useParams } from 'react-router';

export default function ProjectDetailPage() {
  const { projectId } = useParams<'projectId'>();
  // Use projectId to request the corresponding project.
  return <div>{projectId}</div>;
}
```

### Path rules

- An outermost `path` starts with `/`. The application supplies the deployment base path; leave it out of declarations.
- Child paths are appended to their parent. Prefer `new`; `/new` is also appended and does not escape to the application root.
- Repeated slashes and trailing slashes are normalized.
- Queries and hashes are not part of route definitions. Do not declare `/projects?q=abc` or `/projects#summary`. Supply them when navigating and read them with `useSearchParams()` or `useLocation()`.
- Wildcards (`*`), optional parameters containing `?`, backslashes, and `.` or `..` path segments are not supported.

For a parent at `/projects`:

| Child `path` | Resolved application path |
| --- | --- |
| `new` or `/new` | `/projects/new` |
| `:projectId` | `/projects/:projectId` |
| `/projects/new` | `/projects/projects/new`, usually an accidental repeated prefix |

### Two forms of `componentLoader`

Prefer a dynamic import of a default-exported page so it loads on demand:

```ts
componentLoader: () => import('./pages/projects/index.js'),
```

For a named export, adapt the module to the required `{ default: Component }` shape:

```ts
componentLoader: () =>
  import('./pages/projects/index.js').then((module) => ({
    default: module.ProjectsPage,
  })),
```

`componentLoader` receives no route arguments and must return a Promise containing the default component. Do not return a JSX element or use a data-fetching function as the component loader. Read parameters and load data inside the page; see [Data requests and state management](data-requests-and-state.md).

## Nested pages and navigation

### Declare children

This entry can replace the earlier `projects` route to add create and detail pages:

```ts
{
  name: 'projects',
  path: '/projects',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },
  navigation: { title: 'projects.title', icon: FolderKanban },
  componentLoader: () => import('./pages/projects/index.js'),
  children: [
    {
      name: 'projectCreate',
      path: 'new',
      authz: {
        resource: { type: 'composite', id: 'projects' },
        action: 'create',
      },
      componentLoader: () => import('./pages/projects/new.js'),
    },
    {
      name: 'projectDetail',
      path: ':projectId',
      breadcrumb: { title: 'projects.detail' },
      componentLoader: () => import('./pages/projects/detail.js'),
    },
  ],
}
```

The children resolve to `/projects/new` and `/projects/:projectId`. The static `new` path takes precedence over the parameter match. Children can have further children, such as `/projects/:projectId/edit`. Multiple routes with distinct names and paths can also load the same component.

A parent page must render an `Outlet` for its children:

```tsx
import { Outlet } from 'react-router';

// Inside the project list component's returned content.
<PageContainer>
  <PageHeader title={t('projects.title')} />
  {/* Project list */}
  <Outlet />
</PageContainer>
```

Pass loaded data or refresh functions through `<Outlet context={{ reload }} />`; children read them with `useOutletContext()`. The template supplies an `Outlet` for a pure navigation group, but a route with its own page component controls its own outlet placement.

### Choose how a child is displayed

`children` defines URLs and hierarchy. The child component determines presentation:

| Child component content | Use case |
| --- | --- |
| Ordinary content | A tab or page section rendered inline at the `Outlet` |
| `RouteDialog` | A short create or edit form over the parent page |
| `RouteDrawer` | Record details or editing in a side panel |
| `RouteChildPage` | A long form or complex page covering the content area while retaining application navigation |

These are default-template components, not fields of `defineAppRoutes`. Dialogs and drawers supply their own containers. Inline tabs reuse the parent's container. A covering child page uses its own `PageContainer` inside `RouteChildPage`. See [Page layouts](page-layouts.md).

### Links and programmatic navigation

Use `Link` or `NavLink` in the parent to open a child. Use `useNavigate()` when navigation follows another action, such as a menu command. Carrying the current query preserves list search and pagination:

```tsx
import { Link, useLocation, useNavigate } from 'react-router';

const location = useLocation();
const navigate = useNavigate();

<Link to={{ pathname: 'new', search: location.search }}>
  {t('projects.new')}
</Link>;

// In the child page, return to the parent after closing or saving.
await navigate(
  { pathname: '..', search: location.search },
  { relative: 'route', replace: true },
);
```

The link and return action belong in the parent and child respectively. Relative navigation defaults to **the route rendering the link**, rather than the last segment currently visible in the address bar. At `/projects/p100/tasks`, an `edit` link rendered by the detail parent resolves to `/projects/p100/edit`; one rendered by the `tasks` child resolves to `/projects/p100/tasks/edit`. React Router also supports `relative: 'path'` when resolution should follow URL segments; see [Relative path resolution](https://reactrouter.com/api/hooks/useResolvedPath).

Inside `RouteDialog` or `RouteDrawer`, call `useRouteOverlay().close()` to return to the parent. Do not rely exclusively on `navigate(-1)`: a directly opened child URL may have another website as its previous history entry. `replace: true` replaces the current entry so Back does not reopen a just-submitted form.

Queries do not track which page owns each parameter. When list and child pages share a URL, retain list parameters on return and remove parameters belonging only to the detail or tab.

### Default children and tabs

`defineAppRoutes` has no `index` or `redirect` field. If a parent page already occupies `/reports`, registering a child page at the same resolved path conflicts with it.

To show `/reports/summary` when someone enters `/reports`, declare `summary` and `owners` child routes and redirect only when the parent URL itself matches:

```tsx
import {
  Navigate,
  Outlet,
  matchPath,
  useLocation,
  useResolvedPath,
} from 'react-router';

export default function ReportsPage() {
  const location = useLocation();
  const parent = useResolvedPath('.');
  const atParent = matchPath(
    { path: parent.pathname, end: true },
    location.pathname,
  );

  if (atParent) {
    return (
      <Navigate
        replace
        to={{ pathname: 'summary', search: location.search }}
      />
    );
  }

  return <Outlet />;
}
```

This component shows only the redirect logic and assumes both tabs inherit the parent's permission. Build the tab bar with `NavLink`; tabs normally omit their own `navigation` and `breadcrumb`. Opening `/reports/owners` directly must retain that URL, rather than unconditionally redirecting to the default tab. [`Navigate`'s `replace`](https://reactrouter.com/api/components/Navigate) avoids repeated default redirects when going Back.

If tabs have different permissions, wait for permission checks and choose the first accessible tab. If none is accessible, show the appropriate state without redirecting.

## Navigation entries and groups

### Configure a menu entry

```ts
navigation: {
  title: 'projects.title',
  icon: FolderKanban,
  order: 20,
},
```

| Field | Purpose |
| --- | --- |
| `title` | Required, nonempty string. The default template looks up a translation in the owning package's namespace, falling back to the original text; use translation keys for multilingual apps |
| `icon` | Optional component accepting `className`; lucide-react icons work directly. Pass the component, not `<FolderKanban />` |
| `order` | Optional number, lower first among siblings; defaults to `0`. Ties retain registration order |

Omitting `navigation` leaves the page accessible through its URL or links. Details, create dialogs, and tabs commonly omit it. While they are open, the default template selects the nearest ancestor page with a menu entry.

A parameterized page cannot declare `navigation`. A static child segment does not change this rule if its full resolved path still contains a parameter.

### Create a group without a page

A group requires `name`, `navigation`, and `children`. It has no `componentLoader` and cannot declare `authz`:

```ts
const businessRoutes = defineAppRoutes([
  {
    name: 'business',
    navigation: { title: 'navigation.business', order: 10 },
    children: [
      {
        name: 'projects',
        path: '/projects',
        authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },
        navigation: { title: 'projects.title' },
        componentLoader: () => import('./pages/projects/index.js'),
      },
    ],
  },
]);
```

This is an alternative organization of the earlier project route; do not register it twice. A group without a `path` changes menu hierarchy only: the project URL remains `/projects`. Groups can be nested further.

A group can also supply a path prefix. A group at `/settings` with a child at `projects` produces `/settings/projects`. The group itself has no page, and opening its URL does not automatically select its first child. To provide a landing page at the group's own URL, declare an ordinary child page with `path: '/'`, provided no other page occupies that URL.

Use `children: []` to reserve a group for contributions from other modules. The default template shows only groups with visible page entries. Empty groups, groups whose children have no menu entries, and groups whose children are all hidden by permissions are omitted.

## Breadcrumbs

### Static titles

`breadcrumb` names a level in the page hierarchy and is allowed on dynamic paths:

```ts
{
  name: 'projectDetail',
  path: ':projectId',
  breadcrumb: { title: 'projects.detail' },
  componentLoader: () => import('./pages/projects/detail.js'),
}
```

`breadcrumb.title` is a nonempty string, translated in the same way as a menu title, not a callback that reads record names. Navigation and breadcrumbs are separate metadata. The default template's header uses these rendering rules:

- An explicit `breadcrumb` supplies the level's title.
- A page with `navigation` but no `breadcrumb` uses `navigation.title`. This fallback belongs to the template.
- A pure group contributes a breadcrumb level only when it declares `breadcrumb`. Dialogs and tabs without either declaration add no level.
- Earlier page levels are links; pure groups are text; the last level identifies the current page. Denied pages are omitted from the default trail.

`AppLayout` already renders the breadcrumb. Business pages do not need another `Breadcrumbs` component. The standalone layout for guest and optional-auth pages has no such header.

### Dynamic titles and return destinations

To show a project name, declare the **whole trail** inside the page with `usePageBreadcrumb()`:

```tsx
import { usePageBreadcrumb } from '@nocobase/app-client';

// project is the loaded record; location comes from useLocation().
usePageBreadcrumb(
  project
    ? [
        {
          label: t('projects.title'),
          to: { pathname: '/projects', search: location.search },
        },
        { label: project.name },
      ]
    : undefined,
);
```

`label` is display text and `to` is an optional destination; the last level is never a link. Pass `undefined` or `null` while the record loads to retain the route-derived trail. If both parent and child declare a trail, the inner page wins; closing it restores the outer declaration.

The template remembers queries from ancestor pages visited within the current route hierarchy. A direct detail URL or reload has no such recorded visit, so default ancestor links have no query. When a deep link must carry list conditions back, specify `to` explicitly as above and keep only parameters owned by the list. Avoid duplicating a back button when the breadcrumb already supplies the same return path.

## Authentication and authorization

### `auth`: sign-in requirements

| Value | Behavior | Default-template layout |
| --- | --- | --- |
| `required` | Requires sign-in; signed-out visitors enter the sign-in flow. Default for an outermost route | Application layout with sidebar and header |
| `guest` | Sign-in, registration, and other guest pages; signed-in users are redirected away | Standalone page layout |
| `optional` | Available signed in or out; the page adapts its content to the session | Standalone page layout |

Children inherit `auth`, including through groups. They may omit it or repeat the same value, but cannot change it. Declare pages with different authentication requirements in separate route trees.

### `authz`: access requirements

| Configuration | Use |
| --- | --- |
| `{ resource: { type, id }, action }` | Check the specified resource and action |
| `'skip'` | Skip this page's own authorization check; authentication and parent checks still apply |
| `'unrestricted'` | Admit only identities with unrestricted access, such as root. This does not mean public access and is not an assignable page grant |

Choose resources and actions according to the page:

```ts
// Enter a business page.
authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },

// Open a create page only if the user can create projects.
authz: { resource: { type: 'composite', id: 'projects' }, action: 'create' },

// Read a particular settings item.
authz: { resource: { type: 'settings', id: 'project-settings' }, action: 'read' },
```

`type`, `id`, and `action` must be nonempty strings. The relevant server capability must register business resources such as `composite` and `settings` and their actions. A route declaration neither creates those resources nor grants users access automatically.

### Inheritance and defaults

1. A page with an explicit `authz` uses that declaration.
2. An omitted child declaration inherits the nearest ancestor **page's** effective value; intervening groups do not change it.
3. With no ancestor page to inherit from, `auth: 'required'` defaults to `'unrestricted'`; `guest` and `optional` default to `'skip'`. Development mode warns about the omission.

Declare `authz` explicitly on the first page of each path. Otherwise a new page may be visible only to administrators because of the default. Pure navigation groups cannot declare `authz`.

A child's own permission or `'skip'` never bypasses its parent. In the project example, opening the create page requires both the list's `projects/access` and the child's `projects/create`.

The default template checks permission before loading the page and filters menu entries accordingly. Use `useCan()` for operation buttons inside a page. Client checks do not replace API authorization: endpoints must independently check authentication, business actions, and data scopes. See [Authentication, permissions, and data scopes](authentication-and-permissions.md).

Route names and permission IDs need not match. Role grants persist `authz.resource.id`; renaming a route does not migrate that identifier. Change translations to rename menu text. For a `page/access` page without navigation or breadcrumbs, add a readable permission label through the template's `client/pages/settings/page-permission-titles.ts`.

## Append to a group in another file or plugin

When one module declares a settings group and another supplies a page, use the route entry's `parent`:

```ts
const settingsRoutes = defineAppRoutes([
  {
    name: 'settings',
    path: '/settings',
    navigation: { title: 'settings.title' },
    children: [],
  },
]);

const projectSettingsRoutes = defineAppRoutes([
  {
    parent: 'settings',
    name: 'projectSettings',
    path: 'projects',
    authz: {
      resource: { type: 'settings', id: 'project-settings' },
      action: 'read',
    },
    navigation: { title: 'projects.settings', order: 20 },
    componentLoader: () => import('./pages/settings/projects.js'),
  },
]);

export default [settingsRoutes, projectSettingsRoutes];
```

The declarations can live in separate files and be aggregated in the export. The resulting URL is `/settings/projects`.

| Declaration | Target |
| --- | --- |
| `parent: 'settings'` | A group named `settings` in the current app or plugin package |
| `parent: '@acme/admin:settings'` | A group named `settings` contributed by `@acme/admin` |

Rules:

- `parent` is allowed only on root entries passed to `defineAppRoutes()`, not inside an existing `children` array.
- The target must be a **group**, not a page with a component. To add children to a page, change its `children` declaration.
- Both pages and groups can be appended. Their paths are relative to the target group, and they inherit its authentication requirements and ancestor-page authorization.
- Forward references work, but both contributions must be registered in the same application. Missing targets and cycles raise errors; groups are not created or merged automatically.
- Appending a route does not change its owning package, route ID, or translation namespace.
- Siblings sort by `navigation.order`. Equal values retain the group's original children first, followed by appended entries in contribution registration order.

## Split, reuse, and contribute routes from plugins

### Aggregate route files

The application's `routes` accepts a single contribution or an array of contributions. Each module can export its own `defineAppRoutes()` result:

```ts
// client/routes.ts
import projectRoutes from './pages/projects/routes.js';
import settingsRoutes from './pages/settings/routes.js';

export default [projectRoutes, settingsRoutes];
```

If a module already exports an array of contributions, flatten it: `export default [...projectRoutes, settingsRoutes]`. Do not pass contribution objects back into `defineAppRoutes()`, which takes page and group definitions.

### Generate routes from plugin options

`AppClientRoutes<TOptions>` also accepts a synchronous function returning a contribution or contribution array. A plugin can decide whether to contribute pages from its registration options:

```ts
import { defineAppRoutes, defineClientPlugin } from '@nocobase/app-client/plugins';

interface ProjectOptions {
  enabled?: boolean;
}

export default defineClientPlugin<ProjectOptions>({
  packageName: '@acme/projects',
  routes: (options) =>
    defineAppRoutes(
      options.enabled === false
        ? []
        : [
            {
              name: 'projects',
              path: '/projects',
              authz: {
                resource: { type: 'page', id: 'projects' },
                action: 'access',
              },
              navigation: { title: 'projects.title' },
              componentLoader: () => import('./pages/projects/index.js'),
            },
          ],
    ),
});
```

Register it through `defineClientPlugins([...])` in the application's `client/plugins.ts`, for example with `projectsPlugin({ enabled: true })`, and supply the plugin's locale resources. See [Plugin pages, routes, and menus](../extension-development/pages-and-menus.md) for the complete setup.

These are registration-time options; routes are not regenerated whenever React state or the current user changes. Use `authz` for user-dependent access. `defineAppRoutes` itself always takes an array, never a callback or Promise.

### Route IDs and component overrides

A resolved route ID is `package-name:route-name`, such as `@acme/projects:projects`. Within one package, `name` must be unique across files, groups, and nesting levels. Different packages may reuse a name, but page paths must still be unique.

To replace an existing page component, use the separate override API in the template's `client/route-overrides.ts`:

```ts
import { defineClientRouteComponentOverrides } from '@nocobase/app-client/plugins';

export default defineClientRouteComponentOverrides([
  {
    routeId: '@acme/projects:projects',
    componentLoader: () => import('./pages/custom-projects.js'),
  },
]);
```

An override preserves the path, permissions, menu, and children while replacing the component. The target must already be registered and must be a page. Groups and duplicate overrides of the same ID are rejected. Do not register a duplicate path to replace a page; see [Using and managing plugins](manage-plugins.md) for related extension mechanisms.

## Configuration and constraints reference

### All route definition fields

An entry is either a page or a pure navigation group:

| Field | Page | Group | Description |
| --- | --- | --- | --- |
| `name` | Required | Required | Unique within its package; starts with a letter or digit, followed by letters, digits, dots, underscores, or hyphens |
| `path` | Required | Optional | Page path or group prefix, joined relative to the parent |
| `componentLoader` | Required | Not allowed | `() => Promise<{ default: Component }>` |
| `children` | Optional | Required | Child page/group definitions; an empty array reserves a group for contributions |
| `navigation` | Optional | Required | `{ title, icon?, order? }` |
| `breadcrumb` | Optional | Optional | `{ title }`, a static title or translation key |
| `auth` | Optional | Optional | `'required'`, `'guest'`, or `'optional'`; outermost default is `'required'`, children inherit |
| `authz` | Optional; declare on the first page | Not allowed | Permission request, `'skip'`, or `'unrestricted'`; inheritance rules above |
| `parent` | Optional, contribution roots only | Optional, contribution roots only | Append to an existing group in the same or another package |

The sections above list all nested fields of `navigation` and `breadcrumb`. `title` is a string and `icon` is a component; neither is a configuration callback evaluated for the current user.

`defineAppRoutes` does not expose React Router fields such as `index`, `element`, `Component`, `loader`, `action`, `errorElement`, or `redirect`. Register pages with `componentLoader`; handle data, redirects, and errors in components and the application router. The default template handles unmatched URLs in `client/routing/app-router.tsx`; adding `path: '*'` here is not supported.

### Path collisions and reserved URLs

- Page paths are unique across the whole application, including plugins. Groups themselves do not claim page URLs.
- Collision detection ignores the case of static segments: `/Projects` and `/projects` cannot be registered separately.
- Parameter names do not distinguish path shapes: `/projects/:id` conflicts with `/projects/:projectId`. A static `/projects/new` route can coexist with dynamic details.
- Only the application may declare a page at `/`; plugins cannot claim the application homepage.
- `/login`, `/register`, `/forgot-password`, and `/reset-password` require `auth: 'guest'` and remain subject to path uniqueness.

### Troubleshooting

| Symptom | What to check |
| --- | --- |
| A page is missing from the menu | Its contribution reaches the runtime, it declares `navigation`, and the current user has access |
| Only administrators can open a new page | The first page may omit `authz` and therefore default to `'unrestricted'` |
| A child URL matches but no content appears | The parent must render `Outlet`; a child route does not automatically become a dialog |
| A `parent` target cannot be found | Use a group name rather than a URL, qualify cross-package targets, and register the target contribution |
| Duplicate route names or paths | Check other files and plugins, normalized paths, parameter-name-only differences, and package-wide names |
| A page component fails to load | Check the import path, default export, and module loading or execution errors |
| A hidden menu entry's API remains callable | Page checks do not authorize the server; inspect the endpoint's own authorization |

Version baseline: the public API of `@nocobase/app-client` `4.0.0-beta.4` and default template `1.0.0-beta.84`. See the [route interfaces and implementation](https://github.com/nocobase/nocobase/blob/d54bae62e652ce2fd8057840bacbcbf0e29a5599/packages/app/app-client/src/plugins.ts) and the runnable template navigation and breadcrumbs in the [Team tasks example](https://github.com/nocobase/docs-examples-v3/tree/46290c9c8efa59dfd484f9018196d65c2a1e0dd6/apps/team-tasks/client). Page paths and component names here illustrate configuration patterns; provide the corresponding components, translations, and business permissions when using them.
