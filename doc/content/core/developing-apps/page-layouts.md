---
title: Page layouts
description: Customize the application shell and page content, compose containers and nested routes, and preserve navigation, scrolling and responsive behavior.
---

Layouts arrange navigation, headings, toolbars and business content. Most business pages can compose existing components. Change `client/layouts/` when adjusting the whole application's sidebar or header.

This guide follows default template `1.0.0-beta.84`. Layouts and components are application-owned source that you can adapt. Use shadcn for base interaction components and first consult the [NocoBase UI Library](https://ui.nocobase.com/) for modular interfaces. See [UI components and interactions](pages-and-interactions.md) for adding and organizing them.

## With an agent

```text
Adjust the task page layout: filters on the left and the list on the right on wide screens, stacked on narrow screens.

Inspect client/layouts/, PageContainer and PageHeader first. Reuse components and theme tokens.
Keep one page container and main heading, retaining the existing filter and list state.
Preserve navigation, breadcrumbs, page access, sidebar collapse and personal settings.
Closing an editor child page or dialog must return to the list context without duplicate scrolling or navigation.
Check long titles, wide tables, narrow screens, keyboard operation, both languages and both color modes.
```

## Choose the layer to change

| Layer | Main location | Responsibility |
| --- | --- | --- |
| Application shell | `client/layouts/app-layout.tsx` | Sidebar, header and business content composition |
| Shell components | `client/layouts/components/` | Brand, navigation, header actions and user menu |
| Page container | `client/components/page-container.tsx` | Width, padding and spacing between sections |
| Page heading | `client/components/page-header.tsx` | Main title, description and page actions |
| Business page | `client/pages/` | Filters, tables, forms and business panels |
| Child route presentation | `Outlet`, `RouteDialog`, `RouteDrawer`, `RouteChildPage` | Inline content, dialogs, drawers and covering child pages |
| Standalone shell | `client/routing/standalone-page-layout.tsx` | Guest and optionally authenticated pages in the default template |

Add business navigation through route declarations. A link inserted into a layout does not provide page registration and access conditions. See [Pages, routes and navigation](pages-routes-and-navigation.md).

## Compose a business page

For a task page with filters beside a list, extract a layout into `client/pages/tasks/components/task-page-frame.tsx`:

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

Use `<TaskPageFrame>` in the page with translated `title` and `filterLabel`, an existing filter component as `filters`, the table as `children`, and actions such as Create as `actions`. Keep data requests and events in the page or business Hook. The frame arranges these regions; see [Data requests and state management](data-requests-and-state.md) for their state.

The frame already includes `PageContainer`, so do not wrap it in another. Keep using shadcn for base interactions such as buttons and inputs. A layout used by one page can stay in that page's directory; move it into `client/components/` when several pages share it.

`minmax(0,1fr)` and `min-w-0` let the content column shrink. Keep horizontal scrolling inside a wide table's region instead of the entire application. On narrow screens, the columns stack. Follow existing theme conventions for colors, borders and spacing; see [Themes and styles](themes-and-styles.md).

## Customize the application shell

The default template's authenticated pages use `AppLayout` to compose these areas:

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

This is a simplified view of visual regions. The source also includes route-tree and breadcrumb Providers. Preserve their relationship to consumers when modifying it.

Choose the narrowest relevant entry:

- For a global header action, start in `layouts/components/header-actions.tsx` and retain theme and user controls.
- For branding or the sidebar footer, edit `app-brand.tsx` or `sidebar-footer.tsx` without rewriting business pages.
- For navigation order or visible items, inspect route declarations and `useRouteNavigation`, retaining permission filtering and selected-item calculation.
- For header/sidebar positioning, change `app-layout.tsx` and check mobile navigation, breadcrumbs and scrolling together.

Existing `use-sidebar-preference.ts` and its Providers manage sidebar preferences. Reuse collapse and mobile controls rather than creating conflicting state. Preserve `useSyncServerLocale()` when moving layout code so browser and server locales stay synchronized.

## Preserve scrolling and overlay relationships

The default shell's `main` provides the positioning boundary, while an inner container scrolls the page vertically. Covering components such as `RouteChildPage` depend on this relationship. Moving `overflow-y-auto` outward can make overlays scroll with the parent or stretch to its full content height.

| Page form | Container arrangement |
| --- | --- |
| Ordinary business page | One `PageContainer` with its heading and content |
| Tab or inline child route | Reuse the parent container and place `Outlet` where needed |
| `RouteDialog` or `RouteDrawer` | Retain the parent list and use the matching overlay component |
| `RouteChildPage` | Cover the content region with its own `PageContainer` when needed |

Do not render another complete `AppLayout` for a child page: that duplicates navigation, main regions and route contexts. The application runtime already provides a Router; another `BrowserRouter` is unnecessary.

Check list scroll position, filters and focus return after closing editors. See [Pages, routes and navigation](pages-routes-and-navigation.md) for overlay and closing behavior.

## Sign-in and other standalone pages

In this template version, `client/routing/app-router.tsx` groups pages by their `auth` declarations. Required-authentication pages use `AppLayout`; guest and optional-authentication pages use `StandalonePageLayout`, with their respective authentication handling.

`auth` describes access conditions. Do not make a protected page public to obtain a different shell. Compose a feature's content within its page when that is sufficient. A genuinely different application shell requires explicit router composition while retaining authentication, session preparation and page authorization. Adding an arbitrary `layout` field does not establish that integration.

See [Client runtime](../framework/runtime/client.md) for startup, rendering and React Provider mechanisms. This guide focuses on using and changing existing layout source.

## Verify results

Check layout changes on actual pages:

- Titles, navigation and actions work on wide/narrow screens with the sidebar expanded and collapsed.
- Long titles, longer translations, empty lists and wide tables fit their content regions.
- Scrolling, routed dialogs and covering child pages work without duplicate containers.
- Keyboard users can reach filters and actions, with appropriate focus return after dialogs close.
- Direct child-route links, refresh, back/forward navigation and denied page access behave correctly.
- Both languages and color modes retain consistent spacing, contrast and borders.

Use the template's `tests/client/layout-containers.test.tsx`, `client-shell.test.tsx`, `sidebar-preference.test.tsx` and `route-overlay.test.tsx` as references. Add behavior-focused tests for your layout and run type checks, relevant tests and a build. Screenshots alone do not verify navigation and interaction.

Source baseline: [AppLayout](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/layouts/app-layout.tsx), [AppRouter](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/routing/app-router.tsx), [PageContainer](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/components/page-container.tsx).
