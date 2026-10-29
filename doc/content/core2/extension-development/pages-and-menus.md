---
title: Pages, routes and menus
description: Add pages, menus and child pages in an App's local plugin, and handle navigation, default entries and access permissions.
---

A plugin connects pages to the App through route declarations, and the menu comes from the same declarations. This guide builds a "help center": the sidebar has a single entry, the page switches between a Guide and an FAQ, and refreshing or sharing a link keeps the current content.

[Write your first plugin](write-your-first-plugin.md) already showed how a single page connects to an API. This guide focuses on how pages and menus are organized; the example needs only the Client and no server API.

The way a plugin contributes pages and menus: `routes.ts` references page components, `routes` in `client/plugin.ts` gathers the routes, and the App loads these contributions once it registers the Client factory. For implementing components and styles, see [Components and styles](frontend-components.md); for form interactions and URL state, reuse the approaches in [UI components and interactions](../developing-apps/pages-and-interactions.md) and [Data requests and state management](../developing-apps/data-requests-and-state.md).

## Use an Agent

In an existing App, describe the request like this:

```text
Create a help-center plugin with a Help center entry in the signed-in menu.
Add Guide and FAQ child pages, with Guide as the default.
Keep the selected view when switching pages, refreshing, or using browser history.
Support English and Chinese. Use @nocobase/create-plugin, test it, and register it in the App.
```

The steps below show the manual implementation.

## 1. Prepare the plugin and page components

You need an App that starts normally. **Run every command in the App root; file paths below are relative to `packages/app-plugin-help-center/`.** There is no need to download the NocoBase source.

```bash
pnpm create @nocobase/plugin@beta help-center \
  --with client.routes --with client.locales

pnpm --filter @nocobase/app-plugin-help-center exec shadcn add \
  @nocobase/page-container @nocobase/page-header
```

The generator adds the plugin to the App's `packages/` workspace with a `workspace:*` dependency, and the component installer puts the source of `PageContainer` and `PageHeader` into the plugin's `client/components/`. If a plugin with the same name already exists, edit it directly instead of creating it again.

Check the plugin's `package.json`: move `react` and `react-router`, used at runtime, from `devDependencies` to `peerDependencies`, keeping the generated versions; move `cn`, added by the component installer, to `peerDependencies` as well, then run `pnpm install` in the App root.

Keep the scaffold's `client/plugin.ts` and `client/index.ts`. The former already connects `routes` and `locales`, and the latter provides the App's registration entry. For creation options, see [Create a plugin](create-plugin.md).

## 2. Declare pages and menus

Replace `client/routes.ts`:

```ts
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const routes: readonly AppClientRouteContribution[] = [
  defineAppRoutes([
    {
      name: 'help',
      path: '/help',
      auth: 'required',
      authz: 'skip',
      navigation: { title: 'title', order: 100 },
      breadcrumb: { title: 'title' },
      componentLoader: () => import('./pages/help/index.js'),
      children: [
        {
          name: 'helpGuide',
          path: 'guide',
          componentLoader: () => import('./pages/help/guide.js'),
        },
        {
          name: 'helpFaq',
          path: 'faq',
          componentLoader: () => import('./pages/help/faq.js'),
        },
      ],
    },
  ]),
];
export default routes;
```

Each field solves a different problem:

| Field | Purpose |
| --- | --- |
| `name` | A stable, unique route name within the plugin, not a display title |
| `path` | The page address; child pages use relative paths such as `guide` |
| `componentLoader` | Loads the page on demand; the target module must default-export a React component |
| `navigation` | Shows an entry in the App's sidebar; `title` is a plugin translation key, and lower `order` comes first |
| `breadcrumb` | Shows this level in the App's breadcrumb, independently of `navigation` |
| `children` | Child pages, rendered by the parent page's `<Outlet />` |

`/help` is the path the plugin declares, without the App's deployment prefix. With the default prefix `/main`, the address in the browser is `/main/help`. The child pages have no `navigation`, so they do not appear separately in the sidebar; they are views inside the help center and add no breadcrumb levels either.

`auth: 'required'` requires sign-in, and `authz: 'skip'` means the help content needs no additional page permission; child pages inherit this policy. Pages involving business permissions should declare the resource and action, such as `authz: { resource: { type: 'page', id: 'orders' }, action: 'access' }`, and have authorization configured in the App. The parent page's check must still pass, and a child page cannot bypass it. Client-side route permission checks cannot replace authorization of server APIs either.

