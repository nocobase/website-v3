---
title: Service containers
description: Learn how a service container registers and resolves services, how dependencies are supplied, and how singleton scope and failures behave.
---

A service container separates the consumers of a service from how it is created: consumers depend on interfaces and Tokens, and the application decides which implementation to use when it is assembled. Both the client and the server use this mechanism, each with its own instances.

## Registration and resolution

```ts
import { ServiceContainer, createServiceToken } from '@nocobase/service-provider';

interface Titles { normalize(value: string): string }
const titlesToken = createServiceToken<Titles>('example.titles');
const container = new ServiceContainer();
container.singleton(titlesToken, () => ({ normalize: (value) => value.trim() }));

const titles = container.resolve(titlesToken);
console.log(titles.normalize('  Order  ')); // Order
```

This is a standalone container example. Application code should use the existing `app.container` instead of creating a global container for every page, request or plugin.

| Method | Behavior |
| --- | --- |
| `instance(token, value)` | Register a value that has already been created |
| `singleton(token, factory)` | Create synchronously on first resolution and return the same instance afterwards |
| `resolve(token)` | Resolve a service; throws when it is missing or a dependency is circular |
| `has(token)` | Check whether a binding exists without creating it |
| `resolveIfCreated(token)` | Return the value only if it was already created; otherwise `undefined` |

## How dependencies are supplied

A `singleton` factory receives a resolver, which it can use to resolve other registered services and pass them to the business implementation through its constructor. Business classes can then receive substitutes directly in tests without knowing about the application object.

Factories are synchronous. Put asynchronous preparation, such as database connections or SDK sign-in, in ServiceProvider lifecycle hooks, so that a Promise is not mistaken for a service instance.

## Scope and failure

A singleton here is unique within one container, not across processes or browser windows. The container does not create request scopes automatically; pass user identity, transactions and cancellation signals as method arguments.

Binding the same Token twice throws, and circular dependencies are detected. When a factory fails, the binding keeps that failed state; do not treat the first resolution as an automatic retry loop. When a connection needs to be recoverable, the service implements an explicit recovery strategy.

For where to register services and in which startup order, see [ServiceProviders and service lifecycle](../../extension-development/service-provider.md); for service identity shared across packages, see [Service contracts and tokens](tokens.md).

## Interfaces and implementation

- [Container](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/container.ts)
