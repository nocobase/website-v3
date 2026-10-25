---
title: Data models and migrations
description: Manage fields, relations and constraints through migrations, and distinguish schema changes, initial data and generated Collection files.
---

A data model defines what an application stores and which rules the database must enforce. NocoBase applications record schema changes in migrations and access data through Repositories. `database/main/collections/` contains generated model snapshots, not handwritten model definitions.

This guide uses an optional project relationship on tasks to explain fields, relations, constraints and changes to existing data. Read the conventions directly; prepare the example application below when you want to run the code.

## Structure, initial data and business records

| Task | Location | Principle |
| --- | --- | --- |
| Add fields, relations, indexes or constraints | `database/main/migrations/` | Add a migration and describe its effect on old data |
| Backfill historical data with a release | A migration | Define the transformation rather than guessing business assignments |
| Supply initial data required by the application | `database/main/seeds/` | Separate it from everyday records and do not repeatedly overwrite user changes |
| Supply optional demonstration data | A seed marked as sample | Let the operator explicitly choose whether to load it |
| Create or change everyday business records | Business services and endpoints | Validate input and permissions, then use a Repository |
| Inspect resolved Collections | `database/main/collections/` | Generate and check them with tooling; do not edit by hand |

Project names are user-created business data, so this example adds no project seed. Do not automatically assign business roles to every signed-in user just to make an example usable.

## Questions to answer before defining fields

Decide whether required and unique values are business rules, whether historical records can satisfy new rules, and what should happen when a related record is deleted. The current form layout alone does not determine the database structure.

A required project name need not be unique. Allowing tasks to belong to projects does not require assigning every old task immediately. Foreign keys enforce valid references, endpoint validation checks input such as name content, and authorization determines whether this user may use the project. These checks cannot replace one another.

## Prepare the example application

The project chapters use a separate historical example: `tutorialTasks` stores tasks, `tutorialProjects` stores projects, and `completed` represents task completion. The current [getting-started example](../tutorials/build-your-first-feature.md) uses `tasks` and a three-stage `status`. Use the historical tag and matching configuration below for this exercise; do not apply these migrations directly to the getting-started database.

<details>
<summary>Obtain and configure the example application</summary>

