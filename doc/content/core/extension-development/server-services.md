---
title: Business services and ServiceProvider
description: Organize plugin service implementations, Tokens and Providers and expose contracts to APIs, commands and other plugins.
---

This article gives the announcements plugin a text-preview service shared by HTTP, CLI and other plugins. `services/` owns implementation, `tokens.ts` defines public contracts, and `providers/` registers them in the App container. No database or Client code is required.

See [ServiceProvider](service-provider.md) for dependency injection and lifecycle, and [Server business services](../developing-apps/server-business-services.md) for transactions and request state. This article focuses on plugin registration and public consumption.

## Prerequisites and files

Add these files to the existing `@nocobase/app-plugin-announcements`. Paths are relative to its root; merge existing content and preserve services and APIs. New plugins can select `server.service-providers`. Keep `@nocobase/service-provider` as a compatible peer so the App and plugin share runtime identity.

## Use an Agent

```prompt
Extract announcement text preview into a server service shared by the API and command.
Preserve its behavior: trim surrounding whitespace and return the cleaned text and Unicode code point count.
Expose the contract and Token through the plugin's public entry and register it with a ServiceProvider. Pass request, user and transaction data as call arguments.
Verify clear failure when registration is missing, reuse of the registered instance and correct type declarations for the public entry.
```

## Define the service contract

Add the contract and Token to `server/tokens.ts`:

```ts
import { createServiceToken, type ServiceToken } from '@nocobase/service-provider';

export interface AnnouncementPreview {
  readonly text: string;
  readonly length: number;
}
export interface AnnouncementPreviewService {
  preview(text: string): AnnouncementPreview;
}
export const announcementPreviewToken: ServiceToken<AnnouncementPreviewService> =
  createServiceToken<AnnouncementPreviewService>('@nocobase/app-plugin-announcements/preview');
```

Each entry validates its input type, length and permissions; reusable business constraints still belong in the service. This example counts Unicode code points, which differ from JavaScript string length and user-perceived graphemes.

## Implement the service

Add `server/services/preview.ts`:

```ts
import type { AnnouncementPreview, AnnouncementPreviewService } from '../tokens.js';

export class DefaultAnnouncementPreviewService implements AnnouncementPreviewService {
  public preview(text: string): AnnouncementPreview {
    const normalized = text.trim();
    return { text: normalized, length: Array.from(normalized).length };
  }
}
```

The implementation does not depend on HTTP Context and can be used by commands or jobs. When adding database or external-service dependencies, resolve existing App services in the Provider and inject them through constructor arguments. Pass per-call user identity, authorization policies and transactions through method parameters. Do not create another global container or bypass the App's data policies.

## Register with the plugin

Add `server/providers/preview.ts`:

```ts
import { ServiceProvider, type ServiceContainer } from '@nocobase/service-provider';
import { announcementPreviewToken } from '../tokens.js';
import { DefaultAnnouncementPreviewService } from '../services/preview.js';

export interface AnnouncementPreviewApplication {
  readonly container: ServiceContainer;
}
export class AnnouncementPreviewProvider extends ServiceProvider<AnnouncementPreviewApplication> {
  public readonly name: string = '@nocobase/app-plugin-announcements/preview';
  public override register(): void {
    this.app.container.singleton(announcementPreviewToken, () => new DefaultAnnouncementPreviewService());
  }
}
```

Append `AnnouncementPreviewProvider` to the constructor array in `server/providers/index.ts` and confirm `server/plugin.ts` contributes it through `serviceProviders`. An implementation file alone does not register a service. Preserve existing Providers and do not put `new AnnouncementPreviewProvider(...)` in the array.

This pure calculation needs no startup or shutdown resources. Use lifecycle methods for asynchronous initialization. Release only subscriptions or connections the plugin creates, accounting for startup failure. See [Application startup and lifecycle](../framework/runtime/lifecycle.md) for stages and dependency ordering.

## Expose and consume the service

Preserve the default plugin export in `server/index.ts` and add the public Token and types:

```ts
export { announcementPreviewToken } from './tokens.js';
export type { AnnouncementPreview, AnnouncementPreviewService } from './tokens.js';
```

After registration in the App's `server/plugins.ts`, APIs or other plugins import the original Token from `@nocobase/app-plugin-announcements/server` and call through the current App container. Do not recreate the Token with the same string or import the private `server/services/preview.ts` across packages.

After validating route input, call `app.container.resolve(announcementPreviewToken).preview(text)` and return the result through the HTTP response contract. See [Routes and HTTP APIs](server-apis.md) for declaration and protection.

Inside `this.withApp(async ({ app }) => ...)`, a CLI first calls `await app.registerProviders()`, then resolves the same Token and returns its result. `withApp()` creates and cleans up the application; it does not register services automatically. The App must register the Server entry; registering the CLI entry alone does not register this service. Pure preview needs no extra `app.start()` call, while services depending on started resources require startup according to their contract. See [Command-line extensions](extend-command-line.md) for arguments and errors.

Consumers obtain interfaces from public entries; implementation and Provider classes may remain private. Package dependencies, runtime registration and call ordering are explained in [Plugin declarations and public exports](plugin-declarations.md).

## Verify the public contract and integration

Put this in `tests/server/service-provider.test.ts`, merging or replacing relevant existing assertions:

```ts
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';
import { announcementPreviewToken } from '../../server/index.js';
import { AnnouncementPreviewProvider } from '../../server/providers/preview.js';

it('registers one lazy service behind the public Token', () => {
  const container = new ServiceContainer();
  expect(() => container.resolve(announcementPreviewToken)).toThrow();
  new AnnouncementPreviewProvider({ container }).register();
  expect(container.resolveIfCreated(announcementPreviewToken)).toBeUndefined();
  const service = container.resolve(announcementPreviewToken);
  expect(service.preview('  欢迎 👋  ')).toEqual({ text: '欢迎 👋', length: 4 });
  expect(container.resolve(announcementPreviewToken)).toBe(service);
});
```

This verifies the public Token, lazy creation and shared identity. Also check that the actual Server declaration includes the Provider and call a real HTTP or CLI entry in the target App. Database, authorization and transaction integration require real application tests; a container test does not establish those behaviors.

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

Client and Server services run in separate containers. Browsers call this service through an API rather than importing its Server implementation.
