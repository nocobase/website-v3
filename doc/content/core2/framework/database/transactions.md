---
title: Transactions
description: Commit or roll back a group of operations together on one database connection, and learn how the transaction connection is passed, how commit and rollback callbacks work, and the limits around concurrency and dialects.
---

A transaction makes a group of operations on one database connection commit together or roll back together. Business services decide the scope of the transaction, and Repository, Query and Builder calls must all use the transaction connection provided by the callback.

## Passing the transaction connection

```ts
import type { DatabaseManager } from '@nocobase/db';

export async function markPaid(db: DatabaseManager, orderNo: string,
  notify: (orderNo: string) => Promise<void>) {
  return db.transaction(async (connection) => {
    const result = await connection.repository('orders').updateOne({
      filter: { orderNo }, values: { status: 'paid' },
    });
    connection.afterCommit(() => notify(orderNo));
    return result.record;
  });
}
```

The snippet demonstrates sending a notification after commit and does not include order state or permission checks; a real service should add the necessary policies and concurrency constraints within the transaction boundary.

Inside the callback, do not keep using the outer `db.repository()` or a Repository obtained earlier; they do not join the transaction automatically. Once the callback returns, the transaction connection is finished and cannot be handed to background work that runs later.

## After commit and after rollback

`afterCommit()` suits publishing invalidation notices or scheduling follow-up jobs; when the transaction rolls back, these callbacks are discarded. When a nested transaction succeeds, its callbacks are merged into the outer transaction and run only after the outermost transaction commits; when a nested transaction rolls back, only its own commit callbacks are discarded.

The transaction's Promise waits for the post-commit callbacks to finish, but an error thrown by a callback does not change the committed result and does not make the transaction reject. Such errors go to `onTransactionCallbackError` in the connection configuration, or produce a warning when it is not configured. When delivery must be reliable, persist the pending records separately; do not rely only on in-process callbacks.

`afterRollback()` is for recording and cleaning up after a rollback. An afterCommit registered outside a transaction starts immediately, and the caller does not wait for it, so do not assume the same waiting semantics in every situation.

## Concurrency and dialects

Transactions do not automatically prevent every business race. Use unique constraints, conditional updates, version checks or locks as the business requires. Savepoints for nested transactions, transactional DDL and isolation levels all need verification on each dialect.

`builder.transaction()` currently does not open a real database transaction; use the transaction of the manager or the connection. A transaction on one connection also does not cover other connections or external systems such as mail and HTTP.

Verify a successful commit, a failure in the second step, a failing post-commit callback and concurrent writes. Asserting only that a function throws is not enough to prove the data was rolled back.

For application-level usage and verification, see [Transactions and data consistency](../../developing-apps/transactions-and-consistency.md).

## Interfaces and implementation

- [Transaction propagation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/database/transactions.md)
- [Transaction API](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/transactions.md)
