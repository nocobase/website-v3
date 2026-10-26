---
title: 编写第一个插件
description: 在 App 中实现公告栏插件，走通接口、页面、菜单、测试和注册的完整过程。
---

本篇实现一个“公告栏插件”：在 App 菜单中打开公告栏，页面请求插件提供的接口并显示公告列表。这个例子同时用到 Client 和 Server，能直观看到插件如何为应用增加功能。

先用一条固定公告走通流程，不添加数据库表或公告编辑功能。完成后，再按业务需要扩展数据存储和管理页面。

## 使用 Agent

在已有 App 的项目目录中打开 Agent，可以这样描述需求：

```text
请在当前 App 中用 @nocobase/create-plugin 创建 announcements 公告栏插件，
提供公开的公告查询接口，并在登录后的菜单中加入公告页面。
先显示一条固定公告，支持中英文界面，完成测试并接入应用。
```

下面说明手动实现的步骤，也可以用来理解和检查 Agent 的结果。

## 1. 准备插件骨架

前提是已有一个通过 create-app 创建、安装好依赖并能正常启动的 App。创建工具的选项见[创建插件](create-plugin.md)，文件职责见[插件的结构](plugin-structure.md)。**以下命令均在 App 根目录执行，文件路径相对于 App 根目录。**

创建插件，选择页面路由、客户端语言资源和服务端路由：

```bash
pnpm create @nocobase/plugin@beta announcements \
  --with client.routes --with client.locales --with server.routes
```

如果已有同名插件，继续修改它，不要重复创建。生成位置为 `packages/app-plugin-announcements/`，App 通过 `workspace:*` 依赖它。脚手架已将路由与语言资源接入插件定义，保留生成的 `client/plugin.ts`、`server/plugin.ts` 及两个 `index.ts`。

为页面安装 UI Library 的容器和标题组件，组件源码归插件维护：

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add \
  @nocobase/page-container @nocobase/page-header
```

检查插件的 `package.json`：页面会在运行时使用 `react`，应将它从 `devDependencies` 移到 `peerDependencies`，保留脚手架选定的版本；组件安装器新增的客户端依赖（本例为 `cn`）也移到 `peerDependencies`。服务端使用的 `hono` 仍放在 `dependencies`。然后运行 `pnpm install` 同步依赖与锁文件。

## 2. 提供公告接口

新增 `packages/app-plugin-announcements/shared/announcement.ts`，让页面与接口共用数据类型：

```ts
export interface Announcement {
  readonly id: string;
  readonly title: string;
  readonly content: string;
}
```

新增 `packages/app-plugin-announcements/server/routes/schemas.ts`，描述接口返回的公告结构：

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

将 `packages/app-plugin-announcements/server/routes/index.ts` 的空路由列表替换为：

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

`defineApiRoutes()` 把路由接入 App 的 API；路径只写 `/announcements`，由 App 补上 API 前缀。`describeRoute()` 声明接口文档，`listResponse()` 描述 `{ data, meta }` 列表响应。

本例返回的是固定、可公开阅读的示例公告，因此明确声明 `security: []`，不要求登录。以后改为内部公告时，需要在服务端增加认证和权限检查；页面的登录要求不能保护接口。数据来自服务端，页面不依赖这条公告的具体内容。

## 3. 编写公告页面

新增 `packages/app-plugin-announcements/client/pages/announcements.tsx`：

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

`useApiClient()` 使用当前 App 的 API 配置，`path` 相对于 API 根路径，不要写死服务器地址或 `/main/api`。页面分别处理加载中、请求失败、空列表和正常列表；离开页面后忽略尚未完成的请求结果。

`PageContainer` 和 `PageHeader` 使用上一步安装到插件的组件。这里的 `#components/*` 由插件自己的 `package.json` 解析，不指向 App 的私有文件。

## 4. 加入菜单和语言资源

将 `packages/app-plugin-announcements/client/routes.ts` 替换为：

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

`navigation` 添加菜单入口，`componentLoader` 延迟加载页面。路由不包含 App 的部署前缀：默认部署在 `/main` 时，浏览器地址为 `/main/announcements`。

`auth: 'required'` 要求登录后访问页面，`authz: 'skip'` 表示本例不再要求单独的页面权限。公告接口是否公开，由上一节的服务端实现决定。

菜单标题和页面提示通过插件自己的语言资源提供。修改 `packages/app-plugin-announcements/client/locales/en-US.ts`：

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

修改 `packages/app-plugin-announcements/client/locales/zh-CN.ts`：

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

本例只提供中英文，将 `packages/app-plugin-announcements/client/locales/index.ts` 改为下面的内容，并删除同目录中其他尚未翻译的语言文件。新增语种时再补齐对应文案和加载器。

```ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};
export default locales;
```

## 5. 验证接口和页面

脚手架的路由测试默认断言“没有路由”。实现功能后，应将这些断言替换为实际行为测试。

替换 `packages/app-plugin-announcements/tests/server/routes.test.ts`，检查公开读取、响应内容、接口文档，以及接口不提供写入操作：

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

替换 `packages/app-plugin-announcements/tests/client/routes.test.ts`，检查菜单与页面声明：

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

新增 `packages/app-plugin-announcements/tests/client/page.test.tsx`，检查真实 API 客户端的请求、内容显示、空列表和失败提示：

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

保留其他生成的测试，格式化后运行插件检查：

```bash
pnpm --filter @nocobase/app-plugin-announcements format
pnpm --filter @nocobase/app-plugin-announcements check
```

## 6. 接入 App 并查看结果

依赖安装和运行时注册是两回事。先预览注册计划，再注册插件：

```bash
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
```

插件已是本地工作区依赖，因此用 `--no-install` 跳过重复安装。命令会在 App 的 `client/plugins.ts` 和 `server/plugins.ts` 中加入相应注册，保留已有插件。

启动或重启开发服务：

```bash
pnpm dev
```

打开终端显示的 App 地址，登录后点击“公告栏”。默认部署前缀为 `/main` 时：

| 位置 | 应看到的结果 |
| --- | --- |
| `/main/announcements` | 页面显示 `Welcome` 和 `Your first plugin is ready.` |
| `/main/api/announcements` | 返回包含 `data` 和 `meta.total` 的 JSON，无需登录 |
| 切换中英文 | 菜单与页面提示切换，公告正文仍是服务端返回的数据 |

最后在另一个终端验证整个 App 的构建：

```bash
pnpm build
```

至此，页面、接口和语言资源都由插件维护，App 通过公开入口加载它们。本地插件会随 App 一起构建和交付，无需先发布到 npm。后续可以加入数据库迁移、公告管理页面和对应权限；相关目录与入口见[插件的结构](plugin-structure.md)。

需要跨 App 共享并独立管理版本时，继续阅读[发布插件](publish-plugin.md)。仅在当前 App 中使用时，无需发布。

继续组织多个页面和导航时，阅读[页面和菜单](pages-and-menus.md)。
