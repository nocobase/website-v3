---
title: Start with Core, scale with Studio
metaDescription: "Learn the two-stage way to build with NocoBase 3: build an MVP quickly with a local Coding Agent and Core, then connect the same repository to Studio with zero migration to polish in parallel and ship reliably."
---

Building a real business system with NocoBase 3 does not require setting up heavy team processes on day one, nor does starting light create migration work later.

The recommended path is a **two-stage progression**: during early exploration, use a local Coding Agent and NocoBase Core to align on requirements and build a minimum viable product (MVP) quickly; once business colleagues start trying it out and feedback pours in, connect the exact same repository to NocoBase Studio with zero migration cost so an agent team can handle parallel changes with process and review guardrails.

## Two-stage progression at a glance

<figure class="two-stage-flow" aria-label="Stage 1 clarifies business scope and builds an MVP locally with Core; after preview testing, the same repository connects to Studio with zero migration for Stage 2 parallel delivery and ongoing evolution">
<div class="ts-stage">
<p class="ts-head"><b>Stage 1 · Fast MVP</b><span>Local Coding Agent + Core</span></p>
<div class="ts-steps">
<div class="ts-card"><div class="ts-top"><span class="ts-pill human">Product &amp; business</span></div><b>Clarify business scope</b><p>Map pain points, core entities, business rules, roles, and first-release scope so AI does not rework vague requirements.</p></div>
<div class="ts-card"><div class="ts-top"><span class="ts-pill brand">Developer + Core</span></div><b>Build an MVP locally</b><p>Reuse built-in permissions, auth, and workflows while using Claude Code or Codex to focus on business logic and iterate live.</p></div>
</div>
</div>
<div class="ts-link"><span>Preview &amp;<br>connect repo</span><svg viewBox="0 0 36 16" fill="none" aria-hidden="true"><path d="M2 8h28M24 2.5L31 8l-7 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
<div class="ts-stage ts-stage-studio">
<p class="ts-head"><b>Stage 2 · Parallel polish &amp; launch</b><span>Connect to Studio</span></p>
<div class="ts-steps">
<div class="ts-card"><div class="ts-top"><span class="ts-pill agent">Studio + agent team</span></div><b>Process feedback in parallel</b><p>Split user feedback into parallel tasks with automated checks, cross-model reviews, and preview acceptance to prevent regressions.</p></div>
<div class="ts-card"><div class="ts-top"><span class="ts-pill pass">Production</span></div><b>Launch and keep growing</b><p>Apps run independently after release while the team captures knowledge and memory to grow more modules at the same pace.</p></div>
</div>
</div>
</figure>

## Stage 1: Build an MVP quickly with Core

Early in a project, requirements shift fast and tight feedback loops matter most. The goal is to get core business capabilities running quickly rather than introducing process overhead too early.

### Clarify the business before asking the Agent to code

AI writes code fast, which means unclear requirements turn into fast rework. Before generating code, align on four essentials:

- Core business entities and how they relate;
- Key business rules and status transitions;
- User roles and what each role can view or modify;
- What belongs in the first release and what can wait.

Capture these in a short design document (see [Write a system design doc first](../guides/write-a-design-doc.md)) so every agent session shares the same baseline.

### Iterate locally on Core

A developer initializes an application from the NocoBase Core default template on their own machine and builds the MVP with Claude Code, Codex, or Cursor (see [Build your first app with Core](develop-your-first-app.md)):

- **Reuse the foundation, focus on business logic**: Over 30 capabilities—users, permissions, authentication, databases, workflows, and approvals—are ready out of the box, leaving agents to implement your business logic.
- **Align live and converge quickly**: Discuss and refine directly against running pages and APIs with product or business stakeholders, without waiting on tickets or status relays.
- **Consistent architecture from day one**: Although iteration feels as fast as prototyping, Core enforces a standard directory layout, coding conventions, and versioned Skills shipped with the packages. The result is a maintainable application ready for production, not a throwaway demo.

## When to bring the project into Studio

Once the MVP works, deploy it to a test or preview environment (see [Choose a deployment method](../core/deployment/choose-a-deployment-method.md)) and let a group of frontline business users try it. That is typically where the project hits a clear inflection point.

### Signals that it is time to switch

Any of the following signs means the project has moved from solo exploration into team iteration and is ready for Studio:

