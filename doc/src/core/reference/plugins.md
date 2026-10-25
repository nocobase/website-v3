---
title: Plugin overview
description: NocoBase 3 plugins, their purposes and whether they are built in.
---

This inventory covers all application plugins in the reviewed source: 24 in the main repository, 2 in the commercial repository, and 19 example plugins. Entries are alphabetical by package name, with links where source is public.

“Built-in plugin” indicates whether the default template includes the plugin when creating an application. Included plugins are marked “Yes”; plugins that require separate installation are marked “No”. Check the application’s plugin registration files to determine whether a plugin is enabled. See [Manage plugins](../developing-apps/manage-plugins.md) for registration, removal and updates.

## Main repository plugins

| Package | Purpose | Built-in plugin |
| --- | --- | --- |
| [`@nocobase/app-plugin-agent-sessions`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-agent-sessions) | Connect local coding agents and manage browser conversations, transcripts and work artifacts. | No |
| [`@nocobase/app-plugin-agents`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-agents) | Manage agents, model services, runs, conversations and runners. | Yes |
| [`@nocobase/app-plugin-api-keys`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-api-keys) | Authenticate API requests with API keys. | Yes |
| [`@nocobase/app-plugin-authentication`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authentication) | Provide sign-in, sessions and authentication integration. | Yes |
| [`@nocobase/app-plugin-authorization`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authorization) | Declare business permissions, enforce access decisions and provide permission management UI. | Yes |
| [`@nocobase/app-plugin-authz-default-access`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-default-access) | Configure default data access scopes for business resources. | Yes |
| [`@nocobase/app-plugin-authz-restriction-rules`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-restriction-rules) | Apply rules that further restrict data access. | Yes |
| [`@nocobase/app-plugin-authz-sharing-rules`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-sharing-rules) | Extend record sharing through rules. | Yes |
| [`@nocobase/app-plugin-database-explorer`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-database-explorer) | Inspect database connections, collections and fields in a read-only browser. | Yes |
| [`@nocobase/app-plugin-demo-mode`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-demo-mode) | Provide repeatable demo datasets, visitor accounts and write protection. | No |
| [`@nocobase/app-plugin-file`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-file) | Provide file repositories, upload and content APIs, and application-owned file components. | Yes |
| [`@nocobase/app-plugin-foundation`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-foundation) | Show the Core capabilities used by an application and their runtime evidence. | Yes |
| [`@nocobase/app-plugin-i18n`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-i18n) | Integrate localization and application language switching. | Yes |
| [`@nocobase/app-plugin-knowledge`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-knowledge) | Manage Markdown spaces, versions, search, proposals and review. | Yes |
| [`@nocobase/app-plugin-mail`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-mail) | Provide mail sending, resumable mailbox synchronization and provider extensions. | Yes |
| [`@nocobase/app-plugin-notification`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification) | Provide notification storage, delivery runtime and logs. | Yes |
| [`@nocobase/app-plugin-notification-in-app`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-in-app) | Provide an in-app notification channel, authenticated inbox APIs and client capabilities. | Yes |
| [`@nocobase/app-plugin-notification-providers`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-providers) | Provide built-in notification channels and providers. | Yes |
| [`@nocobase/app-plugin-notification-web-push`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-web-push) | Manage browser push subscriptions and deliver Web Push notifications. | No |
| [`@nocobase/app-plugin-projects`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-projects) | Manage projects, issues and development collaboration. | No |
| [`@nocobase/app-plugin-releases`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-releases) | Manage applications, releases, environments and pluggable deployment drivers. | No |
| [`@nocobase/app-plugin-scheduler`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-scheduler) | Declare schedules in code and provide execution records and enable/disable APIs. | Yes |
| [`@nocobase/app-plugin-template-print`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-template-print) | Provide Agent Skills for implementing DOCX and PDF template printing. | Yes |
| [`@nocobase/app-plugin-users`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-users) | Provide user administration APIs and pages. | Yes |

`app-plugin-template-print` currently ships Skills without Client, Server or CLI runtime entry points, so it does not belong in plugin registration arrays. `agents` and `knowledge` are dependencies of the default template but are not registered by default.

## Commercial repository plugins

These commercial plugins are not included in the default template. Use is subject to your applicable license.

| Package | Purpose |
| --- | --- |
| `@nocobase/app-plugin-approval` | Bind human approval tasks to record lifecycles, with policies and outcomes. |
| `@nocobase/app-plugin-task-center` | Index personal tasks from multiple business sources, with query APIs and reusable UI. |

## Example plugins

Example plugins demonstrate integration and extension patterns under each repository’s `packages/examples/`. They are not included in the default template and serve as implementation references.

| Example plugin | Demonstrates |
| --- | --- |
| `@nocobase/app-plugin-approval-example` (commercial repository) | An approval center and approval scenario verification. |
| [`@nocobase/app-plugin-authorization-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-authorization-example) | Business resources, roles, data scopes, sharing and restrictions. |
| [`@nocobase/app-plugin-cli-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-cli-example) | Extend the application CLI. |
| [`@nocobase/app-plugin-database-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-database-example) | Write database migrations and seeds. |
| [`@nocobase/app-plugin-file-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-file-example) | Attachment collections, upload APIs and file pages. |
| [`@nocobase/app-plugin-jobs-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-jobs-example) | Recurring schedules and one-off background jobs. |
| [`@nocobase/app-plugin-lifecycle-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-lifecycle-example) | Record lifecycles for support tickets and expense reports. |
| [`@nocobase/app-plugin-mail-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-mail-example) | Demonstrate mailbox synchronization and sending with simulated mail providers. |
| [`@nocobase/app-plugin-notification-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-notification-example) | Task assignment and in-app notifications. |
| [`@nocobase/app-plugin-office-flows-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-office-flows-example) | Data usage requests and multi-level document distribution. |
| `@nocobase/app-plugin-pro-example` (commercial repository) | Exercise the commercial plugin build, packaging and release pipeline. |
| [`@nocobase/app-plugin-queue-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-queue-example) | Publish and consume queue messages. |
| [`@nocobase/app-plugin-realtime-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-realtime-example) | Realtime updates for collaborative tasks, personal notifications and background exports. |
| [`@nocobase/app-plugin-registry-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-registry-example) | Plugin runtime UI and application-owned UI components. |
| [`@nocobase/app-plugin-repository-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-repository-example) | Relational Repository APIs for CRM and orders. |
| [`@nocobase/app-plugin-routes-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-routes-example) | Server APIs and lazy client routes. |
| [`@nocobase/app-plugin-service-provider-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-service-provider-example) | Register services and manage their lifecycle. |
| [`@nocobase/app-plugin-skills-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-skills-example) | Provide Agent Skills for a plugin. |
| [`@nocobase/app-plugin-template-print-example`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/examples/app-plugin-template-print-example) | Print DOCX and PDF from authorized invoice data. |

## Database dialects

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
