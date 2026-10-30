---
title: "Agents"
description: "给应用加入 AI 对话、业务 Skills 和机器上的编程助手，了解接入步骤、关键代码与验证方法。"
---

`@nocobase/app-plugin-agents` 为应用提供 AI 对话、模型配置、业务 Skills 和机器 Agent。你可以给业务页面加一个聊天面板，让 Agent 按团队规范处理内容，或连接机器上的编程助手执行任务。

## 提供的能力

| 能力 | 插件提供什么 | 应用需要做什么 |
| --- | --- | --- |
| 模型服务 | 服务配置、模型列表和连接测试 | 接入 Models 页面，配置服务和密钥 |
| AI 对话 | 流式回复、停止生成和会话历史 | 用聊天组件组合业务界面 |
| 业务 Skills | 指引、支持文件、导入和版本管理 | 在 Skills 页面维护规范，为会话或任务选择它们 |
| 业务工具 | 工具注册和执行机制 | 接入业务工具或 CLI，并检查操作权限 |
| 机器 Agent | 机器连接、编码工具与模型选择、执行状态 | 接入 Runtimes 和 Machine agents 页面，提供任务入口 |
| 用量管理 | 用量和价格设置页面 | 将 Usage 页面加入导航 |

插件提供页面和组件，应用决定菜单、聊天入口的位置以及允许操作的业务数据。注册插件后，还需要把这些界面接入应用。

### 两种 Agent 接入方式

| | 模型 API | 机器上的 Agent |
| --- | --- | --- |
| 适合做什么 | 对话、整理内容，通过业务工具处理数据 | 阅读和修改项目代码，运行构建和测试 |
| 需要准备 | 模型服务地址、密钥和模型 | 已安装并登录的编码工具，以及 Runner 连接 |
| 在哪里执行 | NocoBase 调用模型，执行选定的工具 | 编码工具在连接的机器上执行 |
| 可访问什么 | 选定的 Skills、虚拟文件和已接入的业务工具 | 机器与编码工具策略允许的项目、文件和命令 |

两种方式可以同时使用。下面前两个场景使用模型 API，第三个场景连接机器。模型 API 会话不能直接访问宿主源码或运行项目测试。

## 使用场景与示例

