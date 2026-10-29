---
title: Client business services
description: Write and register client services in an application, inject the API Client, and connect shared business operations and observable state to pages.
---

When several pages need the same business operation, or need to maintain application-level state together, extract a client service. Each part has its own job: pages handle interaction, the service encapsulates behavior that can be called independently, and a ServiceProvider connects the service to the application container.

This guide follows default template `1.0.0-beta.84` and builds on one scenario: after a task is changed on any page, other views are told to refresh. The example reuses the `PATCH /tasks/:id` API contract from [Data requests and state management](data-requests-and-state.md), which your own server must implement; a client service creates neither endpoints nor database tables.

## When you need a service

| Need | Starting point |
| --- | --- |
| A display transformation or calculation used in one place | An ordinary function |
| Loading, forms and local interaction on a page | Component state or a custom Hook |
| Context shared by a group of components | React Context and a Provider |
| Business operations reused across pages, coordinated changes or shared resources | A client service and a ServiceProvider |

A simple request used by only one page does not need to become a service first. Nor can a client service replace server-side business rules: permissions, data scopes, transactions and final validation are still enforced by the server.

## With an Agent

```text
Extract task modifications used by several pages into a client business service.

Inspect client/service-provider.ts and API Client integration first; retain existing Providers.
Inject the API Client through the constructor and call the existing endpoint. Pages keep drafts and submission feedback.
Notify subscribers after success, without publishing success for failed or cancelled requests.
Use one Token to register and resolve an application singleton; useService alone does not subscribe to state.
Add React subscriptions and cleanup. Verify sharing across components, failure handling and shutdown cleanup.
```

## Organize the service code

The following is one optional organization. Note that directories alone do not register services:

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

### Write the business service

Implement the service in `client/services/tasks.ts`. The constructor receives the dependencies, and business methods receive the data and cancellation signal for each operation:

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

`revision` only counts the successful changes this service has observed; it is neither a server-side record version nor a task-list cache. The service does not synchronize changes from other browsers or users automatically; when you need live updates, add a subscription mechanism separately.

This `rename` can replace the ordinary `renameTask` function from the data requests guide, with pages calling the service instead, so there are not two sets of update logic to maintain. Move the business types to the same entry as well, and have pages import them from the service module.

When the API call fails, the exception goes to the caller as usual and the revision does not increase. Pages handle the text, field errors, submission lock and draft retention; the service does not call React Hooks or touch the page DOM. Subscription callbacks should only do lightweight invalidation, and any asynchronous refresh they start must handle its own failures.

### Define a Token

Define and export one stable Token in `client/services/tokens.ts`:

```ts
import { createServiceToken } from '@nocobase/service-provider';
import type { TasksService } from './tasks.js';

export const tasksServiceToken = createServiceToken<TasksService>('app.tasks');
```

The registering side and the consuming side must import the same Token. Do not call `createServiceToken('app.tasks')` again inside a component: the same name does not mean the same service identity.

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

The service factory runs the first time the service is resolved, using the application's existing API Client; every consumer in the same application container gets the same instance. `shutdown()` uses `resolveIfCreated()` so that shutting down does not create a service that was never used.

Then merge the import into `client/service-provider.ts` and append the Provider to the existing array:

```ts
import { TasksServiceProvider } from './providers/tasks.js';

// Keep the existing DefaultClientServiceProvider implementation and imports.
const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  DefaultClientServiceProvider,
  TasksServiceProvider,
];

export default serviceProviders;
```

This is a partial edit of the aggregation file: keep its existing type imports, the default Provider and other entries. The default Provider also handles the Toast service and the page title, so do not overwrite the whole file with the snippet above. The template's `client/runtime.ts` already imports this aggregation entry, so the runtime usually needs no further change.

## Call the service from a page

Call `useService(tasksServiceToken)` at the top level of a component or custom Hook, then call `tasks.rename(id, title, signal)` in the submit handler. Do not call `useService()` inside an event callback, and do not `new TasksService(...)` on every render.

