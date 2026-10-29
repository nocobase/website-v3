---
title: 页面、路由与导航
description: 注册页面和菜单，组织子路由与面包屑，明确登录要求和页面访问权限。
---

页面组件负责展示内容；路由声明负责把组件接入应用，并描述它的地址、菜单、面包屑和访问条件。侧边栏由路由自动生成，添加业务入口时一般不需要修改布局。

业务页面主要放在 `client/pages/`，通过 `client/routes.ts` 接入应用。`client/layouts/` 负责页面的外层布局，通常只在调整应用框架、导航区域或内容区域时才需要修改。路由渲染和启动装配的机制见 [客户端运行时](../framework/runtime/client.md)。

相关主题分布在其他几篇：页面容器、两栏排布和应用外框的调整见 [页面布局](page-layouts.md)；URL 查询参数、数据读取以及返回后的刷新见 [数据请求与状态管理](data-requests-and-state.md)；表格、表单和请求状态见 [UI 组件与交互](pages-and-interactions.md)。

本篇沿用任务应用中的项目页面，重点说明路由如何组织。代码摘自默认模板 `1.0.0-beta.78` 的示例应用，接入时请保留项目已有的路由。文中的 `tutorialTasks`／`tutorialProjects` 属于独立的历史项目示例，不是当前入门示例中的 `tasks`；运行前请按 [建表与数据初始化](data-models-and-migrations.md) 确认基线。

## 使用 Agent

```text
请把现有项目列表接入应用导航，并把新建项目做成这个列表上的弹窗。

有页面访问权限的成员才能进入项目页面；能查看项目不代表能新建项目。
直接打开新建链接、刷新、浏览器前进后退时，页面与弹窗状态都要正确。
关闭弹窗后回到原来的项目列表，保留搜索和页码。

菜单和页面标题提供中英文，不增加重复菜单，也不改变已有权限分配。
请检查未登录、没有页面权限、只有查看权限和允许新建这几种情况。
服务端仍要独立检查每个请求的权限。
```

## 不使用 Agent

### 注册页面与菜单

在 `client/routes.ts` 已有的 `defineAppRoutes([...])` 中加入下面的项目路由，并合并所需的 import。如果已经存在同名路由，请修改原条目，不要重复注册：

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

声明 `projectRoute` 变量本身不会注册页面，需要把它放进现有的路由数组。上面引用的组件文件和权限资源由 [项目示例](pages-and-interactions.md) 提供；空白应用需要先实现它们。

| 声明 | 含义 |
| --- | --- |
| `name` | 稳定且唯一的路由名称，用于定位和覆盖路由 |
| `path` | 应用内部地址；子路由的路径相对于父级，如 `create` |
| `componentLoader` | 懒加载页面，模块需默认导出 React 组件 |
| `navigation` | 菜单标题、图标和同级排序；省略时不生成菜单入口 |
| `breadcrumb` | 当前路由层级的面包屑标题，通常使用翻译 key |
| `children` | 页面下的子路由，内容渲染在父页面的 `Outlet` 中 |

页面路径不包含部署时的基础路径。应用入口为 `/main/` 时，`/projects` 在浏览器中对应 `/main/projects`；业务代码中不要硬编码 `/main`。另外，模板中的动态 import 使用 `.js` 后缀，即使对应的源码文件是 `.tsx`。

### 组织页面组件和子路由

列表页面通常用 `PageContainer` 和 `PageHeader` 搭建页面框架，并保留 `<Outlet />` 来渲染子路由。下面的代码只说明布局关系，不包含列表请求和表单实现：

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

子路由不一定是一整页，具体选哪种方式，取决于它要呈现的内容：

| 展示方式 | 适用场景 | 与父页面的关系 |
| --- | --- | --- |
| 普通子内容 | 页签、页面内分区 | 渲染在 `Outlet` 位置，复用父页面的容器 |
| `RouteDialog` | 简短的新建或编辑表单 | 以弹窗形式覆盖在父页面上 |
| `RouteDrawer` | 记录详情或侧边编辑 | 以抽屉形式覆盖在父页面上 |
| `RouteChildPage` | 长表单或复杂的子页面 | 覆盖内容区域，保留父页面状态和应用导航 |

