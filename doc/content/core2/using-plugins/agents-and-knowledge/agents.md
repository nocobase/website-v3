---
title: "Agents"
description: "Learn what app-plugin-agents provides, integrate it through scenarios and prompts, map the code to the interface to understand the implementation, and verify the results of AI-assisted development."
---

`@nocobase/app-plugin-agents` adds AI conversations, model services, Skills, Agents on machines and usage management to an application. This guide covers, in order, the plugin's capabilities, usage scenarios, key implementation details, and how to verify the results of AI-assisted development.

## Capabilities

### Capability overview

| Capability | What the plugin provides | How the application uses it |
| --- | --- | --- |
| Model services | Service configuration, the list of available models and connection tests | Connect the Models page and configure a provider, key and model |
| AI conversations | Conversations, messages, streaming replies, stopping generation and history recovery | Compose business interfaces with the public chat Hooks and agent-chat components |
| Business Skills | Instructions, supporting files, import and version management | Maintain guidance on the Skills page, then select it for conversations or machine tasks |
| Tools and business calls | Tool registration, per-conversation capability selection and the execution mechanism for calls | Connect business tools or allowed CLI commands, and implement their authorization |
| Machine Agents | Runner connections, combinations of coding tools and models, and task execution status | Connect the Runtimes and Machine agents pages, and provide authorized project context |
| Usage management | Pages for viewing usage and setting prices | Add the Usage page to the application's navigation |

The plugin provides pages, components and services you can compose. Where the menu and chat entries go, how business tasks start and which data may be operated on are all decided by the application; registering the plugin does not complete these interfaces and business flows automatically.

### Two ways to connect an Agent

Both ways let you start tasks from the application. They differ in who coordinates model calls, where tools run and which resources can be reached.

| Aspect | Configure a model API | Connect an Agent on a machine |
| --- | --- | --- |
| What to prepare | A model service address, key and model | A Coding Agent installed and signed in on the machine, plus a Runner connection |
| Who coordinates execution | NocoBase calls the model and dispatches the tools selected for the conversation | The machine's Coding Agent runs the task with its own tools |
| Model credentials | Managed in the application's Models | Managed by the coding tool on the machine |
| Available resources | Selected Skills, a virtual Shell, and business tools or CLI commands the application connects | The projects, files and commands the coding tool and local policy allow |
| Typical uses | Conversations, organizing content, querying or processing data through business tools | Reading and changing project code, running real builds and tests |

One application can use both. The conversation and release-note examples below use a model API, while the project code task uses a Coding Agent on a machine. A model API conversation has no host project execution environment; to read or change real source code or run tests, connect a machine Agent.

## Scenarios and examples

