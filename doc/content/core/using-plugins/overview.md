---
title: Using plugins overview
description: Find NocoBase plugins by function and learn about their purposes, configuration and usage.
---

NocoBase provides plugins for users, authentication, permissions, files, notifications, Agents and other common application features. This section covers what each plugin does, how to configure it, and how to use its pages, components, APIs, services or Skills in your application.

Use the categories below to find the plugins you need. For shared installation, registration, update and removal procedures, see [Manage plugins](../developing-apps/manage-plugins.md).

## Find plugins by function

This section groups 26 plugins into eight categories: 24 from the main repository and two commercial plugins. Select a plugin name to open its usage guide. Pages that are not yet written display a placeholder notice.

| Category | Plugins | Main uses |
| --- | --- | --- |
| Users and authentication | [User management](authentication/users.md), [Authentication](authentication/sign-in.md), [API keys](authentication/api-keys.md) | Manage users, sign in and authenticate API requests |
| Permissions and data access | [Permission management](authorization/permissions.md), [Default data access](authorization/default-access.md), [Sharing rules](authorization/sharing-rules.md), [Restriction rules](authorization/restriction-rules.md) | Control permitted operations and access to records |
| Data and files | [Database explorer](data-and-files/database-explorer.md), [File management](data-and-files/file-management.md) | Inspect database structure, upload and access files |
| Messages and notifications | [Notifications](notifications/notification.md), [Notification providers](notifications/providers.md), [In-app notifications](notifications/in-app.md), [Web push](notifications/web-push.md), [Email](notifications/mail.md) | Send messages, receive notifications and work with email |
| Agents and knowledge | [Agents](agents-and-knowledge/agents.md), [Agent sessions](agents-and-knowledge/agent-sessions.md), [Knowledge base](agents-and-knowledge/knowledge.md) | Use Agents, manage coding sessions and maintain knowledge documents |
| Business collaboration | [Project management](collaboration/projects.md), [Approvals (commercial)](collaboration/approval.md), [Task center (commercial)](collaboration/task-center.md) | Organize project issues, handle approvals and personal tasks |
| Automation and output | [Scheduled tasks](automation/scheduler.md), [Template printing](automation/template-print.md) | Run scheduled work and generate documents and print output |
| Application support | [Localization](application-support/i18n.md), [Application foundation](application-support/foundation.md), [Release management](application-support/releases.md), [Demo mode](application-support/demo-mode.md) | Switch languages, inspect runtime information, manage releases and provide demo environments |

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
