---
title: Client business services
description: Implement and register application client services, inject the API Client, and connect shared operations and observable state to pages.
---

Extract a client service when several pages need the same business operation or coordinate application-level state. Pages own interactions, services encapsulate independently callable behavior, and ServiceProviders connect them to the application container.

This guide follows default template `1.0.0-beta.84`. Its example notifies other views after a task is modified. It assumes the `PATCH /tasks/:id` contract from [Data requests and state management](data-requests-and-state.md), implemented by your server. A client service creates neither endpoints nor database tables.

## When a service helps

| Need | Starting point |
| --- | --- |
| A calculation or display transformation used in one place | Ordinary function |
| Page loading, forms and local interaction | Component state or custom Hook |
| Context shared by a component subtree | React Context and Provider |
| Operations, change coordination or resources shared across pages | Client service and ServiceProvider |

A simple request used by one page does not need a service first. Client services also do not replace server business rules: permissions, data scopes, transactions and final validation belong on the server.

## With an agent

```prompt
Tasks can be edited from several pages. Consolidate the repeated mutation logic into a reusable client service.
Keep the existing APIs and application services, task permissions and page-local draft handling.
Refresh related views after a successful save. On failure or cancellation, preserve input and do not announce success.
Check that components share the service, subscriptions are removed on unmount and application shutdown releases connections and listeners.
```

## Organize the code

One optional structure is below. Directories do not register services automatically:

```tree
client/
├── services/
│   ├── tasks.ts                 # Operations and change subscriptions
│   └── tokens.ts                # Service contract entry
├── providers/
│   └── tasks.ts                 # Registration and disposal
├── hooks/
│   └── use-task-revision.ts     # React state adapter
├── service-provider.ts          # Application ServiceProvider aggregation
└── react-providers.ts           # React component Provider aggregation
```

### Implement the service

In `client/services/tasks.ts`, receive dependencies through the constructor and operation input and cancellation through method parameters:

```ts
import type { ApiClient } from '@nocobase/app-client';

export interface Task {
  id: string;
  title: string;
}

export class TasksService {
  private revision = 0;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly api: ApiClient) {}

  getSnapshot = (): number => this.revision;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  async rename(id: string, title: string, signal?: AbortSignal): Promise<Task> {
    const response = await this.api.request<{ data: Task }>({
      method: 'PATCH',
      path: `/tasks/${encodeURIComponent(id)}`,
      json: { title },
      signal,
    });
    this.revision += 1;
    for (const listener of this.listeners) listener();
    return response.data;
  }

  dispose(): void {
    this.listeners.clear();
  }
}
```

`revision` counts successful modifications observed by this service. It is neither a server record version nor a task-list cache. It does not synchronize changes from other browsers or users; add realtime subscriptions separately when required.

This `rename` method can replace the ordinary `renameTask` function in the data-request guide. Update pages to call the service rather than maintaining two mutation implementations. Move business types into the shared entry too, and import them into pages from the service module.

API failures propagate to callers without incrementing the revision. Pages own translated feedback, field errors, submission locks and draft retention. Services do not call React Hooks or manipulate page DOM. Subscription callbacks should perform lightweight invalidation; their asynchronous refreshes must handle failures.

### Define a Token

Define and export one stable Token in `client/services/tokens.ts`:

```ts
import { createServiceToken } from '@nocobase/service-provider';
import type { TasksService } from './tasks.js';

export const tasksServiceToken = createServiceToken<TasksService>('app.tasks');
```

Registration and consumption import the same Token. Do not call `createServiceToken('app.tasks')` again inside components: equal names do not make equal service identities.

### Register through a ServiceProvider

Declare the Provider in `client/providers/tasks.ts`:

```ts
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';
import { TasksService } from '../services/tasks.js';
import { tasksServiceToken } from '../services/tokens.js';

export class TasksServiceProvider extends ServiceProvider<ClientApplication> {
  readonly name = 'app.tasks';

  override register(): void {
    this.app.container.singleton(tasksServiceToken, (services) =>
      new TasksService(services.resolve(apiClientToken)),
    );
  }

  override async shutdown(): Promise<void> {
    this.app.container.resolveIfCreated(tasksServiceToken)?.dispose();
  }
}
```

The factory runs on first resolution using the existing API Client. Consumers in the same container receive the same instance. `shutdown()` uses `resolveIfCreated()` to avoid creating an unused service while shutting down.

