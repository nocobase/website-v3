---
title: 数据库与迁移
description: 声明插件的数据资源，编写迁移，并验证源码与构建产物中的数据库任务。
---

插件可以拥有自己的数据结构，并通过迁移把变化应用到 App 的数据库。本篇创建 `noticeDataEntries` 集合，说明迁移、初始数据、业务读写与构建产物的关系。

## 使用 Agent

```text
请在当前 App 中创建 notice-data 插件，用迁移建立公告条目集合，包含 id 和必填 title。
不要在 Provider 启动时建表，不要插入示例数据。
验证迁移、回滚和重新应用，并确认插件构建后仍能加载迁移。
```

## 创建数据库能力

命令在 App 根目录执行，文件路径相对于 `packages/app-plugin-notice-data/`。

```bash
pnpm create @nocobase/plugin@beta notice-data --with database
```

生成的 `server/plugin.ts` 包含以下声明，保留它；Server 入口仍由 `server/index.ts` 默认导出：

```ts
import path from 'node:path';
import { defineServerPlugin, type AppServerPlugin } from '@nocobase/app-server/plugins';

const plugin: AppServerPlugin = defineServerPlugin({
  packageName: '@nocobase/app-plugin-notice-data',
  baseDir: path.resolve(import.meta.dirname, '..'),
  database: { migrations: './database/migrations', seeds: './database/seeds' },
});
export default plugin;
```

`baseDir` 是绝对路径，数据库资源路径相对于它。源码运行时指向插件根目录；编译后从 `dist/server/plugin.js` 出发，指向 `dist` 内的迁移。不要写死开发机器上的路径。

## 编写迁移

脚手架中的 `.ts.example` 文件不会执行。本例新增 `database/migrations/202610260001_notice_data_create_entries.ts`，不要同时启用含有其他表结构的默认示例：

```ts
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610260001_notice_data_create_entries',
  async up({ builder }) {
    await builder.createCollection('noticeDataEntries', (collection) => {
      collection.increments('id');
      collection.string('title', { length: 200, nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('noticeDataEntries');
  },
});
export default migration;
```

文件名和 `name` 保持一致。所有插件和 App 的任务会合并排序，因此名称带插件标识，避免只用 `create_entries` 这样的通用名称。

`up()` 建立集合及字段，`down()` 撤销这次结构变化。回滚这里会删除条目数据，只适合确认可丢弃的测试数据。迁移必须自包含，不能导入会随业务代码改变的“当前字段定义”。

迁移一旦合并或交付，不再修改原文件，包括格式、文件名和 `down()`；后续新增字段应再写一个排序更后的迁移。应用记录任务执行历史和校验和，修改旧文件既不会自动升级旧数据库，也会造成新旧安装不一致。

## 用真实数据库验证

将脚手架的数据库测试替换为 `tests/database/migrations.test.ts`：

```ts
import { fileURLToPath } from 'node:url';
import { describeMigration } from '@nocobase/app-testing/server';
import packageMetadata from '../../package.json' with { type: 'json' };

describeMigration('202610260001_notice_data_create_entries', {
  sources: [
    {
      packageName: packageMetadata.name,
      directory: fileURLToPath(
        new URL('../../database/migrations', import.meta.url),
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('noticeDataEntries').toHaveField('title', {
      type: 'string',
      nullable: false,
      length: 200,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('noticeDataEntries').not.toExist();
  },
});
```

`describeMigration()` 使用隔离测试数据库，完成应用、回滚和再次应用，检查逻辑元数据与物理结构的一致性。不要只做“文件能导入”的测试。引用其他插件集合时，把前置迁移来源也放进 `sources`。

```bash
pnpm --filter @nocobase/app-plugin-notice-data format
pnpm --filter @nocobase/app-plugin-notice-data check
```

## 注册后应用到 App

先在开发 App 中注册 Server 插件，再检查迁移计划：

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install
```

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

`db apply` 同时处理待执行的迁移和 seed，先迁移再 seed。它应用当前 App 的整体计划，不只包含这个插件；执行前检查输出，不要用 `db reset` 代替日常升级。

## 迁移、seed 和业务数据如何区分

| 需求 | 放在哪里 |
| --- | --- |
| 建集合、改字段、索引和约束 | 迁移 |
| 插件正常工作必需的固定初始记录 | seed |
| 用户创建的公告、导入结果 | Service、接口或 Repository 操作 |
| 演示记录和测试样本 | 测试 fixture，不加入本例的发布 seed |

Seed 使用 `defineSeed()`，声明稳定的任务名和 `run()`。先确保所需结构已由迁移建立，再决定遇到已有记录时跳过、报错还是更新插件拥有的字段。任务历史通常让成功 seed 只执行一次，但仍要验证恢复或明确重放时的行为，不能覆盖用户修改。

服务端从容器解析 `databaseManagerToken`，用 `database.repository('noticeDataEntries')` 访问逻辑集合。`database.query()` 是更底层的查询接口，不会自动应用集合元数据及表名前缀规则。浏览器通过 API 访问数据；创建集合本身不会自动开放 CRUD 接口，也不会添加菜单。

## 构建与升级检查

保留生成的插件构建步骤：TypeScript 编译后运行 `nocobase-db-manifests`。它为编译后的迁移和 seed 生成校验清单，让源码和 JavaScript 产物对应同一次历史任务；不要手工修改清单或删掉这个步骤。

运行 App 的 `pnpm build`，确认迁移随插件进入构建产物。交付前在隔离数据库验证两条路径：空库完整安装，以及旧版本数据库应用新迁移。卸载注册不会自动删除已有数据；数据删除和迁移回滚需要独立决定。更多边界见[测试与验证](testing-and-verification.md)。
