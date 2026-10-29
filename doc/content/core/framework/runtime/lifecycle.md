---
title: Application startup and lifecycle
---

Lifecycle stages separate service declarations, asynchronous initialization, consumer startup and cleanup. Apps and plugins share this order, making dependency readiness explicit.

## Stage order

```text
Server: validate → register → locales → boot → routes → start → ready
Client: register → boot → render configuration → validation → start → ready
Shutdown: reverse Provider order
```

Each stage visits all Providers before the next stage starts. The server also handles template sample-data behavior after readiness; this is separate from a business request's transaction.

| Hook | Appropriate work |
| --- | --- |
| `register()` | Bind instances or lazy synchronous factories |
| `boot()` | Resolve dependencies, prepare asynchronously, register handlers |
| `start()` | Begin listeners, subscriptions or consumers |
| `ready()` | Finish internal preparation after all Providers start |
| `shutdown()` | Stop and await owned resources |

Server route factories run after `boot()` and before `start()`. They can resolve services but cannot assume consumers are running. The browser host renders React only after successful application startup.

## Dependencies and ownership

Register factories first and resolve dependencies at the appropriate stage. Express required startup ordering in the aggregation entry rather than relying on incidental filenames.

Use `resolveIfCreated()` during cleanup so shutdown does not create a service for the first time. Owners close shared resources such as databases; consumers release only their own subscriptions, handlers and handles.

## Failure and verification

Cleanup must tolerate partial initialization and repeated calls. Report cleanup failures instead of swallowing them, so the host can determine whether shutdown completed. Verify normal startup, missing dependencies, initialization failure and shutdown while work is active.

`ready()` describes internal readiness. Listener, proxy and database availability still need their respective health checks. See the complete [ServiceProvider example](../../extension-development/service-provider.md).

## Interfaces and implementation

- [Provider registry](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/registry.ts)
- [Server lifecycle](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [Client lifecycle](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
