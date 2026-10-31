---
title: Relationships and associations
description: Define belongsTo, hasOne, hasMany and belongsToMany relations with explicit foreign-key fields, indexes and constraints.
---

Relations let Repository read and write related records through a logical model. Run these examples in a migration's `up({ builder })` callback, using `orders` from [Tables and fields](schema.md), with its auto-incrementing `id` and nullable integer `customerId`.

## Relation fields and database constraints

An order's `customerId` is the physical field storing its customer ID. `customer` is a relation field telling Repository how to read that customer. A database foreign key ensures that a non-null ID references a real customer. These have different responsibilities, and declaring a relation grants no access to customers.

Every relation requires explicit keys; they are not inferred from `id` or the relation's name:

| Relation | Required options |
| --- | --- |
| `belongsTo` | `foreignKey`, `targetKey` |
| `hasOne`, `hasMany` | `sourceKey`, `foreignKey` |
| `belongsToMany` | `sourceKey`, `targetKey`, `through`, `foreignKey`, `otherKey` |

Use logical field names and compatible key types, including dialect-specific unsigned attributes. Check whether existing records satisfy the constraints before creating a relation.

## Many-to-one relations

Create customers, then add the order relation. Existing orders should have null `customerId` values at this point. If they carry historical IDs, first import the matching customers and validate the references:

```ts
await builder.createCollection('customers', (c) => {
  c.increments('id');
  c.string('name', { length: 120 }).notNull();
});
await builder.alterCollection('orders', (c) => {
  c.belongsTo('customer', 'customers')
    .foreignKey('customerId')
    .targetKey('id')
    .constraints(true)
    .onDelete('restrict');
});
```

`foreignKey('customerId')` reuses the order field; `targetKey('id')` points to the customer primary key. Repository can then read customers through `include('customer', ...)`; see [Association queries](association-queries.md).

A `belongsTo` can also create a local foreign-key column, but requires an explicit `foreignKeyType`. For example, use `c.belongsTo('customer', 'customers', { foreignKeyType: 'integer', unsigned: true })` and specify both keys. An existing scalar field needs no such option. Prefer declaring the scalar field separately to make its nullability, default and type explicit.

## One-to-one and one-to-many relations

A customer's order list is an inverse relation; the foreign key stays on orders:

```ts
await builder.alterCollection('customers', (c) => {
  c.hasMany('orders', 'orders')
    .sourceKey('id')
    .foreignKey('customerId');
});
```

`hasMany` adds relation metadata without creating another foreign-key field. For at most one profile per customer, use `hasOne` and make the profile's customer ID unique:

```ts
await builder.createCollection('customerProfiles', (c) => {
  c.increments('id');
  c.integer('customerId').unsigned().notNull().unique();
  c.text('notes');
  c.belongsTo('customer', 'customers', { index: false })
    .foreignKey('customerId').targetKey('id')
    .constraints(true).onDelete('cascade');
});
await builder.alterCollection('customers', (c) => {
  c.hasOne('profile', 'customerProfiles')
    .sourceKey('id').foreignKey('customerId');
});
```

`hasOne` alone does not enforce one profile in the database; `unique()` rejects duplicate customer IDs. It already provides an index, so the relation sets `index: false` to avoid creating another default index. Deleting a customer also deletes its profile here, an explicit business choice for this example.

## Many-to-many relations and join tables

An order can have several tags, and each tag can appear on several orders. Create the tags and join table before declaring the relation:

```ts
await builder.createCollection('tags', (c) => {
  c.increments('id');
  c.string('name', { length: 64 }).notNull().unique();
});
await builder.createCollection('orderTags', (c) => {
  c.integer('orderId').unsigned().notNull();
  c.integer('tagId').unsigned().notNull();
  c.primary(['orderId', 'tagId']);
  c.foreignKey('orderId', {
    references: { collection: 'orders', fields: ['id'] },
    onDelete: 'cascade',
  });
  c.foreignKey('tagId', {
    references: { collection: 'tags', fields: ['id'] },
    onDelete: 'cascade',
  });
});
await builder.alterCollection('orders', (c) => {
  c.belongsToMany('tags', 'tags')
    .sourceKey('id').targetKey('id')
    .through('orderTags').foreignKey('orderId').otherKey('tagId');
});
```

`foreignKey` is the join table field pointing to the order; `otherKey` points to the tag. The composite primary key prevents duplicate order/tag pairs. The relation does not create `orderTags` automatically. Declare any additional join-table fields, such as ordering, explicitly.

Deleting an order or tag cascades to its join rows in this example, not to the business records on the other side. See [Association queries and writes](association-queries.md) for relation writes.

## Indexes, deletion and update rules

`belongsTo` adds a foreign-key index by default; `index: false` disables this. When a named index already exists, especially when adding a relation separately through `addField()`, set `index: false` to avoid a duplicate index.

Only `constraints: true` or `.constraints(true)` creates an automatic foreign key. If `foreignKey()` or `addConstraint()` already created it, use `constraints: false` on the relation. This does not remove an existing database constraint. `hasOne`, `hasMany` and `belongsToMany` do not supply constraints on the other table for you.

`onDelete` and `onUpdate` accept `restrict`, `cascade`, `set null`, `set default` and `no action`, subject to database capabilities. `set null` requires a nullable field; `set default` also needs a default satisfying the reference. Do not rely on different databases having the same deletion default.

For rollback, remove relations, constraints, indexes and added fields in dependency order before dropping referenced Collections. Dropping a relation that reuses a scalar field does not remove that field or all explicitly created indexes and constraints. Tests should inspect real schema, invalid references, duplicate associations and records after deletion, beyond checking that Repository can read a relation.

See the [relation key contract](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/collection/relation-contract.ts) and [schema compiler](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/collection/compiler/compiler.ts).
