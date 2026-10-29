---
title: Querying and manipulating data
description: Use Repositories to query and change business records, handle relations, pagination, transactions and bulk operations, and decide when to switch to Query.
---

Data access usually starts with a Repository: it understands a Collection's fields and relations and suits reading, creating and changing business records. Query works on tables and result sets and suits reports and aggregations that a Repository cannot express. Whichever you use, the caller must establish identity and permissions first.

The code in this guide runs on the application server and reuses `tutorialProjects` and `tutorialTasks` from [Create tables and initialize data](data-models-and-migrations.md). The example is based on an application on default template `1.0.0-beta.78`; the snippets only illustrate data access, and the complete routing, authorization and service registration are in [Server business services](server-business-services.md). The `tutorialTasks`/`tutorialProjects` here belong to the separate historical project example, not to the current getting-started `tasks`; confirm the baseline in [Create tables and initialize data](data-models-and-migrations.md) before running it.

## With an Agent

```text
Please improve the existing project list queries so search, sorting and pagination stay consistent.

Return only projects the current user may view, and count only those projects.
Search by name and default to newest first. Keep a stable order when creation times match.
Allow at most 100 records per page; reject negative page numbers and unrestricted full-list requests.

When changing a task's project, check permissions for both the task and the target project.
If any step fails, preserve the old assignment without partial saves.
Use a real database to verify search, pagination, permission scopes and data after failure. Do not change existing user grants.
```

## Without an Agent

### Obtain a Repository

Resolve the database service once in the route factory, or pass it to a business service through its constructor:

```ts
import { databaseManagerToken } from '@nocobase/db';

const database = app.container.resolve(databaseManagerToken);
```

`database.repository('tutorialProjects')` uses the default connection and the Collection's logical name. Do not guess physical table names in the database, and never expose the database service to the browser.

A Repository does not infer who the current request's user is. When handling external requests, first obtain a `RepositoryPolicy` from the authorization result, then bind the record scope and field permissions with `withPolicy()`. Filters submitted by the user can only narrow that scope further; they are never a basis for authorization.

### Filter, sort and paginate

The function below receives already-validated pagination parameters and the permission policy for this view action. It belongs in a business service, with the API validating `page >= 1`, `1 <= pageSize <= 100` and the search text's length beforehand:

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

The list and the total use the same Repository and the same filters. Filtering the list but not the total leaks the number of records outside the scope and produces invalid page numbers. Using `id` as the second sort field gives records with the same creation time a deterministic order; it does not mean UUIDs increase over time.

The two pagination queries are not guaranteed to come from the same database snapshot, so with concurrent inserts and deletes the total and the current page may briefly disagree. If you need a consistent snapshot or cursor pagination, design it separately around the database's isolation level and the actual queries; slicing a full download in the browser is no substitute for server-side pagination.

### Read relations

Once a migration has declared `tutorialTasks.project`, the project can be read through the relation:

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

The `taskPolicy` here must allow reading the corresponding fields and relation; `include()` alone does not grant access. If the business requires tasks and projects to use the data scopes of different actions, bind and query each policy separately as the project assignment example does; "can read the task" must not be treated as "can read any project".

Use `select` to choose exactly the fields the response needs. When a relation is defined, prefer reading through it over a handwritten join that would duplicate field mappings and relationship rules.

### Create, update and delete

| Need | Repository method | Behavior to note |
| --- | --- | --- |
| Read one | `findOne()` | Returns the first matching record, possibly none |
| Create one | `createOne()` | Returns a change result object, with the record in `result.record` |
| Update or delete one | `updateOne()`, `deleteOne()` | Requires exactly one matching record within the scope |
| Create several | `createMany()` | Does not support nested relation writes |
| Bulk update or delete | `updateMany()`, `deleteMany()` | The scope must be explicit; do not use `all: true` to get around the empty-scope safeguard |

For example, here is a fragment from a business service that changes the completion state. `taskId` has been validated, and `updatePolicy` comes from the authorization result of the complete action:

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

The API should build `values` from an allowlist of fields rather than passing the whole request body through. Bulk operations likewise need validated input, a bound policy, a size limit, and an explicit decision on whether the business means "all succeed" or "partial success is acceptable"; a method name ending in `Many` does not settle any of that for you.

### Multi-step writes and transactions

Operations that must succeed or fail together belong in a business service, in one transaction on one connection; for how to write it, rollback on failure and the limits around external delivery, see [Transactions and data consistency](transactions-and-consistency.md). Both reads and writes must use that transaction connection, and Repositories from outside must not be mixed into the callback.

## When to use Query

| Scenario | First choice |
| --- | --- |
| Records in a Collection and their declared relations | Repository |
| Needs `withPolicy()`, field encoding or relation writes | Repository |
| Report joins without relation definitions, complex subqueries, paginating grouped results | Query |
| Set-based historical data transformation in a migration | Usually the Query from the migration Context, keeping the migration self-contained |

At runtime, obtain Query with `database.query()`; inside a transaction callback, use the `connection.query` property. Query does not read a Collection's relations or naming overrides, and it does not apply permissions, optimistic locking or relation write rules automatically. It does still use the connection layer's naming conversion, so do not assume that concatenating physical table names yourself is always correct.

Query conditions take the form `where(field, operator, value)`, with values parameterized by the query builder. It is not the Knex API, so do not copy `where(field, value)` or `whereIn()`. Updates and deletes require a `where`; use `allowAllRows()` explicitly only when the business really requires an operation on the whole table.

## Verify results

Use a real test database to check filtering, stable sorting, empty results, relations and the scope of bulk operations; use the real application and ordinary users to check permissions. Deliberately cause a failure inside a transaction, read the database again, and confirm that earlier writes were undone as well. Do not try to prove Repository behavior by mocking the Repository.

For a complete example of the project service, see [Server business services](server-business-services.md); for choosing test tools, see [Testing and acceptance](testing-and-acceptance.md).
