---
title: 数据库迁移
description: 用 defineMigration() 记录结构演进和升级回填，了解迁移上下文的各个入口，以及迁移历史的维护与发布方式。
---

Migration 记录数据库版本之间固定的变化，包括结构的演进和升级时的数据回填。应用的迁移放在 `database/<connection>/migrations/` 中；插件的迁移通过数据库资源声明接入。

## 定义一个变更

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610270003_add_order_note',
  async up({ builder }) {
    await builder.alterCollection('orders', (c) => { c.text('note').nullable(); });
  },
  async down({ builder }) {
    await builder.dropField('orders', 'note');
  },
});
```

把它保存为与 name 一致的 `202610270003_add_order_note.ts`。示例中删除 note 字段的回退，也会删除已有的备注内容；生产环境的回退必须评估数据保留的需求。

文件默认导出 `defineMigration()` 的结果。迁移的名称在所有来源中必须唯一；`transaction` 默认为 `auto`。无法可靠反向执行的迁移，请声明 `irreversible: true`，不要提供一个看起来执行成功、实际什么都不做的 down。

## 使用迁移上下文

| 入口 | 用途 |
| --- | --- |
| `builder` | 结构和元数据的变更 |
| `query` | 集合式的数据回填与修正 |
| `repository` | 需要 Collection 编解码、关系写入等语义的操作 |
| `connection` | 当前的方言及其能力 |

不要在迁移中回头使用外层的 DatabaseManager，否则可能绕过当前的事务。普通的回填优先使用 Query；只有需要 JSON、时间编解码或关系语义时才选择 Repository，并说明原因。

## 迁移历史与发布

迁移应该是自包含的，不要导入之后还会继续变化的业务模型定义。迁移一旦发布或合入共享的历史，就保持内容不变，后续的修正写成新文件。校验和发生变化时，先调查历史是否被修改过，不要通过硬编码旧的校验和来绕过检查。

执行之前，先用 `db apply --dry-run` 查看计划；执行之后，检查物理结构、元数据和迁移历史。`db rollback` 回退最近的一个批次，但不等于恢复所有被删除的数据；回退结构与从备份恢复是两种不同的操作。

请在空库和带有旧数据的库上分别测试升级路径，并在目标方言上验证 DDL 的能力。操作示例见 [建表与数据初始化](../../developing-apps/data-models-and-migrations.md)，初始数据见 [初始数据](seeds.md)。

## 接口与实现

- [Migration definitions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/migration/define-migration.md)
- [Migration execution](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/migration/create-migrator.md)
