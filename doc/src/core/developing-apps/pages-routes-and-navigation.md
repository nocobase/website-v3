---
title: Pages, routes and navigation
description: Register pages and menus, organize nested routes and breadcrumbs, and define sign-in and page-access requirements.
---

Page components render content. Route declarations connect them to the application and describe addresses, menus, breadcrumbs and access conditions. The sidebar is generated from routes, so adding a business entry usually does not require editing layouts.

This guide uses the task application's project pages to explain routing. Tables, forms and request state are covered in [UI components and interactions](pages-and-interactions.md). The excerpts use an application generated from default template `1.0.0-beta.78`; preserve existing routes when integrating them. The `tutorialTasks`/`tutorialProjects` model belongs to the separate historical project example, not the current getting-started `tasks` model. Confirm the baseline in [Data models and migrations](data-models-and-migrations.md) before running it.

## With an agent

```text
Please add the existing project list to application navigation and present project creation as a dialog over that list.

Only members with page access may enter Projects. Viewing projects does not imply permission to create them.
Direct creation links, refresh and browser history must preserve the correct page and dialog state.
Closing the dialog should return to the original project list with its search and page position.

Provide English and Chinese menu and page titles, avoid duplicate menus and preserve existing grants.
Check signed-out users, users without page access, read-only users and users allowed to create.
The server must still authorize each request independently.
```

## Without an agent

### Register a page and menu

Add the project route to the existing `defineAppRoutes([...])` in `client/routes.ts`, merging the imports. If already present, edit that entry instead of registering it twice:

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

Include `projectRoute` in the existing route array; declaring a variable alone registers nothing. The [project example](pages-and-interactions.md) supplies these components and permission resources. A blank application must implement them first.

| Declaration | Purpose |
| --- | --- |
| `name` | Stable, unique route identity for references and overrides |
| `path` | Internal application address; child paths such as `create` are relative to the parent |
| `componentLoader` | Lazily loads a module that default-exports a React component |
| `navigation` | Menu title, icon and sibling order; omit it for no menu entry |
| `breadcrumb` | Title for this route level, normally a translation key |
| `children` | Nested routes rendered through the parent's `Outlet` |

Paths exclude the deployment base path. With an entry at `/main/`, `/projects` becomes `/main/projects` in the browser. Do not hard-code `/main`. Template dynamic imports use `.js` even when the source file is `.tsx`.

### Compose pages and child routes

A list page normally uses `PageContainer` and `PageHeader`, retaining an `<Outlet />` for child routes. This shows layout only, without list requests or form implementation:

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

A child route need not be a full page. Choose its presentation according to its content:

| Presentation | Use | Relationship to the parent |
| --- | --- | --- |
| Inline content | Tabs and page sections | Renders at the Outlet and shares the parent container |
| `RouteDialog` | Short creation or editing forms | Dialog over the parent |
| `RouteDrawer` | Record details or side editing | Drawer over the parent |
| `RouteChildPage` | Long forms or complex child pages | Covers the content area while preserving parent state and application navigation |

Inline tabs should not add another complete `PageContainer`. Use `RouteChildPage` to cover the content area; rendering a second container after the parent produces vertically stacked pages.

### Preserve navigation context

Carry current query parameters when opening a routed dialog:

```tsx
<Link to={{ pathname: 'create', search: location.search }}>
  {t('projects.new')}
</Link>
```

`Link` and `useLocation` come from `react-router`; obtain `location` with the page's `useLocation()`. Closing should return to the parent route with its search, sorting and pagination. Do not rely only on browser Back: users may open the URL directly.

Represent shareable tabs as child routes. Redirect to a default accessible tab only from the parent's own address, not from an explicit child URL. Tab clicks use ordinary navigation; default redirects replace history to avoid loops when navigating back.

See [UI components and interactions](pages-and-interactions.md) for pending-save close guards, browser Back and focus restoration, which must share the same submission state.

### Menu groups and breadcrumbs

A navigation-only group declares `name`, `navigation` and `children`, without `componentLoader` or `authz`. If it has a `path`, that contributes to descendant prefixes. Do not change existing page addresses just to rename a group.

Lower `navigation.order` values come first; ties preserve registration order. Details, dialogs and tabs usually have no separate menu. Parameterized paths cannot serve as fixed menu destinations. Hiding a menu does not disable a feature; direct URLs still require route checks.

Pages normally use `breadcrumb.title`, falling back to a page's `navigation.title`. For a record name or a return link carrying list filters, a page can supply a dynamic trail with `usePageBreadcrumb()`. Retain the static trail while loading. Avoid a duplicate Back button when the trail already provides the same return path.

### Separate sign-in from page authorization

| Configuration | Controls |
| --- | --- |
| `auth: 'required'` | Requires sign-in; children inherit the entry's requirement |
| `auth: 'guest'` | Guest pages such as sign-in and registration |
| `auth: 'optional'` | Available before and after sign-in; content adapts to identity |
| `authz: { resource, action }` | Checks a resource and action, such as page `access` or a creation action |
| `authz: 'skip'` | Skips this page's own authorization check, retaining sign-in and ancestor checks |
| `authz: 'unrestricted'` | Restricts access to unrestricted identities; it does not mean everyone |

Explicitly declare `authz` on the first page of each path. Children without it inherit the nearest ancestor page's value. Declaring their own check does not bypass the parent. Thus Projects requires `projects/access`, and its creation dialog additionally checks `tutorial.projects/create`.

Page resource IDs are stored in role grants. Renaming them requires migrating grants; do not change IDs just to edit display text. Titles use translations. Pages without navigation or breadcrumbs can supply permission labels through `client/pages/settings/page-permission-titles.ts`.

These checks run in the browser. APIs still require independent authentication, business authorization and record scopes; see [Business services and HTTP APIs](apis-and-services.md).

## Verify results

Run the actual project's route and permission-label checks:

```bash
pnpm exec vitest run tests/logic/client-routes.test.ts tests/logic/page-permission-titles.test.ts
```

Then check menu entry, direct child links, refresh, history, dialog closing and preserved query parameters in the browser. Use ordinary users with no page access, read-only access and creation permission. Check direct API requests too; an administrator successfully viewing a page is insufficient acceptance evidence.
