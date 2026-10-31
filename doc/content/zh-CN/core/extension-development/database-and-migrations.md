---
title: 数据库资源与迁移
description: 声明插件的迁移与 Seed 资源，由应用统一执行，并验证插件构建、安装与升级。
---

插件和应用共用 `defineMigration()`、`defineSeed()`、Repository 与事务机制。插件的区别在于资源由独立包维护，通过 Server 声明交给应用，并随插件版本构建和交付；插件本身不代表拥有独立数据库。

本篇集中说明插件的资源接入。建表与初始化的完整实践见[建表与数据初始化](../developing-apps/data-models-and-migrations.md)，通用 API 和执行规则见[迁移](../framework/database/migrations.md)与[初始数据](../framework/database/seeds.md)。

## 使用 Agent

```text
请检查当前插件的数据库资源接入。
明确迁移与 Seed 的职责，核对 Server 声明、baseDir 和源码、产物中的路径。
任务名称要避免与应用及其他插件冲突，不在 Provider 启动时建表或插入初始数据。
检查应用整体执行计划，验证空库安装、旧版本升级和编译资源加载。
```

## 创建数据库能力

新建插件时，在 App 根目录选择 `database` 能力：

```bash
pnpm create @nocobase/plugin@beta notice-data --with database
```

已有插件保留原有实现，补齐数据库目录和声明，不必重新创建。以下路径相对于 `packages/app-plugin-notice-data/`：

```text
server/
├── index.ts
└── plugin.ts
database/
├── migrations/
└── seeds/
```

创建工具生成的 `.ts.example` 文件是草稿，不会执行。按实际需求编写 `.ts` 文件；不需要初始记录时，Seed 目录可以保持为空。

`server/plugin.ts` 声明插件拥有的资源，`server/index.ts` 对外导出 Server 入口。下面是仅包含数据库能力的声明；已有插件应保留其他贡献：

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

`baseDir` 必须是绝对路径，资源路径相对于它。源码运行时指向插件根目录；编译后从 `dist/server/plugin.js` 出发，指向 `dist/` 内的迁移与 Seed。不要写死开发机器上的路径。创建目录、声明资源和执行任务是不同的步骤。

## 编写迁移

迁移放在 `database/migrations/`，使用与应用相同的 `defineMigration()`。建表、字段、索引和升级中的数据变更，按[迁移机制](../framework/database/migrations.md)编写，不需要插件专用的数据库 API。

文件名和声明中的 `name` 保持一致，并带上插件标识，例如 `202610260001_notice_data_create_entries`。应用会合并各来源的任务并按名称排序；名称需要在应用与全部插件中唯一，插件内的迁移也不是独立执行的一整组。依赖其他插件的数据结构时，明确前置版本与迁移顺序。

迁移必须自包含，已交付的文件保持不可变。后续变化新增迁移，不通过修改旧文件升级已有应用。回滚可能删除数据，需要独立评估；不要在 Provider 启动时执行建表逻辑。

## 初始数据

插件正常运行必需的固定记录放在 `database/seeds/`，默认导出 `defineSeed()` 声明。名称同样带插件标识，并与文件名一致。资源路径已经由前面的 `database.seeds` 声明，不需要另一套注册机制。写法见[定义 Seed](../framework/database/seeds.md#定义-seed)。

Seed 依赖的结构先由迁移建立。用稳定业务键与数据库唯一约束识别记录，明确已有数据应跳过、报错，还是仅更新插件拥有的字段；不能无条件覆盖管理员的修改。成功任务按历史跳过，已交付 Seed 保持不可变，后续变化新增文件。

Seed 没有迁移的 `down()`。用户创建的记录通过业务服务写入，演示数据放在测试 fixture 中，升级回填按业务目的设计迁移；不要把这些操作都放进发布 Seed。

## 注册后应用到 App

先接入插件的 Server 入口，再查看当前应用的整体执行计划。以下命令在 App 根目录执行：

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

`--no-install` 要求本地插件已是应用可解析的工作区依赖。`db apply` 先执行迁移，再执行 Seed；计划包含应用和全部已注册插件的待执行任务，不只包含当前插件。执行前检查输出，不要用 `db reset` 代替日常升级。

资源声明不会自动开放 CRUD 接口或添加菜单。运行时读写仍通过服务使用应用的数据库能力，方法见[查询与操作数据](../developing-apps/querying-data.md)和[事务与数据一致性](../developing-apps/transactions-and-consistency.md)。

## 用真实数据库验证

插件的数据库测试放在 `tests/database/`，复用 `@nocobase/app-testing/server`。使用 `describeMigration()` 时，将插件迁移目录与包名作为来源；依赖其他插件集合时，也提供前置迁移来源。验证应用、回滚和重新应用后的真实结构，而不仅检查文件可以导入。

Seed 验证首次安装、已有记录、重复执行、失败恢复，以及升级时用户修改是否保留。使用隔离测试数据库和真实实现，测试工具与示例见[数据库与命令行测试](../developing-apps/testing-and-acceptance.md#数据库与命令行测试)。

## 构建与升级检查

保留脚手架的插件构建步骤：TypeScript 编译后运行 `nocobase-db-manifests`，让源码与编译任务使用对应的校验清单。不要手工修改清单，也不要省略这个步骤。

在 App 根目录运行插件检查和应用构建：

```bash
pnpm --filter @nocobase/app-plugin-notice-data check
pnpm build
```

检查插件产物与发布包中的 `dist/database/migrations/`、实际使用的 `dist/database/seeds/` 及清单，确认编译后的 Server 入口能够定位资源。交付前验证空库安装和旧版本升级两条路径；只在工作区源码下通过不代表安装包可用。

移除插件注册不会自动删除已有结构和数据；数据保留、清理与迁移回滚需要单独决定。更多交付检查见[测试与验证](testing-and-verification.md)和[构建与发布](publish-plugin.md)。
