---
title: API 参考
description: NocoBase 3 常用公开入口、服务容器、HTTP 客户端、配置与数据库接口速查。
---

本页按调用场景列出常用公开 API、返回值和使用约束。完整参数、重载和辅助类型以所安装版本的类型声明为准；数据库的专题参考见本文末尾。应用开发过程见[开发应用](../developing-apps/overview.md)，共享机制见[框架功能](../framework/overview.md)。

按机制学习见[框架功能](../framework/overview.md)；数据库的建模、查询与事务用法见[数据库专题](../framework/database/overview.md)。

## 公开导入入口

| 入口 | 常用导出 | 用途 |
| --- | --- | --- |
| `@nocobase/app-client` | `createApp`、`defineClientPlugin`、`defineAppRoutes`、`useService`、`useApiClient` | 客户端组装、路由、服务与请求 |
| `@nocobase/app-server` | `defineServerPlugin`、`defineServerPlugins` | 服务端插件声明 |
| `@nocobase/app-server/router` | `defineApiRoutes`、`defineRepositoryApiRoutes`、`defineRootRoutes`、`defineHttpMiddleware`、`apiValidator`、`ApiError` | HTTP 接口、校验与错误 |
| `@nocobase/app-server/config` | `defineAppConfig`、`defaultAppConfigs`、`envString`、`envInteger`、`envBoolean` | 服务端配置定义与环境变量映射 |
| `@nocobase/service-provider` | `ServiceProvider`、`ServiceContainer`、`createServiceToken` | 前后端服务容器与生命周期 |
| `@nocobase/api-client` | `createApiClient`、`ApiClientError` | 独立 HTTP 客户端 |
| `@nocobase/db` | `createDatabaseManager`、`databaseManagerToken` | 数据库管理与应用数据库服务 |

包的源码目录与 npm 导出入口不一定相同。使用 `package.json` 中声明的公开入口；不要从依赖的 `src/` 或私有构建文件导入。包用途见[核心包与工具包索引](packages.md)。

## 服务容器与依赖注入

客户端与服务端使用同一组服务容器概念，各自在自己的运行时中注册和解析实例。

| API | 作用与返回值 |
| --- | --- |
| `createServiceToken<T>(name)` | 创建带类型的服务标识 |
| `container.instance(token, value)` | 注册已有实例，返回 `void` |
| `container.singleton(token, factory)` | 注册同步工厂，首次解析时创建并缓存实例 |
| `container.resolve(token)` | 返回服务；未注册或循环依赖时抛错 |
| `container.has(token)` | 检查是否注册 |
| `container.resolveIfCreated(token)` | 读取已经创建的实例，不触发创建；可能返回 `undefined` |
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

同一容器不能重复绑定同一个 Token。相同名称重新创建的 Token 也不是原来的 Token；消费者应导入服务提供方公开的原始 Token。`singleton` 工厂是同步的，需要异步初始化时在生命周期中完成。

应用中使用运行时已有的容器。客户端 React 组件通过 `useService(token)` 取得服务；服务端通常通过 `app.container.resolve(token)` 取得服务。React Provider 负责组件树的上下文，不等同于这里的 ServiceProvider。注册示例与执行顺序见 [ServiceProvider](../extension-development/service-provider.md)。

## 客户端请求

在应用 React 组件中调用 `useApiClient()` 取得已经配置的客户端；独立调用场景可从 `@nocobase/api-client` 使用 `createApiClient({ baseURL })`，并将该包声明为直接依赖。应用客户端也重新导出了这些接口与类型。

| API | 返回值 / 约束 |
| --- | --- |
| `api.request<T>(options)` | `Promise<T>`；返回解析后的完整响应体 |
| `api.stream(options)` | `Promise<ReadableStream<Uint8Array>>` |
| `api.repository(name)` | 面向服务端 Repository 接口的远程客户端 |
| `ApiClientError` | HTTP 请求失败的结构化错误，可读取状态等信息 |

请求选项包括 `path`、`method`、`query`、`headers`、`signal` 和 `credentials`。JSON 请求体使用 `json`，其他请求体使用 `body`，两者不能同时设置。默认方法是 `GET`，默认凭证模式是 `include`。

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

示例假设应用已经提供返回 `{ data: [...] }` 的公告接口。`request()` 不会自动去掉 `data` 包装，也不会由 TypeScript 泛型验证响应内容。远程 `repository()` 需要服务端提供匹配的接口；创建数据库表不会自动开放 HTTP 数据接口。请求身份、输入校验和数据权限仍由服务端处理。

## 服务端 HTTP

