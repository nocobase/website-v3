---
title: React Provider registration and mounting
---

A React Provider supplies page-tree context such as forms, themes or shared interaction state. It is a React component receiving `children`, with a different role from a ServiceProvider that registers application services.

## Declaring a Provider

Place this module in the application's aggregation entry or contribute it through a plugin's `reactProviders`:

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

The example preference lives only in this React tree and resets on reload. Add browser storage or an API separately when persistence is needed.

## Ordering and mounting

The runtime orders Providers outer-to-inner by `layer` and explicit `before` / `after` constraints. Declare ordering when another context is actually required, using stable, non-conflicting names.

Resolving declarations does not execute components. Providers mount when the host renders `AppClientRoot` after startup. Effects must clean up subscriptions and tolerate React development remount checks.

## Working with services

ServiceProviders own application service registration and lifecycle. React Providers can resolve those services and adapt their subscribed state for components. Do not create shared connections during render or assume `useService()` subscribes to object changes.

Test context availability, rerendering after updates and unmount cleanup. Extend the existing aggregation entry rather than creating a disconnected page tree.

Continue with [Client services](../services/integration.md#client-services) and [Components and styles](../../extension-development/frontend-components.md).

## Interfaces and implementation

- [React Provider contract](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
