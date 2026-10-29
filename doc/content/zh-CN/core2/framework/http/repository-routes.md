---
title: Repository 数据接口
description: 用 defineRepositoryApiRoutes() 把指定 Collection 的 Repository 操作声明为 HTTP 接口，并配置启用的操作、访问策略、身份与业务授权。
---

`defineRepositoryApiRoutes()` 把指定 Collection 的 Repository 操作声明为 HTTP 接口。客户端通过 `api.repository(name)` 调用；服务端负责解析查询输入、执行策略约束、调用 Repository，并返回统一格式的结果。应用和插件使用同一种声明方式。

公开入口是 `@nocobase/app-server/router`，当前的导出名称为 `defineRepositoryApiRoutes`。数据库一侧的操作语义见 [Repository 与数据操作](../database/repositories.md)。

## 什么时候使用

| 需求 | 选择 |
| --- | --- |
| 单个 Repository 操作就能完成的列表、详情或字段编辑 | Repository 数据接口，并配置访问策略 |
| 查询或修改涉及已存储的业务状态、多个权限范围或额外的副作用 | 自定义路由和业务服务 |
| 只在服务端内部访问数据 | 直接调用数据库 Repository |

例如，修改个人笔记的标题适合使用这种接口；提交订单需要检查订单状态、库存并触发后续任务，应编写业务接口。同一个资源可以同时使用这两种方式，按具体操作选择即可。另见 [路由与 HTTP 接口](../../developing-apps/apis-and-services.md)。

## 声明并接入接口

下面的示例提供一个允许匿名读取的公开分类目录，只返回 `id` 和 `title`。示例假设已经有一个 `categories` Collection，包含自增数字 `id` 和字符串 `title`；请先参考 [数据表与字段](../database/schema.md) 和 [数据库迁移](../database/migrations.md) 准备好数据结构。

把声明保存为应用的 `server/routes/public-categories.ts`，或插件中的同类路由模块：

```ts
import { defineRepositoryApiRoutes } from '@nocobase/app-server/router';

export default defineRepositoryApiRoutes({
  repositories: [
    {
      name: 'publicCategories',
      collection: 'categories',
      actions: {
        findMany: { maxLimit: 50 },
        findOne: {},
        count: {},
      },
      policy: {
        read: { scope: true, fields: ['id', 'title'] },
        create: false,
        update: false,
        delete: false,
      },
    },
  ],
});
```

在应用中，把该模块的默认导出加入 `server/routes/index.ts` 中现有的路由数组；在插件中，把它加入 `defineServerPlugin()` 的 `routes` 数组，再把插件注册到目标应用。注意保留其他已有的路由。声明阶段不会执行查询，运行时才通过宿主容器中的 `databaseManagerToken` 取得数据库。

这个示例有意公开分类目录；涉及用户、订单等业务数据时，应先接入认证和业务授权。这个函数不会自动安装认证中间件，不会创建数据表，也不会公开未声明的 Collection。

| 配置 | 含义 |
| --- | --- |
| `name` | HTTP 暴露名称，也是 `api.repository(name)` 中使用的名称 |
| `collection` | 数据库中的逻辑 Collection 名称；省略时与 `name` 相同 |
| `connection` | 已配置的连接名称；省略时使用默认连接 |
| `actions` | 显式启用的操作，值为配置对象；`{}` 表示使用该操作的默认配置 |
| `policy` | 必填，完整的 Repository 策略，或根据请求身份生成策略的函数 |

`name` 使用以小写字母开头的 camelCase，例如 `salesOrders`。请避免重复的名称、与插件命名空间冲突，以及 `auth`、`healthz`、`swagger` 等保留名称。`collection` 是逻辑集合名，不是数据库中的物理表名。

## 启用哪些操作

| 操作 | 用途 |
| --- | --- |
| `findMany`、`findOne` | 查询列表、单条记录 |
| `count`、`exists` | 统计数量、判断是否存在 |
| `createOne`、`updateOne`、`deleteOne` | 单条创建、更新、删除 |
| `aggregate`、`groupBy` | 聚合、分组 |

只有出现在 `actions` 中的操作才会注册路由。上面的示例没有创建、修改和删除的路由。`createMany`、`updateMany`、`deleteMany` 和 `upsertOne` 目前不属于这个 HTTP 适配器支持的操作，即使数据库 Repository 支持它们，也不会自动开放。

`findMany.maxLimit` 同时决定默认返回的数量和允许的最大数量，默认值为 `100`。请求超出上限时返回 `400`，不会自动截断。请求 `limit: 0` 会返回空数组，不能用它表示不限数量。这个限制只适用于 `findMany`；聚合与分组需要另外考虑输入和计算的范围。

## 客户端与 HTTP 调用

React 页面通过 `useApiClient()` 取得已配置的 API Client，再传给普通函数或服务：

```ts
import type { ApiClient } from '@nocobase/app-client';

type Category = { id: number; title: string };

export async function loadCategories(api: ApiClient) {
  return await api.repository<Category>('publicCategories').findMany({
    select: (selection) => selection.fields('id', 'title'),
    limit: 20,
  });
}
```

这里的 `publicCategories` 是暴露名称，数据库中的 Collection 仍然叫 `categories`。这次调用会发送下面的请求；如果部署时有应用基础路径，请求地址中还要包含这个路径：

