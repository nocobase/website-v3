---
title: Create tables and initialize data
description: Use defineMigration, defineSeed and their Contexts to create tables, initialize records, and maintain later schema and data changes.
---

An application describes table creation and later schema changes with `defineMigration()`, and installs initial records with `defineSeed()`. Both functions only define tasks; when a task runs, the framework passes its Context to the callback, providing what is needed to create tables, query data and work with records.

This guide first walks through "create a table → initialize data → run and verify" with an independent `appStatuses` table, without needing the historical tutorial. The projects-and-tasks case in the second half keeps its original prerequisites and shows how to change an existing schema.

## Directory and file conventions

```text
database/
└── main/
    ├── migrations/
    │   └── 202611040001_create_app_statuses.ts
    ├── seeds/
    │   └── 202611040002_default_app_statuses.ts
    └── collections/  # Generated; do not edit
```

`main` is the connection name. Migration and Seed files each default-export a task definition whose `name` matches the file name without its extension and is unique across all sources of the same kind of task. When adding tasks to an existing project, use new names that sort after the existing ones. `collections/` is a generated model cache, not the place to write models by hand.

| What you need to do | Use |
| --- | --- |
| Create tables; change fields, relations, indexes and constraints | Migration |
| Transform or backfill historical records with a release | Data operations in a Migration |
| Install initial records such as default statuses or categories | Seed |
| Everyday creation and editing of business records by users | Server business services and APIs |

Note that migrations can change data too; do not think of it as "migrations only create tables and Seeds do all the writing".

## Create a table with defineMigration

Create `database/main/migrations/202611040001_create_app_statuses.ts`:

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040001_create_app_statuses',
  async up({ builder }) {
    await builder.createCollection('appStatuses', (collection) => {
      collection.string('code', { length: 32 }).primary().notNull();
      collection.string('title', { length: 100 }).notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('appStatuses');
  },
});
```

`up()` applies this change, and `down()` describes how to reverse it. `builder.createCollection()` declares the logical collection and its structure, and the framework creates the physical table using the connection's dialect. `code` is a stable business key whose primary key constraint prevents duplicates; `title` holds a display name that can be changed.

This example's `down()` drops the whole table with its records, so only verify the rollback in an isolated database. Published migrations stay unchanged, and later changes are made by adding new files. For options such as `transaction`, `irreversible` and `shouldRun()`, see [Database migrations](../framework/database/migrations.md); a simple table needs none of them up front.

## Use the Migration Context

`up(context)` and `down(context)` receive a `MigrationContext`. The `{ builder }` above simply destructures the member that is needed; when historical data has to be processed, use `query` from the same Context.

| Member | Purpose and limits |
| --- | --- |
| `builder` | Create and adjust collections, fields, indexes and constraints |
| `query` | Read, update and backfill data in a migration; usually the first choice for data operations |
| `repository(name)` | For when Collection field encoding, naming overrides or relation writes are needed; depends on the model shape at execution time |
| `connection` | The current connection's name, dialect, capabilities and low-level client entry; a restricted interface |
| `config` | Read-only configuration provided by whoever runs the task, read with `get()` |
| `container` | A service resolver provided by whoever runs the task; it is not the full application container and does not mean all business services have started |
| `configuration`, `parameters` | Optional applicability configuration and target parameters provided by the source; ordinary application migrations rarely need them |

For example, in the `up({ query })` of a later migration, you can make an explicit data correction to the existing `appStatuses`:

```ts
await query.updateTable('appStatuses')
  .set({ title: 'Draft' })
  .where('code', '=', 'draft')
  .where('title', '=', 'DRAFT')
  .execute();
```

This is a fragment from inside the callback and assumes the target table exists. It only corrects the agreed old value and does not overwrite names users have customized. Data operations in a migration should rely on an explicit historical structure; do not import service implementations that change along with the business code.

The `connection` in the Migration Context is not a full `DatabaseConnection`: you cannot call `connection.repository()` or `connection.builder`, and you cannot call `connection.transaction()` yourself. Use the Context's top-level `builder`, `query` and `repository()` directly and let the runner handle transactions. `client()` is a low-level escape hatch that is rarely needed and must not be used to get around schema management restrictions.

Use `repository()` in a migration only when Query cannot express the operation correctly, and note why; do not make rollback logic depend on a Collection model that has since changed. Whether a transaction is used also depends on the task options and the dialect's capabilities, so do not assume DDL can be rolled back on every database.

## Initialize data with defineSeed

Create `database/main/seeds/202611040002_default_app_statuses.ts`:

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040002_default_app_statuses',
  async run({ repository }) {
    const statuses = repository('appStatuses');
    for (const record of [
      { code: 'draft', title: 'Draft' },
      { code: 'published', title: 'Published' },
    ]) {
      const existing = await statuses.findOne({
        filter: { code: record.code },
        select: (s) => s.fields('code'),
      });
      if (existing) continue;
      await statuses.createOne({ values: record });
    }
  },
});
```

