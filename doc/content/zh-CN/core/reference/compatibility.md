---
title: 数据库支持与版本兼容
description: 查找数据库方言、连接差异、运行环境要求，以及升级时需要一起核对的版本。
---

本页区分可用的方言包、源码中配置的集成测试环境和当前应用实际验证过的组合。测试环境版本不是完整的最低版本或支持期限承诺。

## 运行环境与包版本

| 项目 | 核对方式 |
| --- | --- |
| Node.js | 核对基线的应用模板与运行时要求 `>=24.0.0`；构建、安装依赖和运行环境应匹配 |
| pnpm | 使用应用 `package.json` 的 `packageManager`；已验证模板声明 `pnpm@11.7.0` |
| 应用模板 | 查看 `package.json` 的 `nocobase.defaultTemplateVersion` |
| Core 包 | 查看实际安装版本、锁文件与各包 `peerDependencies` |
| 数据库方言 | 与所用 `@nocobase/db` 版本、Node 版本和目标平台一起核对 |
| 插件 | 核对 Client、Server、CLI 的公开入口、依赖范围和迁移 |

各包独立编号。例如本次验证的 `app-client` 是 `4.0.0-beta.3`，`app-server` 是 `3.0.0-beta.3`，`app-cli` 是 `1.0.0-beta.29`，它们用于同一个 NocoBase 3 应用。不能把包的主版本号当成产品代际。

```bash
node --version
pnpm --version
pnpm list @nocobase/app-client @nocobase/app-server @nocobase/app-cli @nocobase/db --depth 0
```

## 文档基线与安装版本

文档中的版本有三种用途，核对时不要混在一起：

- **示例模板版本**说明示例从什么项目结构开始，例如当前入门应用的 `1.0.0-beta.84`。
- **固定源码提交**用于追溯接口与说明，不表示该提交的全部改动都已发布到 npm。
- **应用的安装版本**由依赖和锁文件确定，实际可用能力以这些包的公开导出、类型和随包指引为准。

运行旧示例时按该页前提准备独立项目。升级现有应用时核对目标发布版本和迁移要求；新建应用测试、源码审阅与旧数据升级验证是不同的证据。

## 公开数据库方言

以下“集成环境”取自核对修订的 Docker Compose 配置，表示源码使用的测试目标，本次文档验证没有重新运行这些外部数据库服务。

| 数据库 | 包 / `dialect` | 底层驱动 | 源码集成环境或要求 |
| --- | --- | --- | --- |
| SQLite | `@nocobase/db-sqlite` / `sqlite` | `better-sqlite3` | 嵌入式数据库；原生模块必须匹配 Node、操作系统和架构 |
| PostgreSQL | `@nocobase/db-postgres` / `postgres` | `pg` | PostgreSQL 16 |
| MySQL | `@nocobase/db-mysql` / `mysql` | `mysql2` | MySQL 8.4 |
| MariaDB | `@nocobase/db-mysql` / `mysql` | `mysql2` | MariaDB 10.11 |
| Microsoft SQL Server | `@nocobase/db-mssql` / `mssql` | `tedious` | SQL Server 2022 |
| Oracle Database | `@nocobase/db-oracle` / `oracle` | `oracledb` | Oracle Free 23 |

MySQL 方言中的 JSON 过滤依赖 `JSON_OVERLAPS`：MySQL 需要 8.0.17 或以上，MariaDB 需要 10.9 或以上。TEXT 字段默认值所需的表达式形式，在 MySQL 8.0.13 起可用。这些是具体功能的版本条件，选择部署版本时还需核对其他使用中的功能。依据见 [MySQL 方言说明](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-mysql/README.md)。

## 商业数据库方言

| 数据库 | 包 / `dialect` | 连接模式与核对事项 |
| --- | --- | --- |
| 达梦 | `@nocobase/db-dameng` / `dameng` | 使用 `knex-dm` 与 `dmdb`；所核对说明标记为实验性，需要针对目标服务端验证集成契约 |
| 人大金仓 | `@nocobase/db-kingbase` / `kingbase` | KingbaseES 的 PostgreSQL 兼容模式，`DB_MODE=pg` |
| OceanBase | `@nocobase/db-oceanbase` / `oceanbase` | OceanBase CE 的 MySQL 兼容租户 |

商业包按授权从 Pro registry 获取。兼容模式属于连接前提；不能仅因协议相似，就将所有专有行为视为 PostgreSQL 或 MySQL 的相同行为。OceanBase 的 TEXT 默认值由 Repository 在创建记录时补齐，直接 SQL 写入仍需提供值。

## 应用连接配置

应用默认数据库配置会按需加载已安装的官方方言。将需要的方言放入生产依赖，再配置连接；单独使用 `@nocobase/db` 时，则按其 API 显式提供驱动工厂或注册表。

新建且尚未配置的 PostgreSQL 应用可以按以下顺序操作：

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres
pnpm nocobase config set database.connections.main.host=127.0.0.1 database.connections.main.database=my_app database.connections.main.username=my_app
pnpm nocobase config set --from-env database.connections.main.password=MAIN_DB_PASSWORD
pnpm nocobase config check
```

运行前通过自己的环境管理方式设置 `MAIN_DB_PASSWORD`。已有应用修改连接配置时保留其他配置、密钥和数据；修改 `dialect` 不会迁移已有业务数据到新数据库。

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

构建的 `--target` 与 `--node-version` 参数见[命令行参考](cli.md)，生产部署见[选择部署方式](../deployment/choose-a-deployment-method.md)。

## 核对范围

2026-10-27：公开方言与模板按 [Core `015404ecd0db`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs) 核对；商业方言说明按其源码修订 `138665ffaaaa` 核对。实际命令检查使用默认模板 beta.83、Node 24.21.0、pnpm 11.7.0、`@nocobase/db` 1.0.0-beta.22 和 SQLite 方言 0.1.0-beta.6。
