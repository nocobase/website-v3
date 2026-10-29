---
title: Meet NocoBase Core
description: Core is an open-source foundation for AI to develop and run business applications. It supplies common capabilities and consistent project conventions so agents can focus on your business.
---

An application created with Core can start and accept sign-ins immediately, with users, roles and permissions ready to use. Describe your business to an agent: for example, “Track suppliers and purchase orders, notify the purchasing manager when an order is submitted, and let only the purchasing department edit supplier details.” The agent writes the supplier and order tables, their pages and those two rules. Sign-in, roles, data access, and notification delivery use Core's existing capabilities.

## Common capabilities are ready to use

Permissions, data access, files, notifications and background jobs involve many edge cases, even when AI writes them from scratch, and they need ongoing maintenance. Core provides implementations maintained and upgraded by NocoBase. The agent writes the business-specific parts, leaving less code for you to review.

| Category | Includes | Documentation |
| --- | --- | --- |
| Users and permissions | Sign-in and sessions, user management, API keys; page and action authorization, default data access, sharing rules and restriction rules | [Authentication](../using-plugins/authentication/sign-in.md), [Permissions](../using-plugins/authorization/permissions.md) |
| Data and files | Tables, fields, relationships and migrations; SQLite, PostgreSQL, MySQL and other databases; database browsing; file upload, storage and access | [Database](../framework/database/overview.md), [Files](../using-plugins/data-and-files/file-management.md) |
| Processes and tasks | Record lifecycles with states and transitions declared in code, scheduled tasks, background jobs and queues; approvals (commercial edition) | [Scheduler](../using-plugins/automation/scheduler.md), [Jobs](../framework/background/jobs.md), [Approvals](../using-plugins/collaboration/approval.md) |
| Messaging | Notifications and delivery logs, in-app messages, email and group bot channels, web push; email sending, receiving and synchronization | [Notifications](../using-plugins/notifications/notification.md), [Mail](../using-plugins/notifications/mail.md) |
| AI and agents | Business agents that act within application permissions; knowledge bases for people and agents | [Agents](../using-plugins/agents-and-knowledge/agents.md), [Knowledge](../using-plugins/agents-and-knowledge/knowledge.md) |
| Interface and runtime | UI components, localization, caching, logging and real-time communication | [Components and interactions](../developing-apps/pages-and-interactions.md), [Localization](../using-plugins/application-support/i18n.md) |

These capabilities take two forms. **Plugins** (`@nocobase/app-plugin-*`) take effect when registered in the application and may provide pages, components, skills or commands. **Libraries**, such as the database library `@nocobase/db` and record lifecycle library `@nocobase/lifecycle`, are imported directly. The default template includes commonly used plugins; register others with `pnpm nocobase plugin register`. Once the application is running, open **System settings → App foundation** to see which capabilities it uses. See the [plugin index](../reference/plugins.md) and [package index](../reference/packages.md) for the full list.

## Consistent project structure and conventions

A different developer, model or even a new conversation can lead AI to choose another implementation style. Over time, one system can accumulate several competing approaches. Core applications start from the same template, with a defined place for each kind of code:

```text
my-app/
├── AGENTS.md      # Entry point for agent development guidance
├── .agents/       # Project rules and skills
├── client/        # Pages and interactions
├── server/        # APIs and business services
├── database/      # Migrations and initial data
├── tests/         # Tests
├── packages/      # Local plugins and shared packages (optional)
├── config.yml     # Environment configuration, excluded from Git
└── package.json   # Core package and plugin dependencies
```

`AGENTS.md` and the skills explain where business code belongs, which existing capabilities to use, and how to write migrations and permissions. Skills ship with Core packages and are synchronized to `.agents/skills/` when dependencies are installed, matching the installed version. Coding tools such as Claude Code and Codex read the same conventions across developers and models. See [Project structure](project-structure.md) for each directory's details.

## How development works

Open a coding tool such as Claude Code or Codex in the application directory and work with an agent:

1. Explain the business need, who will use the feature and what counts as complete.
2. The agent follows project guidance and skills to write migrations, APIs, pages, permissions and tests, then runs the tests.
3. Try the application in a browser. Describe any changes you need until it behaves as intended.
4. Commit the code, review it through your team's process and deploy it.

See [Develop with an agent](../developing-apps/develop-with-an-agent.md) for methods and checks. You can also write the code yourself: both approaches use the same framework, components and commands, and can be mixed within one project. [Create an app](create-app.md) and [Build your first app](../tutorials/build-your-first-app.md) describe both approaches.

After deployment, administrators adjust users, roles and data access in **System settings**. Changes to pages, tables and business rules are made in code, tested and redeployed. When NocoBase releases a new version, reconcile changes from the new template; see [Upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md).

## Open source and yours to own

- **Free and open source.** Core can be used in production.
- **Self-hosted.** Keep code in your repository and applications and data on your servers. Deploy with Docker or PM2; see [Choose a deployment method](../deployment/choose-a-deployment-method.md).
- **Choice of tools.** Choose your coding tool and model, including Claude Code or Codex.

## Core, Studio and Solution

Core alone is enough to develop and deploy a complete business application. You only need Core to follow this documentation.

- For teams handling multiple projects and many tasks, **NocoBase Studio** (commercial edition) coordinates agent teams, reviews and acceptance. See [What is Studio](../../studio/intro/what-is-studio.md).
- To start from an existing business application, use a **NocoBase Solution**, such as NocoCRM or NocoITAM. These are built on Core and can be used directly or customized further.

See [Core alone or Studio](../../start/what-is-nocobase.md#core-only-or-core-with-studio) for help choosing.

## Get started

You need Node.js 24 or later and pnpm 11. On Windows, use WSL. To develop with an agent, also choose a coding tool that supports skills.

1. [Create an app](create-app.md): create the project, start it and sign in.
2. [Project structure](project-structure.md): find where each kind of code belongs.
3. [Build your first app](../tutorials/build-your-first-app.md): build a team task application with an agent and try its role-based permissions.
