---
title: "Database explorer"
description: "Inspect the application's database connections, Collection definitions and physical structures."
---

## Capabilities

`@nocobase/app-plugin-database-explorer` lets you inspect the application's configured database connections, Collections, fields and physical table structures, which helps during development and when troubleshooting data model problems. It offers no operations for creating or altering tables or editing business records.

The plugin provides query APIs and a client; the structure browsing page is composed by the application.

## Scenarios and examples

### Example: check the fields of the orders table

1. On the database explorer page the application connects, choose the connection that holds the orders.
2. Find the orders Collection and check its fields, relations and any warnings in the definition.
3. View the physical structure to confirm the database columns and indexes are as expected.
4. If something needs to change, go back to the application's [database migrations](../../framework/database/migrations.md); do not treat the explorer page as a migration editor.

Lists page through `pageToken`. When implementing search yourself, be explicit about whether it searches the current page or the full list; `DatabaseExplorerClient.allCollections()` can walk all pages and returns a `truncated` flag when it reaches the traversal limit.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use Database Explorer to add an administrator schema-viewing page. Reuse
DatabaseExplorerClient and DATABASE_EXPLORER_ACCESS for connections, Collections
and on-demand physical schemas. Support pagination and show truncation. Add no
schema or record editing. Test denied access, unavailable connections and missing Collections.
```

**Done when**: authorized administrators can view both the logical and physical structures, and users without permission cannot call the query APIs directly.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| `client/routes.ts` and the explorer page | Combine the queries for connections, Collections and physical structures | A structure browsing entry that expands on demand is added |
| The page's authorization declaration | Reuse `DATABASE_EXPLORER_ACCESS` | The menu and the API use the same access condition |
| Pagination and error states | Handle `pageToken`, `truncated` and query failures | Incomplete lists or failures are never shown as complete results |

### Integration and entry points

Register the Client and Server plugins after Authentication and Permission management. The plugin provides `DatabaseExplorerClient` and the query APIs but no explorer page of its own; the application connects a page using these capabilities. The plugin has no business tables of its own and needs no migration.

The page and the API use the same permission, `page:database-explorer/access`. The client can reuse the public `DATABASE_EXPLORER_ACCESS`, which avoids a menu that is visible while its API cannot be called.

### Browse the database structure

| What to query | API |
| --- | --- |
| Configured connections | `GET /api/databaseExplorer/connections` |
| Collections in a connection | `GET /api/databaseExplorer/connections/:connection/collections` |
| A Collection's definition and fields | `GET /api/databaseExplorer/connections/:connection/collections/:collection` |
| Physical columns, indexes and constraints | Append `/physicalSchema` to the Collection address above |

The connection list shows structural information such as names, dialects, whether a connection is the default, and its management mode, but never returns connection passwords, hosts or database file paths. Logical definitions and physical structures are queried separately, so open the physical details only when needed.

## AI development constraints and verification

### Development constraints for this plugin

- Keep the capability boundary of "read-only structure"; changing table structures still goes through migrations.
- When showing connection summaries, do not additionally read and expose hosts, passwords or database file paths.
- Add verification for searching across pages, the traversal limit and denied access; do not treat the first page as all Collections.

### Limits of use

The plugin itself has no write APIs; however, the first time a Collection in a managed connection is read, the database framework may initialize internal metadata and cache version tables, without changing any business tables or records. External connections use the metadata in their directory.

Check access for administrators and accounts without permission, as well as unreachable connections, invalid Collections and pagination behavior. The exact error fields are defined by the running application's API documentation.

Related documentation: [Connections and database dialects](../../framework/database/connections.md), [Permission management](../authorization/permissions.md), [Manage plugins](../../developing-apps/manage-plugins.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-database-explorer).
