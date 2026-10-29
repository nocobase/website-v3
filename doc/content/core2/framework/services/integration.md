---
title: Client and server service integration
description: Connect shared service contracts to the client and server containers, and make clear which resources belong to the application, plugins, requests and components.
---

`@nocobase/service-provider` gives applications and plugins the same containers, Tokens and lifecycle mechanisms. The browser and the server each own their own containers; a "shared contract" does not mean an instance is shared across the network.

## Choose where to register and consume services

| Location | How to register | How to consume |
| --- | --- | --- |
| Application client | The application's client ServiceProvider, wired in by the runtime | `useService()` in React; ordinary services receive dependencies through constructor arguments |
| Plugin client | `serviceProviders` in `client/plugin.ts` | Import the Token from the plugin's public entry and use the current client container |
| Application server | The application's Provider aggregation entry, wired in by the runtime | Resolve with `app.container.resolve()` and pass the result to business code |
| Plugin server | `serviceProviders` in `server/plugin.ts` | Use the host container, with the lifecycle scheduled by the application |

The application's Providers are usually aggregated in `client/service-provider.ts` and `server/providers/index.ts`; follow the files the current runtime actually references. A file existing does not mean it is registered. For the integration steps, see [Client business services](../../developing-apps/client-business-services.md), [Server business services](../../developing-apps/server-business-services.md) and [Plugin declarations](../../extension-development/plugin-declarations.md).

## Client services

Client services suit business logic shared across pages, request wrappers and shared state. Components handle presentation, and services provide behavior that can be called on its own; temporary form input usually stays in components or React Context.

### Make service state subscribable

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

Add `CompactServiceProvider` to the application's client `serviceProviders`, or to the array of the same name in a plugin's contributions. Components can then call `useCompact()` to read and update the preference.

`useService()` only resolves a service; it does not subscribe to changes. The example connects the service state to React through `useSyncExternalStore` and removes the listener on unmount. The snapshot must stay stable while the value is unchanged; returning a new object as the snapshot every time causes pointless updates.

### Communicate with the server

Use the configured HTTP client through `useApiClient()`, `apiClientToken` or constructor arguments. When a service receives a cancellation signal, pass it on to the request, and let the UI handle loading, failures and retries based on the request state.

Do not use permissions or the current user object cached in the browser as the basis for server authorization. When the signed-in identity changes, clear state and request caches tied to the old identity.

### Resources and tests

The example only keeps state in memory and does not persist it. Connections and global listeners are created and closed by the Provider lifecycle; subscriptions inside a component are cleaned up when the component unmounts. In tests, verify that the singleton is shared, that updates trigger a rerender, and how many listeners remain after unmounting.

Related topics: [API Client](../http/api-client.md) and [React Provider registration and mounting](../runtime/react-providers.md).

### Interfaces and implementation

- [Client service integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [React hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/src/hooks.ts)

## Server services

Server services centralize business rules so that HTTP endpoints, CLI commands and background jobs reuse the same behavior. Input validation and identity extraction happen at the entry point, while data scopes and business constraints are passed explicitly along the call chain.

### Inject framework resources into business classes

The following snippet assumes an existing `orders` Collection with `id` and `title` fields:

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

The ServiceProvider resolves the application database through `databaseManagerToken`, injects it into `OrdersService`, and registers the service under a business Token. The route gets the service from the application container and passes in the policy produced by authorization; never trust a policy object carried by the request.

### Request state does not belong in singletons

Do not store the current user, the current transaction or this request's input in service fields, or concurrent requests may overwrite each other. Pass these values as method arguments. The route layer can turn the HTTP Context into a small context with only what the business needs, so that services are not tied to a particular Web framework.

### Transactions and external side effects

When several writes must be atomic, create a transaction in the service method and get Repositories from the connection provided in the callback. Do not use that transaction connection after the method returns. Sending mail, calling external HTTP services and submitting queue messages usually do not roll back with the database; schedule them after the commit, and record retry information and idempotency keys as the business requires.

Do not merge "the database committed" and "the notification was delivered" into a single state that cannot be recovered. If delivery must be strongly consistent, explicitly design persisted pending-delivery records and a recovery process.

### Reuse across entry points and tests

CLI commands and background jobs have no browser request identity. Define the system principal they act as and the data scope they may access; reusing the same service does not grant administrator permissions by default.

Verify business rules with unit tests, and policies, transactions and concurrency with tests against a real database. For the complete integration, see [Server business services](../../developing-apps/server-business-services.md) and [Transactions](../database/transactions.md).

### Interfaces and implementation

- [Database service integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/database/index.ts)
- [Repository policies](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
