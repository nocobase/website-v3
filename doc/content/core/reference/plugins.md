---
title: Plugin index
description: NocoBase 3 plugins, their purposes and whether they are built in.
---

This inventory covers application plugins in the reviewed source: 24 in the main repository and 2 in the commercial repository. Entries are alphabetical by package name, with links where source is public.

“Built-in plugin” indicates whether the default template includes the plugin when creating an application. Included plugins are marked “Yes”; plugins that require separate installation are marked “No”. Check the application’s plugin registration files to determine whether a plugin is enabled. See [Manage plugins](../developing-apps/manage-plugins.md) for registration, removal and updates.

## Main repository plugins

| Package | Purpose | Built-in plugin |
| --- | --- | --- |
| <span id="plugin-agent-sessions"></span>[`@nocobase/app-plugin-agent-sessions`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-agent-sessions) | Connect local coding agents and manage browser conversations, transcripts and work artifacts. | No |
| <span id="plugin-agents"></span>[`@nocobase/app-plugin-agents`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-agents) | Manage agents, model services, runs, conversations and runners. | Yes |
| <span id="plugin-api-keys"></span>[`@nocobase/app-plugin-api-keys`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-api-keys) | Authenticate API requests with API keys. | Yes |
| <span id="plugin-authentication"></span>[`@nocobase/app-plugin-authentication`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authentication) | Provide sign-in, sessions and authentication integration. | Yes |
| <span id="plugin-authorization"></span>[`@nocobase/app-plugin-authorization`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authorization) | Declare business permissions, enforce access decisions and provide permission management UI. | Yes |
| <span id="plugin-authz-default-access"></span>[`@nocobase/app-plugin-authz-default-access`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-default-access) | Configure default data access scopes for business resources. | Yes |
| <span id="plugin-authz-restriction-rules"></span>[`@nocobase/app-plugin-authz-restriction-rules`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-restriction-rules) | Apply rules that further restrict data access. | Yes |
| <span id="plugin-authz-sharing-rules"></span>[`@nocobase/app-plugin-authz-sharing-rules`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-sharing-rules) | Extend record sharing through rules. | Yes |
| <span id="plugin-database-explorer"></span>[`@nocobase/app-plugin-database-explorer`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-database-explorer) | Inspect database connections, collections and fields in a read-only browser. | Yes |
| <span id="plugin-demo-mode"></span>[`@nocobase/app-plugin-demo-mode`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-demo-mode) | Provide repeatable demo datasets, visitor accounts and write protection. | No |
| <span id="plugin-file"></span>[`@nocobase/app-plugin-file`](https://github.com/nocobase/nocobase/tree/d9a625d93b4098c7e2cc664ed01f187178e145d4/packages/plugins/app-plugin-file) | Provide file repositories, upload and content APIs; editable file UI comes from the NocoBase UI Library. | Yes |
| <span id="plugin-foundation"></span>[`@nocobase/app-plugin-foundation`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-foundation) | Show the Core capabilities used by an application and their runtime evidence. | Yes |
| <span id="plugin-i18n"></span>[`@nocobase/app-plugin-i18n`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-i18n) | Integrate localization and application language switching. | Yes |
| <span id="plugin-knowledge"></span>[`@nocobase/app-plugin-knowledge`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-knowledge) | Manage Markdown spaces, versions, search, proposals and review. | Yes |
| <span id="plugin-mail"></span>[`@nocobase/app-plugin-mail`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-mail) | Provide mail sending, resumable mailbox synchronization and provider extensions. | Yes |
| <span id="plugin-notification"></span>[`@nocobase/app-plugin-notification`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification) | Provide notification storage, delivery runtime and logs. | Yes |
| <span id="plugin-notification-in-app"></span>[`@nocobase/app-plugin-notification-in-app`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-in-app) | Provide an in-app notification channel, authenticated inbox APIs and client capabilities. | Yes |
| <span id="plugin-notification-providers"></span>[`@nocobase/app-plugin-notification-providers`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-providers) | Provide built-in notification channels and providers. | Yes |
| <span id="plugin-notification-web-push"></span>[`@nocobase/app-plugin-notification-web-push`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-web-push) | Manage browser push subscriptions and deliver Web Push notifications. | No |
| <span id="plugin-projects"></span>[`@nocobase/app-plugin-projects`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-projects) | Manage projects, issues and development collaboration. | No |
| <span id="plugin-releases"></span>[`@nocobase/app-plugin-releases`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-releases) | Manage applications, releases, environments and pluggable deployment drivers. | No |
| <span id="plugin-scheduler"></span>[`@nocobase/app-plugin-scheduler`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-scheduler) | Declare schedules in code and provide execution records and enable/disable APIs. | Yes |
| <span id="plugin-template-print"></span>[`@nocobase/app-plugin-template-print`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-template-print) | Provide Agent Skills for implementing DOCX and PDF template printing. | Yes |
| <span id="plugin-users"></span>[`@nocobase/app-plugin-users`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-users) | Provide user administration APIs and pages. | Yes |

`app-plugin-template-print` currently ships Skills without Client, Server or CLI runtime entry points, so it does not belong in plugin registration arrays. `agents` and `knowledge` are dependencies of the default template but are not registered by default.

## Commercial repository plugins

These commercial plugins are not included in the default template. Use is subject to your applicable license.

| Package | Purpose |
| --- | --- |
| <span id="plugin-approval"></span>`@nocobase/app-plugin-approval` | Bind human approval tasks to record lifecycles, with policies and outcomes. |
| <span id="plugin-task-center"></span>`@nocobase/app-plugin-task-center` | Index personal tasks from multiple business sources, with query APIs and reusable UI. |

## Database dialects

Dialects are database adapters and integrate differently from application plugins. See [Database support and version compatibility](compatibility.md) for connection modes, test versions and configuration differences, and the [Core and tool package index](packages.md) for other framework libraries and tools.

`@nocobase/db` supports database integrations through the following eight dialect packages: five in the main repository and three in the commercial repository. Package names link to source where it is public.

| Dialect package | Database | Repository |
| --- | --- | --- |
| `@nocobase/db-dameng` | Dameng (DM) | Commercial |
| `@nocobase/db-kingbase` | KingbaseES (PostgreSQL-compatible mode) | Commercial |
| [`@nocobase/db-mssql`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-mssql) | Microsoft SQL Server | Main |
| [`@nocobase/db-mysql`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-mysql) | MySQL | Main |
| `@nocobase/db-oceanbase` | OceanBase CE (MySQL-compatible tenant) | Commercial |
| [`@nocobase/db-oracle`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-oracle) | Oracle Database | Main |
| [`@nocobase/db-postgres`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-postgres) | PostgreSQL | Main |
| [`@nocobase/db-sqlite`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-sqlite) | SQLite | Main |

Commercial dialect packages are distributed through the Pro registry; source access and usage depend on the applicable entitlement. In the reviewed revision, `db-dameng` is marked experimental and its integration contract still needs validation against the chosen Dameng server version.

## Source baseline

Reviewed on 2026-10-25 against [nocobase `db419f1d4`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins) and the commercial plugin source. Default-template status comes from the same main-repository revision. Plugin availability and registration may differ in a released version.

File UI ownership was also checked against source commit [`d9a625d93b40`](https://github.com/nocobase/nocobase/tree/d9a625d93b4098c7e2cc664ed01f187178e145d4). The rest of the inventory and default-template status retain the baseline above.
