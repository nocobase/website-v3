---
title: 项目目录与文件约定
description: 查找应用、插件和 UI 源码资产的入口、可选目录、生成文件及维护归属。
---

第一次认识项目时阅读[项目结构](../getting-started/project-structure.md)。本页按路径查找职责和维护方式；目录中的文件名是约定示例，按实际模板和功能增减。

## 应用目录

```tree
my-app/
├── .agents/
│   ├── rules/                    # Project-owned rules
│   └── skills/                   # Synchronized dependency Skills (generated)
├── cli/
│   ├── commands/                 # App commands (optional)
│   └── plugins.ts                # CLI plugin registration
├── client/
│   ├── pages/                    # Business pages
│   ├── layouts/                  # Page layouts
│   ├── components/               # UI components
│   ├── hooks/                    # Shared interaction and state logic
│   ├── locales/                  # Translations
│   ├── theme/                    # Theme and styles
│   ├── routes.ts                 # Routes, menus and navigation
│   ├── plugins.ts                # Client plugin registration
│   └── runtime.ts                # Client assembly
├── database/
│   └── main/
│       ├── migrations/           # Schema and metadata changes
│       ├── seeds/                # Initial data
│       ├── metadata/             # External-connection metadata (optional)
│       └── collections/          # Resolved model snapshots (generated)
├── packages/                     # Workspace packages (optional)
├── public/                       # Static assets
├── server/
│   ├── routes/                   # HTTP routes and index.ts registration
│   ├── services/                 # Business implementations (optional)
│   ├── providers/                # Service registration and lifecycle
│   ├── config/                   # Defaults, validation and environment mappings
│   ├── plugins.ts                # Server plugin registration
│   └── runtime.ts                # Server assembly
├── tests/                        # Tests, fixtures and helpers
├── storage/                      # Runtime data (generated)
├── dist/                         # Build output (generated)
├── node_modules/                 # Installed dependencies (generated)
├── AGENTS.md                     # Project guidance entry
├── config.example.yml            # Configuration example
├── config.yml                    # Local/deployment configuration
├── components.json               # shadcn configuration
├── package.json                  # Scripts, dependencies and app metadata
├── pnpm-lock.yaml                # Resolved dependency versions
└── pnpm-workspace.yaml           # Workspace package directories
```

`services/`、`commands/`、本地包与外部数据库元数据目录按需建立。不要仅为匹配目录树而创建空目录。模板自带的布局、主题和运行时入口属于应用源码，修改后需要在升级时保留业务定制。

## 代码与注册入口

| 内容 | 实现位置 | 接入位置 |
| --- | --- | --- |
| 页面 | `client/pages/` | `client/routes.ts` |
| 组件和 Hooks | `client/components/`、`client/hooks/` | 由页面、布局或其他组件导入 |
| HTTP 接口 | `server/routes/` | `server/routes/index.ts` 与运行时路由声明 |
| 业务服务 | 前后端按需组织 `services/` | 各端的 ServiceProvider 与 Provider 聚合入口 |
| 运行配置 | `server/config/<section>.ts` | `server/config/index.ts` |
| 应用命令 | `cli/commands/` | CLI 按文件路径加载，放在 `app` 命名空间下 |
| 插件 | 安装包或 `packages/app-plugin-<name>/` | `client/plugins.ts`、`server/plugins.ts`、`cli/plugins.ts` 中实际提供的入口 |

`runtime.ts` 组装运行时；模板已经连接某个聚合入口时，新增业务代码通常只需更新该入口。安装依赖与注册插件分别处理，参见[安装、注册与配置](../developing-apps/manage-plugins.md)。

## 数据库资源

应用按连接名组织 `database/<connection>/`，不必把所有资源都写入 `main`。

- `migrations/` 是可执行的变更历史。已执行的迁移应保留，后续结构变化写新迁移。
- `seeds/` 维护初始化数据。演示数据与必须存在的数据应明确区分。
- `metadata/` 可维护外部数据库的标题、说明和关系等补充元数据，属于源码。
- `collections/` 是生成的查询快照，不作为迁移输入，不手改。使用 `pnpm nocobase collections generate` 更新。

插件的 `database/migrations/`、`database/seeds/` 是插件提供的资源，通过插件声明接入应用。其资源路径和连接归属见[插件数据库与迁移](../extension-development/database-and-migrations.md)。

## 本地插件、共享包与 UI 资产

```tree
packages/
├── app-plugin-orders/            # Runtime plugin
│   ├── client/
│   │   ├── components/
│   │   ├── react-providers/      # React context integration
│   │   ├── providers/            # Client ServiceProviders
│   │   ├── plugin.ts
│   │   └── index.ts              # Public Client entry
│   ├── server/
│   │   ├── services/
│   │   ├── providers/            # Server ServiceProviders
│   │   ├── tokens.ts             # Public service contracts
│   │   ├── plugin.ts
│   │   └── index.ts              # Public Server entry
│   ├── cli/
│   ├── database/
│   ├── skills/
│   ├── tests/
│   ├── AGENTS.md
│   └── package.json
├── orders-ui/                    # Independent UI Registry package
│   ├── registry/
│   ├── registry.json
│   ├── public/r/                 # Built item JSON (generated)
│   └── package.json
└── shared-domain/                # Internal shared code (optional)
    └── package.json
```

插件按需要提供 Client、Server、CLI、数据库和 Skills，不要求具备全部目录。完整结构见[插件结构](../extension-development/plugin-structure.md)。

前端组件在应用和插件中都可以自由编写、组织，基础组件使用 shadcn，模块化界面优先参考 NocoBase UI Library。需要作为可编辑源码资产交付给 Agent 时，在独立 Registry 包维护。资产可以引用一起分发且安装后路径仍有效的文件；调用插件能力时使用公开包入口或使用方传入的数据，不能相对引用旁边插件包的私有实现。

## Agent 指引的归属

| 路径 | 使用者与维护方式 |
| --- | --- |
| 应用 `AGENTS.md` 与 `.agents/rules/` | 维护当前应用的 Agent；由应用维护 |
| 插件 `AGENTS.md` | 维护插件源码的 Agent；由插件维护 |
| 插件 `skills/<name>/SKILL.md` | 在应用中使用插件的 Agent；随插件分发 |
| 应用 `.agents/skills/` | 从依赖同步的副本；修改来源包后重新同步 |

`pnpm nocobase skills sync` 更新依赖提供的指引。给插件编写 Skill 的方法见[提供 Skills 与接入示例](../extension-development/write-plugin-skills.md)。

## 生成文件与配置文件

- `dist/`：可重新构建的应用产物；通过源码修正，不直接维护。
- `node_modules/`：依赖安装结果；通过包管理器和锁文件更新。
- `storage/`：可能包含数据库、上传文件和其他业务运行数据；生成目录不等于可以随意删除。
- `config.example.yml`：提交不含真实凭据的配置示例。
- `config.yml`：当前环境的配置；不提交真实密钥和密码。
- `pnpm-lock.yaml`：提交用于复现安装的锁文件。

本页按 Core `015404ecd0db` 的模板、插件声明和已验证的默认应用 beta.83 整理。运行配置见[配置项参考](configuration.md)，包职责见[核心包索引](packages.md)。
