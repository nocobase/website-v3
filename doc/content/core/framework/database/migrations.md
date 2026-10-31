---
title: Database migrations
description: Define migrations, change schema and historical data through Migration Context, and understand ordering, transactions, rollback and checksums.
---

A Migration records a fixed schema or historical data change. Applications and plugins use the same `defineMigration()` API. For file locations and integration, see [Create tables and initialize data](../../developing-apps/data-models-and-migrations.md) and [Plugin database resources](../../extension-development/database-and-migrations.md).

## Define a migration

Save this migration, which adds a note to an existing `orders` Collection, as `202611040010_add_order_note.ts`:

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040010_add_order_note',
  async up({ builder }) {
    await builder.alterCollection('orders', (c) => {
      c.text('note').nullable();
    });
  },
  async down({ builder }) {
    await builder.dropField('orders', 'note');
  },
});
```

`defineMigration()` marks and returns the definition without executing it. The loader requires that return value as the default export, with `name` matching the filename without its extension. Separate named `up`/`down` exports or a plain object are not accepted.

| Option | Purpose |
| --- | --- |
| `name` | Unique across migration sources on the connection; determines ordering |
| `up(context)` | Required implementation of the change |
| `down(context)` | Reverse operation; dropping a field or table also loses its data |
| `irreversible` | Set to `true` when no reliable reversal exists; cannot coexist with `down` |
| `transaction` | `true`, `false`, or the default `'auto'` |
| `shouldRun(context)` | Boolean applicability check before a pending migration runs |

Provide either `down()` or `irreversible: true`. Keep migrations self-contained with deterministic fields, indexes and constraints, rather than importing evolving models, services or shared schema definitions.

## Use Migration Context

`up()`, `down()` and `shouldRun()` receive `MigrationContext`. Destructure the members the task needs:

| Member | Purpose and boundary |
| --- | --- |
| `builder` | Schema and model metadata changes; see [Tables and fields](schema.md) |
| `query` | Row reads and set-based corrections; the normal migration data tool |
| `repository(name)` | Collection codecs, Collection naming overrides and relation writes |
| `connection` | Connection `name`, `driver`, `dialect`, `capabilities` and low-level `client()` |
| `config` | Read-only configuration through `get()` |
| `container` | A restricted service resolver supplied by the task owner |
| `configuration`, `parameters` | Optional applicability settings and fixed target parameters from the source |

`connection` is not a full runtime connection. It has no `repository()`, `builder`, `transaction()` or transaction callbacks. Use the Context's top-level tools so the runner binds them to the task connection and transaction. Taking a Repository from an external DatabaseManager can write outside that transaction.

Migration `repository()` resolves the model as it exists at execution time. Use it only when Query cannot correctly express the operation, and explain why in a code comment. Do not depend on it in `down()`, or read and update an entire table row by row through Repository. Context Repository writes in migrations and Seeds do not emit runtime Repository mutation events; installation must not depend on business listeners completing records.

## Backfill and transform historical data

Correct legacy values in a new migration. This changes only the old spelling and preserves other states:

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040011_normalize_order_status',
  irreversible: true,
  async up({ query }) {
    await query.updateTable('orders')
      .set({ status: 'draft' })
      .where('status', '=', 'DRAFT')
      .execute();
  },
});
```

After execution, `DRAFT` becomes `draft`; other records stay unchanged. Records already set to `draft` cannot be distinguished from converted ones, so the example is explicitly irreversible. If restoration is required, preserve enough original data when designing the change rather than pretending that an opposite bulk update restores it.

Query uses connection naming but not Collection-specific codecs or relation writes. Use it for ordinary conditional updates and Context Repository only where those semantics are required. `updateTable()` and `deleteFrom()` require a condition; use explicit `allowAllRows()` only for an intentional whole-table operation.

For a new required field, first add it as nullable, backfill existing records using an explicit rule, verify the result, then make it non-null. An empty database has no historical rows to transform but should reach the same schema. Do not depend on a Seed that has not yet run in the same execution.

## Read configuration and permitted services

`config.get<T>(key)` reads configuration supplied by the runner and returns `undefined` for a missing key. The generic does no runtime validation. For example, read the configured initial administrator name:

```ts
const username = config.get<string>('users.initialAdmin.username');
```

Application startup and database commands supply a configuration snapshot; standalone database runners default to an empty reader unless configured. Configuration is not part of migration identity, and rollback receives the configuration available at that later time. Do not derive schema or its inverse from mutable settings.

The application-level `container` currently permits only `idGeneratorToken`, for data operations that need a new identifier:

