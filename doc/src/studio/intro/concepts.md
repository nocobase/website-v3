---
title: Core concepts
description: The people and agents in Studio, issues, the delivery process, runtimes, and what the team builds up, and how they relate.
---

## Overview

<figure class="map" aria-label="Studio's core concepts and how they relate">
<div class="row"><div class="box human"><b>People</b><span>Issue owners, tech leads, and admins: make requests, answer questions, accept the work</span></div></div>
<div class="down">Two ways to follow the work</div>
<div class="row c2"><div class="box"><b>My issues</b><span>Follow by issue, with what is waiting for you first</span></div><div class="box"><b>My sessions</b><span>Follow by session: discuss with an agent, create issues, and see how those issues are going</span></div></div>
<div class="down">Each piece of work is an issue</div>
<div class="row"><div class="box brand"><b>Issue</b><span>Belongs to a project, its code lives in a Git repository, and it follows one process: build → check → review → accept</span></div></div>
<div class="down">The coordinator agent arranges the work</div>
<div class="row c2"><div class="box agent"><b>Agent team</b><span>The coordinator agent breaks the work into steps, and worker agents build, test, and review</span></div><div class="box"><b>Runtimes</b><span>Team servers and members' computers, where the agent team runs</span></div></div>
<div class="down">Read while working, write back what is learned</div>
<div class="row"><div class="box"><b>What the team builds up</b><span>Skills (how to do things) · knowledge base (what people write) · project memory (what agents note down)</span></div></div>
</figure>

Each issue has one **issue owner** and is completed by the **agent team**: the **coordinator agent** arranges the work, and **worker agents** do each step on a **runtime**. You follow issues in **My issues**, and discuss with agents and create issues in **My sessions**.

## People and agents

Studio has two kinds of roles: people make decisions, and agents do the work. Anything with "agent" in its name is AI, and no role name for a person contains "agent".

::figure roles | All the roles of people and agents

**There is only one kind of agent**: a coding tool plus a model, such as "Claude · Opus 5.5" or "Codex · GPT-5.5". What differs is where it works and who it works for:

- The **agent team** is the agents the team shares. They complete issues and run on runtimes. The **coordinator agent** is a role built into Studio, run by an agent the admin chooses, and it does the arranging. **Worker agents** do each step.
- **My agent** is the coding tool on your own computer. Once connected to Studio, it helps you discuss requests, read code, and split requests into issues in a session. It does not pick up the team's issues, and the issues it creates are completed by the agent team.

So agents have just three roles: the coordinator agent, worker agents, and my agent.

## Issues

An issue is the basic unit of delivered work in Studio. Every issue has:

- **An owner** (the issue owner): the person responsible for the result, by default whoever created the issue. Agents go to the owner when a decision is needed, and hand the work to the owner for acceptance when it is done.
- **An executor**: almost always the coordinator agent. When an issue starts, its executor is set to the coordinator agent automatically, and the coordinator arranges for worker agents to do the work. A few issues are executed by a member.
- **A project, priority, labels, and dates.** Priority affects queueing: runtimes pick up the work of urgent issues first.
- **Sub-issues and prerequisites**: an issue whose prerequisites are not done does not start, and it is woken automatically once they are done.

Every issue is in one of six fixed statuses:

<div class="states" aria-label="Issue statuses"><span class="st-pill"><span class="si backlog"></span>Backlog</span><span class="arrow">→</span><span class="st-pill"><span class="si progress"></span>In progress</span><span class="arrow">⇄</span><span class="st-pill"><span class="si blocked"></span>Blocked</span><span class="arrow">·</span><span class="st-pill"><span class="si review"></span>In review</span><span class="arrow">→</span><span class="st-pill"><span class="si done"></span>Done</span><span class="st-pill"><span class="si cancel"></span>Cancelled</span></div>

| Status | Meaning |
| --- | --- |
| Backlog | Not started, and agents leave it alone. Select **Start** on the issue page to move it to In progress. |
| In progress | The coordinator agent is arranging the work and worker agents are doing it. |
| Blocked | Waiting for the issue owner to decide something. |
| In review | Delivered, and waiting for the issue owner to accept it. |
| Done | Accepted. The issue becomes Done automatically once all the PRs linked to it are merged. |
| Cancelled | Will not be done. |

People can move an issue to any status. The coordinator agent moves issues only among In progress, Blocked, and In review, and worker agents do not change statuses.

## The delivery process

Every issue handed to agents follows the same process. A step starts only after the gate before it is passed:

| Step | Who does it | What counts as passing |
| --- | --- | --- |
| Arrange | Coordinator agent | When the change involves data structures, migrations, concurrency, or permissions, or the issue does not say how to do it, a plan is written first |
| Build | Worker agent | Builds on a separate branch, writes tests for the acceptance scenarios, and opens a PR |
| Check | The repository's CI | All the checks your team defines (code style, types, tests, build, and so on) pass. When one fails, an agent fixes it |
| Review | A worker agent from another vendor | The review passes. The model that wrote the code does not review its own code |
| Accept | Issue owner | Reads the delivery report and the changes, then merges the PR, or sends it back for changes |
| Release | <span class="tag wip">Module in development</span> | To be added as the module matures |

