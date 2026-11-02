---
title: 数据库支持与版本兼容
description: 查找支持的数据库、驱动安装与连接配置方法，以及数据库版本、运行环境和升级要求。
---

## 支持的数据库

NocoBase 提供 8 种数据库方言。方言是连接配置中 `dialect` 的取值，用于选择对应的数据库驱动；MariaDB 与 MySQL 共用 `mysql` 方言。

### 开源数据库驱动

| 数据库 | 驱动包 | `dialect` |
| --- | --- | --- |
| SQLite | `@nocobase/db-sqlite` | `sqlite` |
| PostgreSQL | `@nocobase/db-postgres` | `postgres` |
| MySQL、MariaDB | `@nocobase/db-mysql` | `mysql` |
| Microsoft SQL Server | `@nocobase/db-mssql` | `mssql` |
| Oracle Database | `@nocobase/db-oracle` | `oracle` |

默认应用模板使用 SQLite，本地开发无需单独安装数据库服务。使用其他数据库时，需要准备可连接的服务、数据库和账号，再安装对应的驱动。

### 商业数据库驱动

| 数据库 | 驱动包 | `dialect` | 使用条件 |
| --- | --- | --- | --- |
| 达梦 | `@nocobase/db-dameng` | `dameng` | 驱动目前为实验性，使用前需在目标数据库版本上验证 |
| 人大金仓 KingbaseES | `@nocobase/db-kingbase` | `kingbase` | PostgreSQL 兼容模式，`DB_MODE=pg` |
| OceanBase CE | `@nocobase/db-oceanbase` | `oceanbase` | MySQL 兼容租户 |

这三个驱动属于 NocoBase Pro 商业包，需要相应的商业授权。从授权交付方取得私有仓库的账号信息及具有下载权限的只读令牌（`nbr_…`），再执行以下命令，按提示将令牌作为密码输入：

```bash
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
```

该命令在用户级配置中将 `@nocobase` 映射到 Pro registry；此仓库也代理公开的 NocoBase 包，其他依赖仍使用原有 registry。不要把令牌写入文档、命令行参数或提交到 Git。

## 配置应用数据库

各数据库的完整连接配置示例见[使用不同数据库创建应用](../getting-started/create-app-with-database.md)，可直接使用本机、独立服务器或云数据库提供的连接信息。

### 安装驱动并初始化配置

