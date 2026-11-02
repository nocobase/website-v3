---
title: 使用不同数据库创建应用
metaDescription: 使用已有数据库连接信息创建 NocoBase 应用，配置 SQLite、PostgreSQL、MySQL、SQL Server、Oracle 及商业数据库驱动。
---

## 准备数据库连接信息

数据库服务可以部署在本机、独立服务器或云平台上，无需使用 Docker。为新应用准备独立的空数据库或 schema，账号需能连接、读写数据，并在应用使用的范围内创建和修改表、索引等对象。网络数据库应允许应用所在机器访问。

向数据库管理员或云服务提供方取得以下信息：

| 信息 | 用途 |
| --- | --- |
| 主机和端口 | 数据库服务地址；云服务使用提供的连接端点和端口 |
| 数据库名、schema 或服务名 | 指定应用的数据存放位置，字段因数据库而异 |
| 用户名和密码 | 使用为应用分配的账号 |
| TLS 要求 | 是否要求加密连接，以及是否需要专用 CA 证书 |

SQLite 使用本地文件，不需要主机、端口或账号。支持版本、功能限制和商业驱动授权见[数据库支持与版本兼容](../reference/compatibility.md)。

这里配置的是新应用的主数据库，启动时会初始化应用所需的数据表。要读取已有业务表，请参阅[接入已有数据库](../developing-apps/existing-databases.md)；仅修改连接信息不会迁移其他数据库中的应用数据。

## 创建应用项目

准备 Node.js 24 或更高版本和 pnpm 11。Windows 使用 WSL；下列命令在 Bash 等 POSIX shell 中执行。创建项目后，先不要执行 SQLite 初始化步骤：

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
```

创建工具会生成 `my-app` 并安装依赖。NocoBase 3 处于 beta 阶段，`PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` 仅让这次创建命令可以安装刚发布的包。

## 安装驱动并配置数据库

以下操作均在 `my-app` 目录执行，按所用数据库选择一个小节。`config init --json` 以非交互方式生成 `config.yml`、应用密钥和待填写的连接参数，不会尝试连接数据库。先按示例填写连接信息和 TLS 配置，再执行连接检查。

每个示例给出完整的 `database` 分区。初始化后，用实际连接信息填写该分区，保留文件中的密钥和其他配置，不要用片段覆盖整个 `config.yml`。`db.example.com`、端口、`my_app`、账号和密码均需按实际服务替换；示例中的端口不是部署要求。`schemaManagement: managed` 允许应用通过迁移管理自己的表结构。

`config.yml` 不提交到 Git。默认模板也支持用进程环境变量 `DB_PASSWORD` 提供主连接密码，环境变量会覆盖文件值；不要在 YAML 中写 `${DB_PASSWORD}`，它不会被替换。其他覆盖规则见[配置项参考](../reference/configuration.md)。

已有 `config.yml` 时，安装需要的驱动后直接调整连接分区，保留原有密钥。驱动版本需与应用依赖兼容；下列 `@beta` 命令用于新建 beta 应用。

### SQLite

默认模板已安装 SQLite 驱动，直接初始化：

```bash
mkdir -p storage
pnpm nocobase config init --dialect sqlite --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: sqlite
      database: database.sqlite
      schemaManagement: managed
```

这里的 `database` 是文件路径，`database.sqlite` 位于应用的 `storage/` 目录下；也可指定绝对路径。上面的命令会创建示例使用的 `storage/` 目录；若修改文件路径，需在连接检查前创建对应的父目录，并保证运行账号有写权限。该文件保存应用数据，不能在重新部署时丢弃。

### PostgreSQL

准备 PostgreSQL 数据库和可使用目标 schema 的账号：

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: postgres
      host: db.example.com
      port: 5432
      database: my_app
      schema: public
      username: app_user
      password: "replace-with-your-password"
      ssl: true
      schemaManagement: managed
```

`database` 为数据库名，`schema` 默认可用 `public`，也可改为管理员已准备并授权的 schema。示例启用 TLS；不使用 TLS 的服务改为 `ssl: false`。如服务使用专用 CA，将 `ssl` 改为对象，在 `ssl.ca` 中填写 PEM 格式证书内容，而不是证书文件路径。

### MySQL 与 MariaDB

MySQL 和 MariaDB 共用驱动与 `mysql` 方言：

```bash
pnpm add @nocobase/db-mysql@beta
pnpm nocobase config init --dialect mysql --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: mysql
      host: db.example.com
      port: 3306
      database: my_app
      username: app_user
      password: "replace-with-your-password"
      charset: utf8mb4
      ssl: true
      schemaManagement: managed
```

数据库需已存在，并支持应用需要的字符集；示例连接字符集为 `utf8mb4`。示例启用 TLS，不使用 TLS 时改为 `ssl: false`；专用 CA 可通过 `ssl.ca` 提供 PEM 格式证书内容。MariaDB 仍填写 `dialect: mysql`，不改成 `mariadb`。

### Microsoft SQL Server

准备数据库和已获该数据库访问、读写及结构管理权限的 SQL 登录账号：

```bash
pnpm add @nocobase/db-mssql@beta
pnpm nocobase config init --dialect mssql --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: mssql
      host: db.example.com
      port: 1433
      database: my_app
      username: app_user
      password: "replace-with-your-password"
      encrypt: true
      trustServerCertificate: false
      schemaManagement: managed
```

`database` 是数据库名；命名实例也应提供可连接的主机和 TCP 端口。示例使用加密连接并验证服务端证书。若连接的是本地测试服务的自签名证书，可按测试环境需要设置 `trustServerCertificate: true`，这会跳过服务端证书验证；正式环境应使用可验证的证书。

