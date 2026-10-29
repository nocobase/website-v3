---
title: Database overview
---

`@nocobase/db` provides logical models, data access, schema evolution and transactions. Dialect packages connect specific databases; the application runtime owns configuration, resource discovery and lifecycle.

## Choosing an entry

| Entry | Responsibility |
| --- | --- |
| DatabaseManager / Connection | Named/default connections, disposal and transactions |
| CollectionBuilder | Tables, fields, relationship metadata, indexes and schema changes |
| Repository | Logical-model access, relations, codecs and policies |
| Query | Table-oriented queries, set-based backfills and specialized reports |
| Collections / SchemaInspector | Logical resolution and physical inspection |
| Migrator / Seeder | Tracked schema history and initial data |

Business code normally begins with Repository. Migrations use Builder for schema and Query for set-based backfills. Driver-specific capabilities are not automatically portable public APIs.

## Using the application database

```ts
import { databaseManagerToken } from '@nocobase/db';

// Inside a server route factory or ServiceProvider:
const database = app.container.resolve(databaseManagerToken);
const orders = database.repository('orders');
```

Reuse the configured service. Independent scripts and tests may create managers that they must destroy afterwards; see [Connections and dialects](connections.md).

## Application and plugin integration boundaries

The application configures connections and keeps its resources in `database/<connection>/migrations/` and `seeds/`. Plugins typically provide `database/migrations/` and `seeds/`, declaring resource paths through `server/plugin.ts` for the host to discover and execute. Both use `defineMigration()`, `defineSeed()` and their contexts; the resource location does not change database semantics.

Business services reuse the host `DatabaseManager` and select named connections explicitly when needed. Plugins must not create connections per request or destroy the shared manager during their own shutdown. Design queries and transaction boundaries across connections explicitly; a transaction does not automatically span all databases. Database operations run on the server; clients use APIs.

For implementation steps, see [Tables and initial data](../../developing-apps/data-models-and-migrations.md), [Multiple database connections](../../developing-apps/multiple-databases.md) and [Plugin database resources](../../extension-development/database-and-migrations.md). This chapter explains models, operations, transactions and resource execution mechanisms.

## Logical and physical models

Collections combine physical schema with supplemental metadata. Logical names may differ from physical names. Repository understands logical mappings. Query works with physical table and column names without reading Collection field mappings or table prefixes, so backfills must name their targets explicitly.

Relationship metadata and titles do not replace physical constraints. Generated `database/<connection>/collections/` files are snapshots; schema changes remain migrations.

## Examples in this chapter

Examples use `orders` with `id`, `orderNo`, `title`, `status`, `amount` and `customerId`. [Tables and fields](schema.md) creates the base model; [Relationships](relations.md) adds customers and both directions. Queries assume existing models and server-side code whose caller has completed authorization.

## Permissions and evolution

Database services do not infer HTTP identity. Bind authorization-derived policies to Repositories; user filters cannot replace access control.

Follow schema, data access, relations, transactions and migrations. See the [database API index](../../reference/api.md) for signatures and [Compatibility](../../reference/compatibility.md) for dialect conditions.

## Interfaces and implementation

- [Database concepts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/overview.md)
- [Database API](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/README.md)
