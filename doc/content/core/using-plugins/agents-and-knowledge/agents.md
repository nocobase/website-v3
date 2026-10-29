---
title: "Agents"
description: "Integrate Agents, runtimes, model services, conversations and run history."
---

`@nocobase/app-plugin-agents` provides Agent execution and conversations, Runner management, run history, Skills, variables, model services and usage. The application integrates its business subjects, actions and access boundaries.

## Choose an execution mode

Runner Agents execute coding tools on connected runtimes. OnlineAgent runs server-side conversations through model services and registered tools. Configuring a model service does not connect a Runner, and installing a Runner does not configure online models.

Integrate the capabilities you need. Online conversations do not require a Runner Agent record.

## Integration and pages

Register Client and Server, apply migrations and seeds, and register CLI when needed. Model keys and variables require persistent host secrets. Installation in a template is not proof of runtime registration.

The plugin registers no management routes automatically. Compose these exports from `/client/routes`:

| Export | Default path and purpose |
| --- | --- |
| `agentsRoute` | `/agents`: enable, disable and inspect Agents |
| `runtimesRoute` | `/runtimes`: connect and manage Runners |
| `modelsRoute` | `/models`: configure and test model services |
| `skillsRoute` | `/skills`: maintain Skill files and versions |
| `usageRoute` | `/usage`: usage and cost information |

Preserve access conditions when composing routes. Opening a page does not grant all operations: model services use settings permissions such as `agents.services`, and Runner operations also check ownership.

## Use a Runner Agent

1. Add a runtime, choosing personal/shared use and allowed tools.
2. Follow its generated registration instructions and verify installed, signed-in tools.
3. Add an Agent from reported models, describe its purpose and enable it.
4. Start work through a conversation or integrated business entry and inspect queue reasons, execution and results.

Personal runtimes follow ownership and local policy. Shared runtimes require corresponding administration access. Queued work may lack an eligible runtime, free slot or signed-in tool.

## Use online conversations

Configure a model provider, URL and key, test the appropriate model kind, and enable the service. New online conversations require an available chat model; embedding and rerank models serve different purposes.

Compose `ChatProvider` and hooks from `/client/chat` with the UI Library's `agent-chat` source. Server integration uses `agentsToken.onlineAgent` from `/server/tokens`. The application supplies business tools, context and authorization.

## Verification

Verify a small task end to end: connection, access, model availability, state and result. Missing model prices make cost reporting incomplete. Check Skill, variable and tool access separately.

For retrieval, see [Knowledge base](knowledge.md). See [Manage plugins](../../developing-apps/manage-plugins.md) for registration and upgrades.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-agents).
