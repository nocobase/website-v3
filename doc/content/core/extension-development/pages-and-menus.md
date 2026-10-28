---
title: Pages and menus
description: Add plugin pages, navigation and nested views in an App, with default routes and access rules.
---

A plugin contributes pages through route declarations, which also supply the App's menus. This article builds a help center with one sidebar entry and two views: Guide and FAQ. Refreshing or sharing a link preserves the selected view.

[Write your first plugin](write-your-first-plugin.md) connects a single page to an API. Here the focus is organizing pages and navigation. This example needs only Client capabilities.

## Use an Agent

In an existing App, describe the feature:

```text
Create a help-center plugin with a Help center entry in the signed-in menu.
Add Guide and FAQ child pages, with Guide as the default.
Keep the selected view when switching pages, refreshing, or using browser history.
Support English and Chinese. Use @nocobase/create-plugin, test it, and register it in the App.
```

The following steps explain the manual implementation.

## 1. Prepare the plugin and page components

Start with a working App. **Run every command from the App root; file paths below are relative to `packages/app-plugin-help-center/`.** You do not need a checkout of NocoBase source.

```bash
pnpm create @nocobase/plugin@beta help-center \
  --with client.routes --with client.locales

pnpm --filter @nocobase/app-plugin-help-center exec shadcn add \
  @nocobase/page-container @nocobase/page-header
```

The generator adds the plugin to the App's `packages/` workspace and declares a `workspace:*` dependency. The component installer copies `PageContainer` and `PageHeader` into the plugin's `client/components/`. If the plugin already exists, edit it instead of generating it again.

In the plugin's `package.json`, move the runtime imports `react` and `react-router` from `devDependencies` to `peerDependencies`, preserving the generated versions. Move the component installer's new `cn` dependency to `peerDependencies` too, then run `pnpm install` from the App root.

Keep the generated `client/plugin.ts` and `client/index.ts`. The former already connects routes and locales; the latter exposes the registration entry. See [Create a plugin](create-plugin.md) for generator options.

## 2. Declare pages and navigation

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

Each field serves a different purpose:

| Field | Purpose |
| --- | --- |
| `name` | A stable, unique route name within the plugin, distinct from its display title |
| `path` | The page URL; children use relative paths such as `guide` |
| `componentLoader` | Loads a module whose default export is a React component on demand |
| `navigation` | Adds a sidebar entry; `title` is a plugin translation key and lower `order` values come first |
| `breadcrumb` | Adds this level to the App's breadcrumb trail, independently of `navigation` |
| `children` | Child pages rendered at the parent's `<Outlet />` |

The declared `/help` path excludes the App's deployment prefix. With the default `/main` prefix, its browser URL is `/main/help`. The children have no `navigation`, so they do not add sidebar entries. They are views within the help center and do not add breadcrumb levels either.

`auth: 'required'` requires sign-in. `authz: 'skip'` means that these help pages need no additional page permission; children inherit that policy. For business pages, declare the resource and action, such as `authz: { resource: { type: 'page', id: 'orders' }, action: 'access' }`, and configure authorization in the App. Parent checks must still pass: a child cannot bypass them. Client route checks do not replace server API authorization.

## 3. Implement the parent and child pages

Create `client/pages/help/index.tsx`:

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

The parent provides the shared container, heading and navigation. `Outlet` determines where child content appears. `NavLink` derives its active state from the URL, so there is no separate `activeTab` state. These are ordinary navigation links with normal keyboard behavior.

Only the exact parent URL `/help` redirects to `guide`. `replace` prevents Back from revisiting the default entry, while `search` preserves query parameters. Direct navigation to `/help/faq` does not redirect. The route declaration API has no `index` field; do not invent a child route for the default entry.

Both children in this example have the same access policy. If children require different permissions, wait for permission loading before selecting the first accessible default. Show a message when none are accessible instead of repeatedly redirecting.

Create `client/pages/help/guide.tsx`:

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

Create `client/pages/help/faq.tsx`:

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

Child content is already inside the parent's container, so it adds neither another `PageContainer` nor a second page heading. The directory mirrors the route hierarchy.

## 4. Add English and Chinese copy

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

This example supports English and Chinese only. Replace `client/locales/index.ts`:

```ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};
export default locales;
```

Remove the other untranslated language files in this directory. Add their translations and loaders when supporting those languages. They share the resource type, so leaving empty objects in place causes type errors.

Pages loaded through plugin routes inherit the plugin namespace for `useTranslation()`. Menu and breadcrumb titles use the same resources; the App's locale files need no changes.

## 5. Test navigation

The generated `tests/client/routes.test.ts` asserts that routes are empty. Delete it and create `tests/client/routes.test.tsx`:

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

These tests load components from the actual route declarations and check default navigation, query parameters, child selection, history and English copy. `renderWithApp` already provides routing and localization; do not wrap it in another `MemoryRouter`. These tests exercise page navigation. Check App menu generation and authentication guards after registration as well.

```bash
pnpm --filter @nocobase/app-plugin-help-center format
pnpm --filter @nocobase/app-plugin-help-center check
```

## 6. Register in the App

From the App root, preview and apply registration, then start or restart the development server:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-help-center --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-help-center --no-install
pnpm dev
```

The plugin is already a local workspace dependency, so `--no-install` skips installation. This example has only a Client entry; registration updates the App's `client/plugins.ts`.

After signing in, check the following. Paths use the default `/main` deployment prefix; adjust them for your deployment.

| Action | Expected result |
| --- | --- |
| Click Help center in the sidebar | Opens `/main/help/guide` and displays Guide |
| Open `/main/help?from=menu` | Redirects to `/main/help/guide?from=menu` |
| Click FAQ | Opens `/main/help/faq` and highlights the current link |
| Open or refresh `/main/help/faq` directly | Keeps FAQ instead of resetting to Guide |
| Use browser Back and Forward | Content matches the current URL |
| Switch between English and Chinese | Menu, breadcrumb, headings and body copy change together |
| Visit a help page while signed out | Starts the App's sign-in flow |

Finally, run `pnpm build` from the App root to verify that the plugin builds with the application.

## Organize more pages

**Content reached from another page**, such as a detail view or an internal child view, can omit `navigation`. Having a URL does not require a menu entry. A parameterized detail path can use `:id`, but cannot serve as a fixed menu target.

**A parent page with its own content** can declare `componentLoader`, `navigation` and `children` together. Its component must render `Outlet`. Add `navigation` to children when they should also appear in the sidebar.

**A menu group** declares `navigation` and `children` without a `componentLoader`. For example, move the complete `help` route into this group's `children`:

```ts
{
  name: 'support',
  navigation: { title: 'support' },
  children: [
    // Move the complete help route here, including its children.
  ],
}
```

Add `support` to both language resources, with `Support` and “支持” respectively. Without a `path`, the group leaves `/help` unchanged. If a group has a `path`, it prefixes its child routes.

Add menus through route declarations. No App sidebar edits or ServiceProvider are required.
