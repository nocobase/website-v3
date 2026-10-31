---
title: Transactions and data consistency
description: Define service transaction boundaries and verify rollback, concurrency and cross-connection or external effects.
---

A transaction commits or rolls back a group of operations on one database connection. Organize it around a business result, such as checking that a task and target project are eligible before saving an assignment.

This guide retains the historical `tutorialTasks`/`tutorialProjects` model and prerequisites from [Create tables and initialize data](data-models-and-migrations.md), not the current getting-started `tasks` model. See [Server business services](server-business-services.md) for the complete service.

## Use the transaction connection in a service


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

This illustrates transaction structure. Production services use distinguishable business errors, translated into API errors by routes; see [HTTP routes and APIs](apis-and-services.md). Calling the outer `database.repository()` runs outside this transaction. Catching an error and returning normally may commit partial work.

Transactions do not automatically prevent concurrent overwrites. If last successful write wins is unacceptable, add concurrency controls such as version conditions. Trigger external effects such as notifications after commit. `connection.afterCommit()` is useful for that boundary, but failure cannot undo committed data and does not guarantee external message delivery.

## Propagate the connection to collaborating methods

Pass the transaction connection into helper methods rather than letting them return to a global manager. Never store it on a singleton or pass it to background work after the transaction ends.

For a named connection, use `database.connection('analytics').transaction(...)`. A default-connection transaction does not cover analytics writes. Multiple connections are not a distributed transaction; see [Multiple database connections](multiple-databases.md).

## Transactions do not replace business constraints

| Requirement | Additional mechanism |
| --- | --- |
| A business key must be unique | A database unique constraint and conflict handling |
| References must point to existing records | Appropriate foreign keys and deletion rules |
| Do not overwrite another user's recent changes | Version preconditions or other concurrency controls |
| Modify only authorized records | Authorization policies bound to transactional Repositories |

Reading before updating does not automatically prevent lost updates. The project example does not promise optimistic locking. Define version fields and conditions when needed and test concurrent behavior on the target database.

## After-commit work is not reliable delivery

`connection.afterCommit()` callbacks run after commit and are discarded on rollback. Callback failures neither undo committed data nor reject the transaction Promise; `onTransactionCallbackError` handles them, with a warning by default. See [Transaction mechanisms](../framework/database/transactions.md) for waiting and nesting semantics.

Mail, HTTP calls and job submission do not roll back with the database. For eventual delivery after commit, persist pending-delivery records in the same transaction, then use a recoverable background process with business idempotency keys. See [Background jobs and scheduled execution](background-tasks.md).

## Verify persisted results

In isolated databases, cover successful commit, failure after the first write, and after-commit callback failure. Read data again after failures to establish whether it rolled back; asserting an exception alone is insufficient.

Also test unique-key races, version conflicts, authorization scopes and connection isolation. SQLite can verify basic rules, but not another database's isolation, locking or DDL behavior. The project endpoint tests are linked from the [historical project API example](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/core/developing-apps/apis-and-services.md); see [Testing and acceptance](testing-and-acceptance.md) for test organization.
