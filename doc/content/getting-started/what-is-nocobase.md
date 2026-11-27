---
title: What is NocoBase 3
metaDescription: "NocoBase is the open-source platform for enterprises to build and run business systems with AI. People define needs and make decisions; agents write code and execute; NocoBase keeps systems reliable and the process under control."
---

NocoBase is the open-source platform for enterprises to build and run business systems with AI. People define needs and make decisions; agents write code and execute; NocoBase keeps systems reliable and the process under control.

NocoBase is made up of the application foundation (Core) and the workbench (Studio). Depending on where your team is, you can start directly with Core on its own or adopt Studio for team collaboration; together they turn AI's ability to build software into an organization's ability to deliver and run reliable business systems continuously.

## Why NocoBase

AI writes code fast. Building reliable business systems is still hard. Whether your organization is just starting to build systems with AI or your engineering team already uses Claude Code, Codex, or other coding tools, four core challenges show up as soon as a system goes into production and evolves over time.

### Stop rebuilding foundational modules from scratch

Even with AI writing code, permissions, sign-in and authentication, workflow engines, and approvals are complex, full of edge cases, and expensive to verify and maintain.

Core provides 30+ ready-made building blocks maintained and upgraded by NocoBase. Agents write only your business logic, sharply reducing the code you need to build, test, and review for security.

### Keep one consistent architecture as systems evolve

Switch developers, models, or sessions, and AI improvises differently each time. Multiple coding styles accumulate inside the same system, causing architecture drift and making it harder to maintain.

Core provides one project structure, one set of development standards, and versioned development skills shipped with the foundation. Across people, models, and sessions, agents build on the same architecture so the system evolves steadily for years and developers can step in to maintain it at any time.

### Keep delivery under control with tool-backed quality gates

When a team advances multiple projects and issues in parallel, juggling terminals and chat sessions produces more agent changes than anyone can review, yet releasing without verification feels risky.

Studio runs every issue through a structured workflow with resident skills loaded automatically on every run. Changes pass automated checks and cross-model review, then arrive with a delivery report, screenshots, and a live test environment for human sign-off. The Enterprise edition also runs proven industry testing tools across features, smoke checks, permissions, security, performance, code quality, and UX, automatically turning findings into follow-up issues for closed-loop fixes.

### Keep collaboration and know-how with the team

When everyone runs AI on their own computer, requirement context, business documents, project progress, and lessons learned stay trapped in private sessions that others cannot see or inherit.

Studio keeps requests, discussions, progress, and spend across every project in one place. Team methods live in skills, business documents live in the knowledge base, and confirmed rules and lessons stay in project memory, so a new person or agent can pick up where the last one left off.

## What makes up NocoBase 3

<figure class="arch-overview" aria-label="NocoBase 3 consists of NocoBase Studio and NocoBase Core: build business apps with Studio or a local Coding Agent, and run them independently on Core">
<div class="ao-top">
<div class="ao-box ao-studio"><div class="ao-box-head"><b>NocoBase Studio</b><span class="ao-tag">Team workbench</span></div><p>Coordinate agent teams with structured reviews and quality gates.</p></div>
<div class="ao-box"><div class="ao-box-head"><b>Local Coding Agent</b><span class="ao-tag">Direct local development</span></div><p>Claude Code, Codex, Cursor, and more.</p></div>
</div>
<div class="ao-down"><svg viewBox="0 0 16 20" fill="none" aria-hidden="true"><path d="M8 2v14M3 11.5L8 16.5l5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Build &amp; iterate</span></div>
<div class="ao-system">
<div class="ao-app">
<div class="ao-sys-head"><b>Your business app</b><span class="ao-pill">Runs independently</span></div>
<p>Pages, APIs, data models, and business rules. Your organization owns the source code.</p>
</div>
<div class="ao-core">
<div class="ao-core-head"><b>NocoBase Core</b><span>Open-source application foundation</span></div>
<div class="ao-core-band"><span class="ao-chip">Permissions &amp; auth</span><span class="ao-chip">Workflows &amp; approvals</span><span class="ao-chip">Multi-database</span><span class="ao-chip">Files &amp; notifications</span><span class="ao-chip">AI &amp; business agents</span><span class="ao-chip">Consistent architecture</span></div>
</div>
</div>
</figure>

