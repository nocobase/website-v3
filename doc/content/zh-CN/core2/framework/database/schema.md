---
title: 数据表与字段
description: 用 CollectionBuilder 在迁移中声明数据表和字段，按业务语义选择字段类型，并规划后续的结构演进与命名。
---

数据表和字段用 CollectionBuilder 声明，持久化结构的变化放在 Migration 中。字段类型、是否允许空值、唯一性和索引，都应由业务语义决定，并在目标数据库上验证。

## 创建订单模型

把下面的迁移保存为 `database/main/migrations/202610270001_create_orders.ts`：

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

先用 `pnpm nocobase db apply --dry-run` 查看执行计划，确认无误后再执行 `db apply`。`down()` 会删除整张订单表及其数据，只有在允许丢失这部分数据的回滚场景下才能执行。

## 选择字段类型

| 数据 | 类型与注意事项 |
| --- | --- |
| 自增整数 | `increments()`，需要显式给出字段名 |
| 精确金额 | `decimal()`，指定 precision 和 scale，读写时保留精度 |
| 大整数标识 | `bigInt()`，在 JSON 中通常以十进制字符串传递 |
| 文本与状态 | `string()` / `text()`，允许的状态值需要另外校验 |
| 布尔值 | `boolean()`，明确是否允许空值以及默认值 |
| 日历日期与时间 | `date()` / `time()` / `datetime()` |
| 时间点 | `datetimeTz()`，按 UTC 时间的语义处理 |
| 结构化的附加数据 | `json()`，不能代替关系和外键 |

框架不会自动添加 `id` 或时间字段，需要哪些就声明哪些。目前也没有 `timestamps()`、`jsonb()` 这类简写，请不要凭猜测使用。

## 结构演进与命名

之后添加字段或索引时，编写新的 `alterCollection()` 迁移。给已有的大表添加非空字段时，要先设计默认值、数据回填以及约束生效的顺序，不能只看在空库中能否创建成功。

Builder 和 Repository 都使用逻辑名。表前缀、下划线等物理命名规则，由连接的命名配置处理。使用方言的原生类型会降低可移植性，需要明确支持的数据库范围。

迁移生成的元数据与物理结构一起构成了模型；不要直接编辑生成的快照来模拟结构变化。关系见 [关系与关联](relations.md)，变更历史的管理见 [数据库迁移](migrations.md)。

## 接口与实现

- [Schema authoring](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/builder/collection-schema.md)
- [Field declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/signatures/builder.md)
