---
title: Transactions and data consistency
description: Draw transaction boundaries in business services, and verify rollback on failure, concurrency constraints, and the limits of cross-connection and external effects.
---

A transaction makes a group of operations on one database connection commit or roll back together. Organize a transaction around one clear business outcome, for example: confirm that both the task and the target project may be acted on, then save the task's assignment.

This guide reuses the historical `tutorialTasks`/`tutorialProjects` example and its prerequisites from [Create tables and initialize data](data-models-and-migrations.md); it is not the `tasks` model of the current getting-started tutorial. The complete service is in [Server business services](server-business-services.md).

## Use the transaction connection in a service

Reads and writes that must succeed or fail together go into one transaction, and every operation uses the `connection` the callback receives:

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

This only sketches the structure of the transaction; a real service uses distinguishable business errors that the route then turns into API errors, as shown in [Routes and HTTP APIs](apis-and-services.md). Calling the outer `database.repository()` inside the transaction takes the operation out of this transaction, and catching an error and then returning normally may commit part of the work.

A transaction does not solve concurrent overwrites by itself. When two people change the same task and the business cannot accept "the last successful write wins", you also need concurrency control such as a version condition. External side effects such as notifications belong after the commit. `connection.afterCommit()` suits triggering work after a commit, but its failure cannot undo committed data, and it does not guarantee that an external message arrives.

## Pass the transaction connection to collaborating methods

When a service is split into several methods, the caller passes the transaction connection down. Do not let inner methods go back to the global database manager, and do not store the connection in a singleton's fields. Once the transaction ends, the connection must not be handed to background work.

To work only on a specific connection, use `database.connection('analytics').transaction(...)`; a transaction on the default connection does not cover writes to `analytics`. Several connections do not form a distributed transaction; see [Multiple database connections](multiple-databases.md).

## Transactions do not replace business constraints

| Requirement | What else is needed |
| --- | --- |
| A business key must not repeat | A database unique constraint, plus conflict handling |
| References must point to existing records | Foreign keys and deletion rules that fit the business |
| Changes someone just saved must not be overwritten | A version precondition or other concurrency control |
| Only authorized records may be changed | Authorization policies bound to the Repositories inside the transaction |

"Query first, then update" does not prevent concurrent overwrites automatically. The project example provides no optimistic locking; when you need version control, define the model's version field and update condition explicitly and test concurrent behavior on the target database. A successful single-user run does not prove the implementation is right.

## Running after commit is not reliable delivery

`connection.afterCommit()` callbacks run only after the commit and are discarded when the transaction rolls back. A failing callback neither undoes committed data nor makes the transaction's Promise fail; the error is handled by `onTransactionCallbackError`, and produces a warning when that is not configured. For the waiting and nesting semantics, see [Transactions](../framework/database/transactions.md).

Mail, HTTP calls and job submissions do not roll back with the database. If "once the data is committed, the message must eventually be sent" is a requirement, write a pending-delivery record in the same transaction as the business change, then deliver it from a recoverable background process with a business idempotency key. For connecting jobs, see [Background jobs and scheduled execution](background-tasks.md).

## Verify the data results

In an isolated database, cover at least three cases: a successful commit, a second step that fails after the first write, and a callback that fails after the commit. After a failure, always read the data again to confirm whether it rolled back; asserting only that an error was thrown does not prove the original record is unchanged.

Then verify unique-key races, version conflicts, permission scopes and connection isolation. Tests on SQLite can verify the basic rules, but cannot replace verifying the isolation level, locking and DDL behavior of the target database. The project example's real API tests are in [Routes and HTTP APIs](apis-and-services.md), and general test organization is in [Testing and acceptance](testing-and-acceptance.md).
