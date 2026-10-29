---
title: Repository 与数据操作
description: 在服务端用 Repository 读写数据，了解各方法的行为约定、字段选择与权限策略，以及何时改用 Query。
---

Repository 按照 Collection 的逻辑字段和关系读写数据，并负责字段编解码、查询输入和已绑定的策略。取得 Repository 并不会创建数据表，也不会替调用方完成身份认证。

本篇介绍服务端如何直接访问数据库。需要让前端调用时，通过 `defineRepositoryApiRoutes()` 声明 [Repository 数据接口](../http/repository-routes.md)，再用 `api.repository(name)` 访问；数据库操作不会自动变成 HTTP 接口。

## 写入单条记录

下面的片段使用 [订单模型](schema.md)，并要求 `SO-001` 尚不存在。面向用户的接口需要先绑定授权策略：

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

`createOne()`、`updateOne()` 和 `upsertOne()` 返回的是变更结果，记录需要从 `.record` 中取得，不能把整个结果当成业务数据行。金额使用精确的字符串，以避免浮点误差。

## 读取与写入的约定

| 方法 | 行为 |
| --- | --- |
| `findMany()` | 惰性查询；await 后得到数组，也可以异步迭代 |
| `findOne()` | 返回一条记录或 `undefined`，不能证明筛选条件是唯一的 |
| `count()` / `exists()` | 统计数量或判断是否存在 |
| `updateOne()` / `deleteOne()` | 必须恰好定位到一条记录，否则失败 |
| `upsertOne()` | 使用唯一的筛选条件，分别给出 create 和 update 的值 |
| 批量的 create、update、delete | 返回影响的数量，按 select 返回记录 |

不要对同一个 `findMany()` 对象混用 await 和异步迭代，也不要重复迭代。批量更新和删除必须提供筛选条件，或者明确指定 `all: true`；批量写入的值并不支持单条写入中所有的嵌套关系操作。

## 字段选择与权限

用 `select` 只返回调用方需要的字段。不设置 select 时，通常会读取全部标量字段，要注意不能因此泄露密码或内部字段。通过 `withPolicy()` 绑定服务端授权得出的行、字段和关系策略；写入之后返回的数据，同样受读取策略的约束。

Repository 不会根据客户端提交的过滤条件授予权限。外部传入的查询条件，仍然需要校验字段、数量和查询的复杂度。

## 何时使用 Query

复杂的集合式回填，或 Repository 无法表达的表查询，可以使用 Query。Query 不具备 Repository 全部的模型映射和策略语义，因此需要显式处理命名和授权的边界。多步写入请使用 [事务](transactions.md)，关联数据的读取见 [关联查询](association-queries.md)。

## 接口与实现

- [Repository methods](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/repository.md)
- [Policy behavior](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