| API | 用途 |
| --- | --- |
| `defineApiRoutes(createRouter)` | 声明挂载到应用 API 前缀的 Hono 路由 |
| [`defineRepositoryApiRoutes({ repositories, principal? })`](../framework/http/repository-routes.md) | 按 Collection、actions 与策略声明 Repository 数据接口 |
| `defineRootRoutes(createRouter)` | 声明挂载到应用根路径的路由 |
| `defineHttpMiddleware({ name, register })` | 注册命名 HTTP 中间件 |
| `apiValidator(target, schema)` | 校验请求输入 |
| `ApiError` | 抛出框架可识别的 API 错误 |

路由工厂接收应用实例，返回 Hono Router；声明还需要通过应用或插件的扩展入口接入。普通应用的 API 前缀为 `/api`，有应用基础路径时须同时考虑该前缀。

OpenAPI 描述相关辅助函数从 `@nocobase/app-server/router` 导入，避免混用另一份依赖的元数据注册表。启用访问检查后，可通过应用的 `/api/swagger` 和 `/api/swagger/docs` 查看页面及描述文件；默认模板的访问仍受身份和权限检查约束。这两个入口不是默认向匿名用户开放的接口目录。

完整示例见[业务服务与 HTTP 接口](../developing-apps/apis-and-services.md)和[插件服务端接口](../extension-development/server-apis.md)。

## 配置

| API | 用途 |
| --- | --- |
| `defineAppConfig({ defaults, env, validate, public })` | 定义一个服务端配置分区及其规则 |
| `defaultAppConfigs({ section: factory })` | 组合配置分区 |
| `config.get<T>(key)` | 按路径读取配置，可能返回 `undefined` |
| `config.reload()` | 重新加载配置；调用方仍需处理服务如何使用新值 |

`public` 声明的是允许浏览器读取的叶子路径，相对于当前配置分区。服务端配置不会因为存在同名客户端配置文件就自动公开。覆盖顺序、示例与环境变量见[配置项参考](configuration.md)。

## 数据库管理

应用中优先解析现有 `databaseManagerToken`。独立工具或测试才自行创建并释放 DatabaseManager。

| API | 返回值 / 用途 |
| --- | --- |
| `createDatabaseManager(config)` | 创建数据库管理器 |
| `db.connection(name?)` | 获取连接对象；省略名称时使用默认连接 |
| `db.connect(name?)` | 异步连接，返回连接对象 |
| `db.builder(name?)` | 获取 CollectionBuilder |
| `db.query(name?)` | 获取 QueryAdapter |
| `db.collections(name?)` | 获取 Collection 注册与诊断接口 |
| `db.repository(collection, connection?)` | 获取指定逻辑 Collection 的 Repository |
| `db.transaction(callback, name?)` | 在事务连接上执行回调，返回回调结果 |
| `db.destroy()` | 释放管理器的数据库资源 |

`db.builder()` 是方法；连接对象上的 `connection.builder` 是属性。`CollectionBuilder` 仅作为类型导出，通过数据库取得实例，不要直接 `new CollectionBuilder()`。

## Repository 返回值

| 方法 | 返回值 / 重要行为 |
| --- | --- |
| `findMany(options?)` | 惰性 `RepositoryQuery`；`await` 得到记录数组，也可异步逐条迭代 |
| `findOne(options)` | 单条记录或 `undefined`；不证明筛选条件唯一 |
| `count(options?)`、`exists(options?)` | 数量 / 是否存在 |
| `createOne({ values, ... })` | 单条变更结果，从 `.record` 取得记录 |
| `updateOne({ filter, values, ... })` | 单条变更结果；找不到或命中多条记录时失败 |
| `upsertOne({ filter, create, update, ... })` | 单条变更结果；筛选必须满足唯一定位要求 |
| `deleteOne({ filter, ... })` | 删除结果；需要返回记录时明确设置 `select` |
| `createMany`、`updateMany`、`deleteMany` | 批量变更结果，含计数及按选项返回的记录 |

`findMany()` 的同一查询对象不要混合 `await` 和异步迭代，也不要重复消费。批量修改和删除需要筛选条件，或显式使用 `all: true` 表达全量操作。

`context` 是查询变量上下文，不是事务句柄。事务内从回调参数提供的连接取得 Repository，不能继续用外层普通连接的 Repository 来假定它参与事务。Builder 的 `transaction()` 当前也不代表开启数据库事务。

Repository 不会自动推断当前 HTTP 用户。需要行和字段权限时，从授权结果取得策略并使用 `withPolicy()`；用户提供的过滤条件不是授权策略。业务示例见[查询与操作数据](../developing-apps/querying-data.md)。

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

上述链接固定到 Core 源码修订 `015404ecd0db`（2026-10-26），包含完整签名、导出边界及已知限制。客户端、HTTP 与配置入口可在[核心包索引](packages.md)定位到同一源码版本。实际开发时同时检查锁文件和编辑器显示的本地类型；不同包不共用一个版本号。

本页服务容器、请求和配置示例已通过类型检查与执行验证；另在 SQLite 内存库核对了单条变更返回值、查询与事务回滚。使用默认模板 beta.83 的已安装依赖，未连接外部数据库。
