---
title: 插件的结构
description: 了解插件在 App 中的位置、目录与入口的连接方式，以及源码和构建产物的关系。
---

本篇以 create-app 创建的 App 为前提，说明本地插件的文件放在哪里、各自负责什么，以及怎样接入应用。插件位于 App 的 `packages/` 下，目录随所选能力变化，不要求每个插件都具备 Client、Server 和 CLI。

## 插件在 App 中的位置

以“公告栏插件”为例：它提供一个公告页面和一个读取公告的接口。下面展示完成开发并注册到 App 后的主要文件，通用配置和部分测试文件已省略。`client/pages/`、`shared/` 和页面组件是在骨架上新增的，完整实现见[编写第一个插件](write-your-first-plugin.md)。

```text
my-app/
├── client/plugins.ts                          # App 注册客户端入口
├── server/plugins.ts                          # App 注册服务端入口
├── packages/
│   └── app-plugin-announcements/
│       ├── client/
│       │   ├── components/                    # 页面容器与标题组件
│       │   ├── pages/announcements.tsx        # 公告页面，请求接口并显示列表
│       │   ├── locales/                       # 菜单与页面文案
│       │   ├── routes.ts                      # 页面路由和菜单入口
│       │   ├── plugin.ts                      # 组合客户端贡献
│       │   └── index.ts                       # 公开客户端入口
│       ├── server/
│       │   ├── routes/index.ts                # 公告查询接口
│       │   ├── routes/schemas.ts              # 接口响应结构
│       │   ├── plugin.ts                      # 组合服务端贡献
│       │   └── index.ts                       # 公开服务端入口
│       ├── shared/announcement.ts             # 前后端共用的数据类型
│       ├── tests/                             # 接口、页面与路由测试
│       ├── package.json                       # 依赖、导出和脚本
│       └── AGENTS.md                          # 插件开发指引
├── package.json                               # 用 workspace:* 引用插件
└── pnpm-workspace.yaml                        # 包含插件所在目录
```

打开页面后，`client/pages/announcements.tsx` 发起请求，`server/routes/index.ts` 返回公告，页面再显示列表。这个例子让页面与接口属于同一个插件；它只读取固定示例数据，因此不需要插件自己的数据库迁移，也不需要 CLI 入口。

插件的 `package.json` 公开 Client 和 Server 入口，App 的两个 `plugins.ts` 分别注册它们。包依赖让 App 找到插件，注册让 App 加载插件的能力。创建工具的使用见[创建插件](create-plugin.md)，下面的完整目录用于查阅其他能力。

## 完整目录结构

下面以 App 中的 `demo-full` 本地插件为例，汇总各类能力的完整目录结构。`client/`、`server/`、`database/`、`cli/` 和 `skills/` 都按所选能力生成，实际插件只保留需要的部分。图中额外标出了开发时按需新增的 `client/pages/` 和构建后生成的 `dist/`；语言资源仅省略了其他语种的文件名。

