---
title: Database resources and migrations
description: Declare a plugin's migration and Seed resources, have the application run them centrally, and verify the plugin's build, installation and upgrades.
---

Plugins and applications share `defineMigration()`, `defineSeed()`, Repository and the transaction mechanism. What differs for a plugin is that its resources are maintained in a separate package, handed to the application through its Server declaration, and built and delivered with the plugin's versions; a plugin does not imply a database of its own.

This guide focuses on how a plugin connects its database resources. For the complete practice of creating tables and initializing data, see [Create tables and initialize data](../developing-apps/data-models-and-migrations.md); for the shared APIs and execution rules, see [Database migrations](../framework/database/migrations.md) and [Seed data](../framework/database/seeds.md).

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

When creating a new plugin, choose the `database` capability in the App root:

```bash
pnpm create @nocobase/plugin@beta notice-data --with database
```

An existing plugin keeps its implementation and only adds the database directories and declarations, without being recreated. The paths below are relative to `packages/app-plugin-notice-data/`:

```text
server/
├── index.ts
└── plugin.ts
database/
├── migrations/
└── seeds/
```

The `.ts.example` files the generator creates are only drafts and are never executed. Write the `.ts` files your requirements need; when no initial records are needed, the Seed directory can stay empty.

`server/plugin.ts` declares the resources the plugin owns, and `server/index.ts` exports the Server entry. Below is the declaration with only the database capability; an existing plugin should keep its other contributions:

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

`baseDir` must be an absolute path, and resource paths are relative to it. When running source, it points to the plugin root; after compilation, starting from `dist/server/plugin.js`, it points to the migrations and Seeds in `dist/`. Do not hard-code paths from a development machine. Creating directories, declaring resources and running tasks are three separate steps.

## Write migrations

Migrations go in `database/migrations/` and use the same `defineMigration()` as applications. Write tables, fields, indexes and data changes during upgrades following [Database migrations](../framework/database/migrations.md); there is no plugin-specific database API.

Keep the file name and the declared `name` consistent and include the plugin's identifier, for example `202610260001_notice_data_create_entries`. The application merges tasks from every source and sorts them by name, so names must be unique across the application and all plugins, and a plugin's migrations are not an independently executed group. If you depend on another plugin's data structures, state the prerequisite version and migration order explicitly.

Migrations must be self-contained, and files already delivered stay unchanged. Later changes are made by adding new migrations, not by editing old files to upgrade existing applications. Rolling back may delete data and needs separate assessment; never run table creation logic when a Provider starts.

## Initial data

Fixed records the plugin needs to run go in `database/seeds/`, default-exporting a `defineSeed()` declaration. Their names likewise include the plugin identifier and match the file names. The resource path is already declared by `database.seeds` above, so no other registration mechanism is needed. For how to write them, see [Defining a seed](../framework/database/seeds.md#defining-a-seed).

The structures a Seed depends on are created by migrations first. Identify records by stable business keys and database unique constraints, and decide explicitly whether existing data is skipped, reported as an error, or updated only in fields the plugin owns; never overwrite administrators' changes unconditionally. Tasks that succeeded are skipped according to their history, delivered Seeds stay unchanged, and later changes come as new files.

Seeds have no equivalent of a migration's `down()`. Records users create should be written through business services, demonstration data belongs in test fixtures, and data backfills during upgrades should be designed as migrations for their business purpose. Do not put all of these into published Seeds.

## Register and apply in the App

Connect the plugin's Server entry first, then look at the current application's overall execution plan. Run the following commands in the App root:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

`--no-install` requires the local plugin to already be a workspace dependency the application can resolve. `db apply` runs migrations first and Seeds second; the plan includes pending tasks of the application and every registered plugin, not just the current plugin. Review the output before running it, and do not use `db reset` in place of routine upgrades.

Resource declarations do not expose CRUD APIs or add menus automatically. Runtime reads and writes still use the application's database capabilities through server business services; for the methods, see [Querying and manipulating data](../developing-apps/querying-data.md) and [Transactions and data consistency](../developing-apps/transactions-and-consistency.md).

## Test against a real database

The plugin's database tests go in `tests/database/` and reuse `@nocobase/app-testing/server`. With `describeMigration()`, use the plugin's migration directory and package name as the source; if you depend on another plugin's collections, also provide the prerequisite migration sources. Verify the real database structure after applying, rolling back and reapplying, rather than only checking that files can be imported.

For Seeds, verify first installation, existing records, repeated runs, recovery from failure, and whether users' changes are kept during upgrades. Use an isolated test database and the real implementation; for test tools and examples, see [Database and CLI tests](../developing-apps/testing-and-acceptance.md#database-and-cli-tests).

## Check builds and upgrades

Keep the scaffold's plugin build steps: run `nocobase-db-manifests` after TypeScript compilation, so source and compiled tasks use matching checksum manifests. Do not edit the manifests by hand or skip this step.

In the App root, run the plugin's checks and the application's build:

```bash
pnpm --filter @nocobase/app-plugin-notice-data check
pnpm build
```

Check `dist/database/migrations/`, any `dist/database/seeds/` actually used, and the manifests in the plugin's output and published package, and confirm the compiled Server entry can locate these resources. Before delivery, verify both paths: installing on an empty database and upgrading from an older version; passing only against workspace source does not mean the installed package works.

Removing the plugin's registration does not delete existing structures and data automatically; keeping, cleaning up data and rolling back migrations need separate decisions. For more delivery checks, see [Testing and verification](testing-and-verification.md) and [Build and publish](publish-plugin.md).
