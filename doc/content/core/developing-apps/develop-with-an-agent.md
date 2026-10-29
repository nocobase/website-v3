---
title: Develop with an agent
description: Describe requirements in business terms, let an agent implement and test them using project guidance, and accept the work based on real results.
---

When developing with an agent, the responsibilities are clear: **you** explain what is needed, the business rules and completion criteria, and make business decisions; **the agent** follows project guidance to find relevant code, implement and test the changes, and report results accurately. You do not need to identify internal APIs before describing a requirement.

This guide assumes you already have an application. Otherwise, start with [Create an app](../getting-started/create-app.md). Here, “agent” means a coding agent that helps develop the application. Business agents that act within application permissions are a separate capability; see [Agents](../using-plugins/agents-and-knowledge/agents.md).

## A development cycle

1. Commit the current code so you can inspect this cycle's changes separately.
2. [Describe the requirement](#describe-the-requirement): the outcome, rules, boundaries and completion criteria.
3. The agent implements and tests it, then reports what changed and what was verified.
4. [Check the result](#check-the-result): try it in a browser and review the code changes.
5. If something is wrong, provide reproduction steps and ask the agent to fix it. Otherwise, commit.
6. [Record new conventions in project rules](#keep-project-conventions) so later sessions can follow them.

## Start a session

Start the agent in the application root. Coding tools read `AGENTS.md` at session startup and use it to find project rules and skills. The template's `CLAUDE.md` references the same file for Claude Code.

> [!NOTE]
> If you just created the application in the same session, some coding tools need a new session to load its skills. If the agent cannot find `nocobase-app-development`, start a new session in the application directory.

When working in a project for the first time or taking over someone else's project, you can start with:

```text
Continue development in the current application. Read AGENTS.md first and consult the skills relevant to this task.
Inspect the existing implementation and uncommitted changes, preserving existing features and my edits.
Use existing plugins or components when they meet the requirement.
```

You do not need to repeat this for every small change.

**State what is authorized.** Code changes and local development database work can usually be delegated freely. For deployment, changes to secrets in `config.yml`, database resets or rollbacks, and real accounts, specify what is allowed and in which environment. Commands such as `db reset` and `db rollback` refuse to run in a non-interactive terminal without `--force`. In that situation, the agent should ask you rather than add `--force` itself.

**Decide where the application runs.** Run `pnpm dev` in your own terminal or ask the agent to start it. Processes started by the agent stop when the session ends. Open the full `Local:` URL printed by `pnpm dev`, including a trailing path such as `/main/`.

## Describe the requirement

A requirement that an agent can act on usually answers five questions:

| What to explain | Example |
| --- | --- |
| Who uses it, and where | Team members view and edit tasks in the task list |
| Desired outcome | A new task can be assigned to one active user or left unassigned |
| Rules and boundaries | Only active existing users are eligible; preserve old tasks and existing permissions |
| Failure behavior | If the assignee has been disabled, preserve the title and ask for another selection |
| Completion criteria | The assignee persists after refresh; both the page and API reject unauthorized operations |

State unresolved business decisions explicitly, such as “We have not decided whether old tasks should receive an assignee.” Do not make the agent guess a default. Let it use project guidance to choose file locations, components and internal APIs.

### Example: add task assignees

This request applies to an application that already lists and creates tasks but does not yet support assignees:

```text
Add assignees to the existing task application.

When creating a task, let users select one active existing user or leave it unassigned.
Show the assignee in the task list, or “Unassigned” when there is none.
Keep old tasks, do not assign them automatically, and do not change anyone's roles or permissions.

If the selected user is disabled before saving, preserve the title and ask me to choose again.
After a successful save, refreshing the page must still show the correct assignee.
Follow the current application's interface style and provide English and Chinese copy.

Follow project guidance and use isolated test data to verify creation, unassigned tasks, disabled users and denied access.
Do not add reassignment, notifications or “My tasks” in this cycle.
Tell me what changed, what was verified and what remains unverified.
```

The request describes behavior a user understands. Let the agent follow application conventions for fields, relationships, permission policies and selectors. Supply existing API contracts or designs when available; you do not need to copy implementation details into the request.

### Break down larger requirements

“Build a complete project management system” leaves many business decisions unresolved. Complete a small, usable and verifiable result first, then extend it.

For a change spanning several areas, you can ask for a plan before implementation:

```text
Do not change code yet. Read the relevant implementation and list what needs to change, which business decisions I need to make, and how you will verify the result.
```

For example, adding projects to tasks can proceed in three steps:

1. **Data:** define the project/task relationship, preserve old tasks and add relationship constraints, verified by database tests.
2. **API:** query and create projects and change a task's project, checking input and permissions on both sides.
3. **Pages:** add a project list, creation dialog and task project selector; verify loading, saving, failure feedback and keyboard use.

State the scope and completion criteria for each step. Completing the data step does not let users manage projects through the UI; passing migration tests is not the same as delivering that feature. Small features can be completed in one cycle without a separate request for each file.

## Check the result

### Try it first

Act as a user in the browser: create, edit, refresh and check again, then use an ordinary account to verify permissions. A successful screenshot is insufficient: hiding a button does not prove the API rejects unauthorized requests, and a success message does not prove data was saved.

### Review the changes

Use `git status` and `git diff`, or ask the agent to list changed files and explain why. Focus on:

- **Old data and existing features:** are they preserved? Are schema changes new migrations rather than edits to merged migrations?
- **Permissions:** are page access, business actions and data access handled separately? Were permissions granted to all users just to make the feature work?
- **Reuse:** are existing plugins and components used instead of rebuilding permissions or notifications? Did unrelated layouts, themes or features change?
- **Interaction details:** are field errors next to their inputs? Does failed saving preserve entered values?
- **APIs and copy:** do new APIs appear in the API document under the application base path, such as `/main/api/swagger`? Is English and Chinese copy complete?

### Separate verification results

Ask the agent to report automated checks and actual usage separately, with the scope each check covers:

| Layer | Checks | Common commands |
| --- | --- | --- |
| Static checks | Formatting, types and project conventions | `pnpm lint`, `pnpm typecheck` |
| Database and API tests | Persistence, migrations, validation, authorization and data state after failures, using isolated data | `pnpm test --project node` |
| Page and component tests | Forms, loading states, feedback and user input | `pnpm test --project client` |
| Browser use | Complete operations in the running app, refresh to confirm, and verify permissions with ordinary accounts | `pnpm test:e2e`, or manual use |

Checks need to cover the change and affected behavior. `pnpm check` runs all checks and the build; it is unnecessary for every small edit. A successful exit is not proof that verification ran: the default template also exits successfully when no tests are found. Read the report for actual files, case counts and skipped tests.

Use the real application, database and permission services whenever they can verify a rule. Use mocks only for boundaries that cannot be exercised directly, such as external services or browser-dependent behavior in an environment without a browser, and explain what was mocked. Do not mock the business behavior under test. Use isolated data; never clear application business data just to pass tests. See [Testing and acceptance](testing-and-acceptance.md) for techniques and [Build your first app](../tutorials/build-your-first-app.md) for a complete task example.

If the agent lacks an environment or account to verify a step, it should explain what is missing and how far it got. “The code looks correct” cannot replace an actual result.

### Report problems clearly

Give reproduction steps and expected behavior instead of just saying something is wrong:

```text
When signed in as a read-only member, the task list hides the New task button, but a direct create request still succeeds.
The member should be unable to create tasks through either the page or the API.
Check server authorization, fix it, verify with the same ordinary account, and confirm administrators can still create tasks.
```

## Keep project conventions

A new session starts from what is written in the repository; agreements made only in conversation do not persist into the next session. Record lasting conventions in the project:

| Location | Contents | Maintenance |
| --- | --- | --- |
| `AGENTS.md` | Rules for all tasks and an index of other rule files | Keep it concise: the entire file loads each session. Template tests enforce a 32 KB limit and check its links |
| `.agents/rules/` | Application-specific conventions. The template includes workspace, component, page-shell, build and deployment rules | Update rules as conventions change and register them in the `AGENTS.md` index |
| `.agents/skills/` | Skills supplied by dependencies | Automatically synchronized during dependency installation; do not edit directly |

Write rules when a previously corrected problem recurs, or when the team makes a decision that applies across tasks, such as a business-date timezone, state transition order or permission boundary. Ask the agent to record it:

```text
Record this convention in .agents/rules/business.md: business dates use Asia/Shanghai,
and tasks can only move from To do → In progress → Done.
Add the file to the AGENTS.md index and explain when it should be read.
```

The index gains an entry such as:

```markdown
| [.agents/rules/business.md](.agents/rules/business.md) | When working on business dates, task states or permission boundaries |
```

Commit rule files alongside code so later sessions and teammates can follow them.

## Where skills come from

Skills are development instructions shipped with packages, explaining how to work with the installed version. Common application skills include:

| Skill | Purpose |
| --- | --- |
| `nocobase-app-development` | Entry point for everyday development, linking to pages, APIs, migrations, testing and other references by task |
| `nocobase-app-plugin-development` | Develop plugins inside an application |
| `nocobase-app-upgrade` | Upgrade NocoBase and reconcile template changes; see [Upgrade NocoBase Core](upgrade-nocobase-core.md) |
| `nocobase-deployment` | Build a deployment archive and deploy to a server |
| Plugin-provided skills | For example, `nocobase-app-plugin-mail`. Read a plugin's skill before using its capabilities to avoid rebuilding what it already provides |

`pnpm install` synchronizes skills automatically, keeping them aligned with installed packages. If scripts were skipped or `.agents/skills/` is missing or stale, synchronize manually from the application root:

```bash
pnpm nocobase skills sync
```

Add `--dry-run` to preview the synchronization plan. See [CLI reference](../reference/cli.md#plugins-and-skills) for more options. If a plugin's skill is still missing, confirm the plugin is installed, registered and actually supplies one.

Files in `.agents/skills/` are generated and overwritten on the next synchronization. Put application-specific additions in `.agents/rules/`.

## Deliver and continue

Before finishing a cycle, ask the agent to summarize changes, checks and their coverage, unverified items, and how to try the result. Once accepted, commit the code and any new rule files.

You can start a new session for the next cycle. The code and rules are in the repository; explain what is complete and what to add or adjust next.

Committing code, releasing a version and deploying to an environment are separate actions. Passing local tests does not mean the feature is live. For deployment, see [Choose a deployment method](../deployment/choose-a-deployment-method.md).

The same requirements, review and acceptance methods apply when writing code yourself. Individual topics provide code and steps under “Without an agent”.
