---
title: Using plugins overview
description: Find NocoBase plugins by function, and learn what each plugin is for, how to configure it and where to use it.
---

NocoBase provides plugins for users, authentication, permissions, files, notifications, Agents and more, which you can use to build the common features of an application. This section covers what each plugin does, how to configure it, and how to use the pages, components, APIs, services or Skills it provides in your application.

Use the functional categories below to find the plugins you need. For common operations such as installing, registering, updating and removing, see [Manage plugins](../developing-apps/manage-plugins.md).

## Find plugins by function

This section covers 21 plugins: plugins with related functions are grouped by topic, and the others each have their own entry.

| Function | Usage guides | Main uses |
| --- | --- | --- |
| Users and authentication | [User management](authentication/users.md), [Authentication](authentication/sign-in.md), [API keys](authentication/api-keys.md) | Manage users, sign in to the application and authenticate API requests |
| Permissions and data access | [Permission management](authorization/permissions.md), [Default data access](authorization/default-access.md), [Sharing rules](authorization/sharing-rules.md), [Restriction rules](authorization/restriction-rules.md) | Control action permissions and which records can be accessed |
| Database explorer | [Database explorer](data-and-files/database-explorer.md) | Inspect database connections, tables and fields |
| Files | [Files](data-and-files/file-management.md) | Upload, store and access files |
| Notifications | [Notifications](notifications/notification.md), [Notification providers](notifications/providers.md), [In-app notifications](notifications/in-app.md), [Web push](notifications/web-push.md) | Configure notification channels, deliver notifications, and connect inboxes and browser push |
| Email | [Email](notifications/mail.md) | Send mail, synchronize mailboxes and extend mail services |
| Agents | [Agents](agents-and-knowledge/agents.md) | Configure a model API or connect an Agent on a machine, for conversations and task execution |
| Knowledge base | [Knowledge base](agents-and-knowledge/knowledge.md) | Manage document spaces, versions, search and change reviews |
| Approvals (commercial) | [Approvals (commercial)](collaboration/approval.md) | Configure approval policies and handle approval outcomes |
| Scheduled tasks | [Scheduled tasks](automation/scheduler.md) | Declare scheduled jobs, view execution records and enable or disable them |
| Template printing | [Template printing](automation/template-print.md) | Implement DOCX and PDF template printing with Skills |
| Localization | [Localization](application-support/i18n.md) | Connect localization and the application's language switching |
| Application foundation | [Application foundation](application-support/foundation.md) | Inspect the Core capabilities the application uses and its runtime information |

## Confirm before integrating

First check which plugins the application actually registers and their versions, then integrate them following each guide. An installed package is not necessarily enabled; some plugins also require combining factories in the application configuration, or the application declaring business data, pages and permissions.

Paths such as `/client` and `/server` in each guide refer to the plugin package's public exports. Page and HTTP paths are relative to where the application is mounted; for an application at `/main`, for example, `/api/users` is actually served at `/main/api/users`. The complete input, response and permission requirements of an API are given by the running application's `/api/swagger/docs` or `/api/swagger`.

## How to read a plugin usage guide

Every plugin guide follows the same four chapters:

1. **Capabilities**: what problem the plugin solves, which pages, components, APIs, services or Skills it provides, and which parts the application owns.
2. **Scenarios and examples**: a concrete business need, a development prompt for a coding Agent, the steps to use it, and how to tell it is done.
3. **Key principles and implementation**: where the example connects, which code and configuration change, how the interface changes, and the key mechanisms.
4. **AI development constraints and verification**: development boundaries, common pitfalls and acceptance requirements specific to that plugin.

The development prompts are for a coding Agent working in the current application directory. Have it read the project's `AGENTS.md`, the application rules and the relevant Skills shipped with the installed versions first; for capabilities without a development Skill, rely on the public APIs, types and documentation. The fourth chapter is about the constraints when AI helps a developer use the plugin; it does not require the plugin itself to have AI features. For the general collaboration approach and checks, see [Develop with an Agent](../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../developing-apps/testing-and-acceptance.md).

Plugins provide different kinds of capabilities. Template printing, for example, only provides implementation guidance; user management provides administration APIs and an invitation page, while the user management page must be connected by the application; the knowledge base and application foundation provide pages you can register directly. Each guide explains who owns the pages, data and business logic.

These guides were compiled from source checked on 2026-10-28, with the main repository at [`015404ecd`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins) as the baseline; the approvals plugin was checked separately against the commercial plugin's public contracts. [Agents](agents-and-knowledge/agents.md) also has a separately tested application baseline, screenshots and downloadable source. The versions you install may differ; the verification steps in these guides are for checking your own application and do not mean every plugin integration was tested while compiling these docs.

## Related documentation

- [Manage plugins](../developing-apps/manage-plugins.md): install, register, update and remove plugins.
- [Plugin index](../reference/plugins.md): look up full package names, sources and whether the default template includes them.
- [When to write a plugin](../extension-development/when-to-write-a-plugin.md): when you need a plugin of your own, learn when it fits and where to start.
