---
title: "Agents"
description: "Explore app-plugin-agents capabilities, integrate it through scenarios and prompts, understand code and UI changes, and verify AI-assisted development."
---

`@nocobase/app-plugin-agents` adds AI conversations, model services, Skills, Agents on machines, and usage management to an application. This guide covers its capabilities, usage scenarios, key implementation details, and verification for AI-assisted development.

## Capabilities

### Capability overview

| Capability | What the plugin provides | How the application uses it |
| --- | --- | --- |
| Model services | Service configuration, available models, and connection tests | Compose the Models page and configure a provider, key, and model |
| AI conversations | Conversations, messages, streaming replies, stopping generation, and history recovery | Compose business UI with public chat hooks and agent-chat components |
| Business Skills | Instructions, supporting files, import, and version management | Maintain guidance in Skills and select it for conversations or machine tasks |
| Tools and business operations | Tool registration, conversation capability selection, and execution | Integrate business tools or allowed CLI commands with authorization |
| Machine Agents | Runner connections, coding tool/model combinations, and task execution state | Compose Runtimes and Machine agents pages and supply authorized project context |
| Usage management | Usage views and pricing settings | Add the Usage page to application navigation |

The plugin provides composable pages, components, and services. The application chooses where navigation and chat entry points appear, how business tasks start, and which data they may operate on. Plugin registration does not automatically implement those interfaces or workflows.

### Two ways to connect an Agent

Both methods allow work to start from the application. They differ in who manages model calls, where tools execute, and which resources are available.

| Aspect | Configure a model API | Connect an Agent on a machine |
| --- | --- | --- |
| Prerequisites | Service endpoint, key, and model | Installed and authenticated Coding Agent, plus a Runner connection |
| Execution coordinator | NocoBase calls the model and dispatches selected conversation tools | The machine's Coding Agent executes with its own tools |
| Model credentials | Managed in the application's Models page | Managed by the coding tool on the machine |
| Available resources | Selected Skills, a virtual Shell, and integrated business tools or CLI commands | Projects, files, and commands allowed by the coding tool and local policy |
| Typical uses | Conversations, content drafting, and business operations through tools | Reading and changing code, running actual builds and tests |

Both methods can be used in one application. The conversation and release-note examples below use a model API; project coding tasks use an Agent on a machine. A model API conversation has no host project execution environment. Connect a machine Agent to read or change real source files or run tests.

## Scenarios and examples

The `agents-doc-demo` example uses SQLite, DeepSeek, and an English interface. Screenshots come from the running application. [Download the example source](/assets/core/downloads/agents-doc-demo.zip) and follow its `examples/README.md` to start it. The archive excludes the database, model credentials, sign-in sessions, and installed dependencies. If you do not have a project yet, start with [Create an application](../../getting-started/create-app.md).

A **development prompt** goes to the Coding Agent working in your project directory to integrate the plugin. A **conversation prompt** goes into the resulting application's chat interface.

### Scenario 1: add AI conversations to an application

Let users open chat beside a business page, select a model, send messages, and return to the conversation later. Give your development Agent this request:

```text
Use @nocobase/app-plugin-agents to add AI conversations to this NocoBase 3 application.
First read the project's AGENTS.md, application development Skill, and the Skill
shipped with the Agents plugin.

Preserve existing pages and plugins. Add model service management, a header chat
button, and a chat panel beside the main content. Use the plugin's public
conversation capabilities and agent-chat components for model selection,
sending messages, stopping generation, and restoring history.
Isolate chat state by signed-in account and provide English and Chinese text.

Use DeepSeek at https://api.deepseek.com/v1. Receive the key privately and select
an available chat model from the service's model list.
Test the connection, send a message through the UI, and reopen the conversation
to check history. Explain which files changed, what appeared in the interface,
and which checks actually passed.
```

**Configuration and operation:** once the development Agent has integrated the pages, inspect the settings in the UI. Use the same steps for manual integration.

Open **Models → Add service**, select a provider, enter service settings, fetch its models, and select a model. The live example used:

| Field | Example value |
| --- | --- |
| Provider type | `DeepSeek` |
| Name | `DeepSeek` |
| Base URL | `https://api.deepseek.com/v1` |
| API key | Your service credential, entered only in the credential field |
| Model ID | `deepseek-flash`, obtained from the service during verification |
| Model kind | `chat` |
| Enabled | On |

