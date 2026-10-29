---
title: Framework overview
---

This chapter explains mechanisms shared by applications and plugins, along with the responsibilities, usage and runtime boundaries of core `@nocobase/*` packages. Start with [Developing apps](../developing-apps/overview.md) or [Developing plugins](../extension-development/when-to-write-a-plugin.md) for implementation workflows, and return here for the underlying mechanisms.

## Runtimes and shared mechanisms

An application assembles the client, server and CLI runtimes. Plugins contribute through public entries. Both use the same service contracts, with different registration locations.

| Question | Reading |
| --- | --- |
| How do applications start and plugins participate? | [Client runtime](runtime/client.md), [Server runtime](runtime/server.md), [CLI runtime](runtime/cli.md), [Plugin loading](runtime/plugins.md), [Startup and lifecycle](runtime/lifecycle.md) |
| How are business services registered, shared and released? | [Service containers](services/container.md), [Contracts and Tokens](services/tokens.md), [ServiceProviders](../extension-development/service-provider.md), [Client and server integration](services/integration.md) |
| How do React contexts join the page tree? | [React Providers](runtime/react-providers.md) |
| How are HTTP APIs declared and called? | [Routes and request context](http/routes.md), [Middleware](http/middleware.md), [Validation and responses](http/validation.md), [Repository APIs](http/repository-routes.md), [API Client](http/api-client.md) |

Containers and dependency injection apply on both sides. The browser and server have separate containers, instances and lifecycles. Sharing a Token definition does not share an in-memory object across them; cross-runtime calls still use APIs.

## Core packages

Menu topics follow functionality. Each explains the package mechanism and host integration. This chapter focuses on:

| Package | Responsibility | Reading |
| --- | --- | --- |
| `@nocobase/service-provider` | Containers, Tokens, dependency injection and Provider lifecycle | [Service containers](services/container.md) |
| `@nocobase/db` | Connections, models, queries, transactions and schema evolution | [Database](database/overview.md) |
| `@nocobase/caching` | Namespaced caches, counters and Bloom filters | [Caching](support/caching.md) |
| `@nocobase/drive` | File operations and storage drivers | [File storage and drivers](file-storage.md) |
| `@nocobase/jobs` | Background execution and recurring schedules | [Background jobs](background/jobs.md), [Scheduling](background/scheduling.md) |
| `@nocobase/queue` | Message production, consumption and delivery controls | [Message queues](background/queues.md) |
| `@nocobase/realtime` | Realtime topics, publication and subscriptions | [Realtime communication](realtime/topics.md) |
| `@nocobase/logging` | Structured logs, outputs and rotation | [Logging](support/logging.md) |
| `@nocobase/snowflake` | IDs based on time, workers and sequences | [ID generation](support/ids.md) |

Database coverage has its own chapter: connections and dialects, modeling, reads and writes, relations, transactions, migrations and seeds. For application files, see [Tables and initial data](../developing-apps/data-models-and-migrations.md); for plugin resource declarations, see [Database resources and migrations](../extension-development/database-and-migrations.md).

## Using packages in applications and plugins

The base package defines the capability; the application runtime integrates configuration and instances into the host. Most server services are resolved from `app.container` through public Tokens. The database Token comes from `@nocobase/db`; host Tokens for caching, storage, jobs and other services come from the corresponding `@nocobase/app-server/*` entries.

Applications and plugins should reuse host instances. Business services can accept constructor dependencies, with Providers resolving and assembling them. Plugins manage the executors, subscriptions and topics they register; the host closes shared instances such as database connections and queue services. Each guide describes resource ownership. See [Client and server integration](services/integration.md) for registration locations.

Standalone scripts and tests may create their own instances and then own configuration, startup and cleanup. Examples labeled standalone demonstrate that lifecycle; do not create them per request.

## Relationship to plugin features

The storage package provides disks and file operations; the file plugin adds records and uploads, while the application protects private content access. Jobs provides execution and scheduling; the scheduler plugin adds execution records and enable/disable APIs, with management pages composed by the application. Realtime delivers changes; notification plugins can provide persistent notifications and personal inboxes.

For integrating existing features, read [Using plugins](../using-plugins/overview.md). For implementing lower-level behavior, use this chapter. Public entries and parameter indexes are in [API reference](../reference/api.md).
