---
title: API reference
description: Common public entries and contracts for services, HTTP, configuration and databases in NocoBase 3.
---

This page lists common public APIs, return values and constraints by use case. Consult your installed declarations for complete parameters, overloads and supporting types; database reference chapters are linked below. For workflows, see [Developing apps](../developing-apps/overview.md) and [Framework](../framework/overview.md).

For conceptual guides, see [Framework](../framework/overview.md). Learn schema, queries and transactions in the [Database topics](../framework/database/overview.md).

## Public import entries

| Entry | Common exports | Purpose |
| --- | --- | --- |
| `@nocobase/app-client` | `createApp`、`defineClientPlugin`、`defineAppRoutes`、`useService`、`useApiClient` | Client assembly, routes, services and requests |
| `@nocobase/app-server` | `defineServerPlugin`、`defineServerPlugins` | Server plugin declarations |
| `@nocobase/app-server/router` | `defineApiRoutes`、`defineRepositoryApiRoutes`、`defineRootRoutes`、`defineHttpMiddleware`、`apiValidator`、`ApiError` | HTTP endpoints, validation and errors |
| `@nocobase/app-server/config` | `defineAppConfig`、`defaultAppConfigs`、`envString`、`envInteger`、`envBoolean` | Server configuration and environment mappings |
| `@nocobase/service-provider` | `ServiceProvider`、`ServiceContainer`、`createServiceToken` | Client/server service containers and lifecycle |
| `@nocobase/api-client` | `createApiClient`、`ApiClientError` | Standalone HTTP client |
| `@nocobase/db` | `createDatabaseManager`、`databaseManagerToken` | Database management and the application database service |

Source directories and npm exports can differ. Import from public entries declared in `package.json`, rather than a dependency's private `src/` or build files. See the [Core and tool package index](packages.md) for package purposes.

## Service containers and dependency injection

Clients and servers use the same service-container concepts, with separate instances in their own runtimes.

| API | Purpose and return value |
| --- | --- |
| `createServiceToken<T>(name)` | Create a typed service identity |
| `container.instance(token, value)` | Register an existing instance; returns `void` |
| `container.singleton(token, factory)` | Register a synchronous factory, created and cached on first resolution |
| `container.resolve(token)` | Return the service; throw for missing registration or circular dependencies |
| `container.has(token)` | Check registration |
| `container.resolveIfCreated(token)` | Read an existing instance without creating it; may return `undefined` |
| `ServiceProvider.register()` | Register services synchronously |
| `boot()`, `start()`, `ready()`, `shutdown()` | Asynchronous Provider lifecycle hooks |

```ts
import { createServiceToken, ServiceContainer } from '@nocobase/service-provider';

interface GreetingService {
  greet(name: string): string;
}

const greetingToken = createServiceToken<GreetingService>('example.greeting');
const services = new ServiceContainer();
services.singleton(greetingToken, () => ({
  greet: (name) => `Hello, ${name}`,
}));

const message = services.resolve(greetingToken).greet('NocoBase');
// Hello, NocoBase
```

A container cannot bind the same token twice. Creating a new token with the same name does not recreate its identity: consumers must import the provider's exported token. Singleton factories are synchronous; perform asynchronous initialization in lifecycle hooks.

Use the runtime's existing container in an application. React components resolve services with `useService(token)`; server code commonly uses `app.container.resolve(token)`. React Providers supply component-tree context and are distinct from ServiceProviders. See [ServiceProvider](../extension-development/service-provider.md) for registration and execution order.

## Client requests

Call `useApiClient()` inside an application React component to obtain the configured client. Independent callers can use `createApiClient({ baseURL })` from `@nocobase/api-client`, declaring that package as a direct dependency. The application client also re-exports these interfaces and types.

| API | Return value / constraint |
| --- | --- |
| `api.request<T>(options)` | `Promise<T>` containing the complete parsed response body |
| `api.stream(options)` | `Promise<ReadableStream<Uint8Array>>` |
| `api.repository(name)` | Remote client for matching server Repository endpoints |
| `ApiClientError` | Structured HTTP failure, including status information |

Request options include `path`, `method`, `query`, `headers`, `signal` and `credentials`. Use `json` for JSON bodies or `body` for other bodies; do not set both. The default method is `GET`; default credentials are `include`.

```ts
import type { ApiClient } from '@nocobase/app-client';

type Announcement = { id: string; title: string };

export async function loadAnnouncements(api: ApiClient) {
  const response = await api.request<{ data: Announcement[] }>({
    path: '/announcements',
    method: 'GET',
    query: { limit: 20 },
  });
  return response.data;
}
```

This assumes the application provides an announcements endpoint returning `{ data: [...] }`. `request()` preserves the envelope, and a TypeScript generic does not validate the response. Remote `repository()` calls require matching server endpoints; creating a database table does not expose it over HTTP. The server still handles identity, input validation and data permissions.

## Server HTTP

