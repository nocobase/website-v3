---
title: Repositories and data operations
description: Read and write data on the server with Repositories, and learn the behavior of each method, field selection and permission policies, and when to use Query instead.
---

A Repository reads and writes data by a Collection's logical fields and relations, and handles field codecs, query input and bound policies. Getting a Repository does not create tables, and does not authenticate the caller.

This page covers direct database access on the server. When the frontend needs to call it, declare [Repository data APIs](../http/repository-routes.md) with `defineRepositoryApiRoutes()` and access them through `api.repository(name)`; database operations do not become HTTP endpoints automatically.

## Writing a single record

The following snippet uses the [order model](schema.md) and requires that `SO-001` does not exist yet. User-facing endpoints must bind an authorization policy first:

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

`createOne()`, `updateOne()` and `upsertOne()` return mutation results; get the record from `.record` instead of treating the whole result as a business row. Amounts use exact strings to avoid floating-point errors.

## Read and write conventions

| Method | Behavior |
| --- | --- |
| `findMany()` | Lazy query; await it for an array, or iterate it asynchronously |
| `findOne()` | Returns one record or `undefined`; does not prove the filter is unique |
| `count()` / `exists()` | Count records or check whether any exist |
| `updateOne()` / `deleteOne()` | Must target exactly one record, or fail |
| `upsertOne()` | Takes a unique filter and separate create and update values |
| Bulk create, update and delete | Return the number affected, and records according to select |

Do not mix awaiting and asynchronous iteration on the same `findMany()` object, and do not iterate it more than once. Bulk updates and deletes require a filter or an explicit `all: true`; bulk write values do not support every nested relation operation available for single-record writes.

## Field selection and permissions

Use `select` to return only the fields the caller needs. Without select, all scalar fields are usually read, so make sure that does not leak passwords or internal fields. Bind the row, field and relation policies produced by server authorization with `withPolicy()`; data returned after a write is also subject to the read policy.

A Repository does not grant permissions based on filters submitted by the client. Query conditions from outside still need validation of fields, limits and query complexity.

## When to use Query

Use Query for complex set-based backfills or table queries that a Repository cannot express. Query does not carry all of a Repository's model mappings and policy semantics, so handle naming and authorization boundaries explicitly. For multi-step writes, use [Transactions](transactions.md); for reading related data, see [Association queries](association-queries.md).

## Interfaces and implementation

- [Repository methods](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/repository.md)
- [Policy behavior](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
