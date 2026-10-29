---
title: 创建应用
description: 在本地创建一个 NocoBase 3 应用，启动后用管理员账号登录。
---

完成这一篇，你会得到：

- 一个 `my-app/` 项目目录，里面是应用源码、`AGENTS.md` 和随包同步的 Skills，可以直接提交到 Git。
- 一个在本地运行的应用，在浏览器里用管理员账号登录。

默认使用 SQLite，不需要另外安装数据库。下面分两种方式：让 Agent 替你完成，或者自己运行命令。两种方式用的是同一个创建工具，结果一样。

## 准备

| 需要 | 说明 |
| --- | --- |
| Node.js 24 或更高版本 | 用 `node --version` 查看。可以用 `nvm install 24` 或 `fnm install 24` 安装 |
| pnpm 11 | 用 `pnpm --version` 查看。可以用 `corepack enable && corepack prepare pnpm@11 --activate` 或 `npm install -g pnpm@11` 安装 |
| 类 Unix 终端 | macOS、Linux 直接使用；Windows 在 WSL 中操作，下面的命令不能在 PowerShell 或 cmd 中运行 |
| 编码工具（使用 Agent 时） | 支持 Skills 的编码工具，例如 Claude Code、Codex |

安装或升级 Node.js、pnpm 后，打开一个新终端再继续，确保新版本生效。

## 使用 Agent

**1. 安装创建应用的 Skills。** 在终端运行，按提示选择你使用的编码工具：

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

`-g` 表示全局安装，之后在任何目录都能用。

**2. 在空目录中开启 Agent 会话。** 新建一个目录，例如 `my-app`，目录名会成为应用名。在这个目录里开启一个新的 Agent 会话，让它加载刚装好的 Skills。

**3. 告诉 Agent 你要什么：**

```text
在当前目录创建一个 NocoBase 3 应用，用于本地开发，数据库用 SQLite。
创建好后启动它，告诉我访问地址和首次登录的账号。
```

Agent 会检查 Node.js 和 pnpm 的版本，创建项目，生成并检查配置，再启动应用，确认地址能打开后告诉你：

- 应用的访问地址和首次登录的账号；
- 之后怎样重新启动应用；
- 能否在当前会话里继续开发。

缺少 Node.js 或 pnpm 时，Agent 会说明缺什么、怎样安装，不会自行安装。想用 PostgreSQL 等其他数据库，在需求里说明即可；数据库密码不要发在对话里，先放进环境变量，再告诉 Agent 变量名。

由 Agent 会话启动的应用，会随会话结束而停止。之后在应用目录运行 `pnpm dev` 就能重新启动。

继续开发时，在应用目录里开启 Agent 会话。应用自带的 `AGENTS.md` 和 `.agents/skills/` 与安装的版本配套，从这里开始由它们指导 Agent，不再需要创建应用的 Skills。

## 不使用 Agent

### 1. 创建项目

在想存放项目的目录里运行：

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
```

创建工具会新建 `my-app/` 目录，下载应用模板，安装依赖，再把依赖包里的 Skills 同步到 `.agents/skills/`。

- `my-app` 是目录名，也是应用名。目录必须不存在或为空；名称以小写字母或数字开头，只能包含小写字母、数字、点、短横线和下划线。不能用 `.` 表示当前目录。
- `@beta` 和 `--template-tag=beta` 分别让创建工具和应用模板都取 beta 渠道的最新版本，两者缺一不可。
- `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` 允许 pnpm 安装刚发布的版本，只对这一条命令生效，不改你的 pnpm 配置。

### 2. 生成配置

```bash
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
```

`config init` 根据 `config.example.yml` 生成 `config.yml`，并生成加密用的密钥。`config.yml` 是这台机器上的配置，包含密钥，已经被 Git 忽略，不要提交或发给别人。对已经配置过的应用再运行一次，它不会改动原文件。

`config check` 按启动时的方式加载配置，报告缺失的密钥、未知的配置项等问题。按提示修正，直到检查通过。

> [!NOTE]
> 首次登录的管理员账号来自 `config.yml` 中的 `users.initialAdmin`。想用自己的用户名和密码，在第一次启动前修改这里；应用启动后再改，不会影响已经创建的账号。

### 3. 启动

```bash
pnpm dev
```

第一次启动时，应用会自动建表并写入初始数据，包括管理员账号。等终端打印出 `Local:` 开头的一行，说明应用已经就绪。

打开这一行给出的完整地址，保留末尾的 `/main/` 等路径。默认端口被占用时会自动换一个，所以以终端打印的为准，不要自己拼地址。

在终端按 <kbd>Ctrl</kbd>+<kbd>C</kbd> 停止应用；下次在应用目录运行 `pnpm dev` 即可重新启动。

## 登录

没有修改过 `users.initialAdmin` 时，用默认管理员登录：

| 用户名 | 邮箱 | 密码 |
| --- | --- | --- |
| `nocobase` | `admin@nocobase.com` | `admin123` |

用户名和邮箱都可以登录。登录后尽快修改默认密码，尤其是应用会被别人访问到时。

**完成的标志**：用管理员账号登录后，能看到应用首页。

## 提交第一个版本

建议马上把新项目提交到 Git。之后 Agent 每做一次修改，你都能清楚地看到改了什么：

```bash
git init
git add -A
git commit -m "chore: create app"
```

模板的 `.gitignore` 已经排除了 `config.yml`、SQLite 数据库文件、`storage/`、`node_modules/` 和同步来的 `.agents/skills/`。`.agents/rules/` 是应用自己的规则，需要提交。

## 换用其他数据库

默认的 SQLite 适合在本地开发和试用。想在本地就用和生产环境一样的数据库，在第一次启动前完成下面的设置，用它们代替上面第 2 步的命令。以 PostgreSQL 为例：

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres
pnpm nocobase config check
```

