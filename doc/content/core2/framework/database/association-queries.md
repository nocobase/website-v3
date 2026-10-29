---
title: Association queries
description: Read related records through declared relations, and learn the result shapes, filtering and statistics inside relations, and performance and security considerations.
---

Association queries read related records through declared relations, so callers do not have to assemble physical table names by hand. Every level of association needs its metadata, and the data policy must also allow reading the related records.

## Selecting root fields and relations

The example continues the customer and order relations from [Relationships and associations](relations.md):

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

The root list returns at most 20 customers, each with at most 10 draft orders. The `filter` inside the relation only affects the orders and does not remove customers without matching orders; to filter the customers themselves, use a root-level relation condition.

## Result shape

| Relation | No matching record | Matching records |
| --- | --- | --- |
| belongsTo / hasOne | `null` | Object |
| hasMany / belongsToMany | `[]` | Array |

Without select, scalar fields are read by default and relations are not expanded. Calling `fields()` with no arguments explicitly selects no root fields, while omitting fields still selects the default scalar fields. Including the same relation twice is rejected.

## Filtering and statistics inside relations

To-many relations support sorting, limits and cursors inside the relation; to-one relations do not support these pagination or aggregation options. Relation builders are immutable, so use the result returned by each chained call instead of calling a method and discarding its return value.

With `combine()`, one relation can return records, a count and a sum as separate branches, each with its own conditions and pagination. Do not assume that the limit of the records branch also limits another statistics branch.

## Performance and security

Relations are loaded in batches per branch, but a limit inside a relation does not guarantee that the database reads only that many rows for each parent record. For deep relations and large collections, evaluate the number of queries, memory usage and response size.

Select fields explicitly and bind policies. Association queries are not a way around the permissions on target records, and several query branches do not inherently share one snapshot. When you need consistent results, use [Transactions](transactions.md); for the values returned by statistics, see [Aggregation and statistics](aggregation.md).

## Interfaces and implementation

- [Selection and relations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/select.md)
- [Relation pagination](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/pagination.md)
