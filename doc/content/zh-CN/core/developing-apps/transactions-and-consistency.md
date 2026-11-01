---
title: 事务与数据一致性
description: 在业务服务中划分事务，验证失败回滚、并发约束和跨连接及外部效果的边界。
---

事务用于让同一数据库连接中的一组操作共同提交或回滚。它应围绕一个明确的业务结果组织，例如确认任务和目标项目都允许操作后，再保存归属。

本篇保留[历史项目的数据准备](https://github.com/nocobase/website-v3/blob/e7f20aeea2f9e63d396cb99a4e3775902823f3cb/doc/content/zh-CN/core/developing-apps/data-models-and-migrations.md)的历史 `tutorialTasks`／`tutorialProjects` 示例及其准备条件，不是当前入门教程的 `tasks` 模型。完整服务见[旧版项目服务源码](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/zh-CN/core/developing-apps/server-business-services.md)。

## 在服务中使用事务连接


需要一起成功或失败的读写放进同一事务，且所有操作都使用回调收到的 `connection`：

```ts
await database.transaction(async (connection) => {
  const tasks = connection.repository('tutorialTasks').withPolicy(taskPolicy);
  const projects = connection
    .repository('tutorialProjects')
    .withPolicy(projectPolicy);

  const task = await tasks.findOne({ filter: { id: taskId } });
  if (!task) throw new Error('Task unavailable.');
  const project = await projects.findOne({ filter: { id: projectId } });
  if (!project) throw new Error('Project unavailable.');

  await tasks.updateOne({
    filter: { id: taskId },
    values: { projectId, updatedAt: new Date() },
  });
});
```

这是事务结构示意；正式服务使用可区分的业务错误，再由路由转换为 API 错误，见[HTTP 路由与接口](apis-and-services.md)。事务中调用外层的 `database.repository()` 会离开本次事务；捕获错误后正常返回则可能提交部分工作。

事务不自动解决并发覆盖。同一任务被两个人修改时，如果业务不接受“最后一次成功写入生效”，还需要版本条件等并发控制。通知等外部副作用放到提交之后处理；`connection.afterCommit()` 适合提交后触发工作，但其失败不能撤销已经提交的数据，也不保证外部消息可靠送达。

## 把事务连接传给协作方法

如果服务拆成多个方法，让调用方把事务连接传下去。不要让内部方法自行回到全局数据库管理器，也不要把连接保存到单例字段。事务结束后连接不能交给后台任务继续使用。

只需操作指定连接时，可用 `database.connection('analytics').transaction(...)`；默认连接的事务不能覆盖 `analytics` 中的写入。多个连接不是一个分布式事务，详见[多数据库连接](multiple-databases.md)。

## 事务不能替代业务约束

| 需求 | 还需要什么 |
| --- | --- |
| 同一业务键不可重复 | 数据库唯一约束，并处理冲突 |
| 引用必须指向存在的记录 | 适合业务的外键和删除规则 |
| 不允许覆盖别人刚保存的修改 | 版本前置条件或其他并发控制 |
| 只能修改获授权的记录 | 在事务中的 Repository 上绑定授权策略 |

先查询再更新，并不自动避免并发覆盖。项目示例没有承诺乐观锁；需要版本控制时，明确模型字段与版本条件，并用目标数据库测试并发行为，不能只根据单人操作成功判断正确。

## 提交后执行不等于可靠投递

`connection.afterCommit()` 的回调只在提交后执行，回滚时丢弃。回调失败不会撤销已提交数据，也不会因此让事务 Promise 失败；错误由 `onTransactionCallbackError` 处理，未配置时产生警告。具体等待与嵌套语义见[事务机制](../framework/database/transactions.md)。

邮件、HTTP 调用和任务投递不随数据库回滚。要求“数据提交后最终一定发送”时，把待发送记录与业务变更写入同一个事务，再由可恢复的后台流程投递，并使用业务幂等键。任务接入见[后台任务与定时执行](background-tasks.md)。

## 验证数据结果

在隔离数据库中，至少覆盖成功提交、第一步写入后第二步失败，以及提交后回调失败。失败后必须重新读取数据，确认是否回滚；只断言抛错不能证明原记录未改变。

再验证唯一键竞争、版本冲突、权限范围和连接隔离。SQLite 测试可以验证基础规则，但不能替代目标数据库的隔离级别、锁及 DDL 行为验证。项目示例的真实接口测试见[历史项目接口示例](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/zh-CN/core/developing-apps/apis-and-services.md)，通用测试组织见[测试与验收](testing-and-acceptance.md)。
