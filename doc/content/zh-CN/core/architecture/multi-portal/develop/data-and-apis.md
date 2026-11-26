---
title: 数据与接口
metaDescription: 为门户添加数据表、服务端接口和页面读写，并检查门户访问与业务权限。
---

门户页面的数据只写在前端代码中时，不需要服务端。需要保存、修改或在多个成员之间共享数据时，再为门户添加数据表和接口。下面以把库存门户的物料列表改为可新增、可保存为例，说明各部分写在哪里。

## 何时需要服务端

门户本身就是一个普通的应用插件，服务端代码在门户包的 `server/` 中。数据表、接口和服务的写法与应用插件相同，本文只说明门户特有的部分；通用写法见[服务端 API](../../../extension-development/server-apis.md)和[数据库与迁移](../../../extension-development/database-and-migrations.md)。

完成后，库存门户新增的文件大致如下：

```text
packages/app-portal-inventory/
├── client/pages/materials.tsx        # 调用接口，显示和新增物料
├── server/
│   ├── routes/materials.ts           # 查询、新增接口及权限检查
│   ├── services/materials.ts         # 业务规则和数据读写
│   └── providers/materials.ts        # 注册业务服务
└── database/main/
    └── migrations/<迁移文件>.ts       # 创建物料表
```

## 定义数据表

门户的 `server/plugin.ts` 已经声明使用应用的 `main` 连接：

```ts
database: {
  connections: {
    main: {}, // 加载 database/main/migrations 和 database/main/seeds
  },
},
```

`main` 是应用配置的连接名，`{}` 表示使用约定目录，不会新建数据库。数据库地址、凭据和驱动都由应用配置。

在 `database/main/migrations/` 中新增迁移，创建门户自己的物料表，例如包含 `sku`、`name` 和 `unit`。同一连接上的多个门户应使用不会冲突的表名。

- 门户运行需要的固定数据，写在 `database/main/seeds/` 的新 seed 中；演示数据不要写进 seed。
- 不要修改生成的门户安装状态 seed，也不要修改已执行过的迁移和 seed。

迁移和 seed 在管理员安装门户时执行；门户已安装时，在应用启动或执行 `pnpm nocobase db apply` 时执行新增的部分。

## 实现接口

业务服务负责规则和数据读写，接口负责输入校验、登录和权限检查。

1. 在 `server/services/materials.ts` 中实现物料的查询和新增，并在 `server/providers/materials.ts` 中注册服务，再把 Provider 加入 `server/providers/index.ts`。
2. 在 `server/routes/materials.ts` 中实现查询和新增接口，并在 `server/plugin.ts` 中注册这份路由。
3. 为接口声明 API 文档和所需的操作权限。

### 检查访问权限

门户的页面权限只控制界面能否打开，不保护接口。每个业务接口都要依次检查：

1. 调用者已经登录。
2. 调用者有这个门户的访问权限，并且门户已安装。
3. 调用者有这个操作所需的业务权限，以及对应的数据范围。

第 2 步用多门户插件提供的 `requirePortalAccess`：

```ts
import { portalCenterServiceToken } from '@nocobase/app-plugin-multi-portal/server';

await app.container
  .resolve(portalCenterServiceToken)
  .requirePortalAccess(c.var.authz, portal.id);
await c.var.authz.require(readMaterials);
```

`portal.id` 是门户包名，可以用 `portalFromPackage(manifest)` 从 `package.json` 读取。门户未安装或调用者没有门户权限时，`requirePortalAccess` 会拒绝请求。业务权限和数据范围的设计见[认证、权限与数据范围](../../../developing-apps/authentication-and-permissions.md)。

### 使用其他门户的数据

一张表只由一个门户负责创建和迁移。其他门户需要使用这些数据时，调用它公开的服务或接口，不要重复定义同一张表，也不要导入它的内部文件。

使用方门户在服务端注册时声明依赖：

```ts
register({
  ...portal,
  defaultInstalled: false,
  dependencies: ['@nocobase/app-portal-inventory'],
  routeManifest: definePortalRouteManifest({ portal, routes: portalRoutes }),
});
```

声明依赖后，必须先安装库存门户，才能安装使用方；使用方已安装时，库存门户不能卸载。依赖只约束安装顺序，不授予数据访问权限，共享的服务和接口仍要检查调用者的权限。

## 在页面中读写数据

在 `client/pages/materials.tsx` 中，用应用的 API 客户端 `useApiClient()` 调用接口，替换原来写在代码中的物料：

- 加载时显示加载状态，列表为空时显示空状态。
- 请求失败时显示错误，并允许重试。
- 新增成功后刷新列表，失败时保留表单内容并提示原因。

页面只通过接口读写数据，不要在浏览器中直接连接数据库。

完成后检查：新增一条物料后刷新页面仍能看到；用没有业务权限的账号直接请求接口，读取和新增都被拒绝；卸载门户后，接口不再返回数据。

## 使用其他数据库连接

门户的数据需要放在另一个数据库时，先在应用中配置这个连接和驱动，再在门户中声明同名连接：

```ts
database: {
  connections: {
    main: {},
    warehouse: {}, // 加载 database/warehouse/migrations 和 database/warehouse/seeds
  },
},
```

声明连接不会创建数据库，连接名必须在应用配置中存在，详见[数据库连接](../../../framework/database/connections.md)。安装时，每个连接上的数据库任务都要成功；多个连接之间不提供跨库原子事务，某一步失败后会保留执行历史，修复后重试即可。
