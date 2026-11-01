---
title: 数据库迁移
description: 定义迁移，使用 Migration Context 修改结构和历史数据，并理解执行顺序、事务、回退与校验和。
---

Migration 记录一次固定的结构或历史数据变更。应用与插件使用同一个 `defineMigration()` API；文件位置和资源接入分别见[建表与数据初始化](../../developing-apps/data-models-and-migrations.md)和[插件数据库资源](../../extension-development/database-and-migrations.md)。

## 定义迁移

以下迁移给已存在的 `orders` 添加备注字段，保存为 `202611040010_add_order_note.ts`：

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040010_add_order_note',
  async up({ builder }) {
    await builder.alterCollection('orders', (c) => {
      c.text('note').nullable();
    });
  },
  async down({ builder }) {
    await builder.dropField('orders', 'note');
  },
});
```

`defineMigration()` 标记并返回定义，不会立即执行。加载器要求文件默认导出它的返回值，`name` 必须与去掉扩展名的文件名一致。不能仅导出 `up`、`down` 函数或普通对象。

| 选项 | 用途 |
| --- | --- |
| `name` | 在同一连接全部迁移来源中唯一的名称，也是排序依据 |
| `up(context)` | 应用本次变更，必须提供 |
| `down(context)` | 反向操作；删除字段或表时也会删除其中数据 |
| `irreversible` | 无法可靠撤销时设为 `true`，不能同时定义 `down` |
| `transaction` | `true`、`false` 或默认的 `'auto'` |
| `shouldRun(context)` | 执行待处理迁移前判断是否适用，返回布尔值 |

必须提供 `down()` 或声明 `irreversible: true`。迁移应自包含，写出确定的字段、索引和约束；不要导入随应用变化的模型、服务或共享结构定义。

## 使用 Migration Context

`up()`、`down()` 和 `shouldRun()` 接收 `MigrationContext`，按用途解构需要的成员：

| 成员 | 用途与边界 |
| --- | --- |
| `builder` | 修改结构和模型元数据，具体写法见[数据表与字段](schema.md) |
| `query` | 数据读取和批量修正，通常是迁移数据操作的首选 |
| `repository(name)` | 需要 Collection 字段编解码、集合级命名覆盖或关联写入时使用 |
| `connection` | 当前连接的 `name`、`driver`、`dialect`、`capabilities` 和底层 `client()` |
| `config` | 只读配置读取器，提供 `get()` |
| `container` | 执行方提供的受限服务解析器 |
| `configuration`、`parameters` | 来源提供的可选适用性配置和固定目标参数 |

`connection` 不是完整的运行时连接，不提供 `repository()`、`builder`、`transaction()` 或事务回调。直接使用 Context 顶层工具，由执行器绑定当前任务连接和事务。不能从外部 DatabaseManager 获取另一个 Repository 来写入，否则会离开任务事务。

迁移中的 `repository()` 解析执行时的模型，只在 Query 无法正确处理的场景使用，并在代码注释中说明原因。不要在 `down()` 中依赖它，也不要逐条读取整表再用 Repository 回填。迁移和 Seed 的 Context Repository 写入不会触发运行时 Repository 变更事件，不能依靠业务监听器补全记录。

## 回填与转换历史数据

随升级修正旧值应写成新迁移。下面只修改旧拼写，不覆盖其他状态：

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040011_normalize_order_status',
  irreversible: true,
  async up({ query }) {
    await query.updateTable('orders')
      .set({ status: 'draft' })
      .where('status', '=', 'DRAFT')
      .execute();
  },
});
```

执行后 `DRAFT` 被转换为 `draft`，其他记录不变。原先就为 `draft` 的记录与被转换的记录无法区分，因此此例明确不可逆。若必须支持恢复，应在设计变更时保存足够的原值，不能用相反的批量更新假装恢复。

Query 使用连接命名策略，但不处理 Collection 特有的字段编解码和关联写入。普通条件更新直接使用 Query；涉及这些语义时才换用 Context Repository。`updateTable()`、`deleteFrom()` 要求条件，确实需要全表操作时才显式调用 `allowAllRows()`。

新增必填字段时，先增加可空字段，用明确规则补齐已有记录并检查结果，再设为非空。空库通常没有历史记录要转换，仍应得到相同的最终结构。不要让迁移依赖同一次执行里尚未运行的 Seed。

## 读取配置与使用允许的服务

`config.get<T>(key)` 读取执行方提供的配置，键不存在时返回 `undefined`；泛型不会进行运行时校验。例如读取已配置的初始管理员名称：

```ts
const username = config.get<string>('users.initialAdmin.username');
```

应用启动和数据库命令会传入应用配置快照；独立数据库执行器没有显式配置时使用空读取器。配置不构成迁移的历史身份，后来的回退读取的是当时配置，所以不要根据可变配置生成表结构或其逆操作。

应用层 `container` 目前只允许 `idGeneratorToken`，可用于需要生成新标识的数据操作：

