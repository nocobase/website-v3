---
title: "Agents"
description: "了解 app-plugin-agents 提供的能力，通过场景和提示词完成接入，对照代码与界面理解实现，并验证 AI 开发的结果。"
---

`@nocobase/app-plugin-agents` 用于给应用增加 AI 对话、模型服务、Skills、机器上的 Agent 和用量管理。本文按提供的能力、使用场景、重要实现和 AI 开发验证介绍如何使用这个插件。

## 提供的能力

### 能力概览

| 能力 | 插件提供什么 | 应用如何使用 |
| --- | --- | --- |
| 模型服务 | 服务配置、可用模型列表和连接测试 | 接入 Models 页面，配置提供方、密钥和模型 |
| AI 对话 | 会话、消息、流式回复、停止生成与历史恢复 | 通过公开聊天 hooks 和 agent-chat 组件组合业务界面 |
| 业务 Skills | 指引、支持文件、导入和版本管理 | 在 Skills 页面维护规范，再为会话或机器任务选择它们 |
| 工具与业务调用 | 工具注册、会话能力选择和调用执行机制 | 接入业务工具或允许的 CLI 命令，并实现对应授权 |
| 机器 Agent | Runner 连接、编码工具与模型组合、任务执行状态 | 接入 Runtimes 和 Machine agents 页面，提供授权的项目上下文 |
| 用量管理 | 用量查看和价格设置页面 | 将 Usage 页面接入应用导航 |

插件提供可组合的页面、组件和服务。应用负责决定菜单与聊天入口放在哪里、业务任务怎样发起，以及允许操作哪些数据；注册插件不会自动完成这些界面和业务流程。

### 两种 Agent 接入方式

两种方式都可以从应用发起任务，区别在于谁组织模型调用、工具在哪里执行，以及能访问哪些资源。

| 对比项 | 配置模型 API | 接入机器上的 Agent |
| --- | --- | --- |
| 需要准备 | 模型服务地址、密钥和模型 | 机器上已安装并登录的 Coding Agent，以及 Runner 连接 |
| 谁组织执行 | NocoBase 调用模型并调度会话选定的工具 | 机器上的 Coding Agent 使用自己的工具执行任务 |
| 模型凭据 | 在应用的 Models 中管理 | 由机器上的编码工具管理 |
| 可用资源 | 选定的 Skills、虚拟 Shell、应用接入的业务工具或 CLI | 编码工具及本地策略允许访问的项目、文件和命令 |
| 常见用途 | 对话、内容整理、通过业务工具查询或处理数据 | 阅读和修改项目代码，运行真实构建与测试 |

两种方式可以在同一应用中使用。下面的对话和发布说明示例使用模型 API，项目代码任务使用机器上的 Coding Agent。模型 API 会话没有宿主项目执行环境，需要读取、修改真实源码或运行测试时，应接入机器 Agent。

## 使用场景与示例

示例 `agents-doc-demo` 使用 SQLite、DeepSeek 和英文界面。文中的截图来自实际运行的应用。[下载示例源码](/assets/core/downloads/agents-doc-demo.zip)，按其中的 `examples/README.md` 启动；压缩包不包含数据库、模型密钥、登录会话或依赖目录。尚无应用时，先按[创建应用](../../getting-started/create-app.md)准备项目。

这里的**开发提示词**交给在项目目录工作的 Coding Agent，用来把插件接入应用；**对话提示词**则在接入后的应用聊天界面中使用。

### 场景一：给应用增加 AI 对话

希望用户在业务页面旁打开聊天面板，选择模型、发送消息，并在下次打开时继续对话。可以把下面的需求交给开发 Agent：

```text
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
Summarize this demo in exactly three short bullets: it uses SQLite,
connects to DeepSeek through a model API, and provides a chat panel.
Do not claim any machine Agent is connected.
```

![业务页面旁的聊天面板与真实模型回复](/assets/core/agents/chat.png)

**完成标志**：消息收到真实回复，重新打开会话后仍能读取历史。模型列表中出现一个名称，只能说明配置已保存，还需要验证实际调用。

### 场景二：让 Agent 按业务规范生成发布说明

团队希望每次发布说明都遵循相同格式，并且只引用已经提供的变更和测试结果。把这套规范保存为业务 Skill，由特定会话选择它。

**开发提示词：**

