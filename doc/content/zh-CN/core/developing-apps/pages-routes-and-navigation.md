---
title: 页面、路由与导航
description: 通过独立路由示例应用，学习页面注册、动态参数、抽屉与弹窗、页签、菜单、面包屑、访问权限和组件覆盖。
---

使用 `defineAppRoutes()` 声明页面地址、组件、菜单和访问权限。[示例 App][app] 的启动和账号准备见[运行环境与启动方式](#运行环境与启动方式)。

## 注册页面

### 声明路由与接入运行时

在 [client/pages/projects/routes.ts][routes] 中声明页面，再通过 [client/routes.ts][collection] 交给运行时。下面截取项目列表的声明，省略外层分组和子路由：

```ts
// client/pages/projects/routes.ts（节选：省略外层分组和子路由）
import { FolderKanban } from 'lucide-react';
import { defineAppRoutes } from '@nocobase/app-client/plugins';

export const projectRoutes = defineAppRoutes([
  {
    name: 'projects',
    path: '/projects',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },
    navigation: { title: 'demo.projects', icon: FolderKanban },
    componentLoader: () => import('./index.js'),
  },
]);
```

```ts
// client/routes.ts
import { projectRoutes, appendedRoutes } from './pages/projects/routes.js';
// 保留模板原有的 appRoutes 和 systemSettingsRoutes。
export default [appRoutes, appendedRoutes, projectRoutes, systemSettingsRoutes];
```

`defineAppRoutes()` 接收只读定义数组，返回被冻结的 `{ parent: 'app', routes: [...] }` 贡献对象，不会立即加载组件。运行时的 `routes` 接收单个贡献对象或一层贡献数组；模板已在 `client/runtime.ts` 导入它。只在未被导入的文件里调用该函数不会注册页面，也不要修改返回对象或把贡献数组再次传给 `defineAppRoutes()`。

在示例首页打开 **Project list**，可以看到已注册的页面和菜单入口。页面中的 `authz` 要求项目访问权限，示例管理员拥有这一权限。

![项目列表：静态页面、默认组件导出与菜单入口](/assets/core/developing-apps/pages-routes-and-navigation/projects.png)

[查看源码][routes]

### 加载页面组件

`componentLoader` 必须返回 `Promise<{ default: Component }>`。项目列表通过 `import('./index.js')` 加载 [index.tsx][list] 的默认导出。页面组件使用模板的 `PageContainer`、`PageHeader` 和 `DataTable`，这些是应用内可复用的 UI 组件。

同一个模块也可以提供命名导出。示例的独立项目页面使用 [workspace.tsx][workspace] 导出的 `ProjectPage`，加载时转换为要求的结构：

```ts
// client/pages/projects/routes.ts
componentLoader: () =>
  import('./workspace.js').then((module) => ({ default: module.ProjectPage })),
```

在项目详情中点击 **Open as a full page**，可以查看这个命名导出组件的效果，地址是 `/project-pages/p100`。

加载器不接收路由参数，也不是数据请求函数。参数在组件中读取，数据请求见[数据请求与状态管理](data-requests-and-state.md)；不要直接从加载器返回 JSX 元素。

![通过命名导出加载的独立项目页面](/assets/core/developing-apps/pages-routes-and-navigation/standalone.png)

[查看源码][workspace]

## 路径参数与页面跳转

### 静态路径与动态参数

路由中的 `path` 是应用内路径。默认部署前缀为 `/main`，因此 `/projects` 对应浏览器中的 `/main/projects`，声明中不填写 `/main`。

[示例路由][routes]同时使用静态路径和动态参数：

| 应用内地址 | 作用 |
| --- | --- |
| `/projects` | 项目列表 |
| `/projects/new` | 草稿表单，静态 `new` 优先于 `:projectId` |
| `/projects/:projectId` | 根据项目 ID 打开详情 |
| `/projects/:projectId/tasks/:taskId` | 同时定位项目和任务 |

[detail.tsx][detail]通过 React Router 的 [`useParams()`](https://reactrouter.com/api/hooks/useParams) 读取参数并查找演示记录：

```tsx
import { useParams } from 'react-router';
import { projects } from './data.js';

// ProjectDetail 组件内部
const { projectId } = useParams();
const project = projects.find((item) => item.id === projectId);
```

参数值是字符串，子页面也可以读取父级参数。打开 `/projects/p100` 会找到 Harbor launch；打开 `/projects/missing` 则显示记录不存在的提示。模板负责路由匹配，记录查找和缺失记录提示由页面实现。

![未知项目显示明确的缺失记录提示](/assets/core/developing-apps/pages-routes-and-navigation/missing.png)

[查看源码][detail]

### 查询参数与页面跳转

在 **Search projects** 输入 `Harbor`，地址变为 `/projects?q=Harbor`；点击 **Harbor launch** 打开 `/projects/p100?q=Harbor`。[index.tsx][list] 使用 React Router 的 [`useSearchParams()`](https://reactrouter.com/api/hooks/useSearchParams) 更新查询条件。下面省略组件中的表格配置和无关属性：

```tsx
// client/pages/projects/index.tsx
const location = useLocation();
const [search, setSearch] = useSearchParams();
const query = search.get('q') ?? '';

<Input
  value={query}
  onChange={(event) => {
    const next = new URLSearchParams(search);
    if (event.target.value) next.set('q', event.target.value);
    else next.delete('q');
    setSearch(next, { replace: true });
  }}
/>

// DataTable 的名称单元格中
<RecordLink to={{ pathname: row.original.id, search: location.search }}>
  {row.original.name}
</RecordLink>
```

`RecordLink` 封装 React Router 的 [`Link`](https://reactrouter.com/api/components/Link)。这里的相对路径 `p100` 追加到列表路径；查询参数需要显式传递，不会因父子路由自动保留。列表用 `q` 过滤演示记录；`setSearch(next, { replace: true })` 避免每次输入都增加一条浏览器历史。

![查询参数 q 控制列表搜索，详情链接保留当前条件](/assets/core/developing-apps/pages-routes-and-navigation/filtered.png)

[查看源码][list]

## 嵌套路由与页面呈现

### 独立页面与子路由

页面可以独立注册，也可以成为另一个页面的子路由。它们的区别在于是否经过父页面的内容出口：

| 写法 | 示例地址 | 内容位置 |
| --- | --- | --- |
| 与列表平级声明 | `/project-pages/p100` | 独立页面，不经过列表的 `Outlet` |
| 声明在列表的 `children` 中 | `/projects/p100` | 列表的 `Outlet` 中 |

独立页面在 [routes.ts][routes] 中与列表平级注册，复用 `ProjectPage` 组件：

```ts
// 与 projects 平级的路由
{
  name: 'projectStandalone',
  path: '/project-pages/:projectId',
  authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },
  breadcrumb: { title: 'demo.projectPage' },
  componentLoader: () =>
    import('./workspace.js').then((module) => ({ default: module.ProjectPage })),
}
```

![独立项目页面复用命名导出，不依赖列表出口](/assets/core/developing-apps/pages-routes-and-navigation/standalone.png)

在详情中点击 **Open as a full page**，可以打开这个独立页面。需要在列表中承载详情时，通过 `children` 声明父子关系：

```ts
// projects 页面的 children（节选）
children: [
  {
    name: 'projectDetail',
    path: ':projectId',
    componentLoader: () => import('./detail.js'),
    children: [
      {
        name: 'projectTask',
        path: 'tasks/:taskId',
        componentLoader: () => import('./task.js'),
      },
    ],
  },
],
```

父页面必须渲染 React Router 的 [`Outlet`](https://reactrouter.com/api/components/Outlet)。示例列表还通过 `context` 传递查询条件，详情用 `useOutletContext()` 读取：

```tsx
// client/pages/projects/index.tsx
const context = useMemo(() => ({ listSearch: location.search }), [location.search]);

<Outlet context={context} />
```

`children` 负责路由层级，`Outlet` 提供渲染位置；具体组件决定内容是直接嵌入、覆盖父区域，还是显示为抽屉、弹窗。仅声明子路由不会自动产生这些呈现方式。

[查看源码][routes]

### 内嵌子页面与默认页签

打开 **Project reports**，`/reports` 自动跳转到 `/reports/summary`，**Owners** 切换到 `/reports/owners`。[reports/index.tsx][reports] 只在地址恰好匹配父页面时重定向：

```tsx
// client/pages/reports/index.tsx（节选）
const location = useLocation();
const parent = useResolvedPath('.');
if (matchPath({ path: parent.pathname, end: true }, location.pathname)) {
  return <Navigate replace to={{ pathname: 'summary', search: location.search }} />;
}

// 下面位于组件返回的导航和内容区域。
<NavLink to={{ pathname: 'owners', search: location.search }}>
  {t('demo.owners')}
</NavLink>
<Outlet />
```

`Navigate replace` 不额外保留一次父页面历史；`end: true` 避免直接打开 Owners 时又被跳回 Summary。页签由 `NavLink` 提供当前项状态，`Outlet` 显示选中的内容。两个子页面继承报表页面的权限。

![父地址默认进入 Summary 页签](/assets/core/developing-apps/pages-routes-and-navigation/summary.png)
![直接访问 Owners 保留该页签，父页面导航仍然显示](/assets/core/developing-apps/pages-routes-and-navigation/owners.png)

[查看源码][reports]

### 覆盖父内容的子页面

在项目抽屉点击 **Open workspace**，进入 `/projects/workspace/p100?q=Harbor`。[workspace.tsx][workspace] 用模板的 `RouteChildPage` 覆盖父页面的内容区域，外层应用导航保持可用：

```tsx
// projects 页面的另一个子路由
{
  name: 'projectWorkspace',
  path: 'workspace/:projectId',
  breadcrumb: { title: 'demo.workspace' },
  componentLoader: () => import('./workspace.js'),
}

// client/pages/projects/workspace.tsx
export default function ProjectWorkspace() {
  return <RouteChildPage><ProjectPage /></RouteChildPage>;
}
```

这个工作区仍通过列表的 `Outlet` 渲染。标题和面包屑中的项目名称来自记录，面包屑配置见[静态与动态面包屑](#静态与动态面包屑)。

![RouteChildPage 覆盖列表内容，保留应用导航](/assets/core/developing-apps/pages-routes-and-navigation/workspace.png)

[查看源码][workspace]

### 路由抽屉与嵌套弹窗

[detail.tsx][detail]使用模板的 `RouteDrawer` 显示项目详情。下面省略记录查找、缺失记录处理和其他按钮：

```tsx
// client/pages/projects/detail.tsx（节选）
const { projectId } = useParams();
const { listSearch } = useOutletContext<{ listSearch: string }>();

<RouteDrawer title={project.name} footer={<CloseButton />}>
  <RecordLink to={{ pathname: `tasks/${task.id}`, search: listSearch }}>
    {task.name}
  </RecordLink>
  <Outlet />
</RouteDrawer>
```

从筛选后的列表点击项目，会在列表上打开抽屉。直接访问或刷新 `/projects/p100?q=Harbor` 也能恢复这个页面状态。

![项目详情抽屉保留后方的筛选列表](/assets/core/developing-apps/pages-routes-and-navigation/drawer.png)

点击抽屉中的 **Prepare launch checklist**，进入 `/projects/p100/tasks/t200?q=Harbor`。[task.tsx][task] 同时读取父级和自身的参数，再用 `RouteDialog` 显示任务：

```tsx
// client/pages/projects/task.tsx（节选）
const { projectId, taskId } = useParams();

<RouteDialog title={task.name} footer={<CloseTask />}>
  <p>{t('demo.taskPath', { projectId, taskId })}</p>
</RouteDialog>
```

详情抽屉里的第二个 `Outlet` 用来渲染任务弹窗，不能省略。点击 **Back to project** 仅关闭最内层弹窗，仍停留在项目抽屉；再次关闭抽屉才回到列表。

![任务弹窗叠加在项目抽屉上，两个路径参数同时生效](/assets/core/developing-apps/pages-routes-and-navigation/task.png)

[查看详情源码][detail] · [查看任务源码][task]

## 返回与离开确认

### 返回父页面并保留查询条件

以草稿弹窗为例：从 `/projects?q=Harbor` 点击 **New draft**，进入 `/projects/new?q=Harbor`。输入名称并点击 **Preview draft** 后看到预览；点击 **Finish preview** 返回 `/projects?q=Harbor`，搜索条件保持不变。这些操作不会创建项目。

![静态 new 子路由打开草稿表单](/assets/core/developing-apps/pages-routes-and-navigation/draft.png)
![草稿预览及完成后关闭的操作](/assets/core/developing-apps/pages-routes-and-navigation/draft-preview.png)

[完整表单][draft]通过 `useRouteOverlay()` 获得 `close()`，由弹窗内部的按钮调用：

```tsx
// 在 RouteDialog 内部渲染的按钮组件中调用。
const { close } = useRouteOverlay();

<Button onClick={() => {
  onFinish(); // 本例清除草稿的 dirty 标记。
  void close();
}}>
  {t('demo.finishPreview')}
</Button>
```

`close()` 按匹配的父路由返回，并保留查询条件，比对 URL 字符串截取最后一段可靠。模板的右上角关闭、Escape 和遮罩关闭也通过同一关闭流程。普通页面的程序化导航见 React Router 的 [`useNavigate()`](https://reactrouter.com/api/hooks/useNavigate)。

[查看源码][draft]

### 未保存时确认离开

输入草稿后点击关闭，应用显示 **Discard this unsaved draft?**。选择 **Keep editing** 保留输入；选择 **Discard draft** 关闭并返回列表。

```tsx
// client/pages/projects/new.tsx（节选）
const dirtyRef = useRef(false);
const pendingDecisionRef = useRef<((allowed: boolean) => void) | null>(null);
const [confirmOpen, setConfirmOpen] = useState(false);

const canLeave = useCallback((): boolean | Promise<boolean> => {
  if (!dirtyRef.current) return true;
  return new Promise<boolean>((resolve) => {
    pendingDecisionRef.current = resolve;
    setConfirmOpen(true);
  });
}, []);

useNavigationGuard(canLeave);
// RouteDialog 的 beforeClose 也使用 canLeave。
// AlertDialog 的按钮调用 decide(false) 或 decide(true)。
const decide = (allowed: boolean) => {
  setConfirmOpen(false);
  if (allowed) dirtyRef.current = false;
  pendingDecisionRef.current?.(allowed);
  pendingDecisionRef.current = null;
};
```

本例把同一个异步判断传给 `RouteDialog.beforeClose` 和 `useNavigationGuard()`，分别覆盖浮层关闭与应用内导航、浏览器前后退。默认模板在路由外层配置了 `NavigationGuardProvider`。返回 `false` 拒绝离开，返回 `true` 允许；Promise 等待用户选择。允许后先清除 dirty 状态，避免关闭触发跳转时再次确认。

完整实现还在 `beforeunload` 中处理刷新和离开站点，由浏览器显示原生提示；应用不能控制那段提示文字。这个能力应与导航守卫分开处理。

![异步导航守卫等待用户选择保留或丢弃草稿](/assets/core/developing-apps/pages-routes-and-navigation/guard.png)

[查看源码][draft]

## 导航菜单与面包屑

### 菜单配置、分组与选中状态

菜单来自路由的 `navigation` 配置。项目列表由不带 `path` 的 **Projects** 分组归类；省略其中的完整页面声明后，分组形如：

```ts
{
  name: 'business',
  navigation: { title: 'demo.business', order: 10 },
  children: [
    // 这里放置 projects 页面声明。
  ],
}
```

报表使用带 `/reports` 前缀的 **Insights** 分组。分组没有组件，通过 `children` 组织页面，不需要自己放置 `Outlet`：

```ts
{
  name: 'reportsGroup',
  path: '/reports',
  navigation: { title: 'demo.insights', order: 20 },
  children: [
    {
      name: 'reports',
      path: '/',
      authz: 'skip',
      navigation: { title: 'demo.reports', icon: ChartColumn },
      componentLoader: () => import('../reports/index.js'),
      children: [
        { name: 'reportSummary', path: 'summary',
          componentLoader: () => import('../reports/summary.js') },
        { name: 'reportOwners', path: 'owners',
          componentLoader: () => import('../reports/owners.js') },
      ],
    },
  ],
}
```

子页面的 `path: '/'` 落在分组地址 `/reports`，适合给分组增加一个入口页。分组本身不占页面地址。菜单只来自 `navigation`：详情和任务不配置菜单，仍能从记录链接打开。

`title` 是标题或翻译 key；`icon` 传入 Lucide 等 React 图标组件，不能传字符串或 JSX；`order` 是有限数值，默认 `0`，同级从小到大排序。分组标题不显示图标。打开嵌套任务时，侧边栏仍选中 Project list；不可访问的页面及空分组按权限隐藏。

![无路径分组与带前缀分组，以及追加到 Insights 下的页面](/assets/core/developing-apps/pages-routes-and-navigation/navigation.png)

[查看源码][routes]

### 静态与动态面包屑

`breadcrumb` 和 `usePageBreadcrumb()` 是路由声明与应用模板配合提供的面包屑能力。

路由的 `breadcrumb: { title: 'demo.workspace' }` 提供静态标题，项目加载后通过 `usePageBreadcrumb()` 替换为真实项目名：

```tsx
// client/pages/projects/workspace.tsx（节选）
usePageBreadcrumb(
  project
    ? [
        {
          label: t('demo.projects'),
          to: { pathname: '/projects', search: location.search },
        },
        { label: project.name },
      ]
    : undefined,
);
```

`label` 是文字，`to` 是可选跳转目标，最后一项不生成链接。传 `undefined` 或 `null` 使用默认路由面包屑；多层组件都声明时，内层优先，卸载后恢复外层。

截图中，**Project list → Harbor launch** 是动态面包屑。点击 **Project list** 返回带 `q=Harbor` 的列表。模板会记住当前层级中访问过的祖先查询条件，但深链接或刷新不一定有这条记录；需要可靠返回列表条件时，应像本例一样显式指定 `to`。

![覆盖式子页面及带项目名称、查询条件的动态面包屑](/assets/core/developing-apps/pages-routes-and-navigation/workspace.png)

[查看源码][workspace]

## 登录与页面权限

### 登录要求与页面布局

[路由定义][routes]分别演示三种 `auth`，它们位于独立路由树中：

```ts
// 三条独立路由，不互为父子。
{ name: 'projects', path: '/projects', auth: 'required', /* ... */ }
{ name: 'welcome', path: '/welcome', auth: 'guest', authz: 'skip', /* ... */ }
{ name: 'publicProjects', path: '/public-projects', auth: 'optional', authz: 'skip', /* ... */ }
```

| 用法 | 操作 | 默认模板中的结果 |
| --- | --- | --- |
| `required` | 在未登录窗口打开 `/projects` | 转到 `/login`；登录后使用含侧边栏的应用布局 |
| `guest` | 在未登录窗口打开 `/welcome` | 显示访客欢迎页；已登录访问者被引导离开 |
| `optional` | 在登录或未登录窗口打开 `/public-projects` | 两种身份均可打开，使用独立布局 |

![required 路由将未登录访问者带到登录页](/assets/core/developing-apps/pages-routes-and-navigation/login.png)
![guest 路由在未登录时显示欢迎页](/assets/core/developing-apps/pages-routes-and-navigation/guest.png)
![optional 路由可在未登录时访问，使用独立布局](/assets/core/developing-apps/pages-routes-and-navigation/public.png)

最外层省略 `auth` 时默认 `required`，子层继承且不能改变为另一种值。`auth` 只处理登录要求，不授予页面权限。

当前模板的登录拦截跳转到 `/login`，不自动携带原地址。访客页在已登录时使用安全的站内 `redirect` 查询目标，否则回首页；例如已登录打开 `/welcome?redirect=%2Freports%2Fowners` 会前往 Owners。不要据此假定任意深链接登录后都自动返回原页。

[查看源码][routes]

### 权限声明、继承与拒绝访问

示例使用以下权限配置，完整声明在 [routes.ts][routes]：

```ts
// 项目列表及未另行声明权限的子页面
 authz: { resource: { type: 'page', id: 'projects' }, action: 'access' }
// 新建草稿还需要另一个页面权限
 authz: { resource: { type: 'page', id: 'project-drafts' }, action: 'access' }
// 报表页面跳过自身页面授权检查，但仍需要登录
 authz: 'skip'
// 管理员说明页只允许具有无限制权限的身份
 authz: 'unrestricted'
```

在 **System settings → Permission management → Roles and permissions** 新建 `Project viewer` 角色，只授予项目列表的页面访问权限；在 **Users** 中创建演示用户并分配该角色。使用另一个浏览器会话登录它，按 [README][readme] 复现下列结果：

- 可以打开项目列表、详情、任务和工作区。未声明 `authz` 的子页面继承最近祖先页面的有效值。
- 看不到 **New draft** 按钮，直接访问 `/projects/new` 显示拒绝访问；子页面自己的权限不会代替父页面检查。
- 可以打开报表，因为它使用 `skip`，但仍需满足 `auth: 'required'`。
- 看不到管理员菜单，直接访问 `/admin-notes/child` 仍被拒绝。虽然子页面写了 `skip`，父页面的 `unrestricted` 检查不会被绕过。

![只具有项目访问权限的用户：列表可用，新建和管理员入口隐藏](/assets/core/developing-apps/pages-routes-and-navigation/viewer.png)
![已有项目访问权限仍不足以打开新建草稿](/assets/core/developing-apps/pages-routes-and-navigation/draft-denied.png)
![子页面的 skip 不能绕过父页面的 unrestricted 检查](/assets/core/developing-apps/pages-routes-and-navigation/admin-denied.png)

使用管理员账号打开 **Administrator notes → Open child page** 可以看到父子页面。`unrestricted` 表示只允许具有无限制权限的身份，并非所有已登录用户。

![具有无限制权限的账号可以进入管理员父子页面](/assets/core/developing-apps/pages-routes-and-navigation/admin.png)

没有祖先页面可继承且省略 `authz` 时，`required` 页面默认 `unrestricted`，`guest` 和 `optional` 默认 `skip`。因此，每棵页面树的首个页面应显式声明权限。纯分组不能声明 `authz`。

`resource.type`、`resource.id`、`action` 必须是非空字符串。路由名与权限 ID 是不同概念；角色授权保存的是资源 ID。无菜单或面包屑标题的页面，要在 [page-permission-titles.ts][permission-titles] 提供可读名称，例如 `projectCreate: 'demo.newDraft'`。`useCan()` 可以控制同一权限下的按钮，但前端页面权限不能保护接口或打包进前端的数据。本例的项目是公开假数据；业务资源、服务端授权与数据范围见[认证、权限与数据范围](authentication-and-permissions.md)。

[查看源码][routes]

## 路由拆分、挂载与覆盖

### 同包与跨包挂载

在 **Insights** 打开 **Export instructions**，地址是 `/reports/exports`。它由另一个贡献对象通过 `parent: 'reportsGroup'` 挂载：

```ts
export const appendedRoutes = defineAppRoutes([
  {
    parent: 'reportsGroup',
    name: 'reportExports',
    path: 'exports',
    authz: 'skip',
    navigation: { title: 'demo.exports', order: 10 },
    componentLoader: () => import('../examples/exports.js'),
  },
]);
```

[client/routes.ts][collection] 故意先收集 `appendedRoutes`、后收集 `projectRoutes`，演示目标分组可以后声明。真实项目可以将这些声明放在不同文件，再汇总为一层数组。

![同包贡献追加的页面出现在 Insights 分组中](/assets/core/developing-apps/pages-routes-and-navigation/exports.png)

[reporting-plugin.ts][plugin] 是保存在应用中的客户端贡献工厂，用 `@example/project-reporting` 演示插件命名空间，不是需要另行安装的 npm 包。跨包挂载使用 `包名:分组名`：

```ts
// client/reporting-plugin.ts
{
  parent: 'pages-routes-navigation:reportsGroup',
  name: 'snapshot',
  path: 'snapshot',
  authz: 'skip',
  navigation: { title: 'demo.snapshot', order: 20 },
  componentLoader: () => import('./pages/examples/plugin-original.js'),
}
```

这个条目挂载到应用的 `reportsGroup` 后，地址为 `/reports/snapshot`，路由和翻译命名空间仍属于插件。示例为该命名空间注册了两种语言资源。默认配置启用了[组件覆盖](#替换页面组件)；临时将 `client/route-overrides.ts` 中的覆盖数组改为 `[]`，即可看到图中的原始页面，查看后恢复。

![插件提供的原始报表快照页面；截图时暂时清空组件覆盖配置](/assets/core/developing-apps/pages-routes-and-navigation/plugin-original.png)

`parent` 只能出现在贡献的根条目，目标必须是分组，不能是页面。目标不存在、循环引用，或把它写进已有 `children` 都会报错。页面子路由应使用 `children`。同级按 `navigation.order` 排序，同值时保留原子项，再按贡献顺序追加。

[查看应用路由源码][routes] · [查看插件贡献源码][plugin]

### 按插件选项启用路由

插件的 `routes` 可以是接收注册选项的同步函数。[reporting-plugin.ts][plugin] 根据 `enabled` 决定是否贡献页面：

```ts
// client/reporting-plugin.ts（节选）
export default defineClientPlugin<{ enabled?: boolean }>({
  packageName: '@example/project-reporting',
  // 完整文件同时注册 en-US 和 zh-CN 的语言资源。
  routes: (options) => defineAppRoutes(options.enabled === false ? [] : [
    {
      parent: 'pages-routes-navigation:reportsGroup',
      name: 'snapshot',
      path: 'snapshot',
      authz: 'skip',
      navigation: { title: 'demo.snapshot', order: 20 },
      componentLoader: () => import('./pages/examples/plugin-original.js'),
    },
  ]),
});

// client/plugins.ts 的 defineClientPlugins 数组中
reportingPlugin({ enabled: true }),
```

`routes(options)` 是注册阶段同步函数，可返回一个贡献或一层贡献数组；它不会随着 React 状态或登录用户变化重新生成。禁用时返回空定义。体验关闭状态时，将 `enabled` 改为 `false`，同时将[组件覆盖](#替换页面组件)中的覆盖数组改为 `[]`，避免覆盖不存在的路由；验证后恢复两处配置。隔离测试也覆盖这个开关。

![禁用报表贡献后，Insights 中不再显示 Reporting snapshot](/assets/core/developing-apps/pages-routes-and-navigation/plugin-disabled.png)

[查看源码][plugin]

### 替换页面组件

默认启动的示例展示应用自定义的 **Reporting snapshot**。路由 ID 为 `包名:路由名`，用它替换组件：

```ts
// client/route-overrides.ts
import { defineClientRouteComponentOverrides } from '@nocobase/app-client/plugins';

export default defineClientRouteComponentOverrides([
  {
    routeId: '@example/project-reporting:snapshot',
    componentEntry: './client/pages/examples/plugin-custom',
    componentLoader: () => import('./pages/examples/plugin-custom.js'),
  },
]);

// client/runtime.ts（节选）
import routeComponentOverrides from './route-overrides.js';
const appRuntime = defineAppRuntime({
  // 保留 createAppConfig、locales、routes、plugins 等现有配置。
  routeComponentOverrides,
});
```

`route-overrides.ts` 不会被自动发现，必须显式传给 `defineAppRuntime()`。覆盖保留原来的路径、权限、菜单、所属包及子路由；组件仍在原包的翻译命名空间下运行。`componentEntry` 记录组件源码入口，`componentLoader` 实际加载组件。

![应用覆盖后的报表快照：菜单和地址不变，正文来自自定义组件](/assets/core/developing-apps/pages-routes-and-navigation/plugin-custom.png)

暂时将覆盖数组改为 `[]` 可查看原组件，恢复后再次看到自定义内容。目标必须是已注册页面，不能是分组，也不能重复覆盖同一 ID。不要重新注册相同路径来替换组件。

[查看覆盖声明源码][overrides] · [查看运行时接入源码][runtime]

## 加载状态与异常处理

### 页面加载与加载失败

首页的 **Try a slow page** 打开 `/route-status/loading`。这个 [演示加载器][routes] 延迟 1.2 秒，让默认模板的页面加载状态可见：

```ts
{
  name: 'slowPage',
  path: '/route-status/loading',
  authz: 'skip',
  componentLoader: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return import('../examples/loaded.js');
  },
}
```

![组件加载期间显示模板的加载状态](/assets/core/developing-apps/pages-routes-and-navigation/loading.png)
![组件加载成功后显示页面内容](/assets/core/developing-apps/pages-routes-and-navigation/loaded.png)

**Try a page error** 打开 `/route-status/error`，对应组件故意抛出异常，触发 [ClientRoute][client-route] 的错误界面。生产页面不应保留这种演示异常；修复组件或网络问题后重新加载。加载器的 Promise 拒绝也会进入同一错误界面。

![页面组件抛出异常时，模板显示错误和重载入口](/assets/core/developing-apps/pages-routes-and-navigation/error.png)

[查看加载器源码][routes] · [查看模板错误处理源码][client-route]

### 未匹配地址的处理

**Try an unknown address** 打开未注册的 `/unknown-example`，当前模板的 [app-router.tsx][app-router] 会重定向到首页。这是应用模板的兜底行为，不能在 `defineAppRoutes()` 中增加 `path: '*'`。

![未知地址被模板重定向到示例首页](/assets/core/developing-apps/pages-routes-and-navigation/unknown.png)

[查看源码][app-router]

## 路由配置参考

### 配置字段与默认值

| 字段 | 页面 | 纯分组 |
| --- | --- | --- |
| `name` | 必填，同包内唯一 | 必填，同包内唯一 |
| `path` | 必填 | 可选，作为子路由前缀 |
| `componentLoader` | 必填 | 不可设置 |
| `children` | 可选 | 必填，可以是空数组 |
| `navigation` | 可选，`{ title, icon?, order? }` | 必填 |
| `breadcrumb` | 可选，`{ title }` | 可选 |
| `auth` | 可选，顶层默认 `required`，子层继承 | 可选，传给子层 |
| `authz` | 可选，建议首个页面明确声明 | 不可设置 |
| `parent` | 可选，仅贡献根条目 | 可选，仅贡献根条目 |

`name` 以字母或数字开头，其余可含字母、数字、点、下划线和连字符。标题为字符串，图标为组件，不支持按用户执行配置回调。底层 React Router 的 `index`、`element`、`loader`、`action`、`errorElement` 等不是这个声明 API 的字段。

[查看源码][routes]

### 路径规则与冲突检查

- 顶层页面路径以 `/` 开头；子路径追加到父层，`new` 和 `/new` 都会追加，后者不代表跳到根。连续斜杠和末尾斜杠会规范化。
- 不在 `path` 中写查询串或 hash，也不支持 `*`、可选参数 `?`、反斜杠以及 `.`、`..` 路径段。
- 页面地址在整个应用和所有插件之间唯一，冲突检查忽略静态段大小写和参数名：`/Projects` 与 `/projects` 冲突，`/:id` 与 `/:projectId` 冲突；`new` 与 `:projectId` 可以共存。
- 同包内的路由名称跨文件、分组和层级仍须唯一。不同包可同名，但页面地址不能相同。
- `/` 页面只能由应用提供；`/login`、`/register`、`/forgot-password`、`/reset-password` 必须使用 `auth: 'guest'`。

这些无效配置没有注册到演示 App 的正常启动路径，[routing-contract.test.ts][contract-tests] 用隔离测试复现拒绝条件。

## 示例源码与运行

### 运行环境与启动方式

[示例 App 源码][app]使用默认模板 `1.0.0-beta.85`，锁定 `@nocobase/app-client` `4.0.0-beta.5`。需要 Node.js 24 和 pnpm 11.7.0。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 58ae0befa2272cbc1f4c946db699bd3b93661486
cd apps/pages-routes-navigation
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

SQLite 是本例的演示和验证选择，不需要额外数据库服务，并非路由功能的限制。通过其他设备访问时，按[示例 README][readme]设置监听地址及 `app.publicOrigin`，使用实际可访问的地址打开 `/main/`。登录账号来自本地 `config.yml` 的 `users.initialAdmin`。

首页提供各个 Demo 的入口。项目和任务是公开的虚构数据；“新建草稿”只演示路由与表单状态，不保存业务记录。用户、角色和登录使用应用真实的 SQLite 数据库。

![示例首页提供各个路由 Demo 的入口](/assets/core/developing-apps/pages-routes-and-navigation/home.png)

### 示例验证

在示例目录运行：

```bash
pnpm typecheck
pnpm exec vitest run tests/client/client-routes.test.ts tests/client/routing-contract.test.ts tests/client/routing-behavior.test.tsx tests/client/app-locale-coverage.test.ts tests/client/page-permission-titles.test.ts
pnpm build
```

客户端交互测试使用受控的授权响应，检查嵌套关闭、查询保留、默认页签、权限拒绝和草稿确认；它们不代替真实账号验证。真实浏览器的操作、截图复现命令和验证环境记录在 [README][readme] 中。

[app]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation
[readme]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/README.MD
[routes]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/projects/routes.ts
[collection]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/routes.ts
[list]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/projects/index.tsx
[detail]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/projects/detail.tsx
[task]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/projects/task.tsx
[workspace]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/projects/workspace.tsx
[draft]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/projects/new.tsx
[reports]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/reports/index.tsx
[permission-titles]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/pages/settings/page-permission-titles.ts
[plugin]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/reporting-plugin.ts
[client-route]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/routing/client-route.tsx
[app-router]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/routing/app-router.tsx
[contract-tests]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/tests/client/routing-contract.test.ts
[overrides]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/route-overrides.ts
[runtime]: https://github.com/nocobase/docs-examples-v3/tree/58ae0befa2272cbc1f4c946db699bd3b93661486/apps/pages-routes-navigation/client/runtime.ts
