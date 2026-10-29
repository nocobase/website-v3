---
title: 连接与数据库方言
description: 了解如何独立创建数据库连接、在应用中配置多个连接、区分受管理与外部数据库，以及排查方言相关的问题。
---

连接把逻辑上的数据库能力绑定到具体的数据库和命名空间。一个管理器可以包含多个连接，每个连接都有自己的方言、事务和模型解析。

## 独立创建连接

```ts
import { createDatabaseManager } from '@nocobase/db';
import sqlite from '@nocobase/db-sqlite';

const db = createDatabaseManager({
  default: 'main',
  connections: { main: sqlite({ filename: ':memory:' }) },
});
try {
  await db.connect();
  const connection = db.connection('main');
  console.log(connection.dialect);
} finally {
  await db.destroy();
}
```

内存 SQLite 适合用于隔离的测试，关闭后数据就会消失。正式的应用应从现有容器中取得管理器，不应在每次请求时创建连接池。

核心管理器不会自动扫描方言包。独立代码需要显式提供方言工厂，或者先在 `drivers` 中注册工厂，再使用声明式的配置。应用运行时会根据配置异步加载已安装的官方方言，然后创建管理器。

## 应用配置与多个连接

应用通过 `database.default` 和 `database.connections.<name>` 配置连接，数据库资源按 `database/<name>/` 组织。`db.connection('analytics')`、`db.repository('events', 'analytics')` 用于选择命名连接；省略连接名时使用默认连接。

连接不是跨库事务的协调器。一个事务只覆盖它回调中的连接，不会同时提交另一个连接上的操作。

## 受管理的数据库与外部数据库

`schemaManagement: managed` 表示允许框架管理数据库结构。对于外部数据库，使用 `external` 禁止框架执行 DDL 和迁移，并另外维护补充的元数据；应用可以使用 `database/<connection>/metadata/` 目录。这并不会让数据读写自动变成只读，读写仍然受数据库账号和业务策略的约束。

## 方言差异与排查

SQLite 文件、网络数据库的 host 和 port、Oracle 的 serviceName、TLS 参数以及原生依赖，都按方言分别配置。排查时先检查安装的包、连接字段和环境变量的覆盖情况，再检查数据库能否访问；不要试图通过切换方言来“修复”已有的数据。

`config check --no-connect` 只检查配置；连接检查也不会执行迁移。详见 [配置项参考](../../reference/configuration.md) 和 [数据库支持与版本兼容](../../reference/compatibility.md)。

在应用中增加第二个连接，见 [多数据库连接](../../developing-apps/multiple-databases.md)；外部数据库的配置、元数据文件和刷新步骤，见 [接入已有数据库](../../developing-apps/existing-databases.md)。

## 接口与实现

- [Manager creation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/database/create-database-manager.md)
- [Connection configuration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/database/types.ts)
