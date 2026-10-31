---
title: 关系与关联
description: 定义多对一、一对一、一对多与多对多关联，并明确外键字段、索引和数据库约束。
---

关联让 Repository 按逻辑模型读取和写入相关记录。以下示例在迁移的 `up({ builder })` 中执行，使用[数据表与字段](schema.md)中的 `orders`：包含自增 `id` 和可空整数 `customerId`。

## 关联字段与数据库约束

订单的 `customerId` 是保存客户编号的物理字段，`customer` 是告诉 Repository 如何读取客户的关联字段，数据库外键则保证非空编号指向真实客户。这三者的职责不同。关联声明不会授予访问客户的权限。

所有关联必须显式指定键，不会根据 `id` 或关联名称推断：

| 关联 | 必需选项 |
| --- | --- |
| `belongsTo` | `foreignKey`、`targetKey` |
| `hasOne`、`hasMany` | `sourceKey`、`foreignKey` |
| `belongsToMany` | `sourceKey`、`targetKey`、`through`、`foreignKey`、`otherKey` |

键使用逻辑字段名，类型应与被引用字段匹配，包括方言相关的 unsigned 属性。创建关联前也要检查旧记录能否满足约束。

## 多对一关联

先创建客户，再为订单增加关联。此时订单的 `customerId` 应为空；若已有旧客户编号，应先导入对应客户并验证引用：

```ts
await builder.createCollection('customers', (c) => {
  c.increments('id');
  c.string('name', { length: 120 }).notNull();
});
await builder.alterCollection('orders', (c) => {
  c.belongsTo('customer', 'customers')
    .foreignKey('customerId')
    .targetKey('id')
    .constraints(true)
    .onDelete('restrict');
});
```

`foreignKey('customerId')` 复用订单已有字段，`targetKey('id')` 指向客户主键。执行后可以通过 Repository 的 `include('customer', ...)` 读取客户，见[关联查询](association-queries.md)。

`belongsTo` 也能创建本地外键列，但必须显式给出 `foreignKeyType`。例如 `c.belongsTo('customer', 'customers', { foreignKeyType: 'integer', unsigned: true })` 再指定两端键；已有标量字段时不需要这个选项。优先单独声明标量字段，便于明确空值、默认值和类型。

## 一对一与一对多关联

客户的订单列表是反向关联，外键仍在订单表中：

```ts
await builder.alterCollection('customers', (c) => {
  c.hasMany('orders', 'orders')
    .sourceKey('id')
    .foreignKey('customerId');
});
```

`hasMany` 只增加关系元数据，不创建第二个外键字段。若一个客户最多有一份扩展资料，使用 `hasOne`，并在资料表的客户编号上加唯一约束：

```ts
await builder.createCollection('customerProfiles', (c) => {
  c.increments('id');
  c.integer('customerId').unsigned().notNull().unique();
  c.text('notes');
  c.belongsTo('customer', 'customers', { index: false })
    .foreignKey('customerId').targetKey('id')
    .constraints(true).onDelete('cascade');
});
await builder.alterCollection('customers', (c) => {
  c.hasOne('profile', 'customerProfiles')
    .sourceKey('id').foreignKey('customerId');
});
```

`hasOne` 本身不保证数据库里只有一条资料；上例的 `unique()` 才能拒绝重复客户编号。该唯一约束已提供索引，关联设置 `index: false` 避免再创建默认索引。这里删除客户会同时删除其资料，是此示例明确选择的业务规则。

## 多对多关联与中间表

订单可以有多个标签，同一标签也可用于多个订单。先创建标签和中间表，再声明关联：

```ts
await builder.createCollection('tags', (c) => {
  c.increments('id');
  c.string('name', { length: 64 }).notNull().unique();
});
await builder.createCollection('orderTags', (c) => {
  c.integer('orderId').unsigned().notNull();
  c.integer('tagId').unsigned().notNull();
  c.primary(['orderId', 'tagId']);
  c.foreignKey('orderId', {
    references: { collection: 'orders', fields: ['id'] },
    onDelete: 'cascade',
  });
  c.foreignKey('tagId', {
    references: { collection: 'tags', fields: ['id'] },
    onDelete: 'cascade',
  });
});
await builder.alterCollection('orders', (c) => {
  c.belongsToMany('tags', 'tags')
    .sourceKey('id').targetKey('id')
    .through('orderTags').foreignKey('orderId').otherKey('tagId');
});
```

`foreignKey` 是中间表指向订单的字段，`otherKey` 是指向标签的字段。组合主键防止同一订单重复关联同一标签。关联不会自动创建 `orderTags`；若中间表还需要顺序等业务字段，在建表时显式声明。

删除订单或标签时，上例只级联删除对应的中间记录，不删除另一端的业务记录。关联写入方式见[关联查询与写入](association-queries.md)。

## 索引、删除与更新规则

`belongsTo` 默认补充外键索引，`index: false` 可关闭。若已有显式命名的索引，特别是后续用 `addField()` 单独添加关联时，设置 `index: false` 可避免重复创建。

只有 `constraints: true` 或 `.constraints(true)` 才会自动建立外键。已经通过 `foreignKey()` 或 `addConstraint()` 创建外键时，关联使用 `constraints: false`；这不会删除已有的数据库约束。`hasOne`、`hasMany` 和 `belongsToMany` 不会替你补齐另一张表的约束。

`onDelete`、`onUpdate` 支持 `restrict`、`cascade`、`set null`、`set default`、`no action`，具体能力取决于数据库。`set null` 要求字段可空，`set default` 还要求默认值满足引用规则。不要依赖不同数据库的默认删除策略。

回退时按依赖顺序移除关联、约束、索引和新增字段，再删除被引用的集合。删除一个复用已有标量字段的关联，不等于删除该字段及所有显式创建的索引、约束。测试应检查真实结构、非法引用、重复关联和删除后的记录，而不仅检查 Repository 能读取关系。

[关联键要求](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/collection/relation-contract.ts)与 [结构编译实现](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/collection/compiler/compiler.ts)。
