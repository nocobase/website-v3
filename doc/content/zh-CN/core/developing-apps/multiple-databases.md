---
title: 多数据库连接
description: 配置命名连接，按连接维护迁移与初始数据，并明确运行时访问和事务范围。
---

一个应用可以使用多个数据库连接。Examples 模板用 `main` 保存应用数据，用 `analytics` 演示独立的分析数据；两者都由应用管理结构。连接名称对应 `database/<连接名>/`，不是业务模块名或租户自动隔离规则。

本篇演示给已有应用增加第二个受管理连接。接入由其他系统维护的库，另见[接入已有数据库](existing-databases.md)。

## 添加连接配置

在 `server/config/database.ts` 中保留现有配置并增加 `analytics`。以下是只含两个 SQLite 连接的最小完整示例：

```ts
import {
  connectionEnvironment,
  defineAppDatabaseConfig,
} from '@nocobase/app-server/database';

export default defineAppDatabaseConfig(
  ({ paths }) => ({
    default: 'main',
    connections: {
      main: {
        dialect: 'sqlite',
        filename: paths.storage('database.sqlite'),
        schemaManagement: 'managed',
      },
      analytics: {
        dialect: 'sqlite',
        filename: paths.storage('analytics.sqlite'),
        schemaManagement: 'managed',
      },
    },
  }),
  { env: connectionEnvironment('main') },
);
```

这里使用两个不同的文件，避免误把两个连接指向同一数据库。配置文件定义默认值，部署环境仍可覆盖配置；执行命令前检查最终连接目标。已有其他连接、方言或环境变量映射时，应合并而非整文件替换。

`connectionEnvironment('main')` 只给主连接绑定标准环境变量。第二个连接如需环境变量，也要显式配置其映射；不要以为 `DB_HOST` 等变量会自动应用到所有连接。配置加载和方言参数见[连接、配置与数据库方言](../framework/database/connections.md)及[应用配置（config.yml）](configuration-and-settings.md)。

## 按连接维护资源

```text
database/
├── main/
│   ├── migrations/
│   └── seeds/
└── analytics/
    ├── migrations/
    └── seeds/
```

增加目录本身不会创建连接；连接配置和资源目录的名称必须一致。两个连接分别维护自己的结构、记录和执行历史。不要为了使用第二个连接，把 `database.default` 改为 `analytics`，否则未指定连接的既有代码也会改变目标。

创建 `database/analytics/migrations/202611040003_create_analytics_events.ts`：

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040003_create_analytics_events',
  async up({ builder }) {
    await builder.createCollection('events', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('name', { length: 120 }).notNull();
      collection.datetime('createdAt').notNull();
      collection.index('createdAt');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('events');
  },
});
```

本例的 `events` 是独立的小模型，不要求复制 Examples 模板的全部分析业务。需要初始事件时，把 Seed 放入同一连接的 `seeds/`，参见[建表与数据初始化](data-models-and-migrations.md)。

## 对明确的连接执行变更

```bash
pnpm nocobase db apply --connection analytics --dry-run
pnpm nocobase db apply --connection analytics
pnpm nocobase collections generate --connection analytics --check
```

Examples 模板为 `analytics` 配置了 `migrations.autoRun` 和 `seeds.autoRun`；本篇采用显式命令说明变更范围，不依赖自动执行。运行前先检查应用实际启动配置。`--all` 与 `--connection` 互斥，批量操作前确认所有连接的管理模式，完整选项见[命令行参考](../reference/cli.md)。

## 在业务服务中明确选择连接

从应用容器取得的 `DatabaseManager` 可以传给下面的函数；`policy` 必须来自该业务操作的授权结果：

```ts
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export async function listAnalyticsEvents(
  database: DatabaseManager,
  policy: RepositoryPolicy,
) {
  return database.connection('analytics').repository('events')
    .withPolicy(policy)
    .findMany({
      select: (s) => s.fields('id', 'name', 'createdAt'),
      sort: (s) => [s.field('createdAt').desc(), s.field('id').desc()],
      limit: 20,
    });
}
```

`database.repository('events', 'analytics')` 也是显式选择连接的写法。省略连接时使用默认连接；业务表同名时尤其容易误读错误数据库。不要在每次请求中创建新的数据库管理器或连接池。

## 跨连接的边界

事务只覆盖当前连接。业务需要同时更新主库和分析库时，应明确失败补偿或异步同步过程，不能把两个写入包进主库事务就视为原子操作。也不要把跨连接的数据组合当成普通 Collection 关联查询；按连接分别查询，再按业务规则组合结果。

新增连接同样需要配置业务权限，不能因为数据来自分析库就跳过授权。事务与外部同步的设计见[事务与数据一致性](transactions-and-consistency.md)。

## 验证

检查只执行 analytics 迁移时 main 不变；两个连接存在同名表时，明确连接的查询仍取到正确记录；权限拒绝、空库和连接失败得到预期处理。部署前使用实际方言测试迁移与数据类型，不把两个 SQLite 文件的验证当成所有数据库都已兼容。
