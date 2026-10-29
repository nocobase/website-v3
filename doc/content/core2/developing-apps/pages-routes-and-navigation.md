---
title: Pages, routes and navigation
description: Register pages and menus, organize child routes and breadcrumbs, and define sign-in requirements and page access permissions.
---

Page components render content; route declarations connect those components to the application and describe their address, menu, breadcrumb and access conditions. The sidebar is generated from routes, so adding a business entry usually needs no layout changes.

Business pages usually live in `client/pages/` and are connected through `client/routes.ts`. `client/layouts/` owns the surrounding page layout and normally changes only when you adjust the application shell, the navigation area or the content area. For how routes are rendered and assembled at startup, see [Client runtime](../framework/runtime/client.md).

Related topics live in other guides: page containers, two-column arrangements and the application shell in [Page layouts](page-layouts.md); URL query parameters, reading data and refreshing after returning in [Data requests and state management](data-requests-and-state.md); tables, forms and request state in [UI components and interactions](pages-and-interactions.md).

This guide uses the project pages of the task application and focuses on how routes are organized. The excerpts come from an example application on default template `1.0.0-beta.78`; keep the project's existing routes when you integrate them. The `tutorialTasks`/`tutorialProjects` model belongs to the separate historical project example, not to the current getting-started `tasks`; confirm the baseline in [Create tables and initialize data](data-models-and-migrations.md) before running it.

## With an Agent

```text
Please add the existing project list to application navigation and present project creation as a dialog over that list.

Only members with page access may enter Projects. Viewing projects does not imply permission to create them.
Direct creation links, refresh and browser history must preserve the correct page and dialog state.
Closing the dialog should return to the original project list with its search and page position.

Provide English and Chinese menu and page titles, avoid duplicate menus and preserve existing grants.
Check signed-out users, users without page access, read-only users and users allowed to create.
The server must still authorize each request independently.
```

## Without an Agent

### Register a page and menu

Add the project route below to the existing `defineAppRoutes([...])` in `client/routes.ts`, and merge the imports it needs. If a route with the same name already exists, edit that entry instead of registering it twice:

```ts
import { FolderKanban } from 'lucide-react';
import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';

const projectRoute: AppClientRouteDefinition = {
  name: 'projects',
  path: '/projects',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },
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
};
```

Declaring the `projectRoute` variable registers nothing by itself; it must be placed in the existing route array. The component files and permission resources referenced above come from the [project example](pages-and-interactions.md); a blank application has to implement them first.

| Declaration | Meaning |
| --- | --- |
| `name` | Stable, unique route name used to locate and override the route |
| `path` | Address inside the application; a child path such as `create` is relative to its parent |
| `componentLoader` | Lazily loads the page; the module must default-export a React component |
| `navigation` | Menu title, icon and order among siblings; without it, no menu entry is created |
| `breadcrumb` | Breadcrumb title for this route level, usually a translation key |
| `children` | Child routes of the page, rendered in the parent page's `Outlet` |

Page paths do not include the deployment base path. With the application entry at `/main/`, `/projects` is `/main/projects` in the browser; do not hard-code `/main` in business code. Also note that the template's dynamic imports use the `.js` suffix even when the source file is `.tsx`.

### Compose page components and child routes

A list page usually builds its frame with `PageContainer` and `PageHeader`, and keeps an `<Outlet />` to render child routes. The code below only shows the layout relationship, without list requests or form implementation:

```tsx
import { Outlet } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';

export default function ProjectsPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageContainer>
        <PageHeader title={t('projects.title')} />
        {/* Render the project list here. */}
      </PageContainer>
      <Outlet />
    </>
  );
}
```

A child route is not necessarily a full page; which presentation to use depends on what it shows:

