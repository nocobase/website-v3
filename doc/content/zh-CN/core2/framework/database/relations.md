---
title: 关系与关联
---

关系描述逻辑 Collection 之间的连接，用于关联查询和关系写入。关系元数据、外键列、索引和数据库约束是不同层次，需要分别声明。

## 在订单模型上增加客户关系

以下迁移接在[订单表迁移](schema.md)之后，假设已有 `customerId` 值为空或合法：

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

该例明确不提供自动回退。若已有旧客户编号，先回填并验证再创建外键；不能在约束失败时静默跳过。

## 关系类型与键

| 关系 | 必需的键与资源 | 默认行为 |
| --- | --- | --- |
| `belongsTo` | 本地 foreignKey、目标 targetKey | 可创建本地列，默认索引；外键约束需显式开启 |
| `hasOne` / `hasMany` | 本地 sourceKey、目标 foreignKey | 保存反向关系元数据 |
| `belongsToMany` | sourceKey、targetKey、through、foreignKey、otherKey | 显式使用中间 Collection |

所有键引用逻辑字段名。框架不会从 `id` 或关系名称推断必要键。优先先声明标量外键字段；由关系创建列时必须给出 `foreignKeyType`。整数外键与目标自增键需要兼顾 unsigned 等方言属性。

## 约束与删除

`belongsTo` 元数据不自动创建数据库外键。启用 `constraints(true)` 后再按业务选择删除或更新策略。级联删除可能影响关联数据，不能把它当作通用默认行为。

多对多中间表应有明确的键、唯一约束以及业务字段。关系元数据不会替你自动创建这个表，也不会自动赋予关联记录的访问权限。

使用方式见[关联查询](association-queries.md)。验证空关系、外键冲突、已有数据升级与删除行为，不只验证表能创建。

## 接口与实现

- [Relationship contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/builder/relations.md)
