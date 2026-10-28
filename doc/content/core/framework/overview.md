---
title: Framework features overview
description: Explore the runtime, business service, data access and operational mechanisms shared by apps and plugins as needed.
---

Framework features document mechanisms shared by application and plugin development. New users can start by [creating an app](../getting-started/create-app.md) and [building a first feature](../tutorials/build-your-first-feature.md), then consult these topics when a specific question arises.

## Applications, plugins and the framework

- **Developing apps** organizes pages, APIs, data and tests around a business requirement and explains how to connect the code to an application.
- **Developing plugins** organizes independent extensions around entry points, resources, public contracts and delivery, explaining how applications consume them.
- **Framework features** explain shared mechanisms, their usage and boundaries, including dependency injection, database transactions and job execution.

Each shared mechanism is documented here, while application and plugin guides demonstrate integration through examples. Package names and method signatures belong in reference material; learning every package in `node_modules/` is not a prerequisite.

## Business services on both sides

Both the client and server can define business services and register them with ServiceProviders in their respective containers. Instances are independent across the two environments; data crosses that boundary through APIs or other communication mechanisms.

React Providers supply context to the component tree. ServiceProviders register services and manage their lifecycle. Keep business behavior, service registration and UI state responsibilities clear. See [ServiceProviders and service lifecycle](../extension-development/service-provider.md) for a complete client and server example.

## A dedicated database topic

The database topic covers `@nocobase/db` and related packages: connections and dialects, schema, Repositories, filters and association queries, transactions, migrations and seed data. Query inputs and builders belong in the same topic.

For a practical business scenario, start with [Data models and migrations](../developing-apps/data-models-and-migrations.md) and [Querying and manipulating data](../developing-apps/querying-data.md). For plugin-owned data resources, see [Plugin database and migrations](../extension-development/database-and-migrations.md).

## Framework mechanisms and plugin features

- File storage and drivers are framework mechanisms; integrating file records, uploads and access belongs to the file plugin.
- Background jobs, periodic scheduling and queues are framework mechanisms; task configuration, management and execution records belong to the scheduler plugin.
- Basic email delivery is a framework mechanism; integrating email delivery and mailbox synchronization belongs to the mail plugin.
- Authorization and data scope mechanisms belong to the framework; using permission management and rule plugins belongs to plugin integration.

Start with [Using plugins](../using-plugins/overview.md) to integrate existing features into a business application. Consult this section to understand or extend their underlying mechanisms.

## Find a mechanism

| Question | Start here |
| --- | --- |
| How does an application assemble and start? | [Client](runtime/client.md), [Server](runtime/server.md), [CLI](runtime/cli.md), [Lifecycle](runtime/lifecycle.md) |
| How do plugins extend runtimes? | [Plugin loading](runtime/plugins.md), [React Providers](runtime/react-providers.md) |
| How do client and server services work? | [Containers](services/container.md), [Tokens](services/tokens.md), [Client services](services/client-services.md), [Server services](services/server-services.md) |
| How are APIs declared and called? | [Routes](http/routes.md), [Middleware](http/middleware.md), [Validation](http/validation.md), [Repository data APIs](http/repository-routes.md), [API Client](http/api-client.md) |
| How is data modeled, queried and changed? | [Database overview](database/overview.md), with twelve topics |
| How are sessions, access and secrets handled? | [Sessions](security/sessions.md), [Authorization](security/authorization.md), [Secrets](security/secrets.md) |
| How does background work run? | [Jobs](background/jobs.md), [Scheduling](background/scheduling.md), [Queues](background/queues.md) |
| How do records change state? | [Record lifecycle](record-lifecycle.md) |
| How are files stored and emails sent? | [File storage](file-storage.md), [Email](email.md) |
| How do pages learn about changes? | [Realtime topics](realtime/topics.md), [WebSocket](realtime/websocket.md) |
| How is runtime behavior configured and supported? | [Configuration](support/configuration.md), [Localization](support/localization.md), [Caching](support/caching.md), [Logging](support/logging.md), [IDs](support/ids.md) |
| How is document content processed? | [Text extraction](content/document-extraction.md), [Markdown and Mermaid](content/markdown-mermaid.md) |

## Using the examples

Examples focus on one mechanism. Application integration still requires the relevant runtime contributions and Providers. Standalone examples create and close resources themselves; applications and plugins should prefer host services. Declaring an endpoint or schema does not complete authentication, authorization or page integration.

Each topic links versioned public contracts or implementation for comparison with installed packages. Application and plugin guides provide end-to-end development flows; [API reference](../reference/api.md) provides quick contract lookup.
