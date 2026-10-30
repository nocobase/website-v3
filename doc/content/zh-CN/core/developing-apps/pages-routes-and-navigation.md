---
title: 页面、路由与导航
description: defineAppRoutes 的完整用法：页面加载、路径参数、嵌套路由、导航分组、面包屑、访问权限、跨模块挂载与配置限制。
---

在 `client/routes.ts` 中使用 `defineAppRoutes()`，可以为应用声明页面地址、加载组件、配置菜单，并设置登录要求和访问权限。应用和插件使用同一套路由声明。

## 基本用法

### 注册一个页面

下面为应用增加一个 `/projects` 页面，允许已登录用户访问：

```ts
// client/routes.ts
import { FolderKanban } from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const projectRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'projects',
    path: '/projects',
    auth: 'required',
    authz: 'skip',
    navigation: {
      title: 'projects.title',
      icon: FolderKanban,
      order: 20,
    },
    componentLoader: () => import('./pages/projects/index.js'),
  },
]);

export default [projectRoutes];
```

在已有应用中，把 `projectRoutes` 加入原有导出数组，保留其他路由。默认模板的 `client/runtime.ts` 已导入该文件，并将它传给 `defineAppRuntime()` 的 `routes`；只在未被导入的文件中调用 `defineAppRoutes()`，不会注册页面。

页面模块需要默认导出 React 组件：

```tsx
// client/pages/projects/index.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';

export default function ProjectsPage() {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader title={t('projects.title')} />
    </PageContainer>
  );
}
```

向现有 `client/locales/zh-CN.ts` 和 `en-US.ts` 合并 `projects.title`，分别填写“项目”和“Projects”，具体见[多语言](localization.md)。模板中的 import 使用 `.js` 后缀，对应源码文件可以是 `.tsx`。

