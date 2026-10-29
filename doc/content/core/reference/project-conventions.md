---
title: Directory and file conventions
description: Look up app, plugin and UI source asset entry points, optional directories, generated files and ownership.
---

Read [Project structure](../getting-started/project-structure.md) for an introduction. This reference maps paths to responsibilities and maintenance rules. File names illustrate conventions; adjust optional directories to the template and feature.

## Application directories

```tree
my-app/
├── .agents/
│   ├── rules/                    # Project-owned rules
│   └── skills/                   # Synchronized dependency Skills (generated)
├── cli/
│   ├── commands/                 # App commands (optional)
│   └── plugins.ts                # CLI plugin registration
├── client/
│   ├── pages/                    # Business pages
│   ├── layouts/                  # Page layouts
│   ├── components/               # UI components
│   ├── hooks/                    # Shared interaction and state logic
│   ├── locales/                  # Translations
│   ├── theme/                    # Theme and styles
│   ├── routes.ts                 # Routes, menus and navigation
│   ├── plugins.ts                # Client plugin registration
│   └── runtime.ts                # Client assembly
├── database/
│   └── main/
│       ├── migrations/           # Schema and metadata changes
│       ├── seeds/                # Initial data
│       ├── metadata/             # External-connection metadata (optional)
│       └── collections/          # Resolved model snapshots (generated)
├── packages/                     # Workspace packages (optional)
├── public/                       # Static assets
├── server/
│   ├── routes/                   # HTTP routes and index.ts registration
│   ├── services/                 # Business implementations (optional)
│   ├── providers/                # Service registration and lifecycle
│   ├── config/                   # Defaults, validation and environment mappings
│   ├── plugins.ts                # Server plugin registration
│   └── runtime.ts                # Server assembly
├── tests/                        # Tests, fixtures and helpers
├── storage/                      # Runtime data (generated)
├── dist/                         # Build output (generated)
├── node_modules/                 # Installed dependencies (generated)
├── AGENTS.md                     # Project guidance entry
├── config.example.yml            # Configuration example
├── config.yml                    # Local/deployment configuration
├── components.json               # shadcn configuration
├── package.json                  # Scripts, dependencies and app metadata
├── pnpm-lock.yaml                # Resolved dependency versions
└── pnpm-workspace.yaml           # Workspace package directories
```

Create service directories, commands, local packages and external-database metadata only as needed. Empty directories are unnecessary. Template layouts, themes and runtime entries are application-owned source; preserve their business customizations during upgrades.

## Implementation and registration

| Content | Implementation | Integration |
| --- | --- | --- |
| Pages | `client/pages/` | `client/routes.ts` |
| Components and Hooks | `client/components/`, `client/hooks/` | Imported by pages, layouts or components |
| HTTP APIs | `server/routes/` | `server/routes/index.ts` and runtime route declarations |
| Business services | Optional client/server `services/` directories | Each side's ServiceProviders and provider index |
| Runtime configuration | `server/config/<section>.ts` | `server/config/index.ts` |
| Application commands | `cli/commands/` | Loaded by file path under the `app` namespace |
| Plugins | Installed packages or `packages/app-plugin-<name>/` | The entries actually provided in `client/plugins.ts`, `server/plugins.ts` and `cli/plugins.ts` |

`runtime.ts` assembles the runtime. When the template already connects an aggregate entry, adding business code usually only requires updating that entry. Dependency installation and plugin registration are separate; see [Manage plugins](../developing-apps/manage-plugins.md).

## Database resources

Applications organize resources by connection in `database/<connection>/`; not every resource belongs to `main`.

- `migrations/` is executable change history. Preserve executed migrations and add new ones for later schema changes.
- `seeds/` maintains initial data. Distinguish required data from samples.
- `metadata/` can hold source-controlled titles, descriptions and relationships for external databases.
- `collections/` is a generated inspection snapshot, not migration input. Regenerate it with `pnpm nocobase collections generate` rather than editing it.

A plugin's `database/migrations/` and `database/seeds/` are resources contributed through its declaration. See [Database resources and migrations](../extension-development/database-and-migrations.md) for paths and connection ownership.

## Local plugins, shared packages and UI assets

```tree
packages/
├── app-plugin-orders/            # Runtime plugin
│   ├── client/
│   │   ├── components/
│   │   ├── react-providers/      # React context integration
│   │   ├── providers/            # Client ServiceProviders
│   │   ├── plugin.ts
│   │   └── index.ts              # Public Client entry
│   ├── server/
│   │   ├── services/
│   │   ├── providers/            # Server ServiceProviders
│   │   ├── tokens.ts             # Public service contracts
│   │   ├── plugin.ts
│   │   └── index.ts              # Public Server entry
│   ├── cli/
│   ├── database/
│   ├── skills/
│   ├── tests/
│   ├── AGENTS.md
│   └── package.json
├── orders-ui/                    # Independent UI Registry package
│   ├── registry/
│   ├── registry.json
│   ├── public/r/                 # Built item JSON (generated)
│   └── package.json
└── shared-domain/                # Internal shared code (optional)
    └── package.json
```

Plugins provide Client, Server, CLI, database and Skills contributions as needed; not every directory is required. See [Plugin structure](../extension-development/plugin-structure.md).

Apps and plugins can freely organize frontend components, using shadcn primitives and consulting the NocoBase UI Library for modular interfaces. Maintain assets in an independent Registry package when delivering editable source for Agents. Relative imports between co-distributed files must remain valid at installation targets. Use public package entries or consumer-supplied data for plugin capabilities, rather than relative imports into a neighboring plugin's private implementation.

## Agent guidance ownership

| Path | Audience and maintenance |
| --- | --- |
| App `AGENTS.md` and `.agents/rules/` | Agents maintaining the current app; maintained by the app |
| Plugin `AGENTS.md` | Agents maintaining plugin source; maintained by the plugin |
| Plugin `skills/<name>/SKILL.md` | Agents consuming the plugin in an app; distributed with the plugin |
| App `.agents/skills/` | Synchronized dependency copies; update their source package and synchronize again |

`pnpm nocobase skills sync` refreshes dependency-provided guidance. See [Plugin Skills](../extension-development/write-plugin-skills.md).

## Generated files and configuration

- `dist/`: reproducible application build output; fix its source rather than maintaining it directly.
- `node_modules/`: installed dependencies, updated through the package manager and lockfile.
- `storage/`: may contain databases, uploads and other business data. Generated does not mean disposable.
- `config.example.yml`: a committed configuration example without real credentials.
- `config.yml`: environment-specific configuration; keep real keys and passwords out of source control.
- `pnpm-lock.yaml`: commit the lockfile to reproduce installations.

This reference follows the templates and plugin declarations in Core `015404ecd0db` and the verified beta.83 default application. See [Configuration reference](configuration.md) and the [Core package index](packages.md).