These rules are written in the coordinator agent's **Allocation principles**. A few of them: only one step changes code at a time, while reviews and investigations run in parallel in read-only mode. If the same step fails twice, it goes to the next suitable agent, and if it fails again the issue moves to Blocked to ask the issue owner. To stop agents from triggering each other back and forth, the runs triggered by agent comments on each issue are capped within 24 hours (20 by default), and past the cap the issue owner decides whether to continue.

## Two ways to follow the work: issues and sessions

::figure my-tasks-list+sessions-list pair | Left: My issues follows by issue. Right: My sessions follows by session

| | My issues | My sessions |
| --- | --- | --- |
| The unit | An issue | A session |
| What is in it | The issues you own, execute, or follow, grouped by whose turn it is | Your discussion with an agent, the issues created from the session, and how those issues are going |
| Good for | Handling what is waiting for you each day: acceptance and answering questions | Talking an idea through before it takes shape, then following the issues it was split into in one place |

In a session you can talk to one of two things:

- **My agent**: runs on your computer and can read your local code, which suits discussing requests against the code and splitting them into issues. You need to connect your computer first.
- **An agent in the agent team**: runs on a runtime and does not need your computer to be connected. It suits asking questions, looking things up, and splitting work into issues.

Both kinds of sessions are listed in **My sessions**, and only you can see them. Whichever you talk to, the agent in the session works in Studio with your identity and permissions, for example creating issues and posting comments.

## How the agent team is formed

You do not create the agents in the agent team by hand. They come from **runtimes**:

1. An admin adds a runtime, which is a machine running `nocobase-runner`: a team server, a virtual machine, or a member's own computer.
2. The runtime reports the coding tools that are installed and signed in, and the models available. Each "coding tool · model" combination appears automatically in **Agent team › Agents** with the status To enable.
3. After an admin writes what it is **Good at** and enables it, it becomes a worker agent. What an agent is good at is the only thing the coordinator agent uses to hand out work.
4. The admin then picks a **First choice** and a **Fallback** for the coordinator agent from the enabled agents, and that agent takes the coordinator role.

There are two kinds of runtime:

| | Team runtime | Personal runtime |
| --- | --- | --- |
| Whose work it runs | The whole team's | Only work its owner starts |
| Good for | Team servers that are online all day | Members' computers, using their own subscriptions and compute |

A member's computer can serve two purposes at once: registered as a personal runtime, it gives the agent team compute and executes your own issues; connected as **My agent**, it talks to you directly in sessions. The two are set up separately and do not affect each other.

- **Max concurrent runs** decides how many runs one runtime takes at once. The more machines you have, the more issues can move in parallel.
- Each issue has its own fixed working directory on the runtime. Reviews and investigations use a separate read-only copy, so they can run at the same time as the build.
- When a runtime goes offline, its work goes back to the queue and another runtime picks it up.

> [!WARNING] A runtime is not a security boundary
> Agents work on the runtime as the system user that runs `nocobase-runner`, and can read and write everything that user can access. Run it as a dedicated system user, in a container, or in a virtual machine.

## Projects and code repositories

A project keeps related issues and code together. The project's **working directory** says where the code is:

| Working directory | Description |
| --- | --- |
| New repository | Created on GitHub or GitLab. It can be initialized from the **NocoBase app default template** to get an app built on Core. |
| Existing repository | A repository your team already has. Issues run on its branches and come with PRs. |
| Directory on a runner | A directory on a runtime. It does not use Git, so there are no branches or PRs. |
| No code yet | Create an empty project now and add code later. |

- The first issue of a new project is "Initialize project", and every other issue in the project waits for it to finish.
- Studio reaches repositories through the **Git connection** an admin adds. When a member connects their own Git account, the PRs agents open for them and the merges they make in Studio are done as them.
- An agent's branch is named `agent/<issue number>` by default, and a PR on that branch is linked to the issue automatically. Agents cannot merge PRs.

> [!NOTE] Set up branch protection on the code hosting platform
> Studio does not protect branches for you. Turn on protection rules for the default branch on GitHub or GitLab.

## What the team builds up: skills, knowledge base, project memory

Skills, the knowledge base, and project memory keep the team's methods and business understanding inside the team. Agents read them before they work, so a new person or agent can pick up where the last one left off, and a new request does not need its background explained again.

| | What it holds | Who writes it | Where it lives |
| --- | --- | --- | --- |
| Skills | How to do things: development standards, review points, testing steps | NocoBase development best practices are built in and updated with Core | **Agent team › Skills** |
| Knowledge base | Business rules, product notes, technical conventions, decision records | People write and upload it, and agents only read it | **Development › Knowledge** |
| Project memory | What agents learn while working | Agents write it and read it themselves | `.nb-studio/memory/` in the code repository |

**Project memory** follows the same idea as Claude Code's automatic memory. When a person corrects or confirms something, when an agent hits a pitfall, when a decision has a reason the code does not show, or when there is a pointer to external material, the agent notes it down as a file in the code repository, committed, reviewed, and merged together with the issue's PR. Before the next job, the agent reads these notes first. When a note and the code disagree, the code wins and the note is corrected. Project memory is written for agents, so people do not need to read or maintain it.

## Permissions

A member's role decides what they can do in Studio. An agent acts on behalf of the person who started the work, with no more permission than that person has. For example, the coordinator agent and every step it arranges act on behalf of the issue owner. Accepting, merging, and managing members can only be done by people.
