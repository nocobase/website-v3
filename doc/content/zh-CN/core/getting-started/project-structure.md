---
title: 项目结构
description: 了解 NocoBase 应用的主要目录，以及页面、接口、数据和测试分别写在哪里。
---

完成 [创建应用](create-app.md) 后，你会得到一个独立的应用项目。开发业务时，主要关注 `client/`、`server/`、`database/` 和 `tests/`。

## 目录概览

下面列出应用中常用的目录和文件，包括安装、运行或构建后生成的目录。不同模板和版本可能略有差异，测试目录采用最新整理后的结构。

```text
my-app/
├── .agents/             # Agent rules and Skills
├── cli/                 # Application commands
├── client/              # Pages and UI
├── database/            # Migrations and seeds
├── dist/                # Build output (generated)
├── node_modules/        # Installed dependencies (generated)
├── public/              # Static assets
├── server/              # APIs and services
├── storage/             # Runtime data (generated)
├── tests/               # Application tests
├── AGENTS.md            # Agent guidance entry
├── config.example.yml   # Configuration example
├── config.yml           # Local configuration
└── package.json         # Scripts and dependencies
```

## 业务代码放在哪里

### client：页面和交互

页面写在 `client/pages/`，通过 `client/routes.ts` 注册路由和导航。可复用的组件放在 `client/components/`，共享 Hooks 放在 `client/hooks/`。

界面文案放在 `client/locales/`，布局和主题分别放在 `client/layouts/`、`client/theme/`。

### server：接口和服务

应用接口写在 `server/routes/`，通过其中的 `index.ts` 注册。业务服务放在 `server/providers/`，配置定义放在 `server/config/`。

### database：数据结构和初始数据

`database/` 按数据库连接组织，默认连接为 `main`：

- `main/migrations/`：创建或调整数据表、字段。
- `main/seeds/`：准备初始数据。

修改数据结构时添加新的迁移。运行后生成的 `collections/` 是结构快照，不直接编辑。

### cli：应用命令

`cli/plugins.ts` 注册命令行插件。需要编写自己的命令时，再创建 `cli/commands/`。

客户端和服务端的插件分别在 `client/plugins.ts`、`server/plugins.ts` 中注册。

## package.json：预装的插件

模板通过 `package.json` 引入插件依赖，提供用户、权限、文件、通知等通用能力。下面按本文参考应用列出已安装的插件包；不同模板和版本可能不同，以自己项目的依赖清单为准。

表中省略统一前缀 `@nocobase/app-plugin-`。例如 `users` 的完整包名是 `@nocobase/app-plugin-users`。

| 插件包                    | 用途                               |
| ------------------------- | ---------------------------------- |
| `agents`                  | Agent、模型服务、会话和运行管理    |
| `api-keys`                | API Key 认证                       |
| `authentication`          | 登录与身份认证                     |
| `authorization`           | 权限控制与权限管理界面             |
| `authz-default-access`    | 默认数据访问范围                   |
| `authz-restriction-rules` | 数据访问限制规则                   |
| `authz-sharing-rules`     | 数据共享规则                       |
| `database-explorer`       | 只读浏览数据库连接、数据表和字段   |
| `file`                    | 文件存储库、上传和访问             |
| `foundation`              | 查看应用使用的 Core 能力及运行信息 |
| `i18n`                    | 界面语言切换                       |
| `knowledge`               | 文档知识空间、搜索和版本管理       |
| `mail`                    | 邮件发送与邮箱同步                 |
| `notification`            | 通知存储、投递和日志               |
| `notification-in-app`     | 站内信与收件箱                     |
| `notification-providers`  | 内置通知渠道与发送服务             |
| `scheduler`               | 定时任务调度                       |
| `template-print`          | 模板打印的开发 Skill               |
| `users`                   | 用户管理接口和页面                 |

**已安装不等于已启用。** `package.json` 声明依赖，`client/plugins.ts`、`server/plugins.ts`、`cli/plugins.ts` 分别注册客户端、服务端和命令行插件；一个插件不一定同时提供这三个入口。

当前参考应用中，`agents`、`knowledge` 和 `template-print` 没有出现在这三份注册列表里。其中 `template-print` 位于 `devDependencies`，提供 Agent 开发指引，不是安装后自动出现的打印页面。

## tests：测试放在哪里

当前入门示例基于默认模板 `1.0.0-beta.81`，测试按被测代码组织，与业务目录对应：

```text
tests/
├── client/              # Pages, components and client logic
├── server/              # APIs, services and permissions
├── database/            # Migrations and seeds
├── cli/                 # Commands (optional)
├── project/             # Project configuration and builds
├── fixtures/            # Test data and fixture applications
├── helpers/             # Shared test helpers
├── setup/               # Test environment setup
└── playwright/          # Browser tests (optional)
```

`cli/` 和 `playwright/` 按需创建，Examples 模板已包含它们。测试用例放在对应业务目录，辅助数据和函数放在 `fixtures/`、`helpers/`。

在应用根目录运行 `pnpm test` 执行 Vitest 测试；浏览器测试由 `pnpm test:e2e` 单独运行。测试优先使用真实服务和隔离的数据库，非必要不使用 mock。旧项目可能仍使用 `tests/components/`、`tests/logic/`，应以其模板版本和测试配置为准；详细说明见[测试与验收](../developing-apps/testing-and-acceptance.md)。

## 配置和 Agent 指引

`config.example.yml` 是配置示例，`config.yml` 在初始化配置后生成，保存本地数据库连接等环境配置，不提交到 Git。`package.json` 保存项目脚本和依赖。

`AGENTS.md` 是 Agent 的阅读入口。应用自己的开发约定放在 `.agents/rules/`；`.agents/skills/` 由依赖包同步生成，提供开发指引，不直接修改。

安装和运行后还会出现 `node_modules/`、`storage/`、`dist/` 等目录，分别保存依赖、运行数据和构建产物。

## 从一个功能开始

例如新增订单管理，可以依次找到这些位置：

1. **数据结构**：在 `database/main/migrations/` 添加订单表迁移。
2. **接口**：在 `server/routes/` 添加订单接口和权限检查。
3. **页面**：在 `client/pages/` 编写页面，并在 `client/routes.ts` 注册。
4. **测试**：在 `tests/database/`、`tests/server/`、`tests/client/` 验证对应行为。

## 下一步

阅读 [搭建第一个应用](../tutorials/build-your-first-feature.md)，在应用中完成带负责人、截止日期和进度的团队任务功能。
