---
title: Create tables and initialize data
description: Create an application status dictionary, install defaults and maintain later changes through new migrations and real database tests.
---

In an existing NocoBase application, use a Migration to create a status dictionary and a Seed to install defaults. Here, `appStatuses` stores stable codes and editable titles; a later upgrade adds descriptions. If you need an application, [create one first](../getting-started/create-app.md), or run the [complete example](#example-source-and-running) below.

## Directory and file conventions

Place these files under the application root. The example uses an already-configured managed connection named `main`:

```text
database/
└── main/
    ├── migrations/
    │   ├── 202611040001_create_app_statuses.ts
    │   └── 202611040003_add_app_status_description.ts
    ├── seeds/
    │   └── 202611040002_default_app_statuses.ts
    └── collections/  # Generated cache
```

The directory name identifies the connection; creating a directory does not register one. For another connection, change both the directory and `--connection` argument. See [Multiple database connections](multiple-databases.md). Keep the template's `database/tsconfig.json` so database files participate in server type checking.

Default-export each task definition, with `name` matching the filename without its extension and unique among that task kind on the connection. Migrations maintain schema and upgrade data changes; Seeds install defaults. Business services handle everyday status edits.

## Create the table

Create `database/main/migrations/202611040001_create_app_statuses.ts`:

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040001_create_app_statuses',
  async up({ builder }) {
    await builder.createCollection('appStatuses', (collection) => {
      collection.string('code', { length: 32 }).primary().notNull();
      collection.string('title', { length: 100 }).notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('appStatuses');
  },
});
```

After execution, `code` is a unique status identifier and `title` is a required display name. Renaming a status preserves its identity through `code`. `down()` deletes the entire dictionary and its records, so use it only where losing them is acceptable.

This uses Migration Context's `builder`. See [Tables and fields](../framework/database/schema.md) for fields, indexes and constraints, and [Migrations](../framework/database/migrations.md) for definition options. [View this migration](https://github.com/nocobase/docs-examples-v3/blob/96410dc943d7ac65737b50f110c129da1588fa94/apps/database-basics/database/main/migrations/202611040001_create_app_statuses.ts).

## Initialize default records

Create `database/main/seeds/202611040002_default_app_statuses.ts`:

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040002_default_app_statuses',
  async run(context) {
    const statuses = context.repository('appStatuses');
    for (const values of [
      { code: 'draft', title: 'Draft' },
      { code: 'published', title: 'Published' },
    ]) {
      if (await statuses.findOne({ filter: { code: values.code } })) continue;
      await statuses.createOne({ values });
    }
  },
});
```

The first installation creates `draft` / `Draft` and `published` / `Published`. If an administrator has already renamed `draft` to `Writing`, this preserves that title and fills only missing statuses. The primary key prevents duplicate codes; a concurrent conflict between reading and inserting should fail the task rather than be silently ignored.

`context.repository()` is bound to the Seed's connection and transaction. Do not obtain another DatabaseManager or create tables in a Seed. See [Seed data](../framework/database/seeds.md) for updating defaults, configuration and optional samples. [View the Seed](https://github.com/nocobase/docs-examples-v3/blob/96410dc943d7ac65737b50f110c129da1588fa94/apps/database-basics/database/main/seeds/202611040002_default_app_statuses.ts).

## Apply changes and inspect the result

Confirm that application configuration targets the intended database, then run from the application root:

```bash
pnpm nocobase config check
pnpm nocobase db apply --connection main --dry-run
pnpm nocobase db apply --connection main
pnpm nocobase collections generate --connection main --check
```

`--dry-run` lists the plan without executing tasks. Actual execution applies all pending migrations on the connection before Seeds. The default connection also includes registered plugins' resources, so the output can contain more than these files.

After the first run, the dictionary contains two default records. If the later upgrade migration is already present, both have `description: null`. Repeating `db apply` should skip successful history without adding duplicate records.

By default, `db apply` refreshes `database/main/collections/` when migrations change schema. Its `collection.json`, `metadata.json`, `schema.json` and connection manifest are regenerable caches; do not edit them. `collections generate --check` should report agreement with the database. If refresh failed after a successful migration, run `pnpm nocobase collections generate --connection main` separately.

The default connection normally runs database tasks at application startup. Manual commands let you inspect and apply the plan earlier. See [Multiple database connections](multiple-databases.md) for startup settings and other connections' automatic execution.

## Add a migration and preserve existing data

Once the dictionary is in use, add descriptions through a new file, `database/main/migrations/202611040003_add_app_status_description.ts`, without editing the first migration:

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040003_add_app_status_description',
  async up({ builder }) {
    await builder.alterCollection('appStatuses', (collection) => {
      collection.text('description').nullable();
    });
  },
  async down({ builder }) {
    await builder.dropField('appStatuses', 'description');
  },
});
```

Run the same `db apply` command. Existing codes and titles remain, with `description: null`. Rolling back this migration loses descriptions but retains the original status records. Before making descriptions required, define how existing rows should be populated and add another migration; see [Backfill and transform historical data](../framework/database/migrations.md#backfill-and-transform-historical-data).

Do not empty the database to make an edit take effect. Editing an executed file does not make it run again. See [Migrations](../framework/database/migrations.md#rollback-and-irreversible-changes) for checksums, batch rollback and Seed history. [View the upgrade migration](https://github.com/nocobase/docs-examples-v3/blob/96410dc943d7ac65737b50f110c129da1588fa94/apps/database-basics/database/main/migrations/202611040003_add_app_status_description.ts).

## Verify installation and upgrades

The complete example's [`tests/database/app-statuses.test.ts`](https://github.com/nocobase/docs-examples-v3/blob/96410dc943d7ac65737b50f110c129da1588fa94/apps/database-basics/tests/database/app-statuses.test.ts) uses real isolated databases. From the example application root, run:

```bash
pnpm exec vitest run --project node tests/database/app-statuses.test.ts
```

Tests cover schema creation, duplicate code rejection, default installation, history-based skipping and preservation of customized titles. The upgrade test inserts an old record before adding descriptions and checks preservation after applying, rolling back and reapplying the migration.

The failure test calls the real Seed and then deliberately throws, checks that records and successful history rolled back, removes the failure condition and retries. Another test uses a separate history table to execute the same Seed again, checking business idempotency independently of history-based skipping.

These tests do not reset the application's development database. See [Database and CLI tests](testing-and-acceptance.md#database-and-cli-tests) for `describeMigration()`, `createDatabaseTest()` and configuring other test dialects.

## Example source and running

The independent [Database basics App](https://github.com/nocobase/docs-examples-v3/tree/96410dc943d7ac65737b50f110c129da1588fa94/apps/database-basics) demonstrates the status dictionary through database commands and isolated tests, without requiring a business management page. Use Node.js 24 and pnpm 11; see the pinned [README](https://github.com/nocobase/docs-examples-v3/blob/96410dc943d7ac65737b50f110c129da1588fa94/apps/database-basics/README.MD) for dependencies and configuration.

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 96410dc943d7ac65737b50f110c129da1588fa94
cd apps/database-basics
pnpm install --frozen-lockfile
pnpm exec vitest run --project node tests/database/app-statuses.test.ts
```

The tests need no development database configuration. To apply migrations through the application CLI, run `pnpm nocobase config init` after installation and configure your database before using the earlier commands. An already-configured application needs no reinitialization. Tests default to SQLite; other databases need their driver and test connection settings. Your business application does not need to switch to SQLite.