没有应用时，先按 [创建应用](../../getting-started/create-app.md) 准备项目；也可以运行文末的 [完整示例](https://github.com/nocobase/docs-examples-v3/tree/b91adc8bcd89a238c84f9e62026f250b4833615a/apps/agents-guide)。数据库沿用应用现有配置，模型服务以 DeepSeek 为例。示例界面为英文，示例命令在 `apps/agents-guide` 目录执行。

下面的**开发提示词**发给项目中的 Coding Agent，**对话提示词**在应用的聊天界面中使用。提示词已按读者使用习惯简化；截图来自原有实测会话，验证范围见文末。

### 场景一：给应用增加 AI 对话

把下面的需求交给开发 Agent：

```prompt
帮我在页面右侧加一个 AI 聊天面板，从页头按钮打开。能选择模型、发送消息、停止回复，下次打开还能接着聊。每个人只看到自己的聊天记录。
```

页面接入后，在 **Models → Add service** 添加模型服务。本例使用以下配置：

| 字段 | 本例取值 |
| --- | --- |
| Provider type | `DeepSeek` |
| Name | `DeepSeek` |
| Base URL | `https://api.deepseek.com/v1` |
| API key | 自己的服务密钥，仅在密钥字段输入 |
| Model ID | `deepseek-flash`，原实测时从服务获取 |
| Model kind | `chat` |
| Enabled | 开启 |

点击 **Fetch models**，从当前账号可用的模型中选择 `chat` 模型；`embedding` 和 `rerank` 不能用于对话。执行 **Test connection**，成功后保存。重新打开已有服务时，密钥字段留空会保留原密钥。服务参数说明见 [DeepSeek 官方文档](https://api-docs.deepseek.com/en/)。

![DeepSeek 配置与连接测试成功状态](/assets/core/agents/model-configuration.png)

![保存并启用后的模型服务](/assets/core/agents/models.png)

点击页头的 **Agent chat**，选择模型，试着发一条消息：

```prompt
帮我用一句英文介绍这个功能：在应用里和 AI 聊天，下次打开还能接着聊。
```

![业务页面旁的聊天面板与模型回复](/assets/core/agents/chat.png)

**完成的标志**：收到回复，通过 **Conversations** 重新打开后，历史消息仍在。

模型 API 对话不需要在 **Machine agents** 新增 Agent。要让它查询订单或处理审批，还需接入对应的业务工具和授权。

### 场景二：让 Agent 按团队规范写发布说明

把团队的写作规范保存成业务 Skill，就能在专门的会话中复用。开发提示词可以这样写：

```prompt
帮我加一个“生成发布说明”的入口。按团队的固定格式，把我提供的改动和测试结果整理成草稿，没提供的内容不要编，也不要直接发布。
```

本例的规范名为 `release-notes`，要求先读取写作规则，再按 Summary、Changes、Verification 输出；没有测试结果时写明 `Verification not provided`。它只负责草稿，不改项目文件，也不发布内容。

1. [下载示例 Skill](/assets/core/downloads/release-notes-skill.zip)，在 **Skills → Import** 导入，确认 slug 为 `release-notes`。
2. 在页面中查看 `SKILL.md` 和支持文件 `references/style.md`。
3. 点击页头文件图标 **Draft release notes**，打开使用该 Skill 的会话。

![Skills 页面中的发布说明规范和支持文件](/assets/core/agents/skill.png)

入口默认选用已启用服务中的第一个 `chat` 模型，发送前可以切换。每次点击都会新建会话；继续已有草稿时，从 **Conversations** 打开。普通 **Agent chat** 不会自动使用这个 Skill。

在新会话里试试：

```prompt
请按团队规范写一份英文发布说明：新增了模型配置和聊天面板，修复了 Skills 菜单缺失的问题。相关的 17 项测试已经通过。
```

这里的变更和测试数是写作素材，请换成自己项目的实际结果；Agent 整理文字并不等于它运行了测试。

![读取 Skill 后生成的发布说明](/assets/core/agents/skill-chat.png)

**完成的标志**：草稿符合团队格式，只包含提供的事实，并且实际工具记录能证明读取了 Skill 和支持文件。

入口无法打开时，检查模型是否可用、Skill 的 slug 是否正确，以及服务端 Provider 是否注册。按钮的失败提示与重试逻辑见 `client/components/release-notes-button.tsx`。

### 场景三：从应用调用机器上的编程助手

连接电脑或服务器上的编码工具后，就能在应用里发任务、查看执行进度和结果。开发提示词：

```prompt
帮我接上机器上的编程助手，让我能在应用里选择可用的助手、发送任务，看到它的执行进度和结果。
```

**准备分发包。** 示例已声明应用 CLI 和 Runner 的依赖与配置，在示例目录运行：

```bash
pnpm nocobase cli build --universal
pnpm nocobase cli build --runner --universal
```

命令需要访问 npm，目标机器需要 Node.js 24。生成的分发包位于 `storage/runners/dist`，首次配置后重启应用。这两个命令不构建生产应用。

<details>
<summary>在自己的应用中准备 CLI 和 Runner</summary>

默认模板没有应用自己的 CLI 和可下载的 Runner，需要先完成：

- 安装匹配版本的 `@nocobase/app-cli-client` 和 `@nocobase/agent-runner`。
- 在 `package.json` 声明 `nocobase.cli.bin`，本例为 `agents-guide`。
- 在 `server/config/agents.ts` 定义 `cli.name: 'agents-guide'` 和 `cli.package: { kind: 'served' }`，再由 `server/config/index.ts` 注册。CLI 名称必须与打包名称一致。

缺少 Runner 分发包时，连接页安装请求会返回 404；缺少应用 CLI 时，机器虽在线，任务仍可能报 `cliUnavailable`。配置节未注册时，设置 `agents.cli.name` 会报 `UNKNOWN_KEY`。

</details>

**连接机器。**

1. 在目标机器安装并登录编码工具，确认工具本身能运行。
2. 在 **Runtimes** 创建个人或共享连接，选择允许使用的编码工具。
3. 按页面指引安装、注册 Runner，等待工具、登录状态和模型上报。
4. 在 **Machine agents** 添加并启用一个可用的工具与模型组合。机器在线不代表这里已有启用的 Agent。
5. 打开 **Agent chat → Switch to runner agents**，选择刚启用的 Agent。

![创建机器连接时选择用途和编码工具](/assets/core/agents/runner-connection.png)

![已连接并识别 Codex 的个人 Runner](/assets/core/agents/runner-online.png)

机器 Agent 使用编码工具自己的模型凭据，与 **Models** 中的密钥分开管理。无法开始任务时，检查工具登录、模型可用性、Agent 启用状态、执行槽位和本地策略。

先在聊天中确认工作目录：

```prompt
你现在在哪个工作目录？里面有哪些文件？只查看，不要修改。
```

![机器 Agent 的实际命令与执行结果](/assets/core/agents/runner-chat.png)

**完成的标志**：记录中有实际执行的命令、工作目录和输出，运行状态为 `completed`。

普通 Runner 会话有自己的工作目录，不会自动进入应用源码。要处理业务项目，应用需提供经过服务端授权的项目目录，不能直接信任用户在聊天中输入的宿主路径。接入后，可以再发一个小任务：

```prompt
给当前项目的聊天按钮补上中英文提示文字，其他行为保持不变。
```

项目任务还需核对代码差异和检查结果。本例只验证了会话目录中的只读执行，尚未验证项目改码或构建。

## 重要原理与实现

### 代码与界面的对应关系

| 文件或目录 | 作用 |
| --- | --- |
| `client/plugins.ts`、`server/plugins.ts`、`cli/plugins.ts` | 注册插件三端贡献 |
| `client/routes.ts` | 组合管理页面，保留原有首页、登录和系统设置 |
| `client/extensions/nocobase-agent-chat/` | Registry 安装的聊天界面源码 |
| `client/components/agents-provider.tsx` | 管理当前账号的聊天状态 |
| `client/layouts/app-layout.tsx`、`client/layouts/components/header-actions.tsx` | 挂载聊天面板和入口 |
| `client/components/release-notes-button.tsx` | 创建发布说明会话，处理重复点击、失败重试和账号切换 |
| `server/providers/agents.ts`、`server/providers/index.ts` | 注册发布说明会话配置 |
| `examples/release-notes/` | 业务 Skill 及支持文件 |
| `package.json`、`server/config/agents.ts`、`server/config/index.ts` | 配置应用 CLI 的名称和分发方式 |
| `client/locales/`、`client/pages/settings/page-permission-titles.ts` | 中英文文案和权限名称 |
| `tests/client/` | 页面、语言、权限名称和业务入口测试 |

模型配置、导入的 Skills 和聊天历史保存在运行数据中，不随源码分发。运行示例后仍需配置自己的模型并导入 Skill。

### 注册插件与管理页面

本例的默认模板已安装 Agents 依赖，但没有注册。以下命令注册插件，并预览、应用数据库变更：

```bash
pnpm nocobase plugin register agents --dry-run --json
pnpm nocobase plugin register agents --json
pnpm nocobase db apply --dry-run --json
pnpm nocobase db apply --json
```

注册会更新三端插件数组，数据库命令应用插件的迁移和初始数据。安装和升级的通用步骤见 [管理插件](../../developing-apps/manage-plugins.md)。

管理页面需要在 `client/routes.ts` 组合进应用：

| 导出 | 默认路径 | 用途 |
| --- | --- | --- |
| `modelsRoute` | `/models` | 模型服务和连接测试 |
| `agentsRoute` | `/agents` | 机器上的编码工具与模型组合 |
| `runtimesRoute` | `/runtimes` | 机器连接 |
| `skillsRoute` | `/skills` | 业务 Skills 和版本 |
| `usageRoute` | `/usage` | 用量与价格 |

例如，给 Models 页面加上菜单名称和图标：

```ts
import { BrainCircuit } from 'lucide-react';
import { modelsRoute } from '@nocobase/app-plugin-agents/client/routes';

// Use this entry inside the application's existing defineAppRoutes contribution.
const modelsPage = {
  ...modelsRoute,
  navigation: { title: 'agentDemo.models', icon: BrainCircuit },
};
```

展开 `modelsRoute` 会保留页面组件、登录要求、授权和子路由。其余页面同样组合，再与原有 `appRoutes` 一起导出。`/main` 等部署前缀由运行时处理，不写进页面路径。菜单不显示时，检查路由是否加入应用，以及当前用户是否有对应权限；Models 使用 `settings:agents.services` 授权。

### 聊天组件与账号状态

示例通过 Registry 安装聊天 UI：

```bash
pnpm exec shadcn add @nocobase/agent-chat
```

> [!NOTE]
> 安装后检查依赖差异。本例中 Registry 把 Agents 降到了 `0.1.0-beta.14`，需恢复到模板匹配的 `1.0.0-beta.29` 并同步 Skills。以下命令只对应本例版本，其他项目应按自己的模板核对。

```bash
pnpm add @nocobase/app-plugin-agents@1.0.0-beta.29 --save-exact
pnpm nocobase skills sync --dry-run --json
pnpm nocobase skills sync --json
```

插件的 `client/chat` 提供会话状态和 hooks，Registry 组件负责展示。下面省略了布局中的其他组件：

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

`ChatPanel` 与 `main` 同级，停靠在业务页面旁；页头和移动端按钮共用会话状态。

`AgentsProvider` 是示例自己的组件，内部使用插件的 `ChatProvider`。它以登录用户 ID 作为 React `key` 和 `memoryScope`，并在身份切换时清理查询缓存和面板状态，避免沿用上一个账号的聊天。服务端仍需校验会话归属和访问权限。

### 为业务会话选择 Skill

项目 `.agents/skills/` 中的开发 Skill 指导编码工具接入插件；应用 **Skills** 库里的业务 Skill 指导运行时任务，两者不会自动同步。

发布说明 Skill 包含 `SKILL.md` 和 `references/style.md`。导入后，`server/providers/agents.ts` 通过命名 scope 为会话选择它，`server/providers/index.ts` 负责加载这个 Provider。关键代码如下：

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

`agentsToken` 是插件公开的服务入口。这里由服务端按 slug 选择一个 Skill，再指定读取它需要的 `skill` 和 `bash` 工具。`systemPromptTemplate` 补充发布说明规则；scope 选择能力，不授予业务权限。

`ReleaseNotesButton` 用已登录的应用 API client 向 `POST /api/agents/conversations` 提交：

```json
{
  "agentId": "online",
  "title": "Draft release notes",
  "config": { "scope": ["release-notes"] },
  "selectedModel": { "modelService": "deepseek", "model": "deepseek-flash" }
}
```

创建成功后，按钮调用 `panel.openChat({ conversationId })` 打开会话。`modelService` 是已配置服务的标识，`model` 必须在该服务中启用。普通会话没有 `release-notes` scope，不会自动使用这个 Skill。

Skills 页面的 **Global attachment** 用于 Runner 后续任务的全局 Skill 合并，不会替模型 API 会话选择 Skill；后者需要上面的服务端 scope。

### 执行方式与工具范围

代码中的 `agentId: 'online'` 选择模型 API 后端，后端名称为 `native`；机器任务则使用具体 Agent ID 和 `runner` 后端。两者共用 `agentsToken.onlineAgent` 会话服务。模型 API 后端另支持带 JSON Schema 的结构化后台执行；Runner 使用自己的任务队列，不支持该后台接口。

模型 API 后端的虚拟 Shell 可以读取 `/skills` 和写入 `/tmp`，不能访问宿主文件系统或直接运行项目的 Node、Python、构建与测试。查询订单等业务操作需要应用注册工具或允许的 CLI，并在服务端校验身份、输入和数据范围。需要检索资料时，可接入 [知识库](knowledge.md)。

## AI 开发的约束与验证

### 接入时检查什么

开发 Agent 应读取当前项目的 `.agents/skills/nocobase-app-plugin-agents/SKILL.md`，按任务查看对应参考。安装或升级依赖后运行 `pnpm nocobase skills sync`，并核对公开导出与类型；指引与实现不一致时，以核实后的接口为准。

| 检查点 | 要确认的行为 |
| --- | --- |
| 页面授权 | 组合插件路由时保留授权，未授权用户不能直接调用接口访问数据 |
| 账号切换 | 退出或换账号后，旧聊天、缓存和未完成请求不会影响新账号 |
| 业务 Skill | 会话实际选择了对应 Skill，工具记录表明读取了正文和支持文件 |
| 新增工具 | 服务端校验身份、输入、操作权限和数据范围 |
| 机器任务 | 执行机器与授权目录正确，命令输出、代码差异和检查结果对应本次任务 |

Runner 的访问范围取决于机器和编码工具策略，它本身不是文件系统沙箱。提示词和 Skill 也不能代替代码授权或运行验证。

### 检查接入结果

可以让开发 Agent 先检查最常用的行为：

```prompt
帮我检查一下：聊天能不能正常回复，重新打开后记录还在不在，切换账号会不会看到上一个人的聊天？
```

涉及业务 Skill 或机器任务时，再检查上表对应项。模型的自述不能证明配置正确、Skill 已使用或代码已执行，应查看连接状态、工具记录和实际结果。

示例的相关自动测试可在应用目录运行：

```bash
pnpm exec vitest run tests/client/client-routes.test.ts tests/client/app-locale-coverage.test.ts tests/client/page-permission-titles.test.ts tests/client/release-notes-button.test.tsx
```

交付前按项目要求运行 `pnpm check`，它包含包检查、lint、格式、类型、测试和构建。检查实际执行的用例及结果，不能把“没有找到测试但正常退出”当作验证通过。更多方法见 [测试与验收](../../developing-apps/testing-and-acceptance.md)。

### 示例的验证范围

以下是 2026-10-29 的实测记录，基线为默认模板 `1.0.0-beta.84`、Agents `1.0.0-beta.29`、SQLite、DeepSeek `deepseek-flash`，以及 Runner `0.1.0-beta.20`、Codex `0.165.0`。

| 已验证 | 结果 |
| --- | --- |
| 类型、局部 lint 和格式 | 客户端、服务端及工具配置检查通过 |
| 页面与业务入口 | 4 个测试文件、23 个用例通过，覆盖路由、语言、权限名称、创建与失败重试、重复点击和账号切换 |
| 模型对话 | 连接成功，收到真实回复，重新打开后历史仍在 |
| 业务 Skill | 原始工具记录确认读取了 Skill 和 `references/style.md` |
| Runner | 补齐应用 CLI 后，实际执行 `pwd` 和 `ls -A1`，空会话目录中的运行完成 |
| 匿名访问 | 模型服务和 Skills 接口返回 401 |

尚未完成完整 `pnpm check`、生产构建与部署、多账号浏览器验收、完整角色权限矩阵、业务写入、附件解析、项目改码和构建。窄屏及深色页面仅做了局部检查；中文输入法、完整语言与移动端矩阵、模型流式回复的停止操作也未完整验证。本文简化后的提示词没有重新执行，截图和结果对应原实测会话。

### 示例源码

- [完整示例项目](https://github.com/nocobase/docs-examples-v3/tree/b91adc8bcd89a238c84f9e62026f250b4833615a/apps/agents-guide)：固定于提交 `b91adc8`，包含三个场景的接入代码。
- [运行与验证说明](https://github.com/nocobase/docs-examples-v3/blob/b91adc8bcd89a238c84f9e62026f250b4833615a/apps/agents-guide/README.md)：版本、安装配置、启动、测试和验证限制。
- [下载示例源码 ZIP](/assets/core/downloads/agents-doc-demo.zip)：与上述提交对应，不含密钥、运行数据和依赖。
