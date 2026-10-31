---
title: 创建应用
metaDescription: 在本机创建一个 NocoBase 3 应用，使用默认模板和 SQLite，启动后登录。
---

## 准备环境

- Node.js 24 或更高版本，pnpm 11。
- Windows 上在 WSL 中操作。下面的命令都在 Bash 等 POSIX shell 中运行。

可以交给 Agent 创建，也可以自己执行命令，任选一种。

## 交给 Agent 创建

安装创建应用的 Skill，按提示选择你使用的 Agent：

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

如果 Agent 已经打开，要重新打开会话才能用上新安装的 Skill。然后在一个空目录（例如 `my-app`）打开 Agent，发送：

```prompt
在当前空目录创建一个本地开发用的 NocoBase 3 应用，使用默认模板和 SQLite。
启动后告诉我访问地址和首次登录的账号。
```

Agent 会创建应用、生成配置并启动，完成后告诉你应用的地址和首次登录的账号。

## 自己执行命令

在存放应用的目录执行下面的命令，创建工具会新建 `my-app` 目录并安装依赖：

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
```

NocoBase 3 还在 beta 阶段。`PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` 让 pnpm 可以安装刚发布的版本，只对这一次执行有效。

进入目录，生成配置，检查后启动：

```bash
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

- `config init` 生成本机配置 `config.yml` 和应用密钥。数据库用 SQLite，不用另外安装。`config.yml` 不提交到 Git。
- `config check` 按启动时的方式加载配置，有问题时给出修复提示。
- `pnpm dev` 启动开发服务器，启动后在终端输出 `Local:` 地址。保持这个终端运行，关掉它，应用就停止。

## 登录

打开应用地址，用默认管理员登录：用户名 `nocobase`，密码 `admin123`。应用地址从哪里来，取决于你用哪种方式创建：

- **交给 Agent 创建**：用 Agent 告诉你的地址。
- **自己执行命令**：用终端输出的 `Local:` 地址。

地址末尾带有应用路径，例如 `/main/`，打开时不要漏掉。

登录后进入首页。首页列出了内置能力，以及可以直接交给 Agent 的需求示例：

![刚创建的应用首页，还没有业务功能。](/assets/core/tutorials/getting-started/home.png)

截图来自默认模板 `1.0.0-beta.78` 的示例应用，实际界面可能随版本变化。

## 下一步

继续阅读[开发第一个功能](build-your-first-app.md)，让 Agent 在刚创建的应用里添加客户管理功能。
