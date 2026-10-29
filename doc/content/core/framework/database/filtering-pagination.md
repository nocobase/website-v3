---
title: Filtering, sorting and pagination
---

Repository filters records, sorts them and then paginates. Lists, counts and exports should share authorization scope to avoid leaking totals or producing invalid pages.

## Bounded list queries

```ts
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export async function searchOrders(db: DatabaseManager, policy: RepositoryPolicy,
  input: { q: string; page: number; pageSize: number }) {
  const { q, page, pageSize } = input;
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize)
    || pageSize < 1 || pageSize > 100) throw new Error('Invalid pagination');
  const offset = (page - 1) * pageSize;
  if (!Number.isSafeInteger(offset)) throw new Error('Invalid offset');
  const orders = db.repository('orders').withPolicy(policy);
  const filter = q ? ((f: import('@nocobase/db').FilterBuilder) =>
    f.string('title').includes(q)) : undefined;
  const data = await orders.findMany({
    filter, select: (s) => s.fields('id', 'title', 'status'),
    sort: (s) => s.field('id').asc(), limit: pageSize, offset,
  });
  const total = await orders.count({ filter });
  return { data, total };
}
```

This reuses the authorized Repository and filter. Also bound search length and evaluate large-offset costs. List and count are separate queries, not automatically one snapshot.

## Input forms

Use `{ status: 'draft' }` for scalar equality and Filter Builder or JSON AST for complex conditions. Nested operator objects such as `{ amount: { gte: 100 } }` are not equality shorthand. Omit an unused filter instead of passing an empty object.

Combine nodes with `f.and([...])` and `f.or([...])`. Strings, numbers, dates and JSON have distinct operators; string comparison does not model time-zone-aware date semantics.

## Cursor pagination

A cursor is an exclusive sorting-value boundary; its record need not still exist. Provide explicit scalar sorting with non-nullable metadata and a complete primary/unique key as a tie-breaker. Cursor keys must exactly match the final sort axes, and cannot be combined with offset.

`direction: 'backward'` selects the nearest page before the boundary while preserving original sort order. Omit direction on the initial page; explicit direction requires a cursor. Results have no automatic pageInfo or nextCursor envelope.

## Consistency and cost

Pagination does not provide a snapshot across requests, and changing sort values can move records. Use appropriate isolation or business snapshots when required. Keep ordering stable and design indexes for filters and ordering.

See [Association queries](association-queries.md) for relation-local pages and [Query inputs](query-inputs.md) for serialization.

## Interfaces and implementation

- [Filtering](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/filter.md)
- [Pagination](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/pagination.md)
