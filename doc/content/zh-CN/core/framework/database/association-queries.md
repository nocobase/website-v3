---
title: 关联查询
---

关联查询通过已声明的关系读取相关记录，避免调用方手工拼接物理表名。每一级关联都需要对应元数据，数据策略也必须允许相关读取。

## 选择根字段与关联

示例沿用[客户与订单关系](relations.md)：

```ts
const customers = await db.repository('customers').findMany({
  select: (s) => s.fields('id', 'name').include('orders', (orders) =>
    orders.fields('id', 'title', 'amount')
      .filter({ status: 'draft' })
      .sort((s) => s.field('id').asc())
      .limit(10)),
  sort: (s) => s.field('id').asc(),
  limit: 20,
});
```

根列表最多 20 个客户，每个客户返回最多 10 条草稿订单。关系局部 `filter` 只影响 orders 内容，不会移除没有匹配订单的客户；筛选客户本身需要根级关系条件。

## 返回形状

| 关系 | 无匹配记录 | 有匹配记录 |
| --- | --- | --- |
| belongsTo / hasOne | `null` | 对象 |
| hasMany / belongsToMany | `[]` | 数组 |

不传 select 时默认读取标量字段，不自动展开关系。`fields()` 无参数明确选择零个根字段；省略 fields 则仍选择默认标量。重复 include 同一关系会被拒绝。

## 局部过滤和统计

to-many 关系支持局部排序、limit 和游标；to-one 不支持这些分页或聚合选项。关系 Builder 是不可变的，必须返回链式调用结果，不能只调用方法后丢弃返回值。

通过 `combine()` 可在同一关系下分别返回记录、计数和求和，分支使用各自条件与分页。不要以为记录分支的 limit 同时限制另一个统计分支。

## 性能与安全

关系按分支批量加载，但局部 limit 不保证数据库只读取每个父记录的限定行数。多层和大集合关系需评估查询次数、内存与返回体大小。

明确选择字段并绑定策略。关联不是绕过目标记录权限的通道；多个查询分支也不天然处于同一个快照。需要一致结果时使用[事务](transactions.md)，统计返回值见[聚合](aggregation.md)。

## 接口与实现

- [Selection and relations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/select.md)
- [Relation pagination](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/pagination.md)
