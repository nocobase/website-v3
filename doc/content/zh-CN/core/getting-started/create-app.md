---
title: 创建应用
description: 在本地创建一个 NocoBase 3 应用，启动后用管理员账号登录。
---

## 开始前的准备

| 需要 | 检查方式或说明 |
| --- | --- |
| Node.js 24 或更高版本 | 运行 `node --version` |
| pnpm 11 | 运行 `pnpm --version` |
| 类 Unix 终端 | macOS、Linux 可直接操作；Windows 请使用 WSL。以下命令使用 Bash 等 shell 的语法 |

使用 Agent 创建应用时，还需要支持 Skills 的编码工具，例如 Claude Code、Codex。

<details>
<summary>安装或升级 Node.js 和 pnpm</summary>

如果已经使用 nvm 或 fnm 管理 Node.js，可以运行 `nvm install 24` 或 `fnm install 24`。安装 pnpm 11：

```bash
npm install -g pnpm@11
```

安装或升级后，打开一个新终端，再运行表中的命令确认版本。

</details>

本地体验可以选择 SQLite，无需另外安装数据库。如果使用 PostgreSQL 等数据库，请先准备好数据库服务、数据库名和连接账号，并确保账号可以创建应用所需的表。

## 创建并启动应用

选择[使用 Agent](#使用-agent)或[使用命令行](#使用命令行)中的一种方式即可。

下面以 `my-app` 为应用名和目录名。你可以换成自己的名称：以小写字母或数字开头，只包含小写字母、数字、点、短横线和下划线。目标目录必须不存在或为空。

### 使用 Agent

**1. 安装创建应用的 Skill。** 在终端运行，按提示选择你的编码工具：

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

`-g` 表示全局安装，之后在其他目录创建应用时也能使用。

**2. 打开空目录，开启新的 Agent 会话。** 例如：

```bash
mkdir my-app
cd my-app
```

在编码工具中打开这个目录，开启新会话，让它加载刚安装的 Skill。

**3. 描述创建需求。**

```prompt
帮我在当前目录创建一个 NocoBase 3 应用，用于本地开发。创建好后运行起来，告诉我访问地址和登录账号。
```

**4. 回答必要问题，等待启动。** Agent 会检查环境，并询问使用哪种数据库。本地体验可以回答“用 SQLite”；使用已有数据库时，提供类型和连接信息。数据库密码通过环境变量提供，告诉 Agent 变量名，不要直接发到对话里。如需自定义初始管理员账号，也在首次启动前说明。

Agent 完成创建、配置检查和启动后，使用它给出的完整地址[登录应用](#登录并确认应用可用)。

### 使用命令行

**1. 创建项目并进入目录。** 在想存放项目的目录里运行：

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
```

创建工具会下载应用模板、安装依赖，并将依赖包提供的 Skills 同步到 `.agents/skills/`。

`@beta` 和 `--template-tag=beta` 分别指定创建工具和应用模板的 beta 渠道，两者都要保留。`PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` 允许安装刚发布的版本，只对这一条命令生效。创建工具不接受用 `.` 代替应用名。

**2. 生成配置并检查。** 以下以 SQLite 为例；使用其他数据库时，改用下方折叠内容中的命令。

```bash
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
```

`config init` 根据 `config.example.yml` 生成 `config.yml` 和加密密钥，不会覆盖已有配置。`config.yml` 包含本机配置和密钥，已被 Git 忽略，不要提交或分享。

`config check` 检查配置，使用非 SQLite 数据库时还会检查连接。按提示修正，检查通过后再启动。

<details>
<summary>使用 PostgreSQL 等其他数据库</summary>

在应用目录安装对应驱动，再生成配置。以 PostgreSQL 为例，用以下命令代替上面的 SQLite 配置命令：

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres
pnpm nocobase config check
```

在交互式终端里，`config init` 会询问连接信息，密码不回显，并测试连接。连接失败时，检查数据库服务、地址和凭据；即使选择保存配置，也要等 `config check` 通过后再启动。未安装驱动时，命令不会写入配置，并会提示需要运行的安装命令。

其他数据库的驱动包、`--dialect` 参数和版本要求见[数据库支持与版本兼容](../reference/compatibility.md)。

如果已经生成过 `config.yml`，重新运行 `config init` 不会切换数据库。安装目标驱动后，按[数据库配置](../reference/configuration.md#数据库配置)修改连接，再运行 `config check`。通过命令更新密码时，使用 [`config set --from-env`](../reference/configuration.md#修改与检查) 从环境变量读取。切换数据库不会搬迁已有数据。

</details>

> [!NOTE]
> 如需自定义初始管理员账号，在首次启动前修改 `config.yml` 中的 `users.initialAdmin`，再运行 `pnpm nocobase config check`。

**3. 启动应用。**

```bash
pnpm dev
```

第一次启动会自动建表并写入初始数据，包括管理员账号。等终端打印出 `Local:` 开头的一行，再打开其中的完整地址，保留末尾的 `/main/` 等路径。默认端口被占用时会自动换一个，以实际输出为准。

## 登录并确认应用可用

没有自定义初始管理员账号时，使用以下信息登录：

| 用户名 | 邮箱 | 密码 |
| --- | --- | --- |
| `nocobase` | `admin@nocobase.com` | `admin123` |

用户名和邮箱都可以登录。登录后修改默认密码，再让其他人访问应用。`users.initialAdmin` 只用于创建初始管理员，修改它不会重置已有账号的密码。

**完成的标志**：能打开应用，用管理员账号登录，并看到应用首页。

手动启动的应用可在运行它的终端按 <kbd>Ctrl</kbd>+<kbd>C</kbd> 停止；由 Agent 启动时，可以让 Agent 停止。应用进程停止后，在应用目录运行以下命令重新启动，并使用这次输出的地址访问：

```bash
pnpm dev
```

## 开始开发

在应用目录中继续开发，让 Agent 加载应用自带的 `AGENTS.md` 和 `.agents/skills/`。它们与安装的版本配套；如果当前会话还没有加载，重新开启会话。

开始修改前，建议把初始代码提交到 Git，方便比较和回退后续改动。

<details>
<summary>保存第一次 Git 提交</summary>

安装 Git 后，在应用目录另开一个终端运行：

```bash
git init
git add -A
git diff --cached --stat
git commit -m "chore: create app"
```

提交前检查暂存文件。模板的 `.gitignore` 已排除 `config.yml`、SQLite 数据库文件、`storage/`、`node_modules/` 和同步的 `.agents/skills/`；应用自己的 `.agents/rules/` 需要提交。

</details>

接下来可以跟随[搭建第一个应用](../tutorials/build-your-first-app.md)，和 Agent 一起添加任务管理功能。需要了解代码放在哪里时，查看[项目结构](project-structure.md)；需求描述和结果检查的方法见[和 Agent 一起开发](../developing-apps/develop-with-an-agent.md)。

## 遇到问题

| 现象 | 处理 |
| --- | --- |
| Node.js 或 pnpm 版本不符，或出现 `NODE_UNSUPPORTED` | 按[准备要求](#开始前的准备)升级，打开新终端后确认版本 |
| 找不到版本或下载模板失败 | 检查网络、npm 源，以及创建命令中的 `@beta`、`--template-tag=beta` 和 `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0`；下载失败时尚未创建项目，可直接重试 |
| 安装依赖失败 | 进入已创建的应用目录运行 `pnpm install`，无需重新创建；SQLite 驱动错误见下方说明 |
| 配置检查失败，或启动时提示尚未配置 | 尚未生成配置时先运行 `config init`；已有配置时运行 `config check`，按输出修正配置或连接信息，详见[配置项参考](../reference/configuration.md) |
| 浏览器无法打开应用 | 确认应用进程仍在运行，使用启动时输出的完整地址，包括端口和 `/main/` 等路径 |
| 修改了初始管理员配置，但仍无法用新密码登录 | 配置不会重置已有账号，见[常见问题](../reference/faq.md#改了初始管理员密码为什么原账号密码没有变化) |
| 提示 Skills 同步失败 | 在应用目录运行 `pnpm nocobase skills sync` 重试；应用本身仍可运行 |

<details>
<summary>SQLite 驱动提示 Could not locate the bindings file</summary>

当前平台缺少可用的 `better-sqlite3` 预编译包时，需要安装 C++ 编译工具链（包括 make、C++ 编译器和 Python），并在应用的 `pnpm-workspace.yaml` 中将 `allowBuilds` 下的 `better-sqlite3` 设为 `true`。然后在应用目录重新安装依赖：

```bash
rm -rf node_modules
pnpm install
```

</details>
