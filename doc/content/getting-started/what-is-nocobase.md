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

<figure class="arch-overview" aria-label="Build business apps with local coding tools or NocoBase Studio; business apps and built-in business agents run independently on NocoBase Core">
<div class="ao-zone">
<p class="ao-zone-head"><span>Development &amp; delivery</span></p>
<div class="ao-stack">
<div class="ao-box"><b>Local coding tools</b><span>Start directly with Core</span><p>Use Claude Code, Codex, Cursor, and more to build business systems without installing Studio first.</p></div>
<div class="ao-or">Or upgrade to team collaboration</div>
<div class="ao-box ao-studio"><b>NocoBase Studio</b><span>Team development workbench</span><p>Coordinate a 24/7 agent team with structured workflows, review, and quality testing.</p></div>
</div>
</div>
<div class="ao-link"><span>Build &amp; iterate</span><svg viewBox="0 0 44 16" fill="none" aria-hidden="true"><path d="M2 8h36M32 2.5L39 8l-7 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
<div class="ao-zone ao-zone-sys">
<p class="ao-zone-head"><span>Your organization's business systems</span><span class="ao-pill">Independent runtime · No Studio in path</span></p>
<div class="ao-runtime">
<div class="ao-app-row">
<div class="ao-app-card"><b>Business apps</b><p>Pages, APIs, data models, and business rules. Your organization owns the source code.</p></div>
<div class="ao-app-card"><b>Business agents</b><p>Handle routine work 24/7 within their owner's permissions, handing key decisions to people.</p></div>
</div>
<div class="ao-core">
<div class="ao-core-head"><b>NocoBase Core</b><span>Open-source application foundation</span></div>
<div class="ao-core-band"><span class="ao-chip">Permissions &amp; auth</span><span class="ao-chip">Workflows &amp; approvals</span><span class="ao-chip">Multi-database</span><span class="ao-chip">Files &amp; notifications</span><span class="ao-chip">AI &amp; business agents</span><span class="ao-chip">Consistent architecture</span></div>
</div>
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

## How the way you work changes

### Development and delivery

People define goals, business rules, and acceptance criteria. Coding agents build pages, APIs, data structures, and business rules on Core, with source code stored in your own repository. Changes pass automated checks, cross-model review, and human sign-off before release, and continue evolving on the existing app as business needs change.

### Business agents in daily operations

After launch, business agents can stay active inside your business systems to handle routine operations. Connected through Core's Agents capability, these business agents inherit their owner's permissions, proactively handle routine work 24/7 following your business rules, and ask a person to confirm key actions with supporting evidence.

## Self-hosting and full control

- **Your code and data belong to you**: Both Core and Studio run on your own servers, including air-gapped networks.
- **Apps run independently**: Once released, your business apps run on their own, and day-to-day business requests never go through Studio.
- **Your choice of models and tools**: No vendor lock-in. Use Claude Code, Codex, Cursor, and other coding tools with cloud or locally hosted models.

## Get started

- Start directly with Core and your local coding tool: [Develop your first app](develop-your-first-app.md)
- Try the free Studio Community Edition on your computer with one command: [Quick install Studio](quick-install-studio.md)
- Walk through a request in a team Studio environment: [Collaborate with Studio](collaborate-with-studio.md)
- Follow a complete IT asset management project from start to finish: [Build reliable enterprise apps with NocoBase 3](../guides/build-reliable-enterprise-apps.md)
- Compare NocoBase with vibe coding and low-code platforms, or learn how NocoBase 2 relates to NocoBase 3: [Frequently asked questions](../faq/index.md)
