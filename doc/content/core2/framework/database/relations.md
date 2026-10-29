---
title: Relationships and associations
description: Declare belongsTo, hasOne, hasMany and belongsToMany relations on an existing model, make the required keys explicit, and choose foreign-key constraints and deletion behavior to fit the business.
---

Relationships describe the connections between logical Collections and are used for association queries and relation writes. Relationship metadata, foreign-key columns, indexes and database constraints are separate layers and must be declared separately.

## Adding a customer relation to the order model

The following migration runs after the [order table migration](schema.md) and assumes that existing `customerId` values are either empty or valid:

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610270002_add_customers',
  irreversible: true,
  async up({ builder }) {
    await builder.createCollection('customers', (c) => {
      c.increments('id');
      c.string('name').notNull();
    });
    await builder.alterCollection('orders', (c) => {
      c.belongsTo('customer', 'customers')
        .foreignKey('customerId').targetKey('id').constraints(true);
    });
    await builder.alterCollection('customers', (c) => {
      c.hasMany('orders', 'orders').sourceKey('id').foreignKey('customerId');
    });
  },
});
```

The example deliberately provides no automatic rollback. If legacy customer numbers already exist, backfill and validate them before creating the foreign key; never silently skip a failed constraint.

## Relation types and keys

| Relation | Required keys and resources | Default behavior |
| --- | --- | --- |
| `belongsTo` | A local foreignKey and the target's targetKey | Can create the local column with an index by default; the foreign-key constraint must be enabled explicitly |
| `hasOne` / `hasMany` | A local sourceKey and the target's foreignKey | Stores inverse relationship metadata |
| `belongsToMany` | sourceKey, targetKey, through, foreignKey, otherKey | Uses an explicit join Collection |

Every key refers to a logical field name. The framework does not infer required keys from `id` or from relation names. Prefer declaring the scalar foreign-key field first; when a relation creates the column, you must provide `foreignKeyType`. Integer foreign keys also need to match dialect attributes such as unsigned on the target's auto-incrementing key.

## Constraints and deletion

`belongsTo` metadata does not create a database foreign key automatically. After enabling `constraints(true)`, choose the delete and update behavior the business needs. Cascading deletes can affect related data and must not be treated as a universal default.

A many-to-many join table should have explicit keys, unique constraints and any business fields it needs. Relationship metadata does not create that table for you, and does not grant access to related records.

For usage, see [Association queries](association-queries.md). Besides confirming that the tables can be created, verify empty relations, foreign-key conflicts, upgrades with existing data and deletion behavior.

## Interfaces and implementation

- [Relationship contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/builder/relations.md)