`run()` contains the logic that installs the data. This example only adds missing records and keeps names that administrators have already changed. Querying before inserting does not eliminate concurrency races on its own; the primary key constraint is the final safeguard. On a conflict, let the task fail and roll back, then check and retry. If you need "update when it exists", you can use `upsertOne()`, but you must state explicitly which fields may be overwritten.

A Seed has no rollback function corresponding to a Migration's `down()`, and it is not a synchronization script that overwrites configuration on every startup.

## Use the Seed Context

`run(context)` receives a `SeedContext`. The records being installed are described in Collection terms, so `repository()` is usually the first choice:

| Member | Purpose and limits |
| --- | --- |
| `repository(name)` | Read and write initial records, with logical fields, field encoding and relation writes |
| `query` | Data operations that Repository does not express well, such as accessing a table without a Collection |
| `connection` | The same restricted connection interface as in a Migration, not the full runtime connection |
| `config` | Reads configuration provided by whoever runs the task |
| `container` | Resolves the services the runner chooses to provide; empty when a standalone runner provides none |

The Seed Context has no `builder`; when you need a new table or field, write a migration first. `repository()` and `query` are already bound to the task's connection, and use the current transaction when one is enabled. Do not obtain another Repository from an outside manager to write data, or the writes may escape the task's transaction.

Repository writes through either Context do not emit runtime Repository change events. Installation and upgrades must not rely on business listeners that have not started yet to complete data.

## Run and verify

After confirming that the configuration points to the local example database, run in the application root:

```bash
pnpm nocobase db apply --connection main --dry-run
pnpm nocobase db apply --connection main
pnpm nocobase collections generate --connection main --check
```

`db apply` runs pending migrations first and then Seeds, which may include resources from other applications or plugins; `--dry-run` only previews the plan. Tasks that already succeeded are skipped according to their history, and changing a file that already ran does not make it run again. The default transaction mode for Seeds is `auto`: on failure, this run's writes and its success records roll back together, and you can continue after fixing the problem.

Verify the following: the first run creates the table and writes the two default records; running again writes no duplicates; custom records that existed before initialization keep their names; and a Seed that throws after writing rolls back and can be retried. Verify migration rollback in an isolated database; DDL, isolation and locking behavior on the target database need tests on the matching dialect.

## Change existing schemas and data

Published tasks stay immutable, and changes to fields, constraints and historical data are expressed through new migrations. Backfill old data before tightening a non-null constraint; user choices that must persist must not be overwritten repeatedly by a Seed. When new installation defaults are needed, add a later Seed.

Keep demonstration data separate from required data. An ordinary Seed is not skipped automatically just because its records are demonstrations; for optional sample data, declare `sample: true` explicitly and load it through the application's sample-data configuration and runner, as described in [Seed data](../framework/database/seeds.md). Test fixtures, routine imports and environment resets do not belong in the ordinary initialization flow.

For adding database connections, see [Multiple database connections](multiple-databases.md); for schemas maintained by an external system, see [Connect an existing database](existing-databases.md); for business transactions, see [Transactions and data consistency](transactions-and-consistency.md); and for the full migration options, see [Database migrations](../framework/database/migrations.md).

## Advanced example: add projects to tasks

The original project case below demonstrates fields, relations, constraints and preserving old data. It is a separate historical application and has no dependency on the `appStatuses` example above.

### Structure, initial data and business records

| What you need to do | Where it goes | Principle |
| --- | --- | --- |
| Add fields, relations, indexes or constraints | `database/main/migrations/` | Add a migration and state its effect on old data |
| Backfill historical data with a release | A migration | Define the transformation explicitly instead of guessing business assignments |
| Write initial data the application needs to run | `database/main/seeds/` | Keep it apart from records users create every day, and do not overwrite user changes repeatedly |
| Provide optional demonstration data | A Seed marked as sample | Let whoever runs it choose explicitly whether to load it |
| Create or change everyday business records | Business services and APIs | Validate input and permissions first, then read and write through a Repository |
| Inspect the resolved Collections | `database/main/collections/` | Generated and checked by tooling; do not edit by hand |

