---
title: Plugin directory
nav: Plugin directory overview
description: Every NocoBase 3 plugin, plus the most-used foundation libraries: what each does, whether it is open source or commercial, and whether the default template has it. Open one to see what it provides, how it looks in the app, and how to ask an agent to use it.
---

For what a plugin is and how it gets into an app, see [How plugins work](../intro/how-plugins-work.md). If you want to look things up by business need, it is faster to start from the [Capabilities overview](../capabilities/index.md).

## How to read these tables

- **Edition**: <span class="tag">Open source</span> is in NocoBase's open source repository; <span class="tag pro">Commercial</span> needs the matching license.
- **Default template**: in an app created from the default template, <span class="tag ok">Enabled</span> means it is already listed in the plugin manifest; <span class="tag">Installed, not registered</span> means the package is already in the dependencies and you only need to register it when needed; — means it needs to be installed.
- The "Profile" on each plugin page is generated from the code by a script, and version numbers match the `v3-develop` branch on 2026-10-23.

## Users and permissions

| Plugin | What it does | Edition | Default template |
| --- | --- | --- | --- |
| [Authentication](authentication.md) | Sign-in, sign-up, password reset, and sessions, built on Better Auth; enterprise single sign-on (OIDC), social login, and two-factor authentication are added through configuration. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| [Users](users.md) | The APIs and page components for user management: accounts, enabling and deactivating, password reset, invitation links, personal preferences, and role assignment. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| [API keys](api-keys.md) | Reach the app's APIs with an API key, for scripts, external systems, and the command line. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| [Permissions](authorization.md) | Authorization of pages, actions, and data scopes (permission sets, called roles in the UI), and permission checks on the server and in the browser. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| [Default data scope](authz-default-access.md) | Give people who already have action permissions a shared data scope. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| [Sharing rules](authz-sharing-rules.md) | Share specific records with specific people or roles. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| [Restriction rules](authz-restriction-rules.md) | Narrow an existing grant further, for example with an amount cap. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |

## Data and files

| Plugin | What it does | Edition | Default template |
| --- | --- | --- | --- |
| [Database](db.md) (foundation library) | Tables, queries, migrations, and database connections; SQLite, PostgreSQL, MySQL, SQL Server, Oracle. | <span class="tag">Open source</span>; Dameng, KingbaseES, and OceanBase <span class="tag pro">Commercial</span> | SQLite included |
| [Database explorer](database-explorer.md) | A read-only API for browsing database connections, tables, and fields, so the app can build its own pages. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| [Files](file.md) | Upload, storage, preview, and download, with files linked to business records. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| [Template printing](template-print.md) | Skill only: teaches agents to generate documents from Office templates in the app. | <span class="tag">Open source</span> | Installed (skill only) |

## Workflows

| Plugin | What it does | Edition | Default template |
| --- | --- | --- | --- |
| [Record lifecycle](lifecycle.md) (foundation library) | A record's status and transitions are declared in code; every NocoBase 3 workflow is built on it. | <span class="tag">Open source</span> | Included |
| [Scheduled jobs](scheduler.md) | Define scheduled jobs in code and record every run; administrators can view the records and enable or disable jobs. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| [Approvals](approval.md) | Multi-level, all-sign, any-sign, vote-count pass rules, add a signer, transfer, and send back, with the submitted content frozen. | <span class="tag pro">Commercial</span> | — |
| [Task center](task-center.md) | Gathers personal to-dos from every business source, with its own **Task center** page. The Approvals plugin depends on it. | <span class="tag pro">Commercial</span> | — |

## Messaging

| Plugin | What it does | Edition | Default template |
| --- | --- | --- | --- |
| [Notifications](notification.md) | Sending, storing, and delivering notifications, and their logs. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| [In-app messages](notification-in-app.md) | The in-app message channel and the inbox API, used by the template's **Inbox**. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| [Notification channels](notification-providers.md) | SMTP and Resend email, and Feishu and DingTalk group bots. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| [Web Push](notification-web-push.md) | Browser push notifications. | <span class="tag">Open source</span> | — |
| [Email](mail.md) | Connect personal mailboxes to sync, read, reply to, and send email, with correspondence linked to business records. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |

## AI and agents

| Plugin | What it does | Edition | Default template |
| --- | --- | --- | --- |
| [Agents](agents.md) | Business agents: agent definitions, model services, runs and conversations, and the runner that runs agents. | <span class="tag">Open source</span> | <span class="tag">Installed, not registered</span> |
| [Agent sessions](agent-sessions.md) | Chat in the browser with the coding tools on members' own computers, with the conversations and the work they create kept in the app. | <span class="tag">Open source</span> | — |
| [Knowledge base](knowledge.md) | Versioned Markdown documents with search, change proposals, and review, for people and business agents. | <span class="tag">Open source</span> | <span class="tag">Installed, not registered</span> |

## Interface and operations

| Plugin | What it does | Edition | Default template |
| --- | --- | --- | --- |
| [Languages](i18n.md) | Language switching, with text returned by the server switching along with it. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| [App foundation](foundation.md) | The **App foundation** page: which Core building blocks the app uses and which packages provide them. | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |

## Development collaboration

Studio's projects, tasks, and releases are built on these two plugins.

| Plugin | What it does | Edition | Default template |
| --- | --- | --- | --- |
| [Projects](projects.md) | Projects, tasks, and collaboration: status, priority, members, plans, and progress. | <span class="tag">Open source</span> | — |
| [Releases](releases.md) | Apps, versions, environments, and deployments, with deployment done by replaceable drivers. | <span class="tag">Open source</span> | — |

## Plugins that come with pages

Most plugins have no pages. These do, and once registered their pages appear in the app:

| Plugin | Pages |
| --- | --- |
| App foundation | **System settings › App foundation** |
| Agents | Agents, Runtimes, Skills, Usage, Models |
| Agent sessions | Agent sessions |
| Knowledge base | Knowledge |
| Projects | Projects, Tasks, Plans |
| Releases | Apps, Deploy environments |
| Users | The invitation link page |
| Task center <span class="tag pro">Commercial</span> | Task center |

The sign-in, **Users**, **Roles and permissions**, **Default data scopes**, and **Inbox** pages do not belong to a plugin. They are application pages the default template already contains, and they use plugin APIs and UI components.

## Foundation libraries, the UI library, and developer tools

- [Libraries](libraries.md): background jobs, queues, realtime updates, storage, secrets, caching, logging, the language runtime, and more.
- [UI library](ui-library.md): more than 40 components and blocks, copied into the app's source when installed.
- [Developer tools](tools.md): creating apps, creating plugins, the command line, testing tools, the deployment installer, and templates.

If you used a NocoBase 2 plugin and want to know what it maps to in 3, see [Coming from NocoBase 2](../../start/from-v2.md#what-each-nocobase-2-feature-maps-to-in-3).
