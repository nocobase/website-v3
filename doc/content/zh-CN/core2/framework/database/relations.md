---
title: 关系与关联
description: 在已有模型上声明 belongsTo、hasOne、hasMany 和 belongsToMany 关系，明确所需的键，并按业务选择外键约束与删除行为。
---

关系描述逻辑 Collection 之间的连接，用于关联查询和关系写入。关系元数据、外键列、索引和数据库约束属于不同的层次，需要分别声明。

## 为订单模型增加客户关系

下面的迁移接在 [订单表的迁移](schema.md) 之后执行，假设已有的 `customerId` 值要么为空，要么合法：

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610270002_add_customers',
  irreversible: true,
  async up({ builder }) {
    await builder.createCollection('customers', (c) => {
      c.increments('id');
      c.string('name').notNull();
    });
    await builder.alterCollection('orders', (c) => {
      c.belongsTo('customer', 'customers')
        .foreignKey('customerId').targetKey('id').constraints(true);
    });
    await builder.alterCollection('customers', (c) => {
      c.hasMany('orders', 'orders').sourceKey('id').foreignKey('customerId');
    });
  },
});
```

这个示例有意不提供自动回退。如果已经存在旧的客户编号，请先回填并验证，再创建外键；不能在约束失败时静默跳过。

## 关系类型与键

| 关系 | 必需的键与资源 | 默认行为 |
| --- | --- | --- |
| `belongsTo` | 本地的 foreignKey、目标的 targetKey | 可以创建本地列，默认建立索引；外键约束需要显式开启 |
| `hasOne` / `hasMany` | 本地的 sourceKey、目标的 foreignKey | 保存反向关系的元数据 |
| `belongsToMany` | sourceKey、targetKey、through、foreignKey、otherKey | 显式使用中间 Collection |

所有的键都引用逻辑字段名。框架不会根据 `id` 或关系名称推断必需的键。建议先声明标量的外键字段；由关系创建列时，必须给出 `foreignKeyType`。整数外键与目标的自增键之间，还要兼顾 unsigned 等方言属性。

## 约束与删除

`belongsTo` 元数据不会自动创建数据库外键。启用 `constraints(true)` 之后，再按业务需要选择删除或更新时的策略。级联删除可能影响关联的数据，不能当作通用的默认行为。

多对多的中间表应该有明确的键、唯一约束和所需的业务字段。关系元数据不会自动创建这张表，也不会自动授予访问关联记录的权限。

使用方式见 [关联查询](association-queries.md)。验证时，除了确认表能创建，还要覆盖空关系、外键冲突、已有数据的升级以及删除行为。

## 接口与实现

- [Relationship contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/builder/relations.md)
