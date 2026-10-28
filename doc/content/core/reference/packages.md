---
title: Core and tool package index
description: Find NocoBase Core runtimes, libraries, database dialects and development tools by responsibility.
---

Use this index to map a capability to its package and public source. It is not a dependency list that every application must install; the application's manifest and lockfile determine its dependencies. See the [Plugin index](plugins.md) and [API reference](api.md) for plugins and common interfaces.

## Use this index

- Prefer the runtimes and services already integrated by the application template.
- Import package roots or public subpaths declared in `package.json`, rather than private dependency files under `src/` or `dist/`.
- Keep server libraries in server code; use browser-compatible entries in client code.
- Plugins provide runtime extensions. UI Registry provides editable source installed into the consuming project. Manage their dependencies and updates separately.

## Application runtimes

| Package | Purpose |
| --- | --- |
| [`@nocobase/app-client`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client) | Client applications, routes, services and React extensions |
| [`@nocobase/app-server`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server) | Server applications, HTTP, configuration and resource integration |
| [`@nocobase/app-cli`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli) | Application commands and development/build tooling |
| [`@nocobase/app-websocket`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-websocket) | WebSocket contracts and the Node server adapter |

## Core libraries

| Package | Purpose |
| --- | --- |
| [`@nocobase/api-client`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/api-client) | HTTP requests, streaming responses and remote Repositories |
| [`@nocobase/authorization`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/authorization) | Authorization, permission sets and data scopes |
| [`@nocobase/caching`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching) | Caching interfaces and adapters |
| [`@nocobase/config`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/config) | Configuration sources, parsers and merging |
| [`@nocobase/db`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db) | Data models, queries, migrations, transactions and database extensions |
| [`@nocobase/drive`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive) | File storage and storage drivers |
| [`@nocobase/i18n`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/i18n) | Client and server localization runtime |
| [`@nocobase/jobs`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/jobs) | Background jobs and recurring scheduling |
| [`@nocobase/lifecycle`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/lifecycle) | Record states, transitions and post-commit effects |
| [`@nocobase/logging`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/logging) | Logging interfaces, formats and output |
| [`@nocobase/mailer`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/mailer) | Email delivery through SMTP, Resend and related mechanisms |
| [`@nocobase/queue`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/queue) | Queues, producers and consumers |
| [`@nocobase/realtime`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/realtime) | Realtime messages, client subscriptions and server topic authorization |
| [`@nocobase/repository-input`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/repository-input) | Query input contracts and builders shared by browsers and servers |
| [`@nocobase/secrets`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/secrets) | Versioned keys and sensitive-data encryption |
| [`@nocobase/service-provider`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider) | Service containers, tokens, dependency injection and lifecycle |
| [`@nocobase/session`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/session) | Sessions and session storage |
| [`@nocobase/snowflake`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/snowflake) | Snowflake ID generation |
| [`@nocobase/document-extractor`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/document-extractor) | Isolated document text extraction |
| [`@nocobase/markdown-mermaid`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/markdown-mermaid) | Mermaid diagrams in React Markdown |

## Database dialects

| Package | Purpose |
| --- | --- |
| [`@nocobase/db-sqlite`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-sqlite) | SQLite |
| [`@nocobase/db-postgres`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-postgres) | PostgreSQL |
| [`@nocobase/db-mysql`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-mysql) | MySQL and MariaDB |
| [`@nocobase/db-mssql`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-mssql) | Microsoft SQL Server |
| [`@nocobase/db-oracle`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-oracle) | Oracle Database |

Commercial dialects include `@nocobase/db-dameng`, `@nocobase/db-kingbase` and `@nocobase/db-oceanbase`. See [Database support and version compatibility](compatibility.md) for connection modes and version checks.

## Agent and remote-command packages

| Package | Purpose |
| --- | --- |
| [`@nocobase/acp-bridge`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/acp-bridge) | Connect local coding Agents through ACP |
| [`@nocobase/agent-protocol`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/agent-protocol) | Communication protocols for applications, Runners and remote CLIs |
| [`@nocobase/agent-runner`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/agent-runner) | Connect to applications and claim and execute Agent runs |
| [`@nocobase/app-cli-client`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli-client) | Sign in to applications and call their published remote business commands |
| [`@nocobase/cli-envelope`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/cli-envelope) | CLI JSON output contracts and Node version checks |

## Development and testing tools

| Package | Purpose |
| --- | --- |
| [`@nocobase/app-skills`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-skills) | Skills for app development, upgrades, deployment and plugin development |
| [`@nocobase/app-testing`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/app-testing) | Application and plugin test helpers |
| [`@nocobase/db-testing`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-testing) | Isolated database environments and portable test helpers |
| [`@nocobase/db-testkit`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-testkit) | Shared integration-test contracts for database dialects |
| [`@nocobase/dev-config`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/dev-config) | Shared TypeScript, ESLint, Vitest, Vite and related configuration |
| [`@nocobase/create-app`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/create-app) | Application scaffolding |
| [`@nocobase/create-plugin`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/create-plugin) | Plugin scaffolding |

## Deployment and hosting tools

| Package | Purpose |
| --- | --- |
| [`@nocobase/app-installer`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/app-installer) | Install, upgrade and roll back applications from deployment archives |
| [`@nocobase/app-host`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-host) | Application runtime hosting |
| [`@nocobase/app-host-docker`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-host-docker) | Docker hosting backend for App Host |

## Installation and versions

Use the project lockfile to reproduce dependencies. During upgrades, check the template, runtimes, plugin peer dependencies and database dialects together. Packages have independent version numbers; their major versions do not determine whether they belong to NocoBase 2 or 3.

Create an app with `pnpm create @nocobase/app@beta` and a plugin with `pnpm create @nocobase/plugin@beta`. Their implementation packages are `@nocobase/create-app` and `@nocobase/create-plugin`. See the [Command-line reference](cli.md) for commands within an app.

## Verification scope

Package names, locations and purposes were checked on 2026-10-27 against [Core revision `015404ecd0db`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages). A beta version is not a permanent compatibility baseline; installed public entries and type declarations define the available interfaces.
