---
title: Using plugins overview
description: Find NocoBase plugins by function and learn about their purposes, configuration and usage.
---

NocoBase provides plugins for users, authentication, permissions, files, notifications, Agents and other common application features. This section covers what each plugin does, how to configure it, and how to use its pages, components, APIs, services or Skills in your application.

Use the topics below to find the plugins you need. For shared installation, registration, update and removal procedures, see [Manage plugins](../developing-apps/manage-plugins.md).

## Find plugins by function

This section covers 21 plugins. Related features are grouped by topic, while other plugins have individual entries. Select a plugin name to open its usage guide. Pages that are not yet written display a placeholder notice.

| Feature | Usage guides | Main uses |
| --- | --- | --- |
| Users and authentication | [User management](authentication/users.md), [Authentication](authentication/sign-in.md), [API keys](authentication/api-keys.md) | Manage users, sign in and authenticate API requests |
| Permissions and data access | [Permission management](authorization/permissions.md), [Default data access](authorization/default-access.md), [Sharing rules](authorization/sharing-rules.md), [Restriction rules](authorization/restriction-rules.md) | Control permitted operations and access to records |
| Database explorer | [Database explorer](data-and-files/database-explorer.md) | Inspect database connections, tables and fields |
| Files | [Files](data-and-files/file-management.md) | Upload, store and access files |
| Notifications | [Notifications](notifications/notification.md), [Notification providers](notifications/providers.md), [In-app notifications](notifications/in-app.md), [Web push](notifications/web-push.md) | Configure notification channels, deliver notifications and integrate inboxes and browser push |
| Email | [Email](notifications/mail.md) | Send email, synchronize mailboxes and extend mail services |
| Agents | [Agents](agents-and-knowledge/agents.md) | Manage Agents, model services, conversations and execution records |
| Knowledge base | [Knowledge base](agents-and-knowledge/knowledge.md) | Manage document spaces, versions, search and change reviews |
| Approvals (commercial) | [Approvals (commercial)](collaboration/approval.md) | Configure approval policies and handle outcomes |
| Scheduled tasks | [Scheduled tasks](automation/scheduler.md) | Declare schedules, inspect execution records and enable or disable tasks |
| Template printing | [Template printing](automation/template-print.md) | Use Skills to implement DOCX and PDF template printing |
| Localization | [Localization](application-support/i18n.md) | Integrate localization and application language switching |
| Application foundation | [Application foundation](application-support/foundation.md) | Inspect the Core capabilities used by an application and their runtime information |

## Read a plugin's usage guide

When using a plugin, focus on these topics:

- **Features and use cases**: the problems the plugin solves and the capabilities it provides.
- **Integration and configuration**: required dependencies, runtime registration and settings.
- **Usage**: how to use its interfaces, components, APIs, services or Skills.
- **Examples**: how to apply the plugin to a specific business need.
- **Extensions and common questions**: supported customization and solutions to common issues.

Plugins provide different kinds of capabilities. For example, Template printing primarily supplies Skills for implementing DOCX and PDF template printing in an application, while plugins such as User management provide APIs and pages to integrate.

## Related documentation

- [Manage plugins](../developing-apps/manage-plugins.md): install, register, update and remove plugins.
- [Plugin index](../reference/plugins.md): look up full package names, repositories and inclusion in the default template.
- [Develop plugins](../extension-development/when-to-write-a-plugin.md): learn when and how to create your own plugin.
