---
title: Database migrations
---

Migrations record fixed database version changes, including schema evolution and upgrade backfills. App resources live in `database/<connection>/migrations/`; plugins declare their database resources.

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

Save it as `202610270003_add_order_note.ts`, matching name. Dropping note also deletes its contents, so assess data preservation before production rollback.

Default-export `defineMigration()` with a name unique across all sources. Transaction mode defaults to `auto`. Declare `irreversible: true` when no reliable reversal exists rather than providing an empty successful down.

## Migration context

| Entry | Purpose |
| --- | --- |
| `builder` | Schema and metadata changes |
| `query` | Set-based backfills and corrections |
| `repository` | Collection codecs, relationship writes and similar semantics |
| `connection` | Current dialect and capabilities |

Do not return to an outer DatabaseManager, which could bypass the transaction. Prefer Query for normal backfills; use Repository when JSON/time codecs or relations require it, explaining why.

## History and releases

Keep migrations self-contained instead of importing evolving business definitions. Preserve shared/applied history and add new files for changes. Investigate checksum mismatches rather than hard-coding old checksums.

Inspect `db apply --dry-run`, then verify physical schema, metadata and history. Rolling back the latest batch does not restore all lost data; schema reversal and backup recovery differ.

Test empty installation and upgrades with existing data on supported dialects. See [Data models and migrations](../../developing-apps/data-models-and-migrations.md) and [Seeds](seeds.md).

## Interfaces and implementation

- [Migration definitions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/migration/define-migration.md)
- [Migration execution](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/migration/create-migrator.md)