The `agents-guide` example uses SQLite, DeepSeek and an English interface, and all screenshots come from the running application. [View the example source](https://github.com/nocobase/docs-examples-v3/tree/b91adc8bcd89a238c84f9e62026f250b4833615a/apps/agents-guide) and start it as described in its `README.md`; run the commands in the repository's `apps/agents-guide` directory. The source contains no database, model keys, sign-in sessions or dependency directories. If you have no application yet, prepare a project with [Create an app](../../getting-started/create-app.md) first.

This guide distinguishes two kinds of prompt: a **development prompt** goes to the Coding Agent working in your project directory, to integrate the plugin into the application; a **conversation prompt** is used in the application's chat interface after integration.

### Scenario 1: add AI conversations to the application

The goal is to let users open a chat panel next to a business page, choose a model, send messages, and pick up the conversation the next time they open it. Give the development Agent this request:

```prompt
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

**Configuration and operation:** after the development Agent has connected the pages, you can check the configuration in the interface; for manual integration, follow the same steps.

In **Models → Add service**, choose a provider, fill in the service details, fetch the model list and choose a model. The values this example actually used:

| Field | Value in this example |
| --- | --- |
| Provider type | `DeepSeek` |
| Name | `DeepSeek` |
| Base URL | `https://api.deepseek.com/v1` |
| API key | Your own service key, entered only in the key field |
| Model ID | `deepseek-flash`, fetched from the service this time |
| Model kind | `chat` |
| Enabled | On |

Use the model names returned by **Fetch models** for your current account; for the service API, see the [DeepSeek documentation](https://api-docs.deepseek.com/en/). Conversations need a `chat` model; `embedding` and `rerank` models cannot stand in for it.

Click **Test connection** or the test button next to a model, and save after the test succeeds. When reopening an existing service, leaving the key field empty keeps the saved key.

![DeepSeek configuration with a successful live connection test](/assets/core/agents/model-configuration.png)

![The saved and enabled model service](/assets/core/agents/models.png)

Once configured, the model can be chosen in chat; there is no need to add an entry for it in the **Machine agents** list. To query orders or process approvals, the application must also connect the corresponding tools and business authorization; configuring a model alone does not expose business data.

After integration, click **Agent chat** in the header and choose the configured model. This example actually sent the following conversation prompt through the interface:

```text
Rewrite only these supplied facts as three short English bullets: the demo uses
SQLite, connects to DeepSeek through a model API, and provides a chat panel.
This is a writing exercise: do not use page context, call tools, or infer configuration.
Output only the bullets.
```

![The chat panel next to a business page, with a real model reply](/assets/core/agents/chat.png)

**Done when**: the message receives a real reply, and the history can still be read after reopening the conversation from **Conversations**. A name appearing in the model list only means the configuration was saved; the actual call still needs verifying. Chat includes the current page's context, and the model may draw wrong conclusions from it; this prompt only verifies fact organization and the call path, so do not judge whether the application is configured correctly from the reply.

### Scenario 2: have the Agent write release notes to a business standard

The team wants every release note to follow the same format and to cite only the changes and test results that were actually provided. To do that, save the standard as a business Skill and have a dedicated conversation select it.

**Development prompt:**

```prompt
Use @nocobase/app-plugin-agents to add release-note drafting.

Create a release-notes business Skill with SKILL.md and references/style.md,
and save it in the application's Skills library. Require the Agent to read the
style guide before producing Summary, Changes, and Verification sections.
Use only supplied facts. Write "Verification not provided" when no test results
are supplied. The Skill drafts text only; it does not modify project files or publish.

Register a release-notes conversation scope on the server that selects only this
Skill and the tools needed to read it. Add a Draft release notes header button
that creates and opens a conversation with this scope. Handle missing models or
Skills, creation failures, and duplicate clicks; preserve account isolation and
authorization. Verify the reply and inspect actual tool execution records.
Explain how this business conversation differs from an ordinary conversation.
```

You can also [download this example's release-notes Skill](/assets/core/downloads/release-notes-skill.zip) and import it in **Skills → Import**. The page shows the instruction text, supporting files and versions.

![Release-note instructions and supporting files on the Skills page](/assets/core/agents/skill.png)

After importing, click the file icon **Draft release notes** in the header to create and open a business conversation. The button picks the first `chat` model among the enabled services and submits the `release-notes` scope through the authenticated API; to use another model, switch before sending. Each click creates a new conversation; to continue an existing draft, open it from **Conversations**. The ordinary **Agent chat** entry does not select this Skill automatically.

If it fails to open, first confirm that the model service is available and the Skill's slug is `release-notes`, then check that the server Provider is registered. The button is disabled while the request is pending and shows a message on failure; the implementation is in `client/components/release-notes-button.tsx`.

In this business conversation, the example actually sent this **conversation prompt**:

```text
Read the release-notes Skill and its style guide, then draft concise release notes
in English. Supplied changes: Added model service configuration. Added a chat panel.
Fixed the missing Skills navigation entry. Verification supplied: 17 route, locale, and
permission-label tests passed. Do not claim any other tests ran.
```

![Release notes generated after reading the Skill](/assets/core/agents/skill-chat.png)

The changes and the test count here are writing material supplied by the user; the model only organizes them and did not run any tests. For your own project, replace them with the actual changes and check results.

**Done when**: the output follows the required format, the tool call records prove that the Skill and its supporting file were read, and no facts the user did not supply were added. This live run confirmed the `skill` call and the read of `references/style.md`.

### Scenario 3: call a Coding Agent on a machine from the application

When an Agent needs to read project source, change files, and run builds and tests, connect a Coding Agent already installed on a computer or server. The application provides the task entry and the working directory context, and the coding tool on the machine runs the task.

**Development prompt:**

```prompt
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

**First prepare the application CLI and Runner distributions.** The default template has neither an application CLI of its own nor a downloadable Runner. If you install from the connection page after only registering the plugin, you get a 404; even with the machine online, tasks without an application CLI fail with `cliUnavailable`. The example project already declares the required dependencies and configuration; in its root, run:

```bash
pnpm nocobase cli build --universal
pnpm nocobase cli build --runner --universal
```

These two commands only build the CLI and Runner distributions; they are not a production application build. Running them needs npm network access, and target machines need Node.js 24. After first use, restart the application and confirm the distribution directory is still `storage/runners/dist`. For manual integration you also need to:

- Declare `nocobase.cli.bin` in `package.json` (`agents-guide` in this example), and install matching versions of `@nocobase/app-cli-client` and `@nocobase/agent-runner`.
- Define `cli.name: 'agents-guide'` and `cli.package: { kind: 'served' }` in `server/config/agents.ts`, and register that configuration section in `server/config/index.ts`. The CLI name must match the packaged name; in this example, running `config set agents.cli.name=...` without the section registered reports `UNKNOWN_KEY`.

**Connection and operation:** after the pages are connected, complete this configuration on the target machine and in the application.

1. Install and sign in to a supported coding tool on the target computer or server, and confirm the tool itself runs.
2. Open **Runtimes**, create a personal or shared connection, and choose the coding tools it may use.
3. Install and register the Runner as the page instructs, and wait for the machine to report its tools, sign-in status and models.
4. In **Machine agents**, add and enable a tool-and-model combination from the available model list. Without recommended combinations configured, this list may stay empty even while the machine is online.
5. Open **Agent chat**, click **Switch to runner agents**, choose an available Agent, and first run a read-only check in the conversation's own working directory. Once a business project is connected, the business entry provides authorized project context.

![Choosing the purpose and coding tools when creating a machine connection](/assets/core/agents/runner-connection.png)

The Runner establishes the connection, claims work and reports status, while the actual task is run by the coding tool. Besides the **machine being online**, the tool must be signed in, a model available, the Agent enabled, and an execution slot and local policy must allow it before a task can start. Machine Agents use the coding tool's own model credentials, managed separately from the keys in **Models**.

Check the execution environment first with this **conversation prompt**:

```text
Perform a read-only smoke test in this conversation's assigned workspace.
Run pwd and list its top-level files. Report the actual working directory and output
in English. Do not read credentials, access other directories, edit files, install
packages, or claim that the application source is present unless you see it.
```

An ordinary Runner conversation uses its own working directory and does not enter the application's source directory automatically. Even after a successful connection, project context integration still has to be developed; never let users type an arbitrary host path into the chat in place of authorization. Once the project context is ready, you can go further with a prompt like this:

```text
Inspect the chat launcher in the currently authorized project.
First read AGENTS.md and the relevant Skills.
Add missing English and Chinese tooltip text to the existing chat button,
using the project's localization mechanism.
Preserve button behavior, authorization, and layout. Change only necessary files.
Run affected checks, then list changed files, check results, and unverified items.
```

**Done when**: the read-only check has actual command results, the executing machine and the working directory, and the run record's status is `completed`; project code tasks should also have actual code differences and check results. This run connected Runner `0.1.0-beta.20` with Codex `0.165.0`, executed `pwd` and `ls -A1` in the conversation's working directory, and confirmed the directory was empty and the run completed. Since application source is not attached automatically, the code-changing prompt above remains guidance for further integration; changing code and building were not tested.

![A personal Runner connected, with Codex detected](/assets/core/agents/runner-online.png)

![A machine Agent's real read-only commands and results](/assets/core/agents/runner-chat.png)

## Key principles and implementation

This section follows the example source used in the scenarios above: it first maps file changes to interface changes, then explains the key implementation of registration, chat state, Skill selection and execution backends. You can follow the same places when integrating manually.

### Changed files and interface changes

| File or directory | Change | Effect |
| --- | --- | --- |
| `client/plugins.ts`, `server/plugins.ts`, `cli/plugins.ts` | Register Agents' contributions on all three sides | The application loads the plugin's services, APIs and commands; registration itself adds no menus |
| `client/routes.ts` | Compose five plugin pages and connect the template's existing user and permission settings routes | Management entries appear in the sidebar, and the existing home and sign-in pages stay unchanged |
| `client/extensions/nocobase-agent-chat/` | Install the chat interface source from the Registry and the components it depends on | Provides the chat panel, message display, model selection and history interface |
| `client/components/agents-provider.tsx` | Add the application's own `AgentsProvider` to manage chat state for the current account | Panels share conversation state, which is reinitialized when the account changes |
| `client/layouts/app-layout.tsx` | Mount the Provider, the chat panel beside the main content and the mobile entry | On desktop, users can work on a business page and chat at the same time |
| `client/layouts/components/header-actions.tsx`, `client/components/release-notes-button.tsx` | Add the ordinary chat entry and the release-note entry | The header can open an ordinary conversation or a business conversation with a specific scope |
| `client/locales/en-US.ts`, `zh-CN.ts` | Merge the components' language resources and add `agentDemo` navigation text | New entries and chat components have English and Chinese text |
| `package.json`, `server/config/agents.ts`, `server/config/index.ts` | Declare the application CLI's name and distribution method consistently | The Runner can download the application CLI, avoiding "online but unable to run" |
| `server/providers/agents.ts`, `index.ts` | Add and register the release-note Provider | After the server starts, the `release-notes` conversation scope can be resolved |
| `examples/release-notes/` | Keep the source of the Skill text and supporting files | After import, they can be viewed and maintained on the Skills page |
| `client/pages/settings/page-permission-titles.ts` | Add English and Chinese permission names for the Skills child pages and the Runner connection page | Permission management shows readable names, while authorization IDs stay the same |
| `tests/client/release-notes-button.test.tsx` | Verify creation, repeated clicks, retry after failure, permissions and the end of an identity | Both success and failure paths of the business entry are checked |
| `tests/client/client-routes.test.ts` | Add checks for route uniqueness, page loading and authorization definitions | Checks that new pages are connected correctly and existing page conventions are unchanged |

`package.json` and the lockfile record the dependency changes. Model services, business Skills and conversation history are the application's runtime data: copying the source does not copy these records, so after starting the example you still configure your own model service and import the Skill.

### What registering the plugin does

The default template already installs the Agents dependency but does not register it by default. The example registers it with the CLI in an existing application, then previews and applies the database changes:

```bash
pnpm nocobase plugin register agents --dry-run --json
pnpm nocobase plugin register agents --json
pnpm nocobase db apply --dry-run --json
pnpm nocobase db apply --json
```

Registration adds the plugin to the plugin arrays on all three sides, and the database commands apply the migrations and seed data the plugin provides. The example writes no Agents business tables of its own and does not change the plugin's tables directly. Authentication, authorization and file capabilities reuse the plugins the template already has. For the common installation and registration steps, see [Manage plugins](../../developing-apps/manage-plugins.md).

### How management pages appear in the sidebar

`client/routes.ts` references the page definitions the plugin makes public and adds the application's own navigation titles and icons:

| Export | Default path | Page purpose |
| --- | --- | --- |
| `modelsRoute` | `/models` | Model services, available models and connection tests |
| `agentsRoute` | `/agents` | Combinations of coding tools and models on machines |
| `runtimesRoute` | `/runtimes` | Machine connections and runtime environments |
| `skillsRoute` | `/skills` | Business Skills, supporting files and versions |
| `usageRoute` | `/usage` | Usage and price settings |

The excerpt below shows how the Models page is composed; the other four pages are done the same way:

```ts
import { BrainCircuit } from 'lucide-react';
import { modelsRoute } from '@nocobase/app-plugin-agents/client/routes';

// Use this entry inside the application's existing defineAppRoutes contribution.
const modelsPage = {
  ...modelsRoute,
  navigation: { title: 'agentDemo.models', icon: BrainCircuit },
};
```

Spreading `modelsRoute` keeps the plugin's page component, sign-in requirement, authorization definition and child routes, replacing only how it appears in navigation. All new routes are exported together with the existing `appRoutes`. The application's deployment prefix `/main` is handled by the runtime; do not write it into these page paths.

The Models page uses `settings:agents.services` authorization, and the other pages keep their own authorization definitions. If a menu entry does not appear, check the route composition and the current user's permissions.

### How the chat entry, layout and account state fit together

The example installs the chat interface through the Registry:

```bash
pnpm exec shadcn add @nocobase/agent-chat
```

> [!NOTE]
> Check `package.json` and the lockfile right after installing. In this run, the Registry command downgraded Agents to `0.1.0-beta.14`, and work could only continue after restoring the version that matches the template. Below are the fix commands used in this example; for other templates, check the compatible version first:

```bash
pnpm add @nocobase/app-plugin-agents@1.0.0-beta.29 --save-exact
pnpm nocobase skills sync --dry-run --json
pnpm nocobase skills sync --json
```

`@nocobase/app-plugin-agents/client/chat` provides conversation state and Hooks, and the Registry components installed into the application handle presentation. The layout relationship simplifies to:

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

`ChatPanel` sits at the same level as `main`, so the chat panel can dock beside the business page; the header button and the mobile button share the same chat state. The existing navigation, breadcrumbs, theme switch and user menu stay unchanged. The screenshots in this guide use the English desktop interface; a 390 px narrow panel and the dark theme were also checked, but the full set of mobile combinations has not been accepted yet.

`AgentsProvider` is a component added by the example that uses the plugin's `ChatProvider` internally. It reads the signed-in user's ID, rebuilds the controller with a React `key` when the identity changes, passes the ID into `memoryScope`, and clears query caches and panel state that are not isolated per account when mounting and cleaning up. This binds the chat state's lifecycle to the current account, while checking access to conversations is still the server's job.

### How a business Skill enters a conversation

A development Skill in the project's `.agents/skills/` tells the Coding Agent how to use the plugin; a business Skill in the application's **Skills** library tells the runtime Agent how to complete a task. They serve different purposes and are not synchronized automatically.

The business files in this example are:

```text
release-notes/
├── SKILL.md
└── references/
    └── style.md
```

`SKILL.md` requires reading `references/style.md` first, producing output in three parts, Summary, Changes and Verification, and using only facts the user supplied, without adding versions, dates or test results. Once the standard is saved to the library, `server/providers/agents.ts` registers a named scope at startup, and `server/providers/index.ts` loads it.

Below is the key code of this Provider; the full implementation is in the example source:

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

This code gets the service through the public `agentsToken`, and the server selects one Skill by an explicit slug. The `skill` tool reads the instructions, `bash` reads the supporting files in the virtual file system, and `systemPromptTemplate` adds the task conventions. A scope only selects capabilities and grants no business permissions.

The header's `ReleaseNotesButton` creates a conversation with the application's API client and calls `panel.openChat({ conversationId })` on success. The current user's authenticated client submits this request body to `POST /api/agents/conversations`:

```json
{
  "agentId": "online",
  "title": "Draft release notes",
  "config": { "scope": ["release-notes"] },
  "selectedModel": { "modelService": "deepseek", "model": "deepseek-flash" }
}
```

`modelService` identifies a configured service, and `model` must be a model enabled in it. The client only chooses an allowed scope; the actual tools and Skill are resolved by the server. Ordinary new conversations lack this scope configuration, so they do not use the release-note Skill automatically.

**Global attachment** on the Skills page merges global Skills into later Runner tasks. Model API conversations choose Skills through the server-side scope, and this switch does not add a Skill to model API conversations automatically.

### Execution backends and capability limits

When reading the code you will see these names:

| Name | Meaning |
| --- | --- |
| `agentId: 'online'` | Chooses the execution method in which the plugin calls a model API |
| `native` | The backend name of that execution method; it does not mean offline or a local model |
| `runner` | Calls a Coding Agent on a machine through a specific Agent ID |
| `agentsToken.onlineAgent` / `OnlineAgent` | The unified conversation service; live conversations can use the `native` or `runner` backend |

`OnlineAgent` is the conversation interface both execution methods share. The model API backend also supports structured background execution with JSON Schema; the Runner does not support that background interface but has its own task queue and execution mechanism.

The model API backend's virtual Shell can read the selected Skills and process text and temporary files: `/skills` is read-only and `/tmp` is writable. It cannot reach the host machine's file system or directly run the project's Node, Python, builds or tests. When you need a real project execution environment, connect an Agent on a machine.

### What happens after a message is sent

1. The chat component creates or opens a conversation, and the server saves the conversation configuration such as the model and scope.
2. The user sends a message; the model API backend prepares the selected Skills and tools, then calls the model.
3. When the model asks for a tool, the server runs the selected tool and returns the result to the model; in this example, the Skill text and the style guide were actually read.
4. The chat panel receives the streaming reply, and the server saves the messages and execution results; reopening the conversation reads the saved history.

The chat Hooks and components the plugin makes public already handle sending, stopping and recovering history. Business entries should reuse them rather than writing another protocol. With the application's API client, deployment prefixes such as `/main/api` are handled by the client.

If a task needs to operate on business data, the application must also register tools or connect allowed CLI commands, and validate the input, current identity, action permissions and data scope in the actual services. When knowledge retrieval is needed, you can connect the [Knowledge base](knowledge.md) as well. Writing "can query orders" in a Skill does not create an order query capability out of nothing.

## AI development constraints and verification

This chapter covers how to constrain and verify changes when AI helps developers use the Agents plugin. For general requirement breakdown, project guidance and the collaboration process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md); this chapter focuses on the interface, permission, conversation and execution limits specific to the plugin. The plugin does not guarantee that generated code is correct, and it does not complete all testing and review for the application.

### Use a plugin development Skill that matches the version

Before integration, have the development Agent read `.agents/skills/nocobase-app-plugin-agents/SKILL.md`, then consult the references on model services, conversation tools, Runner or Skills as the task needs. This Skill helps the Agent find the current plugin's public interfaces and integration approach; application-specific conventions still belong in the project's `AGENTS.md` and `.agents/rules/`.

After installing or updating dependencies, run `pnpm nocobase skills sync`. For specific interfaces, also check the current package's public exports, types and runtime behavior. Guidance can lag behind, so verify and report when you find a conflict.

This example actually ran into the Registry installation changing the Agents dependency to the old `0.1.0-beta.14`. Only after restoring the matching `1.0.0-beta.29` and synchronizing Skills did the type and runtime checks pass. So after AI installs components, check the differences in `package.json` and the lockfile; a successful install command alone does not prove compatibility. The version numbers here are this example's verification baseline, not a fixed choice for future projects.

### Keep the plugin's interface, permission and execution limits

When AI changes the Agents integration code, write the following limits into the implementation and the acceptance requirements. Prompts state the requirements, while code and checks enforce them:

| Constraint | How this example enforces it | What still needs checking |
| --- | --- | --- |
| Use public interfaces | References the public routes, `client/chat` and `agentsToken`, and registers through the CLI | Whether it still fits the public types and conventions after an upgrade |
| Keep authorization | Spreads the existing route definitions; tests record each page's authorization resource | Whether ordinary users' API and data access are restricted correctly |
| Isolate account state | Rebuilds `ChatProvider` per user and clears caches and panel state | Browser behavior after switching accounts; full multi-account acceptance was not completed |
| Control business capabilities | The server-side scope selects only the release-note Skill and read-type tools | Whether new tools validate identity, parameters and data scope on the server |
| Keep existing data | Uses migration previews and the application flow, without rewriting plugin tables directly | How new business migrations affect old data and failure cases |

Prompts and Skills are only behavioral guidance; identity checks, authorization, tool selection and tests are the safeguards in code. When running code through the Runner, also use an explicitly authorized directory, a separate development environment and reviewable code differences. The Runner itself is not a file system sandbox; what it can actually reach depends on the machine and the coding tool's configuration.

### Verify by change, and check real results

Static checks, automated tests and actual operation answer different questions. This example completed:

| Check | Actual result, and what it shows |
| --- | --- |
| Client and server type checks, ESLint and formatting within the changed scope | Passed, showing the integration code fits the current types and conventions |
| Tests for routes, languages, permission names and the business entry | 4 test files and 23 cases passed, covering page loading, route authorization, English and Chinese text, creation, retry after failure, repeated clicks and the end of an identity |
| Model connection and in-browser conversation | DeepSeek returned real replies; saved history and completion status could be read |
| Use of the Skill | The raw tool call records confirm reading the Skill and `references/style.md`, rather than only the model's own claim |
| Read-only Runner execution | After adding the application CLI, `pwd` and `ls -A1` actually ran and the run record was `completed`; the cause of the first failure and its fix are recorded |
| Anonymous API access | The model service and Skills APIs returned 401; this is not the same as verifying the full role permission matrix |

In the example directory, you can rerun the related tests:

```bash
pnpm exec vitest run tests/client/client-routes.test.ts tests/client/app-locale-coverage.test.ts tests/client/page-permission-titles.test.ts tests/client/release-notes-button.test.tsx
```

When widening the change or preparing delivery, run the full checks and build the project requires. The default template's `pnpm check` includes package checks, lint, formatting, types, tests and the build; **this example did not run the full `pnpm check`, nor a production application build**. When reading check reports, look at the cases actually run and the exit results; exiting normally with no tests found does not count as passing acceptance. For testing methods, see [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

### Make the delivery report reviewable

When development is done, you can give the Agent an acceptance prompt:

```prompt
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

This guide's live baseline was default template `1.0.0-beta.84`, Agents `1.0.0-beta.29`, SQLite and DeepSeek `deepseek-flash` on 2026-10-29. Machine Agents changing project code and building, the full role matrix, business writes, attachment parsing, the full set of mobile combinations and production deployment have not been accepted yet. When extending later, add verification for each new capability.

### Example source

- [The complete example project](https://github.com/nocobase/docs-examples-v3/tree/b91adc8bcd89a238c84f9e62026f250b4833615a/apps/agents-guide): model conversations, a business Skill and Runner integration, pinned at commit `b91adc8`.
- [Run and verification notes](https://github.com/nocobase/docs-examples-v3/blob/b91adc8bcd89a238c84f9e62026f250b4833615a/apps/agents-guide/README.md): version requirements, installation and configuration, startup and test commands.
- [Download the example source ZIP](/assets/core/downloads/agents-doc-demo.zip): the application source matching the commit above, without runtime data or dependencies.
