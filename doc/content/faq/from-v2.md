---
title: NocoBase 2 and NocoBase 3
---

## Products and development approaches

NocoBase 2 primarily manages no-code pages, collection definitions, permissions, and workflows through platform configuration. A NocoBase 3 Core application maintains pages, APIs, business logic, and database migrations as application source. Core provides the runtime, foundation libraries, and plugins as npm packages, with Skills guiding agents in their use.

Agents or people can maintain the application code. Code changes go through branches, review, testing, and deployment. Day-to-day administration data, such as users and role assignments, can still live in the database and be managed through pages connected by the application; these changes do not always require code edits. See [What Core provides](core-capabilities.md) for the boundary between foundation capabilities and business development.

## AI Portal and Core applications

[AI Portal](https://nocode.docs.nocobase.com/ai-builder/ai-portal/) builds custom interfaces on the data, authentication, permissions, and APIs provided by the no-code platform. The Portal project itself is primarily client code. Its companion agent can also use platform tools to create collections and configure permissions.

A V3 Core application maintains its client, server APIs, business services, and database migrations in its own repository, reusing Core capabilities. The difference is application structure and how the backend is maintained, not simply whether AI writes code. V3 does not carry over V2's no-code page and data-modeling interfaces. See [Tables and data initialization](../core/developing-apps/data-models-and-migrations.md) for schema changes.

## Feature mapping

| NocoBase 2 | NocoBase 3 | Notes |
| --- | --- | --- |
| Users, roles, and permissions | The authentication, users, and authorization plugins, plus three plugins for default data scopes, sharing rules, and restriction rules | The default template registers the relevant plugins; connect administration pages as needed and define business operations and data scopes |
| Data sources and collections | The database foundation library and migrations; an external database is connected as a second connection | Supports SQLite, PostgreSQL, MySQL, SQL Server, and Oracle; Dameng, KingbaseES, and OceanBase are in the commercial editions |
| File manager | The file plugin and the storage foundation library | Local storage, S3-compatible storage, and Alibaba Cloud OSS |
| Workflows | Record lifecycle (a foundation library) and the scheduled tasks plugin | Process structure is written in code, with no drag-and-drop designer |
| Approvals | The approval plugin <span class="tag pro">Commercial</span> | Multi-level, all-must-approve, any-can-approve, add approver, transfer, and send back |
| Notifications and in-app messages | The notification, in-app message, and notification channel plugins | In-app messages; email (SMTP, Resend); Feishu and DingTalk group bots |
| Email management | The mail plugin | Link personal mailboxes, then send, receive, and sync email |
| AI employees and AI knowledge base | The Agents plugin and the knowledge base plugin | Dependencies are included in the default template; register plugins, connect interfaces, and configure models or knowledge sources when needed |
| Localization and themes | The localization plugin; themes are in the template | |
| API keys | The API keys plugin | Enabled in the default template |
| Template printing | The template printing skill pack | Guidance for agents only. The agent implements it in the app |
| Charts, import and export, and other blocks | Implemented in the app by agents | The UI library provides components such as data tables and dashboards |
| Audit logs | Not available yet | The audit item in **App foundation** shows that no provider has been detected yet |
| LDAP, SAML, DingTalk, WeCom, Feishu, Slack, and other sign-in methods | Authentication plugin | Extend Better Auth for the specific provider and protocol, with configuration or development and verification of account mapping and callbacks; not every method is ready out of the box |

See [Manage plugins](../core/developing-apps/manage-plugins.md) to inspect, register, update, or remove the plugins used by an app.

## Will NocoBase 2 continue to receive updates?

Yes. NocoBase 2 and NocoBase 3 are maintained in parallel. The introduction of V3 does not require moving existing V2 applications. See the [official partner information](https://www.nocobase.com/partner/) for this policy and the [NocoBase 2 release timeline](https://nocode.nocobase.com/en/blog/timeline) for features, improvements, and fixes. Their architectures and development approaches differ, so parallel maintenance does not mean every feature will ship in both versions.

## Does NocoBase 3 require NocoBase 2 to be installed?

No. A V3 Core application has its own runtime, database, and foundation capabilities. It can be developed, deployed, and run independently without installing V2.

If you already have a V2 system, you can integrate it with the new application through APIs or other suitable interfaces. This is optional integration, not a V3 runtime dependency. Define identity, data, and permission boundaries as described in [Existing-system integration](existing-systems.md).

## Migrating existing applications

The application structures differ. Changing a version number or image cannot upgrade a V2 application directly into a V3 Core application. Migration generally means rebuilding pages, APIs, data structures, and permissions for the original business requirements, then importing business data.

Inventory tables and relations, roles and data scopes, workflows, attachments, and external integrations before migration. Verify data mappings and actual business operations afterwards. Do not assume no-code configuration, plugin settings, or AI employee configurations can be reused directly. See [Add business AI](business-ai.md) for AI integration and [Backup, recovery, and migration](backup-and-migration.md) for moving data.

The [Core upgrade guide](../core/developing-apps/upgrade-nocobase-core.md) updates framework dependencies and templates within V3 applications. It is not an automatic V2-to-V3 migration tool.
