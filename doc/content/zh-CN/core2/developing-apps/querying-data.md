---
title: 查询与操作数据
description: 使用 Repository 查询和修改业务记录，处理关联、分页、事务与批量操作，并判断何时改用 Query。
---

数据访问通常从 Repository 开始：它理解 Collection 的字段和关系，适合读取、创建和修改业务记录。Query 面向表和结果集，适合处理 Repository 无法表达的报表与聚合。无论使用哪一种，调用方都要先确定身份和权限。

本篇的代码运行在应用服务端，沿用 [建表与数据初始化](data-models-and-migrations.md) 中的 `tutorialProjects` 和 `tutorialTasks`。示例基于默认模板 `1.0.0-beta.78` 的应用；代码片段只说明数据访问的方法，完整的路由、授权和服务注册见 [服务端业务服务](server-business-services.md)。文中的 `tutorialTasks`／`tutorialProjects` 属于独立的历史项目示例，不是当前入门示例中的 `tasks`；运行前请按 [建表与数据初始化](data-models-and-migrations.md) 确认基线。

## 使用 Agent

```text
请整理现有项目列表的数据查询，让搜索、排序和分页结果保持一致。

只返回当前用户允许查看的项目，总数也只能统计这些项目。
按名称搜索，默认按创建时间从新到旧排序；时间相同的记录也要保持稳定顺序。
每页最多 100 条，不能接受负数页码或无限制地返回全部记录。

修改任务所属项目时，要同时检查任务与目标项目的权限。
如果其中一步失败，保留任务原来的归属，不出现部分保存。
请使用真实数据库验证搜索、翻页、权限范围和失败后的数据，不改变现有用户的授权。
```

## 不使用 Agent

### 取得 Repository

在路由工厂中解析一次数据库服务，或者通过构造函数把它传给业务服务：

```ts
import { databaseManagerToken } from '@nocobase/db';

const database = app.container.resolve(databaseManagerToken);
```

`database.repository('tutorialProjects')` 使用默认连接和 Collection 的逻辑名称。不要去猜数据库中的物理表名，也不要把数据库服务暴露给浏览器。

Repository 不会自动推断当前请求的用户是谁。处理外部请求时，先从授权结果中取得 `RepositoryPolicy`，再用 `withPolicy()` 绑定记录范围和字段权限。用户提交的筛选条件只能在此基础上进一步缩小范围，不能作为授权的依据。

### 筛选、排序与分页

下面的函数接收已经校验过的分页参数，以及本次查看操作的权限策略。它应放在业务服务中，由接口事先校验 `page >= 1`、`1 <= pageSize <= 100` 以及搜索词的长度：

```ts
import type {
  DatabaseManager,
  RepositoryFilter,
  RepositoryPolicy,
} from '@nocobase/db';

export async function listProjects(
  database: DatabaseManager,
  policy: RepositoryPolicy,
  input: { page: number; pageSize: number; q?: string },
) {
  const projects = database.repository('tutorialProjects').withPolicy(policy);
  const filter: RepositoryFilter<Record<string, unknown>> = (f) =>
    f.and(input.q ? [f.string('name').includes(input.q)] : []);

  const data = await projects.findMany({
    filter,
    select: (s) => s.fields('id', 'name', 'createdAt'),
    sort: (s) => [s.field('createdAt').desc(), s.field('id').desc()],
    limit: input.pageSize,
    offset: (input.page - 1) * input.pageSize,
  });
  const total = await projects.count({ filter });
  return { data, meta: { page: input.page, pageSize: input.pageSize, total } };
}
```

列表和总数使用同一个 Repository 和同一组过滤条件。如果只过滤列表而不过滤总数，就会泄露范围外记录的数量，还会产生无效的页码。把 `id` 作为第二排序字段，可以让创建时间相同的记录保持确定的顺序；这并不意味着 UUID 按时间递增。

分页的两次查询并不保证来自同一个数据库快照，并发增删时，总数与当前页可能出现短暂的不一致。如果需要一致的快照或游标分页，应结合数据库的隔离级别和实际的查询方式单独设计，不能用前端截取全量数据来代替服务端分页。

