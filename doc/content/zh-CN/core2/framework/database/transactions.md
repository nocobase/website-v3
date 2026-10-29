---
title: 事务
description: 在同一个数据库连接上让一组操作共同提交或回滚，了解事务连接的传递、提交后与回滚后的回调，以及并发与方言方面的限制。
---

事务让同一个数据库连接上的一组操作一起提交或一起回滚。业务服务负责划定事务的范围，Repository、Query 和 Builder 都必须使用回调提供的事务连接。

## 传递事务连接

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

这个片段演示的是提交之后发送通知，不包含订单状态和权限的检查；实际的服务应在事务边界内加入必要的策略和并发约束。

不要在回调中继续使用外层的 `db.repository()`，或提前取得的 Repository，它们不会自动加入事务。回调返回之后，事务连接就结束了，也不能交给之后的后台任务使用。

## 提交之后与回滚之后

`afterCommit()` 适合用来发布失效通知或安排后续任务；事务回滚时，这些回调会被丢弃。嵌套事务成功时，它的回调会并入外层事务，等最外层提交之后才执行；嵌套事务回滚时，只清理它自己的提交回调。

事务的 Promise 会等待提交后的回调执行完毕，但回调抛出的错误不会改变已经提交的结果，也不会让事务因此 reject。这类错误交给连接配置中的 `onTransactionCallbackError` 处理，没有配置时会产生警告。需要可靠投递时，应另外持久化待发送的记录，不能只依赖进程内的回调。

`afterRollback()` 用于回滚之后的记录和清理。在事务之外登记的 afterCommit 会立即开始执行，并且调用方不会等待它；因此不要假设所有场景都有相同的等待语义。

## 并发与方言

事务不会自动阻止所有的业务竞争，请根据业务使用唯一约束、条件更新、版本检查或锁。嵌套事务的 savepoint、DDL 是否支持事务，以及隔离级别，都需要按方言验证。

`builder.transaction()` 目前不负责开启真正的数据库事务，应使用管理器或连接的 transaction。一个连接上的事务，也不覆盖其他连接，或邮件、HTTP 等外部系统。

验证时覆盖：成功提交、第二步失败、提交后的回调失败，以及并发写入。只断言函数抛出了错误，不足以证明数据已经回滚。

应用层的用法与验证，见 [事务与数据一致性](../../developing-apps/transactions-and-consistency.md)。

## 接口与实现

- [Transaction propagation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/database/transactions.md)
- [Transaction API](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/transactions.md)
