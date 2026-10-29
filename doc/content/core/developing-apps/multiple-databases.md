---
title: Multiple database connections
description: Configure named connections, organize their migrations and Seeds, and select connections explicitly at runtime.
---

An application can use several database connections. The Examples template stores application data in `main` and demonstrates separate analytics data in `analytics`; the app manages both schemas. Connection names correspond to `database/<connection>/`, not automatic module or tenant isolation.

This guide adds a managed connection to an existing app. For databases owned by another system, see [Connect an existing database](existing-databases.md).

## Add connection configuration

Preserve existing settings in `server/config/database.ts` and add `analytics`. This minimal complete example contains two SQLite connections:

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

Use different files so the two names do not accidentally point to the same database. These are defaults; deployment configuration may override them. Check resolved targets before running commands. Merge changes when existing connections, drivers or environment mappings differ.

`connectionEnvironment('main')` binds standard environment variables only to the main connection. Declare mappings explicitly for another connection; `DB_HOST` and similar variables do not automatically configure all connections. See [Connections, configuration and dialects](../framework/database/connections.md) and [Application configuration (config.yml)](configuration-and-settings.md).

## Organize resources by connection

```text
database/
├── main/
│   ├── migrations/
│   └── seeds/
└── analytics/
    ├── migrations/
    └── seeds/
```

A directory does not create a connection: its name must match configuration. Each connection has its own schema, records and execution history. Do not change `database.default` merely to access analytics, since existing calls without an explicit connection would change targets too.

Create `database/analytics/migrations/202611040003_create_analytics_events.ts`:

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

This small `events` model is independent of the Examples template's full analytics features. If it needs initial records, put Seeds under the same connection; see [Create tables and initialize data](data-models-and-migrations.md).

## Apply changes to an explicit connection

```bash
pnpm nocobase db apply --connection analytics --dry-run
pnpm nocobase db apply --connection analytics
pnpm nocobase collections generate --connection analytics --check
```

The Examples template configures `migrations.autoRun` and `seeds.autoRun` for analytics. This guide uses explicit commands to make scope clear, without relying on automatic execution. Check actual startup settings first. `--all` and `--connection` are mutually exclusive; understand every connection's management mode before bulk operations. See [Command-line reference](../reference/cli.md).

## Select the connection in business services

Pass the application's container-resolved `DatabaseManager` into this function, together with a policy from the operation's authorization result:

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

`database.repository('events', 'analytics')` also selects the connection explicitly. Omitting it uses the default, which is especially easy to miss when tables share names. Do not create a manager or connection pool for every request.

## Cross-connection boundaries

A transaction covers only its connection. Updating both application and analytics databases requires an explicit compensation or asynchronous synchronization design; wrapping both writes in a main transaction does not make them atomic. Do not treat cross-connection composition as an ordinary Collection relation query. Query each connection and combine results according to business rules.

Another connection still needs business authorization. Analytics data does not bypass permissions. See [Transactions and data consistency](transactions-and-consistency.md).

## Verify

Ensure analytics migrations leave main unchanged, explicit queries select the right records even with matching table names, and denied access, empty databases and connection failures behave as intended. Test migrations and types with your deployment dialect; two SQLite files do not establish compatibility with every database.
