---
title: Write your first plugin
description: Implement an announcements plugin in an App, going through the complete process of API, page, menu, tests and registration.
---

This guide implements an "announcements plugin": you open Announcements from the App's menu, and the page requests an API the plugin provides and shows the list of announcements. The example uses both Client and Server, so you can see clearly how a plugin adds a feature to an application.

We first get the whole flow working with one fixed announcement, without a database table or announcement editing. Once it works, extend data storage and management pages as the business needs.

## With an Agent

Open an Agent in the project directory of an existing App and describe the request like this:

```text
Use @nocobase/create-plugin to create an announcements plugin in this App.
Add a public announcements API and a page in the signed-in navigation.
Start with one fixed announcement, support English and Chinese UI, test it and register it in the App.
```

The steps below explain the manual implementation, and can also be used to understand and check what the Agent produced.

## 1. Prepare the plugin scaffold

You need an App created with create-app, with dependencies installed and able to start normally. For the generator's options, see [Create a plugin](create-plugin.md); for what each file does, see [Plugin structure](plugin-structure.md). **Run every command below in the App root; all file paths are relative to the App root as well.**

Create the plugin, choosing three capabilities: page routes, client language resources and server routes:

```bash
pnpm create @nocobase/plugin@beta announcements \
  --with client.routes --with client.locales --with server.routes
```

If a plugin with the same name already exists, keep editing it instead of creating it again. The plugin is generated in `packages/app-plugin-announcements/`, and the App depends on it through `workspace:*`. The scaffold has already connected the routes and language resources to the plugin definitions; keep the generated `client/plugin.ts`, `server/plugin.ts` and both `index.ts` files.

Install the page container and header components from the NocoBase UI Library for the page; the plugin maintains their source:

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add \
  @nocobase/page-container @nocobase/page-header
```

Then check the plugin's `package.json`: the page uses `react` at runtime, so move it from `devDependencies` to `peerDependencies`, keeping the version the scaffold chose; move the client dependencies added by the component installer (`cn` in this example) to `peerDependencies` as well. `hono`, used on the server, stays in `dependencies`. Finally run `pnpm install` to synchronize the dependencies and the lockfile.

## 2. Provide the announcements API

Add `packages/app-plugin-announcements/shared/announcement.ts`, so the page and the API share the same data type:

```ts
export interface Announcement {
  readonly id: string;
  readonly title: string;
  readonly content: string;
}
```

Add `packages/app-plugin-announcements/server/routes/schemas.ts`, describing the announcement structure the API returns:

```ts
import type { ApiSchema } from '@nocobase/app-server/router';

export const announcementSchema: ApiSchema = {
  type: 'object',
  required: ['id', 'title', 'content'],
  properties: {
    id: { type: 'string', description: 'Announcement ID.' },
    title: { type: 'string', description: 'Announcement title.' },
    content: { type: 'string', description: 'Announcement body.' },
  },
};
```

Replace the empty route list in `packages/app-plugin-announcements/server/routes/index.ts` with:

```ts
import {
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import type { Announcement } from '../../shared/announcement.js';
import { announcementSchema } from './schemas.js';

const announcements: Announcement[] = [
  { id: 'welcome', title: 'Welcome', content: 'Your first plugin is ready.' },
];

export const apiRoutes: AppApiRouteContribution<unknown> = defineApiRoutes(
  () => {
    const router = new Hono();
    router.get(
      '/announcements',
      describeRoute({
        operationId: 'announcementsList',
        summary: 'List public announcements',
        tags: ['Announcements'],
        security: [],
        responses: { 200: listResponse(announcementSchema) },
      }),
      (context) =>
        context.json({
          data: announcements,
          meta: { total: announcements.length },
        }),
    );
    return router;
  },
);

const routes: readonly AppApiRouteContribution<unknown>[] = [apiRoutes];
export default routes;
```

`defineApiRoutes()` connects the routes to the App's API; the path only needs `/announcements`, and the App adds the API prefix. `describeRoute()` declares the API documentation, and `listResponse()` describes a list response of the form `{ data, meta }`.

This example returns one fixed sample announcement that anyone may read, so it explicitly declares `security: []` and requires no sign-in. When you later switch to internal announcements, add authentication and permission checks on the server; the page's sign-in requirement does not protect the API. The data comes from the server, and the page does not depend on the specific content of this announcement.

## 3. Write the announcements page

Add `packages/app-plugin-announcements/client/pages/announcements.tsx`:

```tsx
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useState, type ReactElement } from 'react';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import type { Announcement } from '../../shared/announcement.js';

