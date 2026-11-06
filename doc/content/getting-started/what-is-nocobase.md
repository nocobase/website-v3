---
title: What is NocoBase 3
metaDescription: "NocoBase 3 is the open-source platform for building, running, and evolving business systems with AI, with an application foundation, development governance, and customizable business apps."
---

NocoBase 3 is the open-source platform for building, running, and evolving business systems with AI. Agents write the code and do the work, NocoBase provides the foundation and governance, and people make the decisions.

## Why NocoBase

Vibe coding makes building software faster. But business systems are used for years: features keep getting added, processes keep changing, and people hand the work over. NocoBase adds an application foundation, development standards, and governance to vibe coding, while your team keeps using Claude Code, Codex, and other coding tools.

### Reliable building blocks

Even with AI writing the code, permissions, workflow engines, and approvals are hard to design from scratch. They are full of edge cases and take a lot of work to maintain.

Core provides ready-made building blocks, and NocoBase keeps maintaining and upgrading them. Say the purchasing team needs a supplier management system: agents write only the business parts, such as supplier profiles, purchase orders, and approval rules, and use Core's permissions and approvals as they are. There is far less code to write and verify.

### Consistent development standards

Switch developers, models, or even sessions, and the AI may improvise differently each time. The same system ends up written several different ways and gets harder and harder to maintain.

Core provides one project structure and one set of development standards, and agents write code by the development skills that ship with the packages, so the system evolves steadily for years on a consistent architecture.

### Teamwork and shared knowledge

Your team juggles several projects and issues, and everyone switches between terminals and chats. Agents hand back more and more changes. There is more than anyone can review, but letting go feels too risky.

Studio coordinates one agent team that moves many projects and issues forward at once, with progress clear at a glance. When a person needs to step in, agents attach reports, checklists, and screenshots, so people decide with the evidence in hand.

Requirement context, business documents, and lessons learned are scattered across chat sessions on different computers. When people or agents change, they are hard to find.

Studio captures methods and experience in skills, the knowledge base, and project memory, so a new person or agent can pick up where the last one left off.

## The parts of NocoBase 3

<figure class="layers" aria-label="Solution templates generate business apps; Studio governs their development; Core provides the foundation">
<div class="ly-node ly-studio"><b>NocoBase Studio</b><strong>People and agents build together</strong><p>People decide; agents execute. Coordinate development, checks, and delivery.</p></div>
<div class="ly-link ly-develop"><span>Develop & govern</span><i aria-hidden="true"></i></div>
<div class="ly-node ly-app"><b>Business apps</b><strong>Your organization’s business systems</strong><p>Own your code and data. Run independently after release.</p></div>
<div class="ly-link ly-generate"><span>Generate</span><i aria-hidden="true"></i></div>
<div class="ly-node ly-solution"><b>Solution</b><strong>Business app templates</strong><p>Start with a ready-made app and customize it for your business.</p></div>
<div class="ly-foundation"><div><b>NocoBase Core</b><span>The open-source application foundation</span></div><p>20+ building blocks, including permissions, workflows, and files · Consistent project structure and development standards</p></div>
</figure>

### Core: the open-source app foundation

**[Core](../core/index.md)** is the open-source application foundation for business systems built and run with AI. It provides shared building blocks and development standards.

One person or a small team working on one or a few apps can open Claude Code, Codex, or another coding tool in the app directory and build with the agent. Your team organizes testing, review, and deployment itself, with deployment tools and development guides from Core. You do not need to install Studio to use Core.

### Studio: collaboration and governance

**[Studio](../studio/index.md)** is the governance platform for people and agents building software together. It brings Claude Code, Codex, and OpenCode into one agent team.

Use Studio when your team moves many projects and issues forward at once, or business experts need to raise requests and make decisions directly. The lead agent assigns design, development, testing, and review. Work reaches a person for acceptance after it passes checks and review, and deployments to protected environments need an approver's sign-off.

Studio is provided in the commercial edition.

### Solution: ready-made business apps

**Solution** is a line of agent-driven business apps built on Core, such as NocoCRM and NocoITAM. Agents do most of the work, and people make only the key decisions. Install and use them as they are, or have an agent tailor them to your business.

## From development to daily operations

### Development and delivery

For a supplier management system, you decide which supplier details to record, how purchase orders are approved, and what each role can view and change. Agents build the pages, data structures, and business rules on Core, with the application code in your own repository. Your team checks business flows, permissions, and test results, then releases the app for business users once it meets the requirements.

### Ongoing development

After launch, the purchasing team may need supplier ratings or different purchase order approval rules. You can keep working with agents to change the existing app and check the effects on existing data and processes.

### Agents in daily operations

Once an app is live, agents can also take on business work inside it, such as researching customers, drafting emails, reconciling asset records, and handling support tickets. These business agents are connected through Core's Agents plugin and use the same permissions as people. When something needs a decision, they hand it to the person responsible with the supporting evidence. Every Solution app comes with built-in business agents, and you can add them to your own apps as needed.

## Full control

### Self-hosting and independent operation

Core, Solution, and Studio all run on your own servers, and your code and data belong to you. Once released, your business apps run on their own, and day-to-day business requests never go through Studio.

### Choose your models and agents

You choose your own models and agents, with no vendor lock-in. Claude Code, Codex, and other coding tools and a wide range of models all work.

## Get started

- Build an app yourself: [Develop your first app](develop-your-first-app.md).
- Experience team delivery with agents: [Collaborate with Studio](collaborate-with-studio.md).
- Used NocoBase 2 before: [NocoBase 2 and NocoBase 3](../faq/from-v2.md).
