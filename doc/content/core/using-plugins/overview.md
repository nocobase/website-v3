---
title: Using plugins overview
description: Find NocoBase plugins by function and learn about their purposes, configuration and usage.
---

NocoBase provides plugins for users, authentication, permissions, files, notifications, Agents and other common application features. This section covers what each plugin does, how to configure it, and how to use its pages, components, APIs, services or Skills in your application.

Use the topics below to find the plugins you need. For shared installation, registration, update and removal procedures, see [Manage plugins](../developing-apps/manage-plugins.md).

## Find plugins by function

This section covers 21 plugins. Related features are grouped by topic, while other plugins have individual entries. Each guide covers capabilities, scenarios, implementation, and AI development constraints in four chapters.

| Feature | Usage guides | Main uses |
| --- | --- | --- |
| Users and authentication | [User management](authentication/users.md), [Authentication](authentication/sign-in.md), [API keys](authentication/api-keys.md) | Manage users, sign in and authenticate API requests |
| Permissions and data access | [Permission management](authorization/permissions.md), [Default data access](authorization/default-access.md), [Sharing rules](authorization/sharing-rules.md), [Restriction rules](authorization/restriction-rules.md) | Control permitted operations and access to records |
| Database explorer | [Database explorer](data-and-files/database-explorer.md) | Inspect database connections, tables and fields |
| Files | [Files](data-and-files/file-management.md) | Upload, store and access files |
| Notifications | [Notifications](notifications/notification.md), [Notification providers](notifications/providers.md), [In-app notifications](notifications/in-app.md), [Web push](notifications/web-push.md) | Configure notification channels, deliver notifications and integrate inboxes and browser push |
| Email | [Email](notifications/mail.md) | Send email, synchronize mailboxes and extend mail services |
| Agents | [Agents](agents-and-knowledge/agents.md) | Configure a model API or connect an Agent on a machine for conversations and task execution |
| Knowledge base | [Knowledge base](agents-and-knowledge/knowledge.md) | Manage document spaces, versions, search and change reviews |
| Approvals (commercial) | [Approvals (commercial)](collaboration/approval.md) | Configure approval policies and handle outcomes |
| Scheduled tasks | [Scheduled tasks](automation/scheduler.md) | Declare schedules, inspect execution records and enable or disable tasks |
| Template printing | [Template printing](automation/template-print.md) | Use Skills to implement DOCX and PDF template printing |
| Localization | [Localization](application-support/i18n.md) | Integrate localization and application language switching |
| Application foundation | [Application foundation](application-support/foundation.md) | Inspect the Core capabilities used by an application and their runtime information |

## Before integration

Check the application's actual registrations and installed versions. Installation does not enable a plugin. Some plugins also require configuration factories or application-owned data, pages and permissions.

Paths such as `/client` and `/server` in each guide refer to that package's public exports. Page and HTTP paths are relative to the application mount: an application at `/main` serves `/api/users` at `/main/api/users`. Consult the running application's `/api/swagger/docs` or `/api/swagger` for complete request, response and access contracts.

## Read a plugin's usage guide

Each plugin guide follows four chapters:

1. **Capabilities**: the problem, supplied pages, components, APIs, services or Skills, and application responsibilities.
2. **Scenarios and examples**: a business need, development prompts for a Coding Agent, usage steps and completion criteria.
3. **Key principles and implementation**: integration areas, code and configuration changes, interface changes and important mechanisms.
4. **AI development constraints and verification**: plugin-specific boundaries, common mistakes and acceptance requirements.

Development prompts target a Coding Agent working in the current application directory. Have it read `AGENTS.md`, application rules and relevant Skills shipped with installed versions first. Where no development Skill exists, use public interfaces, types and documentation. Chapter four addresses reliable AI-assisted integration; it does not require the plugin itself to have AI features. See [Develop with an Agent](../getting-started/develop-with-an-agent.md) and [Testing and acceptance](../developing-apps/testing-and-acceptance.md) for shared workflows.

Plugins provide different kinds of capabilities. Template printing supplies implementation guidance. User management supplies administration APIs and an invitation page, while the application owns its administration UI. Knowledge base and Application foundation provide registrable pages. Each guide explains ownership of pages, data and business logic.

These guides were checked against source on 2026-10-28, using main-repository revision [`015404ecd`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins) and the commercial approval plugin's public contracts. [Agents](agents-and-knowledge/agents.md) has a separately verified application baseline, screenshots and source download. Installed versions may differ. Verification steps describe checks for the consuming application; they do not claim that every plugin integration was executed while writing these guides.

## Related documentation

- [Manage plugins](../developing-apps/manage-plugins.md): install, register, update and remove plugins.
- [Plugin index](../reference/plugins.md): look up full package names, repositories and inclusion in the default template.
- [Develop plugins](../extension-development/when-to-write-a-plugin.md): learn when and how to create your own plugin.
