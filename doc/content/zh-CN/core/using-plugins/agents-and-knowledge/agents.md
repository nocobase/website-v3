---
title: "Agents"
description: "了解 app-plugin-agents 提供的能力，通过场景和提示词完成接入，对照代码与界面理解实现，并验证 AI 开发的结果。"
---

`@nocobase/app-plugin-agents` 用于给应用增加 AI 对话、模型服务、Skill、机器上的 Agent 和用量管理。本文按提供的能力、使用场景、重要实现和 AI 开发验证介绍如何使用这个插件。

## 提供的能力

### 能力概览

| 能力 | 插件提供什么 | 应用如何使用 |
| --- | --- | --- |
| 模型服务 | 服务配置、可用模型列表和连接测试 | 接入 Models 页面，配置提供方、密钥和模型 |
| AI 对话 | 会话、消息、流式回复、停止生成与历史恢复 | 通过公开聊天 hooks 和 agent-chat 组件组合业务界面 |
| 业务 Skill | 指引、支持文件、导入和版本管理 | 在 Skill 页面维护规范，再为会话或机器任务选择它们 |
| 工具与业务调用 | 工具注册、会话能力选择和调用执行机制 | 接入业务工具或允许的 CLI 命令，并实现对应授权 |
| 机器 Agent | Runner 连接、编码工具与模型组合、任务执行状态 | 接入 Runtimes 和 Machine agents 页面，提供授权的项目上下文 |
| 用量管理 | 用量查看和价格设置页面 | 将 Usage 页面接入应用导航 |

插件提供可组合的页面、组件和服务。应用负责决定菜单与聊天入口放在哪里、业务任务怎样发起，以及允许操作哪些数据；注册插件不会自动完成这些界面和业务流程。

### 两种 Agent 接入方式

两种方式都可以从应用发起任务，区别在于谁组织模型调用、工具在哪里执行，以及能访问哪些资源。

| 对比项 | 配置模型 API | 接入机器上的 Agent |
| --- | --- | --- |
| 需要准备 | 模型服务地址、密钥和模型 | 机器上已安装并登录的 Agent，以及 Runner 连接 |
| 谁组织执行 | NocoBase 调用模型并调度会话选定的工具 | 机器上的 Agent 使用自己的工具执行任务 |
| 模型凭据 | 在应用的 Models 中管理 | 由机器上的编码工具管理 |
| 可用资源 | 选定的 Skill、虚拟 Shell、应用接入的业务工具或 CLI | 编码工具及本地策略允许访问的项目、文件和命令 |
| 常见用途 | 对话、内容整理、通过业务工具查询或处理数据 | 阅读和修改项目代码，运行真实构建与测试 |

两种方式可以在同一应用中使用。下面的对话和发布说明示例使用模型 API，项目代码任务使用机器上的 Agent。模型 API 会话没有宿主项目执行环境，需要读取、修改真实源码或运行测试时，应接入机器 Agent。

## 使用场景与示例