如果应用入口是 `/main/`，实际地址为 `/main/projects`。路由中的 `path` 仍写 `/projects`。这里的 `authz: 'skip'` 表示不增加页面授权检查，仍需要登录；需要按角色开放页面时，使用[访问控制](#登录与访问权限)中的声明。

### 参数与返回值

`defineAppRoutes()` 接收一个只读路由定义数组，返回一个路由贡献对象，其结构为：

```ts
{
  parent: 'app',
  routes: [/* 页面或分组定义 */],
}
```

这个对象的类型是 `AppClientAppRoutesContribution`，也可使用别名 `AppClientRouteContribution`。它是供运行时收集的声明，不是 React 组件，也不会立即执行 `componentLoader`。返回的声明被冻结，应先组装好数组再调用，不要事后 `push()` 或修改路由条目。

返回对象的 `parent: 'app'` 表示向应用贡献路由，与单个路由条目中用于挂载分组的 [`parent`](#挂载到其他文件或插件的分组) 是两个层次。

## 页面路径与组件加载

### 静态路径与动态参数

| 路径 | 用途 | 示例地址 |
| --- | --- | --- |
| `/projects` | 固定页面 | `/projects` |
| `/projects/:projectId` | 根据参数打开记录 | `/projects/p100` |
| `/projects/:projectId/tasks/:taskId` | 多个路径参数 | `/projects/p100/tasks/t200` |

动态页面通常不配置 `navigation`，因为菜单无法为 `:projectId` 提供具体值。可以单独注册详情页，也可以将它声明为列表的子路由：前者切换整页，后者在父页面的 `Outlet` 中显示。

组件通过 React Router 的 [`useParams()`](https://reactrouter.com/api/hooks/useParams) 读取参数；参数值是字符串，子页面也可以读取父路由的参数：

```tsx
import { useParams } from 'react-router';

export default function ProjectDetailPage() {
  const { projectId } = useParams<'projectId'>();
  // 使用 projectId 请求对应项目的数据。
  return <div>{projectId}</div>;
}
```

### 路径规则

- 最外层的 `path` 以 `/` 开头。部署基础路径由应用处理，不写入路由声明。
- 子路由的路径会追加到父路径。推荐写 `new`；写成 `/new` 也会追加，不会跳到应用根目录。
- 路径中的连续 `/` 和末尾 `/` 会被规范化。
- 查询参数和 hash 不属于路由定义。不要写 `/projects?q=abc` 或 `/projects#summary`；在导航时传入，并用 `useSearchParams()`、`useLocation()` 读取。
- 不支持 `*` 通配符、带 `?` 的可选参数、反斜杠，以及 `.`、`..` 路径段。

例如，父路由为 `/projects` 时：

| 子路由的 `path` | 最终应用内路径 |
| --- | --- |
| `new` 或 `/new` | `/projects/new` |
| `:projectId` | `/projects/:projectId` |
| `/projects/new` | `/projects/projects/new`，通常是重复填写了父路径 |

### `componentLoader` 的两种写法

推荐动态导入默认导出的页面组件，让页面按需加载：

```ts
componentLoader: () => import('./pages/projects/index.js'),
```

如果模块只有命名导出，可以转换为要求的 `{ default: Component }` 结构：

```ts
componentLoader: () =>
  import('./pages/projects/index.js').then((module) => ({
    default: module.ProjectsPage,
  })),
```

`componentLoader` 不接收路由参数，必须返回包含默认组件的 Promise。不要返回 JSX 元素，也不要把数据请求函数当作页面加载器。页面参数和数据请求放在组件内处理，见[数据请求与状态管理](data-requests-and-state.md)。

## 嵌套页面与跳转

### 使用 `children` 声明父子关系

以下条目可替换前面的 `projects` 路由，增加新建和详情页面：

```ts
{
  name: 'projects',
  path: '/projects',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },
  navigation: { title: 'projects.title', icon: FolderKanban },
  componentLoader: () => import('./pages/projects/index.js'),
  children: [
    {
      name: 'projectCreate',
      path: 'new',
      authz: {
        resource: { type: 'composite', id: 'projects' },
        action: 'create',
      },
      componentLoader: () => import('./pages/projects/new.js'),
    },
    {
      name: 'projectDetail',
      path: ':projectId',
      breadcrumb: { title: 'projects.detail' },
      componentLoader: () => import('./pages/projects/detail.js'),
    },
  ],
}
```

两个子页面分别对应 `/projects/new` 和 `/projects/:projectId`。静态的 `new` 路径优先于动态参数匹配。子路由还可以继续声明 `children`，例如 `/projects/:projectId/edit`；同一组件也可被多个不同名称和路径的路由加载。

父页面必须放置 `Outlet`，否则子页面没有渲染位置：

```tsx
import { Outlet } from 'react-router';

// 放在项目列表组件的返回内容中。
<PageContainer>
  <PageHeader title={t('projects.title')} />
  {/* 项目列表 */}
  <Outlet />
</PageContainer>
```

需要向子页面传递已加载的数据或刷新方法时，使用 `<Outlet context={{ reload }} />`，子组件通过 `useOutletContext()` 读取。普通导航分组由模板自动渲染 `Outlet`，有页面组件的父路由则需要自行放置。

### 子页面如何显示

`children` 决定地址和层级，子组件决定展示形式：

| 子组件返回的内容 | 适用场景 |
| --- | --- |
| 普通内容 | 页签或页面内的分区，直接显示在 `Outlet` 位置 |
| `RouteDialog` | 新建、编辑等简短表单，以弹窗覆盖父页面 |
| `RouteDrawer` | 记录详情或侧边编辑，以抽屉覆盖父页面 |
| `RouteChildPage` | 长表单或复杂子页面，覆盖内容区并保留应用导航 |

这些是默认模板提供的组件，不是 `defineAppRoutes` 的字段。弹窗和抽屉直接使用自身容器；内联页签复用父页面容器；覆盖式子页面在 `RouteChildPage` 内使用自己的 `PageContainer`。详细排版见[页面布局](page-layouts.md)。

### 链接与程序化跳转

在父页面中，使用 `Link` 或 `NavLink` 打开子页面；点击菜单项等需要执行逻辑的操作可以调用 `useNavigate()`。携带当前查询参数，可保留列表的搜索条件和页码：

```tsx
import { Link, useLocation, useNavigate } from 'react-router';

const location = useLocation();
const navigate = useNavigate();

<Link to={{ pathname: 'new', search: location.search }}>
  {t('projects.new')}
</Link>;

// 在子页面中关闭或保存成功后，返回父路由。
await navigate(
  { pathname: '..', search: location.search },
  { relative: 'route', replace: true },
);
```

上面两段分别放在父页面和子页面中。相对链接默认相对于**渲染该链接的路由**解析，而不是只根据地址栏最后一段计算。例如在 `/projects/p100/tasks`，详情页父组件中的 `edit` 指向 `/projects/p100/edit`，`tasks` 子组件中的 `edit` 才指向 `/projects/p100/tasks/edit`。需要按 URL 路径段计算时，React Router 支持 `relative: 'path'`，见[相对路径解析](https://reactrouter.com/api/hooks/useResolvedPath)。

`RouteDialog` 和 `RouteDrawer` 内可通过 `useRouteOverlay().close()` 返回父路由。直接打开子页面时，上一条浏览记录可能来自其他网站，因此不能把 `navigate(-1)` 作为唯一的返回方式。`replace: true` 会替换当前历史记录，避免后退时再次打开刚提交的表单。

查询参数不会自动区分归属：父列表和子页面共用 URL 时，返回列表应保留列表参数，移除只属于详情或页签的参数。

### 默认子页面与页签

`defineAppRoutes` 没有 `index` 或 `redirect` 字段。若父页面已经占用 `/reports`，再注册最终路径同为 `/reports` 的子页面会产生冲突。

需要进入 `/reports` 时默认显示 `/reports/summary`，可以声明 `summary`、`owners` 两个子路由，在父组件中仅对父地址进行重定向：

```tsx
import {
  Navigate,
  Outlet,
  matchPath,
  useLocation,
  useResolvedPath,
} from 'react-router';

export default function ReportsPage() {
  const location = useLocation();
  const parent = useResolvedPath('.');
  const atParent = matchPath(
    { path: parent.pathname, end: true },
    location.pathname,
  );

  if (atParent) {
    return (
      <Navigate
        replace
        to={{ pathname: 'summary', search: location.search }}
      />
    );
  }

  return <Outlet />;
}
```

这段组件只展示跳转逻辑，假设两个页签沿用父页面权限。实际页签栏用 `NavLink` 切换，通常不声明独立的 `navigation` 和 `breadcrumb`。直接打开 `/reports/owners` 时必须保留该地址，不能无条件跳回默认页签。[`Navigate` 的 `replace`](https://reactrouter.com/api/components/Navigate) 用于避免浏览器后退时反复经过默认跳转。

如果页签权限不同，应在权限加载后选择第一个可访问页签；没有可访问页签时显示相应状态，不执行跳转。

## 导航菜单与分组

### 配置菜单入口

```ts
navigation: {
  title: 'projects.title',
  icon: FolderKanban,
  order: 20,
},
```

| 字段 | 用途 |
| --- | --- |
| `title` | 必填、非空字符串。默认模板在路由所属包的命名空间中查找翻译，找不到时显示原文；多语言应用使用翻译 key |
| `icon` | 可选。接受 `className` 的图标组件，可以直接使用 `lucide-react` 图标；传组件本身，而非 `<FolderKanban />` |
| `order` | 可选。数值越小越靠前，默认 `0`；同值保留注册顺序，只比较同级路由 |

省略 `navigation` 时，页面仍可通过地址或链接打开。详情、新建弹窗和页签通常采用这种方式；打开这些页面时，默认模板会选中最近的、有菜单入口的祖先页面。

带路径参数的页面不能声明 `navigation`，即使它的子路径是静态字符串，只要完整路径仍含参数，也不能成为固定菜单入口。

### 创建只用于归类的分组

分组必须声明 `name`、`navigation` 和 `children`，不提供 `componentLoader`，也不能设置 `authz`：

```ts
const businessRoutes = defineAppRoutes([
  {
    name: 'business',
    navigation: { title: 'navigation.business', order: 10 },
    children: [
      {
        name: 'projects',
        path: '/projects',
        authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },
        navigation: { title: 'projects.title' },
        componentLoader: () => import('./pages/projects/index.js'),
      },
    ],
  },
]);
```

这是前面项目路由的另一种组织方式，不要重复注册同名页面。没有 `path` 的分组只改变菜单层级，项目地址仍为 `/projects`。多级分组可以继续嵌套。

分组也可以声明路径前缀。例如分组 `path: '/settings'`、子页面 `path: 'projects'`，得到 `/settings/projects`。分组本身没有页面；访问分组地址不会自动选择第一个子页面。若分组地址需要落地页，可以在该分组内声明 `path: '/'` 的普通页面，使它匹配分组地址，前提是没有其他页面占用该地址。

`children: []` 可以预留供其他模块挂载的分组。默认模板只显示有可见页面的分组：空分组、所有子页面都没有菜单入口的分组，以及所有子页面都被权限隐藏的分组，不会显示。

## 面包屑

### 静态标题

`breadcrumb` 用来命名页面层级，可以用于动态路径：

```ts
{
  name: 'projectDetail',
  path: ':projectId',
  breadcrumb: { title: 'projects.detail' },
  componentLoader: () => import('./pages/projects/detail.js'),
}
```

`breadcrumb.title` 是非空字符串，翻译方式与菜单标题相同，不是读取记录名称的回调。导航与面包屑是不同的元数据；默认模板的页头根据以下规则显示它们：

- 显式声明 `breadcrumb` 的路由，以 `breadcrumb.title` 作为层级标题。
- 有 `navigation` 的页面未声明 `breadcrumb` 时，模板使用 `navigation.title`。这是模板的显示规则。
- 纯分组只有显式声明 `breadcrumb` 才成为面包屑层级；没有菜单和面包屑的弹窗、页签不会增加层级。
- 祖先页面层级可点击，纯分组只显示文字，最后一级表示当前页面。无权访问的页面不会显示在默认路径中。

默认模板的 `AppLayout` 已渲染面包屑，业务页面不需要重复放置 `Breadcrumbs`。访客和可选登录页面使用的独立布局没有这个页头。

### 动态标题和返回地址

需要显示项目名称时，在页面组件内用 `usePageBreadcrumb()` 声明**整条路径**：

```tsx
import { usePageBreadcrumb } from '@nocobase/app-client';

// project 是页面已加载的记录；location 来自 useLocation()。
usePageBreadcrumb(
  project
    ? [
        {
          label: t('projects.title'),
          to: { pathname: '/projects', search: location.search },
        },
        { label: project.name },
      ]
    : undefined,
);
```

`label` 是显示文字，`to` 是可选的跳转目标，最后一级不生成链接。记录尚未加载时传 `undefined` 或 `null`，使用路由的默认路径。父子页面都声明动态路径时，以内层页面为准；内层关闭后恢复外层声明。

模板默认会记住当前路由层级中祖先页面访问过的查询条件。直接打开详情或刷新后，没有这条访问记录，默认祖先链接不附加查询参数；需要通过深链接带回列表条件时，像上面这样显式指定 `to`，并只保留属于列表的参数。已经有同一返回路径的面包屑时，不必再放一个重复的返回按钮。

## 登录与访问权限

### `auth`：是否需要登录

| 值 | 行为 | 默认模板中的布局 |
| --- | --- | --- |
| `required` | 需要登录，未登录时进入登录流程；最外层省略时使用此值 | 应用布局，包含侧边栏和页头 |
| `guest` | 登录、注册等访客页面；已登录用户会被引导离开 | 独立页面布局 |
| `optional` | 登录和未登录都可打开，由页面适配身份 | 独立页面布局 |

子路由继承父路由的 `auth`，分组也会传递这一设置。子路由可以省略或重复相同值，但不能改成另一个值；需要不同登录要求的页面应声明在对应的独立路由树中。

### `authz`：是否允许访问

| 配置 | 适用场景 |
| --- | --- |
| `{ resource: { type, id }, action }` | 检查指定资源和操作 |
| `'skip'` | 不检查本页面自己的权限，仍受登录要求和父页面检查限制 |
| `'unrestricted'` | 只允许具有无限制访问权限的身份，例如 root；不是“所有人可访问”，也不是可分配给普通角色的页面权限 |

资源和操作可以按页面用途选择：

```ts
// 进入业务页面。
authz: { resource: { type: 'page', id: 'projects' }, action: 'access' },

// 只有能创建项目的用户才能打开新建页面。
authz: { resource: { type: 'composite', id: 'projects' }, action: 'create' },

// 配置页检查对应设置项的读取权限。
authz: { resource: { type: 'settings', id: 'project-settings' }, action: 'read' },
```

`type`、`id` 和 `action` 必须是非空字符串。`composite`、`settings` 等业务资源及其操作应先由相应服务端能力注册，路由声明不会替你创建这些资源，也不会自动向用户授予权限。

### 继承与默认值

1. 页面显式声明 `authz` 时，使用自己的声明。
2. 子页面省略时，继承最近祖先**页面**的有效值，中间的纯分组不改变它。
3. 没有祖先页面可继承时，`auth: 'required'` 默认使用 `'unrestricted'`，`guest` 和 `optional` 默认使用 `'skip'`；开发环境会提示补充声明。

因此，应在每条路径的首个页面上明确写出 `authz`，避免新页面只对管理员可见却不知道原因。纯导航分组不能设置 `authz`。

子页面写自己的权限或 `'skip'`，都不会绕过父页面。以项目为例，打开新建页面需要先通过列表的 `projects/access`，再通过新建的 `projects/create`。

默认模板在页面加载前检查权限，并据此隐藏菜单。页面中的操作按钮可用 `useCan()` 检查同一业务操作。前端检查不代替 API 授权，接口仍应独立验证登录状态、业务权限和数据范围，见[认证、权限与数据范围](authentication-and-permissions.md)。

路由名称和权限 ID 不必相同。角色授权保存的是 `authz.resource.id`，修改名称不会自动迁移权限 ID；调整菜单文字时只改翻译。没有导航或面包屑的 `page/access` 页面，需要在模板的 `client/pages/settings/page-permission-titles.ts` 中补充可读的权限显示名。

## 挂载到其他文件或插件的分组

当设置分组由一个模块声明、页面由另一个模块提供时，可以使用路由条目的 `parent`：

```ts
const settingsRoutes = defineAppRoutes([
  {
    name: 'settings',
    path: '/settings',
    navigation: { title: 'settings.title' },
    children: [],
  },
]);

const projectSettingsRoutes = defineAppRoutes([
  {
    parent: 'settings',
    name: 'projectSettings',
    path: 'projects',
    authz: {
      resource: { type: 'settings', id: 'project-settings' },
      action: 'read',
    },
    navigation: { title: 'projects.settings', order: 20 },
    componentLoader: () => import('./pages/settings/projects.js'),
  },
]);

export default [settingsRoutes, projectSettingsRoutes];
```

两个声明可以分别放在不同文件，再汇总导出；最终页面地址为 `/settings/projects`。

| 写法 | 目标 |
| --- | --- |
| `parent: 'settings'` | 当前应用或插件包中名为 `settings` 的分组 |
| `parent: '@acme/admin:settings'` | 其他包 `@acme/admin` 声明的 `settings` 分组 |

使用限制：

- `parent` 只能写在传给 `defineAppRoutes()` 的根条目上，不能写在已有 `children` 内。
- 目标必须是**分组**，不能是带组件的页面；要给页面增加子路由，应修改它的 `children`。
- 页面和分组都可以挂载，挂载后的 `path` 相对于目标分组计算，并继承目标的登录要求和祖先页面权限。
- 目标可以后声明，但双方必须最终注册到同一个应用；不存在的目标、循环挂载都会报错，不会自动创建或合并分组。
- 挂载不会改变路由所属的包，因此路由 ID、翻译命名空间仍属于提供该路由的包。
- 同级先按 `navigation.order` 排序；同值时保留分组原有子项，再按贡献注册顺序追加条目。

## 拆分、复用与插件路由

### 汇总多个路由文件

应用的 `routes` 可以接收单个贡献对象或贡献对象数组。常见写法是各模块独立导出 `defineAppRoutes()` 的结果，再汇总：

```ts
// client/routes.ts
import projectRoutes from './pages/projects/routes.js';
import settingsRoutes from './pages/settings/routes.js';

export default [projectRoutes, settingsRoutes];
```

如果某个模块已经导出贡献数组，需要展开为一层数组：`export default [...projectRoutes, settingsRoutes]`。不要把贡献对象数组再次传给 `defineAppRoutes()`；它接收的是页面和分组定义数组。

### 根据插件选项生成路由

`AppClientRoutes<TOptions>` 还支持返回贡献对象或贡献数组的同步函数。插件可以根据注册选项决定是否贡献页面：

```ts
import { defineAppRoutes, defineClientPlugin } from '@nocobase/app-client/plugins';

interface ProjectOptions {
  enabled?: boolean;
}

export default defineClientPlugin<ProjectOptions>({
  packageName: '@acme/projects',
  routes: (options) =>
    defineAppRoutes(
      options.enabled === false
        ? []
        : [
            {
              name: 'projects',
              path: '/projects',
              authz: {
                resource: { type: 'page', id: 'projects' },
                action: 'access',
              },
              navigation: { title: 'projects.title' },
              componentLoader: () => import('./pages/projects/index.js'),
            },
          ],
    ),
});
```

应用在 `client/plugins.ts` 的 `defineClientPlugins([...])` 中注册这个插件，例如 `projectsPlugin({ enabled: true })`，并加载插件的语言资源。完整接入步骤见[插件的页面、路由与菜单](../extension-development/pages-and-menus.md)。

这是注册阶段的选项，不会随 React 状态或当前用户变化而重新生成。按用户显示页面应使用 `authz`。`defineAppRoutes` 自身始终接收数组，不接收回调或 Promise。

### 路由 ID 与组件覆盖

解析后的路由 ID 为 `包名:路由名`，例如 `@acme/projects:projects`。同一包内，即使路由分布在不同文件、分组或层级，`name` 也必须唯一；不同包可以使用相同 `name`，但页面路径仍不能冲突。

需要替换已有页面组件时，在模板的 `client/route-overrides.ts` 中使用独立的覆盖 API：

```ts
import { defineClientRouteComponentOverrides } from '@nocobase/app-client/plugins';

export default defineClientRouteComponentOverrides([
  {
    routeId: '@acme/projects:projects',
    componentLoader: () => import('./pages/custom-projects.js'),
  },
]);
```

这种覆盖保留路径、权限、菜单和子路由，只替换组件。目标必须已注册且是页面，不能覆盖分组，也不能对同一 ID 重复声明覆盖。不要通过再次注册相同路径来覆盖页面；相关扩展方式见[使用与管理插件](manage-plugins.md)。

## 配置项与限制速查

### 路由定义的全部字段

一个条目要么是页面，要么是纯导航分组：

| 字段 | 页面 | 分组 | 说明 |
| --- | --- | --- | --- |
| `name` | 必填 | 必填 | 同一包内唯一，以字母或数字开头，其余可含字母、数字、点、下划线和连字符 |
| `path` | 必填 | 可选 | 页面路径或分组的路径前缀；相对父层拼接 |
| `componentLoader` | 必填 | 不可设置 | `() => Promise<{ default: Component }>` |
| `children` | 可选 | 必填 | 子页面或子分组数组，分组可用空数组预留位置 |
| `navigation` | 可选 | 必填 | `{ title, icon?, order? }` |
| `breadcrumb` | 可选 | 可选 | `{ title }`，静态标题或翻译 key |
| `auth` | 可选 | 可选 | `'required'`、`'guest'`、`'optional'`；最外层默认 `'required'`，子层继承 |
| `authz` | 可选，首个页面应明确声明 | 不可设置 | 权限请求、`'skip'` 或 `'unrestricted'`；继承规则见上文 |
| `parent` | 可选，仅贡献根条目 | 可选，仅贡献根条目 | 挂载到同包或跨包的已有分组 |

`navigation`、`breadcrumb` 的子字段已在相应章节列全。`title` 是字符串，`icon` 是组件，均不支持按当前用户执行的配置回调。

`defineAppRoutes` 没有直接提供 React Router 的 `index`、`element`、`Component`、`loader`、`action`、`errorElement`、`redirect` 等字段。用 `componentLoader` 接入页面，在组件和应用路由层处理数据、跳转和错误。默认模板在 `client/routing/app-router.tsx` 中处理未匹配地址，不能在这里追加 `path: '*'`。

### 路径冲突与保留地址

- 页面路径在整个应用中唯一，包含所有插件；分组本身不占用页面地址。
- 冲突检查忽略静态路径段的大小写：`/Projects` 与 `/projects` 不能分别注册。
- 参数名称不区分地址结构：`/projects/:id` 与 `/projects/:projectId` 会冲突；静态 `/projects/new` 与动态详情路由可以共存。
- `/` 页面只能由应用声明，插件不能占用应用首页。
- `/login`、`/register`、`/forgot-password`、`/reset-password` 要求 `auth: 'guest'`，并仍需满足路径唯一性。

### 常见问题

| 现象 | 检查方式 |
| --- | --- |
| 新页面没有出现在菜单中 | 确认贡献已汇总到运行时、配置了 `navigation`，并且当前用户拥有页面权限 |
| 页面只有管理员能打开 | 检查首个页面是否遗漏 `authz`，导致默认使用 `'unrestricted'` |
| 子地址匹配了，但看不到内容 | 检查父页面是否渲染 `Outlet`；路由不会自动把子页面变成弹窗 |
| `parent` 提示目标不存在 | 使用分组名称而非 URL；跨包时使用 `包名:分组名`，并确认目标贡献已注册 |
| 注册时提示路径或名称冲突 | 检查其他文件和插件，以及规范化后的路径、动态参数名称和包内重复名称 |
| 页面组件加载失败 | 检查 import 路径、默认导出以及模块的加载和执行错误 |
| 菜单已隐藏，但接口仍能调用 | 前端页面检查不等于服务端授权，应检查 API 自己的权限实现 |

版本基准：`@nocobase/app-client` `4.0.0-beta.4` 和默认模板 `1.0.0-beta.84`。路由声明与解析规则见[接口和实现源码](https://github.com/nocobase/nocobase/blob/d54bae62e652ce2fd8057840bacbcbf0e29a5599/packages/app/app-client/src/plugins.ts)，模板导航及面包屑的可运行代码见 [Team tasks 示例](https://github.com/nocobase/docs-examples-v3/tree/46290c9c8efa59dfd484f9018196d65c2a1e0dd6/apps/team-tasks/client)。本文中的页面路径和组件名用于演示配置组合，使用时需提供对应组件、翻译和业务权限。
