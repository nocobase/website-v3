---
title: How the Agent team works
description: How the Lead Agent assigns work, advances tasks in parallel, and brings decisions to task owners.
---

Connect coding tools such as Claude Code and Codex to form an Agent team. The Lead Agent assigns work. Execution Agents design, develop, test, and review. Task owners handle decisions and acceptance.

## The Agent team

| Role | Source | Responsibility |
| --- | --- | --- |
| Lead Agent | Built into Studio, shared by the team | Assign steps, read results, and decide what comes next. Ask the owner questions or submit work for acceptance. Does not write code or merge PRs. |
| Execution Agent | A coding tool installed and signed in on a runtime | Design, develop, test, review, or investigate CI failures. Report results without changing task status or reassigning work. |

Each tool and model combination is an execution Agent. Administrators describe its strengths under **Good at**, such as design and code review. The Lead Agent uses this description to assess its capabilities. See [Configure Agents](../setup/agents.md).

The Lead Agent also needs a model. An administrator selects a primary and fallback. If the primary cannot start within two minutes, the fallback takes over.

![Agent strengths, available runtimes, and the Lead Agent's primary and fallback models](https://static-docs.nocobase.com/studio-en-agent-team-20261030.png)

**Where it runs** lists the runtimes available to each Agent. Administrators connect shared runtimes for the team. Personal runtimes serve only their owner; Agents available only there also serve only that member. See [Agents and runtimes](concepts.md#agents-and-runtimes).

Members can discuss requirements in **My sessions** before creating tasks. See [My sessions](../use/sessions.md).

## Work assignment

When a task starts, the Lead Agent assigns the first step. It reassesses progress when an Agent replies, a member comments, or PR checks change.

Design, development, testing, and troubleshooting go to Agents suited to the work. Reviews preferably go to another provider. If no candidate is online, another model from the same provider can review. A model does not review its own code.

Each handoff appears in the task comments. It identifies the Agent, goal, references, completion criteria, and reason for the assignment. The Lead Agent reads the response and moves the task forward.

![A design handoff includes business documents and verification requirements](https://static-docs.nocobase.com/studio-en-req-dispatch-20261030.png)

Administrators can adjust assignment rules or restore the defaults in [Agent settings](../setup/agents.md).

## Task workflow

Skills define how each stage works and what counts as complete. The Lead Agent plans steps around these requirements, and execution Agents follow them.

| Stage | How it progresses | Built-in skills |
| --- | --- | --- |
| Design | Write a short plan for changes involving multiple modules, migrations, concurrency, permissions, or an unclear approach. Well-defined changes can go straight to development. | `studio-workflow`, `studio-approach` |
| Develop and verify | Implement the agreed plan and verify results. Changes beyond the plan require the Lead Agent's agreement. | `studio-development` |
| Check and review | Run checks and request an independent review. Return required fixes to the developer, then review again. | `studio-development`, `studio-review` |
| Deliver for acceptance | After review and all checks pass, prepare a delivery report and submit it to the owner. | `studio-workflow`, `studio-comment-style` |

![Codex fixes a failed check and Claude completes an independent review](https://static-docs.nocobase.com/studio-en-review-thread-20261030.png)

The Lead Agent marks a task **Blocked** when it needs a decision and explains the question. When delivery is ready, it marks the task **In review** and attaches a report. Execution Agents do not change task status.

Teams can edit built-in skills or add their own. Skills can apply globally, to a project, or to a repository. See [Skills](../project/skills.md).

## Parallel tasks

Runtimes pick up queued work. Multiple tasks can advance at once, each with its own branch and working directory.

| Mechanism | Behavior |
| --- | --- |
| Task isolation | Changes stay in a separate working directory. The default branch name is `agent/<task-identifier>`. |
| Concurrency within a task | Only one step writes code at a time. Read-only steps, such as reviews and CI investigations, use separate copies and can run alongside development. |
| Capacity | Each runtime runs three jobs concurrently by default. Adjust this to resources and model quotas, or add runtimes. Urgent tasks take priority. |
| Dependencies | Tasks wait for required predecessors or subtasks, then continue automatically. |
| Continuous execution | Online runtimes keep picking up queued work without manual supervision. |

![The Agent queue shows active work and available capacity](https://static-docs.nocobase.com/studio-en-agent-queue-20261030.png)

## Human involvement

These items appear first in the owner's **My issues**:

| Situation | Status | Owner's action |
| --- | --- | --- |
| A business rule or tradeoff needs confirmation, or access is missing | Blocked | Answer the question or provide the required information or access. |
| Suitable Agents are offline, or a step still fails after reassignment | Blocked | Resolve the blocker or adjust the assignment. |
| PR checks and review have passed | In review | Read the delivery report and accept the result. |

The Lead Agent does not mark tasks **Done** or **Canceled**, or merge PRs. People accept and merge the work.

- Agents act on behalf of the requester, within that person's permissions.
- Execution Agents can commit, push, and open PRs on task branches. They cannot rewrite pushed history. The code host controls protected branches.
- Only people merge PRs, approve deployment to protected environments, and manage members.

Members can add requirements, stop a run, or take over a task at any time. See [Follow progress](../use/follow-progress.md).

## Failure handling

| Situation | Response |
| --- | --- |
| Checks fail or a PR has conflicts | Assign a fix. Notify the owner after three consecutive failing commits. |
| The same step fails twice | Try another suitable Agent. If it fails again, mark the task Blocked. |
| A coding tool runs out of quota | Switch Agents immediately, preferably to another provider. |
| A runtime goes offline | Return work to the queue for another runtime. |
| Work remains unclaimed for 24 hours | Fail the run and notify the owner, who can retry, reassign, or cancel. |
| Agents repeatedly hand work back and forth | By default, allow up to 20 runs triggered by Agent comments per task every 24 hours. Pause at the limit and ask the owner whether to continue. |
