---
title: Association queries
---

Association queries read related records through declared metadata instead of manually assembling physical table names. Each relation needs metadata and permission to read the selected data.

## Root and relation selection

This uses the [customer/order relationships](relations.md):

```ts
const customers = await db.repository('customers').findMany({
  select: (s) => s.fields('id', 'name').include('orders', (orders) =>
    orders.fields('id', 'title', 'amount')
      .filter({ status: 'draft' })
      .sort((s) => s.field('id').asc())
      .limit(10)),
  sort: (s) => s.field('id').asc(),
  limit: 20,
});
```

The root returns at most 20 customers, each with at most 10 draft orders. A local relation filter changes orders, not the root customer set. Filtering customers by relationships requires a root relation condition.

## Result shape

| Relation | No match | Match |
| --- | --- | --- |
| belongsTo / hasOne | `null` | Object |
| hasMany / belongsToMany | `[]` | Array |

Without select, scalar fields are read but relations are not expanded. Empty `fields()` explicitly selects no root scalars; omitting fields retains default scalars. Duplicate includes of one relation fail.

## Local conditions and statistics

To-many relations support local ordering, limits and cursors; to-one does not support pagination or aggregation. Relation builders are immutable: return the chained result instead of discarding it.

`combine()` returns independent record, count and sum branches. A record branch's limit does not automatically limit a separate statistics branch.

## Cost and access

Relations load in batches by branch, but local limits do not guarantee the database reads only that many rows per parent. Evaluate query count, memory and payload size for deep or large relations.

Select fields and bind policies explicitly. Relations do not bypass target access rules, and multiple branches do not automatically share a snapshot. See [Transactions](transactions.md) and [Aggregation](aggregation.md).

## Interfaces and implementation

- [Selection and relations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/select.md)
- [Relation pagination](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/pagination.md)
