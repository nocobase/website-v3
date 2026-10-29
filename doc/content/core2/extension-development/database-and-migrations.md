---
title: Database resources and migrations
description: Declare plugin migration and Seed resources, let the App execute them, and verify builds, installation and upgrades.
---

Plugins and Apps share `defineMigration()`, `defineSeed()`, Repository and transaction mechanisms. A plugin owns resources in a separate package, contributes them through its Server declaration and delivers them with its versioned build. A plugin does not imply a separate database.

This article focuses on plugin integration. See [Create tables and initialize data](../developing-apps/data-models-and-migrations.md) for a complete implementation, and [Migrations](../framework/database/migrations.md) and [Seed data](../framework/database/seeds.md) for shared APIs and execution rules.

## Use an Agent

```text
Check this plugin's database resource integration.
Separate migrations from Seeds and verify the Server declaration, baseDir,
and resource paths in source and compiled output. Avoid task-name collisions
with the App and other plugins. Do not create tables or insert initial records
from Provider startup. Inspect the whole App plan and verify fresh installation,
upgrades from the previous version and loading of compiled resources.
```

## Create the database capability

For a new plugin, select `database` from the App root:

```bash
pnpm create @nocobase/plugin@beta notice-data --with database
```

For an existing plugin, preserve its implementation and add resource directories and declarations without recreating it. Paths below are relative to `packages/app-plugin-notice-data/`:

```text
server/
├── index.ts
└── plugin.ts
database/
├── migrations/
└── seeds/
```

Generated `.ts.example` files are inactive drafts. Write actual `.ts` files for required changes; the Seed directory can remain empty when no initial records are needed.

`server/plugin.ts` declares plugin-owned resources and `server/index.ts` exposes the Server entry. This declaration contains only the database capability; preserve other contributions in an existing plugin:

```ts
import path from 'node:path';
import { defineServerPlugin, type AppServerPlugin } from '@nocobase/app-server/plugins';

const plugin: AppServerPlugin = defineServerPlugin({
  packageName: '@nocobase/app-plugin-notice-data',
  baseDir: path.resolve(import.meta.dirname, '..'),
  database: { migrations: './database/migrations', seeds: './database/seeds' },
});
export default plugin;
```

`baseDir` must be absolute; resource paths resolve against it. Source execution points to the plugin root. Compiled `dist/server/plugin.js` resolves to migrations and Seeds inside `dist/`. Do not hard-code a development-machine path. Creating directories, declaring resources and executing tasks are separate steps.

## Write migrations

Keep migrations in `database/migrations/` and use the same `defineMigration()` as applications. Follow the shared [migration mechanism](../framework/database/migrations.md) for tables, fields, indexes and upgrade-related data changes; there is no separate plugin database API.

Match filenames and declaration names and include a plugin identifier, such as `202610260001_notice_data_create_entries`. The App merges task sources and sorts by name. Names must be unique across the App and all plugins, and one plugin's migrations do not run as an isolated block. State prerequisite versions and migration order when depending on another plugin's schema.

Migrations must be self-contained and delivered files remain immutable. Add migrations for later changes instead of modifying old files to upgrade installed Apps. Rollback may delete data and needs separate assessment. Do not create tables during Provider startup.

## Initial data

Put fixed records required for plugin operation in `database/seeds/`, default-exporting a `defineSeed()` declaration. Match names to filenames and include the plugin identifier. The earlier `database.seeds` field already declares the resource path; no additional registration mechanism is needed. See [Defining a seed](../framework/database/seeds.md#defining-a-seed).

Migrations establish prerequisite schema first. Use stable business keys and database uniqueness, and decide whether existing records are skipped, rejected or updated only in plugin-owned fields. Do not unconditionally overwrite administrator edits. Successful tasks are skipped according to history; delivered Seeds remain immutable, with new files for subsequent changes.

Seeds have no migration-style `down()`. Business services write user-created records, fixtures own demonstration data, and upgrade backfills use migrations as appropriate. Do not put all these operations into published Seeds.

## Register and apply in the App

Register the Server entry, then inspect the whole App execution plan. Run from the App root:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

`--no-install` requires the local plugin to be a resolvable workspace dependency already. `db apply` runs migrations before Seeds. Its plan includes pending tasks from the App and all registered plugins, not just the current plugin. Review the output before applying; do not use `db reset` for routine upgrades.

Declaring resources does not expose CRUD endpoints or add menus. Runtime reads and writes still use the App's database capabilities from Server business services; see [Query and manipulate data](../developing-apps/querying-data.md) and [Transactions and data consistency](../developing-apps/transactions-and-consistency.md).

## Test against a real database

Keep database tests in `tests/database/` and reuse `@nocobase/app-testing/server`. When using `describeMigration()`, supply the plugin migration directory and package name as a source. Include prerequisite sources when depending on another plugin's collections. Verify real structure after application, rollback and reapplication rather than only checking imports.

For Seeds, cover first installation, existing records, repeated execution, failure recovery and preservation of user edits on upgrade. Use an isolated database and production implementations. See [Database and CLI tests](../developing-apps/testing-and-acceptance.md#database-and-cli-tests) for tools and examples.

## Check builds and upgrades

Preserve the scaffold's build steps: run `nocobase-db-manifests` after TypeScript compilation so source and compiled tasks use corresponding checksum manifests. Do not edit manifests manually or omit this step.

Run plugin checks and the App build from the App root:

```bash
pnpm --filter @nocobase/app-plugin-notice-data check
pnpm build
```

Inspect `dist/database/migrations/`, any used `dist/database/seeds/` and their manifests in plugin output and the published package. Confirm the compiled Server entry can locate these resources. Verify both a fresh database and an upgrade from the previous version before delivery; working against workspace source does not prove the installed package works.

Unregistering a plugin does not delete existing schema or data. Retention, cleanup and migration rollback are separate decisions. See [Testing and verification](testing-and-verification.md) and [Build and publish](publish-plugin.md) for further delivery checks.
