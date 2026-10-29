---
title: 创建插件
description: 在已有的 App 中使用 @nocobase/create-plugin 创建本地插件，通过 Agent 或手动操作生成骨架、选择能力并接入工作区。
---

先按 [创建应用](../getting-started/create-app.md) 准备一个 App，并完成依赖安装。插件会生成在这个 App 的 `packages/` 目录下，与应用一起开发和构建。

你可以让 Agent 帮你创建插件，也可以手动执行 `pnpm create @nocobase/plugin@beta`。两种方式使用的都是 `@nocobase/create-plugin`。

## 使用 Agent

插件开发指引由 App 依赖的 `@nocobase/app-skills` 提供，会同步到 `.agents/skills/nocobase-app-plugin-development/SKILL.md`，不需要全局安装。如果这个文件缺失，先检查已安装的包中是否包含该 Skill：包含时运行 `pnpm nocobase skills sync`；不包含时，按 [升级 NocoBase Core](../developing-apps/upgrade-nocobase-core.md) 更新到兼容的版本，不要单独更新某一个框架包。

在应用目录中打开 Agent，告诉它插件的名称和用途即可，例如：

```text
帮我创建一个叫 demo-tools 的插件，用来扩展当前应用的命令行工具。
先生成基础结构，并检查它能否正常构建。
```

Agent 会用 `@nocobase/create-plugin` 生成插件，并根据用途选择能力、处理依赖、检查结果。你可以把示例中的名称和用途换成自己的需求，不必逐项描述命令参数和文件改动。

## 不使用 Agent

以下命令都在 App 根目录执行，并使用应用要求的 Node.js 和 pnpm 版本。创建工具和 App CLI 都需要支持 App 工作区；`@beta` 表示选择创建工具的 beta 发布渠道。本篇以只选择 `cli` 能力的 `demo-tools` 为例，不需要启动数据库或 Web 服务。

### 创建工具会完成哪些工作

`@nocobase/create-plugin` 会根据所选的能力，生成一个可以继续开发的插件包，并把它接入当前 App 的工作区。

| 工作 | 自动完成的内容 |
| --- | --- |
| 插件骨架 | 生成包声明、开发指引、TypeScript、代码检查和构建配置 |
| 能力代码 | 根据 `--with` 的选择，生成对应的目录、声明、示例或草稿，以及相关测试 |
| 公开入口 | 根据能力生成 Client、Server、CLI 或组件等导出，并配置源码与构建产物的导出映射 |
| 依赖 | 根据所选能力确定依赖的分类，并从当前 App 已安装的包中解析版本 |
| 接入工作区 | 把插件放到 App 的 `packages/` 下，补充必要的工作区配置和 App 对它的本地依赖 |
| 安装 | 默认安装依赖并更新锁文件；可以用 `--no-install` 推迟这一步 |

创建完成后，你还需要继续实现业务逻辑、完善测试，并按插件提供的运行时入口把它注册到 App。创建工具不会自动完成业务页面、接口和权限规则，也不会自动发布插件或执行数据库迁移。

### 选择插件能力

基本用法：

```bash
pnpm create @nocobase/plugin@beta <name> --with <capability>
```

`--with` 选择的是**要生成哪些代码能力**，既不是安装已有的插件，也不是启用某项业务功能。至少要选择一种能力，或者使用 `--empty` 只生成包的基础结构。多个能力通过重复 `--with` 来组合，不要用逗号拼接。

#### 客户端能力

| `--with` 的值 | 生成的内容 | 需要继续实现的内容 |
| --- | --- | --- |
| `client.routes` | `client/routes.ts` 路由声明骨架及测试 | 页面组件、路由路径、导航和访问条件；不会自动生成业务页面 |
| `client.components` | `client/components/plugin-component.tsx` 示例组件、公开导出及测试 | 可复用组件的实际界面、属性和交互 |
| `client.service-providers` | `client/providers/` 中的 ServiceProvider 骨架及测试 | 浏览器端的服务注册和生命周期处理 |
| `client.react-providers` | `client/contexts.ts`、Provider 组件、`client/react-providers/` 中的声明及测试 | React 上下文中的数据、状态和组件树的组合 |
| `client.locales` | `client/locales/` 中的语言文件和汇总入口 | 实际的翻译内容，以及在组件中的使用 |