### 读取关联

迁移已经声明了 `tutorialTasks.project` 之后，就可以通过关联读取项目：

```ts
const task = await database
  .repository('tutorialTasks')
  .withPolicy(taskPolicy)
  .findOne({
    filter: { id: taskId },
    select: (s) =>
      s
        .fields('id', 'title', 'projectId')
        .include('project', (p) => p.fields('id', 'name')),
  });
```

这里的 `taskPolicy` 必须允许读取相应的字段及关联；`include()` 本身不代表授权。如果业务要求任务和项目分别使用不同操作的数据范围，应像项目分配示例那样分别绑定策略进行查询，不能把“能读任务”当作“能读任意项目”。

用 `select` 明确选择响应需要的字段。已有关联定义时，优先使用关联读取，避免手写 join 后还要重复维护字段映射和关系规则。

### 创建、修改与删除

| 需求 | Repository 方法 | 要注意的行为 |
| --- | --- | --- |
| 读取一条 | `findOne()` | 返回第一条匹配的记录，可能没有结果 |
| 创建一条 | `createOne()` | 返回变更结果对象，记录位于 `result.record` |
| 修改或删除一条 | `updateOne()`、`deleteOne()` | 要求范围内恰好有一条匹配的记录 |
| 创建多条 | `createMany()` | 不支持嵌套的关联写入 |
| 批量修改或删除 | `updateMany()`、`deleteMany()` | 必须明确范围；不要为了绕过空范围保护而使用 `all: true` |

例如，下面是业务服务中修改完成状态的片段。`taskId` 已经过校验，`updatePolicy` 来自“完成”操作的授权结果：

```ts
const result = await database
  .repository('tutorialTasks')
  .withPolicy(updatePolicy)
  .updateOne({
    filter: { id: taskId },
    values: { completed: true, updatedAt: new Date() },
    select: (s) => s.fields('id', 'completed', 'updatedAt'),
  });
const savedTask = result.record;
```

接口应使用字段白名单来组装 `values`，不要把整个请求体直接传入。批量操作同样需要校验输入、绑定策略、限制数量，并明确业务语义是“全部成功”还是“允许部分成功”；不能因为方法名带有 `Many` 就省掉这些决定。

### 多步写入与事务

需要一起成功或一起失败的操作，交给业务服务在同一个连接事务中完成；具体写法、失败回滚以及外部投递的边界见 [事务与数据一致性](transactions-and-consistency.md)。读取和写入记录都必须使用这个事务连接，不能把外层的 Repository 混进回调中。

## 什么时候使用 Query

| 场景 | 首选 |
| --- | --- |
| Collection 中的记录及其已声明的关联 | Repository |
| 需要 `withPolicy()`、字段编码或关联写入 | Repository |
| 没有关联定义的报表 join、复杂子查询、对分组结果再分页 | Query |
| 迁移中按集合进行的历史数据转换 | 通常使用迁移 Context 中的 Query，保持迁移自包含 |

运行时通过 `database.query()` 取得 Query；在事务回调中，则使用 `connection.query` 属性。Query 不读取 Collection 的关联和命名覆盖，也不会自动应用权限、乐观锁或关联写入规则。不过它仍然使用连接层的命名转换，所以不能假定直接拼接物理表名总是正确的。

Query 的条件写法是 `where(field, operator, value)`，值由查询构造器参数化。它不是 Knex 的 API，不能照搬 `where(field, value)` 或 `whereIn()` 的写法。更新和删除必须带有 `where`；只有业务确实要求对全表操作时，才显式使用 `allowAllRows()`。

## 验证结果

用真实的测试数据库检查筛选、稳定排序、空结果、关联和批量操作的范围；用真实的应用和普通用户检查权限。人为制造一次事务内的失败，再重新读取数据库，确认之前的写入也已经撤销。不要通过 mock Repository 来证明 Repository 的行为。

现有项目服务的完整示例见 [服务端业务服务](server-business-services.md)，测试工具的选择见 [测试与验收](testing-and-acceptance.md)。