```text
packages/app-plugin-demo-full/
├── client/                                     # 客户端（可选）
│   ├── components/                             # 插件组件
│   │   ├── plugin-component.tsx
│   │   └── provider.tsx
│   ├── contexts.ts                             # React 上下文定义
│   ├── index.ts                                # 公开客户端入口
│   ├── locales/                                # 客户端语言资源
│   │   ├── en-US.ts
│   │   ├── index.ts
│   │   ├── zh-CN.ts
│   │   └── …
│   ├── pages/                                  # 按需新增：业务页面目录
│   ├── plugin.ts                               # 组合客户端贡献
│   ├── providers/                              # 客户端服务与生命周期
│   │   ├── demo-full.ts
│   │   └── index.ts
│   ├── react-providers/                        # 注册 React Provider
│   │   └── index.ts
│   ├── routes.ts                               # 页面路由声明
│   └── styles.css                              # 客户端样式
├── server/                                     # 服务端（可选）
│   ├── index.ts                                # 公开服务端入口
│   ├── jobs/                                   # 后台任务与执行器 Provider
│   │   ├── demo-full.ts
│   │   └── provider.ts
│   ├── locales/                                # 服务端语言资源
│   │   ├── en-US.ts
│   │   ├── index.ts
│   │   ├── zh-CN.ts
│   │   └── …
│   ├── plugin.ts                               # 组合服务端贡献与资源路径
│   ├── providers/                              # 服务注册与生命周期
│   │   ├── demo-full.ts
│   │   └── index.ts
│   ├── routes/                                 # HTTP 接口声明
│   │   └── index.ts
│   ├── services/                               # 业务实现
│   │   └── demo-full.ts
│   └── tokens.ts                               # 公开服务接口与 token
├── database/                                   # 插件数据（可选）
│   ├── README.md
│   ├── migrations/                             # 迁移草稿，实现后启用
│   │   └── 202610260001_demo_full_create_records.ts.example
│   └── seeds/                                  # 种子数据草稿，实现后启用
│       └── 202610260002_demo_full_create_welcome_record.ts.example
├── cli/                                        # 命令行（可选）
│   ├── index.ts                                # CLI 声明
│   └── info.ts                                 # 示例命令实现
├── skills/                                     # 应用 Agent 集成指引（可选）
│   └── nocobase-app-plugin-demo-full/
│       └── SKILL.md
├── tests/                                      # 按能力生成的测试
│   ├── cli/
│   │   └── info.test.ts
│   ├── client/
│   │   ├── component.test.tsx
│   │   ├── react-provider.test.tsx
│   │   ├── routes.test.ts
│   │   └── service-provider.test.ts
│   ├── database/
│   │   └── migrations.test.ts
│   └── server/
│       ├── jobs.test.ts
│       ├── plugin.test.ts
│       ├── routes.test.ts
│       └── service-provider.test.ts
├── dist/                                       # 构建生成：插件编译产物
├── components.json                             # 带客户端代码时生成的 shadcn 配置
├── package.json                                # 依赖、导出和脚本
├── package.ts                                  # 包基础标记，保证空插件也可构建
├── tsconfig.json                               # 类型检查与编译配置
├── eslint.config.js                            # 代码检查配置
├── vitest.config.ts                            # 测试配置
├── .gitignore                                  # Git 忽略规则
├── .prettierignore                             # 格式化忽略规则
├── AGENTS.md                                   # 插件源码开发指引
├── CLAUDE.md                                   # 引用 AGENTS.md 的 Agent 指引
├── README.md                                   # 插件说明
└── CHANGELOG.md                                # 版本变更记录
```

迁移与种子文件名中的时间戳随生成日期变化。`client/pages/` 用于组织实际页面，页面还需要接入 `client/routes.ts`；创建目录本身不会注册路由。

目录树中的文件分三类：创建工具生成的骨架、开发时按需新增的源码，以及构建生成的产物。`client/pages/` 属于第二类，`dist/` 属于第三类。实际生成哪些能力目录，以创建时的选择为准，参数说明见[创建插件](create-plugin.md)。

## 入口如何连接

插件中的实现、插件对外的入口，以及 App 的注册文件各有职责：

| 位置 | 职责 |
| --- | --- |
| 插件的组件、路由、服务或命令文件 | 实现具体功能 |
| 插件的 `client/plugin.ts`、`server/plugin.ts` | 组合对应运行时的贡献，例如路由、Provider 和数据库资源 |
| 插件的 `client/index.ts`、`server/index.ts` | 对外导出插件定义；脚手架中通常转出同目录的 `plugin.ts` |
| 插件的 `cli/index.ts` | 直接声明并导出命令行插件，没有单独的 `cli/plugin.ts` |
| 插件的 `package.json` | 将这些入口声明为包的公开导出 |
| App 的 `client/plugins.ts`、`server/plugins.ts`、`cli/plugins.ts` | 注册插件提供的对应入口 |

公告页面和接口各有一条接入路径：

```text
客户端：pages/announcements.tsx → client/routes.ts → client/plugin.ts
       → client/index.ts → package.json 的 ./client → App client/plugins.ts

服务端：server/routes/index.ts → server/plugin.ts
       → server/index.ts → package.json 的 ./server → App server/plugins.ts
```

插件的 `client/plugin.ts` 和 App 的 `client/plugins.ts` 属于不同的包：前者定义插件提供什么，后者决定应用加载哪些插件。新增页面或接口时，通常修改插件内部的实现与路由声明；App 已注册对应运行时入口后，不需要为每个页面或接口重复注册插件。

