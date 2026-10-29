---
title: 初始数据
---

Seed 安装应用所需的初始记录，例如默认业务状态。结构变化和升级驱动的大量数据回填属于 Migration；Seed 不承担日常导入或反复重置环境的职责。

## 定义 Seed

以下示例要求迁移已创建 `orderStatuses`，其中 `code` 有数据库唯一约束，且包含 `title` 字段。保存到 `database/main/seeds/202610270004_default_order_status.ts`：

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

名称与文件名一致，并在所有来源中唯一。稳定业务键加唯一约束表达幂等，不能只靠先查询再插入避免并发重复。

## 执行上下文

Seed Context 提供 `repository`、`query` 和 `connection`，不提供 Builder；需要新字段先写迁移。Repository 绑定当前 Seed 的连接，能处理逻辑字段、JSON、时间与关系写入。

默认事务模式为 `auto`，数据与执行历史共同处理。失败的 Seed 可在下次继续，已成功的按历史跳过。它不是每次启动都覆盖用户配置的同步脚本。

## 必需数据与示例数据

区分应用运行必需的默认数据和用于演示的样例。不要在生产初始化中混入测试账号、固定凭据或演示订单。模板的 sampleData 开关与普通 Seed 历史有各自用途。

修改默认值时也要确定是否允许覆盖管理员已修改的内容；upsert 的 update 分支必须反映这个决定。

## 历史与验证

已发布 Seed 保持不可变，后续安装数据变化用更晚的新文件表达。当前 Seed 没有 rollback、refresh、truncate 或 repeatable 模式。

验证首次安装、重复执行、已有业务键、失败后重试和事务回滚。应用执行入口见[命令行参考](../../reference/cli.md)，插件资源见[插件初始数据](../../extension-development/database-and-migrations.md#初始数据)。

应用中的完整迁移与 Seed 示例见[建表与数据初始化](../../developing-apps/data-models-and-migrations.md)。

## 接口与实现

- [Seed definitions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/seed/define-seed.md)
- [Seeder](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/seed/create-seeder.md)
