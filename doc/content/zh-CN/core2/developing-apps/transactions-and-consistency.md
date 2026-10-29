---
title: 事务与数据一致性
description: 在业务服务中划定事务边界，验证失败回滚、并发约束，以及跨连接和外部效果的边界。
---

事务让同一个数据库连接上的一组操作一起提交或一起回滚。事务应围绕一个明确的业务结果来组织，例如：先确认任务和目标项目都允许操作，再保存任务的归属。

本篇沿用 [建表与数据初始化](data-models-and-migrations.md) 中历史的 `tutorialTasks`／`tutorialProjects` 示例及其准备条件，它不是当前入门教程中的 `tasks` 模型。完整的服务见 [服务端业务服务](server-business-services.md)。

## 在服务中使用事务连接

需要一起成功或一起失败的读写，放进同一个事务中，并且所有操作都使用回调收到的 `connection`：

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

以上只示意事务的结构；正式的服务会使用可以区分的业务错误，再由路由转换为 API 错误，见 [路由与 HTTP 接口](apis-and-services.md)。在事务中调用外层的 `database.repository()`，操作会脱离本次事务；捕获错误后正常返回，则可能提交了部分工作。

事务并不能自动解决并发覆盖的问题。两个人修改同一条任务时，如果业务不能接受“最后一次成功写入生效”，还需要版本条件等并发控制。通知等外部副作用，应放在提交之后处理。`connection.afterCommit()` 适合在提交后触发工作，但它的失败无法撤销已经提交的数据，也不保证外部消息一定送达。

## 把事务连接传给协作的方法

如果服务拆成了多个方法，由调用方把事务连接一路传下去。不要让内部方法自己回到全局的数据库管理器，也不要把连接保存到单例的字段中。事务结束后，这个连接不能再交给后台任务继续使用。

只需要操作某个指定的连接时，可以使用 `database.connection('analytics').transaction(...)`；默认连接上的事务管不到 `analytics` 中的写入。多个连接并不构成一个分布式事务，详见 [多数据库连接](multiple-databases.md)。

## 事务不能代替业务约束

| 需求 | 还需要什么 |
| --- | --- |
| 同一个业务键不能重复 | 数据库唯一约束，并处理冲突 |
| 引用必须指向存在的记录 | 符合业务的外键和删除规则 |
| 不允许覆盖别人刚保存的修改 | 版本前置条件或其他并发控制 |
| 只能修改已获授权的记录 | 在事务内的 Repository 上绑定授权策略 |

“先查询、再更新”并不能自动避免并发覆盖。项目示例没有提供乐观锁；需要版本控制时，请明确模型中的版本字段和更新条件，并在目标数据库上测试并发行为，不能仅凭单人操作成功就判断实现正确。

## 提交后执行不等于可靠投递

`connection.afterCommit()` 的回调只在提交后执行，事务回滚时会被丢弃。回调失败不会撤销已经提交的数据，也不会让事务的 Promise 失败；错误由 `onTransactionCallbackError` 处理，未配置时会产生一条警告。具体的等待和嵌套语义见 [事务](../framework/database/transactions.md)。

邮件、HTTP 调用和任务投递都不会随数据库回滚。如果要求“数据提交后最终一定发送”，应把待发送的记录和业务变更写入同一个事务，再由可以恢复的后台流程投递，并使用业务幂等键。任务的接入方式见 [后台任务与定时执行](background-tasks.md)。

## 验证数据结果

在隔离的数据库中，至少覆盖三种情况：成功提交、第一步写入后第二步失败、提交后回调失败。失败之后必须重新读取数据，确认是否已经回滚；只断言抛出了错误，不能证明原记录没有被改变。

接着再验证唯一键竞争、版本冲突、权限范围和连接隔离。SQLite 上的测试可以验证基本规则，但不能代替对目标数据库的隔离级别、锁和 DDL 行为的验证。项目示例的真实接口测试见 [路由与 HTTP 接口](apis-and-services.md)，通用的测试组织见 [测试与验收](testing-and-acceptance.md)。