export default function AnnouncementsPage(): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation();
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void api.request<{ data: Announcement[] }>({ path: 'announcements' }).then(
      ({ data }) => {
        if (active) setItems(data);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [api]);

  return (
    <PageContainer>
      <PageHeader title={t('title')} />
      {failed ? (
        <p role='alert'>{t('error')}</p>
      ) : items === null ? (
        <p role='status'>{t('loading')}</p>
      ) : items.length === 0 ? (
        <p>{t('empty')}</p>
      ) : (
        <ul className='space-y-4'>
          {items.map((item) => (
            <li key={item.id} className='rounded-lg border p-4'>
              <h2 className='font-semibold'>{item.title}</h2>
              <p className='mt-2 text-sm text-muted-foreground'>
                {item.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
```

`useApiClient()` uses the current App's API configuration, and `path` is relative to the API root, so do not hard-code a server address or `/main/api`. The page handles four cases separately: loading, request failed, empty list and a normal list; after leaving the page, it ignores the results of requests that have not finished.

`PageContainer` and `PageHeader` are the components installed into the plugin in the previous step. `#components/*` here is resolved by the plugin's own `package.json` and does not point to private files of the App.

## 4. Add the menu and language resources

Replace `packages/app-plugin-announcements/client/routes.ts` with:

```ts
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const routes: readonly AppClientRouteContribution[] = [
  defineAppRoutes([
    {
      name: 'announcements',
      path: '/announcements',
      auth: 'required',
      authz: 'skip',
      navigation: { title: 'title' },
      componentLoader: () => import('./pages/announcements.js'),
    },
  ]),
];
export default routes;
```

`navigation` adds the menu entry, and `componentLoader` loads the page lazily. Routes do not include the App's deployment prefix: with the default deployment at `/main`, the address in the browser is `/main/announcements`.

`auth: 'required'` means the page can only be visited after signing in, and `authz: 'skip'` means this example requires no separate page permission. Whether the announcements API is public is decided by the server implementation in the previous section.

The menu title and page messages come from the plugin's own language resources. Change `packages/app-plugin-announcements/client/locales/en-US.ts`:

```ts
import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  title: 'Announcements',
  loading: 'Loading announcements…',
  empty: 'No announcements yet.',
  error: 'Could not load announcements. Please refresh to try again.',
};
export type AnnouncementsResource = LocaleResource<typeof enUS>;
export default enUS;
```

Change `packages/app-plugin-announcements/client/locales/zh-CN.ts`:

```ts
import type { AnnouncementsResource } from './en-US.js';

const zhCN: AnnouncementsResource = {
  title: '公告栏',
  loading: '正在加载公告…',
  empty: '暂无公告。',
  error: '公告加载失败，请刷新页面重试。',
};
export default zhCN;
```

This example provides only English and Chinese. Change `packages/app-plugin-announcements/client/locales/index.ts` to the content below, and delete the other untranslated language files in the same directory; when adding a language later, add its text and loader.

```ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};
export default locales;
```

## 5. Verify the API and page

The route tests generated by the scaffold assert "no routes" by default. After implementing the feature, replace these assertions with tests of the actual behavior.

Replace `packages/app-plugin-announcements/tests/server/routes.test.ts` to check public reading, the response content, the API documentation, and that the API offers no write operations:

```ts
import {
  findUndeclaredApiRoutes,
  findApiDocumentSchemaProblems,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { describe, expect, it } from 'vitest';

import { apiRoutes } from '../../server/routes/index.js';

describe('announcements API', () => {
  it('returns public announcements without credentials', async () => {
    const router = await apiRoutes.createRouter(undefined);
    const response = await router.request('/announcements');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [
        {
          id: 'welcome',
          title: 'Welcome',
          content: 'Your first plugin is ready.',
        },
      ],
      meta: { total: 1 },
    });
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Announcements', version: '1' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    expect(
      (await router.request('/announcements', { method: 'POST' })).status,
    ).toBe(404);
  });
});
```

Replace `packages/app-plugin-announcements/tests/client/routes.test.ts` to check the menu and page declarations:

```ts
import { describe, expect, it } from 'vitest';

import routes from '../../client/routes.js';

describe('announcements navigation', () => {
  it('declares the page and menu', () => {
    expect(routes).toMatchObject([
      {
        parent: 'app',
        routes: [
          {
            name: 'announcements',
            path: '/announcements',
            auth: 'required',
            authz: 'skip',
            navigation: { title: 'title' },
          },
        ],
      },
    ]);
  });
});
```

Add `packages/app-plugin-announcements/tests/client/page.test.tsx` to check the request, displayed content, the empty list and the failure message with the real API client:

```tsx
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import announcements from '../../client/index.js';
import AnnouncementsPage from '../../client/pages/announcements.js';

const options = {
  plugins: [announcements()],
  namespace: '@nocobase/app-plugin-announcements',
  locale: 'zh-CN',
};

describe('announcements page', () => {
  it('requests the API and displays announcements', async () => {
    await renderWithApp(<AnnouncementsPage />, {
      ...options,
      fetch: answerApi((call) => {
        expect(call).toMatchObject({ method: 'GET', path: 'announcements' });
        return {
          data: [{ id: 'one', title: 'Test announcement', content: 'Hello!' }],
          meta: { total: 1 },
        };
      }),
    });
    expect(await screen.findByText('Test announcement')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '公告栏' })).toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    await renderWithApp(<AnnouncementsPage />, {
      ...options,
      fetch: answerApi(() => ({ data: [], meta: { total: 0 } })),
    });
    expect(await screen.findByText('暂无公告。')).toBeInTheDocument();
  });

  it('shows an API failure', async () => {
    await renderWithApp(<AnnouncementsPage />, {
      ...options,
      fetch: answerApi(() => new Response(null, { status: 500 })),
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('公告加载失败');
  });
});
```

Keep the other generated tests, then format and run the plugin's checks:

```bash
pnpm --filter @nocobase/app-plugin-announcements format
pnpm --filter @nocobase/app-plugin-announcements check
```

## 6. Register in the App and view the result

Installing dependencies and runtime registration are two different things. Preview the registration plan first, then register the plugin:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
```

The plugin is already a local workspace dependency, so `--no-install` skips installing it again. The command adds the corresponding registrations to the App's `client/plugins.ts` and `server/plugins.ts`, keeping the existing plugins.

Start or restart the development server:

```bash
pnpm dev
```

Open the App address shown in the terminal, sign in and click **Announcements**. With the default deployment prefix `/main`:

| Location | What you should see |
| --- | --- |
| `/main/announcements` | The page shows `Welcome` and `Your first plugin is ready.` |
| `/main/api/announcements` | Returns JSON with `data` and `meta.total`, without sign-in |
| Switching between English and Chinese | The menu and page messages switch, while the announcement text is still the data returned by the server |

Finally, verify the whole App's build in another terminal:

```bash
pnpm build
```

The page, API and language resources are now all maintained by the plugin, and the App loads them through public entries. Local plugins are built and delivered together with the App, with no need to publish to npm first. Later you can add database migrations, an announcement management page and the matching permissions; for the related directories and entries, see [Plugin structure](plugin-structure.md).

If you need to share the plugin across several Apps and manage its versions independently, continue with [Build and publish](publish-plugin.md); when it is used only in the current App, there is no need to publish it.

To organize several pages and navigation, read [Pages, routes and menus](pages-and-menus.md).

Next, you can read [Plugin declarations and public exports](plugin-declarations.md) to understand how the declarations on the three sides, package exports and cross-plugin service calls fit together.
