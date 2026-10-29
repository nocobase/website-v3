---
title: Database migrations
description: Record schema evolution and upgrade backfills with defineMigration(), and learn the entries of the migration context and how to maintain and release migration history.
---

A migration records a fixed change between database versions, including schema evolution and data backfills during upgrades. Application migrations live in `database/<connection>/migrations/`; plugin migrations are connected through database resource declarations.

## Defining a change

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610270003_add_order_note',
  async up({ builder }) {
    await builder.alterCollection('orders', (c) => { c.text('note').nullable(); });
  },
  async down({ builder }) {
    await builder.dropField('orders', 'note');
  },
});
```

Save it as `202610270003_add_order_note.ts`, matching its name. In the example, rolling back by dropping the note field also deletes the existing notes; rollbacks in production must take data retention into account.

The file default-exports the result of `defineMigration()`. Migration names must be unique across all sources, and `transaction` defaults to `auto`. For a migration that cannot be reversed reliably, declare `irreversible: true` instead of providing a down that appears to succeed but does nothing.

## Using the migration context

| Entry | Purpose |
| --- | --- |
| `builder` | Schema and metadata changes |
| `query` | Set-based data backfills and corrections |
| `repository` | Operations that need Collection codecs, relation writes and similar semantics |
| `connection` | The current dialect and its capabilities |

Do not reach back to the outer DatabaseManager from a migration, or you may bypass the current transaction. Prefer Query for ordinary backfills; choose Repository only when you need JSON or time codecs or relation semantics, and explain why.

## Migration history and releases

Migrations should be self-contained and must not import business model definitions that will keep changing. Once a migration has been released or merged into shared history, keep its content unchanged and write later corrections as new files. When a checksum changes, first investigate whether history was modified; do not bypass the check by hard-coding the old checksum.

Before applying, review the plan with `db apply --dry-run`; afterwards, check the physical structure, metadata and migration history. `db rollback` reverts the latest batch but does not restore all deleted data; reverting the schema and restoring from a backup are different operations.

Test the upgrade path on both an empty database and one with existing data, and verify DDL capabilities on the target dialects. For worked examples, see [Create tables and initialize data](../../developing-apps/data-models-and-migrations.md); for initial data, see [Seed data](seeds.md).

## Interfaces and implementation

- [Migration definitions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/migration/define-migration.md)
- [Migration execution](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/migration/create-migrator.md)
