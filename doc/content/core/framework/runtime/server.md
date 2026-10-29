---
title: Server runtime
---

The server runtime owns configuration, resource paths, service lifecycle and HTTP/WebSocket integration. Separating the business application from the listening host allows the same application to run in standalone servers, commands and tests.

## Runtime and application

```text
server/runtime.ts + server/config/
  → resolved runtime
  → createApp(runtime)
  → Application + ServiceProviders
  → app.start()
  → HTTP / WebSocket host
```

`server/runtime.ts` declares configuration loading, plugins, ServiceProviders, routes and locales. `createApp(runtime)` in `server/app.ts` assembles the application and framework services. `Application` owns `config`, `paths`, `container` and request handling.

`app.start()` completes internal startup. The host opens the network listener, so a Provider's `ready()` does not mean the port is reachable. Tests can send requests through the application's `fetch` boundary without a listener.

## Registering business capabilities

| Contribution | Entry |
| --- | --- |
| Configuration sections | `server/config/` and its aggregation entry |
| Business services | `server/providers/` or plugin `serviceProviders` |
| HTTP endpoints | Application route arrays or plugin `routes` |
| Database resources | `database/<connection>/` or plugin declarations |
| Plugins | `server/plugins.ts` |

Resolve existing database, logging and job services from the host container. A plugin should not create another application container or duplicate host services, which would split connections, state and disposal ownership.

## Requests and shared state

The container normally lives for the process; identity and input belong to each request. Never store a current user in a singleton field. Validate identity at the route boundary, pass necessary inputs to services, and pass transaction connections explicitly.

Use `app.paths` instead of assuming a working directory. Uploaded files and SQLite databases need persistent locations outside replaceable build output.

## Failure and shutdown

Create, check and release resources in asynchronous lifecycle hooks. Cleanup must tolerate partial initialization and close only owned resources. Host startup policy, health checks and process supervision should account for internal readiness as well.

Continue with [Lifecycle](lifecycle.md), [Server services](../services/integration.md#server-services) and [Deployment methods](../../deployment/choose-a-deployment-method.md).

## Interfaces and implementation

- [Application](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [Server runtime declaration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/templates/app-template-default/server/runtime.ts)