Once the service returns the saved record, the page updates the details, ends editing or reloads the list. Errors are handled the same way as for ordinary API calls; when the page needs to cancel a request, the page creates an `AbortController` and passes its signal. Note that cancelling a request does not guarantee that the server undoes the change.

The container singleton lives in the current application instance in this browser; it is not shared across tabs, browsers or the server. The example persists no records or user data; if you extend it to cache results per identity, clear the cache and any in-flight requests when the identity changes.

## Connect service changes to React

`useService()` only obtains the service instance and does not watch its fields. When a component needs to observe the revision, adapt it as external state in `client/hooks/use-task-revision.ts`:

```ts
import { useService } from '@nocobase/app-client';
import { useSyncExternalStore } from 'react';
import { tasksServiceToken } from '../services/tokens.js';

export function useTaskRevision(): number {
  const tasks = useService(tasksServiceToken);
  return useSyncExternalStore(tasks.subscribe, tasks.getSnapshot);
}
```

The service announces changes through the subscription callback, and React then reads the snapshot; the subscription is removed automatically when the component unmounts. The snapshot must stay stable while the state is unchanged, which is why this example uses a number. If the snapshot is an object, reuse the same object while the state has not changed instead of building a new one on every `getSnapshot()` call. This example targets browser rendering; server rendering also needs a suitable `getServerSnapshot`. See [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore).

If the page only needs to refresh the list after a change, it can subscribe the refresh action directly. Merge the following into the existing list Hook:

```ts
// Inside the list Hook, with useEffect/useService and tasksServiceToken imported:
const tasks = useService(tasksServiceToken);
const { reload } = request; // The existing useListData result.
useEffect(() => tasks.subscribe(reload), [tasks, reload]);
```

This subscription is active while the page is mounted, and the returned function cleans it up on unmount. The list still reads normally on first mount, so it does not depend on receiving past events. Pick one refresh path per save: do not both subscribe to the service notification and call `reload()` again in the submit callback. This mechanism does not replace the refresh or live notifications needed for changes from other sources either.

The two kinds of Provider have different entries: a React Provider supplies context to the component tree through `client/react-providers.ts`, and a ServiceProvider serves the service container through `client/service-provider.ts`. They can work together, but you do not need an extra React Provider just to call a service.

## Manage lifecycle and resources

The registration phase only declares services and their dependencies; it starts no network requests and does not access the page DOM. Only resources that genuinely must connect when the application starts are set up in the matching Provider lifecycle, and on shutdown the Provider releases the connections, timers and listeners it owns.

Requests and local subscriptions started by a page are cleaned up when the page unmounts; background requests the service creates itself are cancelled by the service. When releasing its own resources, a service must not close the API client or realtime client shared by the runtime.

The Provider in this example only clears the service's listener set; it creates no background jobs or global connections. For the full container contract, lifecycle order and reuse in plugins, see [Service containers](../framework/services/container.md) and [ServiceProviders and service lifecycle](../extension-development/service-provider.md).

## Verify results

Test the public behavior, not just whether the class gets created:

- Resolving twice in the same container gives the same instance, and different application containers are independent of each other.
- Requests use the injected client and pass the ID, JSON data and cancellation signal correctly.
- A successful save returns the server record and notifies subscribers; a failure or a cancelled request does not increase the success count.
- Two components subscribed to the same service both update, and unmounting one does not affect the other.
- After unsubscribing or shutting down the application, no listeners remain; if the service was never used, shutting down does not create it.
- Pages still keep drafts, submission locks, error text and server-side permission handling.

You can verify the business methods by passing a test client to the constructor, then verify registration and release with a real `ServiceContainer`, and finally verify subscriptions with component tests. Run the project's type checks, relevant tests and build; for end-to-end data and permission verification, see [Testing and acceptance](testing-and-acceptance.md).

Source baseline: [Template ServiceProvider](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/service-provider.ts), [Client service Hooks](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/app/app-client/src/hooks.ts).
