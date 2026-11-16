---
title: "Which frontend, backend, and databases does NocoBase 3 use?"
---

Core applications use React on the frontend and Node.js on the server, with Hono handling HTTP routes. The default UI follows shadcn/ui component conventions. Reuse application components and NocoBase UI Library, and customize styling through themes. See [Client runtime](../core/framework/runtime/client.md), [Server runtime](../core/framework/runtime/server.md), and [Themes and styles](../core/developing-apps/themes-and-styles.md).

Choose from supported database drivers: SQLite, PostgreSQL, MySQL/MariaDB, SQL Server, and Oracle. Dameng, KingbaseES, and OceanBase drivers require the corresponding commercial license and have compatibility-mode or experimental restrictions. See [Database support and compatibility](../core/reference/compatibility.md) for versions, drivers, and conditions.

The default template uses SQLite, but it is not required for every app. You can install another driver and configure its connection when creating an app; see [Create an app with a different database](../core/reference/database-configuration.md). Changing a connection or dialect does not move existing data. Plan [data migration](backup-and-migration.md) separately.