ServiceProvider 用于应用服务和生命周期，React Provider 用于组件树中的上下文，请按需要分别选择。带有客户端代码时，创建工具还会生成 `components.json` 和 `client/styles.css`，准备好 shadcn 的配置和样式入口；需要的 UI 组件，仍要根据业务自行安装或编写。

#### 服务端能力

| `--with` 的值 | 生成的内容 | 需要继续实现的内容 |
| --- | --- | --- |
| `server.service-providers` | `server/services/`、`server/providers/`、`server/tokens.ts` 及测试 | 服务接口、业务逻辑和服务注册 |
| `server.routes` | `server/routes/index.ts` 路由声明骨架及测试 | API 或 Root Route 的方法、路径、输入校验、认证授权和响应 |
| `server.jobs` | `server/jobs/` 中的示例 Job、管理执行器的 Provider 及测试 | 任务逻辑、在哪里提交任务，以及重试和幂等的要求 |
| `server.locales` | `server/locales/` 中的语言文件和汇总入口 | 服务端使用的实际翻译内容 |

`server.routes` 不会自动生成 CRUD 接口，也不要求必须同时选择 `server.service-providers`；需要独立的业务服务时再组合即可。`server.jobs` 已经包含管理任务执行器的 Provider，任务的后端由 App 配置，什么时候提交任务则需要你自己实现。

#### 数据库、CLI 与 Skills

| `--with` 的值 | 生成的内容 | 需要继续实现的内容 |
| --- | --- | --- |
| `database` | `database/migrations/`、`database/seeds/` 中的 `.ts.example` 草稿、服务端资源声明及测试；构建时会生成数据库任务清单 | 具体的表结构、迁移和种子逻辑；草稿完善并改名为 `.ts` 之后，才会被纳入数据库任务 |
| `cli` | `cli/index.ts`、示例命令 `info`、`./cli` 导出及测试 | 实际的命令、参数、结果和错误处理 |
| `skills` | `skills/<插件技能名>/SKILL.md` 草稿，并纳入包的分发文件 | 向使用插件的 Agent 说明触发条件、公开能力、前提和验证方式 |

`skills` 面向的是使用插件的应用 Agent。插件根目录下的 `AGENTS.md` 则面向维护插件源码的开发者和 Agent，属于基础文件，不需要额外选择 `skills`。Skill 草稿应根据真实的实现完善之后，再同步给应用使用。

#### 运行时入口如何生成

创建工具会根据所选能力推导出入口，不需要额外指定 `--with client` 或 `--with server`：

| 所选能力 | 自动生成的运行时入口 |
| --- | --- |
| `client.routes`、`client.service-providers`、`client.react-providers`、`client.locales` 中的任意一种 | `client/index.ts`、`client/plugin.ts` 和 `./client` 导出 |
| 任意 `server.*` 能力，或 `database` | `server/index.ts`、`server/plugin.ts` 和 `./server` 导出 |
| `cli` | `cli/index.ts` 和 `./cli` 导出 |
| 只有 `client.components` | 组件的公开导出，不生成客户端插件的注册入口 |
| 只有 `skills`，或 `--empty` | 不生成运行时入口 |

**生成**这些入口，与在 App 中**注册**它们，是两个不同的步骤。只引用公开组件时，通过包导入使用即可；需要提供 Client、Server 或 CLI 贡献时，再注册对应的入口。

#### 常见的组合

下面是几个相互独立的创建示例，按功能选择即可。

只提供可复用的组件：

```bash
pnpm create @nocobase/plugin@beta feature-card --with client.components
```

需要页面、服务、接口以及插件自有数据的业务模块：