Continue from [the `04-task-due-date` stage of app-tutorials](https://github.com/nocobase/app-tutorials/tree/04-task-due-date), based on default template `1.0.0-beta.78`. The repository is private and requires access. If you already completed that stage, continue in your existing project. Otherwise, obtain it in a new directory:

```bash
git clone --branch 04-task-due-date https://github.com/nocobase/app-tutorials.git team-tasks
cd team-tasks
git switch -c feat/task-projects
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
```

Use Node.js 24 and pnpm 11. An existing project does not need its configuration initialized again; do not connect an existing database to older application code. Run the commands and create the files below from the application root. This chapter was verified with SQLite.

</details>

## Example: projects and tasks

Start with a small project model:

- `tutorialProjects.id`: a string primary key, consistent with the existing task ID type.
- `tutorialProjects.name`: a required name of up to 120 characters. Different projects may share a name.
- `tutorialProjects.createdAt`: the creation time, supplied by the code that creates the project.
- `tutorialTasks.projectId`: a nullable project ID. A project can have many tasks; a task belongs to at most one project.

Tasks store a project ID and retrieve its name when reading the relation. Renaming a project does not require updating every task, and identical project names do not confuse their identities.

Existing tasks have no reliable project assignment. Allow the new field to be null, meaning “not assigned to a project.” The migration does not guess assignments or create a default project for all historical tasks. This example rejects deletion of a project that still has tasks; an application can first move or unlink those tasks before deleting it.

## With an agent

Give the agent this chapter as context from the application directory, then describe the request below. Field, API and component details are in the manual steps; the agent should follow them alongside the project's guidance.

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

Review preservation of existing data, enforcement of constraints and use of a real database, as well as the new table and field. Compare the result with the implementation below.

## Without an agent

### Write a self-contained migration

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

The filename without `.ts` matches `name` and sorts after the existing task migrations. Declare tables, fields and constraints directly in the migration rather than importing evolving definitions from business services or model files.

`up()` creates the project table before extending tasks. `down()` removes dependencies in reverse order, retaining the original task fields and records but deleting project records and task associations. It reverses the schema change; it is not a backup that restores business data.

### Distinguish fields, relations and constraints

The migration describes three parts of the same business relationship:

- **The `projectId` field** stores a project ID in the task table. `nullable: true` keeps existing tasks and new unassigned tasks valid.
- **The `project` relation** tells Repository how to retrieve the project for a task. `foreignKey` names the existing field, and `targetKey` names the project's primary key. The relation does not store a second copy of the project name.
- **The foreign key constraint** ensures that a non-null `projectId` references an existing project. `onDelete: 'restrict'` prevents deleting a project while tasks reference it.

The migration explicitly creates and names the foreign key, so the relation uses `constraints: false` to avoid creating another constraint. This does not disable the database foreign key. An explicit name also lets `down()` remove that constraint precisely.

The ordinary index on `projectId` supports future filtering by project. It is not unique because many tasks can belong to one project. The index supports queries; the foreign key enforces valid references.

Field declarations do not replace endpoint validation. For example, `nullable: false` does not reject a blank name, and databases can handle string lengths differently. Endpoints must still validate the trimmed name and its length.

### Apply migrations and generate Collections

Check which database the application configuration targets, then run:

```bash
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

For a database already at the previous stage, the plan should include this new migration. A new database also needs earlier application and plugin migrations and seeds. `db apply` runs pending migrations followed by pending seeds, rather than only the file just added.

Running the command again does not re-execute successful migrations. Existing tasks retain their titles, completion states, assignees and due dates, with `projectId` set to null.

The command refreshes the model snapshots under `database/main/collections/`. Inspect:

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

These files show the model resolved from the database. They are regenerable caches: do not edit them manually or import them into a migration. Check that the cache matches the database:

```bash
pnpm nocobase collections generate --check
```

## Verify against a real database

Create `tests/database/tutorial-tasks-projects.test.ts`. The test applies earlier migrations and inserts an existing task, applies this migration, checks schema and data, then rolls back and reapplies it. `describeMigration()` owns the isolated database and its cleanup; it does not use your development database.

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

Run this chapter's test, then the existing task database and endpoint tests:

```bash
pnpm exec vitest run --config vitest.tutorial.config.ts tests/database/tutorial-tasks-projects.test.ts
pnpm exec vitest run --config vitest.tutorial.config.ts
```

Confirm that the test appears in the results. “No tests found” is not a successful verification. The test checks:

- Existing task fields survive the upgrade, with a null `projectId`.
- The index and foreign key exist, and Repository can read a task's associated project name.
- Missing project IDs and deletion of referenced projects are rejected, with the original association preserved after failure.
- Rollback removes the new model while preserving the task, and the migration can be applied again.

The test calls `repository()` directly to verify an isolated database. Production endpoints must check the caller's permissions and use the corresponding Repository policy. A foreign key proves that a project exists, not that the caller may access or select it.

## Evolve the model further

**Keep merged or released migrations unchanged.** Add a migration when introducing a field, changing a constraint or correcting an earlier migration. Editing an executed file does not make `db apply` run it again. Resetting the database cannot prove that a real upgrade preserves data.

If every task must eventually have a project, first determine the assignments for existing tasks, backfill the data and verify that no nulls remain. Then make the field required in a subsequent migration. Backfilling existing data belongs in a migration; a seed should not repeatedly overwrite tasks users have edited.

Seeds provide the initial records an application needs to operate. Projects in this chapter are user-created business records, so no seed is needed. For demonstration content, explicitly use an optional sample seed so loading example data is an installation choice.

## Further reading

[Business services and HTTP APIs](apis-and-services.md) explains how to expose data operations to pages: validate input, check project and task permissions, and translate business failures into consistent API errors. [Application development overview](overview.md) shows how the parts fit together.
