---
title: Write your first plugin
description: Build an announcements plugin in an App, covering its API, page, navigation, tests and registration.
---

Build an announcements plugin: open Announcements from the App menu, request the plugin's API and display the results. This example uses both Client and Server to show how a plugin adds a feature to an application.

Start with one fixed announcement, without a database table or editing features. Once the flow works, extend it with storage and management pages as needed.

## Use an agent

Open your existing App project in an agent and describe the feature:

```text
Use @nocobase/create-plugin to create an announcements plugin in this App.
Add a public announcements API and a page in the signed-in navigation.
Start with one fixed announcement, support English and Chinese UI, test it and register it in the App.
```

The steps below explain the manual implementation and help you review an agent's work.

## 1. Prepare the scaffold

Start with an App created by create-app, with dependencies installed and a working development server. See [Create a plugin](create-plugin.md) for generator options and [Plugin structure](plugin-structure.md) for file responsibilities. **Run every command from the App root; file paths are relative to that root.**

Select page routes, Client translations and Server routes:

```bash
pnpm create @nocobase/plugin@beta announcements \
  --with client.routes --with client.locales --with server.routes
```

If the plugin already exists, continue editing it instead of creating it again. It lives in `packages/app-plugin-announcements/`, referenced by the App through `workspace:*`. The scaffold already connects routes and translations to the plugin definitions. Keep its `client/plugin.ts`, `server/plugin.ts` and both `index.ts` files.

Install the UI Library page container and header into the plugin, which owns their source:

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add \
  @nocobase/page-container @nocobase/page-header
```

Review the plugin's `package.json`. The page uses `react` at runtime: move it from `devDependencies` to `peerDependencies`, keeping the generated version. Move Client dependencies added by the component installer (`cn` in this example) to `peerDependencies` too. Keep the Server's `hono` in `dependencies`, then run `pnpm install` to synchronize dependencies and the lockfile.

## 2. Provide the announcements API

Add `packages/app-plugin-announcements/shared/announcement.ts` for the type shared by the page and API:

```ts
export interface Announcement {
  readonly id: string;
  readonly title: string;
  readonly content: string;
}
```

Add `packages/app-plugin-announcements/server/routes/schemas.ts` to describe an announcement in the API document:

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

Replace the empty routes in `packages/app-plugin-announcements/server/routes/index.ts`:

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

`defineApiRoutes()` contributes routes to the App's API. Write only `/announcements`; the App supplies the API prefix. `describeRoute()` declares the endpoint documentation, and `listResponse()` describes its `{ data, meta }` response.

This endpoint deliberately serves fixed, publicly readable sample announcements and declares `security: []`. It requires no credentials. If you later serve internal announcements, add Server authentication and authorization; a page's sign-in requirement does not protect its API. Announcement content comes from the Server rather than being built into the page.

## 3. Build the page

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

`useApiClient()` uses the current App's API configuration. Its `path` is relative to the API root; do not hard-code a server address or `/main/api`. The page handles loading, failures, empty results and a populated list, and ignores pending request results after unmounting.

`PageContainer` and `PageHeader` are the components installed into the plugin. Its own `package.json` resolves `#components/*`; these imports do not reach into private App files.

## 4. Add navigation and translations

Replace `packages/app-plugin-announcements/client/routes.ts`:

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

`navigation` adds the menu entry, while `componentLoader` loads the page lazily. The route omits the deployment prefix: with the default `/main` base path, the browser URL is `/main/announcements`.

`auth: 'required'` requires sign-in for the page, and `authz: 'skip'` means this example needs no separate page permission. The Server implementation above determines whether the announcements API is public.

Menu and page text come from the plugin's translations. Update `packages/app-plugin-announcements/client/locales/en-US.ts`:

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

Update `packages/app-plugin-announcements/client/locales/zh-CN.ts`:

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

This example supports English and Chinese. Replace `packages/app-plugin-announcements/client/locales/index.ts` below and remove the other untranslated locale files from that directory. Add complete translations and their loaders when supporting more languages.

```ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};
export default locales;
```

## 5. Test the API and page

Generated route tests expect no routes. Replace those initial assertions with tests for the implemented behavior.

Replace `packages/app-plugin-announcements/tests/server/routes.test.ts` to check public reads, response content, API documentation and the absence of a write endpoint:

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

Replace `packages/app-plugin-announcements/tests/client/routes.test.ts` to check page and navigation declarations:

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

Add `packages/app-plugin-announcements/tests/client/page.test.tsx` to check requests from the real API client, displayed content, empty results and failures:

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

Keep the other generated tests, format the changes and run the plugin checks:

```bash
pnpm --filter @nocobase/app-plugin-announcements format
pnpm --filter @nocobase/app-plugin-announcements check
```

## 6. Register in the App and view the result

Installing dependencies and registering runtime entries are separate steps. Preview the registration plan, then register the plugin:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
```

The plugin is already an installed workspace dependency, so `--no-install` avoids installing it again. The command adds registrations to the App's `client/plugins.ts` and `server/plugins.ts`, preserving existing plugins.

Start or restart the development server:

```bash
pnpm dev
```

Open the App URL printed by the development server, sign in and choose Announcements. With the default `/main` base path:

| Location | Expected result |
| --- | --- |
| `/main/announcements` | Shows `Welcome` and `Your first plugin is ready.` |
| `/main/api/announcements` | Returns JSON with `data` and `meta.total`, without signing in |
| Switch between English and Chinese | Menu and page text change; announcement content remains the data returned by the Server |

Finally, verify the complete App build in another terminal:

```bash
pnpm build
```

The plugin now owns its page, API and translations, and the App loads them through public entries. The local plugin builds and ships with the App without npm publication. Extend it with database migrations, announcement management and permissions as needed; see [Plugin structure](plugin-structure.md) for the relevant directories and entries.

For sharing across Apps with independently managed versions, continue with [Publish a plugin](publish-plugin.md). Publication is unnecessary when using the plugin only in the current App.

For multiple pages and navigation, continue with [Pages and menus](pages-and-menus.md).
