---
title: Client services
description: Contribute a plugin Client service, share it through a Token and bridge change subscriptions into React.
---

A plugin can provide change notifications when several pages need to refresh announcement lists. The service publishes “saved” notifications; pages load data and render feedback. This example keeps a revision number in one browser App instance. It does not implement saving, request caching or cross-browser synchronization.

See [Client business services](../developing-apps/client-business-services.md) for application-level organization and [The service container](../framework/services/container.md) for shared mechanisms. This article focuses on plugin registration, public contracts and React subscriptions.

## Prerequisites and files

Add a Client service to the existing `@nocobase/app-plugin-announcements`. Context and database chapters are not prerequisites. Paths are relative to the plugin root. A new plugin can select `client.service-providers`; merge the following files and declarations into an existing one. Preserve compatible peers for `@nocobase/service-provider`, React and the Client runtime.

## Use an Agent

```text
Add a Client change-notification service to the announcements plugin,
sharing one instance through its original Token. Notify pages only after a
successful save, never after failure or cancellation. Provide a useSyncExternalStore
Hook with stable snapshots, unsubscribe on unmount and release owned listeners
at App shutdown. Preserve Client contributions and test real registration.
```

## Define the service and Token

Add `client/services/changes.ts`. The directory organizes implementation but does not register it. The small example keeps its contract, Token and implementation together; larger plugins may separate them.

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

`getSnapshot()` returns the same number until notified, allowing React to detect changes. `subscribe()` returns an unsubscribe function. Only the owning Provider calls `dispose()`; it is not part of the consumer contract.

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

The private reference records only an instance this Provider actually created. Shutdown never resolves an unused service merely to clean it up, nor releases the App's shared API Client or another plugin's resources.

Add `AnnouncementChangesProvider` to the constructor array in `client/providers/index.ts` and confirm `client/plugin.ts` contributes that array as `serviceProviders`. Preserve other Providers. Do not instantiate classes in the array or register a second implementation for the same Token. Shared registration and lifecycle rules are covered in [ServiceProvider](service-provider.md).

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

`useService()` only resolves an instance. `useSyncExternalStore()` subscribes and unsubscribes when its consumer unmounts. Pages can reload through their existing data logic when the revision changes, preserving cancellation and stale-response handling; see [Data requests and state management](../developing-apps/data-requests-and-state.md).

Resolve `announcementChangesToken` from the same container at the save entry and call `notifySaved()` after the real save succeeds. Do not notify in `finally` or treat notification as proof of persistence. This chapter provides no write endpoint; use an existing authorized business API. Updates in other browsers or processes require a separate Server notification mechanism.

## Expose the contract and integrate the App

Preserve the plugin default export in `client/index.ts` and add:

```ts
export { announcementChangesToken } from './services/changes.js';
export type { AnnouncementChanges } from './services/changes.js';
export { useAnnouncementRevision } from './hooks/use-announcement-revision.js';
```

Consumers import the original Token or Hook from the public entry and register the factory in the App's `client/plugins.ts`. Do not recreate a Token with the same string. Importing a Hook does not register its service. See [Public exports](plugin-declarations.md#public-exports) for package paths and compiled mappings.

## Verify behavior

Put behavior tests in `tests/client/service-provider.test.tsx`, updating scaffold assertions while preserving other valid tests:

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

Also verify success, failure and cancellation at the actual save entry: only a successful write changes the revision. Two consumers receive the same notification, unmounted consumers stop updating, and shutdown releases owned listeners.

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

Context-owned display preferences and this service state have separate owners; there is no need to copy the same revision into another Context.
