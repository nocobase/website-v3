---
title: Database overview
description: Learn the main entries of @nocobase/db, how to get the database in an application, the integration boundaries for applications and plugins, and how logical models relate to physical structure.
---

`@nocobase/db` provides logical data models, data access, schema evolution and transactions. Dialect packages connect to specific databases, and the application runtime is responsible for configuration, resource discovery and lifecycle.

## Where to start

| Entry | Problems it solves |
| --- | --- |
| DatabaseManager / Connection | Default and named connections, resource release and transactions |
| CollectionBuilder | Tables, fields, relationship metadata, indexes and schema changes |
| Repository | Reading and writing data by logical model, relations, field codecs and policies |
| Query | Table-oriented queries, set-based backfills and specialized reports |
| Collections / SchemaInspector | Resolving logical models and inspecting physical structure |
| Migrator / Seeder | Traceable schema change history and initial data |

Business code usually starts with Repository. In migrations, use Builder to evolve the schema and Query for set-based backfills. Capabilities offered by an underlying driver do not automatically become public capabilities supported by every dialect.

## Getting the database in an application

```ts
import { databaseManagerToken } from '@nocobase/db';

// Inside a server route factory or ServiceProvider:
const database = app.container.resolve(databaseManagerToken);
const orders = database.repository('orders');
```

When the application already has a database configured, reuse the existing service. Standalone scripts and tests can create their own manager, but must destroy it when they finish; see [Connections and database dialects](connections.md).

## Integration boundaries for applications and plugins

The application provides the connection configuration and maintains its own resources in `database/<connection>/migrations/` and `seeds/`. Plugins usually provide resources in `database/migrations/` and `seeds/`, declare the resource paths in `server/plugin.ts`, and let the host discover and run them. Both use `defineMigration()`, `defineSeed()` and their contexts; which directory a resource lives in does not change the semantics of database operations.

Business services reuse the host's `DatabaseManager` and select named connections explicitly when needed. Plugins must not create connections in requests or destroy the shared manager in their own shutdown logic. Query and transaction boundaries across connections need explicit design; never assume one transaction covers every database. Database operations run on the server, and clients access data through APIs.

For step-by-step instructions, see [Create tables and initialize data](../../developing-apps/data-models-and-migrations.md), [Multiple database connections](../../developing-apps/multiple-databases.md) and [Database resources and migrations](../../extension-development/database-and-migrations.md). The rest of this chapter explains models, data operations, transactions and how resources are executed.

## Logical models and physical structure

A Collection is resolved from the database's physical structure together with supplemental metadata. Logical names may differ from physical table and column names: Repository uses logical names, while Query works with physical table and column names and does not read the Collection's field mappings or table prefixes, so backfills must name their targets explicitly.

Relationship, title and other metadata cannot replace physical constraints. The generated `database/<connection>/collections/` files are model snapshots; schema changes are still written as migrations.

## Examples in this chapter

The following guides use orders as the example: `orders` has the fields `id`, `orderNo`, `title`, `status`, `amount` and `customerId`. [Tables and fields](schema.md) creates the base model, and [Relationships and associations](relations.md) adds a `customers` table and relations in both directions. The query snippets assume the models already exist and that the calls happen in server code that has already completed authorization.

## Permissions and evolution

Database services do not infer the user of an HTTP request. Data policies are produced by authorization and then bound to Repositories; filter conditions in a query can only narrow the request's scope and cannot replace access control.

We recommend reading schema, data access, relations, transactions and migrations in order. For exact signatures, see the [API reference](../../reference/api.md); for supported database versions and dialect conditions, see [Database support and version compatibility](../../reference/compatibility.md).

## Interfaces and implementation

- [Database concepts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/overview.md)
- [Database API](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/README.md)
