---
title: Page layouts
description: Adjust the application shell and page content areas, combine page containers, nested routes and overlays, and keep navigation, scrolling and responsive behavior consistent.
---

Layouts decide how navigation, headings, toolbars and business content are arranged together. Most business pages only need to combine existing components; you change `client/layouts/` only when adjusting the whole application's sidebar or header area.

This guide follows default template `1.0.0-beta.84`. Layouts and components are source owned by the application, so you can change them as the product requires. Basic interaction components use shadcn; for modular interfaces, first consult the [NocoBase UI Library](https://ui.nocobase.com/), and see [UI components and interactions](pages-and-interactions.md) for how to add and organize them.

## With an Agent

```text
Adjust the task page layout: filters on the left and the list on the right on wide screens, stacked on narrow screens.

Inspect client/layouts/, PageContainer and PageHeader first. Reuse components and theme tokens.
Keep one page container and main heading, retaining the existing filter and list state.
Preserve navigation, breadcrumbs, page access, sidebar collapse and personal settings.
Closing an editor child page or dialog must return to the list context without duplicate scrolling or navigation.
Check long titles, wide tables, narrow screens, keyboard operation, both languages and both color modes.
```

## Decide which layer to change

| Layer | Main location | What it handles |
| --- | --- | --- |
| Application shell | `client/layouts/app-layout.tsx` | How the sidebar, header area and business content area fit together |
| Shell components | `client/layouts/components/` | Local areas such as the brand, menu, header actions and user menu |
| Page container | `client/components/page-container.tsx` | Page width, padding and spacing between sections |
| Page heading | `client/components/page-header.tsx` | The main title, description and page-level actions |
| Business page | `client/pages/` | Arrangement of filters, tables, forms and business panels |
| Child route presentation | `Outlet` with `RouteDialog`, `RouteDrawer`, `RouteChildPage` | Inline areas, dialogs, drawers, or child pages covering the content area |
| Standalone page shell | `client/routing/standalone-page-layout.tsx` | Guest pages and optional sign-in pages in the default template |

Add business menu entries by changing route declarations; a link added only to a layout skips page registration and permission checks. For routes, menus and access conditions, see [Pages, routes and navigation](pages-routes-and-navigation.md).

## Compose a business page

For example, to place the task page's filters and list in two columns, extract a layout component in `client/pages/tasks/components/task-page-frame.tsx`:

```tsx
import type { ReactNode } from 'react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';

interface TaskPageFrameProps {
  title: string;
  filterLabel: string;
  filters: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function TaskPageFrame({
  title,
  filterLabel,
  filters,
  actions,
  children,
}: TaskPageFrameProps) {
  return (
    <PageContainer>
      <PageHeader title={title} actions={actions} />
      <div className="grid min-w-0 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside aria-label={filterLabel} className="min-w-0 space-y-4">
          {filters}
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </PageContainer>
  );
}
```

When the page uses `<TaskPageFrame>`, it passes in the translated `title` and `filterLabel`, the existing filter component as `filters`, the table as `children`, and actions such as a **New** button as `actions`. Reading APIs and handling events stay with the page or a business Hook; the layout component only arranges the areas. For the related state handling, see [Data requests and state management](data-requests-and-state.md).

This component already contains `PageContainer`, so do not wrap it in another one. Keep using the existing shadcn components for basic interactions such as buttons and inputs. A layout used by only this page stays in the page directory; once several pages really share it, move it to `client/components/`.

`minmax(0,1fr)` and `min-w-0` let the content column shrink when space runs short. Keep horizontal scrolling for wide tables within the table area; on narrow screens the two columns stack automatically, so the whole application never gets a horizontal scrollbar. Colors, borders and spacing follow the existing theme conventions; see [Themes and styles](themes-and-styles.md).

## Adjust the application shell

In the default template, pages after sign-in are composed by `AppLayout` from these areas:

```tree
AppLayout
├── AppSidebarProvider
│   ├── AppSidebar
│   │   ├── NavigationMenu
│   │   └── AppSidebarFooter
│   └── Content column
│       ├── LayoutHeader
│       │   ├── AppSidebarToggle
│       │   ├── Breadcrumbs
│       │   └── HeaderActions
│       └── main
│           └── Scroll region
│               └── Outlet
```

This sketch shows how the visible areas relate; the actual source also includes contexts such as the route tree and breadcrumb Providers. When you change it, keep the relationship between these contexts and their consumers intact.

Choose where to change by scope:

- To add a global action in the header: start with `layouts/components/header-actions.tsx`, and keep the theme switch and user menu.
- To adjust the brand area or the sidebar footer: change `app-brand.tsx` or `sidebar-footer.tsx`, without touching business pages.
- To change how menu items are arranged or which are visible: check the route declarations and `useRouteNavigation`, keeping the permission filtering and the current-item calculation.
- To change how the header and sidebar are positioned: change `app-layout.tsx`, and check the narrow-screen sidebar, breadcrumbs and scrolling at the same time.

The application's sidebar preference is managed by the existing `use-sidebar-preference.ts` and its Providers. Reuse the existing collapse and mobile controls rather than creating a second, unsynchronized state. `useSyncServerLocale()` keeps the browser and server languages in sync; keep it when moving layout code around.

## Keep scrolling and overlays working

In the default layout, `main` provides the positioning boundary for the content area, and the container inside it scrolls the page vertically. Overlays such as `RouteChildPage` rely on this relationship; moving `overflow-y-auto` to an outer element can make an overlay scroll with its parent page or stretch to the height of long content.

| Page form | How containers are organized |
| --- | --- |
| Ordinary business page | One `PageContainer` holding the heading and business content |
| A tab or inline child route within a page | Reuses the parent's container and renders an `Outlet` in the chosen place |
| `RouteDialog` or `RouteDrawer` | Keeps the parent list; the child route uses the matching overlay component |
| `RouteChildPage` | Covers the content area and may have its own `PageContainer` inside |

Do not render a child page by nesting another complete `AppLayout`; that easily duplicates the sidebar, the main content area and the route context. Nor do you need another `BrowserRouter`: the application runtime already provides a Router.

When an editing page closes, check that the list's scroll position, filters and focus are restored correctly; for implementing overlays and their closing behavior, see [Pages, routes and navigation](pages-routes-and-navigation.md).

## Sign-in and other standalone pages

In this version of the default template, `client/routing/app-router.tsx` organizes pages by their routes' `auth` declarations: pages that require sign-in use `AppLayout`, while guest pages and optional sign-in pages use `StandalonePageLayout`, each with its own authentication handling.

`auth` describes access conditions; never make a protected page public just to get a different shell. If you only want to adjust the content layout of a feature after sign-in, compose it within the business page. If you really need a different application shell, change the template's route composition explicitly and keep authentication, session preparation and page authorization. This is an application customization; declaring a new `layout` field does not make it work automatically.

For the general mechanisms of startup, rendering and React Providers, see [Client runtime](../framework/runtime/client.md); this guide only covers using and adjusting the existing layout source.

## Verify results

Check layout changes on real pages:

- On wide and narrow screens, with the sidebar expanded and collapsed, the title, menu and actions remain usable.
- Long titles, text that grows after translation, empty lists and wide tables do not overflow the content area.
- Page scrolling, routed dialogs and child-page overlays relate correctly, with no duplicate page containers.
- The keyboard can reach the filter and action areas, and focus returns to a sensible place after a dialog closes.
- Opening a child route directly, refreshing, going back and forward, and lacking page permission all behave correctly.
- Spacing, contrast and borders are consistent in both languages and in light and dark modes.

The default template's `tests/client/layout-containers.test.tsx`, `client-shell.test.tsx`, `sidebar-preference.test.tsx` and `route-overlay.test.tsx` can serve as references. Write tests for the new layout that reflect user behavior, and run the project's type checks, relevant tests and build. Screenshot checks cannot replace navigation and interaction verification.

Source baseline: [AppLayout](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/layouts/app-layout.tsx), [AppRouter](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/routing/app-router.tsx), [PageContainer](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/components/page-container.tsx).
