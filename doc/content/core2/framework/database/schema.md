---
title: Tables and fields
description: Declare tables and fields with CollectionBuilder in migrations, choose field types by business meaning, and plan later schema evolution and naming.
---

Tables and fields are declared with CollectionBuilder, and persistent schema changes go into migrations. Field types, nullability, uniqueness and indexes should follow business meaning and be verified on the target database.

## Creating the order model

Save the following migration as `database/main/migrations/202610270001_create_orders.ts`:

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

Review the plan with `pnpm nocobase db apply --dry-run` first, then run `db apply` once you have confirmed it. `down()` drops the whole order table along with its data; run it only in rollback scenarios where losing that data is acceptable.

## Choosing field types

| Data | Type and notes |
| --- | --- |
| Auto-incrementing integer | `increments()`, with the field name given explicitly |
| Exact amounts | `decimal()`, with precision and scale; precision is preserved on read and write |
| Large integer identifiers | `bigInt()`, usually passed as decimal strings in JSON |
| Text and statuses | `string()` / `text()`; validate the allowed status values separately |
| Booleans | `boolean()`, with explicit nullability and default value |
| Calendar dates and times | `date()` / `time()` / `datetime()` |
| Points in time | `datetimeTz()`, handled with UTC time semantics |
| Supplemental structured data | `json()`; not a replacement for relationships and foreign keys |

The framework does not add `id` or timestamp fields automatically; declare the ones you need. There are currently no shorthands such as `timestamps()` or `jsonb()`, so do not assume they exist.

## Evolution and naming

To add fields or indexes later, write a new `alterCollection()` migration. When adding a non-null field to an existing large table, plan the default value, the backfill and the order in which constraints take effect first; succeeding on an empty database is not enough.

Builder and Repository both use logical names. Physical naming rules such as table prefixes and underscores are handled by the connection's naming configuration. Native dialect types reduce portability and need an explicit range of supported databases.

The metadata produced by migrations and the physical structure together form the model; do not edit generated snapshots to simulate schema changes. For relations, see [Relationships and associations](relations.md); for managing change history, see [Database migrations](migrations.md).

## Interfaces and implementation

- [Schema authoring](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/builder/collection-schema.md)
- [Field declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/signatures/builder.md)
