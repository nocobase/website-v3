---
title: Service containers and dependency injection
---

A service container separates consumers from construction. Consumers depend on interfaces and tokens; application composition selects implementations. Both client and server use this mechanism with independent instances.

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

This standalone example creates its own container. Application code should use the existing `app.container` instead of creating global containers per page, request or plugin.

| Method | Behavior |
| --- | --- |
| `instance(token, value)` | Bind an existing value |
| `singleton(token, factory)` | Create synchronously on first resolution and reuse the instance |
| `resolve(token)` | Resolve, throwing for missing or circular dependencies |
| `has(token)` | Check binding without creating it |
| `resolveIfCreated(token)` | Return an existing instance or `undefined` |

## Supplying dependencies

A singleton factory receives a resolver. Resolve dependencies there and pass them to business constructors, allowing tests to supply substitutes without an application object.

Factories are synchronous. Establish connections and other asynchronous resources through ServiceProvider lifecycle hooks rather than binding a Promise as a service.

## Scope and failure

Singleton means one container, not one deployment or all browser windows. There is no automatic request scope; pass identities, transactions and cancellation signals explicitly.

Duplicate bindings and circular dependencies fail. Failed factories retain their failure state rather than retrying automatically. Recoverable connections need an explicit recovery strategy inside the service.

See [ServiceProvider](../../extension-development/service-provider.md) for registration and [Service contracts and tokens](tokens.md) for cross-package identity.

## Interfaces and implementation

- [Container](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/container.ts)
