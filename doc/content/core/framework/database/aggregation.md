---
title: Aggregation and statistics
---

Aggregation computes counts, sums, averages and extrema in the database. Statistics can reveal information too, so apply the same access scope as detail records.

## Root and grouped aggregates

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

`aggregate()` returns an alias-to-value object without a record envelope. `groupBy()` returns grouped fields and aliases. Filter source records first, group them, then apply having to grouped results.

## Numbers and empty sets

| Operation | Semantics |
| --- | --- |
| `count()` | Row count; numeric zero for an empty set |
| `count(field)` | Ignores SQL NULL values |
| `sum()` / `avg()` | Precision-preserving strings for integer/DECIMAL fields; numbers for floats |
| `min()` / `max()` | Preserve the field's logical result type |
| Empty sum/avg/min/max | `null` |

Do not universally convert money or large integers with `Number()`. Separate display formatting from calculation and define where rounding belongs.

## Grouping constraints

`by` must be nonempty and unique; aggregate aliases cannot shadow grouped fields. Having and sort operate on group fields or aliases, not arbitrary ungrouped fields.

Repository groupBy currently has no select, limit, offset or cursor. For complex reporting, consider Query or dedicated summary tables while preserving authorization.

## Related statistics and tests

To-many Select branches support count, sum and combine. Record pages and total branches can use different local options, so define the counted scope explicitly.

Test empty sets, NULL, exact decimals, status groups and inaccessible records. See [Association queries](association-queries.md) and [Query inputs](query-inputs.md).

## Interfaces and implementation

- [Aggregate](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/methods/aggregate.md)
- [GroupBy](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/methods/group-by.md)