```bash
pnpm create @nocobase/plugin@beta orders \
  --with client.routes \
  --with server.service-providers \
  --with server.routes \
  --with database
```

提供工具命令，并附带给 Agent 的使用指引：

```bash
pnpm create @nocobase/plugin@beta audit-tools --with cli --with skills
```

只建立包的基础结构：

```bash
pnpm create @nocobase/plugin@beta shared-tools --empty
```

`--empty` 不生成任何业务能力的目录，不能与 `--with` 混用。`--with all` 会选择当前工具版本支持的全部能力，适合用来查看完整的骨架；实际开发时，通常明确选择需要的能力即可。

### 1. 预览生成计划

```bash
pnpm create @nocobase/plugin@beta demo-tools --with cli --dry-run --json
```

dry-run 不会生成插件文件、不会修改 App，也不会安装 App 的依赖；不过 `pnpm create` 本身仍可能下载并缓存创建工具。返回的 JSON 中，`ok` 应为 `true`，`status` 应为 `success-noop`。请重点检查以下字段：

| 字段 | 应该看到什么 |
| --- | --- |
| `result.project` | `kind` 为 `application`，`root` 为当前 App 的根目录 |
| `result.plugin` | 包名为 `@nocobase/app-plugin-demo-tools`，目标目录为 App 下的 `packages/app-plugin-demo-tools/` |
| `result.requestedCapabilities`、`result.capabilities` | 请求的能力，以及规范化之后的选择结果 |
| `result.derivedStructure` | 是否生成客户端或服务端的插件入口；本例中两者均为 `false` |
| `result.files` | 文件路径及生成原因，其中包含 `cli/index.ts`、`cli/info.ts` 和对应的测试 |
| `result.projectEdits` | 计划修改的应用文件，例如 `package.json`，必要时还有 `pnpm-workspace.yaml` |
| `result.dependencies` | 根据当前应用已安装的包解析出的插件依赖 |
| `result.nextSteps` | 后续安装、检查和注册等建议；请结合实际选择的能力执行 |

创建工具通过应用 `package.json` 中的 `nocobase.templateKind: "app"` 识别 App。它会读取现有的工作区和已安装的依赖，先检查路径、名称和版本，再生成文件。因此，需要先完成应用的依赖安装。

### 2. 创建插件并接入工作区

使用相同的名称和能力，正式执行创建：

```bash
pnpm create @nocobase/plugin@beta demo-tools --with cli
```

创建工具会完成以下工作：

- 生成 `packages/app-plugin-demo-tools/`，包括包声明、CLI 实现、测试和开发配置；本地插件默认为 `private: true`。
- 确保应用的 pnpm 工作区包含插件目录，并保留已有的设置；只在需要时补充 `packages/*`。
- 在应用 `package.json` 的 `dependencies` 中加入 `"@nocobase/app-plugin-demo-tools": "workspace:*"`。
- 根据应用已安装的包确定外部依赖的版本；对于实际存在的本地工作区包，保留工作区引用；然后安装依赖并更新锁文件。

`workspace:*` 让应用使用本地的插件包。创建工具不会把插件的外部依赖一律写成 `workspace:*`，也不会随意选择最新版本，而是以应用实际安装的版本为依据，避免生成后找不到包或版本不兼容。

### 3. 检查生成结果

```bash
pnpm --filter @nocobase/app-plugin-demo-tools check
```

检查通过后，插件骨架就已生成，并成为 App 的一个本地依赖。各个文件的职责见 [插件结构](plugin-structure.md)。

安装依赖让应用能够解析这个包，而运行时注册才决定应用会加载哪些能力。创建工具不会自动注册运行时入口；之后需要通过 `pnpm nocobase plugin register <完整包名> --no-install`，注册插件实际提供的 Client、Server 或 CLI 入口。完整的实现、注册和验收流程见 [编写第一个插件](write-your-first-plugin.md)。

### 名称与常用选项

