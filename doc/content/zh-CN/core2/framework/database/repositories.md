---
title: Repository 与数据操作
---

Repository 按 Collection 的逻辑字段和关系读写数据，处理字段编解码、查询输入和绑定的策略。取得 Repository 不会创建表，也不会替调用方完成身份认证。

本篇介绍服务端直接访问数据库。需要让前端调用时，通过 `defineRepositoryApiRoutes()` 声明 [Repository 数据接口](../http/repository-routes.md)，再用 `api.repository(name)` 访问；数据库操作不会自动变成 HTTP 接口。

## 单条写入

以下片段使用[订单模型](schema.md)，要求 `SO-001` 尚未存在；面向用户的接口需先绑定授权策略：

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

`createOne()`、`updateOne()` 和 `upsertOne()` 返回变更结果，从 `.record` 取记录，不能把整个结果当成业务行。金额使用精确字符串，避免浮点误差。

## 读取与写入契约

| 方法 | 行为 |
| --- | --- |
| `findMany()` | 惰性查询；await 得到数组，也可异步迭代 |
| `findOne()` | 一条记录或 `undefined`，不证明筛选唯一 |
| `count()` / `exists()` | 统计或判断存在 |
| `updateOne()` / `deleteOne()` | 必须定位恰好一条，否则失败 |
| `upsertOne()` | 唯一筛选，分别给出 create 与 update |
| 批量 create/update/delete | 返回计数，按 select 返回记录 |

同一个 `findMany()` 对象不要混合 await 与异步迭代或重复迭代。批量更新和删除必须提供筛选或明确 `all: true`；批量写入值不支持所有单条嵌套关系操作。

## 字段选择与权限

用 `select` 只返回调用方需要的字段。不设置 select 通常读取全部标量，不能因此泄漏密码或内部字段。通过 `withPolicy()` 绑定服务端授权得到的行、字段与关系策略；写入返回的读取同样受策略约束。

Repository 不根据客户端提交的过滤器授予权限。外部查询条件仍需验证字段、数量和查询复杂度。

## 何时使用 Query

复杂集合式回填或 Repository 不能表达的表查询可使用 Query。它不具有 Repository 的全部模型映射与策略语义，因此需要显式处理命名和授权边界。多步写入使用[事务](transactions.md)，关联读取见[关联查询](association-queries.md)。

## 接口与实现

- [Repository methods](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/repository.md)
- [Policy behavior](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
