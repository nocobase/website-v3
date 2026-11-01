---
title: 数据表与字段
description: 使用 CollectionBuilder 创建和修改集合、字段、索引与约束，并检查命名、元数据和数据库能力。
---

`CollectionBuilder` 把逻辑集合定义转换为数据库结构，并同步模型所需的元数据。应用和插件都在 [Migration](migrations.md) 的 `up({ builder })`、`down({ builder })` 中使用它；以下代码片段均放在这些回调中。

## 创建 Collection

用回调声明一张订单表：

```ts
await builder.createCollection('orders', (c) => {
  c.increments('id');
  c.string('orderNo', { length: 64 }).notNull().unique();
  c.string('status', { length: 32 }).notNull().defaultTo('draft');
  c.decimal('amount', { precision: 12, scale: 2 }).notNull().defaultTo(0);
  c.integer('customerId').unsigned().nullable();
  c.datetimeTz('createdAt').notNull();
  c.index(['status', 'id']);
});
```

执行迁移后，`orders` 包含显式声明的六个字段、订单号唯一约束和状态索引。框架不会自动附加 `id`、`createdAt` 或 `updatedAt`；`increments()` 明确创建自增主键，普通字段不会仅因名为 `id` 就成为主键。上例的 `createdAt` 没有默认值，创建订单时需要提供。

`createCollection()` 也接受定义对象。下面创建独立的状态字典，不是向已有订单表追加字段：

```ts
await builder.createCollection('orderStatuses', {
  fields: [
    { name: 'code', type: 'string', length: 32, primaryKey: true, nullable: false },
    { name: 'title', type: 'string', length: 100, nullable: false },
  ],
});
```

对象包含 `fields`、`indexes`、`constraints` 等属性，不能直接把字段数组作为第二个参数。两种形式都应在迁移中写出固定定义，不导入持续变化的业务模型。需要一次创建多个集合时，`createCollections([{ name, definition }])` 接受相同的定义形式。

## 声明字段与默认值

字段选项和链式方法可以表达相同规则，例如 `c.string('title', { nullable: false })` 与 `c.string('title').notNull()`。同一文件保持一种主要风格即可。

| 数据 | 声明示例 | 使用边界 |
| --- | --- | --- |
| 短文本 | `c.string('title', { length: 120 })` | 接口仍需校验空白内容和长度 |
| 长文本 | `c.text('note')` | 不用短字符串长度表达长文本限制 |
| 布尔值 | `c.boolean('active').notNull().defaultTo(true)` | 明确是否允许空值 |
| 整数 | `c.integer('quantity').notNull().defaultTo(1)` | 非空不代表大于零 |
| 精确金额 | `c.decimal('amount', { precision: 12, scale: 2 })` | 读写时保留小数精度 |
| 大整数 | `c.bigInt('externalId')` | 超出 JavaScript 安全整数范围时使用十进制字符串 |
| 日历日期与时间 | `c.date('dueDate')`、`c.time('opensAt')`、`c.datetime('scheduledAt')` | 与表示绝对时间点的字段区分 |
| 时间点 | `c.datetimeTz('paidAt')` | 使用 UTC 时间语义 |
| 结构化数据 | `c.json('settings')` | 使用 Repository 处理方言编解码 |
| 固定枚举 | `c.enum('state', { values: ['draft', 'paid'] })` | 成员变化也需要迁移，约束能力取决于方言 |

其他类型包括 `char`、`float`、`double`、`blob`、`uuid` 和 `native`。`char` 需要长度，`native` 需要原生类型名称并限制可移植性。完整声明见 [字段类型与选项](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/collection/types.ts)。

默认值用于插入时未提供该字段的情况；它不等于后续修改默认值会自动更新旧记录。已有数据如何补齐应由迁移明确处理。非空、唯一等数据库约束也不能替代接口输入校验或访问权限检查。

## 定义主键、索引与约束

