---
title: Connections and database dialects
description: Learn how to create a database connection on its own, configure multiple connections in an application, tell managed from external databases, and diagnose dialect issues.
---

A connection binds logical database capabilities to a specific database and namespace. One manager can hold several connections, each with its own dialect, transactions and model resolution.

## Creating a connection on its own

```ts
import { createDatabaseManager } from '@nocobase/db';
import sqlite from '@nocobase/db-sqlite';

const db = createDatabaseManager({
  default: 'main',
  connections: { main: sqlite({ filename: ':memory:' }) },
});
try {
  await db.connect();
  const connection = db.connection('main');
  console.log(connection.dialect);
} finally {
  await db.destroy();
}
```

In-memory SQLite suits isolated tests; its data disappears when it is closed. Production applications should get the manager from the existing container rather than creating a connection pool for each request.

The core manager does not scan for dialect packages. Standalone code supplies dialect factories explicitly, or registers factories in `drivers` first and then uses declarative configuration. The application runtime asynchronously loads the installed official dialects named in its configuration before creating the manager.

## Application configuration and multiple connections

Applications configure connections with `database.default` and `database.connections.<name>`, and organize database resources under `database/<name>/`. `db.connection('analytics')` and `db.repository('events', 'analytics')` select a named connection; when the name is omitted, the default connection is used.

A connection is not a coordinator for cross-database transactions. A transaction only covers the connection in its callback and does not also commit work on another connection.

## Managed and external databases

`schemaManagement: managed` lets the framework manage the database structure. For an external database, `external` prevents the framework from running DDL and migrations, and supplemental metadata is maintained separately; applications can use the `database/<connection>/metadata/` directory. This does not make reads and writes read-only; they remain subject to the database account and business policies.

## Dialect differences and diagnosis

SQLite files, the host and port of network databases, Oracle's serviceName, TLS parameters and native dependencies are all configured per dialect. When diagnosing, check the installed packages, the connection fields and environment variable overrides first, then whether the database is reachable; do not try to "fix" existing data by switching dialects.

`config check --no-connect` checks configuration only, and connection checks do not run migrations. See the [Configuration reference](../../reference/configuration.md) and [Database support and version compatibility](../../reference/compatibility.md).

To add a second connection to an application, see [Multiple database connections](../../developing-apps/multiple-databases.md); for configuring an external database, its metadata files and refresh steps, see [Connect an existing database](../../developing-apps/existing-databases.md).

## Interfaces and implementation

- [Manager creation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/database/create-database-manager.md)
- [Connection configuration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/database/types.ts)
