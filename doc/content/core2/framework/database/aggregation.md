---
title: Aggregation and statistics
description: Compute counts, sums, averages and extrema in the database with aggregate() and groupBy(), and learn about numeric precision, empty-set results, grouping constraints and relation statistics.
---

Aggregation computes counts, sums, averages and extrema in the database, which suits overviews and reports. Statistics reveal information too, so apply the same permission scope as for the detail records.

## Root-level and grouped statistics

```ts
const totals = await db.repository('orders').aggregate({
  filter: { status: 'paid' },
  aggregate: (a) => ({ count: a.count(), total: a.sum('amount') }),
});

const byStatus = await db.repository('orders').groupBy({
  by: ['status'],
  aggregate: (a) => ({ count: a.count(), total: a.sum('amount') }),
  having: (f) => f.number('count').gte(2),
  sort: (s) => s.field('status').asc(),
});
```

`aggregate()` returns an object mapping aliases to values, without a record wrapper. `groupBy()` returns an array whose items contain the grouping fields and the aggregate aliases. The order is: filter selects the source records first, then they are grouped, and finally having filters the grouped results.

## Numbers and empty sets

| Operation | Meaning of the result |
| --- | --- |
| `count()` | Counts rows; the number 0 for an empty set |
| `count(field)` | Ignores rows where the field is SQL NULL |
| `sum()` / `avg()` | Strings for integer and DECIMAL fields to preserve precision; numbers for floating-point fields |
| `min()` / `max()` | Keep the field's logical type |
| sum, avg, min and max on an empty set | `null` |

Do not apply `Number()` across the board to amounts or large integers, or you may lose precision. Keep display formatting separate from calculation semantics, and let the business decide at which step averages are rounded.

## Grouping constraints

`by` must be non-empty and free of duplicates, and aggregate aliases cannot share a name with grouping fields. having and sort can only refer to grouping fields or aggregate aliases, not to arbitrary ungrouped fields.

The current Repository groupBy offers no select, limit, offset or cursor. Do not copy pagination syntax from other ORMs; for complex reports, consider Query or a dedicated summary table, while keeping the authorization scope.

## Relation statistics and verification

To-many relations can return count, sum or combine branches through Select. Record pages and totals can use different options inside the relation, so make clear exactly which scope a total counts.

Tests should cover empty sets, NULL, exact amounts, different statuses and records the user may not access. For relation statistics, see [Association queries](association-queries.md); for building input, see [Query inputs and builders](query-inputs.md).

## Interfaces and implementation

- [Aggregate](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/methods/aggregate.md)
- [GroupBy](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/methods/group-by.md)
