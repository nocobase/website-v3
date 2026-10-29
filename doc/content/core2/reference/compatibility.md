---
title: Database support and version compatibility
description: Look up database dialects, connection differences, runtime requirements and versions to check together during upgrades.
---

This page distinguishes three kinds of information: the available dialect packages, the integration test environments configured in source, and the combinations actually verified for an application. Test environment versions are neither a complete statement of minimum versions nor a support-lifetime commitment.

## Runtime and package versions

| Item | What to check |
| --- | --- |
| Node.js | The reviewed template and runtimes require `>=24.0.0`; match build, dependency-installation and runtime environments |
| pnpm | Use `packageManager` in the app manifest; the verified template declares `pnpm@11.7.0` |
| Application template | Check `nocobase.defaultTemplateVersion` in `package.json` |
| Core packages | Check installed versions, the lockfile and package `peerDependencies` |
| Database dialect | Check compatibility with `@nocobase/db`, Node and the target platform |
| Plugins | Check Client, Server and CLI exports, dependency ranges and migrations |

Each package is versioned independently. For example, the application verified here uses `app-client` `4.0.0-beta.3`, `app-server` `3.0.0-beta.3` and `app-cli` `1.0.0-beta.29` together in NocoBase 3. Package major versions do not identify product generations.

```bash
node --version
pnpm --version
pnpm list @nocobase/app-client @nocobase/app-server @nocobase/app-cli @nocobase/db --depth 0
```

## Public database dialects

Integration environments below come from the reviewed Docker Compose configuration. They are source-defined test targets; these external database services were not rerun for this documentation check.

| Database | Package / `dialect` | Driver | Source integration environment or requirement |
| --- | --- | --- | --- |
| SQLite | `@nocobase/db-sqlite` / `sqlite` | `better-sqlite3` | Embedded database; native modules must match Node, operating system and architecture |
| PostgreSQL | `@nocobase/db-postgres` / `postgres` | `pg` | PostgreSQL 16 |
| MySQL | `@nocobase/db-mysql` / `mysql` | `mysql2` | MySQL 8.4 |
| MariaDB | `@nocobase/db-mysql` / `mysql` | `mysql2` | MariaDB 10.11 |
| Microsoft SQL Server | `@nocobase/db-mssql` / `mssql` | `tedious` | SQL Server 2022 |
| Oracle Database | `@nocobase/db-oracle` / `oracle` | `oracledb` | Oracle Free 23 |

The MySQL dialect's JSON filters use `JSON_OVERLAPS`, requiring MySQL 8.0.17+ or MariaDB 10.9+. The expression syntax used for TEXT defaults is available from MySQL 8.0.13. These are feature-specific requirements; check other features used by the application when selecting a deployment version. See the [MySQL dialect notes](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-mysql/README.md).

## Commercial database dialects

| Database | Package / `dialect` | Connection mode and checks |
| --- | --- | --- |
| Dameng | `@nocobase/db-dameng` / `dameng` | Uses `knex-dm` and `dmdb`; the reviewed notes mark it experimental pending integration-contract validation against the target server |
| KingbaseES | `@nocobase/db-kingbase` / `kingbase` | PostgreSQL-compatible mode, `DB_MODE=pg` |
| OceanBase | `@nocobase/db-oceanbase` / `oceanbase` | OceanBase CE MySQL-compatible tenant |

Obtain commercial packages from the Pro registry under the applicable license. Compatibility mode is a connection prerequisite, not a guarantee that every proprietary behavior matches PostgreSQL or MySQL. OceanBase TEXT defaults are filled by Repository on record creation; direct SQL inserts must supply a value.

## Application connection configuration

The default application database configuration loads installed official dialects as needed. Add the selected dialect to production dependencies before configuring the connection. When you use `@nocobase/db` on its own, supply driver factories or a driver registry explicitly through its API.

For a new PostgreSQL application that has not been configured yet, proceed in this order:

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres
pnpm nocobase config set database.connections.main.host=127.0.0.1 database.connections.main.database=my_app database.connections.main.username=my_app
pnpm nocobase config set --from-env database.connections.main.password=MAIN_DB_PASSWORD
pnpm nocobase config check
```

Set `MAIN_DB_PASSWORD` through your environment-management mechanism first. Preserve other configuration, keys and data when modifying an existing connection. Changing `dialect` does not migrate business data to another database.

| Difference | Meaning |
| --- | --- |
| SQLite | Uses `filename`; the default template resolves its database file under application `storage/` |
| User name | High-level connection configuration uses `username`, rather than each driver's native `user` field |
| Oracle | Use `serviceName`; a normal database name alone is insufficient |
| PostgreSQL | Set `schema` and `ssl` as needed |
| SQL Server | Set `encrypt` and `trustServerCertificate` according to deployment certificates |
| Multiple connections | `database.default` selects the default; resources use `database/<connection>/` |
| External databases | `schemaManagement: external` restricts framework schema changes; data access still depends on account permissions and authorization policies |

## Upgrades and cross-platform builds

1. Preserve the lockfile, runtime configuration and recoverable data backups.
2. Follow [Upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md), merge template changes and check dependency and peer ranges.
3. Verify migrations, queries, transactions, permissions and plugin behavior in an isolated environment.
4. Rebuild for the target platform instead of copying native dependencies across operating systems or architectures.
5. Verify code rollback and database recovery separately. Reverting program code does not automatically undo committed schema changes.

See the [Command-line reference](cli.md) for `--target` and `--node-version`, and [Choose a deployment method](../deployment/choose-a-deployment-method.md) for production deployment.

## Verification scope

Checked on 2026-10-27: public dialects and templates against [Core `015404ecd0db`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs); commercial dialect notes against their source revision `138665ffaaaa`. Executed command checks used default template beta.83, Node 24.21.0, pnpm 11.7.0, `@nocobase/db` 1.0.0-beta.22 and SQLite dialect 0.1.0-beta.6.
