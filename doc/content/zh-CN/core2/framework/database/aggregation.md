---
title: 聚合与统计
description: 用 aggregate() 和 groupBy() 在数据库端计算计数、求和、平均值和极值，了解数值精度、空集结果、分组约束和关系统计。
---

聚合在数据库端计算计数、求和、平均值和极值，适合总览和报表。统计结果同样会暴露信息，应使用与明细数据相同的权限范围。

## 根级统计与分组统计

```ts
const totals = await db.repository('orders').aggregate({
  filter: { status: 'paid' },
  aggregate: (a) => ({ count: a.count(), total: a.sum('amount') }),
});

const byStatus = await db.repository('orders').groupBy({
  by: ['status'],
  aggregate: (a) => ({ count: a.count(), total: a.sum('amount') }),
  having: (f) => f.number('count').gte(2),
  sort: (s) => s.field('status').asc(),
});
```

`aggregate()` 返回一个从别名到数值的对象，没有 record 包装。`groupBy()` 返回一个数组，每项包含分组字段和聚合别名。执行顺序是：先由 filter 选出源记录，再分组，最后由 having 过滤分组的结果。

## 数值与空集

| 运算 | 结果的含义 |
| --- | --- |
| `count()` | 统计行数，空集时为数字 0 |
| `count(field)` | 忽略该字段为 SQL NULL 的行 |
| `sum()` / `avg()` | 整数和 DECIMAL 以字符串返回以保留精度；浮点字段返回 number |
| `min()` / `max()` | 保持字段对应的逻辑类型 |
| 空集的 sum、avg、min、max | `null` |

不要对金额或大整数的结果统一使用 `Number()`，否则可能丢失精度。展示格式和计算语义应该分开处理；平均值在哪一步舍入，由业务明确决定。

## 分组约束

`by` 必须非空且不能重复；聚合别名不能与分组字段重名。having 和 sort 只能引用分组字段或聚合别名，不能引用任意未分组的字段。

当前 Repository 的 groupBy 不提供 select、limit、offset 或 cursor。不要直接照搬其他 ORM 的分页写法；需要复杂报表时，可以评估使用 Query 或独立的汇总表，同时保留授权范围。

## 关系统计与验证

to-many 关系可以通过 Select 返回 count、sum 或 combine 分支。记录分页和总量统计可以使用不同的关系内选项，因此需要明确总量统计的到底是哪个范围。

测试应覆盖空集、NULL、精确金额、不同的状态以及越权的记录。关联统计见 [关联查询](association-queries.md)，输入的构造见 [查询输入与构造器](query-inputs.md)。

## 接口与实现

- [Aggregate](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/methods/aggregate.md)
- [GroupBy](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/methods/group-by.md)
