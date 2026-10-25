---
title: NocoBase Core documentation
nav: Core home
description: Core is the open-source foundation for building and running business systems. Permissions, approvals, files, notifications, and the other building blocks every system needs are ready, so agents use them directly and focus on your own business.
---

In NocoBase 3, an app is a body of code that agents write on top of Core. You say what you want, make the judgment calls, and accept the results. Agents read the skills that ship with Core and build the app with Core's plugins and components. Once the app is live, administrators maintain users, permissions, and workflow parameters in the app's **System settings**.

> [!TIP] First time here
> Read [What is Core](intro/what-is-core.md) and [How plugins work](intro/how-plugins-work.md) first, then follow the [Quick start](quickstart.md) to create an app.

## Read by role

| You are | Read first | Then read |
| --- | --- | --- |
| Evaluating NocoBase 3 | [What is Core](intro/what-is-core.md) → [How an app gets built](intro/how-an-app-gets-built.md) | [Capabilities overview](capabilities/index.md) → [Plugin directory](plugins/index.md) |
| A developer or technical lead | The five Get started pages, including the [Quick start](quickstart.md) | Build apps → look up capabilities and plugins as needed |
| A business owner or business expert | [What is Core](intro/what-is-core.md) → [How an app gets built](intro/how-an-app-gets-built.md) | The [Capabilities overview](capabilities/index.md), and the "How to ask for it" section of the capabilities you care about |
| An app administrator | [Core concepts](intro/concepts.md) | System settings → users and organization → permission control |
| In operations | [Quick start](quickstart.md) | Deployment and operations → configuration reference |
| Coming from NocoBase 2 | [Coming from NocoBase 2](../start/from-v2.md) → [How plugins work](intro/how-plugins-work.md) | [Plugin directory](plugins/index.md) → [Workflows and approvals](capabilities/workflows.md) |
| A plugin developer | [Core concepts](intro/concepts.md) → [How plugins work](intro/how-plugins-work.md) | Extend |

## What the documentation covers

| Part | Contents |
| --- | --- |
| [Get started](intro/what-is-core.md) | What Core is, how an app gets built, core concepts, how plugins work, and the quick start |
| [Build apps](develop/working-with-agents.md) | General methods for building with agents: stating requirements, app structure, managing plugins, pages, data, APIs, system settings, acceptance, and upgrades |
| [Capabilities](capabilities/index.md) | Following the 13 categories in **App foundation**, what each capability gives you out of the box, what the agent has to do, and what administrators can adjust |
| [Plugin directory](plugins/index.md) | One page per plugin: what it provides, what it looks like in the app, and how to get agents to use it |
| [Deployment and operations](operations/deployment.md) | Deployment, configuration, database, storage, background jobs, upgrade and rollback, backup, and logs |
| [Extend](extend/when-to-write-a-plugin.md) | When to write a plugin, how to create and publish one, and how to write skills for it |
| [Reference](reference/cli.md) | Command line, configuration options, HTTP API, packages and versions, and FAQ |

## About this documentation

- Behavior is described against the code, default template, and skills on the `v3-develop` branch of the NocoBase repository (as of October 23, 2026). Every package is currently in beta, and the product is the source of truth.
- The examples come from a company's purchasing app: suppliers, purchase orders, approvals, and receiving.
- Interface names that ship with the template and plugins are shown in **bold**, for example **System settings › App foundation**. Pages that an agent builds from your requirements differ from app to app, so the documentation describes them instead, for example "the attachments area in the purchase order details".
