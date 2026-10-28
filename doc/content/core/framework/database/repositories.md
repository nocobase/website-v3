---
title: Repositories and data operations
---

Repository reads and writes logical Collection fields and relations, applying codecs, query contracts and bound policies. Obtaining one neither creates tables nor authenticates callers.

This page covers direct server-side database access. To call it from a client, declare [Repository data APIs](../http/repository-routes.md) with `defineRepositoryApiRoutes()` and use `api.repository(name)`. Database operations do not automatically become HTTP endpoints.

## Single-record writes

This uses the [order model](schema.md) and requires `SO-001` to be absent. User-facing callers must first bind authorization-derived policies:

```ts
import type { DatabaseManager } from '@nocobase/db';

export async function createOrder(database: DatabaseManager) {
  const orders = database.repository('orders');
  const result = await orders.createOne({
    values: { orderNo: 'SO-001', title: 'First order', amount: '19.90' },
  });
  return result.record;
}
```

`createOne()`, `updateOne()` and `upsertOne()` return mutation results; read `.record` rather than treating the result as a row. Exact decimal strings avoid floating-point money errors.

## Read/write contracts

| Method | Behavior |
| --- | --- |
| `findMany()` | Lazy query; await an array or iterate asynchronously |
| `findOne()` | A record or `undefined`, without asserting uniqueness |
| `count()` / `exists()` | Count or existence |
| `updateOne()` / `deleteOne()` | Require exactly one target |
| `upsertOne()` | Unique selector with separate create/update inputs |
| Bulk create/update/delete | Counts and optionally selected records |

Do not mix awaiting and iteration, or repeatedly iterate one query. Bulk update/delete requires a filter or explicit `all: true`. Bulk values do not support all single-record nested relation operations.

## Selection and authorization

Select only required fields. Omitting selection normally reads all scalars and must not expose sensitive fields. Apply server-derived row, field and relation policies with `withPolicy()`; mutation return reads are also governed by policy.

Caller-provided filters do not grant access. Validate fields, limits and complexity for external query input.

## When to use Query

Use Query for set-based backfills or table queries Repository cannot express. It does not carry every Repository mapping or policy semantic, so handle naming and authorization explicitly. See [Transactions](transactions.md) and [Association queries](association-queries.md).

## Interfaces and implementation

- [Repository methods](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/repository.md)
- [Policy behavior](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
