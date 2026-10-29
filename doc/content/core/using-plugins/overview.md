---
title: Using plugins overview
description: Find NocoBase plugins by function and learn about their purposes, configuration and usage.
---

NocoBase provides plugins for users, authentication, permissions, files, notifications, Agents and other common application features. This section covers what each plugin does, how to configure it, and how to use its pages, components, APIs, services or Skills in your application.

Use the categories below to find the plugins you need. For shared installation, registration, update and removal procedures, see [Manage plugins](../developing-apps/manage-plugins.md).

## Find plugins by function

This section groups 26 plugins into eight categories: 24 from the main repository and two commercial plugins. Select a plugin name to see its purpose, package name and default-template inclusion in the index. Individual usage guides are being added progressively.

| Category | Plugins | Main uses |
| --- | --- | --- |
| Users and authentication | [User management](../reference/plugins.md#plugin-users), [Authentication](../reference/plugins.md#plugin-authentication), [API keys](../reference/plugins.md#plugin-api-keys) | Manage users, sign in and authenticate API requests |
| Permissions and data access | [Permission management](../reference/plugins.md#plugin-authorization), [Default data access](../reference/plugins.md#plugin-authz-default-access), [Sharing rules](../reference/plugins.md#plugin-authz-sharing-rules), [Restriction rules](../reference/plugins.md#plugin-authz-restriction-rules) | Control permitted operations and access to records |
| Data and files | [Database explorer](../reference/plugins.md#plugin-database-explorer), [File management](../reference/plugins.md#plugin-file) | Inspect database structure, upload and access files |
| Messages and notifications | [Notifications](../reference/plugins.md#plugin-notification), [Notification providers](../reference/plugins.md#plugin-notification-providers), [In-app notifications](../reference/plugins.md#plugin-notification-in-app), [Web push](../reference/plugins.md#plugin-notification-web-push), [Email](../reference/plugins.md#plugin-mail) | Send messages, receive notifications and work with email |
| Agents and knowledge | [Agents](../reference/plugins.md#plugin-agents), [Agent sessions](../reference/plugins.md#plugin-agent-sessions), [Knowledge base](../reference/plugins.md#plugin-knowledge) | Use Agents, manage coding sessions and maintain knowledge documents |
| Business collaboration | [Project management](../reference/plugins.md#plugin-projects), [Approvals (commercial)](../reference/plugins.md#plugin-approval), [Task center (commercial)](../reference/plugins.md#plugin-task-center) | Organize project issues, handle approvals and personal tasks |
| Automation and output | [Scheduled tasks](../reference/plugins.md#plugin-scheduler), [Template printing](../reference/plugins.md#plugin-template-print) | Run scheduled work and generate documents and print output |
| Application support | [Localization](../reference/plugins.md#plugin-i18n), [Application foundation](../reference/plugins.md#plugin-foundation), [Release management](../reference/plugins.md#plugin-releases), [Demo mode](../reference/plugins.md#plugin-demo-mode) | Switch languages, inspect runtime information, manage releases and provide demo environments |

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
