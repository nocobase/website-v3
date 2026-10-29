---
title: 页面、路由与菜单
description: 在 App 的本地插件中添加页面、菜单和子页面，处理导航、默认入口与访问权限。
---

插件通过路由声明把页面接入 App，菜单也来自这些声明。本篇实现一个“帮助中心”：侧边栏中只有一个入口，页面内可以在“使用指南”和“常见问题”之间切换，刷新或分享链接时都能保留当前的内容。

[编写第一个插件](write-your-first-plugin.md) 已经介绍了单个页面与接口如何连接。本篇重点说明页面和菜单的组织方式，示例只需要 Client，不需要服务端接口。

插件贡献页面和菜单的方式是：`routes.ts` 引用页面组件，`client/plugin.ts` 的 `routes` 汇总路由，App 注册 Client 工厂后加载这些贡献。组件的实现和样式见 [组件与样式](frontend-components.md)；表单交互和 URL 状态的处理，可以复用 [UI 组件与交互](../developing-apps/pages-and-interactions.md) 和 [数据请求与状态管理](../developing-apps/data-requests-and-state.md) 中的做法。

## 使用 Agent

在已有的 App 中，可以这样描述需求：

```text
请创建 help-center 插件，在登录后的菜单中加入“帮助中心”。
页面里有“使用指南”和“常见问题”两个子页面，默认打开使用指南。
切换页面、刷新和浏览器前进后退都保留对应内容，支持中英文。
用 @nocobase/create-plugin 创建，并完成测试和 App 注册。
```

下面是手动实现的步骤。

## 1. 准备插件和页面组件

前提是已有一个可以正常启动的 App。**所有命令都在 App 根目录执行；后文的文件路径相对于 `packages/app-plugin-help-center/`。** 不需要下载 NocoBase 的源码。

```bash
pnpm create @nocobase/plugin@beta help-center \
  --with client.routes --with client.locales

pnpm --filter @nocobase/app-plugin-help-center exec shadcn add \
  @nocobase/page-container @nocobase/page-header
```

创建工具会把插件加入 App 的 `packages/` 工作区，并添加 `workspace:*` 依赖；组件安装器会把 `PageContainer` 和 `PageHeader` 的源码放进插件的 `client/components/`。如果已经有同名的插件，直接修改它，不要重复创建。

检查插件的 `package.json`：把运行时用到的 `react` 和 `react-router` 从 `devDependencies` 移到 `peerDependencies`，保留生成的版本；把组件安装器新增的 `cn` 也移到 `peerDependencies`，然后在 App 根目录运行 `pnpm install`。

保留脚手架生成的 `client/plugin.ts` 和 `client/index.ts`。前者已经连接了 `routes` 和 `locales`，后者提供 App 的注册入口。创建时的选项见 [创建插件](create-plugin.md)。

## 2. 声明页面与菜单

替换 `client/routes.ts`：

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

这几个字段分别解决不同的问题：

| 字段 | 作用 |
| --- | --- |
| `name` | 插件内稳定、唯一的路由名称，不是显示用的标题 |
| `path` | 页面地址；子页面使用相对路径，例如 `guide` |
| `componentLoader` | 按需加载页面，目标模块需默认导出 React 组件 |
| `navigation` | 在 App 侧边栏中显示入口；`title` 是插件的翻译 key，`order` 越小越靠前 |
| `breadcrumb` | 在 App 的面包屑中显示这一层，与 `navigation` 的配置相互独立 |
| `children` | 子页面，由父页面中的 `<Outlet />` 渲染 |

`/help` 是插件声明的路径，不包含 App 的部署前缀。默认前缀为 `/main` 时，浏览器中的地址是 `/main/help`。子页面没有 `navigation`，因此不会另外出现在侧边栏中；它们是帮助中心内部的视图，也不单独增加面包屑。

这里用 `auth: 'required'` 要求登录，用 `authz: 'skip'` 表示帮助内容不需要额外的页面权限，子页面会继承这一策略。涉及业务权限的页面，应声明对应的资源和操作，例如 `authz: { resource: { type: 'page', id: 'orders' }, action: 'access' }`，并在 App 中配置授权。父页面的检查仍然必须通过，子页面无法绕过它。前端路由的权限检查，也不能代替服务端接口的授权。

## 3. 编写父页面和子页面

新增 `client/pages/help/index.tsx`：

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

父页面提供统一的容器、标题和导航，`Outlet` 决定子页面显示在哪里。`NavLink` 会根据当前的 URL 标记选中项，因此不需要再维护一个 `activeTab` 状态。这些都是普通的页面导航链接，直接用键盘就可以操作。

