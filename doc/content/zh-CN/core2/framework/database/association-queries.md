---
title: 关联查询
description: 通过已声明的关系读取相关记录，了解返回结构、关系内的过滤和统计，以及性能与安全方面的注意事项。
---

关联查询通过已经声明的关系读取相关记录，调用方不必手工拼接物理表名。每一级关联都需要相应的元数据，数据策略也必须允许读取相关的记录。

## 选择根字段与关联

示例沿用 [关系与关联](relations.md) 中的客户与订单关系：

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

根列表最多返回 20 个客户，每个客户最多返回 10 条草稿订单。关系内的 `filter` 只影响 orders 的内容，不会移除没有匹配订单的客户；要筛选客户本身，需要使用根级的关系条件。

## 返回结构

| 关系 | 没有匹配记录时 | 有匹配记录时 |
| --- | --- | --- |
| belongsTo / hasOne | `null` | 对象 |
| hasMany / belongsToMany | `[]` | 数组 |

不传 select 时，默认读取标量字段，不会自动展开关系。不带参数调用 `fields()`，表示明确不选择任何根字段；省略 fields 时，仍然选择默认的标量字段。重复 include 同一个关系会被拒绝。

## 关系内的过滤与统计

to-many 关系支持在关系内排序、limit 和游标；to-one 关系不支持这些分页或聚合选项。关系 Builder 是不可变的，必须使用链式调用返回的结果，不能调用方法之后丢弃返回值。

通过 `combine()`，可以在同一个关系下分别返回记录、计数和求和，各个分支使用各自的条件与分页。不要以为记录分支的 limit 也会限制另一个统计分支。

## 性能与安全

关系按分支批量加载，但关系内的 limit 并不保证数据库只为每个父记录读取限定的行数。多层关系和大集合关系需要评估查询次数、内存占用和返回体的大小。

请明确选择字段并绑定策略。关联查询不是绕过目标记录权限的通道；多个查询分支也不天然处于同一个快照。需要一致的结果时，请使用 [事务](transactions.md)；统计的返回值见 [聚合与统计](aggregation.md)。

## 接口与实现

- [Selection and relations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/select.md)
- [Relation pagination](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/pagination.md)