| Presentation | When to use it | Relationship to the parent page |
| --- | --- | --- |
| Inline child content | Tabs and sections within the page | Renders at the `Outlet` and reuses the parent's container |
| `RouteDialog` | Short creation or editing forms | A dialog over the parent page |
| `RouteDrawer` | Record details or side editing | A drawer over the parent page |
| `RouteChildPage` | Long forms or complex child pages | Covers the content area while keeping the parent's state and the application navigation |

Do not nest another complete `PageContainer` inside an inline tab. To cover the whole content area, use `RouteChildPage`; merely rendering a second page container after the parent stacks the two pages vertically.

### Keep the address and navigation context

When opening a routed dialog, carry over the current query parameters:

```tsx
<Link to={{ pathname: 'create', search: location.search }}>
  {t('projects.new')}
</Link>
```

`Link` and `useLocation` come from `react-router`, and `location` is obtained with the page's `useLocation()`. Closing the dialog should return to the parent route with its search, sorting and page preserved. Do not rely only on the browser's Back button, because users may also have opened the link directly.

Express shareable tabs as child routes. Redirect to the default accessible tab only when the parent's own address is visited; when a child address is given explicitly, do not force a jump back to the default tab. Switching tabs uses ordinary navigation, while the default-tab redirect replaces the history entry, so going back does not loop.

The close guard during a pending save, browser Back and focus restoration are covered in [UI components and interactions](pages-and-interactions.md); they must share the same submission state.

### Menu groups and breadcrumbs

A group that only organizes the menu declares just `name`, `navigation` and `children`, with no `componentLoader` and no `authz`. If the group has a `path`, it becomes a prefix of its children's addresses; do not change existing page addresses just to rename a group.

Lower `navigation.order` values come first, and equal values keep the registration order. Details, dialogs and tabs usually have no menu entry of their own, and an address with parameters cannot be a fixed menu entry. Hiding something from the menu does not disable it: a direct visit to the address still goes through the route checks.

Pages normally use the route's `breadcrumb.title`; without an explicit title, it can be generated from the page's `navigation.title`. When the breadcrumb should show a record name, or the return link should carry the original list's query parameters, the page can supply a dynamic trail with `usePageBreadcrumb()`; keep the static title while the record is loading. If the breadcrumb already provides the same return path, do not add a duplicate Back button.

### Separate sign-in from page permissions

| Configuration | What it controls |
| --- | --- |
| `auth: 'required'` | Sign-in is required; child pages inherit the entry page's requirement |
| `auth: 'guest'` | Guest pages such as sign-in and registration |
| `auth: 'optional'` | Can be opened before and after sign-in; the content adapts to the identity |
| `authz: { resource, action }` | Checks the given resource and action, such as a page's `access` or a business action like creation |
| `authz: 'skip'` | Skips this page's own authorization check, while sign-in and parent-page restrictions still apply |
| `authz: 'unrestricted'` | Allows only identities with unrestricted access; it does not mean "allow everyone" |

Declare `authz` explicitly on the first page of every path. A child page without a declaration inherits the value of its nearest ancestor page, and a child that declares its own value still does not bypass the parent's check. So opening the project page requires `projects/access`, and the creation dialog additionally checks `tutorial.projects/create`.

Page permission resource IDs are stored in role grants. Changing an ID requires migrating the existing grants, so do not change IDs just to adjust display text. Permission titles come from translations; pages without navigation or a breadcrumb can supply their permission display names through `client/pages/settings/page-permission-titles.ts`.

All of these checks run in the browser. APIs still need their own authentication, business authorization and data scope checks; see [Routes and HTTP APIs](apis-and-services.md).

## Verify results

In this guide's `.78` project example, run the matching route and permission-title checks:

```bash
pnpm exec vitest run tests/logic/client-routes.test.ts tests/logic/page-permission-titles.test.ts
```

Then check in the browser: entering from the menu, opening a child link directly, refreshing, going back and forward, closing the dialog, and whether query parameters are preserved. Then verify with ordinary users in three cases, no page access, view-only and allowed to create, and check direct API requests as well. "An administrator can see the page" is not enough as acceptance evidence.
