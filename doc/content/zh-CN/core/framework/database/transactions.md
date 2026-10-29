---
title: 事务
---

事务让同一个数据库连接上的一组操作共同提交或回滚。业务服务负责定义事务范围，Repository、Query 和 Builder 必须使用回调提供的事务连接。

## 传播事务连接

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

片段演示提交后通知，不包含订单状态与权限检查；实际服务应在事务边界中加入必要策略及并发约束。

不要在回调中重新使用外层 `db.repository()` 或提前取得的 Repository，它们不会自动加入事务。回调返回后事务连接结束，也不能交给后续后台任务使用。

## 提交后与回滚后

`afterCommit()` 适合发布失效通知或安排任务，回滚时其回调会被丢弃。嵌套事务成功时回调并入外层，等最外层提交才执行；嵌套回滚只清理自己的提交回调。

事务 Promise 等待提交后的回调执行，但回调抛错不会改变已提交结果，也不会因此使事务 reject。错误交给连接配置中的 `onTransactionCallbackError`，未配置时产生警告。需要可靠投递时，应另行持久化待发送记录，不能只依赖进程内回调。

`afterRollback()` 用于回滚后的记录与清理。事务外登记 afterCommit 会立即开始执行且调用方不等待；不要据此假设所有场景都具有同一等待语义。

## 并发与方言

事务不自动阻止所有业务竞争。按业务使用唯一约束、条件更新、版本检查或锁。嵌套事务的 savepoint、DDL 事务和隔离级别需要按方言验证。

`builder.transaction()` 当前不负责开启真正的数据库事务；应使用管理器或连接的 transaction。一个连接事务也不覆盖其他连接或邮件、HTTP 等外部系统。

验证成功提交、第二步失败、提交后回调失败和并发写入；只断言函数抛错不足以证明数据已回滚。

应用层的使用与验证见[事务与数据一致性](../../developing-apps/transactions-and-consistency.md)。

## 接口与实现

- [Transaction propagation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/database/transactions.md)
- [Transaction API](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/transactions.md)
