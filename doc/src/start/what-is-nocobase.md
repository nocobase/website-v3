---
title: What is NocoBase 3
description: NocoBase is the open-source platform for building, running, and evolving business systems with AI. Agents write the business code, NocoBase provides the foundation and governance, and people set goals and make the decisions.
---

Ask an agent to build a business system, and the first version can be live in a few hours. The hard part comes after: every new feature, every process change, and every upgrade has to keep the system reliable. A business system runs for many years, so being able to keep changing it reliably matters more than how fast the first version shipped.

NocoBase 3 splits the work into three parts for this reason:

<div class="roles">
<div class="col human"><div class="col-h">People make the decisions</div><div class="role"><span>Set goals, make judgment calls, approve key actions, and accept the results.</span></div></div>
<div class="col agent"><div class="col-h">Agents do the work</div><div class="role"><span>Build and test features, handle documents, and move business tasks forward.</span></div></div>
</div>

**NocoBase provides the foundation and the workflow.** Core's data, permissions, approvals, and scheduled jobs run by the same rules every time, and every agent step is recorded. Studio connects and coordinates many agents, so every change is checked, accepted, and approved before it goes live.

## Business code and foundation are separate

NocoBase divides a business system into two parts:

- **Business code** is what differs from one company to the next: the data model, pages, workflows, business rules, and business agents. Agents build it, and the code lives in your own repository.
- **The foundation** is what every system needs: data, permissions, approvals, files, notifications, deployment, and more. NocoBase provides it, and it upgrades independently with each release.

Every change touches only the business code, and the foundation never needs to be rewritten. That is the main source of reliability.

## Product structure

| Product | What it is | Edition |
| --- | --- | --- |
| **Core** | The open-source foundation for building and running business systems. Agents use its capabilities directly, so development can focus on the company's own business | Open source, with enhancements in the commercial editions |
| **Studio** | The workspace where people lead an agent team to build apps. Agents handle the work from request to launch, and people handle only what needs a decision | Professional, Enterprise |
| **Solution** | A line of open-source business apps built on NocoBase, set up with business agents. Use them as they are, or keep customizing them | Open source |
| **Launch** | Hands-on training and project coaching, where the NocoBase team and your team complete a real project together | Choose as needed |

Everything can be self-hosted, and each company chooses its own models and agents.

## Core alone, or with Studio

| | Core alone | With Studio |
| --- | --- | --- |
| Who builds | You open your own coding tool in the app directory and build with an agent | Studio turns your team's agents into one agent team, and a coordinator agent arranges development, testing, and review |
| Fits | One person or a small team, building one or a few apps | A team moving several issues and projects forward at once, where business experts also lead the requirements |
| Testing, deployment, backup | Organized by the team itself, with deployment tools and development guidance from Core | Follows Studio's process: checks, review, acceptance, and approval before release |
| Get started | [Create a Core app](../core/getting-started/create-app.md) | [What is Studio](../studio/intro/what-is-studio.md) |

Apps built either way are the same. Both are built on Core and run on their own after launch, and day-to-day business requests never go through Studio.

## Agents do two kinds of work in NocoBase

- **Building apps**: coding tools such as Claude Code and Codex read the skills that ship with Core and write pages, APIs, tables, and workflows in the app's code repository.
- **Handling business work in the app**: once the app is live, **business agents** sort out documents, triage tickets, and remind people of due items, within their permissions, and hand key actions to a person to approve. They are connected by Core's Agents plugin and use the same roles and permissions as your colleagues.

Both kinds of work follow the same principles: an agent has a clear identity and clear authorization, its work is recorded, its results can be checked, key actions are approved by a person, and a person can take over at any time.

## Next

- To get hands-on: [What is Core](../core/getting-started/what-is-core.md) → [Create an app](../core/getting-started/create-app.md)
- To see how a team leads an agent team: [What is Studio](../studio/intro/what-is-studio.md)
- If you've used NocoBase 2: [Coming from NocoBase 2](from-v2.md)
