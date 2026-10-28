---
title: Develop with an agent
description: Use the application's AGENTS.md and Skills to describe requirements, review implementation and verify real outcomes.
---

When developing with an agent, explain what users should accomplish, the business constraints and how you will judge completion. The agent uses the project's conventions to locate code, implement changes and verify the result. You do not need to know an internal API before you can describe the requirement.

This guide assumes you already have an application. Otherwise, start with [Create app](../getting-started/create-app.md). Here, an agent means a coding agent that helps develop the application; Agents used by business users inside an application are a separate capability.

## Work in the right project

Start the agent in the application root so it can read the source, `package.json`, `AGENTS.md` and `.agents/`. For an existing project, identify the working directory and current features so it does not create another application.

You can start with:

```text
Please continue development in the current application. Read its AGENTS.md and the Skills relevant to this task first.
Understand the existing implementation and uncommitted changes. Preserve existing features and my changes.
Prefer existing plugins and components when they meet the requirement.
```

This establishes context; you do not need to repeat the entire request for every small edit. For deployment, database changes or account operations, also identify the target environment and permitted scope.

## What AGENTS.md and Skills provide

The application carries its development conventions. An agent should read the guidance for the installed version rather than applying rules from another project or version.

| Location | Content | Maintenance |
| --- | --- | --- |
| `AGENTS.md` | Entry rules and an index of further guidance | Maintain it with the application and keep it short |
| `.agents/rules/` | Application-specific structure, business conventions and customization notes | Update when conventions change and link from `AGENTS.md` |
| `.agents/skills/` | Development, upgrade, deployment and capability guidance supplied by packages and plugins | Synchronize from installed dependencies; do not edit generated copies |

The current template synchronizes Skills in `postinstall`. If installation scripts were skipped or the directory is missing, run this from the application root:

```bash
pnpm nocobase skills sync
```

For feature development, start with `nocobase-app-development` and read the references relevant to the task. Read a plugin's Skill when using its capabilities. Core upgrades and deployment have separate guidance; starting a development environment is not a production deployment procedure.

**Application rules belong in the application; shared rules are maintained with their packages.** For example, record an agreed business time zone in `.agents/rules/`. Do not leave that convention only in a conversation, or edit `.agents/skills/` files that the next synchronization will replace.

## Describe requirements in business terms

An actionable request usually answers five questions:

| What to explain | Example |
| --- | --- |
| Who uses it and where | Team members view and change tasks in the task list |
| Desired outcome | A new task can have one assignee or remain unassigned |
| Rules and boundaries | Choose only active existing users; preserve old tasks and permissions |
| Failure behavior | If the user becomes inactive, preserve the task title and ask for another selection |
| Acceptance result | The assignee remains after refresh; denied users cannot act through either the page or API |

State unresolved business decisions explicitly. “We have not decided whether to assign old tasks” is better than leaving the agent to invent a default user. File locations, component names and internal methods can come from the project guidance.

### A request you can use

This request applies to an application with a task list and creation form, before assignee support has been added:

```text
Please add assignees to the existing task application.

When creating a task, I can choose one active existing user or leave it unassigned.
Show the assignee in the task list, or “Unassigned” when there is none.
Preserve old tasks without assigning them automatically, and do not change anyone's roles or permissions.

If the selected user becomes inactive before saving, retain my task title and ask me to choose again.
After saving and refreshing, the correct assignee should remain visible.
Follow the application's current visual style and provide English and Chinese text.

Implement this using the project's guidance. Use isolated test data to verify creation, unassigned tasks, inactive users and denied access.
Do not add reassignment, notifications or “My tasks” in this step.
Report what changed, what you verified and what remains unverified.
```

This describes behavior a user can understand. Let the agent follow the application's conventions for fields, relations, permission policies and selectors. If a fixed API contract or existing design matters, provide that document as context rather than copying every implementation detail into the prompt.

## Split larger requests into verifiable changes

“Build a complete project management system” leaves too many business questions unanswered. Deliver a small, complete outcome before extending the next capability.

For project assignments on tasks, one possible sequence is:

1. **Data:** define the project relationship, old-task preservation and constraints; verify them with database tests.
2. **Business APIs:** query and create projects and change task assignments; verify input and data permissions on both sides.
3. **Interactions:** add the project list, creation dialog and task project selector; verify loading, saving, failures and keyboard use.

State the scope and completion criteria at each step. If only the data layer is ready, say that the UI cannot use it yet. Passing a migration test does not mean users can manage projects. A small feature can also deliver all these parts together; you do not need a separate request for every file.

## Review the implementation

Check observable behavior first, then conformity with project conventions. Ask for a short change description with relevant file references, covering:

- Whether old data and existing behavior remain intact, with new migrations for schema changes.
- Whether page access, business actions and data scopes are handled separately, without unintended grants.
- Whether existing plugins and components are used, and whether unrelated layouts, themes or features changed.
- Whether field errors appear beside the correct inputs and failed saves preserve input.
- Whether new endpoints appear in the application API document and both languages are covered.

A successful screenshot is not enough. A hidden button does not prove that the endpoint rejects unauthorized calls; a success message does not prove that the database saved the change.

## Verify real outcomes

Ask the agent to distinguish automated checks from actual application interaction. Cover the change and affected existing behavior without treating unrelated full-suite checks as a mandatory step after every edit.

| Verification layer | What it establishes |
| --- | --- |
| Static checks | Changed code follows formatting, types and project conventions |
| Database and endpoint tests | Isolated data verifies persistence, migrations, validation, authorization and state after failure |
| Page and component tests | Forms, loading, feedback and user input behave as expected |
| Browser interaction | Operations work in the running application, survive refresh, and enforce ordinary-user permissions |

Use the real application, database and authorization services for business rules when possible. Use substitutes only at necessary boundaries such as external transport or missing browser capabilities in the test environment, and explain what was replaced. Do not mock the business behavior being verified.

Browser verification should use the application's actual printed entry URL and dedicated test accounts. Database tests should use isolated data; they must not clear current business data just to pass. See [Build your first app](../tutorials/build-your-first-feature.md) for a concrete example.

When reporting a problem, provide the reproduction path and expected result:

```text
After signing in as a read-only member, the task list hides New task, but a direct creation request still succeeds.
A read-only member should be unable to create tasks through either the page or the API.
Please check server authorization, fix it, and verify using that same ordinary account. Confirm that an administrator can still create tasks.
```

If the agent lacks an environment or account to verify a step, it should state what is missing and what has been checked. Code inspection is not a substitute for reporting actual verification results.

## What to leave behind

A completed change should leave reviewable code and verification evidence. Ask for a concise report of changes, passing checks, unverified cases and how to run or view the result. Record new application conventions in `.agents/rules/`, and maintain tests alongside the business code.

Committing code, publishing a version and deploying to an environment are different actions. Follow the scope agreed for the task; passing local tests does not mean the application has been deployed. For production delivery, continue with [Choose a deployment method](../deployment/choose-a-deployment-method.md).

The same data, API, UI and acceptance conventions apply when developing manually. Each topic's Without an agent section supplies the corresponding code and steps.
