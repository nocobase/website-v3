---
title: API 参考
description: 速查 NocoBase 3 常用的公开入口、服务容器、HTTP 客户端、配置与数据库接口。
---

本页按调用场景列出常用的公开 API、返回值和使用约束。完整的参数、重载和辅助类型，以所安装版本的类型声明为准；数据库的专题参考列在本页末尾。应用的开发过程见 [应用开发概览](../developing-apps/overview.md)；按机制学习，见 [框架概览](../framework/overview.md)；数据库的建模、查询与事务用法，见 [数据库概览](../framework/database/overview.md)。

## 公开导入入口

| 入口 | 常用导出 | 用途 |
| --- | --- | --- |
| `@nocobase/app-client` | `createApp`、`defineClientPlugin`、`defineAppRoutes`、`useService`、`useApiClient` | 客户端的组装、路由、服务与请求 |
| `@nocobase/app-server` | `defineServerPlugin`、`defineServerPlugins` | 声明服务端插件 |
| `@nocobase/app-server/router` | `defineApiRoutes`、`defineRepositoryApiRoutes`、`defineRootRoutes`、`defineHttpMiddleware`、`apiValidator`、`ApiError` | HTTP 接口、校验与错误 |
| `@nocobase/app-server/config` | `defineAppConfig`、`defaultAppConfigs`、`envString`、`envInteger`、`envBoolean` | 定义服务端配置，映射环境变量 |
| `@nocobase/service-provider` | `ServiceProvider`、`ServiceContainer`、`createServiceToken` | 前后端的服务容器与生命周期 |
| `@nocobase/api-client` | `createApiClient`、`ApiClientError` | 独立使用的 HTTP 客户端 |
| `@nocobase/db` | `createDatabaseManager`、`databaseManagerToken` | 数据库管理与应用的数据库服务 |

包的源码目录与 npm 的导出入口不一定相同。请使用 `package.json` 中声明的公开入口，不要从依赖的 `src/` 或私有的构建文件中导入。各个包的用途见 [核心包与工具包索引](packages.md)。

## 服务容器与依赖注入

客户端和服务端使用同一套服务容器的概念，各自在自己的运行时中注册和解析实例。

| API | 作用与返回值 |
| --- | --- |
| `createServiceToken<T>(name)` | 创建一个带类型的服务标识 |
| `container.instance(token, value)` | 注册已有的实例，返回 `void` |
| `container.singleton(token, factory)` | 注册同步工厂，首次解析时创建并缓存实例 |
| `container.resolve(token)` | 返回服务；未注册或存在循环依赖时抛出错误 |
| `container.has(token)` | 检查是否已经注册 |
| `container.resolveIfCreated(token)` | 读取已经创建的实例，不会触发创建；可能返回 `undefined` |
| `ServiceProvider.register()` | 同步注册服务 |
| `boot()`、`start()`、`ready()`、`shutdown()` | Provider 的异步生命周期钩子 |

```ts
import { createServiceToken, ServiceContainer } from '@nocobase/service-provider';

interface GreetingService {
  greet(name: string): string;
}

const greetingToken = createServiceToken<GreetingService>('example.greeting');
const services = new ServiceContainer();
services.singleton(greetingToken, () => ({
  greet: (name) => `Hello, ${name}`,
}));

const message = services.resolve(greetingToken).greet('NocoBase');
// Hello, NocoBase
```

同一个容器不能重复绑定同一个 Token。用相同的名称重新创建的 Token，也不是原来那个 Token；使用方应导入服务提供方公开的原始 Token。`singleton` 的工厂是同步的，需要异步初始化时，请在生命周期钩子中完成。

在应用中，请使用运行时已有的容器：客户端的 React 组件通过 `useService(token)` 取得服务，服务端通常通过 `app.container.resolve(token)` 取得服务。React Provider 负责组件树的上下文，与这里的 ServiceProvider 不是一回事。注册示例和执行顺序见 [ServiceProvider 与服务生命周期](../extension-development/service-provider.md)。

