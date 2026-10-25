---
title: Database
status: Body to be completed
description: A foundation library. Tables, fields, relations, queries, transactions, and migrations, plus the dialects for each database. The app's data model is built on it.
---

> [!PENDING] Body to be written
> The profile comes from the NocoBase repository's `v3-develop` branch (2026-10-23); the commercial dialects come from the `develop` branch of `nocobase3-pro`.

## Profile

| | |
| --- | --- |
| Package | `@nocobase/db`, with dialects `@nocobase/db-sqlite`, `db-postgres`, `db-mysql`, `db-mssql`, `db-oracle` |
| Version | 1.0.0-beta.22 (dialects 0.1.0-beta.5 / 0.1.0-beta.6) |
| Edition | <span class="tag">Open source</span>; `db-dameng` (Dameng), `db-kingbase` (KingbaseES), `db-oceanbase` <span class="tag pro">Commercial</span> |
| Default template | Includes `@nocobase/db` and the SQLite dialect; install other dialects as needed |
| Type | Foundation library, used directly, no registration needed |
| Commands | `pnpm nocobase db apply`, `db rollback`, `db redo`, `db reset`, `db repair`, `db unlock`, `db sample`, `collections doctor` |
| Skill | `nocobase-db` |
| Building block | [Data modeling](../capabilities/data.md) |

## Planned contents

- How tables, fields, and relations are defined in code, and where readers can see the current data model (`database/<connection>/collections/`)
- Migrations: they run in order, a migration that has run is never edited, and how to roll back
- Switching databases: moving from SQLite to PostgreSQL does not migrate existing data automatically
- A second database connection: connecting an external database, read-only or read-write
- Version requirements and differences for each database
- The commercial Dameng, KingbaseES, and OceanBase: licensing and release status (to be confirmed)
- How this maps to NocoBase 2 data source management
- Development reference
