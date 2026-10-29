---
title: 创建应用
description: 通过 Coding Agent 或手动执行命令，创建、启动并登录一个 NocoBase 3 应用。
---

创建 NocoBase 应用后，你会得到一份可以继续开发的项目代码。你可以让 Coding Agent 完成创建，也可以自己在终端执行命令，两种方式使用的是同一个创建工具。

本文使用默认模板和 SQLite。SQLite 不需要单独安装数据库服务，适合第一次在本地运行应用。

## 准备环境

开发环境需要 Node.js 24 或更高版本，以及 pnpm 11。使用 Agent 时，可以让它检查环境并告诉你还缺什么；手动创建时，先在终端确认版本：

```bash
node --version
pnpm --version
```

Windows 用户请在 WSL 中操作，下文命令均适用于 Bash 等 POSIX shell。

下面两种创建方式任选其一。选择使用 Agent 时，还需要一个支持 Skills 的 Coding Agent。

## 使用 Agent

准备一个空目录（例如 `my-app`），在该目录中开启 Coding Agent 会话。

先把下面的命令发给 Agent，安装用于创建应用的 Skill：

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

安装时按提示选择你正在使用的 Agent。如果当前会话识别不到新安装的 Skill，在同一目录重新开启一个会话。确认 Skill 已加载后，发送创建需求：

```text
请在当前空目录中创建一个供本地开发使用的 NocoBase 3 应用。
使用默认模板和 SQLite，按创建应用的指引完成准备和检查。
启动后告诉我打开哪个地址，以及如何完成首次登录。
```

Agent 会按指引检查环境、调用创建工具、安装依赖、初始化并检查配置，最后启动应用。如果缺少环境依赖，它会说明需要先做哪些准备。

完成后，打开 Agent 给出的应用地址，按它提供的登录信息完成首次登录；也可以参阅下文的[打开应用并登录](#打开应用并登录)。

创建好的应用目录中包含 `AGENTS.md` 和 `.agents/skills/`。继续开发时，让 Agent 读取项目自带的规则和 Skills；如果当前会话还没有加载它们，在应用目录中重新开启会话即可。

## 不使用 Agent

手动创建不需要安装 Agent Skill。在用来存放项目的父目录中执行以下命令，创建工具会新建 `my-app` 目录并安装依赖：

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
```

其中，`@beta` 选择 NocoBase 3 创建工具的 beta 版本，`--template-tag=beta` 选择模板的 beta 版本。命令前的环境变量允许 pnpm 安装刚发布的版本，只对这一次执行生效。

> [!TIP]
> 项目目录应当尚不存在或为空。目录名只能包含小写字母、数字、点、短横线和下划线，并以字母或数字开头。创建命令不接受 `.` 作为项目名；如果你已经位于空的 `my-app` 目录内，请先回到父目录再执行上面的命令。

### 1. 初始化配置

进入应用目录，生成本地配置：

```bash
cd my-app
pnpm nocobase config init --dialect sqlite
```

该命令根据 `config.example.yml` 生成 `config.yml`，并初始化所需的密钥。`config.yml` 保存当前环境的配置，已被 Git 忽略。

### 2. 检查配置

```bash
pnpm nocobase config check
```

如果检查未通过，按命令输出的提示修复后再次检查。检查通过后再启动应用。

### 3. 启动应用

```bash
pnpm dev
```

保持这个终端运行。开发服务器就绪后，终端会输出 `Local:` 地址，打开该地址即可访问应用。

## 打开应用并登录

请使用 `pnpm dev` 输出的完整 `Local:` 地址，其中包含应用路径（例如 `/main/`）。端口可能因被占用而顺延，不要按默认端口自行拼接地址，也不要把前端 Vite 的端口当作完整的应用入口。

![初次打开应用时的英文登录页。](/assets/core/tutorials/getting-started/login.png)

如果没有修改过初始管理员配置，默认登录信息为：

- 用户名：`nocobase`
- 密码：`admin123`

初始管理员由 `config.yml` 中的 `users.initialAdmin` 配置。如果创建时调整过，请使用实际配置的账号。首次登录后请修改默认密码。

![刚创建的应用首页，尚未添加任务功能。](/assets/core/tutorials/getting-started/home.png)

登录后会进入应用首页，页面上介绍了内置能力，并给出了可以交给 Agent 的需求示例。至此，你已经有了一份应用代码和一个正在运行的应用，可以开始开发业务功能。

以上截图来自默认模板 `1.0.0-beta.78` 的历史示例 [00-create-app](https://github.com/nocobase/app-tutorials/tree/00-create-app)，实际界面以你创建时的模板版本为准；截图使用英文界面，中英文文档共用。[搭建第一个应用](../tutorials/build-your-first-app-agent-first.md) 使用 npmjs.org 上已发布的 `1.0.0-beta.84` 模板作为基线，不需要先检出这个旧标签。

## 常见问题

### Agent 找不到创建应用的 Skill

确认安装时选中了你正在使用的 Agent。如果当前会话还没有加载新 Skill，在同一目录重新开启会话后再发送创建需求。注意区分两类指引：创建应用时使用全局安装的 `nocobase-create-app`；创建之后的开发指引则位于应用目录中。

### 应用已创建，但项目 Skills 缺失

在应用目录中执行以下命令，然后在应用目录开启新的 Agent 会话：

```bash
pnpm nocobase skills sync
```

### 启动时提示没有配置

确认终端位于应用目录，并依次执行 `pnpm nocobase config init --dialect sqlite` 和 `pnpm nocobase config check`。如果已经有配置，先排查具体错误，不要为了重试而删除配置或数据库。

## 下一步

阅读 [项目结构](project-structure.md)，了解应用代码、配置和 Agent 指引分别放在哪里。
