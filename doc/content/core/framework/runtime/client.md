---
title: Client runtime
---

The client runtime composes configuration, services, plugins, routes and React extensions into a browser application. Apps and plugins contribute to the same runtime; the application decides the final layout and components.

## Assembly and rendering

```text
client/runtime.ts
  → resolveAppRuntime()
  → ClientApplication
  → app.start()
  → AppClientRoot
  → React Providers + routes
```

`client/runtime.ts` collects application contributions and plugins from `client/plugins.ts`. `resolveAppRuntime()` resolves declarations and public HTML configuration. `ClientApplication` owns configuration, its service container and lifecycle. The host renders `AppClientRoot` after `app.start()` succeeds.

Statically import declarations required at startup. Lazily load page components, large SDKs and locale messages. Declaration modules should not open connections or access the DOM at import time.

## Application resources

| Resource | Responsibility |
| --- | --- |
| `app.config` | Merged public browser configuration |
| `app.services` / `app.container` | Application service resolution and registration |
| `apiClientToken` | HTTP client |
| `realtimeClientToken` | Realtime connection and topic subscriptions |
| Route declarations | Paths, loaders, authentication and access constraints |
| `reactProviders` | Context wrappers around the page tree |

These resources belong to one browser application instance. Other windows, servers and applications have independent containers.

## Extension points

Add pages through `client/routes.ts`, services through client ServiceProviders, and tree context through React Provider declarations. When the template already wires these aggregation files into the runtime, update the relevant file rather than rebuilding startup.

`AppClientRoot` supplies a browser router. Tests needing their own router can wrap `AppClientProviders` or use the rendering tools in `@nocobase/app-testing/client`; avoid nested BrowserRouters.

## State and disposal

Changing a service value does not automatically rerender React. Use state, Context or a subscription. On disposal the host unmounts its React root and calls `app.shutdown()` to release Provider-owned resources.

Continue with [Client services](../services/client-services.md), [React Providers](react-providers.md) and [Pages, routes and navigation](../../developing-apps/pages-routes-and-navigation.md).

## Interfaces and implementation

- [Client runtime](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [Default runtime declaration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/templates/app-template-default/client/runtime.ts)
