---
title: Relationships and associations
---

Relationships describe connections between logical Collections for related reads and writes. Metadata, foreign-key columns, indexes and database constraints are distinct layers.

## Adding customers to the order model

Apply this after the [order schema migration](schema.md), with existing customerId values either null or valid:

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

The example explicitly provides no automatic rollback. Backfill and validate legacy customer identifiers before adding a constraint rather than silently skipping a failed constraint.

## Types and keys

| Relation | Required keys/resources | Default behavior |
| --- | --- | --- |
| `belongsTo` | Local foreignKey and target targetKey | Can create a local column and index; physical constraint is explicit |
| `hasOne` / `hasMany` | Local sourceKey and target foreignKey | Inverse relationship metadata |
| `belongsToMany` | sourceKey, targetKey, through, foreignKey, otherKey | Uses an explicitly created join Collection |

Keys are logical field names. Required keys are not inferred from `id` or relationship names. Prefer declaring scalar foreign-key fields first; relation-created columns require `foreignKeyType`. Match integer attributes such as unsigned to the target key where required.

## Constraints and deletion

`belongsTo` metadata does not automatically create physical foreign keys. Enable `constraints(true)` and choose update/delete behavior deliberately. Cascading deletion is a business choice, not a universal default.

Join tables need defined keys, uniqueness and business fields. Metadata neither creates them automatically nor grants access to related records.

See [Association queries](association-queries.md). Verify missing relations, constraint failures, upgrades with existing data and deletion behavior.

## Interfaces and implementation

- [Relationship contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/builder/relations.md)