```http
POST /api/publicCategories/findMany
Content-Type: application/json

{
  "select": {
    "kind": "select",
    "version": 1,
    "root": { "kind": "selection", "fields": ["id", "title"], "includes": [] }
  },
  "limit": 20
}
```

所有操作都使用 `POST /api/{name}/{action}`，查询也不例外。成功的响应为 `{ data: result }`：

- `await findMany()` 直接返回记录数组，因为远程 Repository 已经解开了 `data` 包装；普通的 `api.request()` 则返回完整的响应体。
- `findOne()` 没有找到记录时，HTTP 返回 `{ data: null }`，远程客户端会把它转换为 `undefined`。
- `createOne()`、`updateOne()` 返回变更结果，记录本身从 `.record` 中取得。
- `deleteOne()` 返回 JSON 格式的删除结果，而不是 `204` 空响应。

远程查询同样支持查询输入构造器，客户端会先把它转换成可以传输的 JSON；不能在 HTTP 的 JSON 中直接传函数。`findMany()` 可以通过异步迭代读取 NDJSON 流；同一个查询对象只能消费一次，不能混用 `await` 和迭代。详见 [API Client](api-client.md) 和 [查询输入与构造器](../database/query-inputs.md)。

## 策略、身份与业务授权

`policy` 必须明确声明 `read`、`create`、`update`、`delete` 四项：设为 `false` 表示拒绝这一类操作；设为 `true` 表示允许这一类操作的全部能力；规则对象则用于限制数据范围、字段和关联。`actions` 决定路由是否存在，`policy` 决定存在的路由可以操作什么。

规则中的 `fields` 是字段白名单，省略并不表示允许全部字段。关联操作也需要显式的规则。读取策略同样会约束写入之后返回的记录。客户端提交的 `filter` 不能扩大服务端的 `scope`，请求体中也不能提交 `policy` 或 `scope`。

个人笔记可以使用根据身份生成的策略。下面假设 `notes` 已有 `id`、`title`、`ownerId` 字段，其中 `ownerId` 是字符串形式的用户标识：

```ts
import {
  defineRepositoryApiRoutes,
  type DefineRepositoryApiRoutesOptions,
} from '@nocobase/app-server/router';

type Principal = { userId: string };
type ResolvePrincipal = NonNullable<
  DefineRepositoryApiRoutesOptions<Principal>['principal']
>;

export function createNoteRoutes(resolvePrincipal: ResolvePrincipal) {
  return defineRepositoryApiRoutes<Principal>({
    principal: resolvePrincipal,
    repositories: [
      {
        name: 'myNotes',
        collection: 'notes',
        actions: { findMany: {}, createOne: {}, updateOne: {} },
        policy: ({ userId }) => ({
          read: { scope: { ownerId: userId }, fields: ['id', 'title'] },
          create: {
            scope: { ownerId: userId },
            fields: ['title'],
            defaults: { ownerId: userId },
          },
          update: { scope: { ownerId: userId }, fields: ['title'] },
          delete: false,
        }),
      },
    ],
  });
}
```

接入时，调用 `createNoteRoutes(resolvePrincipal)`，并注册它返回的路由声明。`resolvePrincipal` 由应用的认证集成提供，从已经验证的会话或身份上下文中取得 `userId`；不要从请求体或未经验证的请求头中读取。这个函数本身不负责登录验证。

使用动态策略时必须提供 `principal` 解析器；解析结果为 `null` 或 `undefined` 时会拒绝请求，返回 `403`。上面的示例只允许读写当前用户自己的笔记，创建时由服务端填充 `ownerId`，调用方只能提供 `title`。

需要由管理员配置角色、业务操作和数据范围时，再接入权限插件的 `authz.database.authorizeRepository()`。它根据暴露名称和操作的映射追加请求策略，与这里的策略取交集，不会放宽原有的字段或范围限制。认证应先执行，并覆盖所有需要保护的操作。插件的接入方式见页末“接口与实现”中的权限插件说明。

## 校验、错误与 API 文档

适配器要求请求体为 JSON，大小上限为 1 MiB，并按操作校验允许的输入选项；字段、查询 AST 和变更结构由 Repository 校验。业务需要的文本长度、状态检查和跨记录约束，仍然要显式实现；复杂的操作应使用自定义处理器。

错误统一使用 `{ error: ... }` 结构：非法输入通常返回 `400`，被策略拒绝返回 `403`，记录不存在返回 `404`，版本冲突或单条操作的记录数冲突返回 `409`；请求内容不是 JSON 时返回 `415`，请求体过大时返回 `413`。具体的业务处理应结合 `status` 和 `reason` 判断，见 [请求校验与响应处理](validation.md)。

已启用的 Repository 接口会根据 Collection 和操作生成 OpenAPI 描述。可选的 `computedFields` 只用于描述响应中额外的只读字段，既不会计算字段，也不会修改响应。API 描述不能代替每次请求时的权限检查。

## 接口与实现

- [Repository route declarations and implementation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/repository-routes.ts)
- [Repository route contract tests](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/tests/repository-routes.test.ts)
- [Remote Repository client](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/api-client/README.md)
- [Authorization plugin integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authorization/skills/nocobase-app-plugin-authorization/references/repository-routes.md)
