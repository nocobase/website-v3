---
title: Business services and ServiceProvider
description: Organize service implementations, Tokens and Providers in a plugin, and offer them to APIs, commands and other plugins through a public contract.
---

This guide gives the announcements plugin a text preview service, so that HTTP APIs, the CLI or other plugins all reuse the same implementation. `services/` holds the business implementation, `tokens.ts` defines the public contract, and `providers/` registers the implementation in the application container. No database access and no client code are involved.

For general dependency injection and lifecycle, see [ServiceProviders and service lifecycle](service-provider.md); for handling transactions and request state, see [Server business services](../developing-apps/server-business-services.md). This guide focuses on registration in the plugin and the boundaries of public use.

## Prerequisites and files

Add the following files to the existing `@nocobase/app-plugin-announcements`. Paths are relative to the plugin root; if content with the same names exists, merge it and keep the existing services and APIs. When creating a new plugin you can choose `server.service-providers`. `@nocobase/service-provider` uses a compatible peer dependency so the application and the plugin share one runtime identity.

## Use an Agent

```text
Extract announcement text preview into a plugin Server service returning trimmed
text and its Unicode code-point count. Register a lazy singleton through the original
Token and ServiceProvider and expose the contract to APIs and commands.
Preserve Server contributions and keep request, user and transaction state out of
singleton fields. Verify missing registration, shared identity and declaration builds.
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

The type, length and permissions of API input are validated by the respective entries, while reusable business constraints are still maintained by the service. This example measures length in Unicode code points, which equals neither the JavaScript string length nor the number of graphemes a user perceives.

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

This implementation does not depend on the HTTP Context, so the CLI and background jobs can use it too. When it later needs the database or external services, the Provider resolves the application's existing services and injects them through constructor arguments, while per-call state such as the requesting user, authorization policy and transaction connection is passed as method arguments. Do not build another global container, and do not bypass the application's existing data access policies.

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

Add `AnnouncementPreviewProvider` to the constructor array in `server/providers/index.ts`, then confirm that `serviceProviders` in `server/plugin.ts` references that array. An implementation file in the directory does not mean it is registered; keep the other Providers, and do not write `new AnnouncementPreviewProvider(...)` in the array.

This example is pure computation and needs no extra startup or shutdown of resources. When asynchronous initialization is needed, use the corresponding lifecycle; when subscriptions or connections must be closed, release only the resources you created and handle startup failure properly. For the phases and dependency order, see [Application startup and lifecycle](../framework/runtime/lifecycle.md).

## Expose and consume the service

In `server/index.ts`, keep the plugin's default export and add the public Token and interface type:

```ts
export { announcementPreviewToken } from './tokens.js';
export type { AnnouncementPreview, AnnouncementPreviewService } from './tokens.js';
```

Once the application connects the plugin in `server/plugins.ts`, APIs or other plugins can import the original Token from `@nocobase/app-plugin-announcements/server` and call the service through the current application's container. Do not recreate the Token from the same string, and do not import `server/services/preview.ts` across packages.

In route handling logic that has already validated its input, call `app.container.resolve(announcementPreviewToken).preview(text)`, then return the result according to the HTTP response contract. For declaring and protecting routes, see [Routes and HTTP APIs](server-apis.md).

The CLI resolves the same Token inside `this.withApp(async ({ app }) => ...)` and returns the result as the command's return value. The application must have registered the plugin's Server entry; registering only the CLI entry does not register this service. A pure preview does not need an extra `app.start()` just to call it; services that depend on resources from the startup phase must start the application according to their contract. For CLI arguments and error handling, see [Command-line extensions](extend-command-line.md).

Callers obtain the interface type through the public entry, while the concrete implementation and Provider can remain internal details of the plugin. For the differences between package dependencies, runtime registration and call order, see [Plugin declarations and public exports](plugin-declarations.md).

## Verify the public contract and integration

Put the following test in `tests/server/service-provider.test.ts`, merging or replacing the existing related assertions:

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

This test proves the public Token, lazy creation and instance sharing; you also need to check that the real Server declaration contains this Provider, and call the actual HTTP or CLI entry in the target App. Services involving the database, permissions or transactions need real application tests; one container test cannot stand for the whole integration.

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

Server services and client services run in different containers. The browser must call this service through an API and cannot import the Server implementation directly.
