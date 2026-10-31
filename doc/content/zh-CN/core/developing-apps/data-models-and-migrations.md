---
title: 建表与数据初始化
description: 在应用中创建状态字典、安装默认记录，并通过新增迁移与真实数据库测试维护后续变更。
---

在已有 NocoBase 应用中，可以用 Migration 创建状态字典，再用 Seed 安装默认值。下面的 `appStatuses` 保存稳定的状态编码和可编辑名称；后续升级为它增加说明字段。没有应用时先[创建应用](../getting-started/create-app.md)，也可以直接运行文末的[完整示例](#示例源码与运行)。

## 目录与文件约定

以下文件放在应用根目录下，示例使用已配置的受管理连接 `main`：

```text
database/
└── main/
    ├── migrations/
    │   ├── 202611040001_create_app_statuses.ts
    │   └── 202611040003_add_app_status_description.ts
    ├── seeds/
    │   └── 202611040002_default_app_statuses.ts
    └── collections/  # Generated cache
```

目录名是连接名称，创建目录不会注册新连接。使用其他连接时替换目录名和命令中的 `--connection`；配置方式见[多个数据库连接](multiple-databases.md)。保留模板的 `database/tsconfig.json`，让数据库文件参与服务端类型检查。

文件默认导出任务定义，`name` 与文件名去掉扩展名后的部分一致，并在同一连接的同类任务中唯一。迁移维护结构和升级数据变更，Seed 安装默认记录；日常状态编辑应由业务服务处理。

## 创建数据表

创建 `database/main/migrations/202611040001_create_app_statuses.ts`：

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040001_create_app_statuses',
  async up({ builder }) {
    await builder.createCollection('appStatuses', (collection) => {
      collection.string('code', { length: 32 }).primary().notNull();
      collection.string('title', { length: 100 }).notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('appStatuses');
  },
});
```

执行后，`code` 是不可重复的状态标识，`title` 是必填显示名称。名称允许修改，记录身份仍由 `code` 决定。`down()` 删除整张状态表和全部记录，只在允许丢弃这些数据的场景使用。

这里使用 Migration Context 的 `builder`。更多字段、索引和约束用法见[数据表与字段](../framework/database/schema.md)，定义选项见[数据库迁移](../framework/database/migrations.md)。[查看此迁移源码](https://github.com/nocobase/docs-examples-v3/blob/3892ff215c813b92d84bce1cce7433a14f6b693a/apps/team-tasks/database/main/migrations/202611040001_create_app_statuses.ts)。

## 初始化默认记录

创建 `database/main/seeds/202611040002_default_app_statuses.ts`：

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040002_default_app_statuses',
  async run(context) {
    const statuses = context.repository('appStatuses');
    for (const values of [
      { code: 'draft', title: 'Draft' },
      { code: 'published', title: 'Published' },
    ]) {
      if (await statuses.findOne({ filter: { code: values.code } })) continue;
      await statuses.createOne({ values });
    }
  },
});
```

首次安装得到 `draft` / `Draft` 和 `published` / `Published`。如果管理员已经把 `draft` 改名为 `Writing`，本例保留该名称，只补齐缺失的状态。主键约束防止重复编码；查询后插入的并发冲突应让任务失败，不能静默忽略。

`context.repository()` 绑定当前 Seed 的连接和事务。无需自己获取 DatabaseManager，也不能在 Seed 中建表。更新已有默认值、配置和可选演示数据的写法见[初始数据](../framework/database/seeds.md)。[查看 Seed 源码](https://github.com/nocobase/docs-examples-v3/blob/3892ff215c813b92d84bce1cce7433a14f6b693a/apps/team-tasks/database/main/seeds/202611040002_default_app_statuses.ts)。

## 执行变更与检查结果

确认应用配置指向预期数据库后，在应用根目录执行：

```bash
pnpm nocobase config check
pnpm nocobase db apply --connection main --dry-run
pnpm nocobase db apply --connection main
pnpm nocobase collections generate --connection main --check
```

`--dry-run` 列出计划，不执行任务。实际执行先处理该连接的全部待运行迁移，再处理 Seed；默认连接还包含已注册插件的数据库资源。因此输出可能不只包含本文的文件。

首次执行后，状态表包含两条默认记录。如果已经加入后面的升级迁移，两条记录的 `description` 都为 `null`。再次执行 `db apply`，成功任务应按历史跳过，不新增重复记录。

`db apply` 默认在迁移改变结构后刷新 `database/main/collections/`。其中的 `collection.json`、`metadata.json`、`schema.json` 以及连接级清单都是可再生成的缓存，不能手动编辑。`collections generate --check` 应报告缓存与数据库一致；若刷新失败但迁移已成功，可单独运行 `pnpm nocobase collections generate --connection main`。

默认连接通常在应用启动时自动执行数据库任务，手动命令可用于提前查看和应用计划。启动配置与其他连接的自动执行规则见[多个数据库连接](multiple-databases.md)。

## 新增迁移并保留已有数据

状态字典已经使用后，需要增加说明字段时，不修改第一份迁移，新增 `database/main/migrations/202611040003_add_app_status_description.ts`：

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040003_add_app_status_description',
  async up({ builder }) {
    await builder.alterCollection('appStatuses', (collection) => {
      collection.text('description').nullable();
    });
  },
  async down({ builder }) {
    await builder.dropField('appStatuses', 'description');
  },
});
```

执行同样的 `db apply` 命令后，旧状态的编码和名称保留，新增 `description` 为 `null`。回退这份迁移会丢失说明内容，但保留原来的状态记录。需要进一步设为必填时，先明确旧记录的补齐规则，再新增迁移处理，见[回填与转换历史数据](../framework/database/migrations.md#回填与转换历史数据)。

不要为了让修改生效而清空数据库。已执行的文件修改后不会自动重跑；校验和、批次回退和 Seed 历史的关系见[数据库迁移](../framework/database/migrations.md#回退与不可逆变更)。[查看升级迁移源码](https://github.com/nocobase/docs-examples-v3/blob/3892ff215c813b92d84bce1cce7433a14f6b693a/apps/team-tasks/database/main/migrations/202611040003_add_app_status_description.ts)。

## 验证安装与升级

完整示例的 [`tests/database/app-statuses.test.ts`](https://github.com/nocobase/docs-examples-v3/blob/3892ff215c813b92d84bce1cce7433a14f6b693a/apps/team-tasks/tests/database/app-statuses.test.ts) 使用真实隔离数据库，可以在示例 App 根目录执行：

```bash
pnpm exec vitest run --project node tests/database/app-statuses.test.ts
```

测试覆盖建表和重复编码约束、默认记录安装、重复执行跳过历史，以及已有自定义名称不被覆盖。升级测试在增加说明字段前插入旧记录，再检查升级、回退与重新应用后记录仍然保留。

失败测试调用真实 Seed 后主动抛错，检查记录与成功历史都回滚，再解除失败条件重试。另一个测试使用独立历史表再次运行同一 Seed，验证业务幂等，不把执行器跳过历史误当作写入逻辑本身幂等。

这些测试不会重置应用的开发数据库。`describeMigration()` 和 `createDatabaseTest()` 的使用方式、其他方言测试配置见[数据库与命令行测试](testing-and-acceptance.md#数据库与命令行测试)。

## 示例源码与运行

示例复用 [Team tasks App](https://github.com/nocobase/docs-examples-v3/tree/3892ff215c813b92d84bce1cce7433a14f6b693a/apps/team-tasks)，状态字典与其中的任务状态相互独立，没有新增管理页面。Node.js 24、pnpm 11；固定提交中的依赖与配置要求见 [README](https://github.com/nocobase/docs-examples-v3/blob/3892ff215c813b92d84bce1cce7433a14f6b693a/apps/team-tasks/README.MD#tables-and-initial-data-example)。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 3892ff215c813b92d84bce1cce7433a14f6b693a
cd apps/team-tasks
pnpm install --frozen-lockfile
pnpm exec vitest run --project node tests/database/app-statuses.test.ts
```

运行测试不需要配置日常开发数据库。若要通过应用 CLI 执行迁移，在安装依赖后先运行 `pnpm nocobase config init` 完成自己的数据库配置，再执行前面的命令；已经配置的应用无需重新初始化。示例测试默认使用 SQLite，其他数据库需要相应驱动及测试连接配置，不要求你的业务应用改用 SQLite。
