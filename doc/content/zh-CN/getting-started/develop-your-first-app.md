---
title: 用 Core 开发第一个应用
metaDescription: "创建并启动 NocoBase 应用，让 Coding Agent 开发客户管理、检查权限，并继续迭代业务功能。"
---

从空目录创建一个 NocoBase 应用，再让 Coding Agent 开发客户管理：记录客户、负责销售和下次跟进，并按角色限制查看与修改范围。完成后，你可以登录应用操作客户数据，并继续提出需求迭代。

## 准备环境

- Node.js 24 或更高版本，pnpm 11（环境安装见[准备开发环境](../guides/prepare-environment.md)）。
- 至少一个已安装并登录的本地 Coding Agent，例如 Claude Code、Codex 或 Cursor。
- Windows 上在 WSL 中操作；下面的命令都在 Bash 等 POSIX shell 中运行。

以下使用 SQLite，无需单独安装数据库服务。使用其他数据库，请参阅[使用不同数据库创建应用](../core/developing-apps/database-configuration.md)。

## 创建并启动应用

下面提供两种并列方式，任选其一即可，完成后直接进入[登录应用](#登录应用)。

### 方式一：交给 Coding Agent 创建（推荐）

全局安装创建应用的 Skill（首次需要），按提示选择你使用的 Coding Agent：

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

如果 Coding Agent 已经打开，重新开启会话让新安装的 Skill 生效。然后新建并进入一个空目录（例如 `my-app`），打开 Coding Agent 发送：

```bash
mkdir my-app && cd my-app
```

```prompt
在当前空目录创建一个本地开发用的 NocoBase 3 应用，使用默认模板和 SQLite。
启动后告诉我访问地址和首次登录的账号。
```

Coding Agent 会自动创建应用、生成配置并启动，完成后告诉你访问地址和首次登录的账号。

### 方式二：手动执行命令创建

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

## 登录应用

在浏览器打开应用地址（例如 `http://127.0.0.1:13000/main/`），用默认管理员登录：用户名 `nocobase`，密码 `admin123`。

- **方式一**：使用 Coding Agent 告诉你的地址。
- **方式二**：使用终端输出的 `Local:` 地址。

地址末尾带有应用路径（如 `/main/`），打开时不要漏掉。登录后进入首页，可以看到应用自带的基础能力以及需求示例：

![刚创建的应用首页，还没有业务功能。](/assets/core/tutorials/getting-started/home.png)

## 提出第一个业务需求

在应用根目录 `my-app` 的 Coding Agent 会话中提出业务需求。如果刚才是手动执行命令启动的应用，保持 `pnpm dev` 终端继续运行，另开一个终端进入 `my-app` 目录启动 Coding Agent。

把下面这段发给 Coding Agent：

```prompt
帮我做客户管理。客户有名称、联系方式、备注、负责销售、下次跟进日期，状态分潜在、跟进中、已成交。
可以新建、查看、编辑、删除客户，按名称搜索，按状态筛选。
销售主管管理全部客户；销售只能查看自己负责的客户，并更新它们的状态；只读用户可以查看全部客户，不能修改。
```

需求只写业务：要记录什么、能做哪些操作、谁能做什么。Coding Agent 会按项目自带的 Skill 处理用户和权限管理、多语言文案、测试和汇报。

开始编码前，Coding Agent 会先给出设计方案，请你确认页面结构、主要交互和需要决定的问题。回答并确认后，它会开始开发。

## 检查功能与权限

开发完成后，Coding Agent 会运行测试并在浏览器里逐项验收、截图，然后交给你一份报告，列出已完成项和未验证部分。验收需要登录时，它会请你自己登录。

打开应用地址，侧边栏出现 **Customers**。在这里可以新建客户、指定负责销售和下次跟进日期、更新状态，也可以搜索和筛选：

![客户列表，包含状态、负责销售、下次跟进日期和分页。](/assets/core/tutorials/crm/customer-list-en.png)

Coding Agent 会一并启用用户管理和权限管理。按下面的步骤检查销售角色的权限范围：

1. 在 **System settings → Users** 添加一个用户，在 **Permission sets** 中加上销售角色（示例应用里叫 `Sales rep`）。
2. 新建一个客户，负责销售选这个用户。
3. 换这个账号登录。客户列表里只有这个用户负责的客户；可以更新状态，不能编辑资料或删除。

再分别用销售主管和只读用户检查：主管应能管理全部客户；只读用户能查看全部客户，但不能新建、修改或删除。若报告中有未验证项，先完成对应检查，再继续增加功能。

## 调整功能并继续迭代

如果结果不符合预期，或者想换一种做法，直接告诉 Coding Agent 你做了什么、看到了什么、期望什么：

```prompt
我用只分配了销售角色的账号登录，仍能看到别人负责的客户。
销售应该只能看到自己负责的客户。
```

交互也可以直接提，例如“点击客户名称先打开详情，再决定是否编辑”。

接下来可以继续增加客户跟进记录。仍在应用根目录的 Coding Agent 会话中提出需求：

```prompt
给客户加上跟进记录。销售每次联系客户后记一条：日期、方式（电话、拜访或邮件）和内容。
客户详情里按时间倒序显示跟进记录。
销售只能给自己负责的客户记跟进；销售主管能看全部记录；只读用户只能查看。
已有的客户不用补历史记录。
```

先确认设计，再按销售、主管和只读用户分别检查结果。需求较大时，按可独立使用的业务功能拆分（例如跟进记录、销售机会、报价和销售报表），每完成一部分就验证一次。

长期适用的约定可以让 Coding Agent 保存到项目规范，例如“以后所有日期都按公司所在的时区计算，保存到项目规范”。这些约定记录在 `.agents/rules/`，由 `AGENTS.md` 索引，供后续会话使用。

查看[CRM 示例源码](https://github.com/nocobase/docs-examples-v3/tree/8ad953049469ab6b1e703be2a1b07f80f28ed592/apps/crm)及其 [README](https://github.com/nocobase/docs-examples-v3/blob/8ad953049469ab6b1e703be2a1b07f80f28ed592/apps/crm/README.MD)。理解文件分工可查阅[项目结构](../core/developing-apps/project-structure.md)；下一步体验团队工作台，请继续阅读[安装并使用 Studio](collaborate-with-studio.md)，或查阅[学习路径](learning-path.md)。
