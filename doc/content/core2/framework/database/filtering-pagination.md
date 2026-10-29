---
title: Filtering, sorting and pagination
description: Build bounded list queries with filter, sort and pagination, and learn the forms of filter input, the rules of cursor pagination, and consistency and query cost.
---

A Repository selects records with `filter`, orders them with `sort`, and then applies pagination. Lists, counts and exports should share the same authorization scope, so that you do not show counts the user is not allowed to see or produce invalid page numbers.

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

The example reuses an authorized Repository and filter. Business endpoints also need to limit the length of search terms, and pagination with large offsets needs a cost assessment. The list and the total are two separate queries and do not inherently come from the same data snapshot.

## Input forms

Simple scalar equality can be written as `{ status: 'draft' }`; complex conditions use the Filter Builder or a JSON AST. `{ amount: { gte: 100 } }` is not part of the current equality shorthand. When there is no filter, omit it instead of passing an empty object.

Combine conditions with `f.and([...])` / `f.or([...])`. Strings, numbers, dates and JSON each have their own operators; do not compare date strings as ordinary strings to simulate time-zone semantics.

## Cursor pagination

`cursor` is an exclusive boundary on the sort values, and the boundary record does not need to still exist. Cursor pagination requires an explicit sort: the sort axes must be direct scalar fields, declared non-null in the metadata, and include a complete primary key or unique constraint as the tie-breaker. The cursor keys must match the final sort axes exactly, and a cursor cannot be combined with offset.

`direction: 'backward'` fetches the nearest page before the boundary, and the results are still ordered by the original sort. Do not specify direction for the first page; specify it only when there is a cursor. Results have no automatic pageInfo or nextCursor wrapper.

## Consistency and cost

Pagination does not guarantee the same snapshot across requests, and when sort fields change, records can still move between pages. When necessary, use a suitable transaction isolation level or a business snapshot. Keep the query order stable, and design indexes around the filter and sort conditions.

Handle local pagination of related data separately from pagination of the root list; see [Association queries](association-queries.md). For the serializable input produced by builders, see [Query inputs and builders](query-inputs.md).

## Interfaces and implementation

- [Filtering](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/filter.md)
- [Pagination](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/pagination.md)
