---
title: Connections and database dialects
---

Connections bind logical database capabilities to a database and namespace. A manager can own multiple connections with independent dialects, transactions and model resolution.

## Independent connection

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

In-memory SQLite suits isolated tests and disappears on close. Production applications resolve their existing manager instead of creating pools per request.

The core manager does not scan dialect packages. Independent consumers supply factories or a `drivers` registry. The application runtime asynchronously loads configured installed official dialects before creating its manager.

## App configuration and multiple connections

Use `database.default` and `database.connections.<name>`, with resources under `database/<name>/`. `db.connection('analytics')` and `db.repository('events', 'analytics')` select named connections; omission uses the default.

A connection is not a distributed transaction coordinator. Its transaction does not atomically commit work on another connection.

## Managed and external databases

`schemaManagement: managed` permits framework schema management. `external` restricts framework DDL and migrations and requires supplemental metadata; applications can maintain `database/<connection>/metadata/`. It does not make data operations read-only: database credentials and business policies still govern access.

## Dialect differences and diagnosis

Configure SQLite filenames, network addresses, Oracle serviceName, TLS and native dependencies for the chosen dialect. Check installed drivers, fields and environment precedence before connectivity. Changing dialects does not repair or migrate existing data.

`config check --no-connect` checks configuration only; connection checks do not run migrations. See [Configuration](../../reference/configuration.md) and [Database support](../../reference/compatibility.md).

See [Multiple database connections](../../developing-apps/multiple-databases.md) for adding an application connection, and [Connect an existing database](../../developing-apps/existing-databases.md) for external configuration, metadata files and refresh steps.

## Interfaces and implementation

- [Manager creation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/database/create-database-manager.md)
- [Connection configuration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/database/types.ts)