### 三种运行时入口

| 插件的公开导出 | App 注册文件 | 接入方式 |
| --- | --- | --- |
| `<package>/client` | `client/plugins.ts` | 调用客户端工厂，可传入插件支持的配置 |
| `<package>/server` | `server/plugins.ts` | 加入服务端插件定义 |
| `<package>/cli` | `cli/plugins.ts` | 加入命令行插件定义 |

只接入插件实际提供的入口。例如，仅选择 `client.components` 时，生成的是公开组件导出，没有 `client/index.ts` 或 `client/plugin.ts`，应用通过 `import` 使用组件即可。选择 `database` 时，则会生成服务端入口，用来声明数据库资源。

创建工具负责生成入口，`pnpm nocobase plugin register` 负责把运行时入口接入 App。完整操作见[编写第一个插件](write-your-first-plugin.md)。

## 关键文件说明

### package.json：包信息、依赖与公开导出

插件有自己的 `package.json`，与 App 根目录的文件分别维护：

| 字段 | 插件中的作用 |
| --- | --- |
| `name`、`version` | 标识插件包及其版本 |
| `private` | 本地插件默认设为 `true`，可以在 App 内使用，无需发布 npm |
| `exports` | 声明消费者可以导入的路径；脚手架使用源码入口供本地开发 |
| `publishConfig.exports` | 对应构建产物的导出映射，也供 App 构建收集本地包时使用 |
| `files` | 包需要携带的内容，如 `dist/`；选择 Skills 时还包括 `skills/` |
| `scripts` | 插件自身的检查、测试和构建命令 |

App 的 `package.json` 则通过 `dependencies` 中的 `workspace:*` 引用本地插件。包依赖让 App 找到它，运行时注册决定 App 加载哪些能力。

依赖也应声明在实际使用它的包中，保留脚手架生成的分类：普通服务端运行依赖放在 `dependencies`；需要与宿主共享实例的运行时，以及客户端运行依赖放在 `peerDependencies`；测试与构建工具放在 `devDependencies`。不要仅因为 App 安装了某个包，就省略插件自己的依赖声明。

以公告栏插件为例，下面只摘录 Client 和 Server 的导出字段：

```json
{
  "exports": {
    "./client": {
      "types": "./client/index.ts",
      "import": "./client/index.ts"
    },
    "./server": {
      "types": "./server/index.ts",
      "import": "./server/index.ts"
    }
  },
  "publishConfig": {
    "exports": {
      "./client": {
        "types": "./dist/client/index.d.ts",
        "import": "./dist/client/index.js"
      },
      "./server": {
        "types": "./dist/server/index.d.ts",
        "import": "./dist/server/index.js"
      }
    }
  }
}
```

App 分别使用 `@nocobase/app-plugin-announcements/client` 和 `@nocobase/app-plugin-announcements/server`，不直接引用插件内部源码。新增公开组件、服务或类型时，也要保持源码导出与构建产物的映射一致。

### database：插件的数据资源

`database/migrations/` 保存迁移，`database/seeds/` 保存种子数据。创建工具生成的 `.ts.example` 是草稿，不会执行；完善后去掉 `.example` 后缀，并保持文件名与导出的任务名称一致。

`server/plugin.ts` 通过 `database` 配置声明这些目录，资源路径相对于插件的绝对路径 `baseDir`：

| 加载的代码 | `baseDir` 指向 | 数据库资源位置 |
| --- | --- | --- |
| 源码 `server/plugin.ts` | 插件根目录 | `database/migrations/`、`database/seeds/` |
| 编译后的 `dist/server/plugin.js` | 插件的 `dist/` | `dist/database/migrations/`、`dist/database/seeds/` |

保留生成的路径计算方式和数据库构建脚本。包含数据库能力的插件会在编译后生成 `.manifest.json`，这些清单应随编译后的迁移和种子文件一起保留。构建生成资源，不会自动执行迁移。

### UI 组件与源码归属

`client/components/` 存放插件维护的组件，`client/pages/` 可以按需新增以组织业务页面。页面通过 `client/routes.ts` 接入，公开组件则通过包导出供 App 使用。