示例 `agents-guide` 使用 SQLite、DeepSeek 和英文界面。文中的截图来自实际运行的应用。[查看示例源码](https://github.com/nocobase/docs-examples-v3/tree/b91adc8bcd89a238c84f9e62026f250b4833615a/apps/agents-guide)，按其中的 `README.md` 启动；进入仓库的 `apps/agents-guide` 目录运行命令。源码不包含数据库、模型密钥、登录会话或依赖目录。尚无应用时，先按[创建应用](../../getting-started/create-app.md)准备项目。

这里的**开发提示词**交给在项目目录工作的 Agent，用来把插件接入应用；**对话提示词**则在接入后的应用聊天界面中使用。

### 场景一：给应用增加 AI 对话

希望用户在业务页面旁打开聊天面板，选择模型、发送消息，并在下次打开时继续对话。可以把下面的需求交给开发 Agent：

```prompt
请在当前 NocoBase 3 应用中使用 @nocobase/app-plugin-agents，增加 AI 对话。
先阅读项目 AGENTS.md、应用开发 Skill 和 Agents 插件随包提供的 Skill。

保留现有页面和插件，增加模型服务管理页面，以及页头聊天入口和右侧聊天面板。
使用插件公开的会话能力和 agent-chat 组件，支持选择模型、发送消息、
停止生成和恢复历史。按登录账号隔离聊天状态，补齐中英文文案。

模型使用 DeepSeek，API 地址为 https://api.deepseek.com/v1。
密钥通过私密方式提供，从服务返回的模型列表中选择可用的 chat 模型。
完成后测试模型连接，在界面发送一条消息，再重新打开会话检查历史。
请说明修改了哪些文件、界面增加了什么，以及实际通过了哪些检查。
```

**配置与操作：** 开发 Agent 完成页面接入后，可在界面检查配置；手动接入时也使用以下步骤。

在 **Models → Add service** 中选择提供方，填写服务信息，获取模型列表并选择模型。本例实际使用：

| 字段 | 本例取值 |
| --- | --- |
| Provider type | `DeepSeek` |
| Name | `DeepSeek` |
| Base URL | `https://api.deepseek.com/v1` |
| API key | 自己的服务密钥，仅在密钥字段输入 |
| Model ID | `deepseek-flash`，本次从服务接口获取 |
| Model kind | `chat` |
| Enabled | 开启 |

模型名称以当前账号的 **Fetch models** 结果为准；服务接口说明见 [DeepSeek 官方文档](https://api-docs.deepseek.com/en/)。对话需要 `chat` 模型，`embedding` 和 `rerank` 不能替代它。

执行 **Test connection** 或模型旁的测试按钮，成功后保存。重新打开已有服务时，密钥字段留空表示保留已保存的密钥。

![DeepSeek 配置与真实连接测试成功状态](/assets/core/agents/model-configuration.png)

![保存并启用后的模型服务](/assets/core/agents/models.png)

配置完成即可在聊天中选择模型，**Machine agents** 列表不需要为它新增一项。要查询订单或执行审批，还需要应用接入对应工具和业务授权；配置模型本身不会开放业务数据。

接入后，点击页头的 **Agent chat**，选择已配置的模型。本例在界面中实际发送了以下对话提示词：

```text
Rewrite only these supplied facts as three short English bullets: the demo uses
SQLite, connects to DeepSeek through a model API, and provides a chat panel.
This is a writing exercise: do not use page context, call tools, or infer configuration.
Output only the bullets.
```

![业务页面旁的聊天面板与真实模型回复](/assets/core/agents/chat.png)

**完成的标志**：消息收到真实回复，通过 **Conversations** 重新打开会话后仍能读取历史。模型列表中出现一个名称，只能说明配置已保存，还需要验证实际调用。聊天会附带页面上下文，模型可能作出错误推断；这条提示词只验证事实整理和调用链路，不能用回复判断应用是否配置正确。

### 场景二：让 Agent 按业务规范生成发布说明

团队希望每次发布说明都遵循相同格式，并且只引用已经提供的变更和测试结果。把这套规范保存为业务 Skill，由特定会话选择它。

**开发提示词：**

```prompt
请用 @nocobase/app-plugin-agents 增加“生成发布说明”的能力。

创建 release-notes 业务 Skill，包含 SKILL.md 和 references/style.md，
保存到应用的 Skill 库。要求先读取写作规范，再输出
Summary、Changes、Verification，只使用用户提供的事实。
未提供测试结果时写明 Verification not provided。
该 Skill 只生成草稿，不修改项目文件，也不发布内容。

在服务端注册 release-notes 会话 scope，只选择这个 Skill 和读取它所需的工具。
增加页头 Draft release notes 入口，创建使用该 scope 的会话并在聊天面板打开。
处理未配置模型、缺少 Skill、创建失败和重复点击，并保留账号隔离与权限检查。
验证回复，并检查实际工具执行记录。
请说明普通对话与这个业务会话的配置区别。
```

也可以[下载本例的 release-notes Skill](/assets/core/downloads/release-notes-skill.zip)，在 **Skills → Import** 导入。页面可以查看指引正文、支持文件和版本。

![Skill 页面中的发布说明指引和支持文件](/assets/core/agents/skill.png)

导入后，点击页头文件图标 **Draft release notes**，即可创建并打开业务会话。按钮选择已启用服务中的第一个 `chat` 模型，通过已认证 API 提交 `release-notes` scope；需要使用其他模型时，可在发送前切换。每次点击都会新建会话，继续已有草稿请从 **Conversations** 打开。普通 **Agent chat** 入口不会自动选择这个 Skill。

若无法打开，先确认模型服务可用、Skill 的 slug 为 `release-notes`，再检查服务端 Provider 是否注册。按钮在请求中禁用，失败显示提示；实现见 `client/components/release-notes-button.tsx`。

在这个业务会话中，本例实际发送的**对话提示词**为：

```text
Read the release-notes Skill and its style guide, then draft concise release notes
in English. Supplied changes: Added model service configuration. Added a chat panel.
Fixed the missing Skill navigation entry. Verification supplied: 17 route, locale, and
permission-label tests passed. Do not claim any other tests ran.
```

![读取 Skill 后生成的发布说明](/assets/core/agents/skill-chat.png)

这里的变更和测试数是用户提供的写作素材，模型负责整理，并没有运行测试。用于自己的项目时，应替换成实际变更和检查结果。

**完成的标志**：输出符合指定格式，工具记录能证明读取了 Skill 与支持文件，未提供的事实没有被补写。本次实测确认了 `skill` 调用和对 `references/style.md` 的读取。

### 场景三：从应用调用机器上的 Agent

需要 Agent 读取项目源码、修改文件、执行构建和测试时，可以接入已经安装在电脑或服务器上的 Agent。应用负责提供任务入口和工作目录上下文，机器上的编码工具执行任务。

**开发提示词：**

```prompt
请使用 @nocobase/app-plugin-agents，为当前应用接入机器上的 Agent。

复用插件的 Runtimes 和 Machine agents 页面，保留原有权限。
让我选择已经连接且可用的机器 Agent，并在业务入口中指定我有权使用的项目目录。
工作目录由服务端校验，不接受任意客户端路径。
使用插件公开的会话与任务能力展示执行状态、消息和结果。

先用一个只读任务验证：说明指定项目的页面路由在哪里定义。
确认执行机器、目录和结果正确后，再用一个范围明确的代码修改任务验证。
请报告实际执行结果；如果机器尚未连接，明确说明还不能验证代码执行。
```

**先准备应用 CLI 和 Runner 分发包。** 默认模板没有应用自己的 CLI，也没有可下载的 Runner。只注册插件就按连接页安装，会返回 404；即使机器已在线，缺少应用 CLI 的任务仍会以 `cliUnavailable` 失败。示例项目已经声明所需依赖和配置；在其根目录执行：

```bash
pnpm nocobase cli build --universal
pnpm nocobase cli build --runner --universal
```

这两个命令只构建 CLI 和 Runner 分发包，不是生产应用构建。运行它们需要 npm 网络，目标机器需要 Node.js 24。首次使用后重启应用，确认分发目录仍为 `storage/runners/dist`。手动接入时，还需要：

- 在 `package.json` 声明 `nocobase.cli.bin`（本例为 `agents-guide`），并安装匹配版本的 `@nocobase/app-cli-client` 和 `@nocobase/agent-runner`。
- 在 `server/config/agents.ts` 定义 `cli.name: 'agents-guide'`、`cli.package: { kind: 'served' }`，并在 `server/config/index.ts` 注册该节。CLI 名称必须与打包名称一致；本例未注册配置节时，`config set agents.cli.name=...` 会报 `UNKNOWN_KEY`。

**连接与操作：** 页面接入后，在目标机器和应用中完成以下配置。

1. 在目标电脑或服务器安装并登录支持的编码工具，确认工具本身可以运行。
2. 打开 **Runtimes**，创建个人或共享连接，选择允许使用的编码工具。
3. 按页面指引安装并注册 Runner，等待机器上报工具、登录状态和模型。
4. 在 **Machine agents** 从可用模型列表添加并启用工具与模型组合。没有配置推荐组合时，即使机器在线，这个列表也可能仍为空。
5. 打开 **Agent chat**，点击 **Switch to runner agents**，选择可用 Agent，先在会话自己的工作目录执行只读检查。接入业务项目后，再由业务入口提供授权的项目上下文。

![创建机器连接时选择用途和编码工具](/assets/core/agents/runner-connection.png)

Runner 负责连接、领取工作和报告状态，实际任务由编码工具执行。**机器在线**还需要配合工具已登录、模型可用、Agent 已启用、执行槽位和本地策略允许，才能开始任务。机器 Agent 使用编码工具自己的模型凭据，与 **Models** 中的密钥分别管理。

先用下面的**对话提示词**检查执行环境：

```text
Perform a read-only smoke test in this conversation's assigned workspace.
Run pwd and list its top-level files. Report the actual working directory and output
in English. Do not read credentials, access other directories, edit files, install
packages, or claim that the application source is present unless you see it.
```

普通 Runner 会话使用自己的工作目录，不会自动进入应用源码目录。连接成功后仍需开发项目上下文接入；不要让用户在聊天里输入任意宿主路径来代替授权。项目上下文就绪后，可以进一步使用这样的提示词：

```text
请检查当前已授权项目中聊天入口的实现，先阅读 AGENTS.md 和相关 Skill。
为现有聊天按钮补充缺失的中英文提示文字，沿用项目多语言机制。
保留按钮行为、权限和布局，只修改完成此任务必需的文件。
运行受影响的检查，完成后列出改动文件、检查结果和未验证项。
```

**完成的标志**：只读检查有实际命令结果、执行机器和工作目录，运行记录为 `completed`；项目代码任务还应有实际差异和检查结果。本次已连接 Runner `0.1.0-beta.20` 与 Codex `0.165.0`，在会话工作目录执行 `pwd` 和 `ls -A1`，确认目录为空且运行完成。应用源码没有自动附加，因此上面的项目改码提示词仍是后续接入指引，未实测改码或构建。

![已连接并识别 Codex 的个人 Runner](/assets/core/agents/runner-online.png)

![机器 Agent 的真实只读命令与执行结果](/assets/core/agents/runner-chat.png)

## 重要原理与实现

本节对照前面场景使用的示例源码，先说明文件与界面变化，再解释注册、聊天状态、Skill 选择和执行后端的关键实现。手动开发时也可以按这些位置完成接入。

### 改动文件与界面变化

| 文件或目录 | 改动内容 | 对应效果 |
| --- | --- | --- |
| `client/plugins.ts`、`server/plugins.ts`、`cli/plugins.ts` | 注册 Agents 的三端贡献 | 应用加载插件服务、接口与命令；注册本身不会增加菜单 |
| `client/routes.ts` | 组合五个插件页面，并接入模板已有的用户和权限设置路由 | 侧栏出现管理入口，原有首页和登录页面保留 |
| `client/extensions/nocobase-agent-chat/` | 安装 Registry 提供的聊天 UI 源码及依赖组件 | 获得聊天面板、消息展示、模型选择和历史界面 |
| `client/components/agents-provider.tsx` | 新建应用自己的 `AgentsProvider`，管理当前账号的聊天状态 | 面板共享会话状态，账号变化时重新初始化 |
| `client/layouts/app-layout.tsx` | 挂载 Provider、主内容旁的聊天面板和移动端入口 | 桌面端可以一边使用业务页面，一边对话 |
| `client/layouts/components/header-actions.tsx`、`client/components/release-notes-button.tsx` | 加入普通聊天和发布说明入口 | 页头可以打开普通会话或指定 scope 的业务会话 |
| `client/locales/en-US.ts`、`zh-CN.ts` | 合入组件语言资源，增加 `agentDemo` 导航文案 | 新入口和聊天组件具有中英文文案 |
| `package.json`、`server/config/agents.ts`、`server/config/index.ts` | 声明并匹配应用 CLI 名称和分发方式 | Runner 可以下载应用 CLI，避免在线却无法执行 |
| `server/providers/agents.ts`、`index.ts` | 新建并注册发布说明 Provider | 服务启动后可以解析 `release-notes` 会话 scope |
| `examples/release-notes/` | 保存 Skill 正文和支持文件的源码 | 导入后可在 Skill 页面查看和维护 |
| `client/pages/settings/page-permission-titles.ts` | 为 Skill 子页面和 Runner 连接页补充双语权限名称 | 权限管理显示可读名称，授权 ID 保持不变 |
| `tests/client/release-notes-button.test.tsx` | 验证创建、重复点击、失败重试、权限和身份结束 | 业务入口的成功与失败路径均有检查 |
| `tests/client/client-routes.test.ts` | 补充路由唯一性、页面加载和授权定义检查 | 检查新增页面是否正确接入、是否改变原有页面约定 |

`package.json` 和锁文件记录依赖变化。模型服务、业务 Skill 及对话历史则是应用运行数据：仅复制源码不会同时复制这些记录，启动示例后仍需配置自己的模型服务并导入 Skill。

### 插件注册做了什么

默认模板已安装 Agents 依赖，但没有默认注册。示例在已有应用中使用 CLI 注册，并预览、应用数据库变更：

```bash
pnpm nocobase plugin register agents --dry-run --json
pnpm nocobase plugin register agents --json
pnpm nocobase db apply --dry-run --json
pnpm nocobase db apply --json
```

注册将插件加入三端的插件数组；数据库命令应用插件提供的迁移与种子数据。示例没有另外编写 Agents 的业务表或直接修改插件表。认证、授权和文件能力沿用模板已有插件。通用的安装与注册步骤见[管理插件](../../developing-apps/manage-plugins.md)。

### 管理页面如何出现在侧栏

`client/routes.ts` 引用插件的公开页面定义，并补充应用的导航标题和图标：

| 导出 | 默认路径 | 页面用途 |
| --- | --- | --- |
| `modelsRoute` | `/models` | 模型服务、可用模型和连接测试 |
| `agentsRoute` | `/agents` | 机器上的编码工具与模型组合 |
| `runtimesRoute` | `/runtimes` | 机器连接和运行环境 |
| `skillsRoute` | `/skills` | 业务 Skill、支持文件和版本 |
| `usageRoute` | `/usage` | 用量与价格设置 |

下面截取 Models 的组合方式，其余四个页面使用相同方式：

```ts
import { BrainCircuit } from 'lucide-react';
import { modelsRoute } from '@nocobase/app-plugin-agents/client/routes';

// Use this entry inside the application's existing defineAppRoutes contribution.
const modelsPage = {
  ...modelsRoute,
  navigation: { title: 'agentDemo.models', icon: BrainCircuit },
};
```

展开 `modelsRoute` 保留了插件的页面组件、登录要求、授权定义和子路由，只替换导航展示。所有新增路由与原有 `appRoutes` 一起导出。应用部署前缀 `/main` 由运行时处理，不写进这些页面路径。

模型页面使用 `settings:agents.services` 授权，其他页面沿用各自的授权定义。菜单没有出现时，应检查路由组合和当前用户权限。

### 聊天入口、布局和账号状态如何配合

示例通过 Registry 安装聊天 UI：

```bash
pnpm exec shadcn add @nocobase/agent-chat
```

> [!NOTE]
> 安装后立即检查 `package.json` 和锁文件。本次 Registry 命令把 Agents 降到 `0.1.0-beta.14`；恢复模板匹配的版本后才能继续。下面是本例的修复命令，其他模板应先核对兼容版本：

```bash
pnpm add @nocobase/app-plugin-agents@1.0.0-beta.29 --save-exact
pnpm nocobase skills sync --dry-run --json
pnpm nocobase skills sync --json
```

`@nocobase/app-plugin-agents/client/chat` 提供会话状态和 hooks；安装到应用的 Registry 组件负责展示。布局关系可以简化为：

```tsx
<AgentsProvider>
  {/* Preserve the application's existing layout and route providers. */}
  <header><ChatHeaderButton /></header>
  <div className="relative flex min-h-0 flex-1">
    <main className="relative min-w-0 flex-1 overflow-hidden">
      <Outlet />
    </main>
    <ChatPanel />
  </div>
  <ChatFloatingButton />
</AgentsProvider>
```

`ChatPanel` 与 `main` 同级，所以聊天面板可以停靠在业务页面旁；页头按钮和移动端按钮共用同一个聊天状态。原有导航、面包屑、主题切换和用户菜单继续保留。文档截图使用桌面英文界面；另检查了 390 px 窄屏面板和深色页面，完整移动端矩阵尚未验收。

`AgentsProvider` 是示例新建的组件，内部使用插件的 `ChatProvider`。它读取登录用户 ID，用 React `key` 在身份变化时重建控制器，将 ID 传入 `memoryScope`，并在挂载和清理时清除未按账号隔离的查询缓存与面板状态。这样把聊天状态的生命周期绑定到当前账号；服务端仍负责检查会话访问权限。

### 业务 Skill 如何进入会话

项目 `.agents/skills/` 中的开发 Skill 告诉 Agent 如何使用插件；应用 **Skills** 库里的业务 Skill 告诉运行时 Agent 如何完成任务。它们用途不同，不会自动同步。

本例的业务文件为：

```text
release-notes/
├── SKILL.md
└── references/
    └── style.md
```

`SKILL.md` 要求先读 `references/style.md`，按 Summary、Changes、Verification 输出，仅使用用户提供的事实，不补写版本、日期或测试结果。规范保存到库后，`server/providers/agents.ts` 在启动时注册命名 scope，并由 `server/providers/index.ts` 加载。

下面是该 Provider 的关键代码，完整实现见示例源码：

```ts
const agents = this.app.container.resolve(agentsToken);
agents.onlineAgent.configurator.registerOnlineAgentScope(
  'release-notes',
  async () => {
    const skill = (await agents.skills.list()).find(
      (item) => item.slug === 'release-notes',
    );
    if (!skill)
      throw new Error('Create the release-notes Skill before using this scope.');
    return {
      agentId: 'online',
      tool: ['bash', 'skill'],
      skill: [skill.id],
      systemPromptTemplate:
        'Help write release notes from the supplied facts. Use the release-notes Skill and its supporting style guide when the user requests release notes. Never claim an unperformed check succeeded.',
    };
  },
);
```

这段代码通过公开的 `agentsToken` 获取服务，由服务端按明确的 slug 选择一个 Skill。`skill` 工具读取指引，`bash` 读取虚拟文件系统中的支持文件，`systemPromptTemplate` 补充任务约定。scope 只选择能力，不授予业务权限。

页头 `ReleaseNotesButton` 使用应用 API client 创建会话，成功后调用 `panel.openChat({ conversationId })`。当前用户的已认证客户端提交如下请求体给 `POST /api/agents/conversations`：

```json
{
  "agentId": "online",
  "title": "Draft release notes",
  "config": { "scope": ["release-notes"] },
  "selectedModel": { "modelService": "deepseek", "model": "deepseek-flash" }
}
```

`modelService` 是已配置服务的标识，`model` 必须是其中启用的模型。客户端选择允许使用的 scope，具体工具和 Skill 由服务端解析。普通新会话没有这段 scope 配置，就不会自动使用发布说明 Skill。

Skill 页面的 **Global attachment** 用于 Runner 后续任务的全局 Skill 合并。模型 API 会话通过服务端 scope 选择 Skill；这个开关不会自动给模型 API 会话添加 Skill。

### 执行后端与能力边界

阅读代码时会看到以下名称：

| 名称 | 含义 |
| --- | --- |
| `agentId: 'online'` | 选择由插件调用模型 API 的执行方式 |
| `native` | 上述方式的后端名称，不表示离线或本地模型 |
| `runner` | 通过具体 Agent ID 调用机器上的 Agent |
| `agentsToken.onlineAgent` / `OnlineAgent` | 统一会话服务；实时会话可以使用 `native` 或 `runner` 后端 |

`OnlineAgent` 是两种执行方式共用的会话接口。模型 API 后端还支持带 JSON Schema 的结构化后台执行；Runner 不支持这套后台接口，但有自己的任务队列与执行机制。

模型 API 后端的虚拟 Shell 可以读取选定的 Skill、处理文本和临时文件：`/skills` 只读，`/tmp` 可写。它不能访问宿主机器文件系统，也不能直接运行项目的 Node、Python、构建或测试。需要真实项目执行环境时，应接入机器上的 Agent。

### 发送消息后发生了什么

1. 聊天组件创建或打开会话，服务端保存模型、scope 等会话配置。
2. 用户发送消息，模型 API 后端准备选定的 Skill 和工具并调用模型。
3. 模型请求工具时，服务端执行已选工具，将结果交回模型；本例实际读取了 Skill 正文和写作规范。
4. 聊天面板接收流式回复，服务端保存消息和执行结果；重新打开会话时读取保存的历史。

插件公开的聊天 hooks 和组件已经封装发送、停止与历史恢复。业务入口复用它们，避免另写一套协议。使用应用 API client 时，由 client 处理 `/main/api` 等部署前缀。

如果任务要操作业务数据，应用还需注册工具或接入允许的 CLI 命令，在实际服务中校验输入、当前身份、操作权限和数据范围。需要知识检索时，可继续接入[知识库](knowledge.md)。Skill 描述“可以查询订单”不会自动产生订单查询能力。

## AI 开发的约束与验证

本章讨论 AI 帮助开发者使用 Agents 插件时，如何约束和验证改动。通用的需求拆分、项目指引和协作流程见[使用 Agent 开发](../../getting-started/develop-with-an-agent.md)；这里重点说明插件特有的接口、权限、会话和执行边界。插件不会自动保证生成代码正确，也不会替应用完成全部测试与审查。

### 使用匹配版本的插件开发 Skill

接入前，让开发 Agent 读取 `.agents/skills/nocobase-app-plugin-agents/SKILL.md`，按任务继续查阅模型服务、会话工具、Runner 或 Skill 参考。该 Skill 帮助 Agent 找到当前插件的公开接口和接入方式；应用特有的约定仍放在项目 `AGENTS.md` 和 `.agents/rules/` 中。

安装或更新依赖后运行 `pnpm nocobase skills sync`。涉及具体接口时，再对照当前包的公开导出、类型和运行行为。指引也可能滞后，出现冲突时应核实并报告。

本例实际遇到 Registry 安装将 Agents 依赖改为旧版 `0.1.0-beta.14`。恢复匹配的 `1.0.0-beta.29` 并同步 Skill 后，通过了类型与运行检查。因此，AI 安装组件后需要检查 `package.json` 和锁文件差异，不能仅凭安装命令成功判断兼容。这里的版本号是本例验证基线，不是后续项目的固定选型。

### 保留插件的接口、权限和执行边界

让 AI 修改 Agents 接入代码时，应把以下边界保留在实现和验收要求中。提示词提出要求，代码和检查负责落实：

| 约束 | 本例如何落实 | 仍需检查什么 |
| --- | --- | --- |
| 使用公开接口 | 引用公开路由、`client/chat`、`agentsToken`，通过 CLI 注册 | 升级后是否仍符合公开类型和约定 |
| 保留授权 | 展开原有路由定义；测试记录各页面授权资源 | 普通用户的接口和数据访问是否被正确限制 |
| 隔离账号状态 | 按用户重建 ChatProvider，清理缓存和面板状态 | 切换账号后的浏览器行为；本例未完成完整多账号验收 |
| 控制业务能力 | 服务端 scope 只选择发布说明 Skill 和读取工具 | 新增工具是否在服务端校验身份、参数和数据范围 |
| 保留已有数据 | 使用迁移预览与应用流程，不直接改写插件表 | 新业务迁移对旧数据和失败场景的影响 |

提示词和 Skill 是行为指引；身份校验、授权、工具选择与测试是代码层面的保障。通过 Runner 执行代码时，还应使用明确授权的目录、独立开发环境和可审查的代码差异。Runner 本身不等于文件系统沙箱，真实可访问范围取决于机器与编码工具的配置。

### 按改动验证，并检查真实结果

静态检查、自动测试和实际操作分别回答不同问题。本例已完成：

| 检查 | 实际结果与能说明的问题 |
| --- | --- |
| 客户端与服务端类型、修改范围内的 ESLint 和格式检查 | 通过，检查了接入代码与当前类型和规范的兼容性 |
| 路由、语言、权限名称与业务入口测试 | 4 个测试文件、23 个用例通过；覆盖页面加载、路由授权、双语文案、创建、失败重试、重复点击和身份结束 |
| 模型连接与浏览器对话 | DeepSeek 真实返回回复；保存的历史与完成状态可读取 |
| Skill 使用 | 原始工具记录确认读取了 Skill 和 `references/style.md`，不是仅凭模型自述 |
| Runner 只读执行 | 补齐应用 CLI 后，真实执行 `pwd` 和 `ls -A1`，运行记录为 `completed`；首次失败原因及修复已记录 |
| 匿名 API 访问 | 模型服务和 Skill 接口返回 401；这不等于已验证完整角色权限矩阵 |

在示例目录中可以重跑相关测试：

```bash
pnpm exec vitest run tests/client/client-routes.test.ts tests/client/app-locale-coverage.test.ts tests/client/page-permission-titles.test.ts tests/client/release-notes-button.test.tsx
```

扩大改动或准备交付时，按项目要求运行完整检查和构建。默认模板的 `pnpm check` 包含包检查、lint、格式、类型、测试和构建；**本次示例没有运行完整的 `pnpm check` 或生产应用构建**。检查报告要看实际用例和退出结果，不能把没有找到测试也正常退出理解成验收通过。测试方法见[测试与验收](../../developing-apps/testing-and-acceptance.md)。

### 让交付说明可以复核

完成开发后，可以再给 Agent 一段验收提示词：

```prompt
请检查这次 @nocobase/app-plugin-agents 的接入改动：
1. 列出改动文件和对应界面，确认复用公开路由、聊天组件与服务。
2. 检查新增页面是否保留授权，切换账号时是否清理聊天状态。
3. 验证模型连接、真实回复和历史恢复；检查无权限请求是否被拒绝。
4. 如果增加了 Skill，检查会话实际选择的 scope 和工具读取记录，
   不把“已保存到 Skill 库”当成“对话已经使用”。
5. 如果接入了机器 Agent，确认执行机器、授权目录、实际代码差异和检查结果。
6. 运行本次改动涉及的类型、代码规范和测试检查，记录命令和用例数。
环境或账号不具备时，说明对应项目尚未验证，不把计划执行写成已通过。
```

本文实测基线为 2026-10-29 的默认模板 `1.0.0-beta.84`、Agents `1.0.0-beta.29`、SQLite 与 DeepSeek `deepseek-flash`。机器 Agent 的项目改码与构建、完整角色矩阵、业务写入、附件解析、完整移动端矩阵和生产部署尚未验收。后续扩展时，应针对新增能力补充验证。

### 示例源码

- [完整示例项目](https://github.com/nocobase/docs-examples-v3/tree/b91adc8bcd89a238c84f9e62026f250b4833615a/apps/agents-guide)：模型对话、业务 Skill 和 Runner 接入，固定于提交 `b91adc8`。
- [运行与验证说明](https://github.com/nocobase/docs-examples-v3/blob/b91adc8bcd89a238c84f9e62026f250b4833615a/apps/agents-guide/README.md)：版本要求、安装配置、启动和测试命令。
- [下载示例源码 ZIP](/assets/core/downloads/agents-doc-demo.zip)：与上述提交对应的应用源码，不含运行数据和依赖。
