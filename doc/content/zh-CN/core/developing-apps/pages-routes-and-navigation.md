---
title: 页面、路由与导航
description: 注册页面和菜单，组织子路由与面包屑，并明确登录要求和页面访问权限。
---

页面组件负责展示内容，路由声明负责把组件接入应用，并描述地址、菜单、面包屑和访问条件。侧边栏从路由生成，一般不需要直接修改布局来添加业务入口。

本篇沿用任务应用的项目页面，重点说明路由组织。表格、表单和请求状态见[UI 组件与交互](pages-and-interactions.md)。代码摘自默认模板 `1.0.0-beta.78` 的示例应用，接入时保留项目已有路由。本文的 `tutorialTasks`／`tutorialProjects` 属于独立的历史项目示例，不是当前入门示例的 `tasks`；运行前按[数据模型与迁移](data-models-and-migrations.md)确认基线。

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

在 `client/routes.ts` 已有的 `defineAppRoutes([...])` 中加入下面的项目路由，并合并所需 import。若已存在，修改原条目，不要重复注册：

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

把 `projectRoute` 放入现有路由数组即可；声明变量本身不会注册页面。上面的组件文件和权限资源由[项目示例](pages-and-interactions.md)提供，空白应用需先实现它们。

| 声明              | 含义                                           |
| ----------------- | ---------------------------------------------- |
| `name`            | 稳定且唯一的路由名称，供路由定位和覆盖使用     |
| `path`            | 应用内部地址；子路由相对于父级，如 `create`    |
| `componentLoader` | 懒加载页面，模块默认导出 React 组件            |
| `navigation`      | 菜单标题、图标和同级排序；省略则不产生菜单入口 |
| `breadcrumb`      | 当前路由层级的标题，通常使用翻译 key           |
| `children`        | 页面下的子路由，内容在父页面的 `Outlet` 中呈现 |

页面路径不包含部署基础路径。入口为 `/main/` 时，`/projects` 在浏览器中是 `/main/projects`；业务代码不硬编码 `/main`。模板的动态 import 使用 `.js` 后缀，即使对应源码文件是 `.tsx`。

### 组织页面组件和子路由

列表页面通常由 `PageContainer` 与 `PageHeader` 提供页面框架，并保留 `<Outlet />` 渲染子路由。以下只说明布局关系，不包含列表请求和表单实现：

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

子路由不一定是一整页，选择由它呈现的内容决定：

| 展示方式 | 适用场景 | 与父页面的关系 |
| --- | --- | --- |
| 普通子内容 | 页签、页面内分区 | 在 `Outlet` 位置渲染，复用父页面容器 |
| `RouteDialog` | 简短的新建或编辑表单 | 弹窗覆盖在父页面上 |
| `RouteDrawer` | 记录详情或侧边编辑 | 抽屉覆盖在父页面上 |
| `RouteChildPage` | 长表单或复杂子页面 | 覆盖内容区域，保留父页面状态和应用导航 |

内联页签不要再嵌套一个完整 `PageContainer`。需要覆盖整个内容区时使用 `RouteChildPage`；仅在父页面后面渲染第二个页面容器，会出现上下堆叠的页面。

### 保留地址与导航上下文

打开路由弹窗时携带当前查询条件：

```tsx
<Link to={{ pathname: 'create', search: location.search }}>
  {t('projects.new')}
</Link>
```

这里的 `Link`、`useLocation` 来自 `react-router`，`location` 由页面的 `useLocation()` 取得。弹窗关闭后应回到父路由，并保留其搜索、排序和页码；不要只依靠浏览器“后退”，因为用户也可能直接打开链接。

可分享的页签使用子路由表达。访问父地址时才跳转到默认的可访问页签；已经指定子地址时不要强制跳回默认页签。切换页签使用普通导航，默认页签重定向使用替换历史记录的方式，避免后退时循环跳转。

保存期间的关闭保护、浏览器后退和焦点恢复见[UI 组件与交互](pages-and-interactions.md)，它们需要使用同一个提交状态。

### 菜单分组与面包屑

只组织菜单的分组声明 `name`、`navigation` 和 `children`，不提供 `componentLoader`，也不声明 `authz`。有 `path` 时它参与子地址的前缀；不要为了改变分组标题而改动已有页面地址。

`navigation.order` 越小越靠前，同值保持注册顺序。详情、弹窗和页签通常没有独立菜单；含参数的地址不能直接作为固定菜单入口。菜单隐藏不等于禁用功能，直接访问地址仍受路由检查。

页面通常使用路由的 `breadcrumb.title`，没有显式标题时可从页面的 `navigation.title` 生成。需要记录名称或携带原列表查询条件的返回链接时，页面可以使用 `usePageBreadcrumb()` 提供动态路径；记录尚未加载时保留静态标题。若面包屑已经提供同一返回路径，不再叠加一个重复的返回按钮。

### 区分登录与页面权限

| 配置 | 控制什么 |
| --- | --- |
| `auth: 'required'` | 需要登录；子页面继承入口的登录要求 |
| `auth: 'guest'` | 登录、注册等访客页面 |
| `auth: 'optional'` | 登录前后都可打开，内容自行适配身份 |
| `authz: { resource, action }` | 检查指定资源与操作，例如页面 `access` 或新建业务操作 |
| `authz: 'skip'` | 跳过本页面自己的授权检查，仍受登录和父页面限制 |
| `authz: 'unrestricted'` | 只允许具有无限制访问权限的身份，不是“允许所有用户” |

每条路径的首个页面应显式声明 `authz`。子页面未声明时继承最近祖先页面的值；声明自己的值也不会绕过父页面检查。因此项目页面需要 `projects/access`，新建弹窗还检查 `tutorial.projects/create`。

页面权限的资源 ID 会被保存到角色授权中，改名需要迁移已有授权，不能只为调整显示文字而修改 ID。标题来自翻译；没有导航或面包屑的页面可通过 `client/pages/settings/page-permission-titles.ts` 补充权限显示名。

上述检查都发生在浏览器。API 仍需独立认证、业务授权和数据范围检查，详见[业务服务与 HTTP 接口](apis-and-services.md)。

## 验证结果

在本文 `.78` 项目示例中，运行配套的路由和权限标题检查：

```bash
pnpm exec vitest run tests/logic/client-routes.test.ts tests/logic/page-permission-titles.test.ts
```

再在浏览器中检查菜单进入、直接打开子链接、刷新、前进后退、关闭弹窗及查询条件保留。用普通用户分别验证页面无权限、只有查看权限、允许新建；同时检查直接 API 请求，不能只用管理员看到页面作为验收结果。
