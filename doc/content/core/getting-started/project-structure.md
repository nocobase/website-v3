---
title: Project structure
description: Find the pages, APIs, migrations, tests and plugins in your application.
---

After [Create app](create-app.md), you have an independent application. Most business development happens in `client/`, `server/`, `database/` and `tests/`.

## Directory overview

This overview includes directories generated during installation, development or builds. Exact files depend on your template version.

```text
my-app/
├── .agents/             # Agent rules and Skills
├── cli/                 # Application commands
├── client/              # Pages and UI
├── database/            # Migrations and seeds
├── dist/                # Build output (generated)
├── node_modules/        # Installed dependencies (generated)
├── public/              # Static assets
├── server/              # APIs and services
├── storage/             # Runtime data (generated)
├── tests/               # Application tests
├── AGENTS.md            # Agent guidance entry
├── config.example.yml   # Configuration example
├── config.yml           # Local configuration
└── package.json         # Scripts and dependencies
```

## Where business code belongs

| Directory | What you write |
| --- | --- |
| `client/pages/` | Pages, registered in `client/routes.ts` with their navigation and permissions |
| `client/components/`, `client/hooks/` | Reusable components and hooks |
| `client/locales/` | Application text in English and Chinese |
| `server/routes/` | API endpoints, registered through `index.ts` |
| `server/providers/` | Business services |
| `server/config/` | Application configuration definitions |
| `database/main/migrations/` | Schema changes for the default database connection |
| `database/main/seeds/` | Required initial data |
| `cli/commands/` | Application-specific commands, when needed |

Add a new migration when changing a schema. The generated `database/main/collections/` directory is a schema snapshot; do not edit it. Layouts and themes live in `client/layouts/` and `client/theme/`.

## Preinstalled plugins

The template declares shared capabilities in `package.json`. The table omits the common `@nocobase/app-plugin-` prefix. For example, `users` means `@nocobase/app-plugin-users`. This list reflects the tutorial's generated template; check your own manifest for differences.

| Package | Purpose |
| --- | --- |
| `agents` | Agents, model providers, conversations and runs |
| `api-keys` | API key authentication |
| `authentication` | Sign-in and authentication |
| `authorization` | Authorization and permission management |
| `authz-default-access` | Default data access scopes |
| `authz-restriction-rules` | Data access restrictions |
| `authz-sharing-rules` | Data sharing rules |
| `database-explorer` | Read-only database inspection |
| `file` | File storage, upload and access |
| `foundation` | Installed Core capabilities and runtime information |
| `i18n` | Interface language switching |
| `knowledge` | Document spaces, search and versions |
| `mail` | Sending mail and synchronizing mailboxes |
| `notification` | Notification storage, delivery and logs |
| `notification-in-app` | In-app notifications and inbox |
| `notification-providers` | Built-in notification delivery providers |
| `scheduler` | Scheduled jobs |
| `template-print` | Template printing development Skill |
| `users` | User management APIs and pages |

**Installed does not mean registered.** Dependencies live in `package.json`; `client/plugins.ts`, `server/plugins.ts` and `cli/plugins.ts` register the respective contributions. A plugin may not provide all three entry points. The reference application does not register `agents`, `knowledge` or `template-print` in these lists. `template-print` is a development dependency supplying Agent guidance, not an automatically enabled printing page.

## Tests

The current getting-started example uses default template `1.0.0-beta.81`. Organize tests by the code they verify:

```text
tests/
├── client/              # Pages, components and client logic
├── server/              # APIs, services and permissions
├── database/            # Migrations and seeds
├── cli/                 # Commands (optional)
├── project/             # Project configuration and builds
├── fixtures/            # Test data and fixture applications
├── helpers/             # Shared test helpers
├── setup/               # Test environment setup
└── playwright/          # Browser tests (optional)
```

Run `pnpm test` for Vitest tests and `pnpm test:e2e` separately for browser tests. Older projects may still use `tests/components/` and `tests/logic/`; follow your installed template and its configuration. Prefer real services and isolated databases, using mocks only where necessary. See [Testing and acceptance](../developing-apps/testing-and-acceptance.md) for details.

## Configuration and Agent guidance

`config.example.yml` documents the available configuration. Initialization generates `config.yml` with local database settings and secrets; keep it out of Git. `package.json` contains scripts and dependencies.

`AGENTS.md` is the Agent entry point. Application rules live in `.agents/rules/`. Dependencies synchronize `.agents/skills/`; do not edit those generated files. `node_modules/`, `storage/` and `dist/` hold dependencies, runtime data and build output respectively.

## Next step

Follow [Build your first app](../tutorials/build-your-first-feature.md) to add a task table, API, page and tests.
