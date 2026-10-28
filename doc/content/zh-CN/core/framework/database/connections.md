---
title: 连接、配置与数据库方言
---

连接将逻辑数据库能力绑定到具体数据库和命名空间。一个管理器可以包含多个连接，每个连接有自己的方言、事务和模型解析。

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

内存 SQLite 适合隔离测试，关闭后数据消失。正式应用从现有容器取得管理器，不应在每次请求中创建连接池。

核心管理器不自动扫描方言包。独立代码显式提供方言工厂，或在 `drivers` 注册工厂后使用声明式配置。应用运行时会按配置异步加载已安装的官方方言，再创建管理器。

## 应用配置与多连接

应用使用 `database.default` 和 `database.connections.<name>`，数据库资源按 `database/<name>/` 组织。`db.connection('analytics')`、`db.repository('events', 'analytics')` 选择命名连接；省略时使用默认连接。

连接不是跨库事务协调器。一个事务只覆盖其回调连接，不会同时提交另一个连接的操作。

## 受管理与外部数据库

`schemaManagement: managed` 允许框架管理结构。外部库用 `external` 限制框架 DDL 与迁移，另行维护补充元数据；应用可使用 `database/<connection>/metadata/`。它不使数据读写自动只读，仍受数据库账号与业务策略约束。

## 方言差异与排查

SQLite 文件、网络数据库的 host/port、Oracle serviceName、TLS 参数和原生依赖都按方言配置。先检查安装包、连接字段和环境变量覆盖，再检查数据库可达性；不要通过切换方言来尝试“修复”已有数据。

`config check --no-connect` 只检查配置；连接检查不执行迁移。详见[配置项参考](../../reference/configuration.md)和[数据库支持](../../reference/compatibility.md)。

## 接口与实现

- [Manager creation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/database/create-database-manager.md)
- [Connection configuration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/database/types.ts)
