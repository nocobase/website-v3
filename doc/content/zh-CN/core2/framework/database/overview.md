---
title: 数据库概览
description: 了解 @nocobase/db 的主要入口、在应用中取得数据库的方式、应用与插件的接入边界，以及逻辑模型与物理结构的关系。
---

`@nocobase/db` 提供逻辑数据模型、数据读写、结构演进和事务。方言包负责连接具体的数据库，应用运行时负责配置、资源发现和生命周期。

## 从哪个入口开始

| 入口 | 解决的问题 |
| --- | --- |
| DatabaseManager / Connection | 默认连接、命名连接、资源释放与事务 |
| CollectionBuilder | 表、字段、关系元数据、索引与结构变更 |
| Repository | 按逻辑模型读写数据、处理关联、字段编解码与策略 |
| Query | 面向表的查询、集合式的数据回填和特殊报表 |
| Collections / SchemaInspector | 解析逻辑模型、检查物理结构 |
| Migrator / Seeder | 可追踪的结构变更历史与初始数据 |

业务代码通常从 Repository 开始。在 Migration 中，用 Builder 演进结构，用 Query 做集合式的回填。底层驱动提供的能力，并不会自动成为所有方言都支持的公共能力。

## 在应用中取得数据库

```ts
import { databaseManagerToken } from '@nocobase/db';

// Inside a server route factory or ServiceProvider:
const database = app.container.resolve(databaseManagerToken);
const orders = database.repository('orders');
```

应用已经配置了数据库时，请复用现有的服务。独立的脚本和测试可以自行创建管理器，但结束时必须销毁；详见 [连接与数据库方言](connections.md)。

## 应用与插件的接入边界

应用提供连接配置，并在 `database/<connection>/migrations/` 和 `seeds/` 中维护自己的资源。插件通常在 `database/migrations/` 和 `seeds/` 中提供资源，在 `server/plugin.ts` 中声明资源路径，再由宿主发现并执行。两者都使用 `defineMigration()`、`defineSeed()` 及其 context；资源放在哪个目录，不会改变数据库操作的语义。

业务服务复用宿主的 `DatabaseManager`，需要时显式选择命名连接。插件不要在请求中创建连接，也不要在自己的关闭逻辑中销毁共享的管理器。多个连接之间的查询和事务边界需要明确设计，不能假设一个事务能覆盖所有数据库。数据库操作在服务端执行，客户端通过 API 访问数据。

具体的操作步骤见 [建表与数据初始化](../../developing-apps/data-models-and-migrations.md)、[多数据库连接](../../developing-apps/multiple-databases.md) 和 [数据库资源与迁移](../../extension-development/database-and-migrations.md)。本专题接下来解释模型、数据操作、事务以及资源的执行机制。

## 逻辑模型与物理结构

Collection 由数据库的物理结构和补充的元数据共同解析而来。逻辑名可能与物理的表名、列名不同：Repository 使用逻辑名；Query 按物理的表名和列名工作，不会读取 Collection 的字段映射或表前缀，因此编写回填时要明确写出目标名称。

关系、标题等元数据不能代替物理约束。生成的 `database/<connection>/collections/` 是模型快照，结构的变更仍然要写成 Migration。

## 本专题的示例

后续各篇以订单为例：`orders` 包含 `id`、`orderNo`、`title`、`status`、`amount` 和 `customerId` 字段；[数据表与字段](schema.md) 创建基础模型，[关系与关联](relations.md) 增加 `customers` 表以及双向关系。查询片段都假设模型已经存在，并且调用发生在已经完成授权的服务端代码中。

## 权限与演进

数据库服务不会自动推断 HTTP 请求的用户。数据策略由授权结果产生，再绑定到 Repository；查询中的筛选条件只能缩小请求的范围，不能代替权限控制。

建议依次阅读结构、读写、关联、事务和迁移；精确的签名见 [API 参考](../../reference/api.md)，数据库版本和方言的支持条件见 [数据库支持与版本兼容](../../reference/compatibility.md)。

## 接口与实现

- [Database concepts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/overview.md)
- [Database API](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/README.md)