### NocoBase Core (application foundation)

**[NocoBase Core](../core/index.md)** is the open-source application foundation built for AI development. It is free and open source, ready to start on its own, and runs independently.

From the moment you initialize a new app, 30+ building blocks are ready out of the box, including users and permissions, sign-in and authentication, workflows, databases, file storage, notifications, and AI integration, along with one project structure and development standards. Both individuals and teams can start directly with Core using Claude Code, Codex, Cursor, or other coding tools without installing Studio first.

### NocoBase Studio (workbench)

**[NocoBase Studio](../studio/index.md)** is the development workbench for team collaboration and governance.

It brings Claude Code, Codex, OpenCode, and other coding tools on personal computers and team servers into one 24/7 agent team. A coordinator agent assigns design, development, testing, and review across multiple projects based on each agent's strengths. People can submit requests, answer questions, inspect acceptance reports and live test environments, and make decisions on desktop or mobile, while seeing progress and spend across every project at a glance.

Studio Community Edition is free to use and includes two built-in workflows (simple workflow and standard workflow) along with foundational collaboration features. When your team needs multi-role and custom workflows, deployment approvals, or quality management, upgrade to Professional or Enterprise. See [Choose an edition](../studio/setup/index.md#choose-an-edition).

## What changes and how teams work

### What changes

AI + NocoBase is changing how business systems are built and used in four places:

| Area | Before | Now |
| --- | --- | --- |
| **Business teams: submit requests directly and sign off yourself** | Requirements went into documents handed to IT, followed by months of scheduling, development, testing, and acceptance. | Routine needs no longer wait in long queues. Business users submit requests directly, agents finish development within hours and return an acceptance report and live test environment, and business users sign off themselves. Complex core systems also take shape rapidly through continuous iteration. |
| **IT teams: shift from writing code to setting rules and governing releases** | IT capacity was tight and mostly spent writing code. Backlogs grew while shadow apps built by departments became hard to govern. | The agent team handles development and testing, while IT sets architecture standards and approval workflows, reviews designs, governs quality, and approves releases, freeing engineers from repetitive work while protecting reliability and security. |
| **Management: see progress and spend anytime** | Finding out where projects stood or how much they cost meant asking through layers of status updates. | View and query progress and spend across every project directly. |
| **Day-to-day operations: AI handles routine work 24/7** | Business systems recorded data and routed forms, while people handled every operational task by hand. | Business agents work inside your business systems around the clock within their owner's permissions, and ask a person to confirm key actions. |

### How the team works

- **Business users**: Submit requests, answer agent questions, and verify results in a live test environment.
- **Tech leads**: Define rules and standards, review plans, perform technical sign-off, and approve releases.
- **Agents**: During development, the Coding Agent team handles design, implementation, testing, and review, handing back reports, screenshots, and a live test environment for human sign-off. After release, business agents handle routine work 24/7 within granted permissions and hand key decisions to people.

## Self-hosting and full control

- **Your code and data belong to you**: Both Core and Studio run on your own servers, including air-gapped networks.
- **Apps run independently**: Once released, your business apps run on their own, and day-to-day business requests never go through Studio.
- **Your choice of models and tools**: No vendor lock-in. Use Claude Code, Codex, Cursor, and other coding tools with cloud or locally hosted models.

## Get started

- See the recommended two-stage approach and when to move from local Core to Studio: [Start with Core, scale with Studio](from-core-to-studio.md)
- Start directly with Core and your local Coding Agent: [Build your first app with Core](develop-your-first-app.md)
- Install the free Studio Community Edition with one command and walk through your first request: [Install and use Studio](collaborate-with-studio.md)
- Follow a complete IT asset management project from start to finish: [Build reliable enterprise apps with NocoBase 3](../guides/build-reliable-enterprise-apps.md)
- Compare NocoBase with vibe coding and low-code platforms, or learn how NocoBase 2 relates to NocoBase 3: [Frequently asked questions](../faq/index.md)
