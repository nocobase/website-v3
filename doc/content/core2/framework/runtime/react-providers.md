---
title: React Provider registration and mounting
description: Learn how to declare React Providers, how they are ordered and when they mount, and how they work with the service container.
---

A React Provider supplies context to the page tree, such as form state, a theme or shared interaction. It is a React component that receives `children`, and its role differs from that of a ServiceProvider, which registers application services.

## Declaring a Provider

Put the following module where the application aggregates its React Providers, or contribute it through a plugin's `reactProviders`:

```tsx
import { createContext, useState, type PropsWithChildren } from 'react';
import { defineClientReactProviders } from '@nocobase/app-client/plugins';

export const CompactContext = createContext({
  compact: false,
  setCompact: (_value: boolean) => {},
});

function CompactProvider({ children }: PropsWithChildren) {
  const [compact, setCompact] = useState(false);
  return <CompactContext.Provider value={{ compact, setCompact }}>
    {children}
  </CompactContext.Provider>;
}

export default defineClientReactProviders([
  { name: 'orders.compact', layer: 'extension', component: CompactProvider },
]);
```

The preference in this example exists only in the current React tree and resets to the default after a reload. If it needs to persist, connect browser storage or a server API separately.

## Ordering and mounting

The runtime orders Providers from outer to inner according to `layer` and any explicit `before` / `after` relations. Declare an order only when a Provider really depends on another context; keep Provider names stable and free of conflicts.

Resolving declarations does not run any components. Providers mount only when the host renders `AppClientRoot` after the application starts. Subscriptions in effects must return a cleanup function and tolerate React's repeated-mount checks in development.

## Working with the service container

ServiceProviders own the registration and lifecycle of application services. A React Provider can resolve services through the application context and expose their subscribable state to components. Do not create shared connections during React rendering, and do not assume that `useService()` subscribes to changes in the service object.

In tests, check that consumers receive the context, that updates trigger a rerender, and that unmounting cleans up. In an existing application, add the Provider to the existing aggregated declaration instead of bypassing the framework to create a separate, disconnected page tree.

Continue with [Client services](../services/integration.md#client-services) and [Components and styles](../../extension-development/frontend-components.md).

## Interfaces and implementation

- [React Provider contract](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