## 3. Write the parent and child pages

Add `client/pages/help/index.tsx`:

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import {
  matchPath,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useResolvedPath,
} from 'react-router';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';

export default function HelpPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const parentPath = useResolvedPath('.');
  const isParentEntry = matchPath(
    { path: parentPath.pathname, end: true },
    location.pathname,
  );

  if (isParentEntry) {
    return (
      <Navigate to={{ pathname: 'guide', search: location.search }} replace />
    );
  }

  return (
    <PageContainer>
      <PageHeader title={t('title')} />
      <nav aria-label={t('sections')} className='flex gap-4 border-b pb-3'>
        <NavLink
          to={{ pathname: 'guide', search: location.search }}
          className='text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground'
        >
          {t('guide.title')}
        </NavLink>
        <NavLink
          to={{ pathname: 'faq', search: location.search }}
          className='text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground'
        >
          {t('faq.title')}
        </NavLink>
      </nav>
      <Outlet />
    </PageContainer>
  );
}
```

The parent page provides the shared container, heading and navigation, and `Outlet` decides where the child page appears. `NavLink` marks the selected item from the current URL, so there is no need to maintain an `activeTab` state. These are ordinary page navigation links and work with the keyboard directly.

Only visiting the parent address `/help` jumps to the default child page `guide`. `replace` prevents going back through the default entry again, and `search` keeps the query parameters. Opening `/help/faq` directly is not redirected. Route declarations have no `index` field, so there is no need to invent a child route for the default entry.

The two child pages in this example share the same access policy. If different child pages need different permissions, choose the first accessible page as the default once permissions have loaded, and show a message when none is accessible, to avoid redirecting back and forth.

Add `client/pages/help/guide.tsx`:

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

export default function GuidePage(): ReactElement {
  const { t } = useTranslation();
  return (
    <section className='space-y-2'>
      <h2 className='text-lg font-semibold'>{t('guide.title')}</h2>
      <p className='text-sm text-muted-foreground'>{t('guide.content')}</p>
    </section>
  );
}
```

Add `client/pages/help/faq.tsx`:

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

export default function FaqPage(): ReactElement {
  const { t } = useTranslation();
  return (
    <section className='space-y-2'>
      <h2 className='text-lg font-semibold'>{t('faq.title')}</h2>
      <p className='text-sm text-muted-foreground'>{t('faq.content')}</p>
    </section>
  );
}
```

Child pages are already inside the parent's container, so do not add another `PageContainer` or a second page heading. The directories follow the route hierarchy, which also makes it easy to add more child pages.

## 4. Add English and Chinese text

Replace `client/locales/en-US.ts`:

```ts
import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  title: 'Help center',
  sections: 'Help topics',
  guide: {
    title: 'Guide',
    content: 'Choose a menu item to start using the application.',
  },
  faq: {
    title: 'FAQ',
    content: 'Contact your administrator if you need help with access.',
  },
};
export type HelpCenterResource = LocaleResource<typeof enUS>;
export default enUS;
```

Replace `client/locales/zh-CN.ts`:

```ts
import type { HelpCenterResource } from './en-US.js';

const zhCN: HelpCenterResource = {
  title: '帮助中心',
  sections: '帮助主题',
  guide: { title: '使用指南', content: '从菜单中选择功能，开始使用应用。' },
  faq: { title: '常见问题', content: '如果遇到权限问题，请联系管理员。' },
};
export default zhCN;
```

This example provides only English and Chinese, so change `client/locales/index.ts` to:

```ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};
export default locales;
```

Then delete the other untranslated language files in the same directory, and add text and loaders when you add those languages later. These language files share one resource type, so leaving empty objects causes type checks to fail.

When a page is loaded through a plugin route, `useTranslation()` uses the plugin's language namespace automatically. The menu and breadcrumb read their titles from the same resources, so the App's language files need no change.

## 5. Test navigation

The scaffold's `tests/client/routes.test.ts` asserts that there are no routes, so it must be replaced once pages are added. Delete that file and create `tests/client/routes.test.tsx`:

```tsx
import { renderWithApp } from '@nocobase/app-testing/client';
import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';

import helpCenter from '../../client/index.js';
import routes from '../../client/routes.js';

async function renderRoute(
  definition: AppClientRouteDefinition,
): Promise<ReactElement> {
  const Component = definition.componentLoader
    ? (await definition.componentLoader()).default
    : undefined;
  const children = await Promise.all(
    (definition.children ?? []).map(renderRoute),
  );
  return (
    <Route
      key={definition.name}
      path={definition.path}
      element={Component ? <Component /> : undefined}
    >
      {children}
    </Route>
  );
}

