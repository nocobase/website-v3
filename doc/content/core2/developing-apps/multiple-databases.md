---
title: Multiple database connections
description: Configure named connections, maintain migrations and initial data per connection, and make runtime access and transaction scope explicit.
---

An application can use several database connections. The Examples template keeps application data in `main` and demonstrates separate analytics data in `analytics`, with the application managing both schemas. A connection name corresponds to a `database/<connection>/` directory; it is neither a business module name nor an automatic tenant isolation rule.

This guide shows how to add a second managed connection to an existing application. To connect a database maintained by another system, see [Connect an existing database](existing-databases.md) instead.

## Add the connection configuration

Keep the existing configuration in `server/config/database.ts` and add `analytics`. Below is a minimal complete example with just two SQLite connections:

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

Two different files are used here, so the two connections cannot accidentally point to the same database. The configuration file only defines defaults, and deployment environments can still override it; check the final connection targets before running commands. If other connections, dialects or environment variable mappings already exist, merge the change instead of replacing the whole file.

`connectionEnvironment('main')` binds the standard environment variables only to the main connection. If the second connection also needs environment variables, configure its mapping explicitly; do not assume variables such as `DB_HOST` apply to every connection. For configuration loading and dialect parameters, see [Connections and database dialects](../framework/database/connections.md) and [Application configuration (config.yml)](configuration-and-settings.md).

## Maintain resources per connection

```text
database/
├── main/
│   ├── migrations/
│   └── seeds/
└── analytics/
    ├── migrations/
    └── seeds/
```

Adding a directory does not create a connection; the connection configuration and the resource directory must share the same name. Each connection maintains its own schema, records and execution history. Do not change `database.default` to `analytics` just to use the second connection, or every piece of existing code that does not name a connection will switch to the new target.

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

The `events` here is a small, independent model; you do not need to copy all of the Examples template's analytics features. If you need initial events, put a Seed in the same connection's `seeds/` directory; see [Create tables and initialize data](data-models-and-migrations.md).

## Apply changes to an explicit connection

```bash
pnpm nocobase db apply --connection analytics --dry-run
pnpm nocobase db apply --connection analytics
pnpm nocobase collections generate --connection analytics --check
```

The Examples template configures `migrations.autoRun` and `seeds.autoRun` for `analytics`; this guide uses explicit commands instead, to make the scope of each change clear rather than relying on automatic execution. Check the application's actual startup configuration before running them. `--all` and `--connection` cannot be used together; before bulk operations, confirm each connection's management mode. For the full options, see [Command-line reference](../reference/cli.md).

## Choose the connection explicitly in business services

Pass the `DatabaseManager` obtained from the application container to the function below; `policy` must come from the authorization result of this business action:

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

`database.repository('events', 'analytics')` is another way to choose the connection explicitly. Leaving the connection out uses the default one; when business tables with the same name exist in different connections, it is especially easy to read the wrong database. Do not create a new database manager or connection pool on every request.

## Limits across connections

A transaction only covers its own connection. When the business needs to update both the main database and the analytics database, design an explicit compensation or asynchronous synchronization process; wrapping both writes in the main database's transaction does not make them atomic. Nor should you treat combining data across connections as an ordinary Collection relation query: query each connection separately, then combine the results according to business rules.

A new connection also needs business permissions; data coming from the analytics database does not skip authorization. For designing transactions and external synchronization, see [Transactions and data consistency](transactions-and-consistency.md).

## Verify

Confirm that: running only the analytics migrations leaves main unchanged; when both connections have a table with the same name, a query that names its connection still gets the right records; and denied permissions, an empty database and connection failures are all handled as expected. Before deploying, test migrations and data types on the dialect you actually use; passing on two SQLite files does not mean every database is compatible.