Project names are business data entered by users, so this example adds no project Seed. Likewise, business roles must not be assigned automatically to every signed-in user just to make the example usable.

### Questions to answer before designing fields and relations

First work out: are "required" and "unique" really business rules? Can historical records satisfy the new rules? What should happen when a related record is deleted? Only then choose fields and constraints. Do not decide the database structure just from what the form currently looks like.

For example, "a project name is required" does not mean names must be unique, and "tasks can belong to a project" does not mean old tasks must have a project right away. A database foreign key keeps references valid, API validation enforces input rules such as the name's content, and permission checks decide whether the current user may use the project. None of these checks can replace another.

### Prepare the example application

The project guides reuse a separate historical example: `tutorialTasks` stores tasks, `tutorialProjects` stores projects, and tasks use `completed` for their completion state. The current [getting-started example](../tutorials/build-your-first-app.md) uses a `tasks` table with a three-stage `status`; the two are not the same code. When running this guide, use the old tag and matching configuration given below, and do not apply these migrations to the getting-started example's database.

<details>
<summary>Get and configure this guide's example application</summary>

This guide continues from [the `04-task-due-date` stage of app-tutorials](https://github.com/nocobase/app-tutorials/tree/04-task-due-date), based on default template `1.0.0-beta.78`. The repository is private and requires access. Readers who have finished that stage can continue in their existing project; to start from scratch, get that stage's code in a new directory:

```bash
git clone --branch 04-task-due-date https://github.com/nocobase/app-tutorials.git team-tasks
cd team-tasks
git switch -c feat/task-projects
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
```

Use Node.js 24 and pnpm 11. An existing project does not need its configuration initialized again, and an existing database must not be connected to older code. All code and commands below are used in the application root; the database verified in this guide is SQLite.

</details>

### Example: the relation between projects and tasks

This change introduces only a minimal project model:

- `tutorialProjects.id`: the project ID, a string primary key consistent with the existing task ID type.
- `tutorialProjects.name`: the project name, required, at most 120 characters; different projects may share a name.
- `tutorialProjects.createdAt`: the creation time, supplied by the business code that creates the project.
- `tutorialTasks.projectId`: a nullable project ID. A project can have many tasks, and a task belongs to at most one project.

Tasks store the project ID and obtain the project name when reading. That way, renaming a project does not require updating tasks one by one, and projects with the same name never confuse assignments.

Old tasks have no reliable project assignment, so the new field starts out nullable, meaning "not assigned to a project yet". The migration does not guess assignments, nor does it create a default project to receive all historical tasks. This example refuses to delete a project that tasks still reference; in business terms, tasks can be moved or unlinked first, and then the project deleted.

### With an Agent

In the application directory, give this guide to the Agent as context, then describe the request below. The specific conventions for fields, APIs and components are in the manual steps that follow, and the Agent applies them together with the project guidance.

```text
Please add projects to the existing task application. For this step, implement data storage only, without pages or APIs.

Each project needs a required name and a creation time.
A project can contain many tasks. Each task belongs to at most one project, or none.
Preserve old tasks and leave them without a project for now.

Tasks cannot refer to nonexistent projects, and a project that still has tasks cannot be deleted.
When reading a task, we should also be able to obtain its project information.
Follow the project's data-change guidance without clearing the database or rewriting previously applied changes.

Use separate test data to verify these rules and that old tasks still work.
Explain what data would be lost by undoing this change, and test undoing and reapplying only in a test environment.
Do not add sample projects or change user permissions in this step.
Tell me what changed and what you verified.
```

When checking the Agent's result, look beyond the new table and field: check that existing data was preserved, that the constraints really take effect, and that the tests use a real database. You can compare the result with the implementation below.

### Without an Agent

#### Write a self-contained migration

Create `database/main/migrations/202610240004_add_task_projects.ts`:

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610240004_add_task_projects',
  async up({ builder }) {
    await builder.createCollection('tutorialProjects', (collection) => {
      collection.string('id', {
        length: 36,
        primaryKey: true,
        nullable: false,
      });
      collection.string('name', { length: 120, nullable: false });
      collection.datetime('createdAt', { nullable: false });
    });
    await builder.alterCollection('tutorialTasks', (collection) => {
      collection.string('projectId', { length: 36, nullable: true });
      collection.foreignKey('projectId', {
        name: 'fk_tutorial_tasks_project',
        references: { collection: 'tutorialProjects', fields: ['id'] },
        onDelete: 'restrict',
      });
      collection.index('projectId', { name: 'idx_tutorial_tasks_project' });
    });
    await builder.addField('tutorialTasks', {
      name: 'project',
      type: 'belongsTo',
      target: 'tutorialProjects',
      targetKey: 'id',
      foreignKey: 'projectId',
      constraints: false,
    });
  },
  async down({ builder }) {
    await builder.dropField('tutorialTasks', 'project');
    await builder.dropConstraint('tutorialTasks', 'fk_tutorial_tasks_project');
    await builder.dropIndex('tutorialTasks', 'idx_tutorial_tasks_project');
    await builder.dropField('tutorialTasks', 'projectId');
    await builder.dropCollection('tutorialProjects');
  },
});
```

The file name without `.ts` matches `name` and sorts after the existing task migrations. The tables, fields and constraints are written directly in the migration, not imported from business services or model files that keep evolving.

`up()` creates the project table first, then extends the task table. `down()` removes things in reverse dependency order: the tasks' original fields and records stay, but project data and the tasks' project assignments are deleted. It is only the structural inverse, not a backup for restoring business data.

#### Tell fields, relations and constraints apart

This migration defines three parts for one business relationship:

- **The `projectId` field**: the project ID actually stored in the task table. `nullable: true` keeps old tasks and new tasks not yet assigned to a project valid.
- **The `project` relation**: tells Repository how to read the project from a task. `foreignKey` points to the existing field above, and `targetKey` points to the project's primary key. It does not store another copy of the project name.
- **The foreign key constraint**: the database guarantees that a non-null `projectId` points to an existing project, and `onDelete: 'restrict'` refuses to delete a project that is still referenced.

Because the foreign key is created and named explicitly here, the relation declaration uses `constraints: false` to avoid creating the constraint twice; it does not mean the database has no foreign key. The explicit name also lets `down()` remove exactly this constraint.

The plain index on `projectId` serves later filtering of tasks by project. There is no unique index, because one project can have many tasks. The index serves queries and the foreign key keeps references valid; each has its own job.

Field declarations do not replace API input validation either. For example, `nullable: false` does not reject a blank name, and databases may handle string lengths differently; the API must still check the trimmed name and its length.

#### Apply the migration and generate Collections

First confirm which database the current application configuration points to, then run:

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

For a database that has run the previous stage, the plan should contain this new migration; for a new database, the plan also contains application migrations, plugin migrations and Seeds that have not run yet. `db apply` runs pending migrations first and pending Seeds second, and does not handle only the file you just added.

Running the same commands again does not re-run migrations that already succeeded. Tasks in an existing database keep their titles, completion states, assignees and due dates, and the new `projectId` is `null`.

The commands refresh the model snapshots under `database/main/collections/`, which you can inspect:

```text
database/main/collections/
├── tutorialProjects/
│   ├── collection.json
│   ├── metadata.json
│   └── schema.json
└── tutorialTasks/
    ├── collection.json
    ├── metadata.json
    └── schema.json
