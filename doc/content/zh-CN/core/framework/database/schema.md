---
title: 数据表与字段
---

数据表与字段用 CollectionBuilder 声明，持久化结构变化放在 Migration 中。字段类型、空值、唯一性和索引应由业务语义决定，并在目标数据库验证。

## 创建订单模型

将以下迁移保存为 `database/main/migrations/202610270001_create_orders.ts`：

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610270001_create_orders',
  async up({ builder }) {
    await builder.createCollection('orders', (c) => {
      c.increments('id');
      c.string('orderNo', { length: 64 }).notNull().unique();
      c.string('title', { length: 120 }).notNull();
      c.string('status', { length: 32 }).notNull().defaultTo('draft');
      c.decimal('amount', { precision: 12, scale: 2 }).notNull().defaultTo(0);
      c.integer('customerId').unsigned().nullable();
      c.index(['status', 'id']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('orders');
  },
});
```

使用 `pnpm nocobase db apply --dry-run` 查看计划，确认后执行 `db apply`。`down()` 删除整张订单表及数据；只有允许失去这部分数据的回滚场景才可执行。

## 选择字段类型

| 数据 | 类型与注意点 |
| --- | --- |
| 自增整数 | `increments()`，显式给出字段名 |
| 精确金额 | `decimal()`，指定 precision/scale，读写保留精度 |
| 大整数标识 | `bigInt()`，跨 JSON 常用十进制字符串 |
| 文本与状态 | `string()` / `text()`，另行校验允许状态 |
| 布尔 | `boolean()`，明确 nullable 与默认值 |
| 日历日期时间 | `date()` / `time()` / `datetime()` |
| 时间点 | `datetimeTz()`，按 UTC 时间语义处理 |
| 结构化附加值 | `json()`，不代替关系与外键 |

没有自动附带的 `id` 或时间字段；需要哪些就声明哪些。当前不使用猜测的 `timestamps()` 或 `jsonb()` 简写。

## 演进与命名

后续通过新的 `alterCollection()` 迁移添加字段或索引。给已有大表添加非空字段时，先设计默认值、回填和约束生效次序，不能只看空库创建成功。

Builder 与 Repository 使用逻辑名。表前缀和下划线等物理规则由连接命名配置处理。使用方言原生类型会降低可移植性，应明确支持范围。

迁移生成的元数据与物理结构共同构成模型；不要直接编辑生成快照来模拟结构变化。关系见[关系与关联](relations.md)，历史管理见[数据库迁移](migrations.md)。

## 接口与实现

- [Schema authoring](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/builder/collection-schema.md)
- [Field declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/signatures/builder.md)
