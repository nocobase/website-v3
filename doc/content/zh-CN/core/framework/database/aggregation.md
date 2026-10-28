---
title: 聚合与统计
---

聚合在数据库端计算计数、求和、平均值和极值，适合总览和报表。统计也会暴露信息，应使用与明细相同的权限范围。

## 根级与分组统计

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

`aggregate()` 返回别名到数值的对象，不带 record 包装。`groupBy()` 返回包含分组字段和聚合别名的数组。先由 filter 选源记录，再分组，再由 having 过滤分组结果。

## 数值与空集

| 运算 | 结果语义 |
| --- | --- |
| `count()` | 统计行，空集为数字 0 |
| `count(field)` | 忽略该字段的 SQL NULL |
| `sum()` / `avg()` | 整数与 DECIMAL 保留精度字符串；浮点字段返回 number |
| `min()` / `max()` | 保留字段对应逻辑类型 |
| 空集的 sum/avg/min/max | `null` |

不要对金额或大整数结果统一使用 `Number()`，否则可能丢精度。展示格式和计算语义应分开；平均值的舍入位置由业务明确决定。

## 分组约束

`by` 必须非空且不重复；聚合别名不能覆盖分组字段。having 和 sort 面向分组字段或聚合别名，不能引用任意未分组字段。

当前 Repository groupBy 不提供 select、limit、offset 或 cursor。不要把其他 ORM 的分页语法直接搬来；需要复杂报表时评估 Query 或独立汇总表，并保留授权范围。

## 关系统计与验证

to-many 关系可通过 Select 返回 count、sum 或 combine 分支。记录页和总量统计可以使用不同局部选项，需明确总量究竟统计哪一范围。

测试空集、NULL、精确金额、不同状态和越权记录。关联统计见[关联查询](association-queries.md)，输入构造见[查询输入](query-inputs.md)。

## 接口与实现

- [Aggregate](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/methods/aggregate.md)
- [GroupBy](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/methods/group-by.md)