```ts
import { idGeneratorToken } from '@nocobase/app-server/id-generator';

// Inside a callback that receives container:
const id = container.resolve(idGeneratorToken).generateString();
```

This is not the full application container: DatabaseManager and arbitrary business services cannot be resolved. Standalone callers must supply required services. A generated ID also does not replace the stable business key a Seed uses to recognize existing records.

## Conditional execution

Use `shouldRun()` when a migration applies only to an optional Collection. This is the optional-Collection version of the earlier status correction; choose the version appropriate to the application:

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040012_normalize_optional_order_status',
  irreversible: true,
  async shouldRun({ builder }) {
    return builder.hasCollection('orders');
  },
  async up({ query }) {
    await query.updateTable('orders')
      .set({ status: 'draft' })
      .where('status', '=', 'DRAFT')
      .execute();
  },
});
```

The condition runs under the migration lock before the task transaction starts, and should only inspect state. Returning `false` records no successful history, so a later run checks again. Returning `true` allows `up()` to run. Throwing or returning a non-boolean fails the run. Once successful, the migration is skipped by history without rechecking the condition.

Do not use a condition to hide missing required schema. `db apply --dry-run` does not call it, so a migration listed in a preview may not execute.

Use source `parameters` only when applying the same migration source to different fixed targets. Distinct parameter sets have distinct history identities; `configuration` does not affect identity. Ordinary application and plugin migrations need neither. See [MigrationSource](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/migration/types.ts) for the interface.

## Execution order, history and transactions

Application and plugin migrations on one connection are merged, checked for duplicate names and sorted by name. Plugin registration order is not migration order. Only migrations without successful history run; those applied in one run share a new batch number. Each task has its own transaction, not one transaction for the entire batch.

Currently, both `transaction: 'auto'` and `true` enter a connection transaction, with `up()` and its successful history write inside it. `false` creates no task transaction; failure can leave partial work without a success record. Even with transactions enabled, not every dialect can roll back DDL.

Execution stops on failure, retaining earlier completed migrations. A later run skips those and retries unfinished work. The migration lock serializes runners using the same lock protocol; it provides neither cross-connection atomicity nor business uniqueness. See [CLI reference](../../reference/cli.md) for connection selection and flags.

## Rollback and irreversible changes

`db rollback` handles the entire latest batch, calling `down()` in reverse execution order and removing its migration history. The batch can contain application and plugin migrations. The runner validates the whole batch before starting; any irreversible migration prevents rollback from beginning.

Preview on an isolated database where rollback is acceptable:

```bash
pnpm nocobase db rollback --dry-run
```

After checking the scope, run without `--dry-run`. An interactive terminal asks for confirmation; non-interactive execution requires explicit `--force`. Rollback also uses per-task transactions rather than one atomic batch transaction.

Seeds have no `down()`, and migration rollback does not clear Seed history. `db redo` rolls back, then applies pending migrations and Seeds, so recreating a table does not mean successful Seeds reinstall its records. `db reset` instead removes managed schema and history and installs from empty without calling `down()`. Use it only for deliberately disposable data, never as an upgrade test or backup restore.

## Checksums and compiled artifacts

Once merged or released, preserve migration contents, names and filenames. Even formatting or comment edits change checksums. Add a later-sorting migration for subsequent corrections.

Changed executed files produce a warning by default; `onChecksumMismatch: 'error'` can refuse execution. `db repair` only aligns recorded checksums with the current files. It neither runs migrations nor fixes schema or makes tasks pending again. Consider it only after confirming the database already matches the current source semantics. Use `db redo` while developing an unmerged migration; released changes still require a new migration.

Standard builds generate `.manifest.json` after compiling migrations and Seeds, preserving source checksums while verifying emitted artifacts. Keep the existing build steps and manifests. Rebuild missing or mismatched artifacts instead of editing history or manifests manually. See [Build and deliver database resources](../../extension-development/database-and-migrations.md#build-and-deliver-database-resources) for plugins.

## Verify migrations

Applications and plugins import `describeMigration()` from `@nocobase/app-testing/server` and supply real migration sources. Prepare historical data in `before`, check changed schema and records in `up`, and check data after reversal in `down`. Set `reversible: false` for an irreversible migration.

The helper checks physical schema and metadata consistency, plus rollback and reapplication for reversible migrations. Write the business assertions yourself, especially preservation of existing records, backfill conditions, invalid references and deletion effects. See [Database and CLI tests](../../developing-apps/testing-and-acceptance.md#database-and-cli-tests).

[View the runner implementation](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/migration/migrator.ts) and [migration behavior tests](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db-testkit/tests/integration/migration/migrator.test.ts).
