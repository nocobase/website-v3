---
title: 初始数据
description: 用 defineSeed() 安装应用所需的初始记录，了解 Seed 的执行上下文、必需数据与示例数据的区别，以及历史与验证方式。
---

Seed 用于安装应用所需的初始记录，例如默认的业务状态。结构的变化和升级时的大量数据回填属于 Migration；Seed 也不负责日常的数据导入或反复重置环境。

## 定义 Seed

下面的示例要求迁移已经创建了 `orderStatuses`，其中 `code` 有数据库唯一约束，并且包含 `title` 字段。把它保存为 `database/main/seeds/202610270004_default_order_status.ts`：

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202610270004_default_order_status',
  async run({ repository }) {
    await repository('orderStatuses').upsertOne({
      filter: { code: 'draft' },
      create: { code: 'draft', title: 'Draft' },
      update: { title: 'Draft' },
    });
  },
});
```

Seed 的名称与文件名保持一致，并在所有来源中唯一。用稳定的业务键加上唯一约束来保证幂等，不能只靠“先查询再插入”来避免并发下的重复数据。

## 执行上下文

Seed Context 提供 `repository`、`query` 和 `connection`，不提供 Builder；需要新字段时，请先写迁移。Repository 绑定在当前 Seed 的连接上，可以处理逻辑字段、JSON、时间以及关系写入。

默认的事务模式为 `auto`，数据和执行历史一起处理。执行失败的 Seed 可以在下一次继续，已经成功的会按照历史跳过。它不是每次启动都会覆盖用户配置的同步脚本。

## 必需数据与示例数据

请区分应用运行所必需的默认数据和用于演示的样例数据。不要在生产环境的初始化中混入测试账号、固定凭据或演示订单。模板的 sampleData 开关与普通 Seed 的历史各有用途。

修改默认值时，还要确定是否允许覆盖管理员已经修改过的内容；upsert 的 update 分支必须体现这个决定。

## 历史与验证

已经发布的 Seed 保持不变，之后初始数据的变化，用时间更晚的新文件表达。目前 Seed 没有 rollback、refresh、truncate 或 repeatable 模式。

验证时覆盖：首次安装、重复执行、业务键已经存在、失败后重试，以及事务回滚。应用中的执行入口见 [命令行参考](../../reference/cli.md)，插件中的资源见 [数据库资源与迁移](../../extension-development/database-and-migrations.md#初始数据)。

应用中完整的迁移与 Seed 示例，见 [建表与数据初始化](../../developing-apps/data-models-and-migrations.md)。

## 接口与实现

- [Seed definitions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/seed/define-seed.md)
- [Seeder](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/seed/create-seeder.md)