`primary()`、`unique()`、`index()` 接受单个字段名或字段数组。例如 `c.unique(['customerId', 'orderNo'])` 表示组合唯一，与分别限制两个字段唯一不同。多对多中间表也可用 `c.primary(['orderId', 'tagId'])` 定义组合主键。

已有集合使用 `addIndex()`、`addConstraint()`。以下代码要求 `customers.id` 已存在、类型与 `orders.customerId` 匹配，并且已有非空客户编号都有效：

```ts
await builder.addIndex('orders', {
  name: 'idx_orders_customer',
  fields: ['customerId'],
});
await builder.addConstraint('orders', {
  type: 'foreignKey',
  name: 'fk_orders_customer',
  fields: ['customerId'],
  references: { collection: 'customers', fields: ['id'] },
  onDelete: 'restrict',
});
```

索引支持查询，外键保证引用存在；`onDelete: 'restrict'` 拒绝删除仍被订单引用的客户。反向操作使用相同名称：`dropConstraint('orders', 'fk_orders_customer')` 和 `dropIndex('orders', 'idx_orders_customer')`。显式索引或约束名称按原样使用，不自动转换大小写。

关联元数据及其默认索引行为见[关系与关联](relations.md)，不要为同一外键重复建立索引或约束。

## 修改已有结构

已经合入或发布的迁移保持不变。在后续迁移中显式增加、修改或删除结构：

```ts
await builder.alterCollection('orders', (c) => {
  c.text('note').nullable();
});
```

按明确业务规则回填 `note`，并确认没有空值后，才能收紧约束；回填方法见[回填与转换历史数据](migrations.md#回填与转换历史数据)。

```ts
await builder.alterField('orders', 'note', { type: 'text', nullable: false });
```

修改字段时显式保留原有类型、长度或精度等属性，并在目标数据库验证结果。

单个字段也可使用 `addField(collection, field)`；删除用 `dropField()`，删除集合用 `dropCollection()`。删除字段会失去其数据，删除集合会失去全部记录。`renameCollection(oldName, newName)` 支持表集合，但存在关系、外键或视图依赖时可能拒绝执行，需要先处理依赖；不要用删除重建模拟重命名。

## 逻辑命名与元数据

Builder 参数使用逻辑集合名和字段名，例如 `orderItems`、`customerId`。物理表名与列名由 `underscored`、`tablePrefix` 等命名配置决定，不手动拼接前缀，也不向 Builder 填入 `tableName` 或 `columnName` 映射。

模型由物理结构和补充元数据共同解析得到。Builder 会同步它们；不能通过关闭元数据同步或编辑 `database/<connection>/collections/` 中的生成文件来修改模型。检查缓存的方法见[应用中的建表与初始化](../../developing-apps/data-models-and-migrations.md)。由外部系统维护的数据库使用[外部连接](../../developing-apps/existing-databases.md)，不能在其上执行 Builder DDL。

## 预览变更与数据库能力

Builder 的预览可以检查具体操作和方言警告：

```ts
const result = await builder.addField(
  'orders',
  { name: 'note', type: 'text', nullable: true },
  { dryRun: true, previewSql: true },
);
console.log(result.sql, result.warnings, result.impact);
```

`dryRun: true` 不执行结构变更或同步元数据；`previewSql: true` 在适配器支持时返回 SQL，本身不阻止执行。`warnings` 说明能力限制，`impact` 提示潜在数据影响；预览不保证真实执行成功。该操作级预览与只列出待执行文件的 `db apply --dry-run` 不同。

真实执行时，`strict: true` 会让能力警告成为错误；它不是删除确认开关。`ifNotExists`、`ifExists` 只跳过支持的创建或删除操作，不会校正已有对象的结构。Builder 的 `transaction` 选项尚不提供事务管理，`builder.transaction()` 也不建立真实事务；迁移事务由执行器管理，见[事务与失败](migrations.md#执行顺序历史与事务)。

[查看 Builder 实现](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/collection/builder/builder.ts)。
