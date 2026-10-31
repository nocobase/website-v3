---
title: What is Studio?
description: How Studio organizes AI development and delivery for teams, and how it works with NocoBase Core.
---

NocoBase Studio is an AI development platform for teams. It connects Coding Agents, project management, and software delivery so teams can share tasks, quality standards, and project knowledge.

## From local AI development to teamwork

A local Coding Agent helps an individual build software. Teams also need to handle incoming requests, coordinate work, verify quality, and track releases. Studio brings these activities into a shared workflow, reducing reliance on individual chat sessions and manual coordination.

### Assign work across Agents

Studio connects tools and models from Claude Code, Codex, OpenCode, and other providers. The [Lead Agent](agent-team.md) assigns design, development, review, and testing based on each Agent's strengths. It reads the results and plans the next step. Members can also talk directly to a [Runner Agent](../join/runner-agent.md) to discuss requirements and move tasks forward.

![The Lead Agent assigns design work with a clear goal and delivery requirements](https://static-docs.nocobase.com/studio-en-req-dispatch-20261030.png)

### Share progress with requesters

Requests from business teams and customers become project tasks. Discussions, Agent runs, and delivery results stay with each task, where project members can follow progress. Task owners answer questions and accept results in **My issues**.

![Task owners review delivery reports and accept results in My issues](https://static-docs.nocobase.com/studio-en-home-20261030.png)

### Track changes through delivery

Studio connects Git platforms and CI/CD to link tasks, pull requests, checks, and reviews. When a check or review fails, the Lead Agent assigns a fix. Owners verify results against the delivery report and acceptance criteria, using previews or test environments when needed. Teams track versions in [Releases](../release/overview.md), deploy production themselves, and record the production version.

![Releases shows versions and their test and production status](https://static-docs.nocobase.com/studio-en-releases-20261030.png)

### Keep standards and knowledge with the team

[Skills](../project/skills.md) define shared requirements for design, development, review, and testing. The [knowledge base](../project/knowledge-base.md) stores business documents. [Project memory](../project/project-memory.md) preserves confirmed rules and experience. Future tasks can reuse this context even when people or models change.

![Project memory preserves confirmed business rules for future tasks](https://static-docs.nocobase.com/studio-en-project-memory-20261030.png)

### Keep your local tools, use shared resources

With the [nb-studio CLI](../reference/cli.md), members can create tasks, add requirements, and follow results from their usual Coding Agent. Studio schedules execution on shared runtimes, so the local session does not need to stay open. Progress and results remain available to the team in Studio.

![Shared runtimes provide coding tools and execution resources for the team](https://static-docs.nocobase.com/studio-en-shared-runtimes-20261030.png)

## People decide, Agents develop

People raise requests, confirm business rules, accept results, and decide when to release. Agents design, code, test, and review.

::figure roles | People make decisions and accept results; the Lead Agent organizes the work

When a business rule or design tradeoff needs a decision, the Lead Agent asks the task owner. On delivery, the owner reviews the report and acceptance criteria, then merges or requests changes. See [How a request gets done](how-a-request-gets-done.md).

## Studio manages delivery, Core powers the application

Studio organizes Agents to build business applications on NocoBase Core. Core provides data, permissions, workflows, and files. Agents build business features on these foundations.

<figure class="map studio-architecture" aria-label="Teams use Studio to coordinate Agents building applications on Core">
<div class="row"><div class="box team"><b>Your team</b><span>Request features · Confirm rules · Accept and release</span></div></div>
<div class="down">Move work forward through Studio</div>
<div class="delivery"><div class="delivery-title"><b>NocoBase Studio</b><span>Manage development and delivery</span></div><div class="row c2"><div class="box"><b>Lead Agent</b><span>Assign work · Follow results · Request decisions</span></div><div class="box"><b>Execution Agents</b><span>Design · Develop · Test · Review</span></div></div><div class="delivery-tools">Projects and tasks · Git and CI/CD · Skills and project memory</div></div>
<div class="down">Develop, verify, and deliver</div>
<div class="application"><div class="app-title"><b>Your business application</b><span>Business features and interfaces</span></div><div class="core-base"><b>NocoBase Core</b><span>Data · Permissions · Workflows · Files</span></div></div>
</figure>

## Self-hosted

Studio is part of NocoBase's commercial offering. Core and solution applications such as NocoCRM are free and open source. Studio and your applications run on your infrastructure. Your organization owns the code and data, and chooses its Coding Agents and models.
