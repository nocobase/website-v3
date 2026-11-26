---
title: 开发门户
metaDescription: 了解门户的目录结构，用 definePortalRoutes 声明页面、授权和导航，调整门户布局，用 definePortalApiRoutes 定义门户接口并在页面中调用。
---

下面以[快速开始](quickstart.md)中生成的库存门户（`@nocobase/app-portal-inventory`，地址 `/portals/inventory`）为例，给它加一个物料页面和对应的接口。门户是应用中的本地包，随应用一起构建和部署；页面沿用 shadcn/ui 组件约定，优先复用应用已有的组件和 NocoBase UI Library。

## 了解门户目录结构

门户代码位于 `packages/app-portal-inventory/`，以下省略工具配置和构建产物：

```text
packages/app-portal-inventory/
├── package.json                 # 包信息，以及门户的名称、说明、图标和地址
├── client/
│   ├── plugin.ts                # 注册页面路由和语言资源
│   ├── routes.ts                # definePortalRoutes：门户的页面、授权和导航
│   ├── layout.tsx               # PortalLayout：Logo、切换器、头部按钮
│   ├── assets/logo.tsx          # 占位 Logo，替换为自己的图形
│   ├── pages/overview.tsx       # 首页，调用示例接口
│   └── locales/index.ts         # 页面文案的翻译
├── server/
│   ├── plugin.ts                # 注册门户接口、服务和数据库任务
│   ├── routes.ts                # definePortalApiRoutes：门户接口，含示例接口
│   └── providers/
│       ├── index.ts             # 服务提供者列表
│       └── portal-provider.ts   # 向多门户注册门户，默认未安装
├── database/main/
│   ├── migrations/              # 门户自己的表结构迁移，初始为空
│   └── seeds/                   # 门户安装状态的初始化记录
└── tests/server/routes.test.ts  # 示例接口的服务端测试
```

日常开发主要改三处：

- **页面**：`client/routes.ts` 声明门户有哪些页面、谁能打开、哪些进入菜单，`client/pages/` 放页面组件。
- **外观**：`client/layout.tsx` 决定门户的 Logo、导航位置和头部按钮。
- **接口**：`server/routes.ts` 定义门户接口，多门户把它们统一挂在 `/api/portals/inventory` 下，页面通过 `usePortalApi()` 调用。

`package.json` 描述门户，`server/providers/portal-provider.ts` 用它把门户注册到多门户，生成器已经写好，通常不需要修改。生成的门户自带示例接口 `GET /api/portals/inventory/examples` 和调用它的首页，可以对照阅读，再替换成自己的业务。

## 定义页面路由

### 用 definePortalRoutes 声明页面

门户的页面写在 `client/routes.ts` 中，写法与应用的 [`defineAppRoutes`](../../developing-apps/pages-routes-and-navigation.md) 相同：

```ts
import type { AppClientRouteContribution } from '@nocobase/app-client/plugins';
import { definePortalRoutes } from '@nocobase/app-plugin-multi-portal/client/routes';
import { ChartNoAxesCombined } from 'lucide-react';
import manifest from '../package.json' with { type: 'json' };

const routes: AppClientRouteContribution = definePortalRoutes({
  manifest,
  layout: () => import('./layout.js'),
  routes: [
    {
      name: 'overview',
      path: '',
      navigation: { title: 'overview', icon: ChartNoAxesCombined },
      componentLoader: () => import('./pages/overview.js'),
    },
  ],
});
export default routes;
```

- `manifest` 是门户的 `package.json`，提供门户的 key、名称和图标。
- `layout` 是门户布局，省略时使用插件的默认 `PortalLayout`。
- `routes` 中的 `name`、`path`、`children`、`componentLoader`、`navigation`、`breadcrumb` 与 `defineAppRoutes` 含义相同。

和应用页面相比，门户页面有三点不同：

