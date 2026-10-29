---
title: Develop with an Agent
description: Use the application's AGENTS.md and Skills to describe requirements in business terms, review the implementation and verify real results.
---

When you develop with an Agent, you explain three things: what users should be able to do, which business constraints apply, and how to tell when the work is done. The Agent uses the project's conventions to find the relevant code, implement the change and verify the result. You do not need to know which internal API to call before you can describe the requirement clearly.

This guide assumes you already have an application; if not, start with [Create an app](../getting-started/create-app.md). Here, an Agent means a coding Agent that helps you write the application's code, which is different from the Agents that business users work with inside an application.

## Start in your application project

Start the Agent in the application root so it can read the source, `package.json`, `AGENTS.md` and `.agents/`. When continuing an existing project, name the working directory and the existing features so it does not create another application.

You can start like this:

```text
Please continue development in the current application. Read its AGENTS.md and the Skills relevant to this task first.
Understand the existing implementation and uncommitted changes. Preserve existing features and my changes.
Prefer existing plugins and components when they meet the requirement.
```

This sets up the working context; you do not need to repeat all of it for every small edit. For deployment, database changes or account operations, also name the target environment and what the Agent is allowed to do.

## Project guidance and development rules

The application keeps its development conventions in the project. The Agent should read the conventions for the installed version, not rules from another version or project.

| Location | Content | How to maintain it |
| --- | --- | --- |
| `AGENTS.md` | Entry rules for developing the application, and an index of further reading | Maintain it with the application and keep it short |
| `.agents/rules/` | Structure, business conventions and customization notes specific to this application | Update it when the application's conventions change, and link it from `AGENTS.md` |
| `.agents/skills/` | Development, upgrade, deployment and capability guidance from packages and plugins | Synchronized from the installed dependencies; do not edit the copies directly |

Write conventions that hold across tasks into `.agents/rules/` and link them from `AGENTS.md`. For example, once the team has agreed on the time zone for business dates, the status transition rules or permission boundaries, record them in `.agents/rules/business.md` and add this to the entry file:

```markdown
## Project rules

- [Business rules](.agents/rules/business.md): business dates, state transitions and permission conventions.
```

**Application rules live in the application; shared rules are maintained with their packages.** Keep agreed conventions with the code, so the next session or another developer can follow them; guidance provided by dependencies is maintained in its source package and synchronized into the application.

## Use and synchronize Skills

Day-to-day feature development starts from `.agents/skills/nocobase-app-development/SKILL.md`, reading the references relevant to the task; when you use a plugin's capabilities, consult that plugin's Skill as well. Upgrading Core and deploying the application each have their own guidance; pick the one for the current task.

Skills come from the dependencies currently installed. After installing or upgrading a relevant package, make sure its guidance has been synchronized, so the Agent reads instructions that match the dependency versions. The current template synchronizes automatically in `postinstall`; if installation scripts were skipped or the synchronized directory is missing, run this in the application root:

```bash
pnpm nocobase skills sync
```

