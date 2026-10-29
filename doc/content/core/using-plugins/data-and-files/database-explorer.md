---
title: "Database explorer"
description: "Inspect application connections, Collection definitions and physical schemas."
---

`@nocobase/app-plugin-database-explorer` inspects configured connections, Collections, fields and physical schemas. It is useful for development and diagnosis and exposes no table-editing or business-record editing operation.

## Integration

Register both runtimes after Authentication and Authorization. The application builds a page using `DatabaseExplorerClient`; the plugin contributes APIs, with no page or business-table migration.

The page and API share `page:database-explorer/access`. Reuse the exported `DATABASE_EXPLORER_ACCESS` on the client.

## Browse structure

| Query | Endpoint |
| --- | --- |
| Connections | `GET /api/databaseExplorer/connections` |
| Collections | `GET /api/databaseExplorer/connections/:connection/collections` |
| Definition and fields | `GET /api/databaseExplorer/connections/:connection/collections/:collection` |
| Physical columns, indexes and constraints | Append `/physicalSchema` to the Collection endpoint |

Connection summaries include names, dialects and management modes, without passwords, hosts or database file paths. Definitions and physical schemas are separate requests.

## Example: inspect an orders table

1. Select the connection used by orders.
2. Inspect the Collection fields, relations and warnings.
3. Open its physical schema to inspect columns and indexes.
4. Make required changes through [migrations](../../framework/database/migrations.md).

Follow `pageToken` for paginated lists. `DatabaseExplorerClient.allCollections()` walks pages for application-side search and reports `truncated` if its traversal limit is reached.

## Boundaries

Although the plugin has no write endpoint, the database framework may initialize internal metadata and cache-version tables on the first managed-connection Collection read. Business tables and rows are unchanged. External connections use directory-backed metadata.

Verify authorized and denied access, unavailable connections, missing Collections and pagination. See the running application's API document for error contracts.

Related: [Database connections](../../framework/database/connections.md), [Permission management](../authorization/permissions.md), [Manage plugins](../../developing-apps/manage-plugins.md).

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-database-explorer).
