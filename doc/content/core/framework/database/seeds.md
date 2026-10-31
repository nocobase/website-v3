---
title: Seed data
description: Install defaults with defineSeed, handling existing records, configuration, optional samples, history and retries.
---

Seeds install initial records an application or plugin needs, such as default states and categories. Schema changes and upgrade backfills belong in [Migrations](migrations.md); business services handle everyday records such as user-created orders.

## Define a Seed

This uses `orderStatuses` from [Tables and fields](schema.md), with `code` as its primary key and `title` as its display name. Save it as `202611040010_default_order_statuses.ts` in the application's or plugin's Seed directory:

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040010_default_order_statuses',
  async run(context) {
    const statuses = context.repository('orderStatuses');
    for (const values of [
      { code: 'draft', title: 'Draft' },
      { code: 'paid', title: 'Paid' },
    ]) {
      if (await statuses.findOne({ filter: { code: values.code } })) continue;
      await statuses.createOne({ values });
    }
  },
});
```

`defineSeed()` defines the task; the runner calls `run(context)` when executing it. Default-export the definition with a `name` matching the filename and unique across all Seed sources on the connection. Optional settings are `transaction` and `sample`; there is no `down()`, `shouldRun()` or repeatable execution mode.

After the first run, `draft` and `paid` exist, preserving names of any existing statuses. Migrations must create the required schema first.

## Use Seed Context

`run()` receives these members:

| Member | Purpose |
| --- | --- |
| `repository(name)` | Install Collection records with field codecs and relation writes |
| `query` | Operations Repository cannot express well, such as reading a physical table without a Collection |
| `connection` | Connection name, dialect, capabilities and low-level `client()` |
| `config` | Read initialization configuration through `get()` |
| `container` | Services the runner permits |

Seeds have no `builder`; add new tables or fields in a migration first. `repository()` and `query` are bound to the task connection and, when enabled, its transaction. Do not obtain a different Repository from an external manager for writes.

`connection` is restricted: it offers neither `connection.repository()` nor a way to start the task transaction yourself. `config` and `container` have the same application-level boundaries as [Migration Context](migrations.md#read-configuration-and-permitted-services). Context Repository writes emit no runtime mutation events.

## Add missing records or update existing ones

Decide which fields initialization owns. The first example only fills missing records and preserves user edits. If the application explicitly requires restoring a system status's fixed title, use:

```ts
await context.repository('orderStatuses').upsertOne({
  filter: { code: 'draft' },
  create: { code: 'draft', title: 'Draft' },
  update: { title: 'Draft' },
});
```

`create` handles a missing record; `update` handles an existing one. This changes an existing title back to `Draft`, so it is unsuitable for administrator-customizable names. Add a new Seed for a later version's data change instead of editing a successful file.

Successful history makes ordinary startup skip a Seed. Business idempotency prevents repeated input from producing duplicate records. Neither replaces the other. Back stable business keys with database uniqueness. Checking before inserting does not eliminate concurrent races; let conflicts fail the task, investigate, then retry rather than swallowing unrelated errors.

## Read initialization configuration

Read and validate configurable defaults inside `run(context)`. This replaces the fixed `Draft` title:

```ts
const title = context.config.get<unknown>('orders.initialDraftTitle') ?? 'Draft';
if (typeof title !== 'string' || title.trim().length === 0 || title.length > 100) {
  throw new Error('orders.initialDraftTitle must be a non-empty string of up to 100 characters.');
}
const statuses = context.repository('orderStatuses');
if (!(await statuses.findOne({ filter: { code: 'draft' } }))) {
  await statuses.createOne({ values: { code: 'draft', title } });
}
```

`orders.initialDraftTitle` is an application-owned example key. Declare it in application [configuration](../../developing-apps/configuration-and-settings.md) when needed; otherwise the example uses `Draft`. The type parameter to `config.get<T>()` does not validate the value.

Changing configuration after initialization neither reruns the Seed nor resets user edits. Settings that remain editable need a business administration entry rather than a Seed that overwrites them at every startup.

## Required data and optional samples

Default business statuses are required data. Mark fictional orders used for exploration with `sample: true`. This uses the [order table](schema.md); save it as `202611040011_sample_order.ts`:

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040011_sample_order',
  sample: true,
  async run(context) {
    const orders = context.repository('orders');
    if (await orders.findOne({ filter: { orderNo: 'SAMPLE-001' } })) return;
    await orders.createOne({
      values: {
        orderNo: 'SAMPLE-001',
        status: 'draft',
        amount: '12.50',
        customerId: null,
        createdAt: new Date('2026-10-01T00:00:00Z'),
      },
    });
  },
});
```

Ordinary Seeds are not skipped just because their records look like examples. The application automatically runs sample Seeds only during a fresh connection installation with `app.sampleData: true`: there was no migration or Seed history before execution, or a managed-schema reset just rebuilt it. Otherwise they are recorded as `skipped`; enabling configuration later does not run them automatically. Direct callers of the lower-level Seeder control this with `sample.enabled`.

To load skipped samples from a development application directory:

```bash
pnpm nocobase db sample
```

The command handles skipped sample Seeds and registered sample data services; deployment artifacts refuse it. Samples that need other plugins' business services should use `sampleDataToken` to generate them once the application is ready, rather than trying to expose those services through Seed Context. See [Plugin database resources](../../extension-development/database-and-migrations.md#write-migrations-and-initial-data) for integration.

## History, transactions and retries

Seeds on one connection run in name order, after migrations in the application database plan. The default `transaction: 'auto'` and `true` start a transaction per Seed, committing writes with successful history. Throwing rolls back that transaction so a later run can retry. Earlier completed Seeds are not undone with it.

`transaction: false` can leave partial failed writes. Use it only when required and define recovery. A normal return from `run()`, including an early `return`, records success. Throw for missing required configuration or prerequisites rather than returning and expecting an automatic retry later.

Seeds have no rollback entry, and migration rollback does not clear Seed history. Editing a successful file causes checksum drift without making it execute again. See [Migrations](migrations.md#checksums-and-compiled-artifacts) for shared history, checksum and recovery rules.

## Verify initialization

Use an isolated real database to check empty installation, existing business keys, preservation of user edits and retries. Distinguish two tests: invoking the Seeder again should skip by history; deliberately executing the same `run()` logic again in a controlled test checks its business idempotency.

For failure coverage, throw after writing, verify that neither records nor successful history remain, then remove the failure condition and check that execution succeeds. Test samples enabled, disabled and loaded later instead of merely checking that their modules import. See [Database and CLI tests](../../developing-apps/testing-and-acceptance.md#database-and-cli-tests).

See the [Seed interface](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/seed/types.ts), [runner implementation](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/seed/seeder.ts) and [Seed behavior tests](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db-testkit/tests/integration/seed/seeder.test.ts).
