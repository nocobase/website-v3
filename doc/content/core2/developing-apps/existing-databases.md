---
title: Connect an existing database
description: Read an existing schema through an external connection, add metadata and relations, and verify name mapping and access permissions.
---

When the database schema is maintained by another system such as a CRM or ERP, the application can connect to it with `schemaManagement: 'external'`. The framework reads the existing structure and overlays the metadata the application maintains; no migrations, Seeds or Builder DDL run on this connection.

`external` marks a boundary of schema management; it is not a read-only switch. Whether records can actually be read or written still depends on the database account and application authorization. This guide organizes the configuration and files the same way as `externalCrm` in the Examples template.

## Confirm the existing schema

First ask the database's maintainers to confirm the target tables, fields, primary keys and their business meaning. This example assumes these physical objects already exist:

- `crm_customers`: `id`, `display_name`, `email`.
- `crm_orders`: `id`, `order_no`, `customer_id`, where `customer_id` refers to the customer's `id`.

These tables must already exist; metadata files cannot create them. The Examples template's `ExternalCrmProvider` only prepares a local SQLite demonstration database; when connecting a real system, do not treat that preparation step as the standard way to create tables.

## Configure the external connection

Merge the following connection entry into `connections` in the `server/config/database.ts` factory, keeping the existing connections:

```ts
externalCrm: {
  dialect: 'sqlite',
  filename: paths.storage('external-crm.sqlite'),
  schemaManagement: 'external',
  naming: { underscored: true, tablePrefix: 'crm_' },
},
```

`paths` comes from the existing configuration factory. The local example uses a SQLite file; for a real system, install the dialect package for the target database and use the correct connection parameters. Do not commit credentials to the repository; reuse the application's existing environment configuration.

`tablePrefix: 'crm_'` and `underscored: true` map `crm_orders` to the logical collection `orders` and `customer_id` to the logical field `customerId`. Metadata and Repositories both use these logical names, so check the mapping before writing queries.

## Add metadata

At runtime, the application reads `database/<connection>/metadata/` for external connections by default, so this example does not need to declare a metadata store. Scripts that use `@nocobase/db` on its own must configure one explicitly; see [Connections and database dialects](../framework/database/connections.md) for the difference.

Create `database/externalCrm/metadata/customers.json`:

```json
{
  "version": 1,
  "name": "customers",
  "title": "CRM customers",
  "fields": {
    "displayName": {
      "title": "Display name"
    },
    "email": {
      "title": "Email address"
    }
  }
}
```

Then create `database/externalCrm/metadata/orders.json`:

```json
{
  "version": 1,
  "name": "orders",
  "title": "CRM orders",
  "fields": {
    "orderNo": {
      "title": "Order number"
    }
  },
  "relations": {
    "customer": {
      "type": "belongsTo",
      "target": "customers",
      "foreignKey": "customerId",
      "targetKey": "id",
      "title": "Customer"
    }
  }
}
```

Titles and field descriptions add information the database schema cannot express. The `customer` relation describes how existing fields connect to the customer collection; it creates no columns or foreign keys and does not repair historical data. `foreignKey` and `targetKey` must match the real schema and the name mapping.

These handwritten JSON files are source code and should be committed. Do not use the generated `collections/<collection>/metadata.json` as input for this directory, and do not save configuration by editing generated files.

## Refresh Collection information

```bash
pnpm nocobase collections generate --connection externalCrm
pnpm nocobase collections generate --connection externalCrm --check
```

The generated result in `database/externalCrm/collections/` reflects the model combined from the physical schema and the added metadata. Regenerate after changing metadata, and check the logical collection names, fields and relations. Running processes also need to reload the application; changing the JSON does not refresh every cache automatically.

After the external system changes its schema, check and verify again. A missing field is for the schema's maintainers to resolve; it cannot be "fixed" by adding application migrations to the external connection.

## Query from a business service

The function below uses an authorized policy, which must allow reading the order fields and the customer fields selected through the `customer` relation:

```ts
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export async function listCrmOrders(
  database: DatabaseManager,
  policy: RepositoryPolicy,
) {
  return database.connection('externalCrm').repository('orders')
    .withPolicy(policy)
    .findMany({
      select: (s) => s.fields('id', 'orderNo')
        .include('customer', (customer) => customer.fields('id', 'displayName')),
      sort: (s) => [s.field('id').asc()],
      limit: 20,
    });
}
```

To offer read-only access, restrict both the database account and the operations the application exposes. `include()` does not grant read access to the relation; if orders and customers must use the scopes of different business actions, bind and query each policy separately, as described in [Querying and manipulating data](querying-data.md).

If you need an HTTP API, declare Repository data endpoints as described in [Routes and HTTP APIs](apis-and-services.md), stating `connection: 'externalCrm'`, the allowed operations and the permission policy explicitly. Adding a connection or metadata does not expose an API by itself.

## Verify

Confirm that logical and physical names map correctly and that fields and relations can actually be queried; test the results when a relation is empty and after an external record is deleted; and verify with a real account that writes are rejected as intended. Also confirm that the framework refuses Builder DDL and that the application runs no migrations or Seeds on this connection. Do not get around schema management through a low-level client.

The SQLite demonstration only illustrates the process; before going live, verify types, primary keys, permissions and schema changes on the target database. For transaction scope across connections, see [Multiple database connections](multiple-databases.md).
