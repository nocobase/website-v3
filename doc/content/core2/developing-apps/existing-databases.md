---
title: Connect an existing database
description: Connect to an externally managed schema, supply metadata and relations, and verify naming and access permissions.
---

When another system such as a CRM or ERP owns the schema, connect with `schemaManagement: 'external'`. The framework reads existing structure and overlays application-maintained metadata. It does not run migrations, Seeds or Builder DDL on this connection.

`external` defines schema ownership, not read-only permissions. Record access still depends on database credentials and application authorization. This guide follows the Examples template's `externalCrm` structure.

## Confirm the existing schema

Confirm tables, columns, primary keys and business meaning with the database owner. This example assumes these physical objects already exist:

- `crm_customers`: `id`, `display_name`, `email`.
- `crm_orders`: `id`, `order_no`, `customer_id`, with `customer_id` referring to the customer ID.

Metadata files cannot create those tables. The Examples template's `ExternalCrmProvider` prepares a local SQLite demonstration database only; it is not the normal schema creation process for a real external system.

## Configure the external connection

Merge this connection entry into `connections` in the `server/config/database.ts` factory, preserving existing connections:

```ts
externalCrm: {
  dialect: 'sqlite',
  filename: paths.storage('external-crm.sqlite'),
  schemaManagement: 'external',
  naming: { underscored: true, tablePrefix: 'crm_' },
},
```

`paths` comes from the existing configuration factory. SQLite is the local example; install the appropriate dialect and use the actual connection parameters for your system. Keep credentials in application environment configuration rather than source control.

`tablePrefix: 'crm_'` and `underscored: true` map `crm_orders` to Collection `orders` and `customer_id` to field `customerId`. Metadata and Repositories use those logical names. Check mappings before writing queries.

## Add metadata

The application runtime defaults external connections to `database/<connection>/metadata/`, so this example needs no explicit metadata store. Standalone `@nocobase/db` scripts must configure one explicitly; see [Connections, configuration and dialects](../framework/database/connections.md).

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

Create `database/externalCrm/metadata/orders.json`:

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

Titles and descriptions add information absent from the schema. The `customer` relation describes existing fields; it creates no columns or foreign keys and repairs no historical records. Match `foreignKey` and `targetKey` to the schema's logical names.

These handwritten JSON files are source assets to commit. Do not use generated `collections/<collection>/metadata.json` artifacts as their input or edit generated files to preserve configuration.

## Refresh Collection information

```bash
pnpm nocobase collections generate --connection externalCrm
pnpm nocobase collections generate --connection externalCrm --check
```

Generated artifacts under `database/externalCrm/collections/` combine physical schema and metadata. Regenerate after changes and inspect logical names, fields and relations. Reload running applications too; editing JSON does not imply every cache updates automatically.

Recheck after schema changes by the external owner. Missing fields must be resolved with that owner, not by adding application migrations to the external connection.

## Query from a business service

This function requires an authorization-derived policy allowing the selected order fields and customer relation fields:

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

For read-only access, restrict both database credentials and exposed application operations. `include()` does not grant relation access. If orders and customers need separate business scopes, query with separate policies; see [Querying and manipulating data](querying-data.md).

To expose HTTP, follow [Routes and HTTP APIs](apis-and-services.md) and explicitly configure `connection: 'externalCrm'`, operations and policies in Repository API declarations. A connection or metadata file does not automatically expose endpoints.

## Verify

Confirm physical/logical name mappings and query actual fields and relations. Test missing relations and externally deleted records, and verify intended write restrictions with real credentials. Check that Builder DDL is refused and no application migrations or Seeds run on this connection. Do not bypass schema ownership through a low-level client.

SQLite demonstrates the flow only. Validate types, primary keys, access and schema changes on the target database before deployment. See [Multiple database connections](multiple-databases.md) for transaction scope.
