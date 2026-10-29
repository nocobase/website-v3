---
title: ServiceProviders and service lifecycle
description: Understand service contracts, Tokens, registration and lifecycle on both Client and Server.
---

A ServiceProvider connects plugin services to the App container and owns their startup and cleanup. Client and Server use the same basic mechanism, but run in separate environments with separate containers and instances.

Put business behavior in a Service and registration/resource lifecycle in a Provider. A pure function with one caller usually needs no container. Use a ServiceProvider when multiple entry points share behavior, implementations need replacement, or resources need lifecycle management.

For plugin integration by runtime, see [Client services](client-services.md) and [Business services and ServiceProvider](server-services.md); [Background jobs and executors](background-jobs.md) covers task resources. This article explains shared container and lifecycle concepts. React component context is covered separately in [React Context and Providers](react-context-and-providers.md).

## Use an Agent

```text
Organize ServiceProviders for the notice feature: a reusable text preview service on the Server,
and shared layout preferences on the Client. Register each in its own container,
make Tokens and public entries clear, and test lazy creation and instance reuse.
```

## Prepare the plugin

This example is named `notice-services`. Run commands from the App root; file paths are relative to `packages/app-plugin-notice-services/`.

```bash
pnpm create @nocobase/plugin@beta notice-services --with server.service-providers --with client.service-providers
```

The scaffold connects Providers, aggregation files and declarations on both sides. Keep those connections while implementing the services.

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

Keep the generated registration pattern in `server/providers/notice-services.ts`:

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

`singleton` creates the value on first resolution and returns that same instance within one App container. `instance(token, value)` registers an existing value. Factories are synchronous; asynchronous preparation belongs in lifecycle methods.

`server/providers/index.ts` exports Provider constructors, and `server/plugin.ts` contributes them as `serviceProviders`. Do not instantiate Providers in that array or start connections and timers while importing a module.

Routes and other Providers resolve `app.container.resolve(noticeServicesServiceToken)`. To expose the capability to another plugin, keep the default export in `server/index.ts` and add:

```ts
export { noticeServicesServiceToken } from './tokens.js';
export type { NoticeServicesService, NoticePreview } from './tokens.js';
```

Consumers import the original Token from `@nocobase/app-plugin-notice-services/server`. Recreating a Token with the same string creates another identity. Declare the shared `@nocobase/service-provider` runtime as a peer to avoid duplicate identities.

## Client: its own services and container

Create `client/services/preferences.ts`:

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

Keep registration in `client/providers/index.ts` and `client/plugin.ts`. In an existing React component, call `useService(noticePreferencesToken)` from `@nocobase/app-client`. Ordinary functions can receive the service as an argument; avoid a global container variable.

These preferences belong only to the current browser App instance and reset on refresh. `setCompact()` does not trigger a React render: use state, subscriptions or a React Provider for reactive UI. A ServiceProvider manages services; a React Provider supplies component-tree context. For persistent preferences, use an API rather than assuming the Client and Server share state.

## Lifecycle responsibilities

| Phase | Appropriate work |
| --- | --- |
| `register()` | Synchronously bind instances and lazy factories; no network or database work |
| `boot()` | Check dependencies and perform asynchronous preparation |
| `start()` | Start owned subscriptions, connections, consumers or timers |
| `ready()` | Complete internal readiness after every Provider has started |
| `shutdown()` | Stop and await cleanup of owned resources |

Every Provider completes one phase before the next begins; shutdown runs in reverse order. Server route factories run after `boot()` and before `start()`: they can resolve services but cannot assume background work has started. `ready()` does not imply the external HTTP listener is open.

Cleanup must tolerate partial startup and uncreated services. Use `resolveIfCreated()` to avoid creating a lazy value just to close it. Release only owned resources, not the App’s shared database or logger. This example owns no external resources, so it needs no empty lifecycle methods.

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

Exercise a Server consumer and a Client page in the App, then run the App’s `pnpm build`. Container tests do not replace integration checks. Client tests can register the real plugin with `renderWithApp()`; see [Testing and verification](testing-and-verification.md).