```text
请用 @nocobase/app-plugin-agents 增加“生成发布说明”的能力。

创建 release-notes 业务 Skill，包含 SKILL.md 和 references/style.md，
保存到应用的 Skills 库。要求先读取写作规范，再输出
Summary、Changes、Verification，只使用用户提供的事实。
未提供测试结果时写明 Verification not provided。
该 Skill 只生成草稿，不修改项目文件，也不发布内容。

在服务端注册 release-notes 会话 scope，只选择这个 Skill 和读取它所需的工具。
创建使用该 scope 的会话，在聊天面板中验证，并检查实际工具执行记录。
请说明普通对话与这个业务会话的配置区别。
```

也可以[下载本例的 release-notes Skill](/assets/core/downloads/release-notes-skill.zip)，在 **Skills → Import** 导入。页面可以查看指引正文、支持文件和版本。

![Skills 页面中的发布说明指引和支持文件](/assets/core/agents/skill.png)

导入后还需要让会话选择这个 Skill。本例通过已认证 API 创建带 `release-notes` scope 的会话，再从聊天历史打开；普通聊天入口不会自动选择它。相关代码见下文“业务 Skill 如何进入会话”，下载源码还提供了创建并打开该会话的组件接入片段。

在这个业务会话中，本例实际发送的**对话提示词**为：

```text
Read the release-notes Skill and its style guide, then draft concise release notes
in English. Supplied changes: Added model service configuration. Added a chat panel.
Fixed the missing Skills navigation entry. Verification supplied: 10 route and
locale tests passed. Do not claim any other tests ran.
```

![读取 Skill 后生成的发布说明](/assets/core/agents/skill-chat.png)

这里的变更和测试数是用户提供的写作素材，模型负责整理，并没有运行测试。用于自己的项目时，应替换成实际变更和检查结果。

**完成标志**：输出符合指定格式，工具记录能证明读取了 Skill 与支持文件，未提供的事实没有被补写。本次实测确认了 `skill` 调用和对 `references/style.md` 的读取。

### 场景三：从应用调用机器上的 Coding Agent

需要 Agent 读取项目源码、修改文件、执行构建和测试时，可以接入已经安装在电脑或服务器上的 Coding Agent。应用负责提供任务入口和工作目录上下文，机器上的编码工具执行任务。

**开发提示词：**

```text
请使用 @nocobase/app-plugin-agents，为当前应用接入机器上的 Coding Agent。

复用插件的 Runtimes 和 Machine agents 页面，保留原有权限。
让我选择已经连接且可用的机器 Agent，并在业务入口中指定我有权使用的项目目录。
工作目录由服务端校验，不接受任意客户端路径。
使用插件公开的会话与任务能力展示执行状态、消息和结果。

先用一个只读任务验证：说明指定项目的页面路由在哪里定义。
确认执行机器、目录和结果正确后，再用一个范围明确的代码修改任务验证。
请报告实际执行结果；如果机器尚未连接，明确说明还不能验证代码执行。
```

**连接与操作：** 页面接入后，在目标机器和应用中完成以下配置。

1. 在目标电脑或服务器安装并登录支持的编码工具，确认工具本身可以运行。
2. 打开 **Runtimes**，创建个人或共享连接，选择允许使用的编码工具。
3. 按页面指引安装并注册 Runner，等待机器上报工具、登录状态和模型。
4. 在 **Machine agents** 检查推荐的工具与模型组合，按需要添加并启用其他可用组合。
5. 在应用中选择机器 Agent，由业务入口提供经过授权的工作目录和上下文，再发送任务。

![创建机器连接时选择用途和编码工具](/assets/core/agents/runner-connection.png)

Runner 负责连接、领取工作和报告状态，实际任务由编码工具执行。**机器在线**还需要配合工具已登录、模型可用、Agent 已启用、执行槽位和本地策略允许，才能开始任务。机器 Agent 使用编码工具自己的模型凭据，与 **Models** 中的密钥分别管理。

连接和项目上下文就绪后，可以使用这样的**对话提示词**：

```text
请检查当前已授权项目中聊天入口的实现，先阅读 AGENTS.md 和相关 Skills。
为现有聊天按钮补充缺失的中英文提示文字，沿用项目多语言机制。
保留按钮行为、权限和布局，只修改完成此任务必需的文件。
运行受影响的检查，完成后列出改动文件、检查结果和未验证项。
```