```ts
import { idGeneratorToken } from '@nocobase/app-server/id-generator';

// Inside a callback that receives container:
const id = container.resolve(idGeneratorToken).generateString();
```

它不是完整应用容器，不能解析 DatabaseManager 或任意业务服务。独立执行器必须由调用者提供所需服务。生成 ID 也不能替代 Seed 用于识别已有记录的稳定业务键。

## 条件执行

迁移仅适用于可选集合时，可在 `shouldRun()` 中检查前提。下面是前述状态修正的可选集合版本，两者按实际场景选用：

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040012_normalize_optional_order_status',
  irreversible: true,
  async shouldRun({ builder }) {
    return builder.hasCollection('orders');
  },
  async up({ query }) {
    await query.updateTable('orders')
      .set({ status: 'draft' })
      .where('status', '=', 'DRAFT')
      .execute();
  },
});
```

条件在迁移锁内、该任务事务开始前执行，应只做检查。返回 `false` 不写成功历史，下次执行仍会判断；返回 `true` 后执行 `up()`。条件抛错或返回非布尔值会导致失败。成功迁移以后按历史跳过，不再重新判断条件。

不要用条件跳过本应存在的必需结构来掩盖安装错误。`db apply --dry-run` 不执行此回调，因此计划中出现的迁移不保证最终会运行。

只有需要将同一迁移来源应用于不同固定目标时，才使用来源的 `parameters`；不同参数集形成不同历史身份，`configuration` 不参与身份计算。普通应用和插件迁移无需配置这两项，接口见 [MigrationSource](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/migration/types.ts)。

## 执行顺序、历史与事务

同一连接的应用与插件迁移被合并、检查重名，再按名称排序。插件注册顺序不是迁移顺序。执行器只运行没有成功历史的迁移，本次执行的迁移记入同一个新批次；各任务有自己的事务，不是整个批次共用一个事务。

当前 `transaction: 'auto'` 和 `true` 都调用连接事务，`up()` 的操作与成功历史在该事务内处理。`false` 不创建任务事务，失败可能留下部分修改而没有成功记录。即使启用了事务，也不能假设所有方言的 DDL 都可回滚。

发生错误后执行停止；此前已经完成的迁移保留。再次执行会跳过成功记录并重试未完成部分。迁移锁防止遵守同一锁协议的执行器并发执行，它不提供跨连接原子性，也不替代业务唯一约束。目标连接和命令选项见[命令行参考](../../reference/cli.md)。

## 回退与不可逆变更

`db rollback` 处理最新整个批次，按实际执行的逆序调用 `down()` 并移除对应迁移历史。该批次可能同时包含应用与插件的迁移。执行前会检查整个批次是否可回退，任何不可逆迁移都会阻止开始回退。

在允许回退的隔离数据库中先预览：

```bash
pnpm nocobase db rollback --dry-run
```

确认范围后再执行不带 `--dry-run` 的命令。交互终端会询问确认；非交互执行需要明确的 `--force`。回退过程也按单个任务处理事务，并非整个批次原子回退。

Seed 没有 `down()`，迁移回退也不删除 Seed 历史。`db redo` 回退后再应用待执行迁移与 Seed，因此重建了表也不意味着已执行 Seed 会重新安装记录。`db reset` 则删除受管理结构和历史后从空库安装，不调用 `down()`，只能用于明确可丢弃的数据。不要用它替代升级验证或备份恢复。

## 校验和与编译产物

迁移一旦合入或发布，内容、名称和文件名都保持不变，格式和注释的修改也会改变校验和。后续修正新增一个排序更晚的迁移。

已执行文件变化默认产生警告；配置 `onChecksumMismatch: 'error'` 可拒绝继续。`db repair` 只使历史校验和与当前文件一致，不运行迁移、不修复结构，也不会让任务重新执行。只有确认数据库已符合当前文件语义时才考虑它。未合并迁移的开发调试可使用 `db redo`，已发布变更仍必须新增迁移。

标准构建在编译迁移和 Seed 后生成 `.manifest.json`，用于保留源文件校验和并校验编译产物。保留现有构建步骤及清单，缺失或不匹配时重新构建，不手改历史或清单。插件交付说明见[构建和交付数据库资源](../../extension-development/database-and-migrations.md#构建和交付数据库资源)。

## 验证迁移

应用和插件从 `@nocobase/app-testing/server` 导入 `describeMigration()`，提供真实迁移来源。在 `before` 准备旧数据，`up` 检查变更后结构与记录，`down` 检查回退后的数据；不可逆迁移设置 `reversible: false`。

辅助工具会检查物理结构与元数据的一致性，并对可逆迁移验证回退与重新应用。业务断言仍需自己编写，特别是旧记录保留、回填条件、非法引用及删除行为。测试入口见[数据库与命令行测试](../../developing-apps/testing-and-acceptance.md#数据库与命令行测试)。

[查看执行器实现](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/migration/migrator.ts)与 [迁移行为测试](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db-testkit/tests/integration/migration/migrator.test.ts)。