- **路径相对门户地址**：`''` 是门户首页 `/portals/inventory`，`materials` 是 `/portals/inventory/materials`。不要写 `/portals/inventory`，也不要写 `/main` 等应用基础路径。
- **不用写 `auth`**：门户页面都要求登录。
- **页面授权自动生成**：不用写 `authz: { resource: { type: 'page', id } }`，见[页面授权](#页面授权)。

`definePortalRoutes` 生成门户根路由 `/portals/inventory`，它不使用应用的侧栏和头部，改用门户自己的布局；其他页面作为子路由显示在布局的内容区。页面组件只渲染自己的内容，不需要包一层布局，也不需要自己检查门户和页面权限。

后端只用 `package.json` 注册门户，不需要页面列表：

```ts
// server/providers/portal-provider.ts
register({ ...portalFromPackage(manifest), defaultInstalled: false });
```

### 子页面与路径参数

子页面写在 `children` 中，路径相对父页面：

```ts
{
  name: 'materials',
  path: 'materials',
  navigation: { title: 'materials', icon: Package },
  componentLoader: () => import('./pages/materials/list.js'),
  children: [
    {
      name: 'materialDetail',
      path: ':id',                        // /portals/inventory/materials/:id
      breadcrumb: { title: 'materialDetail' },
      componentLoader: () => import('./pages/materials/detail.js'),
    },
  ],
},
```

参数加 `?` 表示可选，如 `stock/:warehouse?` 会同时注册 `stock/:warehouse` 和 `stock`。

路径以 `/` 开头、包含 `..`、`?query`、`#` 或 `*`，页面名重复，或使用保留名 `portal` 时，应用启动会报错。

### 页面授权

每个页面默认生成一个授权项，显示在 **角色与权限 → 多门户** 中，名称取自 `navigation.title`，没有时取 `breadcrumb.title`。需要调整时，在路由上声明：

| 写法 | 在权限配置中的效果 |
| --- | --- |
| 默认 | 顶层页面单独一项，授权键为 `name` |
| `group: 'stock'` | 使用同一 `group` 的页面合为一项，一起开放 |
| `children` 中的子页面 | 默认跟随父页面；加上 `access: 'own'` 后单独一项，并且还要能打开所有上级页面 |
| `authz: 'skip'` | 能进入门户就能打开，不出现在权限配置中 |

例如下面两个页面共用一个授权项，编辑页单独授权：

```ts
{ name: 'stock', path: 'stock/:warehouse?', group: 'stock', /* … */ },
{ name: 'stockHistory', path: 'stock-history', group: 'stock', /* … */ },
{ name: 'materialEdit', path: ':id/edit', access: 'own', /* materials 的子页面 */ },
```

成员要打开门户中的页面，需要同时满足：

1. 角色开启了这个门户的门户访问。
2. 至少有一个页面能打开。开启了门户访问、但没有任何可打开的页面时，整个门户都进不去，也不会出现在我的门户中。
3. 有这个页面的授权，或者勾选了 **所有页面**。

授权项以 `name` 或 `group` 为键保存在角色中。门户发布后，修改 `name` 或 `group` 会让角色原来的勾选失效；需要改名时，把原来的值写成 `group`。修改门户地址不影响已有授权。管理员如何配置，见[门户权限](access.md)。

## 新增页面

给库存门户加一个 **Materials**（物料）页面：

1. 新建 `client/pages/materials.tsx`，默认导出页面组件。页面标题由布局显示，页面中不用重复；内容在[在页面中调用接口](#在页面中调用接口)中补全：

   ```tsx
   import type { ReactElement } from 'react';

   export default function MaterialsPage(): ReactElement {
     return <section className='p-6'>{/* 物料列表 */}</section>;
   }
   ```

2. 在 `client/routes.ts` 的 `routes` 中加上路由：

   ```ts
   {
     name: 'materials',
     path: 'materials',
     navigation: { title: 'materials', icon: Package },
     componentLoader: () => import('./pages/materials.js'),
   },
   ```

3. 在 `client/locales/index.ts` 中为各语言加上 `materials` 文案，例如英文 `'Materials'`；缺少翻译时显示英文。

重启应用后，门户的菜单中出现 **Materials**，点击能打开页面；直接打开 `/main/portals/inventory/materials` 并刷新也能显示，应用基础路径不是 `/main` 时换成实际路径。**角色与权限 → 多门户** 中会出现这个页面。

## 导航与门户布局

### 由路由生成导航

写了 `navigation` 的页面会按 `routes` 中的顺序进入门户的菜单，没有 `navigation` 的页面（如详情页）不进入菜单。成员没有权限打开的页面，菜单项会自动隐藏。

菜单默认显示在左侧侧栏：桌面端可收起，手机上收进抽屉。改为头部横向导航时，在 `client/layout.tsx` 中设置：

```tsx
<PortalLayout logo={<Logo title={title} />} navigation='top' />
```

需要完全自定义菜单时，传入 `sidebar` 或 `topNav`，菜单项为 `{ path, title, icon?, end? }`，`path` 写完整的门户路径，如 `` `${portal.entry}/materials` ``。

### 调整 PortalLayout

`client/layout.tsx` 中的 `PortalLayout` 决定门户的外观，修改一个门户不会影响应用和其他门户：

| 属性 | 作用 |
| --- | --- |
| `logo` | 门户的 Logo，显示在侧栏顶部，没有侧栏时显示在头部。门户不使用应用的 Logo |
| `navigation` | 菜单位置：省略时为侧栏，`'top'` 为头部横向导航 |
| `sidebar`、`topNav` | 自定义菜单，替换由路由生成的菜单 |
| `switcher` | 门户切换器，通常为 `<PortalSwitcher />`，列出成员的门户并提供 **返回我的门户** |
| `headerActions` | 应用的头部按钮（站内信、Agent 等）：省略时全部显示，`{ include: [...] }`、`{ exclude: [...] }` 或 `false` |
| `userMenu` | 头像菜单，默认包含头像、语言切换、个人设置和退出登录；`false` 不显示 |
| `children` | 内容区，默认显示当前页面 |

头部按钮来自应用：应用隐藏或替换某个按钮后，门户中同步生效；按钮还会按对应页面的权限过滤。手机上按钮超过两个时收进 **更多** 菜单，头像菜单固定在最后。

面向外部客户的门户，常改为顶部导航并只保留头像菜单：

```tsx
<PortalLayout logo={<Logo title={title} />} navigation='top' headerActions={false} />
```

让门户所有页面使用同一个内容容器时，在 `children` 中用 `PortalOutlet` 包一层；只调整某个页面时，把容器写在那个页面中：

```tsx
import { PortalOutlet } from '@nocobase/app-plugin-multi-portal/client/layout';

<PortalLayout logo={<Logo title={title} />} switcher={<PortalSwitcher />}>
  <div className='mx-auto w-full max-w-5xl'>
    <PortalOutlet />
  </div>
</PortalLayout>
```

Logo 需要显示门户名称时，用 `usePortalText(usePortal().portal)` 读取当前语言下的名称。门户中新增的 Tailwind 类不生效时，检查应用的样式扫描是否包含 `packages/` 下的门户目录。

## 定义门户接口

### 接口路径与命名

门户的接口写在 `server/routes.ts` 中，用 `definePortalApiRoutes` 定义，并已加入 `server/plugin.ts` 的 `routes`。下面给库存门户加一个物料列表接口：

```ts
import {
  apiErrorResponses,
  apiValidator,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import {
  definePortalApiRoutes,
  type PortalApiEnv,
} from '@nocobase/app-plugin-multi-portal/server/http';
import { Hono } from 'hono';
import { z } from 'zod';
import manifest from '../package.json' with { type: 'json' };

const material = z.object({ sku: z.string(), name: z.string(), unit: z.string() });

export default definePortalApiRoutes({
  manifest,
  createRouter: () =>
    new Hono<PortalApiEnv>().get(
      '/materials', // 实际地址为 /api/portals/inventory/materials
      describeRoute({
        tags: ['Inventory'],
        operationId: 'inventoryListMaterials',
        summary: 'List materials',
        description: 'Requires the inventory.readMaterials action.',
        responses: { 200: listResponse(material), ...apiErrorResponses },
      }),
      apiValidator('query', z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) })),
      async (c) => {
        await c.var.authz.require(readMaterials);
        const { limit } = c.req.valid('query');
        // 按业务服务读取物料；c.var.portal 是当前门户
        return c.json({ data, meta: { total } });
      },
    ),
});
```

多门户把门户接口统一挂在 `/api/portals/<key>` 下，`<key>` 与门户页面地址中的一致。在这个前缀下，按应用接口的规范写，就像前缀是门户自己的 `/api`：

- 路径相对前缀书写，不再加命名空间：写 `/materials`，不写 `/inventory/materials`。路径段用驼峰，资源用复数；固定路径注册在 `:id` 路径之前。
- 成功返回 `{ data }`，列表返回 `{ data, meta }`；失败时抛出 `ApiError`；输入用 `apiValidator` 校验。
- 每个接口都用 `describeRoute` 声明，`tags` 写门户名称，`description` 写明需要的权限。
- `operationId` 以门户 key 的驼峰形式开头，如 `inventoryListMaterials`，在整个应用中唯一。同一门户内，同一方法和路径只能出现一次。

不符合以上规则时，应用启动报错并指出门户包。门户接口会出现在 API 文档中，地址为完整的 `/api/portals/inventory/…`。接口路径跟随门户 key，门户发布后不要修改 key。

`/api/portals` 由多门户专用，其他插件不能在它下面注册接口；多门户自己的接口在 `/api/portalCenter` 下。

### 访问检查与错误

请求到达门户接口之前，多门户按顺序检查：

| 顺序 | 检查 | 不满足时 |
| --- | --- | --- |
| 1 | 已登录，或使用了 API 密钥 | `401`，`PORTAL_AUTHENTICATION_REQUIRED` |
| 2 | 门户存在且已安装 | `404`，`PORTAL_NOT_AVAILABLE` |
| 3 | 有门户访问权限；有范围限制的 API 密钥，范围内要包含这个门户 | `403`，`PORTAL_ACCESS_DENIED` |

这三项错误的 `domain` 都是 `portalCenter`。门户没有定义的路径返回 `404` 和 `ROUTE_NOT_FOUND`。页面授权不参与接口的检查。

通过检查后，接口自己还要检查两项：业务操作权限（如上例的 `c.var.authz.require(readMaterials)`），以及数据范围。门户访问只决定能否进入门户，不代替业务权限。

门户接口自己定义的错误，`domain` 使用 `portalCenter`，原因码取一个不会与多门户和其他门户冲突的名称，如 `INVENTORY_MATERIAL_NOT_FOUND`。从其他插件透传的错误保留原来的 `domain` 和原因码。

不挂在 `/api/portals/<key>` 下、但只为某个门户服务的接口，自己调用 `requirePortalAccess(context, portalId)` 检查门户访问和安装状态。

### 把业务操作放进多门户页签

门户的业务资源和操作照常用 `authz.resourceTypes.add` 注册。再把它们放进 **角色与权限 → 多门户** 中这个门户的分组，显示在页面权限之后：

```ts
// 服务端：在服务提供者的 boot() 中
app.container
  .resolve(portalCenterServiceToken)
  .placeActions(manifest, [{ type: 'warehouse', id: 'warehouse.outbound' }]);
```

```ts
// client/plugin.ts
import { placePortalActions } from '@nocobase/app-plugin-multi-portal/client/routes';

serviceProviders: [
  placePortalActions(manifest, [{ type: 'warehouse', id: 'warehouse.outbound' }]),
],
```

门户访问关闭时，这些操作一并置灰。角色从通配授权继承来的操作会标出来源，在这里只读。

放进多门户页签的资源，不要再用 `authz.ui.place` 放到主工作区。门户或资源未注册、同一门户重复放置同一资源时，应用启动报错。

## 在页面中调用接口

在门户页面中，用 `usePortalApi()` 调用门户接口。它返回与 `useApiClient()` 相同的 `request` 和 `stream`，路径相对 `/api/portals/<key>`，`'materials'` 和 `'/materials'` 都会请求 `/api/portals/inventory/materials`。数据请求直接使用 TanStack Query：

```tsx
import type { ReactElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePortalApi } from '@nocobase/app-plugin-multi-portal/client/layout';

interface Material {
  readonly sku: string;
  readonly name: string;
  readonly unit: string;
}

export default function MaterialsPage(): ReactElement {
  const api = usePortalApi();
  const materials = useQuery({
    queryKey: api.portalQueryKey('materials'),
    queryFn: ({ signal }) =>
      api.request<{ data: readonly Material[] }>({ path: 'materials', signal }),
  });
  return (
    <section className='p-6'>
      {materials.error ? (
        <p role='alert' className='text-sm text-destructive'>{materials.error.message}</p>
      ) : null}
      <ul className='divide-y rounded-xl border'>
        {materials.data?.data.map((item) => (
          <li key={item.sku} className='flex justify-between gap-4 p-4'>
            <span className='font-medium'>{item.name}</span>
            <span className='text-sm text-muted-foreground'>{item.sku} · {item.unit}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- **缓存键**：用 `api.portalQueryKey(...)` 生成，结果为 `['portal', <key>, <用户 ID>, ...]`，不同门户、不同用户的缓存不会混用，离开门户时这些缓存会被清除。
- **门户外调用**：在门户之外的页面使用时，传入门户的 `package.json`：`usePortalApi(manifest)`。
- **访问失败**：多门户拒绝请求（登录过期、门户未安装、无门户访问权限）时，`PortalLayout` 统一显示对应提示，页面不需要自己处理；权限变化、门户在其他标签页被安装或卸载、或成员点击 **重试** 后，页面会重新加载。页面只需处理自己的业务错误，包括从其他插件透传的未登录错误。
- **不支持 `repository()`**：调用会直接报错，数据表的通用读写见下一节。

页面还应补充加载、空列表和保存反馈。不要在浏览器中直接连接数据库。

## 数据表与数据库连接

门户的 `server/plugin.ts` 已经声明使用应用的 `main` 连接：

```ts
database: { connections: { main: {} } },
```

`main` 是应用配置的连接名，`{}` 表示使用约定目录 `database/main/migrations` 和 `database/main/seeds`，不会新建数据库；数据库地址、凭据和驱动都由应用配置。

- **表结构**：在 `database/main/migrations/` 中新增迁移，创建门户自己的表，如物料表。同一连接上的多个门户使用不会冲突的表名。迁移在安装门户时执行；门户已安装后，在应用启动或执行 `pnpm nocobase db apply` 时执行新增的部分。
- **初始数据**：门户运行必需的固定数据写在新的 seed 中，演示数据不要写进 seed。不要修改生成的安装状态 seed，也不要修改已执行过的迁移和 seed。
- **通用增删改查**：对数据表做通用读写时，继续使用框架的 `defineRepositoryApiRoutes`，地址为 `/api/<表名>/…`，不加门户前缀，由数据表权限控制访问，不经过门户访问的检查。
- **其他数据库连接**：先在应用中配置连接和驱动，再在门户中声明同名连接，如 `warehouse: {}`，对应 `database/warehouse/` 下的迁移和 seed，详见[数据库连接](../../framework/database/connections.md)。安装时每个连接的任务都要成功；多个连接之间没有跨库事务，失败后保留执行历史，修复后重试。

一张表只由一个门户负责创建和迁移。其他门户需要这些数据时，调用它公开的服务或接口，并在服务端注册时声明依赖：

```ts
register({
  ...portalFromPackage(manifest),
  defaultInstalled: false,
  dependencies: ['@nocobase/app-portal-inventory'],
});
```

声明依赖后，必须先安装库存门户才能安装使用方，使用方已安装时库存门户不能卸载。依赖只约束安装顺序，不授予数据访问权限。

迁移、服务和接口的通用写法见[数据库与迁移](../../extension-development/database-and-migrations.md)、[服务端 API](../../extension-development/server-apis.md)和[认证、权限与数据范围](../../developing-apps/authentication-and-permissions.md)。

## 验证与交付

在应用根目录运行门户检查和应用构建：

```bash
pnpm --filter @nocobase/app-portal-inventory check
pnpm openapi:check
pnpm build
```

生成的 `tests/server/routes.test.ts` 覆盖示例接口的四种结果：未登录返回 401，门户未安装返回 404，没有门户访问权限返回 403，有权限时返回 200；并断言 `findUndeclaredApiRoutes()` 为空。新增接口时按同样方式补充测试，并加上业务权限不足时被拒绝的情况。

再实际检查：

- 从我的门户和切换器进入门户，菜单、直接访问和刷新的结果一致。
- 分别用三类账号检查页面和接口：开放了部分页面的、开启了门户访问但没有开放页面的、关闭了门户访问的。隐藏菜单不能代替接口的权限检查。
- 在桌面和手机宽度下检查导航、切换器和头部按钮。

门户随应用交付；需要部署包时运行 `pnpm build --tar`，后续步骤见[发布应用版本](../../deployment/publish-app-release.md)。