短名称 `demo-tools` 默认生成包名 `@nocobase/app-plugin-demo-tools`。你自己的插件可以使用完整的包名，以保留组织的 scope，例如：

```bash
pnpm create @nocobase/plugin@beta @my-company/app-plugin-audit-tools --with cli
```

目录仍然是 `packages/app-plugin-audit-tools/`，注册时使用完整的包名。名称中表示功能的部分以小写字母开头，只使用小写字母、数字和单个连字符。创建工具会拒绝已存在的目录或冲突的包名。本地插件不必发布；需要发布时，再检查 `private`、包名、导出、兼容性和发布的内容。

| 选项 | 用途 |
| --- | --- |
| `--dir <directory>` | 显式选择已有的 App，例如在父目录中传入 `--dir ./my-app` |
| `--dry-run --json` | 只读预览生成的文件、应用的改动和依赖版本，方便人或 Agent 检查 |
| `--json` | 输出结构化的结果；安装过程的日志写入 stderr |
| `--no-install` | 生成文件但暂不安装；注册之前，需要在 App 根目录运行 `pnpm install` |
| `--display-name <name>`、`--description <text>` | 设置插件的显示名称和描述；含有空格时加引号 |
| `--help`、`-h` | 查看当前版本支持的能力和参数 |
| `--version` | 查看创建工具的版本 |

#### JSON 输出

`--json` 可以与正式创建或 `--dry-run` 组合使用，方便 Agent 和脚本读取。成功时，查看 `ok: true` 和 `result`；失败时，命令以非零退出码结束，并在 `error.code`、`error.message` 和 `error.suggestions` 中说明原因和处理建议。安装日志写入 stderr，创建工具的 stdout 始终只有一个 JSON 结果文档。

`--dry-run` 只是预览；`--no-install` 则会真实写入插件文件和 App 文件，只是推迟了依赖安装。两者的作用不同。

### 常见问题

| 现象 | 处理方式 |
| --- | --- |
| 找不到 App | 在 create-app 生成的应用根目录中执行，或者用 `--dir` 指向该应用；确认已安装依赖，并且工具版本支持 App 工作区 |
| 报错说在寻找 `packages/plugins` | 可能解析到了只支持源码仓库的旧版创建工具。用 `pnpm create @nocobase/plugin@beta --version` 核对实际版本，检查包管理器的缓存和发布时间限制，选择支持 App 工作区的版本后重新 dry-run；不要在 App 中补建 `packages/plugins` 来绕过错误。本教程已验证 `@nocobase/create-plugin@0.1.0-beta.26` |
| 缺少依赖，或依赖版本不兼容 | 先完成 App 的依赖安装，按报错修复所需的版本，再重新预览 |
| 目标目录、包名或应用依赖已经存在 | 检查已有的实现，或者换一个不冲突的名称；不要覆盖已有的插件 |
| 工作区规则排除了插件目录 | 检查 `pnpm-workspace.yaml` 中的排除规则，按项目需要调整后再预览 |
| 文件已经生成，但安装失败 | 保留生成的结果，解决安装错误后，在 App 根目录重新运行 `pnpm install`；不需要再次创建 |
| 想给已有的插件增加一种能力 | 创建工具只用于新建包，不会增量修改已有插件；请按 [插件结构](plugin-structure.md) 补充实现、声明、导出、依赖和测试，再检查 App 中的注册 |
| 选择了路由或数据库能力，却没有业务功能 | 生成的只是声明骨架或草稿，还需要实现页面、接口或迁移，并完成接入和验证 |
| 包已经安装，但命令不存在 | 检查 `./cli` 导出和应用 `cli/plugins.ts` 中的注册，并从 App 根目录调用 |

下一篇 [插件结构](plugin-structure.md) 介绍生成文件的职责；之后跟随 [编写第一个插件](write-your-first-plugin.md) 完成实现和接入。日常的安装、更新和移除见 [管理插件](../developing-apps/manage-plugins.md)。
