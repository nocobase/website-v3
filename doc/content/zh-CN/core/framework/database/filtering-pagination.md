---
title: 过滤、排序与分页
---

Repository 用 `filter` 选记录、`sort` 定顺序，再应用分页。列表、计数和导出应基于同一授权范围，避免显示越权数量或产生无效页码。

## 有界的列表查询

```ts
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export async function searchOrders(db: DatabaseManager, policy: RepositoryPolicy,
  input: { q: string; page: number; pageSize: number }) {
  const { q, page, pageSize } = input;
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize)
    || pageSize < 1 || pageSize > 100) throw new Error('Invalid pagination');
  const offset = (page - 1) * pageSize;
  if (!Number.isSafeInteger(offset)) throw new Error('Invalid offset');
  const orders = db.repository('orders').withPolicy(policy);
  const filter = q ? ((f: import('@nocobase/db').FilterBuilder) =>
    f.string('title').includes(q)) : undefined;
  const data = await orders.findMany({
    filter, select: (s) => s.fields('id', 'title', 'status'),
    sort: (s) => s.field('id').asc(), limit: pageSize, offset,
  });
  const total = await orders.count({ filter });
  return { data, total };
}
```

该例复用已授权 Repository 和筛选条件。业务接口还需限制搜索词长度；大偏移分页需要评估成本。列表与总数是两次查询，并不天然来自同一个快照。

## 输入形式

简单标量等值可写 `{ status: 'draft' }`；复杂条件使用 Filter Builder 或 JSON AST。`{ amount: { gte: 100 } }` 不是当前等值简写语法。空筛选直接省略，不传空对象。

逻辑组合使用 `f.and([...])` / `f.or([...])`。字符串、数值、日期、JSON 各有对应操作符，不要将日期字符串当作普通字符比较来模拟时区语义。

## 游标分页

`cursor` 表示排序值的排他边界，不要求边界记录仍存在。必须显式提供排序；轴只能使用直接标量字段，元数据需明确非空，并包含完整主键或唯一约束作为决胜项。游标键必须与最终排序轴完全一致，不能和 offset 同用。

`direction: 'backward'` 获取边界之前最近的一页，返回仍按原 sort 顺序排列。首屏不指定 direction；有 cursor 才指定方向。返回没有自动 pageInfo 或 nextCursor 包装。

## 一致性与成本

分页不保证跨请求快照，排序字段修改仍可能造成记录移动。必要时采用适当事务隔离或业务快照。查询顺序要稳定，并按筛选与排序设计索引。

关联局部分页和根列表分页分开处理，见[关联查询](association-queries.md)。构造器的可序列化输入见[查询输入](query-inputs.md)。

## 接口与实现

- [Filtering](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/filter.md)
- [Pagination](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/pagination.md)
