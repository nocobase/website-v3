---
title: What is Studio
description: NocoBase Studio is the governance platform for people and agents building software together. It brings Claude Code, Codex, and OpenCode into one agent team that moves issues forward on its own. Progress is clear at a glance, and people make the key decisions.
---

Connect Claude Code, Codex, and other agents on your team's computers and servers, and they form one agent team. A coordinator agent assigns design, development, testing, and review, and moves multiple projects forward on its own. You can see at a glance where every issue stands and what comes next. Methods and experience are captured in skills, the knowledge base, and project memory, so a new person or agent can pick up where the last one left off. At every key point, agents attach reports and screenshots, and a person makes the decision.

## Why Studio

Your team is already developing with AI or vibe coding, and code gets written fast. But once the team has many projects and issues going at the same time, new problems show up. Everyone switches between terminals and chats, and agents hand back more and more changes. There is more than anyone can review, but letting go feels too risky. Requirement context, business documents, and lessons learned are scattered across chat sessions on different computers, and when people or agents change, they are hard to find.

NocoBase Studio is built to govern how people and agents develop together.

### An agent team that keeps work moving

Studio connects agents across many machines and schedules them centrally as one agent team that moves many projects and issues forward in parallel, around the clock. Claude Code, Codex, Gemini CLI, Cursor, OpenCode, and other common coding tools can all join. To see how the coordinator agent hands out the work, read [How the agent team works](agent-team.md).

### Progress at a glance

In Studio you can see where every issue stands and what comes next, along with project progress, agent workload, and model usage. Anything waiting on you sits at the top of **My issues**. See [Follow progress](../use/follow-progress.md) and [Project progress](../project/progress.md).

### Decisions backed by evidence

In Studio, several agents work together on design, development, testing, and review, and a change reaches a person only after it passes its checks and review. When a decision needs a person, agents attach detailed reports, checklists, screenshots, and recommendations, so even business experts who don't code can make the call. See [Accept the result](../use/accept.md).

### Know-how stays with the team

Skills hold how work gets done, the knowledge base holds business documents, and project memory holds what agents learn on their own. When people or agents change, the next one picks up where the last one left off. See [Skills](../project/skills.md), [Knowledge base](../project/knowledge-base.md), and [Project memory](../project/project-memory.md).

## How people and agents divide the work

Agents write the code and do the work, and people make the decisions.

::figure roles | The roles of people and agents in Studio

People decide at three key points:

1. **Answering questions.** When there is a trade-off between approaches, a business rule to settle, or an exception, the coordinator agent spells out what needs deciding and hands it to the issue owner.
2. **Accepting the result.** The coordinator agent attaches a delivery report, acceptance criteria, and screenshots, and a preview you can try yourself when one is available. If everything checks out, the issue owner merges. If not, they send it back for changes.
3. **Approving releases.** A deployment to a protected environment, such as production, needs an approver's sign-off. If something goes wrong, you can roll back to the previous version.

To follow one request from idea to release, read [How a request gets done](how-a-request-gets-done.md).

## How Studio relates to NocoBase Core

On top of AI development, NocoBase adds the foundation and the governance. Core is the application foundation, with the building blocks and development standards every business system shares. Studio is the governance platform for people and agents building software together.

<figure class="map" aria-label="Your team works with the agent team in Studio to build business apps on Core">
<div class="row"><div class="box human"><b>Your team</b><span>Raises requests, keeps track of progress, and makes the key decisions</span></div></div>
<div class="down">Requests</div>
<div class="row c2"><div class="box brand"><b>NocoBase Studio</b><span>Schedules the agent team, runs checks and reviews, and keeps the team's know-how</span></div><div class="box agent"><b>Agent team</b><span>Claude Code, Codex, and other coding tools, sharing out design, development, testing, and review</span></div></div>
<div class="down">Development</div>
<div class="row"><div class="box"><b>Your business apps · built on NocoBase Core</b><span>Use Core's permissions, workflows, files, and other building blocks, and run on their own once released</span></div></div>
</figure>

A new project in Studio starts from the NocoBase app template by default. Agents use the permissions, workflows, files, and other building blocks Core already provides and build only what is specific to your business. There is far less code to write and verify, and the system evolves steadily for years on one consistent architecture. Once released, your business apps run on their own, and day-to-day business requests never go through Studio.

## Self-hosted

Studio comes with the NocoBase commercial editions, and Core and Solution apps such as NocoCRM are free and open source. Studio and your business apps run on your own servers, and your code and data belong to you. You choose your own models and agents, with no vendor lock-in.