- **Feedback arrives in volume**: Frontline testing generates dozens or hundreds of change requests that one person cannot handle sequentially in local sessions.
- **Multiple people or modules need to move in parallel**: Several developers or business tracks work on the system at once, and juggling local terminals makes progress and context hard to track.
- **Production readiness requires quality gates**: Before going live, you need automated checks, independent cross-model reviews, and traceable acceptance so new changes do not break working features.
- **Business colleagues want to participate directly**: Business owners want to submit requests, answer rule questions, and verify previews directly instead of relaying everything through developers.

### Connect the existing repository with zero migration

Moving from Core to Studio requires no rewrite and no structural migration. Studio operates on the exact same Core-based Git repository, using the same project layout, Skills, and runtime model.

Once Studio is running (try it locally with [Install and use Studio](collaborate-with-studio.md), or deploy it for your team via the [Installation overview](../studio/setup/index.md)), create a project linked to your existing repository without re-initializing it, and continue right where you left off (see [Bring the project into Studio](../guides/bring-into-studio.md)).

## Stage 2: Polish in parallel and evolve with Studio

Inside Studio, development shifts from fast local iteration to controlled, team-scale delivery.

### Parallel delivery with process and review guardrails

- **High parallel throughput**: Break frontline feedback into separate tasks. Studio coordinates an agent team to work on them concurrently in isolated branches.
- **Structured checks protect existing behavior**: Every change goes through automated checks and independent cross-model review, arriving with a delivery report and live preview for human acceptance (see [Install and use Studio](collaborate-with-studio.md)).
- **People stay in charge of decisions**: Whenever a business rule needs clarification, the task pauses in your queue with a focused question; people always decide when to merge and release.

### Grow into more modules after launch

Once the first version passes acceptance, deploy it to production. Released applications run independently—day-to-day business traffic never goes through Studio.

As the system runs, confirmed business rules and lessons learned accumulate in Studio's knowledge base and project memory. Your team can keep expanding into new modules at the same parallel pace, and new teammates or agents can pick up context cleanly.

## Why start with Core before Studio

| Dimension | Stage 1: Local Coding Agent + Core | Stage 2: NocoBase Studio |
| --- | --- | --- |
| Primary goal | Explore requirements and ship a working MVP fast | Process parallel feedback, guard quality, and ship continuously |
| Working cadence | Live local chat and edits, minute-by-minute alignment | Structured tasks, parallel branches, gated reviews and acceptance |
| Key participants | Product/business + developer (local Coding Agent) | Business users + developers + 24/7 agent team |
| Core strength | Zero setup overhead and fastest direction changes on a clean architecture | High parallel throughput, quality guardrails, and shared team knowledge |

## A real-world timeline reference

> [!NOTE] How a cross-border quoting system went live in practice
> A large manufacturing enterprise followed this exact two-stage pattern to build an international quoting system with 400+ configuration parameters, regional standards, and commercial terms:
>
> - **First 3 days**: Product managers interviewed regional sales and solution teams to clarify parameters, pricing logic, and first-release scope.
> - **Next 1 week**: Developers built a working MVP locally using a Coding Agent and NocoBase Core, aligning live with product managers until the core flows stabilized.
> - **MVP ready**: The team deployed a preview for frontline users; as feedback poured in, they connected the repository to Studio with zero migration.
> - **1 more week**: Studio coordinated an agent team to resolve hundreds of frontline feedback items in parallel through automated checks, cross-model review, and acceptance—shipping version 1 to production.
> - **Next ~2 months**: Keeping the same Studio rhythm, the team steadily expanded into 10+ modules covering leads, proposals, quotes, orders, dashboards, a document hub, and AI assistants.
>
> Actual timelines vary with complexity: a focused internal tool may finish Stage 1 in a single day, while a large core system can roll out module by module.

## When you do not need two stages

The two-stage pattern fits most new business systems, but it is not the only way to work:

- **Stay on Core alone**: Personal tools, small apps, low-frequency solo projects, or teams with an established review and delivery setup can build and run on Core indefinitely.
- **Start directly in Studio**: If your team already runs Studio—or you want business teams submitting queued requests through a standard process from day one—go straight to [Create a project](../studio/setup/new-project.md) in Studio, which initializes the repository with the same Core default template.

## Next steps

- Start Stage 1 and run your first business app locally: [Build your first app with Core](develop-your-first-app.md)
- Install the free Studio Community Edition with one command and walk through your first request: [Install and use Studio](collaborate-with-studio.md)
- Follow a complete end-to-end project from Core into Studio: [Build reliable enterprise apps with NocoBase 3](../guides/build-reliable-enterprise-apps.md)
