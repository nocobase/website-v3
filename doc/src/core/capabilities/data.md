---
title: Data modeling
status: To be written
description: How business objects, fields, and relations are defined and changed, which databases are supported, and how to connect an existing database.
---

> [!PENDING] This page is to be written
> The list below is what the page is planned to cover.

## Planned contents

- The four layers: agents write tables and migrations and `pnpm nocobase db apply` runs them; administrators do not create tables in the UI
- Where to see the current data model (`database/<connection>/collections/`) and the table list on **App foundation**
- Supported databases: SQLite, PostgreSQL, MySQL, SQL Server, Oracle; Dameng, KingbaseES, and OceanBase in the commercial edition
- Moving from SQLite to PostgreSQL: existing data is not migrated automatically
- Connecting an existing external database: read-only or read-write, with credentials kept in server configuration
- Initial data and sample data
- The database explorer API
- How to write a request and how to check the result
- How this maps to NocoBase 2 data source management

## Provided by

[Database](../plugins/db.md), [Database explorer](../plugins/database-explorer.md)

## Where existing pages go

| Existing page | Plan |
| --- | --- |
| Data sources › Overview, Usage | Merged into this group |
