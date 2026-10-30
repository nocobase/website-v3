---
title: Project structure
description: Find the pages, APIs, migrations, tests and plugins in your application.
---

## Directory overview

[Creating an app](create-app.md) gives you source code you can edit directly. The following shows common development locations in the default application template. Configuration, installed dependencies and build output appear after their respective setup steps.

```text
my-app/
├── client/              # Pages, components and client logic
├── server/              # APIs and business services
├── database/            # Migrations and seeds, grouped by connection
├── cli/                 # Application commands and CLI plugins
├── tests/               # Tests and test helpers
├── public/              # Static assets
├── packages/            # Local workspace packages (optional)
├── .agents/
│   ├── rules/           # Project-owned Agent rules
│   └── skills/          # Synchronized dependency Skills (generated)
├── AGENTS.md            # Agent guidance entry
├── config.example.yml   # Configuration example
├── config.yml           # Local configuration (generated during setup)
├── package.json         # Scripts and dependencies
├── pnpm-lock.yaml       # Resolved dependency versions
├── pnpm-workspace.yaml  # Workspace settings
├── node_modules/        # Installed dependencies (generated)
├── dist/                # Build output (generated)
└── storage/             # Runtime data
```

Directories vary with the template version and application features. Create optional directories such as `packages/` when needed, rather than adding empty directories to match the tree.

## Where pages, APIs and data belong

| Change | Main location | How it connects to the application |
| --- | --- | --- |
| Add a page or menu item | `client/pages/` | Register the route and navigation in `client/routes.ts` |
| Reuse UI components or interaction logic | `client/components/`, `client/hooks/` | Import them from pages or other components |
| Change layouts, themes or interface text | `client/layouts/`, `client/theme/`, `client/locales/` | Edit the corresponding layout, theme or language resources |
| Add static assets such as images | `public/` | Reference their URLs in pages or styles |
| Add an HTTP API | `server/routes/` | Register it in `server/routes/index.ts` |
| Extract a business service | Create `server/services/` as needed | Call it from routes; use `server/providers/` when it needs service registration and lifecycle management |
| Create or change database tables | `database/main/migrations/` | Add a migration for the application to execute |
| Prepare initial data | `database/main/seeds/` | Add initialization logic |
| Add an application command | Create `cli/commands/` as needed | Follow the application's CLI command directory conventions |

Connect pages and APIs to their registration entries: adding a file alone does not make it accessible. UI source installed in `client/extensions/` also belongs to the application and connects to pages or components through imports.

`database/` groups resources by connection name; `main` is the default connection. Keep migrations that have already run and add new ones for later schema changes. See [Tables and initial data](../developing-apps/data-models-and-migrations.md) for implementation details.

For example, task management typically involves a table migration, API routes, a page and the corresponding registration files. Follow [Build your first app](../tutorials/build-your-first-app.md) to see how these locations fit a working feature.

## Configuration, dependencies and plugins

### Configuration files

| Location | Purpose |
| --- | --- |
| `config.example.yml` | A configuration example to commit, without real credentials |
| `config.yml` | Database connections, secrets and other settings for the current environment; keep it out of Git |
| `server/config/` | Configuration defaults, validation and environment variable mappings defined in code |

Use `config.yml` to change connection details for the current environment. Update definitions in `server/config/` when adding configuration options for your business logic. See [Application configuration](../developing-apps/configuration-and-settings.md) for loading behavior and commands.

### Dependencies and plugin registration

`package.json` contains development, test and build scripts alongside dependency declarations. `pnpm-lock.yaml` records resolved dependency versions and belongs in source control.

The template provides capabilities such as users, authentication, authorization and files through plugins. `package.json` shows which packages are installed; the registration files show which contributions are connected:

| File | Registration |
| --- | --- |
| `client/plugins.ts` | Client plugins |
| `server/plugins.ts` | Server plugins |
| `cli/plugins.ts` | CLI plugins |

A plugin may not provide all three entries, and some packages supply only development Skills. Installing dependencies, registering plugins and integrating pages are separate steps. See [Manage plugins](../developing-apps/manage-plugins.md) for instructions and the [Plugin index](../reference/plugins.md) for individual capabilities.

Keep local plugins or shared packages in `packages/` and configure workspace package directories in `pnpm-workspace.yaml`. You can also maintain a UI Registry package there when distributing UI source assets independently. See [Project directory and file conventions](../reference/project-conventions.md#local-plugins-shared-packages-and-ui-assets) for the detailed structure.

## Where tests belong

Tests live in `tests/`, organized by the code they verify:

| Directory | Contents |
| --- | --- |
| `tests/client/` | Pages, components and client logic |
| `tests/server/` | APIs, services and permissions |
| `tests/database/` | Migrations, initial data and database behavior |
| `tests/cli/` | Application commands; create as needed |
| `tests/project/` | Project configuration and builds |
| `tests/fixtures/`, `tests/helpers/`, `tests/setup/` | Test data, shared helpers and environment setup |
| `tests/playwright/` | Browser interaction tests; create as needed |

Run `pnpm test` from the application root for Vitest tests. Browser tests use `pnpm test:e2e` and require a running application and sign-in details as specified in the test configuration. See [Testing and acceptance](../developing-apps/testing-and-acceptance.md) for setup instructions.

Existing projects may use different directories; follow their `vitest.config.ts` and `playwright.config.ts`. Check the actual test count in the report: a successful exit with no tests does not verify the feature.

## Guidance the agent reads

`AGENTS.md` is the entry point for application development guidance. Distinguish project-owned conventions from Skills supplied by dependencies:

| Location | Maintenance |
| --- | --- |
| `AGENTS.md`, `.agents/rules/` | Maintain and commit the project's development conventions with its source |
| `.agents/skills/` | Synchronized from dependencies; do not edit or commit these copies |

Add business conventions to the project guidance. Run `pnpm nocobase skills sync` in the application directory to refresh Skills from dependencies. See [Develop with an agent](../developing-apps/develop-with-an-agent.md#keep-project-conventions) for details.

## Generated files and runtime data

The following are not maintained as business source code:

| Location | How to manage it |
| --- | --- |
| `node_modules/` | Install and update through the package manager; do not edit dependency files directly |
| `dist/` | Generate with `pnpm build`; change source code and rebuild |
| `database/<connection>/collections/` | Database structure snapshots; update with `pnpm nocobase collections generate` rather than editing by hand |
| `storage/` | Runtime data that may include uploads, logs or database files; preserve and back it up according to the configuration |

The connection configuration determines where SQLite stores its database, which may also be in the application root. Do not delete database files or business data in `storage/` as though they were build caches. See [Project directory and file conventions](../reference/project-conventions.md) for the complete path reference.
