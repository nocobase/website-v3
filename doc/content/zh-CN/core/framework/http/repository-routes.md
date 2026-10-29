---
title: Repository 数据接口
---

`defineRepositoryApiRoutes()` 把指定 Collection 的 Repository 操作声明为 HTTP 接口。客户端通过 `api.repository(name)` 调用，服务端负责解析查询输入、执行策略约束、调用 Repository 并返回统一结果。应用和插件使用同一套声明方式。

公开入口是 `@nocobase/app-server/router`，当前导出名称为 `defineRepositoryApiRoutes`。数据库侧的操作语义见 [Repository 与数据操作](../database/repositories.md)。

## 什么时候使用

| 需求 | 选择 |
| --- | --- |
| 一个 Repository 操作即可完成的列表、详情或字段编辑 | Repository 数据接口，并配置访问策略 |
| 查询或修改涉及已存储的业务状态、多个权限范围、额外副作用 | 自定义路由与业务服务 |
| 仅在服务端内部访问数据 | 直接调用数据库 Repository |

例如，修改个人笔记的标题适合此接口；提交订单需要检查订单状态、库存和后续任务，应编写业务接口。同一资源可以同时使用两种方式，按操作选择。见[路由与 HTTP 接口](../../developing-apps/apis-and-services.md)。

## 声明并接入接口

下面提供一个允许匿名读取的公开分类目录，只返回 `id` 和 `title`。示例假设已有 `categories` Collection，包含自增数字 `id` 和字符串 `title`；先通过[数据结构与字段](../database/schema.md)和[迁移](../database/migrations.md)准备数据结构。

将声明保存为应用的 `server/routes/public-categories.ts`，或插件中的同类路由模块：

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

在应用中，把该模块的默认导出加入 `server/routes/index.ts` 现有的路由数组；在插件中，把它加入 `defineServerPlugin()` 的 `routes` 数组，再将插件注册到目标应用。保留其他已有路由。声明阶段不执行查询，运行时通过宿主容器中的 `databaseManagerToken` 取得数据库。

这个例子有意公开分类目录；涉及用户、订单等业务数据时，应先接入认证和业务授权。该函数不会自动安装认证中间件，也不会创建数据表或公开未声明的 Collection。

| 配置 | 含义 |
| --- | --- |
| `name` | HTTP 暴露名称，也是 `api.repository(name)` 使用的名称 |
| `collection` | 数据库逻辑 Collection 名称；省略时与 `name` 相同 |
| `connection` | 已配置的连接名称；省略时使用默认连接 |
| `actions` | 显式启用的操作，值是配置对象；`{}` 表示使用该操作的默认配置 |
| `policy` | 必填的完整 Repository 策略，或按请求身份生成策略的函数 |

`name` 使用以小写字母开头的 camelCase，例如 `salesOrders`。避免重复名称、插件命名空间冲突及 `auth`、`healthz`、`swagger` 等保留名称。`collection` 是逻辑集合名，不是物理表名。

## 启用哪些操作

| 操作 | 用途 |
| --- | --- |
| `findMany`、`findOne` | 列表、单条记录 |
| `count`、`exists` | 数量、是否存在 |
| `createOne`、`updateOne`、`deleteOne` | 单条写入、更新、删除 |
| `aggregate`、`groupBy` | 聚合、分组 |

只注册 `actions` 中出现的操作。上例没有创建、修改和删除路由；`createMany`、`updateMany`、`deleteMany` 和 `upsertOne` 当前不属于这个 HTTP 适配器的操作，即使数据库 Repository 支持它们，也不会自动开放。

`findMany.maxLimit` 同时控制默认数量和最大数量，默认是 `100`。超出上限返回 `400`，不会自动截断。请求 `limit: 0` 返回空数组；不能用它表达无限查询。此限制只适用于 `findMany`，聚合与分组应另行考虑输入和计算范围。

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