在终端里运行 `config init` 时，它会逐项询问主机、数据库名、用户名和密码（密码不回显），先测试连接再写入配置。驱动没有安装时，它不写任何文件，并给出要运行的 `pnpm add` 命令。

| 数据库 | 驱动包 | `--dialect` |
| --- | --- | --- |
| PostgreSQL | `@nocobase/db-postgres` | `postgres` |
| MySQL、MariaDB | `@nocobase/db-mysql` | `mysql` |
| SQL Server | `@nocobase/db-mssql` | `mssql` |
| Oracle | `@nocobase/db-oracle` | `oracle` |

已经生成过 `config.yml` 时，`config init` 不会覆盖它，改用 `pnpm nocobase config set` 修改 `database.connections.main` 下的字段。密码用 `--from-env` 从环境变量读取，避免留在命令历史里：

```bash
pnpm nocobase config set --from-env database.connections.main.password=MY_APP_DB_PASSWORD
```

换数据库不会搬迁已有的数据。各数据库支持的版本见 [数据库支持与版本兼容](../reference/compatibility.md)，全部配置项见 [配置项参考](../reference/configuration.md)。

## 遇到问题

| 现象 | 处理 |
| --- | --- |
| Node.js 版本低于 24，或创建时报 `NODE_UNSUPPORTED` | 升级 Node.js，打开新终端后重试 |
| 提示没有匹配的版本，或者装到的不是最新版本 | 确认命令前带有 `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` |
| 下载模板失败 | 检查网络和 npm 源。此时项目还没有创建，直接重试 |
| 安装依赖失败 | 项目目录已经创建好，进入目录运行 `pnpm install` 重试，不需要重新创建 |
| `Could not locate the bindings file` | 当前平台没有 SQLite 驱动 `better-sqlite3` 的预编译包。安装 C++ 编译工具链，在 `pnpm-workspace.yaml` 的 `allowBuilds` 下加入 `better-sqlite3: true`，再运行 `rm -rf node_modules && pnpm install` |
| 提示 Skills 同步失败 | 应用仍然可以运行。在应用目录运行 `pnpm nocobase skills sync` 重新同步 |
| `pnpm dev` 提示应用还没有配置 | 运行上面第 2 步的 `config init` 和 `config check` |
| 浏览器打开后找不到页面 | 使用 `pnpm dev` 打印的完整 `Local:` 地址，包括端口和末尾的 `/main/` |
| 改了 `users.initialAdmin`，登录密码却没变 | 这项配置只在第一次创建管理员时使用，不会重置已有账号。见 [常见问题](../reference/faq.md#改了初始管理员密码为什么原账号密码没有变化) |

## 下一步

- [项目结构](project-structure.md)：了解页面、接口、数据表和测试分别放在哪里。
- [搭建第一个应用](../tutorials/build-your-first-app.md)：和 Agent 一起做一个团队任务应用。
- [和 Agent 一起开发](../developing-apps/develop-with-an-agent.md)：怎样描述需求、检查结果。
- 准备部署到服务器时，见 [选择部署方式](../deployment/choose-a-deployment-method.md)。