**完成标志**：能确认任务在哪台机器、哪个目录执行，拿到实际代码差异和检查结果。本例已查看机器连接界面，尚未连接真实 Coding Agent，因此这一场景是接入指引，不是已完成的运行演示。

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
| `client/layouts/components/header-actions.tsx` | 加入 `ChatHeaderButton` | 页头出现 Agent chat 按钮 |
| `client/locales/en-US.ts`、`zh-CN.ts` | 合入组件语言资源，增加 `agentDemo` 导航文案 | 新入口和聊天组件具有中英文文案 |
| `server/providers/agents.ts`、`index.ts` | 新建并注册发布说明 Provider | 服务启动后可以解析 `release-notes` 会话 scope |
| `examples/release-notes/` | 保存 Skill 正文和支持文件的源码 | 导入后可在 Skills 页面查看和维护 |
| `tests/client/client-routes.test.ts` | 补充路由唯一性、页面加载和授权定义检查 | 检查新增页面是否正确接入、是否改变原有页面约定 |

`package.json` 和锁文件记录依赖变化。模型服务、业务 Skill 及对话历史则是应用运行数据：仅复制源码不会同时复制这些记录，启动下载示例后仍需配置自己的模型服务并导入 Skill。

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
| `skillsRoute` | `/skills` | 业务 Skills、支持文件和版本 |
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

`ChatPanel` 与 `main` 同级，所以聊天面板可以停靠在业务页面旁；页头按钮和移动端按钮共用同一个聊天状态。原有导航、面包屑、主题切换和用户菜单继续保留。移动端入口已接入代码，本例截图与运行验收使用桌面界面。

`AgentsProvider` 是示例新建的组件，内部使用插件的 `ChatProvider`。它读取登录用户 ID，用 React `key` 在身份变化时重建控制器，将 ID 传入 `memoryScope`，并在挂载和清理时清除未按账号隔离的查询缓存与面板状态。这样把聊天状态的生命周期绑定到当前账号；服务端仍负责检查会话访问权限。

### 业务 Skill 如何进入会话

项目 `.agents/skills/` 中的开发 Skill 告诉 Coding Agent 如何使用插件；应用 **Skills** 库里的业务 Skill 告诉运行时 Agent 如何完成任务。它们用途不同，不会自动同步。

本例的业务文件为：

```text
release-notes/
├── SKILL.md
└── references/
    └── style.md
```

`SKILL.md` 要求先读 `references/style.md`，按 Summary、Changes、Verification 输出，仅使用用户提供的事实，不补写版本、日期或测试结果。规范保存到库后，`server/providers/agents.ts` 在启动时注册命名 scope，并由 `server/providers/index.ts` 加载。

下面是该 Provider 的关键代码，完整实现见下载源码：

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

创建会话时，当前用户的已认证客户端提交如下请求体给 `POST /api/agents/conversations`：

```json
{
  "agentId": "online",
  "title": "Release notes with a Skill",
  "config": { "scope": ["release-notes"] },
  "selectedModel": { "modelService": "deepseek", "model": "deepseek-flash" }
}
```

`modelService` 是已配置服务的标识，`model` 必须是其中启用的模型。客户端选择允许使用的 scope，具体工具和 Skill 由服务端解析。普通新会话没有这段 scope 配置，就不会自动使用发布说明 Skill。

Skills 页面的 **Global attachment** 用于 Runner 后续任务的全局 Skill 合并。模型 API 会话通过服务端 scope 选择 Skills；这个开关不会自动给模型 API 会话添加 Skill。

### 执行后端与能力边界

阅读代码时会看到以下名称：

| 名称 | 含义 |
| --- | --- |
| `agentId: 'online'` | 选择由插件调用模型 API 的执行方式 |
| `native` | 上述方式的后端名称，不表示离线或本地模型 |
| `runner` | 通过具体 Agent ID 调用机器上的 Coding Agent |
| `agentsToken.onlineAgent` / `OnlineAgent` | 统一会话服务；实时会话可以使用 `native` 或 `runner` 后端 |

`OnlineAgent` 是两种执行方式共用的会话接口。模型 API 后端还支持带 JSON Schema 的结构化后台执行；Runner 不支持这套后台接口，但有自己的任务队列与执行机制。

模型 API 后端的虚拟 Shell 可以读取选定的 Skill、处理文本和临时文件：`/skills` 只读，`/tmp` 可写。它不能访问宿主机器文件系统，也不能直接运行项目的 Node、Python、构建或测试。需要真实项目执行环境时，应接入机器上的 Agent。

### 发送消息后发生了什么

