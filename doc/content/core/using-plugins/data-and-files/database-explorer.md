---
title: "Database explorer"
description: "Inspect application connections, Collection definitions and physical schemas."
---

## Capabilities

`@nocobase/app-plugin-database-explorer` inspects configured connections, Collections, fields and physical schemas. It is useful for development and diagnosis and exposes no table-editing or business-record editing operation.

The plugin supplies query APIs and a client; the application composes the explorer UI.

## Scenarios and examples

### Example: inspect an orders table

1. Select the connection used by orders.
2. Inspect the Collection fields, relations and warnings.
3. Open its physical schema to inspect columns and indexes.
4. Make required changes through [migrations](../../framework/database/migrations.md).

Follow `pageToken` for paginated lists. `DatabaseExplorerClient.allCollections()` walks pages for application-side search and reports `truncated` if its traversal limit is reached.

**Development prompt** (for a Coding Agent working in the application directory):

```prompt
Add a database structure page for authorized administrators to investigate order fields and relations.
They should be able to select a connection and inspect application definitions and physical database structure. Keep this view read-only.
Support pagination and clearly show partial results, connection failures and missing tables.
Confirm that unauthorized users cannot open the page or call its APIs directly, and keep connection credentials out of the page.
```

**Done when**: Authorized administrators can inspect logical and physical schemas; denied users cannot query the API.

## Key principles and implementation

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Client routes and explorer page | Compose connections, Collections and physical-schema requests | Add on-demand schema browsing |
| Page authorization | Reuse DATABASE_EXPLORER_ACCESS | Align navigation and API access |
| Pagination and error states | Handle pageToken, truncated and failures | Do not present partial or failed results as complete |

### Integration

Register both runtimes after Authentication and Authorization. The application builds a page using `DatabaseExplorerClient`; the plugin contributes APIs, with no page or business-table migration.

The page and API share `page:database-explorer/access`. Reuse the exported `DATABASE_EXPLORER_ACCESS` on the client.

### Browse structure

| Query | Endpoint |
| --- | --- |
| Connections | `GET /api/databaseExplorer/connections` |
| Collections | `GET /api/databaseExplorer/connections/:connection/collections` |
| Definition and fields | `GET /api/databaseExplorer/connections/:connection/collections/:collection` |
| Physical columns, indexes and constraints | Append `/physicalSchema` to the Collection endpoint |

Connection summaries include names, dialects and management modes, without passwords, hosts or database file paths. Definitions and physical schemas are separate requests.

## AI development constraints and verification

### Plugin-specific development constraints

- Keep schema browsing read-only; schema changes still use migrations.
- Do not add host, password or database-path disclosure to connection summaries.
- Test cross-page search, traversal limits and denied access instead of treating the first page as all Collections.

### Boundaries

Although the plugin has no write endpoint, the database framework may initialize internal metadata and cache-version tables on the first managed-connection Collection read. Business tables and rows are unchanged. External connections use directory-backed metadata.

Verify authorized and denied access, unavailable connections, missing Collections and pagination. See the running application's API document for error contracts.

Related: [Database connections](../../framework/database/connections.md), [Permission management](../authorization/permissions.md), [Manage plugins](../../developing-apps/manage-plugins.md).

These are checks to run after integration. See [Example versions and verification scope](../overview.md#example-versions-and-verification-scope) for the documented baseline and executed checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-database-explorer).