## 客户端请求

在应用的 React 组件中，调用 `useApiClient()` 取得已经配置好的客户端；独立调用的场景，可以使用 `@nocobase/api-client` 中的 `createApiClient({ baseURL })`，并把这个包声明为直接依赖。应用客户端也重新导出了这些接口和类型。

| API | 返回值与约束 |
| --- | --- |
| `api.request<T>(options)` | `Promise<T>`；返回解析后的完整响应体 |
| `api.stream(options)` | `Promise<ReadableStream<Uint8Array>>` |
| `api.repository(name)` | 面向服务端 Repository 接口的远程客户端 |
| `ApiClientError` | HTTP 请求失败时的结构化错误，可以读取状态码等信息 |

请求选项包括 `path`、`method`、`query`、`headers`、`signal` 和 `credentials`。JSON 请求体使用 `json`，其他请求体使用 `body`，两者不能同时设置。默认的方法是 `GET`，默认的凭证模式是 `include`。

```ts
import type { ApiClient } from '@nocobase/app-client';

type Announcement = { id: string; title: string };

export async function loadAnnouncements(api: ApiClient) {
  const response = await api.request<{ data: Announcement[] }>({
    path: '/announcements',
    method: 'GET',
    query: { limit: 20 },
  });
  return response.data;
}
```

示例假设应用已经提供了一个返回 `{ data: [...] }` 的公告接口。`request()` 不会自动去掉 `data` 包装，TypeScript 泛型也不会验证响应的内容。远程的 `repository()` 需要服务端提供相应的接口；创建数据库表并不会自动开放 HTTP 数据接口。请求的身份、输入校验和数据权限，仍然由服务端处理。

## 服务端 HTTP

| API | 用途 |
| --- | --- |
| `defineApiRoutes(createRouter)` | 声明挂载在应用 API 前缀下的 Hono 路由 |
| [`defineRepositoryApiRoutes({ repositories, principal? })`](../framework/http/repository-routes.md) | 按 Collection、actions 和策略声明 Repository 数据接口 |
| `defineRootRoutes(createRouter)` | 声明挂载在应用根路径下的路由 |
| `defineHttpMiddleware({ name, register })` | 注册命名的 HTTP 中间件 |
| `apiValidator(target, schema)` | 校验请求输入 |
| `ApiError` | 抛出框架能够识别的 API 错误 |

路由工厂接收应用实例，返回 Hono Router；声明还需要通过应用或插件的扩展入口接入。普通应用的 API 前缀为 `/api`；有应用基础路径时，还要同时考虑这个前缀。

OpenAPI 描述相关的辅助函数请从 `@nocobase/app-server/router` 导入，避免混用另一份依赖副本中的元数据注册表。启用访问检查后，可以通过应用的 `/api/swagger` 和 `/api/swagger/docs` 查看文档页面和描述文件；在默认模板中，访问它们仍然要经过身份和权限检查。这两个入口并不是默认向匿名用户开放的接口目录。

完整示例见 [路由与 HTTP 接口](../developing-apps/apis-and-services.md)，以及插件开发中的 [路由与 HTTP 接口](../extension-development/server-apis.md)。

## 配置

| API | 用途 |
| --- | --- |
| `defineAppConfig({ defaults, env, validate, public })` | 定义一个服务端配置分区及其规则 |
| `defaultAppConfigs({ section: factory })` | 组合多个配置分区 |
| `config.get<T>(key)` | 按路径读取配置，可能返回 `undefined` |
| `config.reload()` | 重新加载配置；服务如何使用新值，仍需调用方处理 |

`public` 声明的是允许浏览器读取的叶子路径，相对于当前的配置分区。服务端配置不会因为存在同名的客户端配置文件，就自动公开。覆盖顺序、示例和环境变量见 [配置项参考](configuration.md)。

## 数据库管理