内联页签中不要再嵌套一个完整的 `PageContainer`。需要覆盖整个内容区域时，请使用 `RouteChildPage`；如果只是在父页面后面再渲染一个页面容器，页面会上下堆叠。

### 保留地址与导航上下文

打开路由弹窗时，带上当前的查询条件：

```tsx
<Link to={{ pathname: 'create', search: location.search }}>
  {t('projects.new')}
</Link>
```

这里的 `Link` 和 `useLocation` 来自 `react-router`，`location` 由页面中的 `useLocation()` 取得。弹窗关闭后应回到父路由，并保留其搜索、排序和页码。不要只依赖浏览器的“后退”，因为用户也可能是直接打开链接进来的。

可分享的页签用子路由来表达。只有访问父地址时，才跳转到默认的可访问页签；已经指定了子地址时，不要强制跳回默认页签。切换页签使用普通导航；默认页签的重定向则使用替换历史记录的方式，避免用户后退时陷入循环跳转。

保存过程中的关闭保护、浏览器后退和焦点恢复见 [UI 组件与交互](pages-and-interactions.md)，它们需要共用同一个提交状态。

### 菜单分组与面包屑

仅用于组织菜单的分组，只声明 `name`、`navigation` 和 `children`，不提供 `componentLoader`，也不声明 `authz`。分组有 `path` 时，会成为子地址的前缀；不要为了修改分组标题而改动已有页面的地址。

`navigation.order` 越小越靠前，数值相同时保持注册顺序。详情、弹窗和页签通常没有独立的菜单；含参数的地址不能直接作为固定菜单入口。在菜单中隐藏不等于禁用功能，直接访问地址时仍会经过路由检查。

页面通常使用路由的 `breadcrumb.title` 作为面包屑；没有显式标题时，可以由页面的 `navigation.title` 生成。需要显示记录名称，或者返回链接需要带上原列表的查询条件时，页面可以用 `usePageBreadcrumb()` 提供动态路径；记录尚未加载完成时，先保留静态标题。如果面包屑已经提供了同一个返回路径，就不要再叠加一个重复的返回按钮。

### 区分登录与页面权限

| 配置 | 控制什么 |
| --- | --- |
| `auth: 'required'` | 需要登录；子页面继承入口页面的登录要求 |
| `auth: 'guest'` | 登录、注册等访客页面 |
| `auth: 'optional'` | 登录前后都可以打开，内容自行根据身份调整 |
| `authz: { resource, action }` | 检查指定资源和操作，例如页面的 `access` 或新建这类业务操作 |
| `authz: 'skip'` | 跳过本页面自身的授权检查，但仍受登录要求和父页面限制 |
| `authz: 'unrestricted'` | 只允许拥有无限制访问权限的身份；它的含义不是“允许所有用户” |

每条路径的第一个页面都应显式声明 `authz`。子页面未声明时，继承最近一个祖先页面的值；子页面声明了自己的值，也不会绕过父页面的检查。因此，进入项目页面需要 `projects/access`，打开新建弹窗还要额外检查 `tutorial.projects/create`。

页面权限的资源 ID 会被保存到角色授权中，修改 ID 需要迁移已有的授权，不能只为了调整显示文字而改 ID。权限的显示标题来自翻译；没有导航或面包屑的页面，可以通过 `client/pages/settings/page-permission-titles.ts` 补充权限显示名。

以上检查都发生在浏览器中。API 仍然需要独立进行认证、业务授权和数据范围检查，详见 [路由与 HTTP 接口](apis-and-services.md)。

## 验证结果

在本文基于 `.78` 的项目示例中，运行配套的路由和权限标题检查：

```bash
pnpm exec vitest run tests/logic/client-routes.test.ts tests/logic/page-permission-titles.test.ts
```

然后在浏览器中检查：从菜单进入、直接打开子链接、刷新、前进后退、关闭弹窗，以及查询条件是否保留。再用普通用户分别验证没有页面权限、只有查看权限和允许新建三种情况，同时检查直接发起的 API 请求。不能只把“管理员能看到页面”当作验收结果。
