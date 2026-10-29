---
title: 数据库资源与迁移
description: 声明插件的迁移和 Seed 资源，由应用统一执行，并验证插件的构建、安装与升级。
---

插件和应用共用 `defineMigration()`、`defineSeed()`、Repository 以及事务机制。插件的不同之处在于：资源由独立的包维护，通过 Server 声明交给应用，并随插件的版本一起构建和交付；插件本身并不意味着拥有一个独立的数据库。

本篇集中说明插件如何接入数据库资源。建表与初始化的完整实践见 [建表与数据初始化](../developing-apps/data-models-and-migrations.md)，通用的 API 和执行规则见 [数据库迁移](../framework/database/migrations.md) 与 [初始数据](../framework/database/seeds.md)。

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

已有的插件保留原有的实现，补齐数据库目录和声明即可，不必重新创建。以下路径相对于 `packages/app-plugin-notice-data/`：

```text
server/
├── index.ts
└── plugin.ts
database/
├── migrations/
└── seeds/
```

创建工具生成的 `.ts.example` 文件只是草稿，不会被执行。请按实际需求编写 `.ts` 文件；不需要初始记录时，Seed 目录可以保持为空。

`server/plugin.ts` 声明插件拥有的资源，`server/index.ts` 对外导出 Server 入口。下面是只包含数据库能力时的声明；已有的插件应保留其他的贡献：

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

`baseDir` 必须是绝对路径，资源路径都相对于它。运行源码时，它指向插件根目录；编译之后，从 `dist/server/plugin.js` 出发，指向 `dist/` 中的迁移和 Seed。不要写死开发机器上的路径。创建目录、声明资源和执行任务，是三个不同的步骤。

## 编写迁移

迁移放在 `database/migrations/` 中，使用与应用相同的 `defineMigration()`。建表、字段、索引以及升级过程中的数据变更，都按 [数据库迁移](../framework/database/migrations.md) 编写，不需要插件专用的数据库 API。

文件名和声明中的 `name` 保持一致，并带上插件的标识，例如 `202610260001_notice_data_create_entries`。应用会合并来自各个来源的任务，并按名称排序；因此名称必须在应用和所有插件之间保持唯一，插件内的迁移也不是一组独立执行的任务。如果依赖其他插件的数据结构，请明确前置的版本和迁移的顺序。

迁移必须自包含，已经交付的文件保持不变。后续的变化通过新增迁移完成，而不是修改旧文件来升级已有的应用。回滚可能会删除数据，需要单独评估；不要在 Provider 启动时执行建表的逻辑。

## 初始数据

插件正常运行所必需的固定记录，放在 `database/seeds/` 中，默认导出 `defineSeed()` 的声明。名称同样带上插件的标识，并与文件名一致。资源路径已经由前面的 `database.seeds` 声明，不需要另一套注册机制。写法见 [定义 Seed](../framework/database/seeds.md#定义-seed)。

Seed 所依赖的结构，先由迁移建立。使用稳定的业务键和数据库的唯一约束来识别记录，并明确遇到已有数据时，是跳过、报错，还是只更新插件拥有的字段；不能无条件地覆盖管理员所做的修改。成功执行过的任务会按历史记录跳过，已经交付的 Seed 保持不变，后续的变化通过新增文件完成。

Seed 没有迁移中的 `down()`。用户创建的记录，应通过业务服务写入；演示数据放在测试的 fixture 中；升级时的数据回填，按业务目的设计成迁移。不要把这些操作都塞进发布的 Seed 里。

## 注册后应用到 App

先接入插件的 Server 入口，再查看当前应用整体的执行计划。以下命令在 App 根目录执行：

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

`--no-install` 要求本地插件已经是应用可以解析的工作区依赖。`db apply` 先执行迁移，再执行 Seed；执行计划包含应用和所有已注册插件中待执行的任务，而不只是当前插件的。执行前请检查输出，不要用 `db reset` 代替日常的升级。

资源声明不会自动开放 CRUD 接口，也不会添加菜单。运行时的读写，仍然通过服务端的业务服务使用应用的数据库能力，方法见 [查询与操作数据](../developing-apps/querying-data.md) 和 [事务与数据一致性](../developing-apps/transactions-and-consistency.md)。

## 用真实数据库验证

插件的数据库测试放在 `tests/database/` 中，复用 `@nocobase/app-testing/server`。使用 `describeMigration()` 时，把插件的迁移目录和包名作为来源；如果依赖其他插件的集合，也要提供前置的迁移来源。要验证应用、回滚和重新应用之后真实的数据库结构，而不只是检查文件可以导入。

Seed 需要验证首次安装、已有记录、重复执行、失败恢复，以及升级时用户的修改是否保留。请使用隔离的测试数据库和真实的实现，测试工具和示例见 [数据库与命令行测试](../developing-apps/testing-and-acceptance.md#数据库与命令行测试)。

## 构建与升级检查

请保留脚手架中插件的构建步骤：TypeScript 编译之后运行 `nocobase-db-manifests`，让源码和编译后的任务使用相对应的校验清单。不要手工修改清单，也不要省略这一步。

在 App 根目录运行插件的检查和应用的构建：

```bash
pnpm --filter @nocobase/app-plugin-notice-data check
pnpm build
```

检查插件产物和发布包中的 `dist/database/migrations/`、实际用到的 `dist/database/seeds/` 以及清单，确认编译后的 Server 入口能够找到这些资源。交付之前，验证空库安装和从旧版本升级两条路径；只在工作区源码下通过，并不代表安装包也可用。

移除插件的注册，不会自动删除已有的结构和数据；数据的保留、清理以及迁移的回滚，需要单独决定。更多交付检查见 [测试与验证](testing-and-verification.md) 和 [构建与发布](publish-plugin.md)。
