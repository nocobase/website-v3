---
title: 初始数据
description: 使用 defineSeed 安装默认记录，处理已有数据、配置、可选示例数据、执行历史与失败重试。
---

Seed 安装应用或插件所需的初始记录，例如默认状态、分类。建表和升级中的历史数据回填属于 [Migration](migrations.md)，用户日常创建的订单等记录由业务服务处理。

## 定义 Seed

下面使用[数据表与字段](schema.md)中的 `orderStatuses`，以 `code` 为主键、`title` 为名称。保存为 `202611040010_default_order_statuses.ts`，由应用或插件的 Seed 目录加载：

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040010_default_order_statuses',
  async run(context) {
    const statuses = context.repository('orderStatuses');
    for (const values of [
      { code: 'draft', title: 'Draft' },
      { code: 'paid', title: 'Paid' },
    ]) {
      if (await statuses.findOne({ filter: { code: values.code } })) continue;
      await statuses.createOne({ values });
    }
  },
});
```

`defineSeed()` 只定义任务，`run(context)` 在执行器运行任务时调用。文件必须默认导出该定义，`name` 与文件名一致，并在同一连接全部 Seed 来源中唯一。可选项是 `transaction` 和 `sample`，没有 `down()`、`shouldRun()` 或重复执行模式。

首次运行后会有 `draft` 和 `paid` 两条记录；已经存在的状态保留原名称。Seed 依赖的结构必须先由迁移建立。

## 使用 Seed Context

`run()` 接收以下成员：

| 成员 | 用途 |
| --- | --- |
| `repository(name)` | 安装 Collection 记录，处理字段编解码和关联写入 |
| `query` | Repository 不适合表达的操作，例如读取没有 Collection 的物理表 |
| `connection` | 当前连接的名称、方言、能力及底层 `client()` |
| `config` | 通过 `get()` 读取初始化配置 |
| `container` | 执行方允许提供的服务 |

Seed 没有 `builder`，新表或字段应先写迁移。`repository()` 和 `query` 已绑定任务连接，事务开启时也绑定该事务。不要从外部管理器获取另一个 Repository 写入。

`connection` 是受限接口，不能调用 `connection.repository()` 或自行开启任务事务。`config`、`container` 与[迁移上下文](migrations.md#读取配置与使用允许的服务)有相同的应用层边界；Context Repository 不触发运行时变更事件。

## 补充缺失记录与更新已有记录

先确定哪些字段允许初始化逻辑管理。开头的例子只补缺失记录，保留用户修改。如果应用明确要求恢复某个系统状态的固定名称，可使用：

```ts
await context.repository('orderStatuses').upsertOne({
  filter: { code: 'draft' },
  create: { code: 'draft', title: 'Draft' },
  update: { title: 'Draft' },
});
```

`create` 用于不存在的记录，`update` 用于已存在的记录。这个例子会把现有名称改回 `Draft`，不能用于需要保留管理员自定义名称的场景。后续版本要更新默认数据时新增 Seed，不修改已有成功文件。

成功历史让普通启动跳过 Seed；业务幂等则让相同输入再次写入时不产生重复记录，两者不能互相替代。稳定业务键应有数据库唯一约束。先查再插入不能消除并发竞争，冲突时应让任务失败，检查后重试，不静默吞掉其他错误。

## 读取初始化配置

需要可配置的初始值时，在 `run(context)` 中读取并校验。下面是替代固定 `Draft` 标题的写法：

```ts
const title = context.config.get<unknown>('orders.initialDraftTitle') ?? 'Draft';
if (typeof title !== 'string' || title.trim().length === 0 || title.length > 100) {
  throw new Error('orders.initialDraftTitle must be a non-empty string of up to 100 characters.');
}
const statuses = context.repository('orderStatuses');
if (!(await statuses.findOne({ filter: { code: 'draft' } }))) {
  await statuses.createOne({ values: { code: 'draft', title } });
}
```

`orders.initialDraftTitle` 是此示例的应用自有配置键；需要使用它时，在应用的[配置](../../developing-apps/configuration-and-settings.md)中声明，未配置时使用 `Draft`。`config.get<T>()` 的类型参数不会验证实际值。

初始化成功后修改配置不会重跑该 Seed，也不会重置用户已修改的记录。需要长期可编辑的设置应提供业务管理入口，而不是让 Seed 每次启动覆盖。

## 必需数据与可选示例数据

默认业务状态属于运行所需数据；用于体验的虚构订单应显式标记 `sample: true`。下面使用[订单表](schema.md)，保存为 `202611040011_sample_order.ts`：

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040011_sample_order',
  sample: true,
  async run(context) {
    const orders = context.repository('orders');
    if (await orders.findOne({ filter: { orderNo: 'SAMPLE-001' } })) return;
    await orders.createOne({
      values: {
        orderNo: 'SAMPLE-001',
        status: 'draft',
        amount: '12.50',
        customerId: null,
        createdAt: new Date('2026-10-01T00:00:00Z'),
      },
    });
  },
});
```

普通 Seed 不会因为记录看起来像示例而自动跳过。应用仅在连接首次安装且 `app.sampleData` 为 `true` 时自动执行 sample Seed；首次安装指执行前没有迁移和 Seed 历史，或刚完成受管理结构重置。否则会记录为 `skipped`，以后仅打开配置也不会自动运行。直接使用底层 Seeder 的调用者通过 `sample.enabled` 控制此行为。

在开发应用目录中，可补载被跳过的示例数据：

```bash
pnpm nocobase db sample
```

该命令处理被跳过的 sample Seed，也处理已注册的示例数据服务；部署产物会拒绝执行。示例数据若必须调用其他插件的业务服务，应使用 `sampleDataToken` 在应用就绪后生成，不能把业务服务塞进 Seed Context。两种来源的配置与接入见[插件数据库资源](../../extension-development/database-and-migrations.md#编写迁移与初始数据)。

## 执行历史、事务与失败重试

同一连接的 Seed 按名称排序，在应用数据库执行计划中位于迁移之后。默认 `transaction: 'auto'` 与 `true` 为每个 Seed 开启事务，写入和成功历史一起提交；抛错时回滚该事务，下次运行可重试。已经完成的其他 Seed 不会被一起撤销。

`transaction: false` 会留下部分失败写入的可能性，应仅在明确需要时使用，并设计恢复方式。`run()` 正常返回，包括提前 `return`，都会记为成功；如果缺少必需配置或前置数据，应报错，不要先返回再期待下次自动尝试。

Seed 没有回退入口，迁移回退不清除 Seed 历史。修改成功文件只会产生校验和差异，不会自动重新执行。历史不可变、校验和及恢复命令的共同规则见[数据库迁移](migrations.md#校验和与编译产物)。

## 验证初始化

使用隔离的真实数据库，检查空库安装、已有业务键、保留用户修改以及失败后重试。还要区分两个测试：重复调用 Seeder 应按历史跳过；在受控测试中再次执行同一 `run()` 逻辑，应验证其业务幂等行为。

失败用例应在写入后主动抛错，再检查记录和成功历史都未保留，并在解除失败条件后验证可以成功执行。sample Seed 分别检查开启、关闭以及后续补载，不能仅检查文件可导入。测试工具见[数据库与命令行测试](../../developing-apps/testing-and-acceptance.md#数据库与命令行测试)。

[Seed 接口](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/seed/types.ts)、[执行器实现](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/seed/seeder.ts)与 [Seed 行为测试](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db-testkit/tests/integration/seed/seeder.test.ts)。
