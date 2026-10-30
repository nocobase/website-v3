---
title: 项目结构
description: 了解 NocoBase 应用的主要目录，以及页面、接口、数据和测试分别写在哪里。
---

## 目录概览

[创建应用](../getting-started/create-app.md)得到的是一个可以直接修改的源码项目。以下以默认应用模板为例，列出开发时常用的位置；配置文件、依赖和构建产物会在对应步骤完成后生成。

```text
my-app/
├── client/              # Pages, components and client logic
├── server/              # APIs and business services
├── database/            # Migrations and seeds, grouped by connection
├── cli/                 # Application commands and CLI plugins
├── tests/               # Tests and test helpers
├── public/              # Static assets
├── packages/            # Local workspace packages (optional)
├── .agents/
│   ├── rules/           # Project-owned Agent rules
│   └── skills/          # Synchronized dependency Skills (generated)
├── AGENTS.md            # Agent guidance entry
├── config.example.yml   # Configuration example
├── config.yml           # Local configuration (generated during setup)
├── package.json         # Scripts and dependencies
├── pnpm-lock.yaml       # Resolved dependency versions
├── pnpm-workspace.yaml  # Workspace settings
├── node_modules/        # Installed dependencies (generated)
├── dist/                # Build output (generated)
└── storage/             # Runtime data
```

目录会随模板版本和业务功能变化。`packages/` 等可选目录按需创建，不必为了匹配目录树而补齐。

## 页面、接口和数据写在哪里

| 要做的改动 | 主要位置 | 如何接入应用 |
| --- | --- | --- |
| 新增页面或菜单 | `client/pages/` | 在 `client/routes.ts` 注册页面路由和导航 |
| 复用界面组件或交互逻辑 | `client/components/`、`client/hooks/` | 由页面或其他组件导入 |
| 调整布局、主题或界面文案 | `client/layouts/`、`client/theme/`、`client/locales/` | 在对应布局、主题或语言资源中修改 |
| 添加图片等静态资源 | `public/` | 在页面或样式中引用资源地址 |
| 新增 HTTP 接口 | `server/routes/` | 在 `server/routes/index.ts` 注册 |
| 提取业务服务 | 按需创建 `server/services/` | 由接口调用；需要统一注册和管理生命周期时使用 `server/providers/` |
| 创建或调整数据表 | `database/main/migrations/` | 添加迁移，由应用执行数据库变更 |
| 准备初始数据 | `database/main/seeds/` | 添加初始化数据逻辑 |
| 新增应用命令 | 按需创建 `cli/commands/` | 按应用 CLI 的命令目录约定组织 |

页面和接口需要接入相应的注册入口，单独新增文件不会自动成为可访问的页面或 API。安装到 `client/extensions/` 的 UI 源码也属于应用源码，通过导入接入页面或组件。

`database/` 按连接名组织，`main` 是默认连接。已经执行过的迁移应保留，后续结构变化写成新迁移。具体写法见[建表与数据初始化](data-models-and-migrations.md)。

例如添加客户管理，通常会涉及客户表迁移、客户接口、客户页面及其注册文件。可以跟随[开发第一个功能](../getting-started/build-your-first-app.md)，对照一个实际功能理解这些位置。

## 配置、依赖和插件

### 配置文件

| 位置 | 用途 |
| --- | --- |
| `config.example.yml` | 可提交的配置示例，不包含真实凭据 |
| `config.yml` | 当前环境的数据库连接、密钥等配置，不提交到 Git |
| `server/config/` | 在代码中定义配置默认值、校验规则和环境变量映射 |

修改当前环境的连接信息时，查看 `config.yml`；为业务增加新的配置项时，再修改 `server/config/` 中的定义。配置加载方式和命令见[应用配置](configuration-and-settings.md)。

### 依赖与插件注册

`package.json` 保存运行、测试和构建脚本，以及依赖清单。`pnpm-lock.yaml` 记录解析后的依赖版本，需要随源码提交。

模板通过插件提供用户、认证、权限、文件等能力。查看 `package.json` 可以知道安装了哪些包，但实际接入了哪些能力，还要看各端的注册文件：

| 文件 | 注册内容 |
| --- | --- |
| `client/plugins.ts` | 客户端插件 |
| `server/plugins.ts` | 服务端插件 |
| `cli/plugins.ts` | 命令行插件 |

一个插件不一定同时提供三个入口，有些包只提供开发 Skills。安装依赖、注册插件以及接入页面分别处理，操作步骤见[管理插件](manage-plugins.md)，各插件的用途见[插件索引](../reference/plugins.md)。

需要维护本地插件或共享包时，放在 `packages/`，并在 `pnpm-workspace.yaml` 中配置工作区包目录。需要独立分发 UI 源码资产时，也可以在这里维护 UI Registry 包；详细结构见[项目目录与文件约定](../reference/project-conventions.md#本地插件共享包与-ui-资产)。

## 测试放在哪里

测试集中在 `tests/`，按被测代码的职责组织：

| 目录 | 内容 |
| --- | --- |
| `tests/client/` | 页面、组件和客户端逻辑 |
| `tests/server/` | 接口、服务和权限 |
| `tests/database/` | 迁移、初始数据和数据库行为 |
| `tests/cli/` | 应用命令，按需创建 |
| `tests/project/` | 项目配置和构建 |
| `tests/fixtures/`、`tests/helpers/`、`tests/setup/` | 测试数据、共享辅助函数和环境初始化 |
| `tests/playwright/` | 浏览器操作测试，按需创建 |

在应用根目录运行 `pnpm test` 执行 Vitest 测试。浏览器测试使用 `pnpm test:e2e`，需要按测试配置准备运行中的应用和登录信息。具体准备步骤见[测试与验收](testing-and-acceptance.md)。

已有项目的目录可能不同，以 `vitest.config.ts` 和 `playwright.config.ts` 中的配置为准。检查报告中的实际用例数；没有找到用例时正常退出，不代表功能已经通过验证。

## Agent 读取哪些指引

`AGENTS.md` 是应用开发指引的入口。使用 Agent 开发时，区分项目自己维护的约定和依赖包提供的 Skills：

| 位置 | 维护方式 |
| --- | --- |
| `AGENTS.md`、`.agents/rules/` | 保存本项目的开发约定，随源码维护和提交 |
| `.agents/skills/` | 从依赖包同步生成，不直接修改或提交这些副本 |

需要补充业务约定时，写入项目指引，见[持续开发应用](../getting-started/develop-with-an-agent.md#保存项目规范)。需要更新依赖提供的 Skills 时，在应用目录运行 `pnpm nocobase skills sync`，更多选项见[命令行参考](../reference/cli.md#插件与-skills)。

## 生成文件与运行数据

以下内容不作为业务源码维护：

| 位置 | 处理方式 |
| --- | --- |
| `node_modules/` | 通过包管理器安装和更新，不直接修改依赖文件 |
| `dist/` | 通过 `pnpm build` 生成；修改源码后重新构建 |
| `database/<connection>/collections/` | 数据结构快照，通过 `pnpm nocobase collections generate` 更新，不手动编辑 |
| `storage/` | 保存运行数据，可能包含上传文件、日志或数据库文件，需要按实际配置保留和备份 |

SQLite 数据库的位置由连接配置决定，也可能在应用根目录。数据库文件和 `storage/` 中的业务数据不能当作构建缓存删除。完整路径约定见[项目目录与文件约定](../reference/project-conventions.md)。
