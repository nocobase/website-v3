---
title: Client runtime
description: Learn how the client runtime composes configuration, services, plugins, routes and React extensions into a browser application.
---

The client runtime composes configuration, services, plugins, routes and React extensions into a browser application. Applications and plugins contribute declarations to the same runtime, and the application decides the final layout and components.

## Assembly and rendering

```text
client/runtime.ts
  → resolveAppRuntime()
  → ClientApplication
  → app.start()
  → AppClientRoot
  → React Providers + routes
```

`client/runtime.ts` collects the application's own contributions and the plugins from `client/plugins.ts`. `resolveAppRuntime()` resolves those declarations together with the public configuration in the page. `ClientApplication` owns the configuration, the service container and the lifecycle. The host renders `AppClientRoot` only after `app.start()` succeeds.

Import the declarations needed at startup statically. Page components, large SDKs and locale messages can sit behind lazy-loading boundaries. Declaration modules should not open connections or access the DOM at the top level.

## Resources owned by the application

| Resource | Responsibility |
| --- | --- |
| `app.config` | Merged public browser configuration |
| `app.services` / `app.container` | Resolution and registration of application services |
| `apiClientToken` | HTTP client |
| `realtimeClientToken` | Realtime connection and topic subscriptions |
| Route declarations | Page paths, loaders, authentication and access constraints |
| `reactProviders` | React contexts that wrap the page tree |

These resources belong to the application instance in the current browser. Other browser windows, the server and other applications do not share this container.

## Where to make changes

Add pages through `client/routes.ts`, reusable services through client ServiceProviders, and context for the component tree through React Provider declarations. As long as the template has already wired the runtime, you usually only need to change the relevant aggregation file.

`AppClientRoot` comes with its own browser router. When a test needs to choose its own router, use `AppClientProviders` under that Router, or the application rendering tools in `@nocobase/app-testing/client`, so that you do not nest two BrowserRouters.

## State and disposal

Changing a value in a service does not make React rerender. The UI reads the latest value through state, Context or a subscription. When the application is left, the host unmounts the React root and calls `app.shutdown()` to release the resources owned by Providers.

Continue with [Client services](../services/integration.md#client-services), [React Provider registration and mounting](react-providers.md) and [Pages, routes and navigation](../../developing-apps/pages-routes-and-navigation.md).

## Interfaces and implementation

- [Client runtime](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [Default runtime declaration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/templates/app-template-default/client/runtime.ts)
