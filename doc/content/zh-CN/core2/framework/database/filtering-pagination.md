---
title: 过滤、排序与分页
description: 用 filter、sort 和分页构造有界的列表查询，了解筛选输入的形式、游标分页的规则，以及一致性与查询成本。
---

Repository 用 `filter` 选出记录，用 `sort` 决定顺序，然后再应用分页。列表、计数和导出应基于同一个授权范围，以免显示越权的数量或产生无效的页码。

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

这个示例复用了已经授权的 Repository 和筛选条件。业务接口还需要限制搜索词的长度；使用较大偏移量的分页时，要评估查询成本。列表和总数是两次查询，并不天然来自同一个数据快照。

## 输入形式

简单的标量等值条件可以写成 `{ status: 'draft' }`；复杂的条件使用 Filter Builder 或 JSON AST。`{ amount: { gte: 100 } }` 不属于当前的等值简写语法。没有筛选条件时直接省略，不要传空对象。

逻辑组合使用 `f.and([...])` / `f.or([...])`。字符串、数值、日期和 JSON 各有对应的操作符；不要把日期字符串当作普通字符串比较，来模拟时区语义。

## 游标分页

`cursor` 表示排序值的排他边界，并不要求边界上的记录仍然存在。使用游标分页时必须显式提供排序：排序轴只能是直接的标量字段，元数据中需要明确为非空，并且要包含完整的主键或唯一约束作为决胜项。游标的键必须与最终的排序轴完全一致，也不能与 offset 同时使用。

`direction: 'backward'` 用于获取边界之前最近的一页，返回结果仍然按原来的 sort 顺序排列。首屏查询不指定 direction；有 cursor 时才指定方向。返回结果中没有自动附带的 pageInfo 或 nextCursor 包装。

## 一致性与成本

分页不保证多次请求之间看到的是同一个快照，排序字段被修改时，记录仍可能在页之间移动。必要时，采用合适的事务隔离级别或业务快照。查询的顺序要稳定，并根据筛选和排序条件设计索引。

关联数据的局部分页和根列表的分页要分开处理，见 [关联查询](association-queries.md)。构造器生成的可序列化输入见 [查询输入与构造器](query-inputs.md)。

## 接口与实现

- [Filtering](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/filter.md)
- [Pagination](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/pagination.md)
