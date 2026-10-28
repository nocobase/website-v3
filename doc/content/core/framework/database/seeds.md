---
title: Seed data
---

Seeds install initial records such as default business states. Schema changes and upgrade backfills belong in migrations; seeds are not routine imports or repeatable environment-reset scripts.

## Defining a seed

This requires a migrated `orderStatuses` Collection with a unique code and a title field. Save it as `database/main/seeds/202610270004_default_order_status.ts`:

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

Names match filenames and are unique across sources. Stable business keys plus database uniqueness provide idempotent targeting; checking before inserting alone does not prevent races.

## Execution context

Seed Context exposes `repository`, `query` and `connection`, not Builder. Add new fields through migrations. Repositories bind to the seed connection and handle logical fields, JSON/time codecs and relations.

Default transaction mode is `auto`, coordinating data and execution history. Failed seeds can resume later; successful ones are skipped by history. Seeds do not overwrite user configuration on every startup.

## Required data and samples

Separate necessary defaults from demonstration data. Avoid test accounts, fixed credentials and demo orders in production initialization. Template sampleData behavior and ordinary seed history serve different purposes.

When defaults change, decide whether administrator edits may be overwritten. The upsert update branch must reflect that policy.

## History and tests

Published seeds remain immutable; add later files for subsequent installation data. Seeds have no rollback, refresh, truncate or repeatable mode.

Test first installation, repeated execution, existing keys, retries and rollback. See [CLI reference](../../reference/cli.md) and [Plugin database resources](../../extension-development/database-and-migrations.md).

## Interfaces and implementation

- [Seed definitions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/seed/define-seed.md)
- [Seeder](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/seed/create-seeder.md)