### Oracle Database

准备 Oracle 服务名、应用用户及其 schema 所需的权限和表空间配额：

```bash
pnpm add @nocobase/db-oracle@beta
pnpm nocobase config init --dialect oracle --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: oracle
      host: db.example.com
      port: 1521
      serviceName: APPPDB
      username: app_user
      password: "replace-with-your-password"
      schemaManagement: managed
```

`serviceName` 填管理员提供的服务名，例如目标 PDB 的服务名；它不是 SID，也不是普通的数据库名。示例中的 `APPPDB` 需替换。账号对应的 schema 用于存放应用对象，不要套用 MySQL 的 `database` 字段。

### 达梦

达梦驱动需要 NocoBase Pro 商业授权和 Pro registry 访问权限，先配置仓库认证。驱动目前为实验性，需在目标数据库版本上验证后使用。商业驱动的仓库地址和登录步骤见[商业数据库驱动](../reference/compatibility.md#商业数据库驱动)。

```bash
pnpm add @nocobase/db-dameng@beta
pnpm nocobase config init --dialect dameng --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: dameng
      host: db.example.com
      port: 5236
      schema: APP_USER
      username: APP_USER
      password: "replace-with-your-password"
      schemaManagement: managed
```

`schema` 使用实际分配的模式名，并保留正确大小写；示例账号和模式均为 `APP_USER`。初始化不会生成 `database` 字段，不要把 schema 名填写到该字段中。

### 人大金仓 KingbaseES

确认服务运行在 PostgreSQL 兼容模式（`DB_MODE=pg`），并准备数据库及 schema。安装前需具备 NocoBase Pro 商业授权并配置 Pro registry 认证。商业驱动的仓库地址和登录步骤见[商业数据库驱动](../reference/compatibility.md#商业数据库驱动)。

```bash
pnpm add @nocobase/db-kingbase@beta
pnpm nocobase config init --dialect kingbase --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: kingbase
      host: db.example.com
      port: 54321
      database: my_app
      schema: public
      username: app_user
      password: "replace-with-your-password"
      ssl: true
      schemaManagement: managed
```

`schema` 填已授权的模式名。TLS 配置与 PostgreSQL 相同：示例启用 TLS，不使用时改为 `ssl: false`，专用 CA 在 `ssl.ca` 中填写 PEM 内容。虽然使用 PostgreSQL 兼容模式，仍需安装金仓驱动并填写 `dialect: kingbase`。

### OceanBase

使用 OceanBase CE 的 MySQL 兼容租户，准备该租户下的数据库和账号。安装前需具备 NocoBase Pro 商业授权并配置 Pro registry 认证。商业驱动的仓库地址和登录步骤见[商业数据库驱动](../reference/compatibility.md#商业数据库驱动)。

```bash
pnpm add @nocobase/db-oceanbase@beta
pnpm nocobase config init --dialect oceanbase --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: oceanbase
      host: db.example.com
      port: 2881
      database: my_app
      username: app_user
      password: "replace-with-your-password"
      charset: utf8mb4
      ssl: true
      schemaManagement: managed
```

主机和端口使用实际连接端点；通过代理连接时填写代理端点，不要固定使用示例中的直连端口。用户名使用管理员提供的完整形式，包含连接所需的租户信息。TLS 按服务要求设置：示例启用 TLS，不使用时改为 `ssl: false`，专用 CA 可用 `ssl.ca` 配置。TEXT 默认值等差异见[数据库支持与版本兼容](../reference/compatibility.md)。

## 检查连接并启动应用

保存 `config.yml` 后，先检查连接，确认通过后再启动：

```bash
pnpm nocobase config check --connect
pnpm dev
```

`--connect` 会检查所有数据库连接，包括 SQLite。检查成功时会显示 `main` 连接通过；失败时按终端提示修复，再重新检查。该检查不执行迁移，也不能代替启动后的功能验证。

首次启动会执行待运行的迁移和必要初始化。看到终端输出 `Local:` 地址后，打开完整地址并保留末尾的应用路径（例如 `/main/`），按[创建应用的登录说明](create-app.md#登录)登录。能进入应用首页且终端没有初始化错误，说明应用已启动。保持终端运行。

## 常见连接问题

| 现象 | 检查方法 |
| --- | --- |
| 提示缺少数据库驱动 | 在应用项目中安装对应包；商业驱动还需检查授权和私有仓库认证。部署包需重新构建 |
| 连接超时或被拒绝 | 从应用所在机器检查主机、端口、数据库监听地址、防火墙及云服务访问白名单 |
| 用户名或密码错误 | 核对账号、密码及允许的来源地址；OceanBase 还需核对租户和完整用户名 |
| 数据库、schema 或服务不存在 | 确认数据库已创建、schema 已授权；Oracle 核对 `serviceName` |
| TLS 或证书错误 | 核对服务端加密要求、主机名和 CA 信任；按数据库对应字段配置 |
| 连接检查通过，启动时迁移失败 | 查看第一条迁移错误，核对建表、修改表和索引等权限；Oracle 还需检查表空间配额 |
| 修改文件后仍连接旧数据库 | 检查 `DB_DIALECT`、`DB_HOST`、`DB_PORT`、`DB_DATABASE` 等环境变量是否覆盖文件 |
| SQLite 无法打开文件 | 检查实际文件路径、存放目录及运行账号的写权限 |

如已初始化过其他数据库，保留旧库和密钥，单独规划数据迁移；重新执行 `config init` 不会搬迁已有数据。
