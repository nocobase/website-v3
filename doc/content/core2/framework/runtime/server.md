---
title: Server runtime
description: Learn how the server runtime manages configuration, resource paths, service lifecycle, and HTTP and WebSocket integration.
---

The server runtime is responsible for configuration, resource paths, service lifecycle, and HTTP and WebSocket integration. It separates the business application from the host that listens on a port, so the same application can run as a standalone server, in commands or in tests.

## Runtime and application

```text
server/runtime.ts + server/config/
  → resolved runtime
  → createApp(runtime)
  → Application + ServiceProviders
  → app.start()
  → HTTP / WebSocket host
```

`server/runtime.ts` declares configuration loading, plugins, ServiceProviders, routes and locales. `createApp(runtime)` in `server/app.ts` assembles the application and the framework services. `Application` owns `config`, `paths`, `container` and the request-handling entry.

`app.start()` completes the application's internal startup, while the host opens the network listener, so a Provider's `ready()` does not mean the port is reachable. Tests can send requests through the application's `fetch` boundary without listening on a port.

## Registering business capabilities

| Contribution | Where to connect it |
| --- | --- |
| Configuration sections | `server/config/` and its aggregation entry |
| Business services | `server/providers/`, or a plugin's `serviceProviders` |
| HTTP endpoints | The application's route arrays, or a plugin's `routes` |
| Database resources | `database/<connection>/`, or a plugin's database declarations |
| Plugins | `server/plugins.ts` |

Resolve framework services such as the database, logging and jobs from the existing container. A plugin should not create another application container or duplicate host services; that would split connections, state and shutdown order.

## Requests and shared state

The application container usually lives as long as the process, while the user's identity and input belong to a single request. Never store the "current user" in a singleton field. After the route verifies identity, it passes the necessary arguments to business services; when a transaction is needed, pass the transaction connection explicitly.

Resolve paths with `app.paths` instead of depending on the working directory the command was started from. Runtime data such as uploaded files and SQLite databases must live in persistent locations, not in build output that may be replaced.

## Failure and shutdown

Create, check and release resources in asynchronous lifecycle hooks. Cleanup must handle partial initialization and close only the resources it owns. Strict startup policies, health checks and process supervision belong to the host integration and should be checked together with the application's internal readiness.

Continue with [Startup and lifecycle](lifecycle.md), [Server services](../services/integration.md#server-services) and [Choose a deployment method](../../deployment/choose-a-deployment-method.md).

## Interfaces and implementation

- [Application](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [Server runtime declaration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/templates/app-template-default/server/runtime.ts)
