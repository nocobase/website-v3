---
title: Coming from NocoBase 2
description: What people who have used NocoBase 2 most want to know: what changed in the approach, where the plugin manager and the configuration screens went, and what each NocoBase 2 feature maps to in 3.
---

## The difference in one sentence

In NocoBase 2, tables, pages, permissions, and workflows exist as **configuration** stored in the database, and the platform reads that configuration to render the interface. In NocoBase 3, they are all **code**, in your own repository, written by agents. NocoBase provides the runtime, plugins, and foundation libraries as npm packages.

Once changes are code, you can manage them like code: develop on a branch, review, test, release by version, and roll back when something goes wrong. When the platform lacks a capability, an agent can write it directly, so you are no longer limited by the configuration screens.

## How things used to be done, and how they are done now

| In NocoBase 2 | In NocoBase 3 |
| --- | --- |
| Enable a plugin in the plugin manager | Register the plugin in the app's plugin lists, usually done by an agent with `pnpm nocobase plugin register`. See [Manage plugins](../core/developing-apps/manage-plugins.md) |
| Configure it on the plugin's settings page | Three places: deployment settings (database, storage, mail provider) go in `config.yml`; business rules are written into the code by agents; what administrators adjust day to day (users, roles, data scopes, approvers, amount thresholds) lives in the app's **System settings** |
| Drag and drop pages and blocks in the interface | Describe the page to an agent, and it writes the page as code using components from the UI library |
| Configure processes on the workflow canvas | Processes are written in code (record lifecycle). Administrators view the flow chart, adjust workflow parameters, and check execution records in **Workflow management**. |
| Create tables and add fields in data source management | Agents write migration files, and `pnpm nocobase db apply` runs them |
| Changes take effect as soon as they are saved | Changes are code, and take effect after development, verification, and deployment |
| AI employees | Business agents, connected by the Agents plugin, using the same roles and permissions as people |

### Do plugins still have a UI?

Yes, in a different form. A plugin brings server-side capabilities, skills, and commands to the app, and a few plugins ship their own pages (for example **App foundation**). More of the interface comes as UI components that agents place into your pages. The admin entry points are collected in the app's **System settings**, and agents build them by default when they deliver an app.

To see which plugins an app uses, open **System settings › App foundation**. It lists the Core capabilities the app actually uses and the packages that provide them.

## What each NocoBase 2 feature maps to in 3

| NocoBase 2 | NocoBase 3 | Notes |
| --- | --- | --- |
| Users, roles, and permissions | The authentication, users, and authorization plugins, plus three plugins for default data scopes, sharing rules, and restriction rules | Enabled in the default template, which ships with the **User management**, **Roles and permissions**, and **Default data scopes** pages |
| Data sources and collections | The database foundation library and migrations; an external database is connected as a second connection | Supports SQLite, PostgreSQL, MySQL, SQL Server, and Oracle; Dameng, KingbaseES, and OceanBase are in the commercial editions |
| File manager | The file plugin and the storage foundation library | Local storage, S3-compatible storage, and Alibaba Cloud OSS |
| Workflows | Record lifecycle (a foundation library) and the scheduled tasks plugin | Process structure is written in code, with no drag-and-drop designer |
| Approvals | The approval plugin <span class="tag pro">Commercial</span> | Multi-level, all-must-approve, any-can-approve, add approver, transfer, and send back |
| Notifications and in-app messages | The notification, in-app message, and notification channel plugins | In-app messages; email (SMTP, Resend); Feishu and DingTalk group bots |
| Email management | The mail plugin | Link personal mailboxes, then send, receive, and sync email |
| AI employees and AI knowledge base | The Agents plugin and the knowledge base plugin | Installed in the default template; register them when needed |
| Localization and themes | The localization plugin; themes are in the template | |
| API keys | The API keys plugin | Enabled in the default template |
| Template printing | The template printing skill pack | Guidance for agents only. The agent implements it in the app |
| Charts, import and export, and other blocks | Implemented in the app by agents | The UI library provides components such as data tables and dashboards |
| Audit logs | Not available yet | The audit item in **App foundation** shows that no provider has been detected yet |
| LDAP, SAML, DingTalk, WeCom, Feishu, Slack, and other sign-in methods | Authentication plugin | All supported. The authentication plugin is built on Better Auth, and enterprise identity and social sign-in are connected through configuration |

See [Manage plugins](../core/developing-apps/manage-plugins.md) to inspect, register, update, or remove the plugins used by an app.

## Can a NocoBase 2 app move to 3?

The two are structured differently: in 2 the business definitions are configuration in the database, and in 3 they are code, so an app cannot be upgraded in place. Moving to 3 means rebuilding the app on 3 and then importing the business data.

> [!PENDING] Migration path to be added
> This section will be filled in once the official migration method and tools, and the maintenance plan for NocoBase 2, are confirmed.

## Next

- [What is Core](../core/getting-started/what-is-core.md): build an overall picture of NocoBase 3
- [Manage plugins](../core/developing-apps/manage-plugins.md): what plugins bring to an app, and where the admin entry points are
