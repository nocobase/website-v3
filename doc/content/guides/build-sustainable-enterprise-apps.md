---
title: Build enterprise apps that keep evolving with NocoBase 3
metaDescription: NocoBase Core is the open-source foundation for developing and running business systems with AI, and NocoBase Studio is the governance platform where people and agents develop together.
---

## Introduction

When you let an agent vibe-code a business system, the first version usually comes quickly. As you keep iterating, these problems show up:

1. Permissions, workflows and approvals have to be written from scratch, and then maintained forever.
2. A new model, a new person or a new session brings a new way of writing code, and the architecture slowly gets out of control.
3. With many issues running in parallel, people can't keep up with confirming the agents' messages and changes.
4. Requirement context, business rules and lessons learned are scattered across sessions, and they are lost when people or agents change.

To address these problems, NocoBase 3 introduces [NocoBase Core](https://www.nocobase.com/core/) and [NocoBase Studio](https://www.nocobase.com/studio/). They let companies develop their own enterprise apps quickly in the age of AI agents while solving the problems above. Using IT asset management as the example, this tutorial shows how to build enterprise apps that keep evolving with NocoBase 3.

## Core: the open-source foundation for developing and running business systems with AI

**Common capabilities don't have to be built and verified from scratch.** More than 20 common capabilities, including users and permissions, data and files, workflows and approvals, messaging, and AI and agents, are ready to use, and NocoBase keeps maintaining and upgrading them. For device requests, the agent writes only devices, requests and approval rules. For the list of capabilities, see [NocoBase Core](../core/index.md#reuse-common-capabilities).

**One architecture and one set of conventions.** A new app comes with a fixed layout, where pages, APIs, migrations and tests each have their place. `AGENTS.md` and the skills shipped with packages say where business code goes and which capabilities to use as they are. Whoever the person, model or session, the agent develops the same way. See [Project structure](../core/developing-apps/project-structure.md).

You can see which Core capabilities an app uses in **System settings › App foundation**. See [App foundation](../core/using-plugins/application-support/foundation.md).

![App foundation: the Core capabilities the app uses](https://static-docs.nocobase.com/20261030-itam-lite-ego-preview-foundation-2x.webp)

## Studio: the governance platform where people and agents develop together

**The agent team moves work forward on its own.** Claude Code, Codex and other coding tools join Studio as an agent team. The lead agent assigns design, development, testing and review by each agent's strengths, and several issues move forward at once, each on its own branch. For every issue you can see at a glance how far it has got, who is working on it and what comes next.

**People make the key decisions.** Work reaches a person only after it passes testing and review. People read the report, screenshots and preview, then accept it or send it back. Business experts who don't code can also raise requests, make decisions and accept results directly.

**Methods and experience stay with the team.** Skills hold how work gets done, the knowledge base holds business documents, and project memory holds what agents learn, so the next person or agent can pick up the work. See [What is Studio](../studio/intro/what-is-studio.md).

Core alone is enough to develop and ship a complete app. Bring in Studio when your team runs several projects at once, or when business colleagues want to take part directly.

> [!NOTE] Studio editions
> Studio is available only in the NocoBase Professional and Enterprise editions. See [Pricing](https://www.nocobase.com/pricing/).

## The tutorial's example: IT asset management

Called ITAM below. The company gives employees laptops and monitors, needs to know where each device is, who has it and what state it is in, and device requests need approval. There are three roles:

| Role | What they do in the system |
| --- | --- |
| Employee | Views the devices assigned to them and submits device requests |
| IT support | Handles device requests, issues and collects devices, and keeps device status up to date |
| Asset manager | Maintains the device register, approves requests and organizes stocktakes |

Part 1 builds the device register, device requests and approval, and permissions for the three roles. Part 2 has the agent team build device stocktaking and invites the asset manager to take part directly.

The tutorial's code is in [nocobase/docs-examples-v3](https://github.com/nocobase/docs-examples-v3/tree/main/apps/itam-lite). For a fuller IT asset management system, see the [NocoITAM online demo](https://solutions.nocobase.com/itam/).

## Tutorial roadmap

### Getting started

1. [Build enterprise apps that keep evolving with NocoBase 3](build-sustainable-enterprise-apps.md): this page.
2. [Prepare your development environment](prepare-environment.md): install Node.js, pnpm and Git.
3. [Choose an agent and a model](choose-agent-and-model.md): pick a coding tool and a model.

### Part 1: Build an app with Core

4. [Create the app](create-app.md): have the agent create the app, start it, sign in and make the first commit.
5. [Write a system design document first](write-a-design-doc.md): talk through what ITAM should do with the agent and write it up as a design document.
6. [First feature: the device register](first-feature-devices.md): entering, searching and tracking the status of devices.
7. [Device requests and approval](requests-and-approval.md): employees submit device requests, and devices are issued after approval.
8. [Roles and permissions](roles-and-permissions.md): what each of the three roles can see and do.
9. [Accept the agent's work](accept-agent-work.md): check what the agent delivers and have it make changes.
10. [Deploy the app](deploy.md): deploy the app to a server.

### Part 2: Use Studio in a team

11. [Bring the project into Studio](bring-into-studio.md): connect the ITAM code repository to a Studio project.
12. [Hand a request to the agent team](agent-team-request.md): have the agent team build device stocktaking.
13. [Bring business colleagues in](business-colleagues.md): invite the asset manager to raise requests, answer questions and accept results.
14. [Capture methods and experience](capture-knowledge.md): keep methods and business knowledge in skills, the knowledge base and project memory.
15. [Release to production](release.md): deploy to a test environment, tag a release and deploy to your own servers.

### Best practices

- [Best practices](best-practices.md): lessons and tips for developing with Core and Studio.

### Appendix

- [Common prompts](prompts.md): the prompts used in the tutorial, in one place.
- [Upgrade NocoBase Core](upgrade-core.md): upgrade Core to the latest version with the upgrade skill.
