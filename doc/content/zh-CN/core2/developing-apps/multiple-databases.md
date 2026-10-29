---
title: 多数据库连接
description: 配置命名连接，按连接维护迁移和初始数据，并明确运行时的访问方式和事务范围。
---

一个应用可以使用多个数据库连接。Examples 模板用 `main` 保存应用数据，用 `analytics` 演示一份独立的分析数据，两者的结构都由应用管理。连接名称对应 `database/<连接名>/` 目录；它既不是业务模块名，也不会自动实现租户隔离。

本篇演示如何给已有应用增加第二个受管理的连接。如果要接入由其他系统维护的数据库，请另见 [接入已有数据库](existing-databases.md)。

## 添加连接配置

在 `server/config/database.ts` 中保留现有配置，并增加 `analytics`。下面是只包含两个 SQLite 连接的最小完整示例：

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

这里使用两个不同的文件，避免两个连接误指向同一个数据库。配置文件只定义默认值，部署环境仍然可以覆盖配置；执行命令前，请先确认最终的连接目标。如果已经有其他连接、方言或环境变量映射，请合并修改，不要整个文件替换。

`connectionEnvironment('main')` 只为主连接绑定标准的环境变量。第二个连接如果也需要环境变量，必须显式配置映射；不要以为 `DB_HOST` 等变量会自动应用到所有连接。配置的加载和方言参数见 [连接与数据库方言](../framework/database/connections.md) 和 [应用配置（config.yml）](configuration-and-settings.md)。

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

只增加目录并不会创建连接，连接配置与资源目录的名称必须一致。每个连接分别维护自己的结构、记录和执行历史。不要为了使用第二个连接而把 `database.default` 改成 `analytics`，否则所有没有指定连接的已有代码都会换到新的目标上。

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

本例的 `events` 是一个独立的小模型，不需要照搬 Examples 模板中全部的分析业务。如果需要初始事件，把 Seed 放到同一个连接的 `seeds/` 目录下，参见 [建表与数据初始化](data-models-and-migrations.md)。

## 针对明确的连接执行变更

```bash
pnpm nocobase db apply --connection analytics --dry-run
pnpm nocobase db apply --connection analytics
pnpm nocobase collections generate --connection analytics --check
```

Examples 模板为 `analytics` 配置了 `migrations.autoRun` 和 `seeds.autoRun`；本篇改用显式命令，以说明每次变更的范围，而不依赖自动执行。运行前，请先检查应用实际的启动配置。`--all` 和 `--connection` 不能同时使用；批量操作前，确认每个连接的管理模式。完整选项见 [命令行参考](../reference/cli.md)。

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

`database.repository('events', 'analytics')` 也是一种显式选择连接的写法。省略连接时使用默认连接；当不同连接中存在同名的业务表时，尤其容易读错数据库。不要在每次请求中创建新的数据库管理器或连接池。

## 跨连接的边界

事务只覆盖当前的连接。业务需要同时更新主库和分析库时，应设计明确的失败补偿或异步同步流程；把两次写入都包进主库的事务里，并不能让它们成为原子操作。也不要把跨连接的数据组合当成普通的 Collection 关联查询，而应分别查询各个连接，再按业务规则组合结果。

新增的连接同样需要配置业务权限，不能因为数据来自分析库就跳过授权。事务和外部同步的设计见 [事务与数据一致性](transactions-and-consistency.md)。

## 验证

需要确认：只执行 analytics 的迁移时，main 保持不变；两个连接中存在同名表时，明确指定连接的查询仍能取到正确的记录；权限被拒绝、数据库为空和连接失败时，都得到预期的处理。部署之前，请用实际使用的方言测试迁移和数据类型；在两个 SQLite 文件上验证通过，并不代表所有数据库都已兼容。