function LocationProbe(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid='location'>
        {location.pathname}
        {location.search}
      </output>
      <button onClick={() => void navigate(-1)}>Back</button>
    </>
  );
}

async function openPage(route: string, locale = 'zh-CN'): Promise<void> {
  const children = await Promise.all(
    routes.flatMap((contribution) => contribution.routes).map(renderRoute),
  );
  await renderWithApp(
    <>
      <Routes>{children}</Routes>
      <LocationProbe />
    </>,
    {
      plugins: [helpCenter()],
      namespace: '@nocobase/app-plugin-help-center',
      locale,
      route,
    },
  );
}

describe('help center navigation', () => {
  it.each(['/help', '/help/'])(
    'redirects only the parent %s and preserves query and history',
    async (parent) => {
      await openPage(`${parent}?from=menu`);
      expect(
        await screen.findByRole('heading', { name: '使用指南' }),
      ).toBeInTheDocument();
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/help/guide?from=menu',
      );
      fireEvent.click(screen.getByRole('link', { name: '常见问题' }));
      expect(
        await screen.findByRole('heading', { name: '常见问题' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '常见问题' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/help/faq?from=menu',
      );
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      await waitFor(() =>
        expect(screen.getByTestId('location')).toHaveTextContent(
          '/help/guide?from=menu',
        ),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/help/guide?from=menu',
      );
    },
  );

  it('keeps a direct child URL and renders English', async () => {
    await openPage('/help/faq?from=link', 'en-US');
    expect(
      await screen.findByRole('heading', { name: 'FAQ' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Help center' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/help/faq?from=link',
    );
    expect(
      screen.queryByRole('heading', { name: 'Guide' }),
    ).not.toBeInTheDocument();
  });
});
```

The tests load components from the real route declarations and check the default entry, query parameters, switching child pages, browser history and the English display. `renderWithApp` already provides routing and the language environment, so do not wrap it in another `MemoryRouter`. What is verified here is the page's navigation behavior; the App's menu generation and sign-in guard still need checking after connecting the plugin.

```bash
pnpm --filter @nocobase/app-plugin-help-center format
pnpm --filter @nocobase/app-plugin-help-center check
```

## 6. Register in the App

In the App root, preview and run the registration, then start or restart the development server:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-help-center --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-help-center --no-install
pnpm dev
```

The plugin is already a local workspace dependency, so `--no-install` skips installing it again. This example has only a Client entry, so the registration command updates the App's `client/plugins.ts`.

After signing in, check the following behavior. Paths in the table use the default deployment prefix `/main`; adjust them when deployed elsewhere.

| Action | Expected result |
| --- | --- |
| Click the **Help center** menu | Opens `/main/help/guide` and shows the guide |
| Open `/main/help?from=menu` | Jumps to `/main/help/guide?from=menu` |
| Click **FAQ** | The address becomes `/main/help/faq`, and the current navigation item is highlighted |
| Open or refresh `/main/help/faq` directly | Stays on the FAQ instead of jumping back to the guide |
| Browser Back and Forward | The content matches the current URL |
| Switch between English and Chinese | The menu, breadcrumb, headings and body switch together |
| Visit the help page while signed out | Goes into the App's sign-in flow |

Finally, run `pnpm build` in the App root to confirm the plugin builds together with the App.

## Organize more pages

**Content opened only from within a page**, such as a details page or an internal child page, should not set `navigation`; having a URL does not mean it must appear in the menu. A details path with parameters can be written as `:id`, and cannot serve as a fixed menu entry.

**A parent page with its own content** can declare `componentLoader`, `navigation` and `children` together, but its component must contain an `Outlet`. When child pages should also appear in the sidebar, add `navigation` to them.

**A menu group used only for grouping** declares just `navigation` and `children`, without `componentLoader`. For example, move the complete `help` route into the `children` of the group below:

```ts
{
  name: 'support',
  navigation: { title: 'support' },
  children: [
    // Move the complete help route here, including its children.
  ],
}
```

Also add `support` to the English and Chinese language resources, as `Support` and “支持” respectively. Without a `path`, the group does not change the `/help` address; with a `path`, it becomes the path prefix of its child routes.

All new menus are added through these route declarations, without changing the App's sidebar component or adding a ServiceProvider.
