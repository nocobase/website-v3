---
title: 页面布局
description: 调整应用外框与页面内容区域，组合页面容器、嵌套路由和覆盖层，并保持导航、滚动与响应式行为一致。
---

布局决定导航、标题、工具栏和业务内容如何放在一起。大多数业务页面只需要组合已有组件；调整整个应用的侧边栏或顶部区域时，再修改 `client/layouts/`。

本篇以默认模板 `1.0.0-beta.84` 为参照。布局和组件是应用持有的源码，可以按产品需要修改。基础交互组件使用 shadcn；模块化界面优先参考 [NocoBase UI Library](https://ui.nocobase.com/)，添加与组织方式见 [UI 组件与交互](pages-and-interactions.md)。

## 使用 Agent

```text
请调整任务页面布局：宽屏左侧显示筛选区，右侧显示列表，窄屏上下排列。

先检查 client/layouts/、PageContainer 和 PageHeader，沿用现有组件与主题变量。
任务页面只保留一个页面容器和主标题，筛选与列表状态沿用现有实现。
保留应用导航、面包屑、页面权限、侧边栏折叠和个人设置入口。
编辑子页面或弹窗关闭后回到原列表位置，不出现双重滚动或重复导航。
检查长标题、长表格、窄屏、键盘操作以及中英文和明暗模式。
```

## 先判断要修改哪一层

| 层次 | 主要位置 | 适合处理的内容 |
| --- | --- | --- |
| 应用外框 | `client/layouts/app-layout.tsx` | 侧边栏、顶部区域、业务内容区域的整体组合 |
| 外框组件 | `client/layouts/components/` | 品牌、菜单、顶部操作、用户菜单等局部区域 |
| 页面容器 | `client/components/page-container.tsx` | 页面宽度、内边距与区块间距 |
| 页面标题 | `client/components/page-header.tsx` | 主标题、描述、页面级操作 |
| 业务页面 | `client/pages/` | 筛选区、表格、表单和业务面板的排布 |
| 子路由展示 | `Outlet` 与 `RouteDialog`、`RouteDrawer`、`RouteChildPage` | 内联区域、弹窗、抽屉或覆盖内容区的子页面 |
| 独立页面外框 | `client/routing/standalone-page-layout.tsx` | 默认模板中的访客与可选登录页面 |

添加业务菜单应修改路由声明；不能只在布局里加一个链接而跳过页面接入与权限。路由、菜单和访问条件见[页面、路由与导航](pages-routes-and-navigation.md)。

## 组合一个业务页面

例如，把任务页中的筛选与列表排成两栏。在 `client/pages/tasks/components/task-page-frame.tsx` 中提取布局组件：

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

页面使用 `<TaskPageFrame>`，传入翻译后的 `title`、`filterLabel`，已有筛选组件作为 `filters`，表格作为 `children`，新建按钮等作为 `actions`。接口读取与事件仍由页面或业务 Hook 管理，布局组件只负责安排这些区域；相关状态处理见[数据请求与状态管理](data-requests-and-state.md)。

这个组件已经包含 `PageContainer`，使用它时不要在外面再包一层。新建按钮、输入框等基础交互继续使用已有 shadcn 组件。布局只在当前页面使用时留在页面目录；多个页面确实共享后，再放到 `client/components/`。

`minmax(0,1fr)` 和 `min-w-0` 让内容列能在空间不足时收缩。长表格的横向滚动放在表格区域内；窄屏时两栏自动上下排列，避免整个应用出现横向滚动条。颜色、边框和间距使用已有主题约定，详见[主题与样式](themes-and-styles.md)。

## 调整应用外框

默认模板的登录后页面由 `AppLayout` 组合以下区域：

```tree
AppLayout
├── AppSidebarProvider
│   ├── AppSidebar
│   │   ├── NavigationMenu
│   │   └── AppSidebarFooter
│   └── 内容列
│       ├── LayoutHeader
│       │   ├── AppSidebarToggle
│       │   ├── Breadcrumbs
│       │   └── HeaderActions
│       └── main
│           └── 滚动区域
│               └── Outlet
```

这是可视区域关系的简图，源码还包含路由树与面包屑 Provider 等上下文。修改时保留这些上下文及其消费者的关系。

按改动范围选择入口：

- 顶部新增一个全局操作：先看 `layouts/components/header-actions.tsx`，保留主题和用户菜单。
- 调整品牌或侧边栏底部：修改 `app-brand.tsx`、`sidebar-footer.tsx`，无需重写业务页面。
- 调整菜单排列或可见项：检查路由声明与 `useRouteNavigation`，保留权限过滤和当前项计算。
- 调整顶部与侧边栏的位置：修改 `app-layout.tsx`，同时检查窄屏侧边栏、面包屑及滚动行为。

应用侧边栏偏好由现有 `use-sidebar-preference.ts` 与相关 Provider 管理。复用现有折叠与移动端控件，避免另建一份相互不同步的状态。`useSyncServerLocale()` 负责同步浏览器与服务端语言，移动布局代码时也应保留。

## 保留正确的滚动与覆盖关系

默认布局中的 `main` 提供内容区域的定位边界，内部容器承担页面纵向滚动。`RouteChildPage` 等覆盖层依赖这一关系；把 `overflow-y-auto` 随意移到外层，可能让覆盖层随父页面一起滚动，或被长内容撑高。

| 页面形式 | 容器组织 |
| --- | --- |
| 普通业务页面 | 一个 `PageContainer`，其中放标题与业务内容 |
| 页面中的页签或内联子路由 | 复用父页面容器，在指定位置渲染 `Outlet` |
| `RouteDialog` 或 `RouteDrawer` | 父列表保留，子路由使用对应覆盖组件 |
| `RouteChildPage` | 覆盖内容区域，内部可有自己的 `PageContainer` |

不要通过再添加一个完整的 `AppLayout` 来渲染子页面，否则容易出现重复侧边栏、主内容区域和路由上下文。也不需要再创建 `BrowserRouter`；应用运行时已有 Router。

编辑页面关闭时，检查列表滚动位置、筛选条件和焦点返回；覆盖层的实现与关闭行为见[页面、路由与导航](pages-routes-and-navigation.md)。

## 登录页与其他独立页面

在此版本的默认模板中，`client/routing/app-router.tsx` 根据路由的 `auth` 声明组织页面：需要登录的页面使用 `AppLayout`，访客与可选登录页面使用 `StandalonePageLayout`，并保留各自的认证处理。

`auth` 描述访问条件，不能为了换一个外框而把受保护页面改成公开页面。只想调整登录后某个功能的内容布局时，在业务页面内组合；如果确实需要另一种应用外框，应明确调整模板的路由组合并保留认证、会话准备和页面授权。这里属于应用定制，不是声明一个新的 `layout` 字段就会自动生效。

启动、渲染和 React Provider 的通用机制见[客户端运行时](../framework/runtime/client.md)；本篇聚焦已有布局源码的使用与调整。

## 验证结果

布局改动需要在真实页面中检查：

- 宽屏、窄屏、侧边栏展开和折叠时，标题、菜单与操作仍可使用。
- 长标题、翻译变长、空列表和长表格不会撑破内容区。
- 页面滚动、路由弹窗和子页面覆盖关系正确，没有重复页面容器。
- 键盘可到达筛选与操作区域，弹窗关闭后焦点返回合理位置。
- 直接打开子路由、刷新、前进后退，以及无页面权限时行为正常。
- 中英文、浅色与深色模式下的间距、对比度和边框一致。

默认模板的 `tests/client/layout-containers.test.tsx`、`client-shell.test.tsx`、`sidebar-preference.test.tsx`、`route-overlay.test.tsx` 可作为参考。为新增布局增加与用户行为相关的测试，运行项目的类型检查、相关测试和构建；截图检查不能替代导航与交互验证。

源码基线：[AppLayout](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/layouts/app-layout.tsx)、[AppRouter](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/routing/app-router.tsx)、[PageContainer](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/components/page-container.tsx)。