这里的 `publicCategories` 对应暴露名称，数据库 Collection 仍叫 `categories`。该调用发送以下请求；部署有应用基础路径时，还需包含该路径：

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

所有操作都使用 `POST /api/{name}/{action}`，包括查询。成功响应为 `{ data: result }`：

- `await findMany()` 直接返回记录数组，远程 Repository 已解开 `data` 包装；普通 `api.request()` 返回完整响应体。
- `findOne()` 未找到记录时，HTTP 返回 `{ data: null }`，远程客户端转换为 `undefined`。
- `createOne()`、`updateOne()` 返回变更结果，从 `.record` 取得记录。
- `deleteOne()` 返回 JSON 删除结果，而不是 `204` 空响应。

远程查询也支持查询输入构造器，客户端会先转换成可传输的 JSON；不能直接在 HTTP JSON 中传函数。`findMany()` 可使用异步迭代读取 NDJSON 流，同一个查询对象只消费一次，不能混用 `await` 与迭代。见 [API Client](api-client.md)和[查询输入与构造器](../database/query-inputs.md)。

## 策略、身份与业务授权

`policy` 必须明确声明 `read`、`create`、`update`、`delete` 四项。设为 `false` 拒绝该类操作；设为 `true` 表示允许该类操作的全部能力；规则对象用于限制数据范围、字段和关联。`actions` 控制路由是否存在，`policy` 控制存在的路由可以操作什么。

规则中的 `fields` 是字段白名单；省略不表示全部字段。关联操作也需要显式规则。读取策略同样约束写入后返回的记录。客户端提交的 `filter` 不能扩大服务端 `scope`，请求体也不能提交 `policy` 或 `scope`。

个人笔记可使用按身份生成的策略。下面假设 `notes` 已有 `id`、`title`、`ownerId` 字段，`ownerId` 是用户标识字符串：

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

接入时，调用 `createNoteRoutes(resolvePrincipal)` 并注册返回的路由声明。`resolvePrincipal` 由应用认证集成提供，从已验证的会话或身份上下文取得 `userId`；不要从请求体或未经验证的请求头读取它。此函数不会自行完成登录验证。

使用动态策略时必须提供 `principal` 解析器；解析结果为 `null` 或 `undefined` 时拒绝请求，返回 `403`。上例只允许读写当前用户的笔记，创建时由服务端填充 `ownerId`，调用方只能提供 `title`。

需要管理员配置的角色、业务操作与数据范围时，再接入权限插件的 `authz.database.authorizeRepository()`。它按暴露名称和操作映射追加请求策略，与此处策略取交集；不会放宽原有字段或范围限制。认证应先执行，并覆盖所有需要保护的操作。插件接入见页末的完整示例。

## 校验、错误与 API 文档

适配器要求 JSON 请求体，限制为 1 MiB，并按操作校验允许的输入选项；字段、查询 AST 与变更结构由 Repository 校验。业务所需的文本长度、状态检查、跨记录约束仍要显式实现，复杂操作应使用自定义处理器。

错误使用统一 `{ error: ... }` 结构：非法输入通常为 `400`，策略拒绝为 `403`，记录未找到为 `404`，版本或单条操作基数冲突为 `409`；非 JSON 内容为 `415`，请求体过大为 `413`。具体业务处理应结合 `status` 与 `reason`，见[请求校验与响应](validation.md)。

已启用的 Repository 接口会根据 Collection 和操作生成 OpenAPI 描述。可选的 `computedFields` 只描述响应中额外的只读字段，不会计算字段或修改响应。API 描述不能代替每次请求的权限检查。

## 接口与实现

- [Repository route declarations and implementation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/repository-routes.ts)
- [Repository route contract tests](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/tests/repository-routes.test.ts)
- [Remote Repository client](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/api-client/README.md)
- [Authorization plugin integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authorization/skills/nocobase-app-plugin-authorization/references/repository-routes.md)