| API | Purpose |
| --- | --- |
| `defineApiRoutes(createRouter)` | Declare Hono routes under the application's API prefix |
| [`defineRepositoryApiRoutes({ repositories, principal? })`](../framework/http/repository-routes.md) | Declare Repository data endpoints with explicit Collections, actions and policies |
| `defineRootRoutes(createRouter)` | Declare routes under the application root |
| `defineHttpMiddleware({ name, register })` | Register named HTTP middleware |
| `apiValidator(target, schema)` | Validate request input |
| `ApiError` | Throw an API error recognized by the framework |

A route factory receives the application and returns a Hono Router. Register the declaration through an application or plugin extension entry. The usual API prefix is `/api`; account for the application's base path as well.

Import OpenAPI description helpers from `@nocobase/app-server/router` to avoid mixing metadata registries from separate dependency copies. With access checks enabled, the application exposes the UI at `/api/swagger` and the document at `/api/swagger/docs`. Default-template access remains subject to identity and permission checks; these are not automatically anonymous endpoint directories.

See [Routes and HTTP APIs](../developing-apps/apis-and-services.md) and [Plugin server APIs](../extension-development/server-apis.md) for complete examples.

## Configuration

| API | Purpose |
| --- | --- |
| `defineAppConfig({ defaults, env, validate, public })` | Define a server configuration section and its rules |
| `defaultAppConfigs({ section: factory })` | Compose configuration sections |
| `config.get<T>(key)` | Read a path; may return `undefined` |
| `config.reload()` | Reload configuration; callers must still handle how services consume new values |

`public` declares browser-readable leaf paths relative to the section. A similarly named client file does not automatically publish server configuration. See the [Configuration reference](configuration.md) for precedence, examples and environment variables.

## Database management

Resolve the existing `databaseManagerToken` in an application. Create and release your own DatabaseManager for independent tools or tests.

| API | Return value / purpose |
| --- | --- |
| `createDatabaseManager(config)` | Create a manager |
| `db.connection(name?)` | Get a connection; defaults to the configured default connection |
| `db.connect(name?)` | Connect asynchronously and return the connection |
| `db.builder(name?)` | Get a CollectionBuilder |
| `db.query(name?)` | Get a QueryAdapter |
| `db.collections(name?)` | Get Collection discovery and diagnostics |
| `db.repository(collection, connection?)` | Get a Repository for a logical Collection |
| `db.transaction(callback, name?)` | Execute a callback on a transaction connection and return its result |
| `db.destroy()` | Release the manager's database resources |

`db.builder()` is a method; `connection.builder` is a property. `CollectionBuilder` is exported only as a type: obtain an instance from the database instead of calling `new CollectionBuilder()`.

## Repository return values

| Method | Return value / important behavior |
| --- | --- |
| `findMany(options?)` | Lazy `RepositoryQuery`; await an array or iterate records asynchronously |
| `findOne(options)` | One record or `undefined`; does not prove filter uniqueness |
| `count(options?)`, `exists(options?)` | Count / existence |
| `createOne({ values, ... })` | Single mutation result; read its `.record` |
| `updateOne({ filter, values, ... })` | Single mutation result; rejects missing or ambiguous targets |
| `upsertOne({ filter, create, update, ... })` | Single mutation result; requires uniquely identifying filters |
| `deleteOne({ filter, ... })` | Deletion result; specify `select` when a returned record is needed |
| `createMany`, `updateMany`, `deleteMany` | Bulk results with counts and optionally returned records |

Do not mix awaiting and asynchronous iteration on the same `findMany()` query, or consume it repeatedly. Bulk update and deletion require a filter or explicit `all: true`.

`context` supplies query variables, not a transaction handle. Obtain Repositories from the callback's transaction connection; an outer connection's Repository does not automatically join it. The Builder's `transaction()` method currently does not start a database transaction either.

Repositories do not infer the current HTTP user. Derive a policy from authorization and apply `withPolicy()` for row and field permissions; a user-supplied filter is not authorization. See [Query and manipulate data](../developing-apps/querying-data.md).

## Full declarations and database chapters

- [Database API contents](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/README.md)
- [Public export inventory](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/exports.md)
- [DatabaseManager](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/database-manager.md)
- [Connections and dialect contracts](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/connection.md)
- [Migrations and seeds](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/migration-and-seed.md)
- [Collections, fields, relations and metadata](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/collection-and-schema.md)
- [Query](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/query.md)
- [Repository](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/repository.md)
- [Permission policies](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
- [Transactions](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/transactions.md)
- [Database events](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/events.md)
- [Testing tools](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/testing.md)

These links are pinned to Core revision `015404ecd0db` (2026-10-26), including full signatures, export boundaries and known limitations. The [package index](packages.md) links client, HTTP and configuration sources at the same revision. Also inspect your lockfile and locally installed types: packages do not share one version number.

The service, request and configuration examples passed type checking and execution. An in-memory SQLite check also verified single-mutation return values, queries and transaction rollback, using the installed dependencies of default template beta.83 without connecting to external databases.
