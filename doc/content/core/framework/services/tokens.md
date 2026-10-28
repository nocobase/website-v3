---
title: Service contracts and tokens
---

A service contract defines what consumers can do; a token locates its implementation in the container. Exporting both from a public module lets apps, plugins and tests share a contract without importing private classes.

## A stable entry

```ts
import { createServiceToken } from '@nocobase/service-provider';

export interface TitleService {
  normalize(value: string): string;
}

export const titleServiceToken =
  createServiceToken<TitleService>('@example/orders/title-service');
```

Implementations can change while consumers depend on `TitleService`. Re-export the contract and token from the provider's public client or server entry, and declare that package as a consumer dependency.

## Names are not identities

Every `createServiceToken()` call creates a new object. Equal strings do not make equal tokens. Import the original exported token instead of recreating it.

Duplicate installations, private deep imports and bundling can create multiple runtime copies. Align shared dependencies with peer ranges and inspect duplicates and package exports.

## Contract design

Return business data and specify asynchronous behavior, errors and resource ownership. Requiring an entire Application, Hono Context or component instance in every method couples the service to its host.

Client and server can share data types, but tokens do not resolve over the network. Browser services implement remote operations through API clients. Shared interfaces must not pull private server dependencies into browser bundles.

## Evolution and substitutes

Required new methods and changed return semantics affect consumers and need coordinated versions and tests. Containers reject duplicate bindings; choose test substitutes during composition instead of overwriting live registrations.

Continue with [Containers](container.md), [Client services](client-services.md) and [Server services](server-services.md).

## Interfaces and implementation

- [Token identity](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/token.ts)
- [Container bindings](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/container.ts)
