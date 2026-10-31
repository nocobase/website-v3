---
title: Tables and fields
description: Create and change Collections, fields, indexes and constraints with CollectionBuilder, including naming, metadata and database capabilities.
---

`CollectionBuilder` translates logical Collection definitions into database schema and synchronizes the metadata the model needs. Applications and plugins use it inside [Migration](migrations.md) callbacks, `up({ builder })` and `down({ builder })`. Place the following snippets inside those callbacks.

## Create a Collection

Declare an order table with a callback:

```ts
await builder.createCollection('orders', (c) => {
  c.increments('id');
  c.string('orderNo', { length: 64 }).notNull().unique();
  c.string('status', { length: 32 }).notNull().defaultTo('draft');
  c.decimal('amount', { precision: 12, scale: 2 }).notNull().defaultTo(0);
  c.integer('customerId').unsigned().nullable();
  c.datetimeTz('createdAt').notNull();
  c.index(['status', 'id']);
});
```

After applying the migration, `orders` has the six declared fields, a unique order number and a status index. The framework adds no implicit `id`, `createdAt` or `updatedAt` fields. `increments()` explicitly creates an auto-incrementing primary key; naming an ordinary field `id` does not make it a primary key. This example has no default for `createdAt`, so supply it when creating an order.

`createCollection()` also accepts a definition object. This creates a separate status dictionary rather than adding fields to the order table:

```ts
await builder.createCollection('orderStatuses', {
  fields: [
    { name: 'code', type: 'string', length: 32, primaryKey: true, nullable: false },
    { name: 'title', type: 'string', length: 100, nullable: false },
  ],
});
```

The object contains properties such as `fields`, `indexes` and `constraints`; a bare field array is not a valid second argument. Write fixed definitions inside the migration in either form instead of importing evolving business models. To create several Collections together, `createCollections([{ name, definition }])` accepts the same definition forms.

## Declare fields and defaults

Options and chained methods can express the same rule: `c.string('title', { nullable: false })` and `c.string('title').notNull()` are equivalent. Keep one main style within a file.

| Data | Declaration | Boundary |
| --- | --- | --- |
| Short text | `c.string('title', { length: 120 })` | Endpoints still validate blank content and length |
| Long text | `c.text('note')` | Do not use a short-string length to represent long-text limits |
| Boolean | `c.boolean('active').notNull().defaultTo(true)` | Decide whether null is allowed |
| Integer | `c.integer('quantity').notNull().defaultTo(1)` | Non-null does not mean positive |
| Exact amount | `c.decimal('amount', { precision: 12, scale: 2 })` | Preserve decimal precision when reading and writing |
| Large integer | `c.bigInt('externalId')` | Use decimal strings beyond JavaScript's safe integer range |
| Calendar values | `c.date('dueDate')`, `c.time('opensAt')`, `c.datetime('scheduledAt')` | Distinguish these from absolute instants |
| Instant | `c.datetimeTz('paidAt')` | Use UTC semantics |
| Structured data | `c.json('settings')` | Let Repository handle dialect encoding |
| Fixed enum | `c.enum('state', { values: ['draft', 'paid'] })` | Changing members requires a migration; constraint support depends on the dialect |

Other types include `char`, `float`, `double`, `blob`, `uuid` and `native`. `char` requires a length; `native` requires a native type name and limits portability. See the full [field types and options](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/collection/types.ts).

A default supplies an omitted field on insert. Changing it does not mean existing records are automatically updated. Define backfills explicitly in a migration. Database constraints such as non-null and uniqueness do not replace endpoint validation or access checks.

## Define keys, indexes and constraints

`primary()`, `unique()` and `index()` accept one field name or an array. For example, `c.unique(['customerId', 'orderNo'])` makes the combination unique rather than making each field unique. A join table can use `c.primary(['orderId', 'tagId'])` for a composite primary key.

Use `addIndex()` and `addConstraint()` on existing Collections. This example requires an existing `customers.id` compatible with `orders.customerId`, and valid references for all existing non-null customer IDs:

```ts
await builder.addIndex('orders', {
  name: 'idx_orders_customer',
  fields: ['customerId'],
});
await builder.addConstraint('orders', {
  type: 'foreignKey',
  name: 'fk_orders_customer',
  fields: ['customerId'],
  references: { collection: 'customers', fields: ['id'] },
  onDelete: 'restrict',
});
```

The index supports queries; the foreign key enforces valid references. `onDelete: 'restrict'` rejects deletion of a customer that orders still reference. Reverse these operations with the same names: `dropConstraint('orders', 'fk_orders_customer')` and `dropIndex('orders', 'idx_orders_customer')`. Explicit index and constraint names are used as written, without case conversion.

See [Relationships and associations](relations.md) for relation metadata and automatic indexes. Avoid creating duplicate indexes or constraints for the same foreign key.

## Change existing schema

Keep merged or released migrations unchanged. Add a later migration with explicit structural operations:

```ts
await builder.alterCollection('orders', (c) => {
  c.text('note').nullable();
});
```

Backfill `note` using an explicit business rule and verify that no nulls remain before tightening the constraint. See [Backfill and transform historical data](migrations.md#backfill-and-transform-historical-data).

```ts
await builder.alterField('orders', 'note', { type: 'text', nullable: false });
```

When altering a field, explicitly preserve its type, length or precision as applicable, and verify the result on the target database.

For one field, you can also use `addField(collection, field)`. Remove a field with `dropField()` or a Collection with `dropCollection()`. These operations lose the affected data. `renameCollection(oldName, newName)` supports table Collections but can reject relations, foreign keys or view dependencies that must be handled first. Do not simulate a rename by dropping and recreating a table.

## Logical naming and metadata

Builder arguments are logical names such as `orderItems` and `customerId`. Naming configuration, including `underscored` and `tablePrefix`, determines physical names. Do not assemble prefixes yourself or pass `tableName` or `columnName` mappings to Builder.

Physical schema and supplemental metadata together resolve the model. Builder synchronizes them; disabling metadata synchronization or editing generated files under `database/<connection>/collections/` cannot replace a schema change. See [application table creation and initialization](../../developing-apps/data-models-and-migrations.md) for cache checks. Schemas owned by another system use [external connections](../../developing-apps/existing-databases.md), which reject Builder DDL.

## Preview changes and database capabilities

A Builder preview reports individual operations and dialect warnings:

```ts
const result = await builder.addField(
  'orders',
  { name: 'note', type: 'text', nullable: true },
  { dryRun: true, previewSql: true },
);
console.log(result.sql, result.warnings, result.impact);
```

`dryRun: true` executes neither schema changes nor metadata synchronization. `previewSql: true` returns SQL when the adapter supports it, but does not itself prevent execution. `warnings` describes capability limits and `impact` describes potential data effects. A preview does not guarantee successful execution. This operation preview differs from `db apply --dry-run`, which only lists pending task files.

During execution, `strict: true` turns capability warnings into errors; it is not a deletion confirmation option. `ifNotExists` and `ifExists` skip supported create or drop operations without correcting an existing object's shape. Builder's `transaction` option does not yet manage transactions, and `builder.transaction()` does not open one. The migration runner manages task transactions; see [Execution order, history and transactions](migrations.md#execution-order-history-and-transactions).

[View the Builder implementation](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/collection/builder/builder.ts).
