---
title: 数据库资源与迁移
description: 为插件声明迁移和 Seed 目录，接入应用默认连接，并验证资源构建、安装和升级。
---

插件通过 Server 声明提供迁移和 Seed，由安装它的应用统一执行。下面以 `notice-data` 插件的公告分类字典为例；建模、Context 和执行规则与应用共用，详细用法见[数据表与字段](../framework/database/schema.md)、[数据库迁移](../framework/database/migrations.md)和[初始数据](../framework/database/seeds.md)。

## 创建数据库资源目录

新建插件时，在 App 根目录选择数据库能力：

```bash
pnpm create @nocobase/plugin@beta notice-data --with database
```

已有插件直接补齐目录与声明，不必重新创建。以下插件文件路径相对于 `packages/app-plugin-notice-data/`：

```text
server/
├── index.ts
└── plugin.ts
database/
├── migrations/
│   └── 202611040020_notice_data_create_categories.ts
└── seeds/
    └── 202611040020_notice_data_default_categories.ts
```

插件目录没有 `main/` 这一层。创建工具生成的 `.ts.example` 是不会执行的草稿，按需求编写真正的 `.ts` 文件；没有初始数据时可省略 Seed 声明。

## 声明资源路径与连接归属

在 `server/plugin.ts` 中声明资源，已有插件保留其他贡献：

```ts
import path from 'node:path';
import { defineServerPlugin, type AppServerPlugin } from '@nocobase/app-server/plugins';

const plugin: AppServerPlugin = defineServerPlugin({
  packageName: '@nocobase/app-plugin-notice-data',
  baseDir: path.resolve(import.meta.dirname, '..'),
  database: {
    migrations: './database/migrations',
    seeds: './database/seeds',
  },
});

export default plugin;
```

`server/index.ts` 对外导出入口：

```ts
export { default } from './plugin.js';
```

`baseDir` 必须是绝对路径，资源路径以 `./` 开头且不能向父目录跳转。上例在源码中解析到插件根目录，在 `dist/server/plugin.js` 中解析到 `dist/`。因此编译后也必须包含相应数据库目录。

插件声明的迁移和 Seed 仅贡献到应用的默认连接，即 `database.default` 指定的连接，不保证名称是 `main`。插件声明没有选择另一个连接的选项，也不创建自己的数据库。目录存在、资源声明、应用注册和任务执行是不同环节。

## 编写迁移与初始数据

在 `database/migrations/202611040020_notice_data_create_categories.ts` 创建字典：

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040020_notice_data_create_categories',
  async up({ builder }) {
    await builder.createCollection('noticeCategories', (c) => {
      c.string('code', { length: 32 }).primary().notNull();
      c.string('title', { length: 100 }).notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('noticeCategories');
  },
});
```

任务名称带插件标识，避免与应用及其他插件重名。所有来源在同一连接中按名称统一排序，不按插件注册顺序分组。依赖其他插件的结构时，明确前置版本和迁移顺序，不能仅依赖“先注册了它”。

在 `database/seeds/202611040020_notice_data_default_categories.ts` 安装默认分类：

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040020_notice_data_default_categories',
  async run(context) {
    const categories = context.repository('noticeCategories');
    if (await categories.findOne({ filter: { code: 'general' } })) return;
    await categories.createOne({ values: { code: 'general', title: 'General' } });
  },
});
```

应用迁移完成后执行 Seed，得到 `general` / `General`。已有分类保留管理员修改。不要在 Provider 启动时创建这些表或反复插入默认记录。

虚构公告等可选演示内容使用单独的 `sample: true` Seed，由宿主的首次安装与 `app.sampleData` 配置控制；普通 Seed 不会自动识别示例数据。若生成示例必须调用其他插件服务，可在 Provider 的 `boot()` 中通过 `sampleDataToken` 注册生成器，等应用就绪后执行，而不是在 `boot()` 当场写入。服务名称也应包含插件标识。具体执行条件见[可选示例数据](../framework/database/seeds.md#必需数据与可选示例数据)。

已合入或发布的迁移、Seed 保持不可变，后续修改新增文件。结构变更及历史回填写在迁移中，不能用 Seed 反复覆盖用户数据。

## 注册插件并执行变更

本地插件已是应用可解析的工作区依赖后，在 App 根目录预览并注册：

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

`--no-install` 只跳过安装，不能替代工作区依赖配置。检查 Server 入口已进入 `server/plugins.ts`，详细注册方法见[插件声明与公开入口](plugin-declarations.md#运行端入口)。

数据库计划应包含上述迁移与 Seed，也可能包含应用和其他插件的待执行任务。首次执行后应能解析 `noticeCategories` 并读到默认分类；重复执行应跳过成功历史。`db apply` 不是只运行当前插件的命令。

资源声明不会自动开放 CRUD 接口或添加菜单。业务访问需要单独实现接口和权限；数据访问 API 见[Repository](../framework/database/repositories.md)，接口接入见[路由与 HTTP 接口](server-apis.md)。

## 验证安装与升级

在插件的 `tests/database/categories.test.ts` 中使用真实迁移来源：

```ts
import { fileURLToPath } from 'node:url';
import { describeMigration } from '@nocobase/app-testing/server';
import metadata from '../../package.json' with { type: 'json' };

describeMigration('202611040020_notice_data_create_categories', {
  sources: [{
    packageName: metadata.name,
    directory: fileURLToPath(new URL('../../database/migrations/', import.meta.url)),
  }],
  up: async ({ expectCollection }) => {
    await expectCollection('noticeCategories').toHaveField('code', {
      type: 'string', nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('noticeCategories').not.toExist();
  },
});
```

`describeMigration()` 会应用迁移、检查结构和元数据、回退并重新应用。实际业务还应断言重复分类编码被拒绝；Seed 测试应检查首次安装、已有名称保留和失败重试。依赖其他插件集合时，为测试补齐前置迁移来源或使用完整 App 测试夹具。

在 App 根目录运行：

```bash
pnpm --filter @nocobase/app-plugin-notice-data exec vitest run tests/database/categories.test.ts
```

新增升级迁移时，先准备旧版本数据，再验证升级后的记录与约束。测试工具的共同用法见[数据库与命令行测试](../developing-apps/testing-and-acceptance.md#数据库与命令行测试)。

## 构建和交付数据库资源

保留脚手架的编译和 `nocobase-db-manifests` 步骤，后者为编译后的迁移、Seed 生成校验清单。插件自己生成清单，应用不应替已安装依赖重新生成；原理见[校验和与编译产物](../framework/database/migrations.md#校验和与编译产物)。

在 App 根目录完成插件检查和应用构建：

```bash
pnpm --filter @nocobase/app-plugin-notice-data check
pnpm build
```

检查发布包包含 `dist/database/migrations/`、实际使用的 `dist/database/seeds/`，以及各目录中的 `.manifest.json`。在隔离应用中分别验证编译产物的空库安装和旧版本升级，确认 `baseDir` 能找到资源；工作区源码测试通过不代表发布包内容齐全。

移除插件注册不会自动删除已有结构和数据。回退使用应用的批次规则，可能同时影响其他插件，不能把 `db rollback` 当作插件卸载命令。交付检查见[构建与发布](publish-plugin.md)。

[资源声明类型](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/app/app-server/src/plugins/types.ts)、[脚手架声明](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/tools/create-plugin/template/server/plugin.ts)和 [脚手架测试](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/tools/create-plugin/template/tests/database/migrations.test.ts)。
