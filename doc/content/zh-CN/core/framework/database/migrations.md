---
title: 数据库迁移
---

Migration 记录固定的数据库版本变化，包括结构演进和升级回填。应用资源放在 `database/<connection>/migrations/`；插件通过数据库资源声明接入。

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

保存为与 name 一致的 `202610270003_add_order_note.ts`。示例删除 note 字段的回退也会删除备注内容；生产回退必须评估数据保留需求。

文件默认导出 `defineMigration()` 的结果。名称在所有来源中唯一；默认 `transaction` 为 `auto`。无法可靠反向执行时，声明 `irreversible: true`，不要提供看似成功的空 down。

## 使用迁移上下文

| 入口 | 用途 |
| --- | --- |
| `builder` | 结构和元数据变更 |
| `query` | 集合式回填与修正 |
| `repository` | 需要 Collection 编解码、关系写入等语义的操作 |
| `connection` | 当前方言和能力 |

不要从迁移回到外层 DatabaseManager，否则可能绕过当前事务。普通回填优先用 Query；需要 JSON、时间编解码或关系语义时才选 Repository，并说明原因。

## 历史与发布

迁移自包含，不导入会继续改变的业务模型定义。已发布或合入共享历史后保留内容，后续修正新增文件。校验和变化先调查历史修改，不通过硬编码旧校验和绕过检查。

执行前查看 `db apply --dry-run`，执行后检查物理结构、元数据和历史。`db rollback` 回退最近批次，不等于恢复所有被删除数据；结构回退与备份恢复是不同操作。

在空库和带旧数据的库上测试升级路径，并按目标方言验证 DDL 能力。操作示例见[数据模型与迁移](../../developing-apps/data-models-and-migrations.md)，初始数据见[Seed](seeds.md)。

## 接口与实现

- [Migration definitions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/migration/define-migration.md)
- [Migration execution](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/migration/create-migrator.md)
