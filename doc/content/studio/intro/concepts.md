---
title: Core concepts
description: Projects, tasks, sessions, Agents, runtimes, shared knowledge, and the link between code changes and releases.
---

Studio organizes tasks and code by project. People make decisions and accept results. Agents develop the application, using shared skills, business documents, and project memory.

<figure class="map concept-map" aria-label="Projects organize tasks and code, Agents and runtimes execute work, and shared knowledge provides context">
<div class="row"><div class="box brand"><b>Project</b><span>Related tasks, repositories, and team knowledge</span></div></div>
<div class="down">Tasks and code belong to the same project</div>
<div class="row c2"><div class="box human"><b>Task</b><span>Requirements, owner, progress, and delivery</span></div><div class="box"><b>Repository</b><span>Code, pull requests, and versions</span></div></div>
<div class="down">The Agent team executes tasks and submits changes</div>
<div class="row c2"><div class="box agent"><b>Agent</b><span>The Lead Agent assigns; execution Agents deliver</span></div><div class="box agent"><b>Runtime</b><span>Coding tools, models, and execution resources</span></div></div>
<div class="row"><div class="box knowledge"><b>Skills · Knowledge base · Project memory</b><span>Development standards, business documents, and project experience</span></div></div>
</figure>

## Projects and repositories

A **project** groups tasks, members, repositories, and documents. The project lead manages settings, shared knowledge, and releases.

A **repository** stores application code. A project can have multiple repositories. New repositories are initialized with NocoBase Core by default; existing repositories can also be connected.

![Supplier Management summarizes task progress and provides access to knowledge, members, and releases](https://static-docs.nocobase.com/studio-en-project-overview-20261030.png)

See [Create your first project](../setup/new-project.md) and [Project settings](../project/settings.md).

## Tasks and owners

A **task** records requirements, acceptance criteria, discussions, and delivery results—for example, Supplier scoring and tiers. Subtasks divide the work; predecessor tasks express dependencies.

Each task has an **owner** who answers questions, confirms tradeoffs, and accepts the result. The Lead Agent organizes execution. Design, development, and review results stay with the task.

Tasks have six states. Common transitions are:

<div class="states" aria-label="Backlog to In progress, In progress and In review can repeat, then Done"><span class="st-pill"><span class="si backlog"></span>Backlog</span><span class="arrow">→</span><span class="st-pill"><span class="si progress"></span>In progress</span><span class="arrow">⇄</span><span class="st-pill"><span class="si review"></span>In review</span><span class="arrow">→</span><span class="st-pill"><span class="si done"></span>Done</span></div>
<div class="states" aria-label="In progress and Blocked can repeat; unfinished tasks can be canceled"><span class="st-pill"><span class="si progress"></span>In progress</span><span class="arrow">⇄</span><span class="st-pill"><span class="si blocked"></span>Blocked</span><span class="arrow">·</span><span>Unfinished tasks</span><span class="arrow">→</span><span class="st-pill"><span class="si cancel"></span>Canceled</span></div>

**Blocked** tasks need a decision. **In review** tasks await acceptance. These items appear first in **My issues**.

![An owner reads the delivery report and accepts a task in My issues](https://static-docs.nocobase.com/studio-en-req-accept-20261030.png)

Task ownership is a responsibility, not a system role. Agents act within the requester's permissions. See [Task states and permissions](../reference/statuses-and-permissions.md).

## Sessions

A **session** is a conversation with an Agent to discuss requirements, create tasks, and follow results. One session can link to several tasks, whose progress returns to the conversation.

Sessions are private to their owner. Tasks are shared according to project permissions.

![An Agent turns confirmed rules into a task, with progress shown alongside the conversation](https://static-docs.nocobase.com/studio-en-req-session-20261030.png)

See [My sessions](../use/sessions.md).

## Agents and runtimes

| Concept | Responsibility |
| --- | --- |
| Lead Agent | Assign steps, read results, ask the owner questions, and submit work for acceptance. |
| Execution Agent | A coding tool and model combination that designs, develops, tests, or reviews. |
| Runtime | Provides the machine, tools, and models that execute Agent work. |

![Agents are configured by their strengths, with primary and fallback models for the Lead Agent](https://static-docs.nocobase.com/studio-en-agent-team-20261030.png)

One runtime can provide several Agents, and the same Agent can run on several machines. Shared runtimes serve the team. Personal runtimes serve only tasks started by their owner.

![Runtimes lists machines, available coding tools, and sharing scope](https://static-docs.nocobase.com/studio-en-shared-runtimes-20261030.png)

Each execution creates a **run record** with its process, result, and usage. A task usually involves several runs.

See [How the Agent team works](agent-team.md) and [Connect a runtime](../setup/shared-runtimes.md).

## Skills, knowledge base, and project memory

| Concept | What it stores | Examples |
| --- | --- | --- |
| [Skills](../project/skills.md) | Development methods and execution requirements | Design steps, review criteria, delivery report format |
| [Knowledge base](../project/knowledge-base.md) | Business documents written or uploaded by the team | Supplier scoring sheet, purchasing policy |
| [Project memory](../project/project-memory.md) | Confirmed rules, experience, and reasons for decisions | All tier C supplier orders require approval, regardless of value |

Skills can apply globally, to a project, or to a repository. Agents maintain project memory, which is reviewed and merged with the task's PR for later work to reuse.

![Project memory preserves confirmed rules and their sources](https://static-docs.nocobase.com/studio-en-project-memory-20261030.png)

## PRs, environments, and versions

A **PR** (pull request) links a task to code changes. Agents submit code and complete checks and review. The owner accepts the result and merges it.

Applications in **preview and test environments** run as Studio child processes to verify changes.

| Environment | Use |
| --- | --- |
| PR preview | Created by CI to verify changes before merging |
| Test environment | Runs merged code to verify combined changes |

For **production**, build an image and deploy it on your own infrastructure. Studio records production versions; it does not deploy production environments.

A **version** represents a release from a repository tag that matches its release line. Studio links the version to its tasks and artifacts.

![Releases links versions and tasks with test and production status](https://static-docs.nocobase.com/studio-en-releases-20261030.png)

After a task is complete, use versions and deployment records to see whether it is live. See [Release overview](../release/overview.md).
