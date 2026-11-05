---
title: Create an app with a different database
metaDescription: Create a NocoBase application using existing database connection details, with configuration examples for SQLite, PostgreSQL, MySQL, SQL Server, Oracle and commercial drivers.
---

## Prepare database connection details

The database server can run locally, on a separate server or on a cloud platform. Docker is not required. Prepare a dedicated empty database or schema for the new application. Its account must be able to connect, read and write data, and create and alter tables, indexes and other objects within the application's scope. Network databases must allow access from the application machine.

Obtain these details from your database administrator or cloud provider:

| Information | Purpose |
| --- | --- |
| Host and port | The database address; use the endpoint and port supplied by a cloud service |
| Database name, schema or service name | Where the application stores data; the field depends on the database |
| Username and password | The account assigned to the application |
| TLS requirements | Whether encryption is required and whether a custom CA certificate is needed |

SQLite uses a local file and needs no host, port or account. See [Database support and version compatibility](compatibility.md) for supported versions, feature limitations and commercial driver licensing.

This guide configures the new application's main database. Startup initializes the tables the application needs. To read existing business tables, see [Connect existing databases](../developing-apps/existing-databases.md). Changing connection settings does not migrate application data from another database.

## Create the application project

Prepare Node.js 24 or later and pnpm 11. On Windows, use WSL. Run the following in a POSIX shell such as Bash. After creating the project, do not initialize SQLite yet:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
```

The creation tool generates `my-app` and installs dependencies. NocoBase 3 is in beta; `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` allows newly published packages for this creation command only.

## Install a driver and configure the database

Run the following commands in `my-app`, choosing one database section. `config init --json` generates `config.yml`, application secrets and connection placeholders non-interactively, without attempting a database connection. Fill in connection details and TLS settings before running the connection check.

Each example provides a complete `database` section. After initialization, fill it with your actual connection details while preserving secrets and other configuration. Do not replace the entire `config.yml` with the snippet. Replace `db.example.com`, the port, `my_app`, the account and the password to match your service. Example ports are not deployment requirements.

Keep `config.yml` out of Git. The default template also accepts the process environment variable `DB_PASSWORD` for the main connection password, overriding the file value. Do not write `${DB_PASSWORD}` in YAML: it is not interpolated. See the [Configuration reference](configuration.md) for other override rules.

If `config.yml` already exists, install the required driver and edit the connection section while preserving existing secrets. Driver versions must satisfy the application's dependency requirements; the `@beta` commands below are for a new beta application.

### SQLite

The default template already includes the SQLite driver. Initialize it directly:

```bash
mkdir -p storage
pnpm nocobase config init --dialect sqlite --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: sqlite
      database: database.sqlite
```

Here, `database` is a file path. `database.sqlite` is stored under the application’s `storage/` directory; an absolute path is also accepted. The commands above create the example’s `storage/` directory. If you change the file path, create its parent directory before checking the connection and give the application account write permission. This file holds application data and must survive redeployment.

### PostgreSQL

Prepare a PostgreSQL database and an account authorized to use the target schema:

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: postgres
      host: db.example.com
      port: 5432
      database: my_app
      schema: public
      username: app_user
      password: "replace-with-your-password"
      ssl: true
```

`database` is the database name. Use `public` for `schema`, or a schema your administrator has prepared and authorized. The example enables TLS; use `ssl: false` for a service without TLS. For a custom CA, change `ssl` to an object and put the PEM certificate contents in `ssl.ca`, not a certificate file path.

### MySQL and MariaDB

MySQL and MariaDB share the driver and the `mysql` dialect:

```bash
pnpm add @nocobase/db-mysql@beta
pnpm nocobase config init --dialect mysql --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: mysql
      host: db.example.com
      port: 3306
      database: my_app
      username: app_user
      password: "replace-with-your-password"
      charset: utf8mb4
      ssl: true
```

The database must already exist and support the character set your application needs. The example connection uses `utf8mb4`. TLS is enabled; use `ssl: false` for a service without TLS, or supply a custom CA as PEM contents in `ssl.ca`. For MariaDB, keep `dialect: mysql`; do not change it to `mariadb`.

### Microsoft SQL Server

Prepare a database and a SQL login authorized to access it, read and write data, and manage its schema:

```bash
pnpm add @nocobase/db-mssql@beta
pnpm nocobase config init --dialect mssql --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: mssql
      host: db.example.com
      port: 1433
      database: my_app
      username: app_user
      password: "replace-with-your-password"
      encrypt: true
      trustServerCertificate: false
```

`database` is the database name. For a named instance, supply a reachable host and TCP port as well. The example encrypts the connection and validates the server certificate. For a local test server with a self-signed certificate, `trustServerCertificate: true` can be used when required by the test setup; it skips server certificate validation. Use a verifiable certificate in production.

