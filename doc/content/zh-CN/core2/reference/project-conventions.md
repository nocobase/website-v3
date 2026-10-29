---
title: 项目目录与文件约定
description: 查找应用、插件和 UI 源码资产的入口、可选目录、生成文件，以及各自由谁维护。
---

初次了解项目时，请先阅读 [项目结构](../getting-started/project-structure.md)。本页按路径查找各部分的职责和维护方式；目录中的文件名是约定的示例，请按实际的模板和功能增减。

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

`services/`、`commands/`、本地包以及外部数据库的元数据目录，按需建立即可，不要仅仅为了与目录树一致而创建空目录。模板自带的布局、主题和运行时入口都属于应用源码；修改之后，升级时需要保留这些业务定制。

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

`runtime.ts` 负责组装运行时；模板已经接入某个汇总入口时，新增业务代码通常只需要更新这个入口。安装依赖和注册插件是两个分开的步骤，参见 [管理插件](../developing-apps/manage-plugins.md)。

## 数据库资源

应用按连接名组织 `database/<connection>/`，不必把所有资源都放进 `main`。

- `migrations/` 是可执行的变更历史。已经执行的迁移应保留，之后的结构变化写成新的迁移。
- `seeds/` 维护初始化数据，演示数据与必须存在的数据应明确区分。
- `metadata/` 用于维护外部数据库的标题、说明和关系等补充元数据，属于源码。
- `collections/` 是生成的查询快照，不作为迁移的输入，也不要手工修改；使用 `pnpm nocobase collections generate` 更新。

插件中的 `database/migrations/`、`database/seeds/` 是插件提供的资源，通过插件声明接入应用。资源的路径和所属连接，见 [数据库资源与迁移](../extension-development/database-and-migrations.md)。

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

插件按需提供 Client、Server、CLI、数据库和 Skills，并不要求具备全部目录。完整的结构见 [插件结构](../extension-development/plugin-structure.md)。

前端组件在应用和插件中都可以自由编写和组织：基础组件使用 shadcn，模块化的界面优先参考 NocoBase UI Library。需要作为可编辑的源码资产交付给 Agent 时，请在独立的 Registry 包中维护。资产可以引用一起分发、并且安装后路径仍然有效的文件；需要调用插件的能力时，使用公开的包入口或使用方传入的数据，不能通过相对路径引用旁边插件包的私有实现。

## Agent 指引的归属

| 路径 | 使用者与维护方式 |
| --- | --- |
| 应用 `AGENTS.md` 与 `.agents/rules/` | 维护当前应用的 Agent；由应用维护 |
| 插件 `AGENTS.md` | 维护插件源码的 Agent；由插件维护 |
| 插件 `skills/<name>/SKILL.md` | 在应用中使用插件的 Agent；随插件分发 |
| 应用 `.agents/skills/` | 从依赖同步的副本；修改来源包后重新同步 |

`pnpm nocobase skills sync` 用于更新依赖提供的指引。为插件编写 Skill 的方法，见 [插件 Skill](../extension-development/write-plugin-skills.md)。

## 生成文件与配置文件

- `dist/`：可以重新构建的应用产物；需要修正时改源码，不直接维护它。
- `node_modules/`：依赖的安装结果；通过包管理器和锁文件更新。
- `storage/`：可能包含数据库、上传的文件和其他业务运行数据；它是生成的目录，但不代表可以随意删除。
- `config.example.yml`：提交到仓库的配置示例，不含真实的凭据。
- `config.yml`：当前环境的配置；不要提交真实的密钥和密码。
- `pnpm-lock.yaml`：提交到仓库，用于复现依赖安装的锁文件。

本页根据 Core `015404ecd0db` 的模板、插件声明，以及已验证的默认应用 beta.83 整理。运行配置见 [配置项参考](configuration.md)，各个包的职责见 [核心包与工具包索引](packages.md)。
