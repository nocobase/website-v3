---
title: Server services
---

Server services centralize business rules so HTTP, CLI and background work can share behavior. Entry points validate input and establish identity; data policies and business constraints travel explicitly through the call chain.

## Inject framework resources

This assumes an `orders` Collection with `id` and `title` fields:

```ts
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export class OrdersService {
  constructor(private readonly database: DatabaseManager) {}

  async list(policy: RepositoryPolicy) {
    return this.database.repository('orders').withPolicy(policy).findMany({
      select: (s) => s.fields('id', 'title'),
      sort: (s) => [s.field('id').asc()],
      limit: 20,
    });
  }
}
```

A ServiceProvider resolves `databaseManagerToken`, injects it into `OrdersService`, and registers a business token. Routes resolve the service and pass policies derived from authorization, never policies trusted directly from request input.

## Keep request state out of singletons

Do not store current users, transactions or request input in service fields: concurrent calls could overwrite each other. Pass them as arguments. Convert HTTP Context into a small business context at the route boundary instead of coupling services to a Web framework.

## Transactions and external effects

For atomic multi-step writes, create a transaction and obtain Repositories from its callback connection. Do not use that connection after the callback finishes. Mail, HTTP calls and queue submissions do not normally roll back with the database. Arrange them after commit, with retries and idempotency identifiers appropriate to the business.

Database commit and notification delivery are separate outcomes. Durable delivery requirements need explicit persisted pending work and recovery.

## Multiple entry points and tests

CLI and background tasks lack browser identity. Define their execution principal and allowed data scope rather than assuming administrative access.

Unit-test rules and use real database tests for policies, transactions and concurrency. See [Business services and HTTP APIs](../../developing-apps/apis-and-services.md) and [Transactions](../database/transactions.md).

## Interfaces and implementation

- [Database service integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/database/index.ts)
- [Repository policies](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
