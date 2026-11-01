---
title: 页面布局
description: 使用商品目录示例组合页面容器、响应式两栏、应用外框与子页面，处理滚动、导航和独立页面布局。
---

业务页面通常只需要组合已有的页面容器、标题和内容区；品牌、侧边栏和全局操作由应用外框管理。这些组件都是应用持有的源码，基础交互遵循 shadcn 规范，组件添加方式见 [UI 组件与交互](pages-and-interactions.md)。

下面以商品目录示例展示各用法。示例基于默认模板 `1.0.0-beta.85`，使用英文界面和固定商品数据，不读写商品接口。筛选与长标题开关保存在父页面内存中，离开列表或刷新后复原。源码和启动方式见[示例源码与运行](#示例源码与运行)。

## 选择布局的修改位置

| 要调整的内容 | 修改位置 |
| --- | --- |
| 某个业务页面中的筛选、表格、表单 | `client/pages/` 下的页面及局部组件 |
| 页面内边距、区块间距、标题与操作区 | `client/components/page-container.tsx`、`page-header.tsx` |
| 品牌、侧边栏底部、顶部全局操作 | `client/layouts/components/` |
| 侧边栏、顶部栏与内容区的整体关系 | `client/layouts/app-layout.tsx` |
| 子页面以内联、弹窗、抽屉或覆盖页呈现 | 父页面的 `Outlet` 与子页面使用的布局组件 |
| 登录页及其他独立页面的公共外框 | `client/routing/standalone-page-layout.tsx` |

新增菜单通过路由的 `navigation` 声明接入，菜单选择和可见性沿用已有路由与权限处理。注册方式见[页面、路由与导航](pages-routes-and-navigation.md)。

## 组合业务页面

### 页面容器、标题与操作区

一个普通页面使用一个 `PageContainer`，其中用 `PageHeader` 放主标题、说明和页面级操作。商品目录把这层组合提取为 `ProductPageFrame`，页面负责筛选状态与表格内容：

```tsx
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';

// ProductPageFrame 的外层结构；完整布局见下一节。
<PageContainer>
  <PageHeader title={title} description={description} actions={actions} />
  {children}
</PageContainer>
```

`PageContainer` 默认提供 `w-full space-y-6 p-6 md:p-8`，并接受普通 `section` 属性；`PageHeader` 的 `title`、`description`、`actions` 接收 React 节点，主标题渲染为 `h1`。使用 `ProductPageFrame` 的页面不再套一层页面容器。

登录示例后，从侧边栏打开 **Product catalog**。点击 **Long heading**，观察长标题换行和右侧操作区；窄屏时操作区排到标题下方。

![商品目录的页面标题、操作区与两栏内容](/assets/core/developing-apps/page-layouts/catalog.png)

[查看页面组合源码][catalog] · [查看布局组件][frame]

### 筛选与列表的响应式布局

把筛选组件与列表作为插槽传入布局，保留页面对数据和事件的控制：

```tsx
// ProductPageFrame 中，接在 PageHeader 后面。
<div className="grid min-w-0 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
  <aside aria-label={filterLabel} className="flex min-w-0 flex-col gap-4">
    {filters}
  </aside>
  <div className="min-w-0">{children}</div>
</div>
```

在 `lg` 断点及以上，左栏宽 `14rem`，右栏占剩余空间；窄屏时按筛选、列表的顺序上下排列。`minmax(0,1fr)` 和 `min-w-0` 允许内容列收缩，避免长表格把应用撑宽。`filterLabel` 使用翻译后的名称，让辅助技术能识别筛选区域。

在 **Search products** 输入 `lamp`，列表只保留灯具；输入不存在的名称，显示无匹配结果。缩窄窗口后，筛选区应在表格上方。

![窄屏时筛选区位于列表上方，表格在自身区域横向滚动](/assets/core/developing-apps/page-layouts/mobile.png)

[查看布局组件][frame]。页面专用的布局组件留在页面目录，多页实际共用时再移到 `client/components/`。

### 长内容与滚动区域

应用外框负责页面纵向滚动，表格负责自己的横向滚动。示例复用 `DataTable`，它内部的表格容器已有 `overflow-x-auto`：

```tsx
import { DataTable } from '#components/data-table';

// columns 和筛选状态在商品目录页面中定义。
<DataTable
  columns={columns}
  data={products.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase()),
  )}
  pagination={false}
  emptyMessage={t('layouts.empty')}
/>
```

示例一次显示 48 条记录，便于检查滚动。窄屏下在表格内左右滚动，应用外框不应出现横向滚动条；向下滚动列表时，顶部栏保留在原位。不必给筛选栏和列表再各加一个固定高度的纵向滚动区。

[查看列表源码][catalog]。主题颜色和间距约定见[主题与样式](themes-and-styles.md)。

## 调整应用外框

### 品牌、侧边栏与顶部操作

默认 `AppLayout` 组合侧边栏、顶部栏和内容区。局部改动优先修改对应组件：示例的 `AppBrand` 在展开状态显示 **Northstar Supply**，折叠状态保留图标；`HeaderActions` 增加 **Catalog guide** 入口，并保留主题与账号控件。

```tsx
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '#components/ui/button';

// HeaderActions 中，放在原有 ThemeSettings 和 UserMenu 之前。
<Button
  variant="ghost"
  size="icon"
  aria-label={t('layouts.guide')}
  title={t('layouts.guide')}
  render={<Link to="/catalog-guide" />}
>
  <BookOpen />
</Button>
```

示例沿用模板的 Base UI 组件组合方式 `render`。点击顶部书本图标可进入指南页。品牌与新入口的效果见[商品目录截图](#页面容器标题与操作区)。

[查看品牌源码][brand] · [查看顶部操作源码][header]

只有需要重新安排整体区域时才修改 `app-layout.tsx`。保留 `RouteTreeProvider`、`PageBreadcrumbProvider`、权限过滤、`useSyncServerLocale()` 以及账号菜单的会话处理，它们分别支撑路由返回、面包屑、菜单可见性、语言同步和退出登录。

### 侧边栏折叠与移动端导航

复用 `AppSidebarProvider`、`AppSidebar` 和 `AppSidebarToggle`，让宽屏折叠与移动端导航沿用模板的交互：

```tsx
// AppLayout 的结构节选；完整源码还包含路由上下文与顶部栏。
<AppSidebarProvider>
  <AppSidebar label={navigationLabel} footer={<AppSidebarFooter />}>
    <NavigationMenu
      items={menuItems}
      label={navigationLabel}
      selectedKey={selectedKey}
    />
  </AppSidebar>
  {/* 顶部栏和主内容列 */}
</AppSidebarProvider>
```

宽屏点击顶部的侧边栏按钮，菜单收起为图标；刷新后保留桌面折叠偏好。窄屏时同一入口打开导航面板，其开关状态独立于桌面折叠偏好。不要为页面再维护一份侧边栏状态。

![移动端通过顶部按钮打开应用导航](/assets/core/developing-apps/page-layouts/mobile-navigation.png)

[查看应用外框][shell] · [查看侧边栏组件][sidebar]

## 组织子页面

### 使用页签与内联子路由

内联子路由在父页面指定位置显示。商品详情的 **Overview** 和 **Handling notes** 共用标题、返回入口和页面容器，父页面在页签导航后渲染 `Outlet`：

```tsx
import { Outlet } from 'react-router';

// 详情页 PageContainer 内部，前面是 PageHeader 和页签导航。
<Outlet />
```

`overview.tsx` 渲染商品信息，`handling.tsx` 渲染商品信息及搬运说明；两者都不再创建 `PageContainer` 或主标题。打开列表中的 **Details**，默认进入 **Overview**；切换 **Handling notes** 后，地址和内容一起改变，直接打开该地址或刷新仍停留在此栏目。

![内联子路由复用详情页的标题、页签与页面容器](/assets/core/developing-apps/page-layouts/inline-tabs.png)

[查看详情页][detail] · [查看内联栏目][handling]。默认栏目跳转和子路由声明见[页面、路由与导航](pages-routes-and-navigation.md)。

### 使用弹窗、抽屉与覆盖式子页面

这些组件决定子页面的展示方式。子路由声明放在 `routes.ts`，父列表的 `Outlet` 放在页面容器之后，与其并列：

```tsx
<>
  <ProductPageFrame {...frameProps}>{/* 商品列表 */}</ProductPageFrame>
  <Outlet />
</>
```

这样 `RouteChildPage` 可以覆盖并禁用父页面内容的键盘交互，同时保留列表 DOM。不要把整个 `AppLayout` 或新的 `BrowserRouter` 放进子页面。

商品列表的 **Summary** 使用弹窗展示简短信息：

```tsx
import { RouteDialog } from '#components/route-dialog';

<RouteDialog
  title={t('layouts.summaryTitle')}
  description={t('layouts.readOnly')}
  className="sm:max-w-md"
  footer={<CloseProduct />}
>
  <ProductInfo />
</RouteDialog>
```

![简短商品信息在路由弹窗中显示](/assets/core/developing-apps/page-layouts/dialog.png)

点击商品名称则打开抽屉，放入更长的商品说明：

```tsx
import { RouteDrawer } from '#components/route-drawer';

<RouteDrawer
  title={t('layouts.drawerTitle')}
  description={t('layouts.readOnly')}
  footer={<CloseProduct />}
>
  <ProductInfo extended />
</RouteDrawer>
```

![抽屉保留标题和底部操作，长说明在内容区内滚动](/assets/core/developing-apps/page-layouts/drawer.png)

弹窗和抽屉自带内容内边距、滚动区与固定底部操作区，内部不再嵌套 `PageContainer`，`footer` 中直接传入按钮。关闭按钮组件在覆盖组件内部调用 `useRouteOverlay()`：

```tsx
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { useTranslation } from '@nocobase/i18n/client';

function CloseProduct() {
  const { close } = useRouteOverlay();
  const { t } = useTranslation();
  return <Button onClick={() => void close()}>{t('layouts.done')}</Button>;
}
```

**Details** 则使用 `RouteChildPage` 覆盖应用内容区，保留侧边栏和顶部栏可操作。它拥有自己的页面容器：

```tsx
import { RouteChildPage } from '#components/route-child-page';

<RouteChildPage>
  <PageContainer>
    <BackButton>{t('layouts.back')}</BackButton>
    <PageHeader title={product?.name ?? t('layouts.missing')} />
    {/* 页签导航与内联 Outlet */}
  </PageContainer>
</RouteChildPage>
```

![覆盖式子页面占据内容区，应用导航保持可用](/assets/core/developing-apps/page-layouts/child-page.png)

覆盖页不是模态弹窗，不以 Esc 关闭；示例使用 **Back to catalog** 返回。已有明确面包屑返回入口的页面可沿用面包屑，无需重复增加返回按钮。

[查看弹窗源码][dialog] · [查看抽屉源码][drawer] · [查看覆盖页源码][detail] · [查看路由声明][routes]

### 保留父页面状态与滚动位置

默认应用外框将定位与滚动分开：

```tsx
// AppLayout 的 main 内部结构节选。
<main className="app-brand-surface relative isolate min-w-0 flex-1 overflow-hidden">
  {/* 品牌水印 */}
  <div className="h-full overflow-y-auto">
    <Outlet />
  </div>
</main>
```

`main` 定义覆盖页的定位边界，内层 `div` 负责页面纵向滚动。`RouteChildPage` 的外层定位、内层滚动，覆盖区不会随父列表移动或被列表高度撑大。

在列表搜索 `lamp`，向下滚动后打开任意 **Summary** 或 **Details**，再关闭或返回。父页面仍挂载，因此筛选和滚动位置保留；弹窗与抽屉关闭后还会将焦点返回触发入口。整页刷新会重新创建内存状态，不提供跨刷新保留。需要把筛选存进地址或实现编辑保存时，参见[页面、路由与导航](pages-routes-and-navigation.md)和[数据请求与状态管理](data-requests-and-state.md)。

[查看应用外框][shell] · [查看父页面与子页面的组合][catalog]

## 登录页与独立页面布局

模板的 `AppRouter` 根据 `auth` 选择布局：`required` 页面经过登录与会话准备后使用 `AppLayout`；`guest` 和 `optional` 页面使用 `StandalonePageLayout`，保留各自的认证规则。

示例的 **Catalog guide** 是公开的静态说明页，声明为可选登录：

```tsx
{
  name: 'catalogGuide',
  path: '/catalog-guide',
  auth: 'optional',
  authz: 'skip',
  componentLoader: () => import('./guide.js'),
}
```

页面复用 `PageContainer`，通过 `className="mx-auto max-w-3xl pt-24"` 限制内容宽度并为顶部控件留出空间。无论是否登录，都能打开指南；点击 **Open product catalog** 时，未登录的访客会进入登录页。

![独立指南页复用页面容器，不显示应用侧边栏](/assets/core/developing-apps/page-layouts/standalone.png)

`auth` 表达访问条件，不能为了移除侧边栏而把受保护页面改为公开。需要为登录后的页面更换外框时，定制应用的路由组合，并保留认证、会话准备与页面授权；模板没有自动生效的任意 `layout` 字段。

[查看指南页][guide] · [查看布局选择][router] · [查看独立外框][standalone]

## 检查布局效果

在运行中的示例检查以下操作：

- 切换长标题，分别在宽屏和 375px 窄屏观察标题、操作区、筛选与表格；表格只在自身区域横向滚动。
- 折叠侧边栏并刷新；窄屏打开导航，确认菜单入口仍可使用。
- 从已筛选、已滚动的列表打开弹窗、抽屉和覆盖页，再返回，检查列表状态与键盘焦点。
- 在抽屉中滚动长说明，确认标题和 **Done** 始终可达；覆盖页滚动时应用导航保持可用。
- 直接打开子页面地址、刷新，以及使用浏览器前进后退，确认展示方式和返回路径正确。
- 输入无匹配商品的名称，或将详情地址中的商品 ID 改为 `missing`，确认状态说明清晰。
- 切换中英文、浅色与深色模式，检查文本换行、边框和控件可见性；退出登录后再次访问商品目录，应进入登录页。

## 示例源码与运行

[完整示例 App][app] 使用 Node.js 24 和 pnpm 11。商品是固定演示数据，模板的账号、会话和设置仍需数据库。以下为已验证的 SQLite 配置；使用其他数据库时按[创建应用](../getting-started/create-app.md)安装驱动并配置连接。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 929240c07561b2fa02afbe82a3a104a6f0a908b0
cd apps/page-layouts
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

打开启动日志中包含应用前缀的地址，通过登录页注册一个演示账号，登录后进入侧边栏的 **Product catalog**。默认前缀为 `/main/` 时，商品目录地址为 `/main/layouts`，独立指南为 `/main/catalog-guide`。商品示例对所有已登录用户开放，管理页面仍使用模板的真实权限控制。

按 [README][readme] 运行组件与浏览器检查，查看用法、源码及截图的对应关系。浏览器测试在本地示例数据库中创建独立测试账号；该示例不包含商品持久化、库存操作或业务角色授权流程。

[app]: https://github.com/nocobase/docs-examples-v3/tree/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts
[readme]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/README.MD
[catalog]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/index.tsx
[frame]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/product-page-frame.tsx
[brand]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/layouts/components/app-brand.tsx
[header]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/layouts/components/header-actions.tsx
[shell]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/layouts/app-layout.tsx
[sidebar]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/layouts/components/app-sidebar.tsx
[detail]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/detail.tsx
[handling]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/handling.tsx
[dialog]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/summary.tsx
[drawer]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/drawer.tsx
[routes]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/routes.ts
[guide]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/guide.tsx
[router]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/routing/app-router.tsx
[standalone]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/routing/standalone-page-layout.tsx