1. 聊天组件创建或打开会话，服务端保存模型、scope 等会话配置。
2. 用户发送消息，模型 API 后端准备选定的 Skills 和工具并调用模型。
3. 模型请求工具时，服务端执行已选工具，将结果交回模型；本例实际读取了 Skill 正文和写作规范。
4. 聊天面板接收流式回复，服务端保存消息和执行结果；重新打开会话时读取保存的历史。

插件公开的聊天 hooks 和组件已经封装发送、停止与历史恢复。业务入口复用它们，避免另写一套协议。使用应用 API client 时，由 client 处理 `/main/api` 等部署前缀。

如果任务要操作业务数据，应用还需注册工具或接入允许的 CLI 命令，在实际服务中校验输入、当前身份、操作权限和数据范围。需要知识检索时，可继续接入[知识库](knowledge.md)。Skill 描述“可以查询订单”不会自动产生订单查询能力。

## AI 开发的约束与验证

本章讨论 AI 帮助开发者使用 Agents 插件时，如何约束和验证改动。通用的需求拆分、项目指引和协作流程见[使用 Agent 开发](../../developing-apps/develop-with-an-agent.md)；这里重点说明插件特有的接口、权限、会话和执行边界。插件不会自动保证生成代码正确，也不会替应用完成全部测试与审查。

### 使用匹配版本的插件开发 Skill

接入前，让开发 Agent 读取 `.agents/skills/nocobase-app-plugin-agents/SKILL.md`，按任务继续查阅模型服务、会话工具、Runner 或 Skills 参考。该 Skill 帮助 Agent 找到当前插件的公开接口和接入方式；应用特有的约定仍放在项目 `AGENTS.md` 和 `.agents/rules/` 中。

安装或更新依赖后运行 `pnpm nocobase skills sync`。涉及具体接口时，再对照当前包的公开导出、类型和运行行为。指引也可能滞后，出现冲突时应核实并报告。

本例实际遇到 Registry 安装将 Agents 依赖改为旧版 `0.1.0-beta.14`。恢复匹配的 `1.0.0-beta.29` 并同步 Skills 后，通过了类型与运行检查。因此，AI 安装组件后需要检查 `package.json` 和锁文件差异，不能仅凭安装命令成功判断兼容。这里的版本号是本例验证基线，不是后续项目的固定选型。

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
| 路由和语言资源测试 | 2 个测试文件、10 个用例通过；覆盖页面加载、路由注册、授权定义和语言资源 |
| 模型连接与浏览器对话 | DeepSeek 真实返回回复；保存的历史与完成状态可读取 |
| Skill 使用 | 原始工具记录确认读取了 Skill 和 `references/style.md`，不是仅凭模型自述 |
| 匿名 API 访问 | 模型服务和 Skills 接口返回 401；这不等于已验证完整角色权限矩阵 |

下载示例可以重跑相关测试：

```bash
pnpm exec vitest run tests/client/client-routes.test.ts tests/client/app-locale-coverage.test.ts
```

扩大改动或准备交付时，按项目要求运行完整检查和构建。默认模板的 `pnpm check` 包含包检查、lint、格式、类型、测试和构建；**本次示例没有运行完整的 `pnpm check` 或生产应用构建**。检查报告要看实际用例和退出结果，不能把没有找到测试也正常退出理解成验收通过。测试方法见[测试与验收](../../developing-apps/testing-and-acceptance.md)。

### 让交付说明可以复核

完成开发后，可以再给 Agent 一段验收提示词：

```text
请检查这次 @nocobase/app-plugin-agents 的接入改动：
1. 列出改动文件和对应界面，确认复用公开路由、聊天组件与服务。
2. 检查新增页面是否保留授权，切换账号时是否清理聊天状态。
3. 验证模型连接、真实回复和历史恢复；检查无权限请求是否被拒绝。
4. 如果增加了 Skill，检查会话实际选择的 scope 和工具读取记录，
   不把“已保存到 Skills 库”当成“对话已经使用”。
5. 如果接入了机器 Agent，确认执行机器、授权目录、实际代码差异和检查结果。
6. 运行本次改动涉及的类型、代码规范和测试检查，记录命令和用例数。
环境或账号不具备时，说明对应项目尚未验证，不把计划执行写成已通过。
```

本文实测基线为 2026-10-29 的默认模板 `1.0.0-beta.84`、Agents `1.0.0-beta.29`、SQLite 与 DeepSeek `deepseek-flash`。机器 Agent 执行、完整角色矩阵、业务写入、附件解析、移动端和生产部署尚未验收。后续扩展时，应针对新增能力补充验证。
