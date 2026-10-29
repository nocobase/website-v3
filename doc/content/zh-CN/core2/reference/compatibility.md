---
title: 数据库支持与版本兼容
description: 查找支持的数据库方言、连接配置的差异、运行环境的要求，以及升级时需要一起核对的版本。
---

本页区分三类信息：可用的方言包、源码中配置的集成测试环境，以及当前应用实际验证过的组合。测试环境的版本并不是完整的最低版本要求，也不是支持期限的承诺。

## 运行环境与包版本

| 项目 | 核对方式 |
| --- | --- |
| Node.js | 核对基线的应用模板与运行时要求 `>=24.0.0`；构建、安装依赖和运行环境应匹配 |
| pnpm | 使用应用 `package.json` 的 `packageManager`；已验证模板声明 `pnpm@11.7.0` |
| 应用模板 | 查看 `package.json` 的 `nocobase.defaultTemplateVersion` |
| Core 包 | 查看实际安装版本、锁文件与各包 `peerDependencies` |
| 数据库方言 | 与所用 `@nocobase/db` 版本、Node 版本和目标平台一起核对 |
| 插件 | 核对 Client、Server、CLI 的公开入口、依赖范围和迁移 |

各个包独立编号。例如本次验证的 `app-client` 是 `4.0.0-beta.3`，`app-server` 是 `3.0.0-beta.3`，`app-cli` 是 `1.0.0-beta.29`，它们都用于同一个 NocoBase 3 应用。不能把包的主版本号当成产品的代际。

```bash
node --version
pnpm --version
pnpm list @nocobase/app-client @nocobase/app-server @nocobase/app-cli @nocobase/db --depth 0
```

## 公开数据库方言

下表中的“集成环境”取自所核对修订中的 Docker Compose 配置，表示源码使用的测试目标；本次文档验证没有重新运行这些外部数据库服务。

| 数据库 | 包 / `dialect` | 底层驱动 | 源码集成环境或要求 |
| --- | --- | --- | --- |
| SQLite | `@nocobase/db-sqlite` / `sqlite` | `better-sqlite3` | 嵌入式数据库；原生模块必须匹配 Node、操作系统和架构 |
| PostgreSQL | `@nocobase/db-postgres` / `postgres` | `pg` | PostgreSQL 16 |
| MySQL | `@nocobase/db-mysql` / `mysql` | `mysql2` | MySQL 8.4 |
| MariaDB | `@nocobase/db-mysql` / `mysql` | `mysql2` | MariaDB 10.11 |
| Microsoft SQL Server | `@nocobase/db-mssql` / `mssql` | `tedious` | SQL Server 2022 |
| Oracle Database | `@nocobase/db-oracle` / `oracle` | `oracledb` | Oracle Free 23 |

MySQL 方言中的 JSON 过滤依赖 `JSON_OVERLAPS`：MySQL 需要 8.0.17 或以上，MariaDB 需要 10.9 或以上。TEXT 字段默认值所需的表达式形式，在 MySQL 8.0.13 起可用。这些是具体功能的版本条件，选择部署的数据库版本时，还需要核对正在使用的其他功能。依据见 [MySQL 方言说明](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-mysql/README.md)。

## 商业数据库方言

| 数据库 | 包 / `dialect` | 连接模式与核对事项 |
| --- | --- | --- |
| 达梦 | `@nocobase/db-dameng` / `dameng` | 使用 `knex-dm` 与 `dmdb`；所核对说明标记为实验性，需要针对目标服务端验证集成契约 |
| 人大金仓 | `@nocobase/db-kingbase` / `kingbase` | KingbaseES 的 PostgreSQL 兼容模式，`DB_MODE=pg` |
| OceanBase | `@nocobase/db-oceanbase` / `oceanbase` | OceanBase CE 的 MySQL 兼容租户 |

商业包按授权从 Pro registry 获取。兼容模式是建立连接的前提，但不能仅仅因为协议相似，就认为所有专有行为都与 PostgreSQL 或 MySQL 相同。OceanBase 中 TEXT 字段的默认值由 Repository 在创建记录时补齐，直接用 SQL 写入时仍需提供值。

## 应用连接配置

应用默认的数据库配置会按需加载已安装的官方方言。请把需要的方言放进生产依赖，再配置连接；单独使用 `@nocobase/db` 时，则按其 API 显式提供驱动工厂或注册表。

对于新建且尚未配置的 PostgreSQL 应用，可以按以下顺序操作：

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres
pnpm nocobase config set database.connections.main.host=127.0.0.1 database.connections.main.database=my_app database.connections.main.username=my_app
pnpm nocobase config set --from-env database.connections.main.password=MAIN_DB_PASSWORD
pnpm nocobase config check
```

运行之前，请通过你自己的环境管理方式设置 `MAIN_DB_PASSWORD`。已有的应用修改连接配置时，请保留其他配置、密钥和数据；修改 `dialect` 并不会把已有的业务数据迁移到新数据库。

| 配置差异 | 说明 |
| --- | --- |
| SQLite | 使用 `filename`；默认模板解析到应用 `storage/` 下的数据库文件 |
| 通用用户名 | 高层连接配置使用 `username`，不是底层驱动各自的 `user` 字段 |
| Oracle | 使用 `serviceName` 指定服务，不能只填写普通数据库名 |
| PostgreSQL | 按需要设置 `schema` 与 `ssl` |
| SQL Server | 按部署证书要求设置 `encrypt` 与 `trustServerCertificate` |
| 多连接 | `database.default` 指定默认连接，资源按 `database/<connection>/` 组织 |
| 外部数据库 | `schemaManagement: external` 限制框架执行结构变更；数据读写仍取决于账号和授权策略 |

## 升级与跨平台构建

1. 保留当前锁文件、运行配置和可恢复的数据备份。
2. 按[升级 NocoBase Core](../developing-apps/upgrade-nocobase-core.md)合并模板变化，核对依赖和 peer 范围。
3. 在独立验证环境检查迁移、查询、事务、权限以及插件行为。
4. 按目标平台重新构建，避免把开发机的原生依赖直接复制到另一种系统或架构。
5. 分别验证代码回退和数据库恢复；回退程序版本不会自动撤销已提交的数据结构变化。

构建时的 `--target` 与 `--node-version` 参数见 [命令行参考](cli.md)，生产部署见 [选择部署方式](../deployment/choose-a-deployment-method.md)。

## 核对范围

2026-10-27：公开方言与模板按 [Core `015404ecd0db`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs) 核对；商业方言说明按其源码修订 `138665ffaaaa` 核对。实际命令检查使用默认模板 beta.83、Node 24.21.0、pnpm 11.7.0、`@nocobase/db` 1.0.0-beta.22 和 SQLite 方言 0.1.0-beta.6。
