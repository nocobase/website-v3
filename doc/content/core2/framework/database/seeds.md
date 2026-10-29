---
title: Seed data
description: Install the initial records an application needs with defineSeed(), and learn the seed execution context, the difference between required and sample data, and how history and verification work.
---

Seeds install the initial records an application needs, such as default business states. Schema changes and large data backfills during upgrades belong in migrations; seeds are also not meant for routine data imports or repeatedly resetting an environment.

## Defining a seed

The example below requires a migration that has already created `orderStatuses`, where `code` has a database unique constraint and there is a `title` field. Save it as `database/main/seeds/202610270004_default_order_status.ts`:

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202610270004_default_order_status',
  async run({ repository }) {
    await repository('orderStatuses').upsertOne({
      filter: { code: 'draft' },
      create: { code: 'draft', title: 'Draft' },
      update: { title: 'Draft' },
    });
  },
});
```

A seed's name matches its file name and is unique across all sources. Use a stable business key plus a unique constraint to make it idempotent; "query first, then insert" alone cannot prevent duplicates under concurrency.

## Execution context

The Seed Context provides `repository`, `query` and `connection`, but no Builder; when you need a new field, write a migration first. The Repository is bound to the current seed's connection and handles logical fields, JSON, time values and relation writes.

The default transaction mode is `auto`, which handles the data and the execution history together. A failed seed can continue on the next run, and successful ones are skipped based on history. A seed is not a sync script that overwrites user configuration on every startup.

## Required data and sample data

Distinguish the default data the application needs to run from sample data used for demonstrations. Do not mix test accounts, fixed credentials or demo orders into production initialization. The template's sampleData switch and ordinary seed history serve different purposes.

When you change a default value, also decide whether it may overwrite content an administrator has already changed; the update branch of the upsert must reflect that decision.

## History and verification

Released seeds stay unchanged; later changes to initial data are expressed with new files that sort later. Seeds currently have no rollback, refresh, truncate or repeatable mode.

Verify first installation, repeated execution, an existing business key, retry after failure and transaction rollback. For running seeds in an application, see the [Command-line reference](../../reference/cli.md); for plugin resources, see [Database resources and migrations](../../extension-development/database-and-migrations.md#initial-data).

For a complete migration and seed example in an application, see [Create tables and initialize data](../../developing-apps/data-models-and-migrations.md).

## Interfaces and implementation

- [Seed definitions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/seed/define-seed.md)
- [Seeder](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/seed/create-seeder.md)
