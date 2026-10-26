---
title: 创建应用
description: 通过 Coding Agent 或手动命令创建 NocoBase 3 应用，启动并登录。
---

创建一个 NocoBase 应用，会得到一份可以继续开发的项目代码。你可以让 Coding Agent 完成创建，也可以自己在终端执行命令。两种方式使用同一个创建工具。

本文使用默认模板和 SQLite。SQLite 无需单独安装数据库服务，适合第一次在本地运行应用。

## 准备环境

在终端确认已经安装 Node.js 24 或更高版本，以及 pnpm 11：

```bash
node --version
pnpm --version
```

Windows 用户请在 WSL 中操作。下面的命令适用于 Bash 等 POSIX shell。

选择一种创建方式即可。如果使用 Agent，还需要一个支持 Skills 的 Coding Agent。

## 使用 Agent

### 1. 安装创建应用的 Skill

在终端执行：

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

按提示选择你使用的 Agent。安装完成后开启新的 Agent 会话，让它加载这个 Skill。`nocobase/skills-v3` 提供 NocoBase 3 的 Skills。

### 2. 在空目录中打开 Agent

例如，先创建一个名为 `my-app` 的目录：

```bash
mkdir my-app
cd my-app
```

在这个目录中打开 Coding Agent，发送：

```text
请在当前空目录中创建一个供本地开发使用的 NocoBase 3 应用。
使用默认模板和 SQLite，按创建应用的指引完成准备和检查。
启动后告诉我打开哪个地址，以及如何完成首次登录。
```

Agent 会调用创建工具，安装依赖，初始化配置并启动应用。完成后，它会提供应用地址和登录信息。

### 3. 进入应用

打开 Agent 提供的应用地址，并按照本文的[打开应用并登录](#打开应用并登录)完成首次登录。

创建完成后，应用目录里会出现 `AGENTS.md` 和 `.agents/skills/`。继续开发时，在这个应用目录中开启新的 Agent 会话，让它读取项目自己的规则和 Skills。

## 不使用 Agent

手动创建不需要安装 Agent Skill。在用于存放项目的父目录执行以下命令，创建工具会新建 `my-app` 目录并安装依赖：

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
```

`@beta` 选择 NocoBase 3 创建工具的 beta 版本，`--template-tag=beta` 选择模板的 beta 版本。命令前的环境变量允许 pnpm 安装刚发布的版本，只对这次执行生效。

> **提示**
>
> 项目目录使用一个尚不存在或为空的目录，名称使用小写字母、数字、点、短横线或下划线，并以字母或数字开头。创建命令不接受 `.` 作为项目名；如果已经在空的 `my-app` 目录内，先返回父目录再执行上面的命令。

### 1. 初始化配置

进入应用目录，生成本地配置：

```bash
cd my-app
pnpm nocobase config init --dialect sqlite
```

这会根据 `config.example.yml` 生成 `config.yml`，并初始化所需的密钥。`config.yml` 是当前环境的配置，已被 Git 忽略。

### 2. 检查配置

```bash
pnpm nocobase config check
```

如果检查失败，按命令给出的提示修复后重新检查。检查通过再启动应用。

### 3. 启动应用

```bash
pnpm dev
```

保持这个终端运行。开发服务器就绪后，终端会输出 `Local:` 地址；打开该地址访问应用。

## 打开应用并登录

使用 `pnpm dev` 输出的完整 `Local:` 地址，包括应用路径，例如 `/main/`。端口可能随占用情况变化，不要根据默认端口拼接地址，也不要把前端 Vite 的端口当作完整应用入口。

在未修改初始管理员配置的情况下，默认登录信息是：

- 用户名：`nocobase`
- 密码：`admin123`

初始管理员由 `config.yml` 中的 `users.initialAdmin` 配置。如果创建时调整过它，请使用实际配置的账号。首次登录后修改默认密码。

登录后会看到应用首页，其中包含内置能力介绍和可以交给 Agent 的需求示例。此时你已经有一份应用代码和一个可运行的应用，可以开始开发业务功能。

## 常见问题

### Agent 没有找到创建应用的 Skill

确认安装时选中了当前使用的 Agent，并在安装后开启了新会话。创建之前使用的是全局 `nocobase-create-app`；创建之后的开发指引位于应用目录中。

### 应用已经创建，但项目 Skills 缺失

在应用目录执行：

```bash
pnpm nocobase skills sync
```

然后在应用目录开启新的 Agent 会话。

### 启动时提示没有配置

确认终端位于应用目录，并完成 `pnpm nocobase config init --dialect sqlite` 和 `pnpm nocobase config check`。已有配置时先检查具体错误，不要为了重试而删除配置或数据库。

## 下一步

阅读 [项目结构](project-structure.md)，了解应用代码、配置和 Agent 指引分别放在哪里。

## 本地示例界面

下方截图来自默认模板 `1.0.0-beta.78` 的历史示例 [00-create-app](https://github.com/nocobase/app-tutorials/tree/00-create-app)，用于展示登录和首页，实际界面以创建时的模板为准。[搭建第一个应用](../tutorials/build-your-first-feature.md)使用 npmjs.org 已发布的 `1.0.0-beta.81` 模板基线，不需要先检出这个旧标签。截图使用英文，两种语言的文档共用。

![初次打开应用的英文登录页。](/assets/core/tutorials/getting-started/login.png)

![刚创建的应用首页，尚未添加任务功能。](/assets/core/tutorials/getting-started/home.png)
