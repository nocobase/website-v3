---
title: Tables and fields
---

Declare Collections and fields with CollectionBuilder, placing persistent schema changes in migrations. Business semantics determine types, nullability, uniqueness and indexes; verify them on target databases.

## Creating the order model

Save this as `database/main/migrations/202610270001_create_orders.ts`:

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610270001_create_orders',
  async up({ builder }) {
    await builder.createCollection('orders', (c) => {
      c.increments('id');
      c.string('orderNo', { length: 64 }).notNull().unique();
      c.string('title', { length: 120 }).notNull();
      c.string('status', { length: 32 }).notNull().defaultTo('draft');
      c.decimal('amount', { precision: 12, scale: 2 }).notNull().defaultTo(0);
      c.integer('customerId').unsigned().nullable();
      c.index(['status', 'id']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('orders');
  },
});
```

Inspect `pnpm nocobase db apply --dry-run` before applying. `down()` deletes the order table and its data; execute it only when that data loss is acceptable for the rollback.

## Choosing field types

| Data | Type and consideration |
| --- | --- |
| Incrementing integer | `increments()` with an explicit name |
| Exact money | `decimal()` with precision/scale and precision-preserving values |
| Large identifiers | `bigInt()`, commonly decimal strings across JSON |
| Text and status | `string()` / `text()` plus allowed-state validation |
| Boolean | `boolean()` with explicit nullability/defaults |
| Calendar values | `date()` / `time()` / `datetime()` |
| Instants | `datetimeTz()` with UTC semantics |
| Supplemental structured values | `json()`, not a replacement for relationships |

No automatic id or timestamp fields are added. Declare them explicitly; do not assume methods such as `timestamps()` or `jsonb()` exist.

## Evolution and naming

Add fields and indexes through new `alterCollection()` migrations. Adding non-null fields to populated tables needs a plan for defaults, backfills and constraints, beyond successful creation on an empty database.

Builder and Repository use logical names; connection naming handles physical prefixes and casing. Native dialect types narrow portability and need an explicit support scope.

Metadata and physical structure form the model together. Editing generated snapshots does not change schema. Continue with [Relationships](relations.md) and [Migrations](migrations.md).

## Interfaces and implementation

- [Schema authoring](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/builder/collection-schema.md)
- [Field declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/signatures/builder.md)
