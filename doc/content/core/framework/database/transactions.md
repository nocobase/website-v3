---
title: Transactions
---

A transaction commits or rolls back operations on one connection together. Business services define its scope; Repository, Query and Builder work must use the callback connection.

## Propagating the connection

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

This demonstrates post-commit notification, not complete order authorization or state checks. Add policies and concurrency constraints inside the real business boundary.

Do not use outer-manager Repositories or previously obtained handles inside the callback. They do not automatically join the transaction. The callback connection also cannot be passed to work continuing after completion.

## Commit and rollback callbacks

Use `afterCommit()` for invalidations or scheduling; rollback discards these callbacks. Successful nested transactions merge callbacks into the outer transaction, while nested rollback discards its own commit callbacks.

The transaction promise waits for post-commit callbacks, but their failures neither reverse the commit nor reject that transaction. Errors go to the connection’s `onTransactionCallbackError`, or a warning when unconfigured. Reliable delivery needs separately persisted pending work; in-process callbacks alone are insufficient.

`afterRollback()` records or cleans up after rollback. Outside a transaction, afterCommit starts immediately without awaiting completion, so its waiting semantics differ.

## Concurrency and dialects

Transactions do not eliminate all business races. Use unique constraints, conditional updates, versions or locks as appropriate. Verify savepoints, transactional DDL and isolation on each dialect.

`builder.transaction()` currently does not start a database transaction; use the manager or connection. A connection transaction also excludes other connections and external mail/HTTP systems.

Test successful commits, failures after earlier writes, callback failures and concurrent changes. An exception alone does not prove rollback.

See [Transactions and data consistency](../../developing-apps/transactions-and-consistency.md) for application usage and verification.

## Interfaces and implementation

- [Transaction propagation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/database/transactions.md)
- [Transaction API](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/transactions.md)