在[创建应用](../getting-started/create-app.md)生成的项目目录中操作。下面以尚未生成 `config.yml` 的 PostgreSQL 应用为例；先准备可访问的 PostgreSQL 服务、数据库和账号，再执行：

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres --json
```

命令生成 `config.yml` 和应用密钥，但不连接数据库。先在配置文件中填写真实的主机、端口、数据库名、用户名、密码及所需的 TLS 配置；各数据库的示例见[使用不同数据库创建应用](../getting-started/create-app-with-database.md)。使用其他数据库时，替换包名和 `--dialect` 值。`config init` 不会安装驱动，也不会创建数据库服务或账号。

`config.yml` 可能包含密码和密钥，不提交到 Git。也可使用[配置命令](cli.md)设置连接参数。

完成配置后检查连接：

```bash
pnpm nocobase config check
```

检查通过时，终端会显示数据库连接成功；有问题时会指出配置项和修复建议。默认检查会连接除 SQLite 外的数据库；SQLite 需要连接检查时加 `--connect`，只检查配置、不连接数据库时加 `--no-connect`。该命令不执行迁移。

已有 `config.yml` 时，直接修改所需连接配置并保留原有密钥。修改 `dialect` 不会把已有数据迁移到另一个数据库。

### 不同数据库的连接参数

连接写在 `database.connections.<name>` 下，`database.default` 指定默认连接名，默认模板为 `main`。常用网络连接字段为 `host`、`port`、`database`、`username` 和 `password`，以下字段按数据库调整：

| 数据库 | 配置要点 |
| --- | --- |
| SQLite | 生成的配置使用 `database` 指定文件。改用 `filename` 或 `DB_FILENAME` 时，需移除 `database`，并确认没有 `DB_DATABASE` 覆盖，否则仍优先使用 `database`。相对路径按应用的 `storage/` 目录解析 |
| PostgreSQL、人大金仓 | 按需设置 `schema` 和 `ssl` |
| MySQL、MariaDB、OceanBase | 使用 `database` 指定数据库，`username` 指定用户 |
| Microsoft SQL Server | 按服务端证书配置 `encrypt` 和 `trustServerCertificate` |
| Oracle | 使用 `serviceName` 指定服务 |
| 达梦 | 使用 `schema` 指定模式；初始化配置不生成 `database` 字段 |

环境变量可能覆盖文件中的连接参数，覆盖规则见[配置项参考](configuration.md)。增加其他连接见[多数据库连接](../developing-apps/multiple-databases.md)；连接现有业务库、限制框架修改表结构见[接入已有数据库](../developing-apps/existing-databases.md)。

## 数据库版本与功能限制

下表是驱动集成测试配置使用的数据库版本，不代表完整的兼容版本范围或最低版本要求：

| 数据库 | 集成测试配置版本 |
| --- | --- |
| PostgreSQL | 16 |
| MySQL | 8.4 |
| MariaDB | 10.11 |
| Microsoft SQL Server | 2022 |
| Oracle Database | Oracle Free 23 |

选择部署版本时，还需满足应用使用的功能要求：

- **MySQL、MariaDB**：JSON 过滤使用 `JSON_OVERLAPS`，要求 MySQL 8.0.17 或以上、MariaDB 10.9 或以上。TEXT 字段默认值使用的表达式语法要求 MySQL 8.0.13 或以上、MariaDB 10.2.1 或以上。详见 [MySQL 驱动说明](https://github.com/nocobase/nocobase/blob/09646a97a60ce0758b3635454cb483cb3f1a57c3/packages/libs/db-mysql/README.md)。
- **OceanBase**：TEXT 字段默认值由 Repository 在创建记录时填充；直接执行 SQL 插入记录时，需自行提供该字段的值。
- **SQLite**：原生模块需要匹配 Node.js 版本、操作系统和 CPU 架构。

人大金仓和 OceanBase 需使用[支持的数据库](#支持的数据库)中指定的兼容模式，并在目标数据库上验证应用的查询、迁移和事务。

## 运行环境与包版本

| 项目 | 要求与查看方式 |
| --- | --- |
| Node.js | 24 或更高版本 |
| pnpm | 使用应用 `package.json` 中 `packageManager` 指定的版本 |
| 应用模板 | 查看 `package.json` 的 `nocobase.defaultTemplateVersion` |
| Core、数据库驱动和插件 | 按各包的依赖范围及 `peerDependencies` 配套安装，保留锁文件 |

NocoBase 的各个包独立编号，包的主版本号不等同于 NocoBase 产品版本。查看当前环境和已安装的包版本：

```bash
node --version
pnpm --version
pnpm list @nocobase/app-client @nocobase/app-server @nocobase/app-cli @nocobase/db --depth 0
```

## 升级与跨平台部署

升级前备份数据库、运行配置和密钥，保留锁文件；按[升级 NocoBase Core](../developing-apps/upgrade-nocobase-core.md)更新模板和依赖，并在独立环境中验证迁移、查询、事务及权限。回退代码不会自动撤销数据库结构变更，需同时准备数据恢复方案。

跨操作系统或 CPU 架构部署时，应为目标平台重新构建，避免直接复制本机的原生依赖。数据库驱动需安装在应用的生产依赖中；增加驱动后重新构建部署包。构建参数见[命令行参考](cli.md)，部署步骤见[部署概览](../deployment/choose-a-deployment-method.md)。