Use a model returned by **Fetch models** for your current account. See the [DeepSeek API documentation](https://api-docs.deepseek.com/en/) for service details. Conversations require a `chat` model; `embedding` and `rerank` do not substitute for it.

Run **Test connection** or the model's test action, then save after it succeeds. When reopening an existing service, leave its key field empty to retain the saved credential.

![DeepSeek configuration with a successful live connection test](/assets/core/agents/model-configuration.png)

![Saved and enabled model service](/assets/core/agents/models.png)

You can now select the model in chat. No corresponding entry is needed in **Machine agents**. Querying orders or processing approvals requires the application's business tools and authorization; configuring a model alone does not expose business data.

After integration, click **Agent chat** in the header and select the configured model. The example sent this conversation prompt through the actual interface:

```text
Summarize this demo in exactly three short bullets: it uses SQLite,
connects to DeepSeek through a model API, and provides a chat panel.
Do not claim any machine Agent is connected.
```

![Chat beside an application page, showing a real model reply](/assets/core/agents/chat.png)

**Done when**: a real reply arrives and the history remains available when you reopen the conversation. A name in the model list establishes that configuration was saved; verify an actual call as well.

### Scenario 2: generate release notes using a business Skill

A team wants release notes to follow a consistent format and include only supplied changes and test results. Save those rules as a business Skill and select it for a dedicated conversation.

**Development prompt:**

```text
Use @nocobase/app-plugin-agents to add release-note drafting.

Create a release-notes business Skill with SKILL.md and references/style.md,
and save it in the application's Skills library. Require the Agent to read the
style guide before producing Summary, Changes, and Verification sections.
Use only supplied facts. Write "Verification not provided" when no test results
are supplied. The Skill drafts text only; it does not modify project files or publish.

Register a release-notes conversation scope on the server that selects only this
Skill and the tools needed to read it. Create a conversation with that scope,
verify it in the chat panel, and inspect actual tool execution records.
Explain how this business conversation differs from an ordinary conversation.
```

Alternatively, [download the example release-notes Skill](/assets/core/downloads/release-notes-skill.zip) and import it through **Skills → Import**. The page displays its instructions, supporting files, and versions.

![Release-note instructions and supporting files in the Skills page](/assets/core/agents/skill.png)

The conversation must select the Skill after import. This example creates a conversation with the `release-notes` scope through the authenticated API, then opens it from chat history. The ordinary chat launcher does not automatically select this scope. See “How the business Skill enters a conversation” below; the source download also includes a component integration snippet for creating and opening it.

The example sent this **conversation prompt** in that scoped conversation:

```text
Read the release-notes Skill and its style guide, then draft concise release notes
in English. Supplied changes: Added model service configuration. Added a chat panel.
Fixed the missing Skills navigation entry. Verification supplied: 10 route and
locale tests passed. Do not claim any other tests ran.
```

![Release notes generated after reading the Skill](/assets/core/agents/skill-chat.png)

The changes and test count are supplied writing material. The model organizes them; it does not run the tests. Replace them with your actual changes and check results.

**Done when**: the output follows the requested format, tool records confirm that the Skill and supporting file were read, and no unsupported facts were added. Live verification confirmed the `skill` call and the read of `references/style.md`.

### Scenario 3: invoke a Coding Agent on a machine from the application

To read project source, modify files, and run builds and tests, connect a Coding Agent installed on a computer or server. The application provides the task entry point and working-directory context; the coding tool on the machine executes the work.

**Development prompt:**

```text
Use @nocobase/app-plugin-agents to connect a Coding Agent on a machine to this app.

Reuse the plugin's Runtimes and Machine agents pages with their original
authorization. Let me select a connected, available machine Agent and specify
an authorized project directory through a business entry point.
Validate the working directory on the server; do not accept arbitrary client paths.
Use public conversation and task capabilities to show execution state,
messages, and results.

Start with a read-only task: explain where the specified project's page routes
are defined. After verifying the execution machine, directory, and result,
try a narrowly scoped code change. Report actual execution results.
If no machine is connected, state that code execution cannot yet be verified.
```

**Connection and operation:** after integrating the pages, complete these steps on the target machine and in the application.

1. Install and sign in to a supported coding tool on the target computer or server. Confirm that it works independently.
2. Open **Runtimes**, create a personal or shared connection, and select allowed coding tools.
3. Follow the page instructions to install and register the Runner. Wait for tool, sign-in, and model reports.
4. In **Machine agents**, inspect recommended tool/model combinations and add or enable other available combinations as needed.
5. Select the machine Agent in the application. Have the business entry point provide an authorized working directory and context, then send a task.

![Selecting a connection's purpose and coding tools](/assets/core/agents/runner-connection.png)

The Runner connects, claims work, and reports status; the coding tool executes the task. An **online machine** also needs valid tool authentication, an available model, an enabled Agent, execution capacity, and permission under local policy before work can start. Its model credentials are separate from those stored in **Models**.

Once the connection and project context are ready, use a **conversation prompt** such as:

```text
Inspect the chat launcher in the currently authorized project.
First read AGENTS.md and the relevant Skills.
Add missing English and Chinese tooltip text to the existing chat button,
using the project's localization mechanism.
Preserve button behavior, authorization, and layout. Change only necessary files.
Run affected checks, then list changed files, check results, and unverified items.
```

**Done when**: you can identify the execution machine and directory and inspect actual code changes and check results. This example inspected the connection interface but did not connect a real Coding Agent. This scenario is integration guidance, not a completed execution demonstration.

## Key principles and implementation

This section follows the example source used in the scenarios. It maps file changes to interface effects, then explains registration, chat state, Skill selection, and execution backends. Use the same integration points when developing manually.

### Changed files and interface effects

| File or directory | Change | Effect |
| --- | --- | --- |
| `client/plugins.ts`, `server/plugins.ts`, `cli/plugins.ts` | Register the three Agents contributions | Load plugin services, APIs, and commands; registration alone adds no menu |
| `client/routes.ts` | Compose five plugin pages and the template's prepared user and permission settings routes | Add sidebar management entries while preserving home and sign-in pages |
| `client/extensions/nocobase-agent-chat/` | Install Registry chat UI source and supporting components | Provide the panel, messages, model selection, and history interface |
| `client/components/agents-provider.tsx` | Add the application's own `AgentsProvider` for the current account | Share conversation state and reinitialize it when identity changes |
| `client/layouts/app-layout.tsx` | Mount the Provider, panel beside main content, and mobile launcher | Support desktop conversations alongside business pages |
| `client/layouts/components/header-actions.tsx` | Add `ChatHeaderButton` | Show Agent chat in the header |
| `client/locales/en-US.ts`, `zh-CN.ts` | Merge component resources and add `agentDemo` navigation text | Supply English and Chinese text for new navigation and chat |
| `server/providers/agents.ts`, `index.ts` | Add and register the release-note Provider | Resolve the `release-notes` conversation scope after server startup |
| `examples/release-notes/` | Keep source for Skill instructions and supporting files | Make them available for import and maintenance in Skills |
| `tests/client/client-routes.test.ts` | Check route uniqueness, page loading, and authorization definitions | Verify integration and detect changes to existing page contracts |

`package.json` and the lockfile record dependency changes. Model services, business Skills, and conversation history are runtime application data. Copying source does not copy those records; configure your own model service and import the Skill after starting the downloaded example.

### What plugin registration changes

The default template includes the Agents dependency without registering it. The example registered it in the existing application and previewed and applied database changes:

```bash
pnpm nocobase plugin register agents --dry-run --json
pnpm nocobase plugin register agents --json
pnpm nocobase db apply --dry-run --json
pnpm nocobase db apply --json
```

Registration adds the plugin to the three plugin arrays. The database commands apply plugin migrations and seeds. The example adds no custom Agents business tables and does not write plugin tables directly. Authentication, authorization, and file capabilities reuse the template's existing plugins. See [Manage plugins](../../developing-apps/manage-plugins.md) for general installation and registration instructions.

### How management pages appear in the sidebar

`client/routes.ts` imports public plugin page definitions and supplies application navigation titles and icons:

| Export | Default path | Purpose |
| --- | --- | --- |
| `modelsRoute` | `/models` | Model services, available models, and connection tests |
| `agentsRoute` | `/agents` | Coding tool and model combinations on machines |
| `runtimesRoute` | `/runtimes` | Machine connections and execution environments |
| `skillsRoute` | `/skills` | Business Skills, supporting files, and versions |
| `usageRoute` | `/usage` | Usage and pricing settings |

This excerpt shows the Models entry; the other four follow the same pattern:

```ts
import { BrainCircuit } from 'lucide-react';
import { modelsRoute } from '@nocobase/app-plugin-agents/client/routes';

// Use this entry inside the application's existing defineAppRoutes contribution.
const modelsPage = {
  ...modelsRoute,
  navigation: { title: 'agentDemo.models', icon: BrainCircuit },
};
```

Spreading `modelsRoute` preserves its page component, authentication requirements, authorization, and child routes while replacing its navigation presentation. New routes are exported alongside the original `appRoutes`. The runtime handles deployment prefixes such as `/main`; they are not part of these page paths.

Models uses `settings:agents.services` authorization, and other pages retain their own definitions. If an entry is missing, check route composition and the current user's access.

### How chat launchers, layout, and account state work together

The example installs chat UI through the Registry:

```bash
pnpm exec shadcn add @nocobase/agent-chat
```

`@nocobase/app-plugin-agents/client/chat` provides conversation state and hooks. The installed Registry components provide presentation. The layout simplifies to:

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

`ChatPanel` is a sibling of `main`, allowing it to dock beside the business page. Header and mobile launchers share the same conversation state. Existing navigation, breadcrumbs, theme controls, and the user menu remain. The mobile launcher is wired in source; screenshots and live acceptance in this example use the desktop interface.

`AgentsProvider` is a component added by the example, using the plugin's `ChatProvider` internally. It reads the signed-in user ID, uses a React `key` to recreate the controller when identity changes, passes the ID as `memoryScope`, and clears unscoped query cache and panel state during mounting and cleanup. This ties chat state to the current account's lifetime; the server still enforces conversation access.

### How the business Skill enters a conversation

Development Skills in the project's `.agents/skills/` teach a Coding Agent how to integrate the plugin. Business Skills in the application's **Skills** library guide runtime tasks. These have different purposes and do not synchronize automatically.

The example's business files are:

```text
release-notes/
├── SKILL.md
└── references/
    └── style.md
```

`SKILL.md` requires reading `references/style.md`, producing Summary, Changes, and Verification, and using only supplied facts without inventing versions, dates, or test results. After the Skill is saved to the library, `server/providers/agents.ts` registers a named scope at boot. `server/providers/index.ts` loads that Provider.

This is its key implementation; the download contains the complete Provider:

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

The code resolves the public `agentsToken` service and selects one explicit Skill slug on the server. The `skill` tool reads instructions, `bash` reads supporting files in the virtual filesystem, and `systemPromptTemplate` supplies task guidance. A scope selects capabilities; it grants no business permissions.

When creating a conversation, the current user's authenticated client submits this body to `POST /api/agents/conversations`:

```json
{
  "agentId": "online",
  "title": "Release notes with a Skill",
  "config": { "scope": ["release-notes"] },
  "selectedModel": { "modelService": "deepseek", "model": "deepseek-flash" }
}
```

`modelService` identifies a configured service, and `model` must be enabled in it. The client selects an allowed scope; the server resolves the actual tools and Skill. An ordinary new conversation without this scope does not automatically use the release-note Skill.

**Global attachment** in the Skills page controls global Skill merging for subsequent Runner tasks. Model API conversations select Skills through server scopes; that switch does not automatically attach a Skill to model API conversations.

### Execution backends and capability boundaries

You will encounter these names when reading the code:

| Name | Meaning |
| --- | --- |
| `agentId: 'online'` | Select execution in which the plugin calls a model API |
| `native` | The backend name for that method; it does not mean an offline or local model |
| `runner` | Invoke a machine's Coding Agent through a concrete Agent ID |
| `agentsToken.onlineAgent` / `OnlineAgent` | The shared conversation service; realtime conversations support both `native` and `runner` backends |

`OnlineAgent` is the conversation interface shared by both execution methods. The model API backend also supports structured background execution with JSON Schema. Runner does not implement that background interface, but has its own task queue and execution mechanism.

The model API backend's virtual Shell can read selected Skills, process text, and use temporary files: `/skills` is read-only and `/tmp` is writable. It cannot access the host filesystem or directly run the project's Node, Python, build, or test processes. Connect an Agent on a machine when you need a real project execution environment.

### What happens after a message is sent

1. Chat components create or open a conversation. The server saves its model, scope, and other configuration.
2. The user sends a message. The model API backend prepares selected Skills and tools and calls the model.
3. When the model requests a tool, the server executes a selected tool and returns its result. This example actually read the Skill and style guide.
4. The panel receives the streamed reply. The server persists messages and execution results, and reads saved history when the conversation reopens.

Public chat hooks and components already handle sending, stopping, and history recovery. Reuse them in business entry points. The application API client handles deployment prefixes such as `/main/api`.

Tasks that act on business data also need registered tools or allowed CLI commands. Their services must validate inputs, identity, operation permissions, and data access. For document retrieval, integrate the [Knowledge base](knowledge.md). Writing “can query orders” in a Skill does not implement an order-query capability.

## AI development constraints and verification

This section concerns AI helping developers integrate the Agents plugin. For general task scoping, project guidance, and collaboration, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md). Here the focus is on plugin-specific interfaces, authorization, conversations, and execution boundaries. The plugin does not automatically guarantee generated code or complete all application tests and review.

### Use the development Skill for the installed version

Before integration, have the development Agent read `.agents/skills/nocobase-app-plugin-agents/SKILL.md` and the model service, conversation tool, Runner, or Skill references needed for the task. This Skill identifies public interfaces and integration patterns for the installed plugin. Application-specific conventions remain in the project's `AGENTS.md` and `.agents/rules/`.

Run `pnpm nocobase skills sync` after dependency installation or updates. For a concrete interface, also check the installed package's public exports, types, and runtime behavior. Instructions can lag behind implementation; investigate and report discrepancies.

In this example, Registry installation changed Agents to the older `0.1.0-beta.14`. Restoring the compatible `1.0.0-beta.29` and synchronizing Skills passed type and runtime checks. Inspect manifest and lockfile changes after AI-assisted component installation; a successful install alone does not establish compatibility. These versions document the verified example, not a permanent recommendation for future projects.

### Preserve interface, authorization, and execution boundaries

When AI changes an Agents integration, retain the following boundaries in the implementation and acceptance criteria. Prompts state requirements; code and checks enforce them:

| Constraint | How the example implements it | What still needs checking |
| --- | --- | --- |
| Use public interfaces | Public routes, `client/chat`, `agentsToken`, and CLI registration | Compatibility with public types and contracts after upgrades |
| Preserve authorization | Spread original route definitions and assert page authorization resources | Ordinary users' API and data access restrictions |
| Isolate account state | Recreate ChatProvider per user and clear cache and panel state | Account-switching browser behavior; full multi-account acceptance was not completed |
| Control business capabilities | Server scope selects only the release-note Skill and reading tools | Server-side identity, input, and data checks for new tools |
| Preserve existing data | Preview and apply migrations instead of writing plugin tables directly | Effects of new business migrations on existing data and failure cases |

Prompts and Skills provide behavioral guidance. Identity checks, authorization, tool selection, and tests provide code-level safeguards. For Runner execution, also use an explicitly authorized directory, an isolated development environment, and reviewable code changes. Runner itself is not a filesystem sandbox; machine and coding-tool configuration determine actual access.

### Verify affected behavior and actual results

Static checks, automated tests, and live operations answer different questions. This example completed:

| Check | Actual result and what it establishes |
| --- | --- |
| Client/server types, scoped ESLint, and formatting | Passed; checked integration against current types and conventions |
| Route and localization suites | 2 files, 10 passing tests covering page loading, registration, authorization definitions, and language resources |
| Model connection and browser conversation | Real DeepSeek replies, readable saved history, and completed execution state |
| Skill use | Original tool records confirm reading the Skill and `references/style.md`, beyond the model's own assertion |
| Anonymous API access | Model service and Skill APIs returned 401; this does not verify the complete role matrix |

Rerun the related tests in the downloaded example:

```bash
pnpm exec vitest run tests/client/client-routes.test.ts tests/client/app-locale-coverage.test.ts
```

For broader changes or delivery, run the project's required full checks and build. The default template's `pnpm check` includes package checks, lint, formatting, types, tests, and build. **This example did not run the full `pnpm check` or a production application build.** Inspect actual test cases and results; a successful command with no discovered tests is not acceptance. See [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

### Make delivery reports reviewable

After development, give the Agent an acceptance prompt:

```text
Review this @nocobase/app-plugin-agents integration:
1. List changed files and UI effects. Confirm use of public routes, chat components,
   and services.
2. Check that new pages retain authorization and account changes clear chat state.
3. Verify model connectivity, real replies, and history recovery. Check that
   unauthorized requests are rejected.
4. If a Skill was added, inspect the selected conversation scope and actual tool
   reads. Saving a Skill in the library does not prove a conversation used it.
5. If a machine Agent was connected, confirm the machine, authorized directory,
   actual code changes, and check results.
6. Run affected type, lint, and test checks. Record commands and test counts.
If the required environment or accounts are unavailable, identify those items
as unverified. Do not report planned checks as passed.
```

The live baseline on 2026-10-29 was default template `1.0.0-beta.84`, Agents `1.0.0-beta.29`, SQLite, and DeepSeek `deepseek-flash`. Machine Agent execution, the full role matrix, business writes, attachment parsing, mobile behavior, and production deployment remain unverified. Add verification for each capability you extend.
