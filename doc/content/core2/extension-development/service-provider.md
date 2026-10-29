---
title: ServiceProviders and service lifecycle
description: Understand service contracts, Tokens, container registration and lifecycle on the client and server together.
---

A ServiceProvider connects the services a plugin provides to the App's container and manages the startup and cleanup those services need. The client and server use the same basic mechanism, but run in different environments, and their containers and instances are never shared.

Business behavior goes in the Service, while registration and the lifecycle of resources go in the Provider. A pure function with only one caller usually needs no container; use a ServiceProvider only when several entries share a capability, an implementation must be replaceable, or resources must be managed.

When connecting a plugin per runtime, you can go straight to [Client services](client-services.md) and [Business services and ServiceProvider](server-services.md); for starting and shutting down job resources, see [Background jobs and executors](background-jobs.md). This guide explains the container and lifecycle concepts both sides share; for React component context, see [React Context and Providers](react-context-and-providers.md).

## Use an Agent

```text
Organize ServiceProviders for the notice feature: a reusable text preview service on the Server,
and shared layout preferences on the Client. Register each in its own container,
make Tokens and public entries clear, and test lazy creation and instance reuse.
```

## Prepare the plugin

The example plugin below is named `notice-services`. Commands run in the App root, and file paths are relative to `packages/app-plugin-notice-services/`.

```bash
pnpm create @nocobase/plugin@beta notice-services --with server.service-providers --with client.service-providers
```

The scaffold has already generated the Providers, aggregation files and plugin declarations on both sides. Keep these connections and only change the implementations.

## Server: contract, Token, implementation and registration

Replace `server/tokens.ts`:

```ts
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface NoticePreview {
  readonly text: string;
  readonly length: number;
}
export interface NoticeServicesService {
  preview(text: string): NoticePreview;
}
export const noticeServicesServiceToken: ServiceToken<NoticeServicesService> =
  createServiceToken<NoticeServicesService>(
    '@nocobase/app-plugin-notice-services/service',
  );
```

Replace `server/services/notice-services.ts`:

```ts
import type { NoticePreview, NoticeServicesService } from '../tokens.js';

export class DefaultNoticeServicesService implements NoticeServicesService {
  public preview(text: string): NoticePreview {
    const normalized = text.trim();
    return { text: normalized, length: Array.from(normalized).length };
  }
}
```

`server/providers/notice-services.ts` uses the generated registration:

```ts
import {
  ServiceProvider,
  type ServiceContainer,
} from '@nocobase/service-provider';

import { DefaultNoticeServicesService } from '../services/notice-services.js';
import { noticeServicesServiceToken } from '../tokens.js';

export interface NoticeServicesProviderApplication {
  readonly container: ServiceContainer;
}

export class NoticeServicesProvider extends ServiceProvider<NoticeServicesProviderApplication> {
  public readonly name: string = '@nocobase/app-plugin-notice-services';

  public override register(): void {
    this.app.container.singleton(
      noticeServicesServiceToken,
      () => new DefaultNoticeServicesService(),
    );
  }
}
```

`singleton` creates the instance on first resolution, and every later resolution in the same App container returns the same instance. `instance(token, value)` registers a value that has already been created. Factory functions are synchronous; put asynchronous preparation into lifecycle methods.

`server/providers/index.ts` exports an array of Provider constructors, and `server/plugin.ts` contributes it to the App as `serviceProviders`. Do not write `new NoticeServicesProvider(...)` in the array, and do not start connections or timers when the module is imported.

Routes or other Providers can use the service through `app.container.resolve(noticeServicesServiceToken)`. If other plugins also need it, keep the default export in `server/index.ts` and add:

```ts
export { noticeServicesServiceToken } from './tokens.js';
export type { NoticeServicesService, NoticePreview } from './tokens.js';
```