To preview the synchronization plan first, run `pnpm nocobase skills sync --dry-run`. For more options, see [Plugins and Skills](../reference/cli.md#plugins-and-skills) in the command-line reference.

After synchronizing, check the command output and the relevant `SKILL.md`, and ask the Agent to reread the guidance for the task. If a plugin's Skill is still missing, first confirm that the plugin is installed, registered as required, and actually provides a Skill. Synchronized copies are updated together with their source packages; application-specific additions stay in `.agents/rules/`.

## Describe and break down requirements

A request that can be acted on usually answers five questions:

| What to explain | Example |
| --- | --- |
| Who uses it, and where | Team members view and change tasks in the task list |
| What they want to achieve | When creating a task, they can pick one assignee or leave it unassigned |
| Rules and boundaries | Only active existing users can be picked; existing tasks and permissions stay unchanged |
| What happens on failure | If the assignee has been deactivated, keep the task title and ask for another choice |
| How to tell it is done | The assignee is still shown after a refresh; without permission, both the page and the API refuse the action |

Say outright which business decisions are still open, for example "we have not decided whether existing tasks need an assignee", instead of letting the Agent guess a default user. File locations, component names and internal methods, on the other hand, it can find in the project guidance.

### A request you can use as is

The following request fits an application that already has a task list and task creation, but no assignees yet:

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

Everything in this request is behavior a user can understand; the specific fields, relations, permission policies and picker usage are left to the Agent and the application's conventions. If there is an API contract or an existing design that must be followed, provide that document as well, rather than copying every implementation detail into the prompt.

### Split larger requirements into verifiable changes

"Build a complete project management system" contains too many undecided business questions. It works better to finish a small, self-contained result first, then extend to the next capability.

To add project assignments to tasks, for example, you can proceed in this order:

1. **Data**: the relation between projects and tasks, how existing tasks are kept, and the association constraints, verified first with database tests.
2. **Business APIs**: listing and creating projects and changing a task's project, verifying the input and the data permissions on both sides.
3. **Page interactions**: the project list, the creation dialog and the task's project picker, verifying loading, saving, failures and keyboard use.

State the current scope and completion criteria at every step. When only the data layer is done, say clearly that the pages cannot use it yet; "the migration tests pass" must not be reported as "users can now manage projects". If you just want a small feature done quickly, these parts can also be delivered at once; you do not need a separate request for each file.

## Review the implementation and verify results

Check the observable behavior first, then whether the change follows the project conventions. Ask the Agent for a short description of the change that points to the relevant files, focusing on these questions:

- Are existing data and features preserved? Were schema changes made through new migrations?
- Are page access, business actions and data scopes handled separately? Were any permissions granted by accident?
- Were existing plugins and components used? Did layouts, themes or other features change beyond the requirement?
- Do field errors appear next to the right inputs? Is the input kept after a failed save?
- Do new endpoints appear in the application's API documentation? Is the text complete in both English and Chinese?

Do not decide a feature is done from one successful screenshot. A hidden button does not prove the endpoint rejects unauthorized requests, and a success message does not prove the data was really saved to the database.

### Verify real results

Ask the Agent to report the results of automated checks separately from the results of actually using the application. Verification should cover this change and the existing behavior it affects; do not treat unrelated full-suite checks as a fixed step after every edit.

| Verification layer | What it confirms |
| --- | --- |
| Static checks | The changed code follows the project's formatting, types and conventions |
| Database and API tests | With isolated data: persistence, migrations, validation, authorization and the data state after failures |
| Page and component tests | Forms, loading, feedback and user input behave correctly |
| Browser interaction | Actions work in the real application, survive a refresh, and permissions hold for ordinary users |

Whenever a business rule can be verified with the real application, database and permission services, verify it that way. Use substitutes only at necessary boundaries such as external transport or a test environment without browser capabilities, and say what was replaced; do not mock the business behavior under test.

Browser verification should use the complete entry URL the application actually prints, and dedicated test accounts. Database tests should use isolated data and must never clear the current application's business data just to make tests pass. For a complete task example, see [Build your first app](../tutorials/build-your-first-app-agent-first.md).

When you find a problem, give the reproduction steps and the expected result instead of just saying "it's wrong":

```text
After signing in as a read-only member, the task list hides New task, but a direct creation request still succeeds.
A read-only member should be unable to create tasks through either the page or the API.
Please check server authorization, fix it, and verify using that same ordinary account. Confirm that an administrator can still create tasks.
```

If the Agent lacks the environment or account needed to verify a step, it should say what is missing and how far verification got; "the code looks fine" is not a substitute for actual verification results.

## Deliver and keep iterating

Every change should end with code that can be reviewed and a record of verification. Ask the Agent to briefly say what changed, which checks passed, what is unverified, and how to start or view the result. New application-specific conventions go into `.agents/rules/`, and tests are maintained together with the business code.

For the next iteration, say which features are already done and what this round adds or changes. Carry forward the existing business rules and acceptance results, and add verification only for what changes this time; when you find a problem, give the Agent the reproduction steps together with the expected behavior.

Committing code, publishing a version and deploying to an environment are three different actions; follow what was agreed for the task. Passing local tests does not mean the application is deployed. When you are ready to go live, continue with [Choose a deployment method](../deployment/choose-a-deployment-method.md).

If you choose to develop manually, the same data, API, page and acceptance conventions still apply. The "Without an Agent" sections of each guide provide the corresponding code and steps.