```

These files show the model the database actually resolves and are a cache that can be regenerated. Do not edit them by hand, and do not import them in migrations. Check that the cache matches the database:

```bash
pnpm nocobase collections generate --check
```

### Verify with a real database

Add `tests/database/tutorial-tasks-projects.test.ts`. The test below first applies the earlier migrations and inserts an old task, then applies this migration, checks the model and data, and finally rolls back and applies again. `describeMigration()` manages an isolated database and its cleanup, and never touches your development database.

<details>
<summary>Complete migration test</summary>

```ts
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';
import { describeMigration } from '@nocobase/app-testing/server';
import metadata from '../../package.json' with { type: 'json' };

describeMigration('202610240004_add_task_projects', {
  sources: [
    {
      packageName: metadata.name,
      directory: fileURLToPath(
        new URL('../../database/main/migrations/', import.meta.url),
      ),
    },
  ],
  before: async ({ connection }) => {
    await connection.repository('tutorialTasks').createOne({
      values: {
        id: 'existing-task',
        title: 'Prepare the launch checklist',
        completed: true,
        assigneeId: 'existing-assignee',
        dueDate: '2026-11-01',
        updatedAt: new Date('2026-10-24T00:00:00Z'),
      },
    });
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('tutorialProjects').toHaveField('name', {
      type: 'string',
      nullable: false,
    });
    await expectCollection('tutorialTasks').toHaveField('projectId', {
      type: 'string',
      nullable: true,
    });
    await expectCollection('tutorialTasks').toHaveIndex(['projectId']);
    await expectCollection('tutorialTasks').toHaveForeignKey(
      ['projectId'],
      'tutorialProjects',
      { referencedFields: ['id'], onDelete: 'restrict' },
    );
    const tasks = connection.repository('tutorialTasks');
    expect(
      await tasks.findOne({ filter: { id: 'existing-task' } }),
    ).toMatchObject({
      title: 'Prepare the launch checklist',
      completed: true,
      assigneeId: 'existing-assignee',
      dueDate: '2026-11-01',
      projectId: null,
    });
    const projects = connection.repository('tutorialProjects');
    await projects.createOne({
      values: {
        id: 'launch-project',
        name: 'Product launch',
        createdAt: new Date('2026-10-24T00:00:00Z'),
      },
    });
    await tasks.updateOne({
      filter: { id: 'existing-task' },
      values: { projectId: 'launch-project' },
    });
    expect(
      await tasks.findOne({
        filter: { id: 'existing-task' },
        select: (s) =>
          s
            .fields('id', 'projectId')
            .include('project', (p) => p.fields('id', 'name')),
      }),
    ).toMatchObject({
      project: { id: 'launch-project', name: 'Product launch' },
    });
    await expect(
      tasks.updateOne({
        filter: { id: 'existing-task' },
        values: { projectId: 'missing-project' },
      }),
    ).rejects.toThrow();
    await expect(
      projects.deleteOne({ filter: { id: 'launch-project' } }),
    ).rejects.toThrow();
    expect(
      await tasks.findOne({ filter: { id: 'existing-task' } }),
    ).toMatchObject({
      projectId: 'launch-project',
    });
  },
  down: async ({ connection, expectCollection }) => {
    await expectCollection('tutorialProjects').not.toExist();
    await expectCollection('tutorialTasks').not.toHaveField('projectId');
    const collection = await connection.collections.get('tutorialTasks');
    expect(collection?.fields.some((field) => field.name === 'project')).toBe(
      false,
    );
    expect(
      await connection
        .repository('tutorialTasks')
        .findOne({ filter: { id: 'existing-task' } }),
    ).toMatchObject({
      title: 'Prepare the launch checklist',
      completed: true,
      assigneeId: 'existing-assignee',
      dueDate: '2026-11-01',
    });
  },
});
```

</details>

Run this guide's test, then the existing task database and API tests:

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/database/tutorial-tasks-projects.test.ts
pnpm exec vitest run --config vitest.tutorial.config.ts
```