在应用中，优先解析现有的 `databaseManagerToken`。只有独立的工具或测试，才自行创建并释放 DatabaseManager。

| API | 返回值与用途 |
| --- | --- |
| `createDatabaseManager(config)` | 创建数据库管理器 |
| `db.connection(name?)` | 获取连接对象；省略名称时使用默认连接 |
| `db.connect(name?)` | 异步建立连接，返回连接对象 |
| `db.builder(name?)` | 获取 CollectionBuilder |
| `db.query(name?)` | 获取 QueryAdapter |
| `db.collections(name?)` | 获取 Collection 的注册与诊断接口 |
| `db.repository(collection, connection?)` | 获取指定逻辑 Collection 的 Repository |
| `db.transaction(callback, name?)` | 在事务连接上执行回调，返回回调的结果 |
| `db.destroy()` | 释放管理器占用的数据库资源 |

`db.builder()` 是一个方法，而连接对象上的 `connection.builder` 是一个属性。`CollectionBuilder` 只作为类型导出，实例应通过数据库取得，不要直接 `new CollectionBuilder()`。

## Repository 的返回值

| 方法 | 返回值与重要行为 |
| --- | --- |
| `findMany(options?)` | 惰性的 `RepositoryQuery`；`await` 后得到记录数组，也可以异步逐条迭代 |
| `findOne(options)` | 单条记录或 `undefined`；不能证明筛选条件是唯一的 |
| `count(options?)`、`exists(options?)` | 记录数量、是否存在 |
| `createOne({ values, ... })` | 单条变更结果，记录从 `.record` 中取得 |
| `updateOne({ filter, values, ... })` | 单条变更结果；找不到记录或命中多条记录时失败 |
| `upsertOne({ filter, create, update, ... })` | 单条变更结果；筛选条件必须能唯一定位记录 |
| `deleteOne({ filter, ... })` | 删除结果；需要返回记录时，请明确设置 `select` |
| `createMany`、`updateMany`、`deleteMany` | 批量变更结果，包含数量以及按选项返回的记录 |

不要对 `findMany()` 的同一个查询对象混用 `await` 和异步迭代，也不要重复消费它。批量修改和删除需要提供筛选条件，或者显式使用 `all: true` 表示全量操作。

`context` 是查询变量的上下文，而不是事务句柄。在事务中，请通过回调参数提供的连接取得 Repository，不能继续使用外层普通连接上的 Repository，并假设它参与了事务。Builder 的 `transaction()` 目前也不表示开启了数据库事务。

Repository 不会自动推断当前的 HTTP 用户。需要行级和字段级权限时，从授权结果中取得策略，并使用 `withPolicy()`；用户提供的过滤条件不是授权策略。业务示例见 [查询与操作数据](../developing-apps/querying-data.md)。

## 完整声明与数据库专题

- [数据库 API 总目录](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/README.md)
- [公开导出清单](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/exports.md)
- [DatabaseManager](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/database-manager.md)
- [连接与方言契约](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/connection.md)
- [迁移与初始数据](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/migration-and-seed.md)
- [Collection、字段、关系与元数据](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/collection-and-schema.md)
- [Query](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/query.md)
- [Repository](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/repository.md)
- [权限策略](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
- [事务](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/transactions.md)
- [数据库事件](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/events.md)
- [测试工具](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/testing.md)

以上链接固定在 Core 源码的修订 `015404ecd0db`（2026-10-26），包含完整的签名、导出边界和已知限制。客户端、HTTP 和配置入口，可以通过 [核心包与工具包索引](packages.md) 定位到同一个源码版本。实际开发时，请同时检查锁文件和编辑器中显示的本地类型；不同的包并不共用同一个版本号。

本页中服务容器、请求和配置的示例都已通过类型检查和实际执行的验证；另外还在 SQLite 内存库中核对了单条变更的返回值、查询和事务回滚。验证使用的是默认模板 beta.83 已安装的依赖，没有连接外部数据库。
