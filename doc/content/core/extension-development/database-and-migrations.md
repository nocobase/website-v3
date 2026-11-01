---
title: Database resources and migrations
description: Declare plugin migration and Seed directories, integrate with the application default connection, and verify builds, installation and upgrades.
---

A plugin contributes migrations and Seeds through its Server declaration; the installing application executes them. This example adds an announcement category dictionary to `notice-data`. Modeling, Context and execution rules are shared with applications; see [Tables and fields](../framework/database/schema.md), [Migrations](../framework/database/migrations.md) and [Seed data](../framework/database/seeds.md).

## Create database resource directories

For a new plugin, select the database capability from the App root:

```bash
pnpm create @nocobase/plugin@beta notice-data --with database
```

For an existing plugin, add directories and declarations without recreating it. Plugin paths below are relative to `packages/app-plugin-notice-data/`:

```text
server/
├── index.ts
└── plugin.ts
database/
├── migrations/
│   └── 202611040020_notice_data_create_categories.ts
└── seeds/
    └── 202611040020_notice_data_default_categories.ts
```

There is no `main/` level in a plugin's database directory. Generated `.ts.example` files are inactive drafts; write actual `.ts` files for the feature. Omit the Seed declaration if no initial records are needed.

## Declare resource paths and connection ownership

Declare resources in `server/plugin.ts`, preserving an existing plugin's other contributions:

```ts
import path from 'node:path';
import { defineServerPlugin, type AppServerPlugin } from '@nocobase/app-server/plugins';

const plugin: AppServerPlugin = defineServerPlugin({
  packageName: '@nocobase/app-plugin-notice-data',
  baseDir: path.resolve(import.meta.dirname, '..'),
  database: {
    migrations: './database/migrations',
    seeds: './database/seeds',
  },
});

export default plugin;
```

Expose the entry from `server/index.ts`:

```ts
export { default } from './plugin.js';
```

`baseDir` must be absolute. Resource paths start with `./` and cannot traverse to a parent directory. This resolves to the plugin root in source and to `dist/` from `dist/server/plugin.js`, so compiled output must contain the matching database directories.

Declared plugin migrations and Seeds contribute only to the application's default connection, selected by `database.default`; its name need not be `main`. The declaration cannot select another connection and does not create a separate database. Creating directories, declaring resources, registering the plugin and executing tasks are separate steps.

## Write migrations and initial data

Create the dictionary in `database/migrations/202611040020_notice_data_create_categories.ts`:

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040020_notice_data_create_categories',
  async up({ builder }) {
    await builder.createCollection('noticeCategories', (c) => {
      c.string('code', { length: 32 }).primary().notNull();
      c.string('title', { length: 100 }).notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('noticeCategories');
  },
});
```

Include a plugin identifier in task names to avoid collisions with the application and other plugins. Sources on one connection are ordered globally by name, not grouped by plugin registration order. For dependencies on another plugin's schema, specify the prerequisite version and migration order rather than relying on registration order.

Install the default category in `database/seeds/202611040020_notice_data_default_categories.ts`:

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040020_notice_data_default_categories',
  async run(context) {
    const categories = context.repository('noticeCategories');
    if (await categories.findOne({ filter: { code: 'general' } })) return;
    await categories.createOne({ values: { code: 'general', title: 'General' } });
  },
});
```

The application runs Seeds after migrations, producing `general` / `General` while preserving administrator edits to an existing category. Do not create these tables or repeatedly insert defaults from Provider startup.

Use separate `sample: true` Seeds for optional fictional announcements, controlled by the host's fresh installation and `app.sampleData` setting. Ordinary Seeds do not recognize sample content automatically. If samples need other plugins' services, register a generator through `sampleDataToken` during Provider `boot()` so it runs once the application is ready, rather than writing records immediately in `boot()`. Include a plugin identifier in service names too. See [Optional samples](../framework/database/seeds.md#required-data-and-optional-samples) for execution conditions.

Keep merged or released migrations and Seeds immutable; add new files for later changes. Put schema changes and historical backfills in migrations rather than repeatedly overwriting user records from a Seed.

## Register the plugin and apply changes

Once the local plugin is a resolvable workspace dependency, preview and register it from the App root:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

`--no-install` skips installation, not workspace dependency configuration. Check that the Server entry is included in `server/plugins.ts`; see [Plugin declarations and public entries](plugin-declarations.md#runtime-entries).

The database plan should include these migration and Seed names, plus any other pending application or plugin tasks. After the first run, `noticeCategories` should resolve and contain the default category. Repeating the command should skip successful history. `db apply` does not target this plugin alone.

A database declaration exposes neither CRUD endpoints nor menus. Implement business APIs and permissions separately. See [Repository](../framework/database/repositories.md) for data access and [Routes and HTTP APIs](server-apis.md) for integration.

## Verify installation and upgrades

Use real migration sources in the plugin's `tests/database/categories.test.ts`:

```ts
import { fileURLToPath } from 'node:url';
import { describeMigration } from '@nocobase/app-testing/server';
import metadata from '../../package.json' with { type: 'json' };

describeMigration('202611040020_notice_data_create_categories', {
  sources: [{
    packageName: metadata.name,
    directory: fileURLToPath(new URL('../../database/migrations/', import.meta.url)),
  }],
  up: async ({ expectCollection }) => {
    await expectCollection('noticeCategories').toHaveField('code', {
      type: 'string', nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('noticeCategories').not.toExist();
  },
});
```

`describeMigration()` applies the migration, checks schema and metadata, rolls it back and reapplies it. Add business assertions that duplicate category codes are rejected. Seed tests should check first installation, preserved names and retries. When resources depend on another plugin's Collections, include prerequisite migration sources or use a complete App fixture.

Run from the App root:

```bash
pnpm --filter @nocobase/app-plugin-notice-data exec vitest run tests/database/categories.test.ts
```

For an upgrade migration, prepare old-version records before checking the new data and constraints. See [Database and CLI tests](../developing-apps/testing-and-acceptance.md#database-and-cli-tests) for shared test tools.

## Build and deliver database resources

Keep the scaffold's compilation and `nocobase-db-manifests` steps, which generate manifests for compiled migrations and Seeds. Plugins generate their own manifests; the application must not regenerate installed dependencies' manifests. See [Checksums and compiled artifacts](../framework/database/migrations.md#checksums-and-compiled-artifacts).

From the App root, check the plugin and build the application:

```bash
pnpm --filter @nocobase/app-plugin-notice-data check
pnpm build
```

Check that the published package includes `dist/database/migrations/`, any used `dist/database/seeds/`, and `.manifest.json` in each directory. In an isolated application, verify both empty installation and upgrades using compiled artifacts so `baseDir` is proven to resolve the resources. Passing workspace source tests does not prove the package contains everything.

Unregistering a plugin does not delete its schema or data. Rollback follows application batch rules and can affect other plugins too; `db rollback` is not a plugin uninstall command. See [Build and publish](publish-plugin.md) for delivery checks.

See the [resource declaration types](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/app/app-server/src/plugins/types.ts), [scaffold declaration](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/tools/create-plugin/template/server/plugin.ts) and [scaffold tests](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/tools/create-plugin/template/tests/database/migrations.test.ts).