This guide's test must appear in the results; "no tests found" does not count as passing. The tests verify that:

- After the upgrade, old tasks keep their business fields and `projectId` is empty.
- The index and foreign key really exist, and a task can be linked to a project and read the project name through Repository.
- A project ID that does not exist is rejected, a project still referenced by tasks cannot be deleted, and the original association survives the failures.
- Rolling back removes the new model while keeping the original tasks, after which the migration can be applied again.

`repository()` is used directly in the test to verify against an isolated database. Real APIs must check the caller's permissions first and then use a Repository with the corresponding policy; a foreign key only proves the project exists, not that the current user may access or choose it.

### When the model keeps evolving

**Migrations that have been merged or published stay unchanged.** To add a field, change a constraint or fix a historical migration, add another migration. Editing a file that already ran does not make `db apply` run it again, and resetting the database cannot verify whether a real upgrade preserves data.

If every task must later have a project, first decide the assignment for old tasks, backfill the data and verify there are no empty values, then make the field non-null in a later migration. Backfilling existing data is a migration's job; do not use a Seed to overwrite tasks users have changed again and again.

Seeds are for initial data the application needs to run. The projects in this guide are business records created by users, so no Seed is added. For organizing initial data and its execution history, see [Initialize data with defineSeed](#initialize-data-with-defineseed) above; for the limits of demonstration data, see [Seed data](../framework/database/seeds.md). Do not assume ordinary Seeds are skipped automatically by environment.

### Continue reading

[Routes and HTTP APIs](apis-and-services.md) explains how to expose data operations to pages: validate input, check permissions on both projects and tasks, and turn business errors into consistent API errors. [Application development overview](overview.md) shows how these parts fit together.

Migrations and initial data are maintained per connection; for adding connections, see [Multiple database connections](multiple-databases.md). When an existing schema is managed by another system, follow the process in [Connect an existing database](existing-databases.md) and keep the handwritten `metadata/` separate from the generated `collections/`.