Merge the import into `client/service-provider.ts` and append the Provider to its existing array:

```ts
import { TasksServiceProvider } from './providers/tasks.js';

// Keep the existing DefaultClientServiceProvider implementation and imports.
const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  DefaultClientServiceProvider,
  TasksServiceProvider,
];

export default serviceProviders;
```

This is a partial edit, not a replacement file. Keep the existing type imports, default Provider and other contributions. The default Provider supplies Toast and document-title behavior. The template's `client/runtime.ts` already imports this aggregation entry, so normally it needs no additional change.

## Call the service from a page

Call `useService(tasksServiceToken)` at the top level of a component or custom Hook, then call `tasks.rename(id, title, signal)` in its submit handler. Do not call `useService()` inside an event callback or construct a new service during every render.

After receiving the saved record, update detail state, finish editing or reread the list. Handle failures as with ordinary API calls. For page-owned cancellation, create an `AbortController` in the page and pass its signal. Cancellation does not guarantee that the server rolls back the mutation.

The singleton belongs to one browser application instance, not all tabs, browsers or the server. The example persists no records or user data. If you add identity-dependent caching, clear cached data and in-flight requests when identity changes.

## Connect service changes to React

`useService()` resolves an instance without subscribing to its fields. To observe the revision, adapt it in `client/hooks/use-task-revision.ts`:

```ts
import { useService } from '@nocobase/app-client';
import { useSyncExternalStore } from 'react';
import { tasksServiceToken } from '../services/tokens.js';

export function useTaskRevision(): number {
  const tasks = useService(tasksServiceToken);
  return useSyncExternalStore(tasks.subscribe, tasks.getSnapshot);
}
```

The service notifies subscribers, React reads the snapshot again, and unmounting removes the subscription. Snapshots must remain stable while state is unchanged; this example uses a number. For object snapshots, reuse unchanged values instead of allocating on every read. The example targets browser rendering; server rendering also needs an appropriate `getServerSnapshot`. See [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore).

A page that only needs to refresh a list can subscribe to its reload action directly. Merge this into the existing list Hook:

```ts
// Inside the list Hook, with useEffect/useService and tasksServiceToken imported:
const tasks = useService(tasksServiceToken);
const { reload } = request; // The existing useListData result.
useEffect(() => tasks.subscribe(reload), [tasks, reload]);
```

The subscription lasts for the mounted page, with the returned function handling cleanup. The list still reads on initial mount, so it does not rely on receiving past events. Choose one refresh path per save instead of both subscribing and calling `reload()` in the submit callback. Changes from other sources still need their own refresh or realtime integration.

React Providers supply component-tree context through `client/react-providers.ts`. ServiceProviders register container services through `client/service-provider.ts`. They can cooperate, but calling a service does not require an additional React Provider.

## Own lifecycle resources

Registration declares services and dependencies. Do not start network requests or access page DOM there. If a resource must connect during application startup, establish it in the appropriate Provider lifecycle and release the connections, timers and listeners it owns on shutdown.

Pages clean up their requests and local subscriptions on unmount. Services cancel background requests they create. Do not close shared runtime API or realtime clients when disposing of a service's own resources.

This Provider only clears its listeners; it creates no background work or global connection. See [Service container](../framework/services/container.md) and [ServiceProvider and service lifecycle](../extension-development/service-provider.md) for container contracts, lifecycle ordering and plugin integration.

## Verify results

Test observable behavior rather than only checking construction:

- Repeated resolution in one container yields the same instance; different containers are independent.
- Requests use the injected client and pass the ID, JSON body and cancellation signal correctly.
- Success returns the server record and notifies subscribers; failures and cancelled requests do not increment the success revision.
- Two subscribed components both update, and unmounting one does not affect the other.
- Unsubscription and application shutdown release listeners; shutdown does not construct an unused service.
- Pages retain drafts, submission locks, translated errors and server-side permission handling.

Inject a test client to check methods, use the real `ServiceContainer` to check registration and disposal, and use component tests for subscriptions. Run type checks, relevant tests and a build. See [Testing and acceptance](testing-and-acceptance.md) for end-to-end data and permission checks.

Source baseline: [Template ServiceProvider](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/service-provider.ts), [Client service Hooks](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/app/app-client/src/hooks.ts).
