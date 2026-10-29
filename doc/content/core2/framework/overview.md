---
title: Framework overview
description: Learn the framework mechanisms shared by applications and plugins, what each core package is responsible for, and how they relate to plugin features.
---

This chapter explains the mechanisms that applications and plugins share, along with the responsibilities, usage and runtime boundaries of the core `@nocobase/*` packages. To implement pages, APIs or plugins, start with [Developing apps](../developing-apps/overview.md) or [Developing plugins](../extension-development/when-to-write-a-plugin.md), and come back here when you need to understand a specific mechanism.

## Runtimes and shared mechanisms

An application assembles the client, server and CLI runtimes, and plugins contribute through public entries. Both use the same service contracts; only the place where they register differs.

| What you want to know | Where to read |
| --- | --- |
| How an application starts and how plugins take part | [Client runtime](runtime/client.md), [Server runtime](runtime/server.md), [Command-line runtime](runtime/cli.md), [Plugin loading and extensions](runtime/plugins.md), [Application startup and lifecycle](runtime/lifecycle.md) |
| How business services are registered, shared and released | [Service containers](services/container.md), [Service contracts and tokens](services/tokens.md), [ServiceProviders](../extension-development/service-provider.md), [Client and server service integration](services/integration.md) |
| How React contexts join the page tree | [React Provider registration and mounting](runtime/react-providers.md) |
| How HTTP APIs are declared and called | [Routes and request context](http/routes.md), [Middleware](http/middleware.md), [Request validation and responses](http/validation.md), [Repository data APIs](http/repository-routes.md), [API Client](http/api-client.md) |

Service containers and dependency injection apply on both the client and the server. The browser and the server each have their own containers, instances and lifecycles. Sharing a Token definition does not share an in-memory object between them; calls across them still go through APIs.

## Core packages

The menu is organized by functionality. Each guide explains a package's mechanism and how it integrates with the host. This chapter focuses on:

| Package | Responsibility | Where to read |
| --- | --- | --- |
| `@nocobase/service-provider` | Containers, Tokens, dependency injection and Provider lifecycle | [Service containers](services/container.md) |
| `@nocobase/db` | Connections, models, queries, transactions and schema evolution | [Database overview](database/overview.md) |
| `@nocobase/caching` | Namespaced caches, counters and Bloom filters | [Caching](support/caching.md) |
| `@nocobase/drive` | File operations and storage drivers | [File storage and drivers](file-storage.md) |
| `@nocobase/jobs` | Background execution and recurring schedules | [Background jobs and executors](background/jobs.md), [Periodic scheduling](background/scheduling.md) |
| `@nocobase/queue` | Message production, consumption and delivery control | [Message queues](background/queues.md) |
| `@nocobase/realtime` | Realtime topics, publishing and subscriptions | [Realtime messages and topic subscriptions](realtime/topics.md) |
| `@nocobase/logging` | Structured logs, outputs and rotation | [Logging](support/logging.md) |
| `@nocobase/snowflake` | IDs based on time, workers and sequences | [ID generation](support/ids.md) |

The database has a chapter of its own, which you can read in order: connections and dialects, modeling, reads and writes, relations, transactions, migrations and seeds. For creating tables and initial data in an application, see [Tables and initial data](../developing-apps/data-models-and-migrations.md); for declaring database resources in a plugin, see [Database resources and migrations](../extension-development/database-and-migrations.md).

## Using packages in applications and plugins

A base package defines a capability, and the application runtime connects its configuration and instances to the host. Most server services are resolved from `app.container` through public Tokens: the database Token comes from `@nocobase/db`, and the host Tokens for caching, storage, jobs and other services come from the corresponding `@nocobase/app-server/*` entries.

Applications and plugins should reuse the host's instances. Business services can receive their dependencies through the constructor, with Providers resolving and assembling them. A plugin manages the executors, subscriptions and topics it registers; the host closes shared instances such as database connections and queue services. Each guide states who owns which resources, and [Client and server service integration](services/integration.md) lists where to register them.

Standalone scripts and tests may create their own package instances, and are then responsible for configuring, starting and releasing them. Examples marked as standalone show that lifecycle; do not copy them into every request.

## Relationship to plugin features

The storage package provides disks and file operations; the file plugin builds file records, uploads and authorized access on top of it. Jobs provides execution and scheduling; the scheduler plugin adds management pages and execution records. Realtime delivers change messages; notification plugins can provide persistent notifications and personal inboxes.

To bring an existing feature into your business, read [Using plugins](../using-plugins/overview.md). To implement lower-level behavior or understand how things run, use this chapter. The index of public entries and parameters is in the [API reference](../reference/api.md).
