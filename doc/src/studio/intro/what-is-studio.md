---
title: What is Studio
description: NocoBase Studio is the governance platform for teams building with agents. Agents do the work and people make the call, so each person can lead an agent team and move more issues and projects forward at once.
---

Most of the work in development, from clarifying requirements and proposing a solution to writing code, testing, and review, can now be handed to agents. Studio connects your team's Claude Code, Codex, and other tools and schedules them centrally, so they keep issues moving day and night. It also lets you **manage this agent team the way you manage employees**: divide up the work, set the standards and process, keep a record of every step, and leave the key decisions to people.

## What Studio provides

<div class="pillars">
<div class="pillar"><div class="k">Organize</div><b>One shared agent team</b><p>Claude Code, Codex, and other tools on members' computers and team servers join Studio and form an agent team. The coordinator agent hands out work by what each agent is good at, so many issues move at once, and the team keeps going after everyone logs off.</p></div>
<div class="pillar"><div class="k">Standards</div><b>Work the way your team works</b><p>Agents follow the built-in NocoBase development skills and your team's standards, and read business rules from the knowledge base. What they learn along the way, they write into project memory themselves and read before the next job.</p></div>
<div class="pillar"><div class="k">Process</div><b>Every delivery takes the same path</b><p>Each issue is built on its own branch, passes the checks your team defines and a review by another model, and then goes to its owner for acceptance. A person approves every release.</p></div>
<div class="pillar"><div class="k">Records</div><b>Every step is on the record</b><p>Every run, decision, and delivery is recorded: who started it, which agent, on which machine, what was done, and what it cost.</p></div>
<div class="pillar wide"><div class="k">Decisions</div><b>Judgment stays with people</b><p>When something needs a judgment, the coordinator agent states the question, attaches the evidence, and hands it to the issue owner. People accept the work and merge it. Agents do the work, and people make the call.</p></div>
</div>

## Who does what

Studio has two kinds of roles: people make decisions, and agents do the work.

::figure roles

People mostly appear at three moments:

1. **Set the goal**: say what you want, as a few sentences, a document, or the outcome of a discussion.
2. **Answer questions**: trade-offs in the plan, business rules, and exceptions are for people to decide.
3. **Accept**: read the delivery report and the changes, and confirm the result. If it passes, merge it. If not, send it back for changes.

The rest of the time, the agent team keeps moving on the runtimes. **My issues** puts what is waiting for you first, so you do not need to watch the agents work.

## How it relates to NocoBase Core

NocoBase is an open source platform for building and running business systems with AI. Agents write the code and do the work, NocoBase provides the foundation and the process, and people make the decisions.

<figure class="map" aria-label="Your team leads an agent team in Studio to build a business app on Core">
<div class="row"><div class="box human"><b>Your team</b><span>Sets goals, answers questions, accepts the work</span></div></div>
<div class="down">Issues</div>
<div class="row c2"><div class="box brand"><b>NocoBase Studio</b><span>Organizes the agent team and manages issues, process, and records</span></div><div class="box agent"><b>Agent team</b><span>Builds, tests, and reviews on team servers and members' computers</span></div></div>
<div class="down">Build</div>
<div class="row"><div class="box"><b>Your business app · built on NocoBase Core</b><span>Uses Core's permissions, workflows, files, and other building blocks directly; runs on its own once live</span></div></div>
</figure>

Core is the open source foundation for building and running business systems, with data, permissions, workflows, files, and other common building blocks already included. Studio leads agents to build and improve your app on Core, and the agents use those building blocks directly and write only the business logic. **Once the app is live it runs on its own, and day-to-day business requests do not go through Studio.**

## Who it is for

- **IT and digital teams at mid-size and large companies**: many business systems and a steady stream of requests, and a wish to expand delivery capacity with AI while meeting security, compliance, and long-term maintenance requirements. Domain experts who do not write code can also lead a request from proposal to acceptance.
- **Software companies and partners who deliver systems to enterprises**: build for different customers on the same foundation and method, and capture industry experience as skills and knowledge bases.

Studio and the agents used for development are deployed in the company's own environment, and the company chooses the models and coding tools. Studio is available in the NocoBase commercial editions (Professional and Enterprise).

For a complete example, see [How a request gets done](how-a-task-gets-done.md).
