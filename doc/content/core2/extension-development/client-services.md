---
title: Client services
description: Provide a client service from a plugin, register a shared instance with a Token, and connect change subscriptions to React.
---

When several pages need to work together to refresh the announcement list, the plugin can provide a change notification service: it publishes "saved" notifications, while pages request data and show feedback. This example only maintains a revision number within the current browser application instance; it implements no save API, request cache or cross-browser synchronization.

For how the application layer organizes requests and shares business operations, see [Client business services](../developing-apps/client-business-services.md); for how the service container works, see [Service containers](../framework/services/container.md). This guide focuses on registration in a plugin, the public contract and React subscriptions.

## Prerequisites and files

Add a Client service to the existing `@nocobase/app-plugin-announcements`; the Context or database guides need not be completed first. File paths are relative to the plugin root. When creating a new plugin you can choose `client.service-providers`; for an existing plugin, merge the implementation and declarations below. Keep the compatible peer dependencies on `@nocobase/service-provider`, React and the client runtime.

## Use an Agent

```text
Add a Client change-notification service to the announcements plugin,
sharing one instance through its original Token. Notify pages only after a
successful save, never after failure or cancellation. Provide a useSyncExternalStore
Hook with stable snapshots, unsubscribe on unmount and release owned listeners
at App shutdown. Preserve Client contributions and test real registration.
```

## Define the service and Token

Add `client/services/changes.ts`. `services/` is only a directory for organizing implementations and does not register services automatically. To keep the example easy to read, the contract, Token and implementation share one file; larger plugins can split them.

```ts
import { createServiceToken, type ServiceToken } from '@nocobase/service-provider';

export interface AnnouncementChanges {
  getSnapshot(): number;
  subscribe(listener: () => void): () => void;
  notifySaved(): void;
}
export const announcementChangesToken: ServiceToken<AnnouncementChanges> =
  createServiceToken<AnnouncementChanges>('@nocobase/app-plugin-announcements/changes');

export class DefaultAnnouncementChanges implements AnnouncementChanges {
  private revision: number = 0;
  private readonly listeners: Set<() => void> = new Set();

  public readonly getSnapshot = (): number => this.revision;
  public readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  public notifySaved(): void {
    this.revision += 1;
    for (const listener of this.listeners) listener();
  }
  public dispose(): void {
    this.listeners.clear();
  }
}
```

With no new notification, `getSnapshot()` returns the same number, which lets React tell whether anything changed. `subscribe()` returns an unsubscribe function; `dispose()` is called only by the Provider that owns the implementation and is not part of the consumer's public contract.

## Register and release through a Provider

Add or merge `client/providers/announcements.ts`:

```ts
import type { ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';
import {
  DefaultAnnouncementChanges,
  announcementChangesToken,
} from '../services/changes.js';

export class AnnouncementChangesProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-announcements/changes';
  private changes: DefaultAnnouncementChanges | undefined;
  public override register(): void {
    this.app.container.singleton(announcementChangesToken, () => {
      this.changes = new DefaultAnnouncementChanges();
      return this.changes;
    });
  }
  public override async shutdown(): Promise<void> {
    this.changes?.dispose();
    this.changes = undefined;
  }
}
```

The Provider's private reference records only the instance it actually created. On shutdown, it does not resolve the service for the first time just to clean up, and it does not release the API Client the application shares or other plugins' resources.

Add `AnnouncementChangesProvider` to the constructor array in `client/providers/index.ts`, and confirm that `client/plugin.ts` assigns this array to `serviceProviders`. Keep the other Providers, never instantiate classes in the array, and never register a second implementation for the same Token. For the shared rules of registration and lifecycle, see [ServiceProviders and service lifecycle](service-provider.md).

## Subscribe from React

Add `client/hooks/use-announcement-revision.ts`:

```ts
import { useSyncExternalStore } from 'react';
import { useService } from '@nocobase/app-client';
import { announcementChangesToken } from '../services/changes.js';

export function useAnnouncementRevision(): number {
  const changes = useService(announcementChangesToken);
  return useSyncExternalStore(changes.subscribe, changes.getSnapshot, changes.getSnapshot);
}
```

`useService()` only resolves the instance; `useSyncExternalStore()` is what subscribes to changes and unsubscribes when the consumer unmounts. Once a page has the revision, its existing data-reading logic can reload when the revision changes, keeping request cancellation and stale-response handling; see [Data requests and state management](../developing-apps/data-requests-and-state.md).

The save entry resolves `announcementChangesToken` from the same container and calls `notifySaved()` after the real save request succeeds. Do not call it in `finally`, and do not treat the notification as proof that data was saved to the database. This guide implements no write API; when integrating for real, reuse the application's business API that already checks permissions. Updates across different browsers or processes need an additional server-side notification mechanism.

## Expose the contract and integrate the App

In `client/index.ts`, keep the plugin's default export and add:

```ts
export { announcementChangesToken } from './services/changes.js';
export type { AnnouncementChanges } from './services/changes.js';
export { useAnnouncementRevision } from './hooks/use-announcement-revision.js';
```

Callers import the original Token or Hook from the plugin's public entry and register the plugin factory in the App's `client/plugins.ts`. Do not recreate the Token from the same string; importing only the Hook does not register the service either. For package paths and build output mappings, see [Plugin declarations and public exports](plugin-declarations.md#public-exports).

## Verify behavior

Put the behavior tests in `tests/client/service-provider.test.tsx`, updating the scaffold's existing assertions and keeping other tests that are still valid:

```tsx
import { act, screen } from '@testing-library/react';
import { renderWithApp } from '@nocobase/app-testing/client';
import type { ReactElement } from 'react';
import { expect, it, vi } from 'vitest';
import plugin from '../../client/index.js';
import { announcementChangesToken } from '../../client/services/changes.js';
import { useAnnouncementRevision } from '../../client/hooks/use-announcement-revision.js';

function Revision({ id }: { id: string }): ReactElement {
  return <output data-testid={id}>{useAnnouncementRevision()}</output>;
}
it('shares revisions and releases listeners', async () => {
  const view = await renderWithApp(<><Revision id="a" /><Revision id="b" /></>, {
    plugins: [plugin()],
  });
  const changes = view.app.container.resolve(announcementChangesToken);
  act(() => changes.notifySaved());
  expect(screen.getByTestId('a').textContent).toBe('1');
  expect(screen.getByTestId('b').textContent).toBe('1');
  const listener = vi.fn();
  const stop = changes.subscribe(listener);
  stop();
  act(() => changes.notifySaved());
  expect(listener).not.toHaveBeenCalled();
  changes.subscribe(listener);
  view.unmount();
  await view.app.shutdown();
  changes.notifySaved();
  expect(listener).not.toHaveBeenCalled();
});
```

Also verify the success, failure and cancellation paths at the real save entry: only a successful write changes the revision. Two consumers should receive the same notification, stop updating after they unmount, and all listeners the plugin owns should be released after the application shuts down.

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

The display preference managed by Context and the service state here each have a clear owner; there is no need to copy the same revision into another Context.
