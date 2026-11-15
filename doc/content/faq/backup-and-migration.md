---
title: "How do I back up, restore, and migrate application data?"
---

Plan these as separate tasks. Source code or a build archive alone is not a data backup:

- **Backup and recovery:** use tools appropriate to your database and file storage. Keep matching database data, uploaded files, the application version, and the configuration and keys needed for recovery. Choose a consistent backup point for your workload, and test sign-in, permissions, and business reads and writes after restoring.
- **Schema changes:** use migrations for tables, fields, indexes, and upgrade data changes, and seeds for required initial records. See [Tables and data initialization](../core/developing-apps/data-models-and-migrations.md).
- **Moving business data:** when changing servers or databases, plan export, transformation, import, and validation for the source and target. Across database types, also check field types, relations, indexes, and constraints. Editing connection settings in `config.yml` does not migrate existing data.

Build artifacts do not automatically contain the development database, uploaded files, or runtime secrets. Keep a recoverable backup before release. Rolling back the application does not undo database migrations or business writes. If the old application cannot use the new schema, restore matching data and account for writes made since the backup. See [Release a new application version](../core/deployment/publish-app-release.md).

Moving from NocoBase 2 to NocoBase 3 also requires rebuilding the application implementation, not just copying data. See [Migrating existing applications](from-v2.md#migrating-existing-applications).
