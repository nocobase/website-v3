---
title: Client and server service integration
description: Integrate shared service contracts with client and server containers and clarify application, plugin, request and component ownership.
---

`@nocobase/service-provider` supplies the same containers, Tokens and lifecycle mechanisms to applications and plugins. Browsers and servers own separate containers; a shared contract does not share an instance across the network.

## Choose registration and consumption points

| Location | Registration | Consumption |
| --- | --- | --- |
| Application client | Application client ServiceProvider, wired through its runtime | `useService()` in React; constructor arguments in ordinary services |
| Plugin client | `serviceProviders` in `client/plugin.ts` | Import the public Token and use the current client container |
| Application server | Application Provider collection, wired through its runtime | Resolve with `app.container.resolve()` and pass dependencies to business code |
| Plugin server | `serviceProviders` in `server/plugin.ts` | Use the host container and application-managed lifecycle |

Application Providers are commonly collected in `client/service-provider.ts` and `server/providers/index.ts`; follow the files referenced by the current runtime. A file's existence does not register it. See [Client services](../../developing-apps/client-business-services.md), [Server-side services](../../developing-apps/server-business-services.md) and [Plugin declarations](../../extension-development/plugin-declarations.md) for integration steps.

## Client services

Client services hold cross-page business behavior, request wrappers or shared state. Components present it; services expose independently callable behavior. Temporary form input usually stays in components or React Context.

### Making state subscribable

```ts
import type { ClientApplication } from '@nocobase/app-client';
import { useService } from '@nocobase/app-client';
import { ServiceProvider, createServiceToken } from '@nocobase/service-provider';
import { useSyncExternalStore } from 'react';

export class CompactPreference {
  private value = false;
  private listeners = new Set<() => void>();
  getSnapshot = () => this.value;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  set(value: boolean) {
    if (value === this.value) return;
    this.value = value;
    for (const listener of this.listeners) listener();
  }
}
export const compactToken = createServiceToken<CompactPreference>('orders.compact');

export class CompactServiceProvider extends ServiceProvider<ClientApplication> {
  readonly name = 'orders.compact';
  register() {
    this.app.container.singleton(compactToken, () => new CompactPreference());
  }
}

export function useCompact() {
  const service = useService(compactToken);
  const value = useSyncExternalStore(service.subscribe, service.getSnapshot);
  return { value, set: (next: boolean) => service.set(next) };
}
```

Add `CompactServiceProvider` to the application's client `serviceProviders` or the plugin's contribution array. Components call `useCompact()` to read and update the preference.

`useService()` resolves a service without subscribing. `useSyncExternalStore` connects updates to React and removes listeners on unmount. Snapshots must remain stable while values are unchanged; allocating a new snapshot object on every read can cause unnecessary updates.

### Calling the server

Use the configured HTTP client through `useApiClient()`, `apiClientToken` or constructor injection. Forward cancellation signals to requests and let the UI handle loading, failures and retries.

Cached browser permissions and user objects are not server authorization. Clear identity-specific state and request caches when identities change.

### Ownership and tests

This example stores only in-memory state. Providers own connections and global listeners; components own their local subscriptions. Test singleton sharing, rerendering after updates and listener cleanup.

Related: [API Client](../http/api-client.md) and [React Providers](../runtime/react-providers.md).

### Interfaces and implementation

- [Client service integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [React hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/src/hooks.ts)

## Server services

Server services centralize business rules so HTTP, CLI and background work can share behavior. Entry points validate input and establish identity; data policies and business constraints travel explicitly through the call chain.

### Inject framework resources

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

### Keep request state out of singletons

Do not store current users, transactions or request input in service fields: concurrent calls could overwrite each other. Pass them as arguments. Convert HTTP Context into a small business context at the route boundary instead of coupling services to a Web framework.

### Transactions and external effects

For atomic multi-step writes, create a transaction and obtain Repositories from its callback connection. Do not use that connection after the callback finishes. Mail, HTTP calls and queue submissions do not normally roll back with the database. Arrange them after commit, with retries and idempotency identifiers appropriate to the business.

Database commit and notification delivery are separate outcomes. Durable delivery requirements need explicit persisted pending work and recovery.

### Multiple entry points and tests

CLI and background tasks lack browser identity. Define their execution principal and allowed data scope rather than assuming administrative access.

Unit-test rules and use real database tests for policies, transactions and concurrency. See [Server-side services](../../developing-apps/server-business-services.md) and [Transactions](../database/transactions.md).

### Interfaces and implementation

- [Database service integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/database/index.ts)
- [Repository policies](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
