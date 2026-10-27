---
title: What is NocoBase 3
description: NocoBase is the open-source platform for building, running, and evolving business systems with AI. Agents write the code and do the work, NocoBase provides the foundation and governance, and people make the decisions.
---

Core is the application foundation. It provides the building blocks and development standards that every business system shares, and agents build on it to meet each company's own needs. Studio is the governance platform where people and agents build software together. Agents divide up the work and keep it moving, while people stay on top of progress and make the key decisions. NocoBase turns AI's ability to build software into an organization's ability to deliver reliable business systems, release after release.

## Why NocoBase

AI writes code fast. Building reliable business systems is still hard. Your team is already developing with AI or vibe coding, and the first version comes together quickly. But a business system is used for years: features keep getting added, processes keep changing, and people hand the work over. That's where new problems come in.

### Every project rebuilds the foundation

Even with AI writing the code, permissions, workflow engines, and approvals are hard to design from scratch. They are full of edge cases and take a lot of work to maintain.

Core provides ready-made building blocks, and NocoBase keeps maintaining and upgrading them. Say the purchasing team needs a supplier management system: agents write only the business parts, such as supplier profiles, purchase orders, and approval rules, and use Core's permissions and approvals as they are. There is far less code to write and verify.

### Architecture drifts out of control

Switch developers, models, or even sessions, and the AI may improvise differently each time. The same system ends up written several different ways and gets harder and harder to maintain.

Core provides one project structure and one set of development standards, and agents write code by the development skills that ship with the packages, so the system evolves steadily for years on a consistent architecture.

### Parallel work outpaces human review

Your team juggles several projects and issues, and everyone switches between terminals and chats. Agents hand back more and more changes. There is more than anyone can review, but letting go feels too risky.

Studio coordinates one agent team that moves many projects and issues forward at once, with progress clear at a glance. When a person needs to step in, agents attach reports, checklists, and screenshots, so people decide with the evidence in hand.

### Know-how is hard to capture and share

Requirement context, business documents, and lessons learned are scattered across chat sessions on different computers. When people or agents change, they are hard to find.

Studio captures methods and experience in skills, the knowledge base, and project memory, so a new person or agent can pick up where the last one left off.

## Core, Studio, and Solution

<figure class="layers" aria-label="Studio is where people and agents build business apps together; the apps are built on Core">
<div class="ly-b st"><b>NocoBase Studio</b><span>The governance platform for people and agents building software together</span></div>
<div class="ly-t"><b>People make the decisions. Agents write the code and do the work</b><span>Schedules the agent team, runs checks and reviews, and keeps the team's know-how.</span></div>
<div class="ly-k down">Build · Deliver · Govern · Evolve</div><div class="ly-gap"></div>
<div class="ly-b"><b>Business apps</b><span>Your organization's business systems</span></div>
<div class="ly-t"><b>Your business apps, plus ready-made Solution apps</b><span>Your code and data stay yours, and the apps run on their own once released. Use Solution apps as they are, or keep customizing them.</span></div>
<div class="ly-k up">Building blocks · Standards</div><div class="ly-gap"></div>
<div class="ly-b co"><b>NocoBase Core</b><span>The open-source application foundation</span></div>
<div class="ly-t"><b>Building blocks and one consistent architecture</b><span>20+ building blocks such as permissions, workflows, and files, plus one consistent project structure and development standards.</span></div>
</figure>

- **[Core](../core/index.md)** is the open-source application foundation for business systems built and run with AI. Permissions, workflows, files, and other building blocks come ready to use, so agents build only what is specific to your business, all on one consistent architecture.
- **[Studio](../studio/index.md)** is the governance platform for people and agents building software together. It brings Claude Code, Codex, and OpenCode into one agent team that moves issues forward on its own. Progress is clear at a glance, and people make the key decisions.
- **Solution** is a line of agent-driven business apps built on Core, such as NocoCRM and NocoITAM. Agents do most of the work, and people make only the key decisions. Install and use them as they are, or have an agent tailor them to your business.

## Core only, or Core with Studio

| | Core only | With Studio |
| --- | --- | --- |
| Who builds | You open Claude Code, Codex, or another coding tool in the app directory and build with the agent | Your team's agents form an agent team, and the coordinator agent assigns design, development, testing, and review |
| Good for | One person or a small team working on one or a few apps | A team moving many projects and issues forward at once, where business experts raise requests and make decisions directly |
| Checks and releases | Your team organizes testing, review, and deployment itself, with deployment tools and development guides from Core | Work reaches a person for acceptance after it passes checks and review, and deployments to protected environments need an approver's sign-off |
| Get started | [Create a Core app](../core/getting-started/create-app.md) | [What is Studio](../studio/intro/what-is-studio.md) |

Either way, the apps you build are the same, all built on Core.

## Agents inside your business systems

Once an app is live, agents can also take on business work inside it, such as researching customers, drafting emails, reconciling asset records, and handling support tickets. These business agents are connected through Core's Agents plugin and use the same permissions as people. When something needs a decision, they hand it to the person responsible with the supporting evidence. Every Solution app comes with built-in business agents, and you can add them to your own apps as needed.

## Self-hosting

Core, Solution, and Studio all run on your own servers, and your code and data belong to you. You choose your own models and agents, with no vendor lock-in, and Claude Code, Codex, and other coding tools and a wide range of models all work. Once released, your business apps run on their own, and day-to-day business requests never go through Studio.

## How NocoBase relates to vibe coding

Vibe coding makes building software faster. But when a project involves complex business logic, many people, and years of iteration, AI-generated code alone isn't enough. You also need a reliable application foundation, consistent development standards, and solid governance. NocoBase adds the foundation and the governance on top of vibe coding, and your team keeps writing code with Claude Code, Codex, and other coding tools.

## Next steps

- Build an app yourself: [What is Core](../core/getting-started/what-is-core.md), then the [create-app guide](../core/getting-started/create-app.md)
- See how your team and the agent team build together: [What is Studio](../studio/intro/what-is-studio.md)
- Used NocoBase 2 before: [Coming from NocoBase 2](from-v2.md)
