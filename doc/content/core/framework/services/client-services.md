---
title: Client services
---

Client services hold cross-page business behavior, request wrappers or shared state. Components present it; services expose independently callable behavior. Temporary form input usually stays in components or React Context.

## Making state subscribable

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

## Calling the server

Use the configured HTTP client through `useApiClient()`, `apiClientToken` or constructor injection. Forward cancellation signals to requests and let the UI handle loading, failures and retries.

Cached browser permissions and user objects are not server authorization. Clear identity-specific state and request caches when identities change.

## Ownership and tests

This example stores only in-memory state. Providers own connections and global listeners; components own their local subscriptions. Test singleton sharing, rerendering after updates and listener cleanup.

Related: [API Client](../http/api-client.md) and [React Providers](../runtime/react-providers.md).

## Interfaces and implementation

- [Client service integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [React hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/src/hooks.ts)
