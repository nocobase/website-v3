---
title: Application startup and lifecycle
description: Learn the stages of the Provider lifecycle and their order, who owns which resources, and how to handle startup failures and shutdown.
---

The lifecycle separates service declarations, asynchronous initialization, consumer startup and cleanup into clear stages. Applications and plugins follow the same order, so before using a dependency you know which stage it has completed.

## Stage order

```text
Server: validate → register → locales → boot → routes → start → ready
Client: register → boot → render configuration → validation → start → ready
Shutdown: reverse Provider order
```

Each stage visits every Provider before the next stage begins; a Provider does not run all of its hooks at once. After the ready stage, the server also handles the template's sample-data logic, which is not part of any business request's transaction.

| Hook | Suitable work |
| --- | --- |
| `register()` | Synchronously bind instances or lazy factories |
| `boot()` | Resolve dependencies, prepare asynchronously, register handlers |
| `start()` | Begin listening, subscribing or consuming background work |
| `ready()` | Finish internal preparation once every Provider has started |
| `shutdown()` | Stop and await the resources it owns |

Server route factories run after `boot()` and before `start()`. They can resolve services, but cannot assume consumers are already working. On the client, the host renders the React tree only after the application has started successfully.

## Dependencies and resource ownership

When a service needs another Provider's service, only declare a factory during registration and resolve the dependency at the appropriate stage. When one Provider depends on another resource being started first, arrange that order explicitly in the aggregation entry instead of relying on the incidental order of file names.

During shutdown, use `resolveIfCreated()` to check whether an instance was created, so that you do not create a service for the first time just to close it. Shared resources such as the database are closed by their owners; consumers release only their own subscriptions, job handlers or connection handles.

## Startup failure and verification

Cleanup must handle partial initialization and be safe to run more than once. Do not hide shutdown failures with an empty `catch`; record the cause so the host can decide whether the process can exit cleanly. Business code should verify these paths: normal startup, a missing dependency, an initialization failure, and shutdown while work is in progress.

`ready()` only means the application's internal stages are complete. Whether the external port, the reverse proxy and the database are available still needs the corresponding health checks. For a complete Provider example, see [ServiceProviders and service lifecycle](../../extension-development/service-provider.md).

## Interfaces and implementation

- [Provider registry](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider/src/registry.ts)
- [Server lifecycle](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [Client lifecycle](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