带客户端代码的插件包含 `components.json` 和 `client/styles.css`，用于配置 shadcn 的文件位置、包内别名和样式入口。应用与插件都可以从 NocoBase UI Library 安装组件或区块：安装到 App 的源码由 App 维护，安装到插件的源码由插件维护。消费者通过插件的公开导出使用组件时，实现仍由插件维护。

插件内部的 `#components/*` 等别名由插件自己的 `package.json` 定义，不依赖 App 的私有别名。新增或安装组件后，保持文件位置、导入路径和构建配置一致。

应用和插件都可以自由编写和组织前端组件，基础组件使用 shadcn；构建模块化界面时，优先参考 [NocoBase UI Library](https://ui.nocobase.com/) 中的组件和区块。NocoBase UI Library 基于 shadcn UI Registry 分发源码资产；自行发布资产时也采用这一机制。组件编写和页面接入见[前端组件](frontend-components.md)，独立 Registry 包的组织、构建和本地添加见[发布 UI 源码资产](frontend-components.md#按需分发-ui-源码资产)。

源码资产在 `packages/` 中与插件并列的独立 Registry 包内维护，通过公开包入口或使用方传入的参数接入插件能力，不能相对导入插件的内部文件。安装资产后，目标 App 或插件维护自己的源码副本。

### AGENTS.md 与 skills/：两类 Agent 指引

| 文件 | 面向谁 | 用途 |
| --- | --- | --- |
| 插件根目录的 `AGENTS.md` | 维护插件源码的开发者和 Agent | 说明插件内部的开发约定 |
| 插件根目录的 `CLAUDE.md` | 在插件中工作的 Claude Code | 引用同一份 `AGENTS.md` |
| 插件的 `skills/*/SKILL.md` | 使用插件的应用 Agent | 说明插件提供什么能力、怎样接入和验证 |
| App 的 `.agents/skills/` | 应用开发时使用的 Agent | 保存同步后的指引副本 |

插件根目录的开发指引属于基础文件；`skills/` 则按所选能力生成。完善插件内的 Skill 源文件后再同步，不要直接维护 App 中自动生成的副本。

### 测试与开发配置

`tests/` 按能力组织测试。`tsconfig.json`、`eslint.config.js` 和按需生成的 `vitest.config.ts` 分别负责类型与编译、代码检查和测试运行。新增能力时，同时补齐实现、声明、公开导出、依赖和测试；检查命令见[编写第一个插件](write-your-first-plugin.md)。

## 源码、插件构建与 App 构建

插件的 `dist/` 和 App 的 `dist/` 是两个不同层级的产物：

| 位置 | 内容 |
| --- | --- |
| `packages/app-plugin-announcements/client/`、`packages/app-plugin-announcements/server/` | 插件的前后端源码 |
| `packages/app-plugin-announcements/dist/` | 插件编译后的 JavaScript 和类型声明 |
| App 根目录的 `dist/` | 应用构建产物，包含应用代码和运行所需的依赖 |

在 App 根目录执行下面的命令，可以单独构建插件：

```bash
pnpm --filter @nocobase/app-plugin-announcements build
```

开发时，App 通过工作区依赖和源码导出使用本地插件。准备交付时，在 App 根目录运行：

```bash
pnpm build
```

App 构建会按依赖关系构建本地包，并将需要交付的工作区包收集到应用产物的 `dist/vendor/`，使用指向编译结果的导出和本地依赖路径。**本地插件可以随 App 一起交付，无需先发布到 npm。**

这些产物由构建生成，应修改源码后重新构建，而不是直接编辑 `dist/`。插件自身构建通过后，还应验证 App 中的实际使用与整体构建。

## 下一步

跟随[编写第一个插件](write-your-first-plugin.md)，实现公告接口与页面，完成测试、注册和 App 验证。能力选项与组合见[创建插件](create-plugin.md)，已有插件的安装、更新和移除见[管理插件](../developing-apps/manage-plugins.md)。

需要跨 App 共享并独立管理版本时，继续阅读[发布插件](publish-plugin.md)。仅在当前 App 中使用时，无需发布。