### Oracle Database

Prepare the Oracle service name and an application user with the required schema permissions and tablespace quota:

```bash
pnpm add @nocobase/db-oracle@beta
pnpm nocobase config init --dialect oracle --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: oracle
      host: db.example.com
      port: 1521
      serviceName: APPPDB
      username: app_user
      password: "replace-with-your-password"
```

Set `serviceName` to the service supplied by the administrator, such as the service of the target PDB. It is not a SID or a regular database name. Replace the example `APPPDB`. Application objects use the account’s schema; do not substitute MySQL’s `database` field.

### Dameng

The Dameng driver requires a NocoBase Pro commercial license and Pro registry access. Configure registry authentication first. The driver is experimental; verify it against the target database version before use. For registry login steps, see [Commercial database drivers](compatibility.md#commercial-database-drivers).

```bash
pnpm add @nocobase/db-dameng@beta
pnpm nocobase config init --dialect dameng --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: dameng
      host: db.example.com
      port: 5236
      schema: APP_USER
      username: APP_USER
      password: "replace-with-your-password"
```

Use the assigned schema name in `schema`, preserving its case. The example uses `APP_USER` for both account and schema. Initialization does not generate a `database` field; do not put the schema name in that field.

### KingbaseES

Confirm the server uses PostgreSQL-compatible mode (`DB_MODE=pg`) and prepare the database and schema. Installation requires a NocoBase Pro commercial license and authentication for the Pro registry. For registry login steps, see [Commercial database drivers](compatibility.md#commercial-database-drivers).

```bash
pnpm add @nocobase/db-kingbase@beta
pnpm nocobase config init --dialect kingbase --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: kingbase
      host: db.example.com
      port: 54321
      database: my_app
      schema: public
      username: app_user
      password: "replace-with-your-password"
      ssl: true
```

Set `schema` to an authorized schema. TLS follows the PostgreSQL configuration: the example enables it; use `ssl: false` when TLS is not used, or PEM contents in `ssl.ca` for a custom CA. Even in PostgreSQL-compatible mode, install the KingbaseES driver and use `dialect: kingbase`.

### OceanBase

Use an OceanBase CE MySQL-compatible tenant and prepare a database and account within that tenant. Installation requires a NocoBase Pro commercial license and authentication for the Pro registry. For registry login steps, see [Commercial database drivers](compatibility.md#commercial-database-drivers).

```bash
pnpm add @nocobase/db-oceanbase@beta
pnpm nocobase config init --dialect oceanbase --json
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: oceanbase
      host: db.example.com
      port: 2881
      database: my_app
      username: app_user
      password: "replace-with-your-password"
      charset: utf8mb4
      ssl: true
```

Use the actual connection host and port. When connecting through a proxy, use its endpoint rather than assuming the example’s direct connection port. Use the full username supplied by the administrator, including any tenant information required for the connection. Match TLS to the service: the example enables it; use `ssl: false` when TLS is not used, or `ssl.ca` for a custom CA. See [Database support and version compatibility](compatibility.md) for differences such as TEXT defaults.

## Check the connection and start the application

Save `config.yml`, check the connection, and start the application only after the check passes:

```bash
pnpm nocobase config check --connect
pnpm dev
```

`--connect` checks every database connection, including SQLite. A successful check reports the `main` connection. If it fails, follow the terminal guidance and check again. The check does not run migrations or replace functional verification after startup.

On first startup, the application runs pending migrations and required initialization. When the terminal prints a `Local:` URL, open the full address, including its application path, such as `/main/`. Follow the [sign-in instructions](../../getting-started/develop-your-first-app.md#create-and-start-the-application). Reaching the application home page with no initialization errors in the terminal confirms that the application has started. Keep the terminal running.

## Common connection problems

| Symptom | What to check |
| --- | --- |
| Missing database driver | Install the corresponding package in the application project. For commercial drivers, check licensing and private registry authentication. Rebuild deployment packages |
| Connection timeout or refusal | From the application machine, check the host, port, database listening address, firewall and cloud service access allowlist |
| Invalid username or password | Check credentials and allowed source addresses. For OceanBase, also check the tenant and full username |
| Missing database, schema or service | Confirm the database exists and schema permissions are granted. For Oracle, check `serviceName` |
| TLS or certificate error | Check encryption requirements, hostname and CA trust, using the fields for the selected database |
| Connection check passes but startup migration fails | Inspect the first migration error and permissions to create or alter tables and indexes. For Oracle, also check tablespace quota |
| File edits still connect to the old database | Check whether `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_DATABASE` or other environment variables override the file |
| SQLite cannot open the file | Check the actual path, containing directory and write permissions of the application account |

If the application has already initialized another database, preserve that database and its secrets and plan a data migration separately. Running `config init` again does not move existing data.
