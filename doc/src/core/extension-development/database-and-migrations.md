---
title: Database and migrations
description: Declare plugin database resources, write migrations and verify source and compiled tasks.
---

A plugin can own database structure and evolve it through migrations applied by its App. This article creates `noticeDataEntries` and distinguishes migrations, initial records, runtime writes and compiled resources.

## Use an Agent

```text
Create a notice-data plugin in this App. Add a migration for notice entries with id and required title.
Do not create tables in Provider startup or insert demonstration data.
Test apply, rollback and reapply, and verify that compiled migrations remain loadable.
```

## Create the database capability

Run commands from the App root. Paths are relative to `packages/app-plugin-notice-data/`.

```bash
pnpm create @nocobase/plugin@beta notice-data --with database
```

Keep this declaration in the generated `server/plugin.ts`, default-exported through `server/index.ts`:

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

`baseDir` is absolute and resource paths resolve relative to it. In source it points to the plugin root; from compiled `dist/server/plugin.js`, it points to migrations under `dist`. Do not embed a development machine path.

## Write the migration

Generated `.ts.example` files are disabled. Create `database/migrations/202610260001_notice_data_create_entries.ts`; do not also activate an unrelated generated schema example:

```ts
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610260001_notice_data_create_entries',
  async up({ builder }) {
    await builder.createCollection('noticeDataEntries', (collection) => {
      collection.increments('id');
      collection.string('title', { length: 200, nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('noticeDataEntries');
  },
});
export default migration;
```

Keep the filename and `name` aligned. Tasks from the App and all plugins share one ordered sequence, so include a plugin identifier rather than a generic name such as `create_entries`.

`up()` creates the collection and fields; `down()` reverses the change. This rollback deletes entry data and belongs on disposable test data. Migrations must be self-contained: do not import live field definitions that can change with application code.

Once merged or delivered, a migration is immutable, including formatting, filename and `down()`. Add a later migration for subsequent changes. Applications record task history and checksums; editing an old file neither upgrades an existing database nor preserves consistency with fresh installs.

## Test against a real database

Replace the generated database test with `tests/database/migrations.test.ts`:

```ts
import { fileURLToPath } from 'node:url';
import { describeMigration } from '@nocobase/app-testing/server';
import packageMetadata from '../../package.json' with { type: 'json' };

describeMigration('202610260001_notice_data_create_entries', {
  sources: [
    {
      packageName: packageMetadata.name,
      directory: fileURLToPath(
        new URL('../../database/migrations', import.meta.url),
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('noticeDataEntries').toHaveField('title', {
      type: 'string',
      nullable: false,
      length: 200,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('noticeDataEntries').not.toExist();
  },
});
```

`describeMigration()` uses an isolated database to apply, roll back and reapply the migration, checking logical metadata against physical schema. Import-only tests are insufficient. Include prerequisite migration sources when referencing another plugin’s collections.

```bash
pnpm --filter @nocobase/app-plugin-notice-data format
pnpm --filter @nocobase/app-plugin-notice-data check
```

## Register and apply in the App

Register the Server plugin in a development App, then inspect the migration plan:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install
```

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

`db apply` runs pending migrations followed by seeds. Its plan covers the whole App, not just this plugin, so review it before applying. Do not use `db reset` for routine upgrades.

## Separate schema, seeds and business data

| Requirement | Owner |
| --- | --- |
| Collections, fields, indexes and constraints | Migration |
| Fixed initial records required for the plugin to operate | Seed |
| User-created notices and imported data | Service, API or Repository operations |
| Demonstration and test records | Test fixtures, not this example’s published seeds |

A seed uses `defineSeed()` with a stable name and `run()`. Its schema must already exist. Decide whether existing records should be skipped, rejected or updated only in plugin-owned fields. Successful task history normally prevents reruns, but test restoration and deliberate replay without overwriting user edits.

Server code resolves `databaseManagerToken` and calls `database.repository('noticeDataEntries')` for collection-aware operations. The lower-level `database.query()` does not apply collection metadata or table-prefix resolution. Browsers access data through APIs. Creating a collection does not automatically expose CRUD endpoints or add a menu.

## Check builds and upgrades

Preserve the generated build step: run `nocobase-db-manifests` after TypeScript compilation. It produces checksum manifests so compiled JavaScript and source tasks share their migration history. Do not edit these manifests by hand or omit the step.

Run the App’s `pnpm build` and verify that plugin migrations reach the artifact. Before delivery, test both a fresh database and an upgrade from the previous schema on isolated databases. Unregistering a plugin does not delete its data; deletion and rollback are separate decisions. See [Testing and verification](testing-and-verification.md).
