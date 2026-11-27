---
title: Learning path
metaDescription: "Explore the documentation map and choose a reading route for app development, Studio collaboration, complete projects, and deployment."
---

## Documentation map

| Section | Contents | When to use it |
| --- | --- | --- |
| [Getting started](what-is-nocobase.md) | Product overview, best way to get started, your first app with Core, install and use Studio, learning path | Your first time with NocoBase 3 |
| [Core manual](../core/index.md) | Core overview, developing apps, built-in capabilities & plugins, developing plugins, framework, multi-app architecture, deployment & operations, reference | Look up the feature you are building or maintaining |
| [Studio manual](../studio/index.md) | Setup, member access, issues, project management, agent management, quality management, releases, administration, reference | Look up workflows and actions as you work |
| [Complete project tutorial](../guides/build-reliable-enterprise-apps.md) | Environment & agent setup, building an app with Core, team collaboration in Studio, best practices, appendix | Follow a full project step by step |
| [FAQ](../faq/index.md) | How NocoBase compares to vibe coding and low-code, NocoBase 2 vs. 3, tech stack, integration, deployment & maintenance | Evaluate options or check common questions |

## Complete your first walkthrough

Start with [What is NocoBase 3](what-is-nocobase.md) and [Best way to get started](from-core-to-studio.md) to understand how the application foundation (Core) and the workbench (Studio) fit together across project stages, then pick the entry point that matches what you want to do now:

- **Build your first app with a local Coding Agent**: Follow [Build your first app with Core](develop-your-first-app.md) to initialize Core locally, build customer management, and check role permissions before iterating further.
- **Install and try Studio**: Follow [Install and use Studio](collaborate-with-studio.md) to install the free Studio Community Edition on your own computer with one command and walk through a request end to end. If you need to deploy the workbench for your team on a server, start with [Installation overview](../studio/setup/index.md).

Each starting point lists its own prerequisites, so you do not need to read every manual first. If you want to work through a complete project covering an asset register, approvals, permissions, deployment, and team collaboration, jump straight into [Build reliable enterprise apps with NocoBase 3](../guides/build-reliable-enterprise-apps.md).

## Develop and extend applications

Once the app runs, use the [Application development overview](../core/developing-apps/overview.md) to understand the parts of a feature, and [Project structure](../core/developing-apps/project-structure.md) to locate files. The development manual covers pages and interactions, services and APIs, data and permissions, background work, CLI commands, and testing.

For common capabilities such as authentication, files, and notifications, consult [Built-in capabilities & plugins](../core/using-plugins/overview.md). To maintain functionality independently or reuse it across applications, see [Developing plugins](../core/extension-development/when-to-write-a-plugin.md). Consult the [Framework](../core/framework/overview.md) when you need runtime, container, HTTP, or database internals.

## Use and manage Studio

- Members: start with [Raising requests](../studio/use/raise-a-request.md) and [Sessions](../studio/use/sessions.md), then consult [Progress](../studio/use/follow-progress.md), [Answering questions](../studio/use/answer.md), and [Accept a task](../studio/use/accept.md).
- Project owners: use [Settings](../studio/project/settings.md), [Knowledge base](../studio/project/knowledge-base.md), [Project memory](../studio/project/project-memory.md), and [Progress](../studio/project/progress.md), followed by [Checks and review](../studio/project/checks-and-review.md) and [Releases](../studio/release/overview.md).
- Administrators: complete [Installation](../studio/setup/index.md), then manage [Agents](../studio/configure/agents.md), [Runtimes](../studio/configure/runtimes.md), [Skills](../studio/project/skills.md), [Usage](../studio/project/usage.md), [Members and roles](../studio/admin/members-and-roles.md), and [Upgrades and backups](../studio/admin/upgrade-and-backup.md).

Studio's reference section contains statuses, permissions, agent execution rules, commands, and configuration.

## Follow a complete project

[Build reliable enterprise apps with NocoBase 3](../guides/build-reliable-enterprise-apps.md) follows an asset-management application through environment setup, design, device management, requests and approvals, roles, acceptance, and deployment. It then introduces Studio collaboration, shared knowledge, and releases.

Use this route for sustained practice across a whole project. If you have completed the quickstart, continue from the stage that matches your experience and consult the manuals for specific mechanisms.

## Deploy, maintain, and look up details

Before sharing an application with users, read [Choose a deployment method](../core/deployment/choose-a-deployment-method.md), then [Publish application releases](../core/deployment/publish-app-release.md). For databases, consult [Compatibility](../core/developing-apps/compatibility.md) and [Database configuration](../core/developing-apps/database-configuration.md).

Look up Core [CLI commands](../core/reference/cli.md) and [Configuration](../core/reference/configuration.md), or Studio [CLI commands](../studio/reference/cli.md), [Runner commands](../studio/reference/runner.md), and [Configuration](../studio/reference/config.md) when needed.
