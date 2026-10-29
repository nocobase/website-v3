---
title: 数据库概览
---

`@nocobase/db` 提供逻辑数据模型、数据读写、结构演进与事务。方言包负责连接具体数据库，应用运行时负责配置、资源发现和生命周期。

## 从哪个入口开始

| 入口 | 面向的问题 |
| --- | --- |
| DatabaseManager / Connection | 默认连接、命名连接、资源释放与事务 |
| CollectionBuilder | 表、字段、关系元数据、索引与结构变更 |
| Repository | 按逻辑模型读写、关联、字段编解码与策略 |
| Query | 面向表的查询、集合式回填和特殊报表 |
| Collections / SchemaInspector | 逻辑模型解析与物理结构检查 |
| Migrator / Seeder | 可追踪的结构历史与初始数据 |

业务代码通常从 Repository 开始。Migration 中用 Builder 演进结构、用 Query 做集合式回填。底层驱动提供的能力不自动成为各个方言都支持的公共能力。

## 在应用中取得数据库

```ts
import { databaseManagerToken } from '@nocobase/db';

// Inside a server route factory or ServiceProvider:
const database = app.container.resolve(databaseManagerToken);
const orders = database.repository('orders');
```

应用已配置数据库时复用现有服务。独立脚本和测试可以自行创建管理器，结束时必须销毁；详见[连接与方言](connections.md)。

## 应用与插件的接入边界

应用提供连接配置，并在 `database/<connection>/migrations/` 与 `seeds/` 中维护自己的资源。插件通常在 `database/migrations/` 与 `seeds/` 中提供资源，通过 `server/plugin.ts` 声明资源路径，再由宿主发现和执行。两者都使用 `defineMigration()`、`defineSeed()` 及其 context；资源放在哪个目录，不改变数据库操作的语义。

业务服务复用宿主 `DatabaseManager`，按需显式选择命名连接。插件不要在请求中创建连接，也不要在自己的关闭逻辑中销毁共享管理器。多连接之间的查询和事务边界需要明确设计，不能假定一个事务覆盖所有数据库。数据库操作在服务端执行，客户端通过 API 访问。

落地步骤见[建表与数据初始化](../../developing-apps/data-models-and-migrations.md)、[多个数据库连接](../../developing-apps/multiple-databases.md)和[插件数据库资源](../../extension-development/database-and-migrations.md)。本专题继续解释模型、操作、事务和资源执行机制。

## 逻辑模型与物理结构

Collection 由物理数据库结构和补充元数据共同解析。逻辑名可能与物理表列名不同；Repository 使用逻辑名；Query 按物理表列名工作，不读取 Collection 的字段映射或表前缀，编写回填时应明确目标名称。

关系、标题和其他元数据不能代替物理约束。生成的 `database/<connection>/collections/` 是模型快照，结构变更仍写 Migration。

## 本专题的示例

后续以订单为例：`orders` 包含 `id`、`orderNo`、`title`、`status`、`amount` 和 `customerId`；[数据表与字段](schema.md)创建基础模型，[关系与关联](relations.md)增加 `customers` 及双向关系。查询片段假设模型已经存在，且调用发生在完成授权的服务端代码中。

## 权限与演进

数据库服务不自动推断 HTTP 用户。数据策略从授权结果产生，再绑定到 Repository；查询筛选只能缩小请求范围，不能代替权限控制。

依次阅读结构、读写、关联、事务和迁移；精确签名见[数据库 API 索引](../../reference/api.md)。数据库版本与方言条件见[兼容性参考](../../reference/compatibility.md)。

## 接口与实现

- [Database concepts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/overview.md)
- [Database API](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/README.md)
