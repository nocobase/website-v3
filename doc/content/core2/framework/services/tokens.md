---
title: Service contracts and tokens
description: Learn how service contracts and Tokens define stable service entries, and how Token identity, contract design, evolution and test substitutes work.
---

A service contract describes what consumers can do, and a Token locates its implementation in the container. Putting the interface and the Token in a public module lets applications, plugins and tests share one contract without referencing internal classes.

## Define a stable entry

```ts
import { createServiceToken } from '@nocobase/service-provider';

export interface TitleService {
  normalize(value: string): string;
}

export const titleServiceToken =
  createServiceToken<TitleService>('@example/orders/title-service');
```

The implementation class can change while consumers keep depending on `TitleService`. To use it across plugins, re-export the interface and Token from the provider's public `client` or `server` entry, and declare that package in the consumer's dependencies.

## A name is not an identity

Each call to `createServiceToken()` creates a new object. Even with the same string, two Tokens are not the same identifier. Consumers must import the Token exported by the provider instead of creating their own.

Duplicate package installations, imports from private deep paths and incorrect bundling can all give the same source two module instances at runtime. Align shared runtime dependencies with the peer ranges declared by the public package, and use the package manager to check for duplicate versions and export boundaries.

## Designing a contract

A contract should return business data first and make asynchronous results, errors and resource ownership explicit. Avoid requiring the whole Application, a Hono Context or a component instance in every method, which would tightly couple the service to a specific host.

The client and the server can share data types, but service Tokens are not resolved across the network. When a browser service needs a server capability, it implements the contract through an API client. Private server dependencies must not end up in browser bundles just because an interface is shared.

## Evolution and test substitutes

Adding a required method or changing what a return value means affects every consumer, and needs to be updated together with versions and tests. The container rejects duplicate bindings; choose test substitutes when assembling the test, instead of quietly overwriting the original binding after the application has started.

Continue with [Service containers](container.md), [Client services](integration.md#client-services) and [Server services](integration.md#server-services).

## Interfaces and implementation

- [Token identity](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/token.ts)
- [Container bindings](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/container.ts)
