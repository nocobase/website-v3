---
title: 服务端服务
---

服务端服务集中处理业务规则，让 HTTP、CLI 和后台工作复用同一行为。输入校验与身份提取发生在入口，数据范围和业务约束在调用链中显式传递。

## 把框架资源注入业务类

以下片段假设已有包含 `id`、`title` 的 `orders` Collection：

```ts
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export class OrdersService {
  constructor(private readonly database: DatabaseManager) {}

  async list(policy: RepositoryPolicy) {
    return this.database.repository('orders').withPolicy(policy).findMany({
      select: (s) => s.fields('id', 'title'),
      sort: (s) => [s.field('id').asc()],
      limit: 20,
    });
  }
}
```

ServiceProvider 从 `databaseManagerToken` 解析应用数据库，将它注入 `OrdersService`，再用业务 Token 注册服务。路由从应用容器取得服务并传入授权产生的策略；不能直接信任请求中的策略对象。

## 请求状态不属于单例

不要在服务字段中保存当前用户、当前事务或本次请求的输入，否则并发请求可能互相覆盖。将这些值放进方法参数。HTTP Context 可在路由层转换成业务需要的小型上下文，避免服务绑定某个 Web 框架。

## 事务与外部效果

需要多步原子写入时，在服务方法中创建事务，并使用回调连接取得 Repository。事务连接不能从方法返回后继续使用。邮件、HTTP 调用和队列投递通常不随数据库回滚；将它们安排在提交后的流程，并按业务要求记录重试和幂等键。

不要把“数据库已提交”与“通知已送达”合并成一个无法恢复的状态。强一致的投递需求需要明确设计持久化待投递记录及恢复过程。

## 多入口复用与测试

CLI 或任务没有浏览器请求身份，应明确系统执行者和允许的数据范围。不能因为复用同一服务就默认拥有管理员权限。

对规则用单元测试，对策略、事务和并发行为用真实数据库测试。完整接入见[业务服务与 HTTP 接口](../../developing-apps/apis-and-services.md)和[事务](../database/transactions.md)。

## 接口与实现

- [Database service integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/database/index.ts)
- [Repository policies](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
