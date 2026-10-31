---
title: HTTP 路由与接口
description: 注册服务端 Web 路由、自定义 API 和 Repository 数据接口，处理页面、重定向、下载、权限与接口文档。
---

应用可以直接返回 HTML、重定向和文件，也可以提供供页面或其他客户端调用的 JSON 接口。下面用 Product Catalog 示例展示这些用法；[完整源码与启动方式](#示例源码与运行)见文末。

## 选择路由类型

### Web 路由与 API 路由

| 需求 | 声明方式 | 示例路径 |
| --- | --- | --- |
| HTML 页面、重定向、文件下载或协议回调 | `defineRootRoutes()` | `/catalog` |
| 自定义查询、创建记录、执行业务操作 | `defineApiRoutes()` | `/api/products` |
| 将单个集合的标准 Repository 操作开放为 HTTP 接口 | `defineRepositoryApiRoutes()` | `/api/publicCategories/findMany` |

`defineRootRoutes()` 中的 root 指应用根路径，不一定是域名根路径。Web 路由可以自行决定响应内容和状态码；API 路由采用统一的输入校验、JSON 响应和错误格式，并进入 API 文档。路由类型不决定是否公开，两种路由都需要根据用途配置访问权限。

本例的商品目录公开展示已发布商品；分类接口允许匿名读取；商品管理接口和 CSV 下载需要登录并取得相应权限。

### 服务端路由与前端页面路由

这里的 Web 路由由服务端处理 HTTP 请求，直接返回 HTML 或其他响应。React 页面路由在客户端组织页面、布局和导航，见[页面、路由与导航](pages-routes-and-navigation.md)。新增服务端路由不会自动增加侧边栏菜单。

如果需要应用内的列表、表单和抽屉，通常使用前端页面路由并调用 API。独立的 HTML 页面、旧地址跳转和下载入口则可以使用服务端 Web 路由。

## 声明与注册路由

### 路由文件与注册入口

在 `server/routes/` 声明路由，再加入 `server/routes/index.ts`。文件存在不代表路由已经生效。

```ts
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';
import catalogWeb from './catalog-web.js';
import products from './products.js';
import categories from './categories.js';

const routes: readonly AppRouteContribution<Application>[] = [
  catalogWeb,
  products,
  categories,
];
export default routes;
```

将这些声明追加到现有数组，保留应用原来的路由。默认模板的 `server/runtime.ts` 已接入此入口，通常无需修改运行时。路由工厂在应用启动时执行；请求处理器在每次请求到达时执行。

查看源码：[路由注册](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/index.ts)。启动示例后，访问应用入口下的 `/catalog`，应看到商品目录。

### 应用基础路径与 API 前缀

声明中既不写 `/api`，也不写部署基础路径。例如应用部署在 `/shop` 时：

| 声明 | 代码中的路径 | 实际访问路径 |
| --- | --- | --- |
| `defineRootRoutes()` | `/catalog` | `/shop/catalog` |
| `defineApiRoutes()` | `/products` | `/shop/api/products` |
| Repository 名称 `publicCategories`，操作 `findMany` | 由适配器生成 | `/shop/api/publicCategories/findMany` |

路径以启动日志中的应用入口为准。自行生成 HTML 链接时，使用 `app.publicBasePath`，不要把 `/shop` 或 `/main` 写死在代码里。API Client 已配置 API 根地址，调用时使用 `/products` 等相对该地址的路径。

## 编写 Web 路由

### 返回 HTML 页面

`defineRootRoutes()` 接收一个返回 Hono 路由的工厂。`c.html()` 返回 HTML，`hono/html` 的模板会转义插入的普通字符串，商品名称等外部数据不应通过字符串拼接变成 HTML。

下面是 `server/routes/catalog-web.ts` 中目录页的核心写法，省略了导航和样式：

```ts
import { Hono } from 'hono';
import { html } from 'hono/html';
import type { Application } from '@nocobase/app-server/application';
import { defineRootRoutes } from '@nocobase/app-server/router';
import { catalogServiceToken } from '../providers/catalog.js';
import { publicProductPolicy } from '../providers/catalog-service.js';

export default defineRootRoutes<Application>((app) => {
  const router = new Hono();
  const service = app.container.resolve(catalogServiceToken);

  router.get('/catalog', async (c) => {
    const { data } = await service.list(publicProductPolicy, {
      q: '', page: 1, pageSize: 50,
    });
    return c.html(html`<ul>${data.map((product) =>
      html`<li>${product.name}</li>`,
    )}</ul>`);
  });
  return router;
});
```

`publicProductPolicy` 是示例自己的读取策略：只允许读取 `published` 为真的商品和指定字段，禁止写入。公开范围在服务端确定，不依赖浏览器传入的筛选条件。

打开 `<应用入口>/catalog`，初始数据中应只显示 **Canvas Backpack** 和 **Desk Lamp**，尚未发布的 **Travel Mug** 不出现。目录页最多显示 50 件商品。

![服务端返回的商品目录，仅显示两件已发布商品，并提供应用、API 文档和 CSV 下载入口](/assets/core/developing-apps/apis-and-services/catalog-web.png)

查看源码：[Web 路由](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/catalog-web.ts)、[公开读取策略与查询服务](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/providers/catalog-service.ts)。

### 重定向到其他地址

在同一 Web 路由中使用 `c.redirect()`：

```ts
router.get('/old-catalog', (c) => c.redirect('/catalog', 302));
```

访问 `/shop/old-catalog`，响应为 `302`，`Location` 为 `/shop/catalog`，浏览器随后打开目录页。示例所用运行时会给以 `/` 开头的应用内重定向补上应用基础路径；绝对外部 URL 不会被改写。不要直接把未经检查的用户输入作为跳转目标。

可用 `curl -i "$APP_URL/old-catalog"` 检查状态码和 `Location`，其中 `APP_URL` 包含应用基础路径，末尾不带 `/`。完整处理器见[Web 路由源码](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/catalog-web.ts)。

### 返回文件与提供下载

下载同样是 Web 路由。下面的处理器位于已经接入认证和授权中间件的路由内，`productPolicy()` 取得本次请求允许读取的数据范围：

```ts
router.get('/catalog/export.csv', async (c) => {
  const policy = await productPolicy(c, 'view');
  const records = await service.repository(policy).findMany({
    limit: 500,
    sort: (s) => s.field('name').asc(),
  });
  // 完整示例将允许的字段转换为 CSV，并处理引号、换行和公式前缀。
  const csv = toCsv(records);
  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', 'attachment; filename="products.csv"');
  c.header('Cache-Control', 'private, no-store');
  return c.body(csv);
});
```

这里的 `toCsv` 是[示例自己的 CSV 转换函数](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/catalog-web.ts)，不是框架 API。`Content-Type` 描述内容，`Content-Disposition: attachment` 让浏览器以文件下载。

先在同一应用登录有查看权限的账号，再点击目录页的 **Download CSV**，应下载 `products.csv`。它包含最多 500 条该账号有权查看的商品，可包含草稿；公开目录的“仅已发布”策略与管理员导出的数据范围不同。未登录直接请求下载地址返回 `401`，已登录但没有查看权限返回 `403`。

这个示例在内存中生成小文件。较大的导出需要分批读取或流式响应，不能直接移除上限后一次加载全部记录。

## 编写自定义 API

以下处理器位于 `server/routes/products.ts` 的 `defineApiRoutes()` 工厂内。工厂解析认证、授权和商品服务，并注册错误处理；`service` 是商品服务，`productPolicy(c, action)` 返回当前操作的数据库策略。它们是示例代码，完整接入见[商品 API 源码](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/products.ts)。

路由工厂使用 `defineApiRoutes()`；以下是框架接入骨架，认证、处理器和示例辅助函数的完整导入见上述源码：

```ts
import { Hono } from 'hono';
import type { Application } from '@nocobase/app-server/application';
import { defineApiRoutes } from '@nocobase/app-server/router';
import { catalogServiceToken } from '../providers/catalog.js';
import {
  catalogErrorHandler, type CatalogEnv,
} from './catalog-access.js';

export default defineApiRoutes<Application>((app) => {
  const router = new Hono<CatalogEnv>();
  const service = app.container.resolve(catalogServiceToken);
  router.onError(catalogErrorHandler);
  // Register path-scoped authentication and the handlers below here.
  return new Hono().route('/', router);
});
```

### 读取查询参数与返回列表

使用 `apiValidator('query', schema)` 校验查询参数，通过 `c.req.valid('query')` 读取转换后的值：

```ts
const Query = z.strictObject({
  q: z.string().max(100).default(''),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

router.get('/products',
  describeRoute({
    tags: ['Products'], summary: 'List products', operationId: 'listProducts',
    responses: { 200: listResponse(Product), ...apiErrorResponses },
  }),
  apiValidator('query', Query),
  async (c) => c.json(await service.list(
    await productPolicy(c, 'view'), c.req.valid('query'),
  )),
);
```

登录后在 API 文档执行 `GET /products?q=Desk&page=1&pageSize=10`，应得到 **Desk Lamp**，响应包含 `data` 和 `meta.page`、`meta.pageSize`、`meta.total`。列表和总数必须使用相同的数据策略及筛选条件；否则总数可能泄露无权查看的记录数量。`pageSize=51` 会返回 `400`。

查看源码：[列表处理器](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/products.ts)、[分页查询](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/providers/catalog-service.ts)。

### 读取路径参数与返回详情

Hono 在代码中使用 `:id` 声明路径参数，OpenAPI 显示为 `{id}`：

```ts
router.get('/products/:id',
  describeRoute({
    tags: ['Products'], summary: 'Get a product', operationId: 'getProduct',
    responses: { 200: dataResponse(Product), ...apiErrorResponses },
  }),
  apiValidator('param', z.object({ id: z.uuid() })),
  async (c) => c.json({ data: await service.get(
    await productPolicy(c, 'view'), c.req.valid('param').id,
  ) }),
);
```

从列表取得商品 ID，再调用 `GET /products/{id}`，应返回 `{ data: 商品 }`。本例生成 UUID，因此使用 `z.uuid()`；这不是所有应用记录 ID 的固定格式。无效 UUID 返回 `400`；合法 ID 对应的商品不存在或不在当前读取范围内时，统一返回 `404`。

查看源码：[详情处理器](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/products.ts)。

### 校验请求体与创建记录

创建商品只接受名称和以分为单位的价格，发布状态由服务端确定：

```ts
const Values = z.strictObject({
  name: z.string().trim().min(1).max(100),
  priceCents: z.number().int().min(0).max(100000000),
});
```

路由把它传给 `apiValidator('json', Values)`，处理器读取 `c.req.valid('json')`。在 API 文档执行 `POST /products`，提交：

```json
{ "name": "Travel Notebook", "priceCents": 1200 }
```

同时填写 `Idempotency-Key` 请求头，格式为 `<13 位毫秒时间戳>.<UUID v4>`。可在应用目录生成一个新的操作标识：

```bash
node -e 'console.log(`${Date.now()}.${require("node:crypto").randomUUID()}`)'
```

成功返回 `201`，`data` 包含新商品的 `id`、`name`、`priceCents` 和 `published: false`。额外提交 `published`、空名称或负价格均返回 `400`，不创建记录。`strictObject()` 拒绝未声明的字段；`describeRoute()` 的响应声明本身不会过滤实际返回值。

本例显式使用 `executeIdempotentMutation()`，让创建与回执写入同一事务。同一操作因响应丢失而重试时复用原来的标识和输入；成功重放带有 `Idempotency-Replayed: true`，不会再创建商品。有意新建另一条记录时使用新标识。普通自定义 POST 不会仅因带上该请求头就自动具备这种保障。

查看源码：[创建处理器与回执接入](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/products.ts)。输入与错误约定见[请求校验与响应处理](../framework/http/validation.md)。

### 调用业务服务

业务规则放在 `server/providers/`，通过 Provider 注册服务，再在路由工厂中解析一次：

```ts
const service = app.container.resolve(catalogServiceToken);
```

本例 `POST /products/{id}/publish` 的核心调用是：

```ts
const policy = await productPolicy(c, 'publish');
const id = c.req.valid('param').id;
// 在 executeIdempotentMutation 的 execute(transaction) 中执行：
return service.publish(policy, id, transaction);
```

路由负责 HTTP 输入、身份、授权和响应；服务负责检查商品是否存在、是否已发布，并使用传入的策略和事务连接更新记录。它不读取 Hono Context，也不决定 HTTP 状态码。

用新操作标识和空请求体 `{}` 发布刚创建的商品，应返回 `200` 和 `published: true`；刷新公开目录可看到它。同一操作标识的重试返回原结果；用新标识再次发布同一商品返回 `409 PRODUCT_ALREADY_PUBLISHED`。服务中的条件更新保留预期状态，避免并发请求都把同一草稿当作首次发布。

查看源码：[Provider 与 token](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/providers/catalog.ts)、[商品服务](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/providers/catalog-service.ts)、[发布路由](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/products.ts)。服务生命周期见[ServiceProvider](../extension-development/service-provider.md)，事务边界见[事务与数据一致性](transactions-and-consistency.md)。

## 使用 Repository 数据接口

### 配置集合与开放操作

`defineRepositoryApiRoutes()` 适合单个集合的标准操作，不负责创建表或生成管理页面。先通过迁移准备 `catalogCategories`，再声明：

```ts
import { defineRepositoryApiRoutes } from '@nocobase/app-server/router';

export default defineRepositoryApiRoutes({
  repositories: [{
    name: 'publicCategories',
    collection: 'catalogCategories',
    actions: { findMany: { maxLimit: 50 }, findOne: {}, count: {} },
    policy: {
      read: { scope: true, fields: ['id', 'title'] },
      create: false, update: false, delete: false,
    },
  }],
});
```

`name` 是 HTTP 暴露名称，`collection` 是数据库集合名。只有 `actions` 中列出的操作会注册；例如此处的 `createOne` 路由不存在。查询也使用 POST：`POST /api/publicCategories/findMany`。

查看源码：[分类接口](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/categories.ts)、[数据迁移](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/database/main/migrations/202610310001_create_catalog.ts)。

### 限制数据范围与可用字段

`actions` 决定开放哪些操作，`policy` 决定这些操作允许访问的记录、字段和写入能力，两者都要配置。

上述策略允许匿名读取全部分类，但只返回 `id` 和 `title`。数据库中的 `internalNote` 不应出现在响应中，客户端不能通过查询条件扩大服务器允许的范围。`findMany.maxLimit: 50` 限制单次返回数量，请求 `limit: 51` 返回 `400`。

实际业务需要按身份或业务角色授权时，接入身份解析和动态策略；完整参数及权限插件接入见[Repository 数据接口](../framework/http/repository-routes.md)。

### 使用 API Client 和 HTTP 调用

在 React 页面通过 `useApiClient()` 取得客户端，然后传给普通函数：

```ts
import type { ApiClient } from '@nocobase/app-client';

type Category = { id: string; title: string };
export async function loadCategories(api: ApiClient) {
  return api.repository<Category>('publicCategories').findMany({ limit: 20 });
}
```

返回值直接是分类数组，远程 Repository 已解开 `{ data }` 包装。原始 HTTP 调用则保留该包装：

```bash
curl "$APP_URL/api/publicCategories/findMany" \
  -H 'Content-Type: application/json' \
  -d '{"limit":20}'
```

```json
{ "data": [
  { "id": "office", "title": "Office" },
  { "id": "travel", "title": "Travel" }
] }
```

未指定排序时不要依赖数组顺序。同一客户端的 `count()` 返回数量，`findOne()` 返回一条记录或 `undefined`。客户端封装见 [loadCategories](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/client/catalog-api.ts)。示例的[接口测试](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/tests/server/catalog.test.ts)也用真实 API Client 调用已注册的接口；前端请求状态管理见[数据请求与状态](data-requests-and-state.md)。

## 保护路由与处理错误

### 接入认证与业务授权

挂在 `/api` 下不代表已认证。每个路由模块应保护自己拥有的路径，避免依赖其他模块的注册顺序，或使用全局通配中间件意外拦截公开路由。

```ts
const auth = app.container.resolve(authenticationToken);
const authz = app.container.resolve(authorizationToken);
for (const path of ['/products', '/products/*']) {
  router.use(path, auth.required({ scopedKeys: false }), authz.middleware());
}
```

认证确定调用者，授权判断其是否可以执行 `view`、`create` 或 `publish`，数据库策略再约束记录和字段。下载入口同样使用认证与 `view` 策略。此示例的管理操作使用登录会话，不接受 scoped API keys。

安装会创建 **Catalog viewer** 和 **Catalog editor** 两个角色，不自动分配给普通用户。管理员在 **Users** 中显式分配角色，在 **Permission management** 中调整操作与数据范围。页面访问权限不代替接口授权。

查看源码：[操作权限声明](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/catalog-resource.ts)、[请求授权](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/catalog-access.ts)、[初始角色](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/database/main/seeds/202610310001_catalog_roles.ts)。

### 处理非法输入与业务错误

使用 `ApiError` 表达 HTTP 错误，并交给 `apiErrorHandler()`；不要在各接口手写不同的错误 JSON。示例将服务错误转换为标准 API 错误：

```ts
new ApiError({
  status: 'NOT_FOUND',
  reason: 'PRODUCT_NOT_FOUND',
  domain: 'catalog',
  message: 'Product not found.',
});
```

| 场景 | 响应 |
| --- | --- |
| 未登录请求商品 API 或下载 | `401` |
| 已登录但没有操作权限 | `403` |
| 非法输入 | `400`，校验错误包含字段信息 |
| 商品不存在或不在允许范围内 | `404 PRODUCT_NOT_FOUND` |
| 使用新操作标识再次发布已发布商品 | `409 PRODUCT_ALREADY_PUBLISHED` |

调用方按状态和 `reason` 判断错误，不解析 `message` 文本。完整映射见[错误处理器](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/catalog-access.ts)。Web 路由不强制返回 API 格式；本例下载失败复用标准 JSON 错误，HTML 页面也可以按需要提供自己的错误页。

### 避免路径冲突

同一方法和路径只应有一个明确的处理器。框架会检查重复的 API 路由并在启动时报告；不要依赖注册先后来覆盖已有接口。Web 路由也要避开 `/api`、静态资源路径及前端页面路径；不要使用兜底通配路由吞掉其他入口。

本例将 HTML 页面放在 `/catalog`，业务 API 放在 `/api/products`，保留 `/` 给应用前端。接口文档与测试可以核对实际注册结果，见[接口测试](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/tests/server/catalog.test.ts)。

## 生成与使用 API 文档

### 声明输入、响应与错误

自定义 API 用 `describeRoute()` 声明稳定的 `operationId`、分组、用途和响应，输入由 `apiValidator()` 的 schema 提供。`dataResponse()` 和 `listResponse()` 分别描述单条与列表响应；它们不执行数据库查询，也不替代运行时校验。

Repository 接口根据集合和已开放操作生成描述。Web 路由不在 API 文档中，需要像前面那样直接访问或发送 HTTP 请求检查。

查看源码：[API 声明](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/products.ts)。修改响应字段时，同时更新实际返回值和响应 schema。

### 使用交互文档发送请求

在应用登录后，访问 `<应用入口>/api/swagger/docs#/Products` 可直达商品分组。JSON 描述位于 `<应用入口>/api/swagger`，两者都需要有权访问的会话或凭证。

展开 **Products** 中的操作，点击 **Try it out**，填写参数和请求体，再点击 **Execute**。创建和发布操作还需要前面说明的 `Idempotency-Key`。成功创建后，复制响应中的商品 ID，用于详情查询和发布。

![交互 API 文档中的 Products 分组，包含列表、创建、详情与发布接口](/assets/core/developing-apps/apis-and-services/catalog-api.png)

## 验证路由与接口

### 检查响应与数据变化

使用示例的初始数据依次检查：

1. 匿名访问 `/catalog`，确认只显示已发布商品；访问 `/old-catalog`，确认跳转后仍在同一应用基础路径下。
2. 匿名调用分类的 `findMany`，确认返回分类名称且没有 `internalNote`。
3. 登录有管理权限的账号，在 API 文档创建商品；确认返回 `201`、详情可读取，而公开目录尚不显示它。
4. 发布该商品，确认返回 `200`，刷新目录后出现。重放原操作不会重复执行；新操作再次发布返回 `409`。
5. 下载 CSV，检查文件名、内容和当前用户可查看的数据范围。

### 验证访问限制与失败场景

换用普通账号检查：没有角色时商品 API 和下载被拒绝；仅有查看权限时可以查询和下载，不能创建或发布。限制其商品范围后，列表、总数、详情和下载都必须遵守该范围。

还应确认非法输入不创建记录、范围外详情不泄露商品、撤销权限后下一次请求被拒绝。运行示例的自动化检查：

```bash
pnpm exec vitest run tests/server/catalog.test.ts tests/database/catalog.test.ts tests/server/authorization-assignment-safety.test.ts
```

测试启动真实应用，使用隔离数据库和真实登录，覆盖上述边界、迁移回滚与重新应用、回执重放及 API 文档。浏览器检查与截图的运行方式见[示例 README](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/README.md)。

## 示例源码与运行

[Product Catalog 完整源码](https://github.com/nocobase/docs-examples-v3/tree/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog)包含三类路由、商品服务、数据迁移、英文演示数据、权限配置和测试。

示例使用默认模板 `1.0.0-beta.85`，需要 Node.js 24 或更高版本及 pnpm 11.7.0。锁文件固定本例使用的依赖；安装配置、各用法与源码的对应关系见 [README](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/README.md)。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 0639e6a2a6cba857bf967757083e9f8d7aa6b9fe
cd apps/product-catalog
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
APP_SAMPLE_DATA=true pnpm dev
```

这里使用 SQLite 运行示例，并非 HTTP 路由对数据库的要求。首次启动前按本地 `config.yml` 的 `users.initialAdmin` 配置管理员，使用启动日志中的完整应用地址登录。`APP_SAMPLE_DATA=true` 在首次安装时写入示例商品和分类；后续启动不会覆盖已修改的数据。若首次安装没有启用示例数据，可在开发环境运行 `pnpm nocobase db sample` 补充。

在应用地址后追加 `/catalog` 查看公开目录，追加 `/api/swagger/docs` 操作 API。实际保存的商品会在刷新和重启后保留。