Callers import the original Token from `@nocobase/app-plugin-notice-services/server`; they must not recreate one from the same string. The shared runtime `@nocobase/service-provider` must be declared as a peer dependency, so two installed copies do not produce different identities.

## Client: its own services and container

Add `client/services/preferences.ts`:

```ts
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface NoticePreferences {
  isCompact(): boolean;
  setCompact(value: boolean): void;
}
export const noticePreferencesToken: ServiceToken<NoticePreferences> =
  createServiceToken<NoticePreferences>(
    '@nocobase/app-plugin-notice-services/preferences',
  );

export class DefaultNoticePreferences implements NoticePreferences {
  private compact = false;
  public isCompact(): boolean {
    return this.compact;
  }
  public setCompact(value: boolean): void {
    this.compact = value;
  }
}
```

Replace `client/providers/notice-services.ts`:

```ts
import type { ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';
import {
  DefaultNoticePreferences,
  noticePreferencesToken,
} from '../services/preferences.js';

export class NoticeServicesServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-notice-services';
  public override register(): void {
    this.app.container.singleton(
      noticePreferencesToken,
      () => new DefaultNoticePreferences(),
    );
  }
}
```

Keep the registrations in `client/providers/index.ts` and `client/plugin.ts`. In existing React components, use `useService(noticePreferencesToken)` from `@nocobase/app-client`; ordinary functions can receive the service as an argument, rather than relying on a global container variable.

This preference is shared only within the current App instance in the browser and returns to the default after a refresh. Calling `setCompact()` does not trigger a React update automatically: interface state must still be driven by state, a subscription mechanism or a React Provider. A ServiceProvider manages services, while a React Provider manages component tree context; they are not the same concept. When the value must persist on the server, save it through an API, rather than assuming the client and server containers share state.

## Lifecycle responsibilities

| Phase | Suitable work |
| --- | --- |
| `register()` | Register instances or lazy factories synchronously, with no network or database operations |
| `boot()` | Check dependencies and complete asynchronous preparation |
| `start()` | Start the subscriptions, connections, consumers or timers the Provider owns |
| `ready()` | Complete the internal switch to ready after all Providers have started |
| `shutdown()` | Stop the resources the Provider created and wait for them to be released |

Each phase runs for every Provider before the next phase begins, and cleanup runs in reverse order. On the Server, route factories run after `boot()` and before `start()`, so they can resolve services but cannot assume background jobs have started. `ready()` does not mean the external HTTP port is listening either.

Cleanup must tolerate startup failures and instances that were never created. Use `resolveIfCreated()` to check for an existing instance, so shutdown does not create it just to close it. Release only the resources you own, and never destroy shared database or logging services obtained from the App. This example has no external resources, so it adds no empty lifecycle methods.

## Test service registration

Replace the generated `tests/server/service-provider.test.ts`:

```ts
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';
import { NoticeServicesProvider } from '../../server/providers/notice-services.js';
import { noticeServicesServiceToken } from '../../server/tokens.js';

describe('notice service', () => {
  it('registers a lazy singleton and normalizes text', () => {
    const container = new ServiceContainer();
    new NoticeServicesProvider({ container }).register();
    expect(container.resolveIfCreated(noticeServicesServiceToken)).toBeUndefined();
    const service = container.resolve(noticeServicesServiceToken);
    expect(service.preview('  欢迎 👋  ')).toEqual({
      text: '欢迎 👋',
      length: 4,
    });
    expect(container.resolve(noticeServicesServiceToken)).toBe(service);
  });
});
```

```bash
pnpm --filter @nocobase/app-plugin-notice-services format
pnpm --filter @nocobase/app-plugin-notice-services check
```

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-services --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-services --no-install
```

After registration, actually call the server entry and the pages that use the client service in the App, and run the App's `pnpm build`. Unit tests prove container behavior, but cannot replace verifying the connection on both sides. Client service tests can use `renderWithApp()` to register the real Client plugin, as described in [Testing and verification](testing-and-verification.md).