只有访问父地址 `/help` 时，才会跳转到默认的子页面 `guide`。`replace` 避免后退时再次经过默认入口，`search` 保留查询参数。直接打开 `/help/faq` 时不会被重定向。路由声明中没有 `index` 字段，不需要为默认入口虚构一个子路由。

本例的两个子页面访问策略相同。如果不同的子页面需要不同的权限，应在权限加载完成后，选择第一个可以访问的页面作为默认页面；没有可以访问的页面时显示提示，避免反复跳转。

新增 `client/pages/help/guide.tsx`：

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

新增 `client/pages/help/faq.tsx`：

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

子页面已经位于父页面的容器之内，不要再增加 `PageContainer` 或第二个页面标题。目录按照路由的层次组织，也方便以后继续增加子页面。

## 4. 添加中英文文案

替换 `client/locales/en-US.ts`：

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

替换 `client/locales/zh-CN.ts`：

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

本例只提供中英文两种语言，请把 `client/locales/index.ts` 改为：

```ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};
export default locales;
```

然后删除同目录中其他尚未翻译的语言文件，以后新增语种时再补齐文案和加载器。这些语言文件使用同一个资源类型，保留空对象会导致类型检查失败。

页面通过插件路由加载时，`useTranslation()` 会自动使用插件的语言命名空间。菜单和面包屑也从同一份资源中读取标题，不需要修改 App 的语言文件。

## 5. 验证导航行为

脚手架生成的 `tests/client/routes.test.ts` 断言路由为空，添加页面之后需要替换它。删除这个文件，新建 `tests/client/routes.test.tsx`：

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

测试从真实的路由声明中加载组件，检查默认入口、查询参数、子页面切换、浏览历史和英文显示。`renderWithApp` 已经提供了路由和语言环境，不要再套一层 `MemoryRouter`。这里验证的是页面的导航行为；App 的菜单生成和登录守卫，还需要在接入之后另行检查。

```bash
pnpm --filter @nocobase/app-plugin-help-center format
pnpm --filter @nocobase/app-plugin-help-center check
```

## 6. 接入 App

在 App 根目录预览并执行注册，然后启动或重启开发服务：

```bash
pnpm nocobase plugin register @nocobase/app-plugin-help-center --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-help-center --no-install
pnpm dev
```

插件已经是本地的工作区依赖，所以使用 `--no-install` 跳过重复的安装。本例只有 Client 入口，注册命令会更新 App 的 `client/plugins.ts`。

登录后检查以下行为。表中的路径使用默认的部署前缀 `/main`，部署在其他路径时请相应调整。

| 操作 | 预期结果 |
| --- | --- |
| 点击“帮助中心”菜单 | 打开 `/main/help/guide`，显示使用指南 |
| 打开 `/main/help?from=menu` | 跳转到 `/main/help/guide?from=menu` |
| 点击“常见问题” | 地址变为 `/main/help/faq`，当前导航项高亮 |
| 直接打开或刷新 `/main/help/faq` | 保持在常见问题，不会跳回使用指南 |
| 浏览器后退、前进 | 显示的内容与当前 URL 一致 |
| 切换中英文 | 菜单、面包屑、标题和正文一起切换 |
| 未登录时访问帮助页面 | 进入 App 的登录流程 |

最后，在 App 根目录运行 `pnpm build`，确认插件能随 App 一起构建。

## 更多页面如何组织

**只在页面内部打开的内容**，例如详情页或内部的子页面，不要设置 `navigation`；有 URL 并不意味着必须在菜单中显示。带参数的详情路径可以写成 `:id`，它不能作为固定的菜单入口。

**本身有内容的父页面**，可以同时声明 `componentLoader`、`navigation` 和 `children`，但必须在组件中放置 `Outlet`。需要子页面也出现在侧边栏中时，再为这些子页面增加 `navigation`。

**只用于归类的菜单分组**，只声明 `navigation` 和 `children`，不声明 `componentLoader`。例如，把完整的 `help` 路由移到下面这个分组的 `children` 中：

```ts
{
  name: 'support',
  navigation: { title: 'support' },
  children: [
    // Move the complete help route here, including its children.
  ],
}
```

同时在中英文语言资源中增加 `support`，分别为 `Support` 和“支持”。分组没有 `path` 时，不会改变 `/help` 的地址；设置了 `path` 时，它会成为子路由的路径前缀。

新增菜单都通过这些路由声明完成，不需要修改 App 的侧边栏组件，也不需要增加 ServiceProvider。
