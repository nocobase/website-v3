---
title: Querying and manipulating data
description: Use Repositories for business records, relations, pagination, transactions and bulk operations, and decide when to use Query.
---

Start data access with a Repository. It understands Collection fields and relations and supports reading, creating and changing business records. Query operates on tables and result sets, for reports and aggregations that Repository cannot express. Both require callers to establish identity and permissions first.

The snippets run on the application server and use `tutorialProjects` and `tutorialTasks` from [Data models and migrations](data-models-and-migrations.md). The example application uses default template `1.0.0-beta.78`. This is a separate historical project example, not the current getting-started application with its `tasks` table. These are data-access excerpts; complete routing, authorization and service registration are in [Business services and HTTP APIs](apis-and-services.md).

## With an agent

```text
Please improve the existing project list queries so search, sorting and pagination stay consistent.

Return only projects the current user may view, and count only those projects.
Search by name and default to newest first. Keep a stable order when creation times match.
Allow at most 100 records per page; reject negative page numbers and unrestricted full-list requests.

When changing a task's project, check permissions for both the task and the target project.
If any step fails, preserve the old assignment without partial saves.
Use a real database to verify search, pagination, permission scopes and data after failure. Do not change existing user grants.
```

## Without an agent

### Obtain a Repository

Resolve the database once in the route factory, or inject it into a business service through its constructor:

```ts
import { databaseManagerToken } from '@nocobase/db';

const database = app.container.resolve(databaseManagerToken);
```

`database.repository('tutorialProjects')` uses the default connection and the Collection's logical name. Do not guess physical table names or expose the database service to the browser.

A Repository does not infer the current request's user. For external requests, obtain a `RepositoryPolicy` from authorization and bind record scopes and field permissions with `withPolicy()`. User-supplied filters may narrow that scope but are not evidence of authorization.

### Filter, sort and paginate

This function accepts validated pagination parameters and the current read policy. Place it in a business service; the endpoint first validates `page >= 1`, `1 <= pageSize <= 100` and search length:

```ts
import type {
  DatabaseManager,
  RepositoryFilter,
  RepositoryPolicy,
} from '@nocobase/db';

export async function listProjects(
  database: DatabaseManager,
  policy: RepositoryPolicy,
  input: { page: number; pageSize: number; q?: string },
) {
  const projects = database.repository('tutorialProjects').withPolicy(policy);
  const filter: RepositoryFilter<Record<string, unknown>> = (f) =>
    f.and(input.q ? [f.string('name').includes(input.q)] : []);

  const data = await projects.findMany({
    filter,
    select: (s) => s.fields('id', 'name', 'createdAt'),
    sort: (s) => [s.field('createdAt').desc(), s.field('id').desc()],
    limit: input.pageSize,
    offset: (input.page - 1) * input.pageSize,
  });
  const total = await projects.count({ filter });
  return { data, meta: { page: input.page, pageSize: input.pageSize, total } };
}
```

Rows and totals use the same Repository and filter. Filtering only rows leaks counts outside the allowed scope and creates invalid pages. The second sort field, `id`, makes equal timestamps deterministic; it does not mean UUIDs increase chronologically.

The two pagination queries are not guaranteed to share one database snapshot. Concurrent changes can briefly affect the total and current page. Design snapshot consistency or cursor pagination separately when needed; downloading all data and slicing it in the browser is not a replacement for server pagination.

### Read relations

After a migration declares `tutorialTasks.project`, read the relation through the selector:

```ts
const task = await database
  .repository('tutorialTasks')
  .withPolicy(taskPolicy)
  .findOne({
    filter: { id: taskId },
    select: (s) =>
      s
        .fields('id', 'title', 'projectId')
        .include('project', (p) => p.fields('id', 'name')),
  });
```

`taskPolicy` must allow the corresponding fields and relation read; `include()` is not authorization. If tasks and projects require separate operation scopes, bind and query each policy separately, as in project assignment. Reading a task does not imply access to every project.

Select response fields explicitly. Prefer declared relations over handwritten joins that duplicate field mappings and relationship rules.

### Create, update and delete

| Need | Repository method | Behavior to account for |
| --- | --- | --- |
| Read one | `findOne()` | Returns the first match, possibly no record |
| Create one | `createOne()` | Returns a mutation result; the record is `result.record` |
| Update or delete one | `updateOne()`, `deleteOne()` | Requires exactly one record in scope |
| Create several | `createMany()` | Does not support nested relation writes |
| Bulk update or delete | `updateMany()`, `deleteMany()` | Requires an explicit scope; do not use `all: true` to bypass an empty-scope error |

This service excerpt updates completion. `taskId` is validated and `updatePolicy` comes from authorization for that action:

```ts
const result = await database
  .repository('tutorialTasks')
  .withPolicy(updatePolicy)
  .updateOne({
    filter: { id: taskId },
    values: { completed: true, updatedAt: new Date() },
    select: (s) => s.fields('id', 'completed', 'updatedAt'),
  });
const savedTask = result.record;
```

Build `values` from an explicit field allowlist rather than passing the entire request body. Bulk operations still need validated input, policies, bounded sizes and a decision about all-or-nothing versus partial success. A method ending in `Many` does not make those decisions for you.

### Group operations in a transaction

Use a transaction for operations that must succeed or fail together, taking every operation from the callback's `connection`:

```ts
await database.transaction(async (connection) => {
  const tasks = connection.repository('tutorialTasks').withPolicy(taskPolicy);
  const projects = connection
    .repository('tutorialProjects')
    .withPolicy(projectPolicy);

  const task = await tasks.findOne({ filter: { id: taskId } });
  if (!task) throw new Error('Task unavailable.');
  const project = await projects.findOne({ filter: { id: projectId } });
  if (!project) throw new Error('Project unavailable.');

  await tasks.updateOne({
    filter: { id: taskId },
    values: { projectId, updatedAt: new Date() },
  });
});
```

This illustrates transaction structure. Production services use distinguishable business errors, translated into API errors by routes; see [Business services and HTTP APIs](apis-and-services.md). Calling the outer `database.repository()` runs outside this transaction. Catching an error and returning normally may commit partial work.

Transactions do not automatically prevent concurrent overwrites. If last successful write wins is unacceptable, add concurrency controls such as version conditions. Trigger external effects such as notifications after commit. `connection.afterCommit()` is useful for that boundary, but failure cannot undo committed data and does not guarantee external message delivery.

## When to use Query

| Situation | Start with |
| --- | --- |
| Collection records and declared relations | Repository |
| Policies, field encoding or relation writes | Repository |
| Report joins without relations, complex subqueries, paging grouped results | Query |
| Set-based historical data transformations in migrations | Usually the migration context's Query, keeping the migration self-contained |

Runtime code uses `database.query()`; transaction callbacks use the `connection.query` property. Query does not read Collection relations or naming overrides and applies no automatic permission policy, optimistic locking or relation writes. It still uses connection-level naming conversion, so do not assume manually concatenated physical names always work.

Query conditions take `where(field, operator, value)` and parameterize values. This is not Knex's API: do not copy `where(field, value)` or `whereIn()`. Updates and deletes require `where`; use `allowAllRows()` only for an explicitly intended whole-table operation.

## Verify results

Use real test databases for filters, stable ordering, empty results, relations and bulk scopes; use the real application and ordinary users for authorization. Trigger a failure within a transaction and reread the database to confirm earlier writes were also rolled back. Mocking a Repository cannot establish its behavior.

See [Business services and HTTP APIs](apis-and-services.md) for the complete project service and [Testing and acceptance](testing-and-acceptance.md) for fixture selection.
