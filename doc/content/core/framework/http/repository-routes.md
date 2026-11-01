---
title: Repository data APIs
---

`defineRepositoryApiRoutes()` declares HTTP endpoints for selected Collection Repository operations. Clients call `api.repository(name)`; the server parses query input, applies policies, calls the Repository and returns a standard result. Applications and plugins use the same declaration.

The public entry is `@nocobase/app-server/router`, and the current export is named `defineRepositoryApiRoutes`. See [Repositories and data operations](../database/repositories.md) for database-side semantics.

## When to use it

| Requirement | Choice |
| --- | --- |
| A list, detail or field edit completed by one Repository operation | Repository endpoints with an explicit access policy |
| An operation checks persisted business state, spans permission scopes or has side effects | A custom route and business service |
| Server-internal data access | Call the database Repository directly |

Editing a personal note title fits this adapter. Submitting an order with state checks, inventory updates and follow-up jobs needs a business endpoint. One resource can use both approaches, chosen per operation. See [HTTP routes and APIs](../../developing-apps/apis-and-services.md).

## Declare and register endpoints

This example deliberately exposes a public category catalog to anonymous readers, returning only `id` and `title`. It assumes an existing `categories` Collection with an auto-incrementing numeric `id` and string `title`; prepare it through [Schema and fields](../database/schema.md) and [Migrations](../database/migrations.md).

Save the declaration as `server/routes/public-categories.ts` in an application, or an equivalent route module in a plugin:

```ts
import { defineRepositoryApiRoutes } from '@nocobase/app-server/router';

export default defineRepositoryApiRoutes({
  repositories: [
    {
      name: 'publicCategories',
      collection: 'categories',
      actions: {
        findMany: { maxLimit: 50 },
        findOne: {},
        count: {},
      },
      policy: {
        read: { scope: true, fields: ['id', 'title'] },
        create: false,
        update: false,
        delete: false,
      },
    },
  ],
});
```

In an application, add its default export to the existing route array in `server/routes/index.ts`. In a plugin, add it to the `routes` array of `defineServerPlugin()`, then register the plugin in the target application. Preserve other routes. Declaration does not execute queries; at runtime, the contribution resolves `databaseManagerToken` from the host container.

This example intentionally publishes category data. Endpoints for users, orders and other business data need authentication and business authorization. The helper does not install authentication middleware, create tables or expose undeclared Collections.

| Option | Meaning |
| --- | --- |
| `name` | HTTP exposure name, also passed to `api.repository(name)` |
| `collection` | Logical database Collection; defaults to `name` |
| `connection` | Configured connection name; defaults to the default connection |
| `actions` | Explicit operations, each with an options object; `{}` uses that operation's defaults |
| `policy` | Required complete Repository policy, or a function deriving one from the request principal |

Use camelCase names starting with a lowercase letter, such as `salesOrders`. Avoid duplicate names, plugin namespace collisions and reserved names including `auth`, `healthz` and `swagger`. `collection` names a logical Collection, not a physical table.

## Enable operations

| Operations | Purpose |
| --- | --- |
| `findMany`, `findOne` | Lists and individual records |
| `count`, `exists` | Count and existence |
| `createOne`, `updateOne`, `deleteOne` | Single-record mutations |
| `aggregate`, `groupBy` | Aggregation and grouping |

Only operations listed in `actions` have routes. The example has no create, update or delete routes. `createMany`, `updateMany`, `deleteMany` and `upsertOne` are currently outside this HTTP adapter even though the database Repository supports them.

`findMany.maxLimit` sets both the default and maximum count, defaulting to `100`. Exceeding the cap returns `400` rather than silently clamping the limit. A request with `limit: 0` returns an empty array, not an unlimited result. This limit applies only to `findMany`; bound aggregation input and computational scope separately.

## Client and HTTP calls

A React page obtains the configured client through `useApiClient()` and passes it to an ordinary function or service:

```ts
import type { ApiClient } from '@nocobase/app-client';

type Category = { id: number; title: string };

export async function loadCategories(api: ApiClient) {
  return await api.repository<Category>('publicCategories').findMany({
    select: (selection) => selection.fields('id', 'title'),
    limit: 20,
  });
}
```

`publicCategories` is the exposure name; the database Collection remains `categories`. This call sends the following request, with any application base path added when deployed under one:

```http
POST /api/publicCategories/findMany
Content-Type: application/json

{
  "select": {
    "kind": "select",
    "version": 1,
    "root": { "kind": "selection", "fields": ["id", "title"], "includes": [] }
  },
  "limit": 20
}
```

Every operation uses `POST /api/{name}/{action}`, including reads. Successful responses use `{ data: result }`:

- `await findMany()` returns the record array because the remote Repository unwraps `data`; ordinary `api.request()` returns the whole response body.
- A missing `findOne()` result is `{ data: null }` over HTTP and becomes `undefined` in the remote client.
- `createOne()` and `updateOne()` return mutation results; use `.record` for the record.
- `deleteOne()` returns a JSON deletion result rather than an empty `204` response.

Remote queries also support query input builders, serialized by the client before transport. HTTP JSON cannot contain functions. Asynchronous iteration of `findMany()` reads an NDJSON stream; consume each query once and do not mix awaiting with iteration. See [API Client](api-client.md) and [Query inputs and builders](../database/query-inputs.md).

## Policies, identity and business authorization

`policy` must declare all four entries: `read`, `create`, `update` and `delete`. `false` denies that operation category, `true` permits its full capabilities, and rule objects constrain scope, fields and relations. `actions` determines whether a route exists; `policy` determines what an existing route may do.

A rule's `fields` is an allowlist; omission does not mean all fields. Relations require explicit rules too. Read policies also govern records returned after mutations. Caller-provided `filter` cannot expand the server's `scope`, and request bodies cannot supply `policy` or `scope`.

Personal notes can use a principal-derived policy. This example assumes an existing `notes` Collection with `id`, `title` and a string `ownerId` user identifier:

```ts
import {
  defineRepositoryApiRoutes,
  type DefineRepositoryApiRoutesOptions,
} from '@nocobase/app-server/router';

type Principal = { userId: string };
type ResolvePrincipal = NonNullable<
  DefineRepositoryApiRoutesOptions<Principal>['principal']
>;

export function createNoteRoutes(resolvePrincipal: ResolvePrincipal) {
  return defineRepositoryApiRoutes<Principal>({
    principal: resolvePrincipal,
    repositories: [
      {
        name: 'myNotes',
        collection: 'notes',
        actions: { findMany: {}, createOne: {}, updateOne: {} },
        policy: ({ userId }) => ({
          read: { scope: { ownerId: userId }, fields: ['id', 'title'] },
          create: {
            scope: { ownerId: userId },
            fields: ['title'],
            defaults: { ownerId: userId },
          },
          update: { scope: { ownerId: userId }, fields: ['title'] },
          delete: false,
        }),
      },
    ],
  });
}
```

Call `createNoteRoutes(resolvePrincipal)` and register the returned contribution. The application's authentication integration supplies `resolvePrincipal`, obtaining `userId` from a verified session or identity context, never the body or an unverified header. This function does not perform login verification itself.

A dynamic policy requires a `principal` resolver. Returning `null` or `undefined` refuses the request with `403`. This example limits reads and writes to the current user's notes, supplies `ownerId` on creation from the server and accepts only `title` from callers.

For administrator-configured roles, business actions and data scopes, integrate the authorization plugin's `authz.database.authorizeRepository()`. It maps exposure operations to business actions and adds request policies that intersect the route policy; it cannot expand existing field or scope access. Run authentication first and cover every protected operation. See the complete plugin integration example linked below.

## Validation, errors and API documentation

The adapter requires JSON, caps request bodies at 1 MiB and validates the allowed options for each operation. Repository validates fields, query ASTs and mutation structures. Implement business-specific text limits, state checks and cross-record constraints explicitly; complex operations need custom handlers.

Errors use the standard `{ error: ... }` envelope: invalid input normally returns `400`, policy denial `403`, missing records `404`, and version or single-record cardinality conflicts `409`. Non-JSON content returns `415` and oversized bodies `413`. Inspect `status` and `reason` for handling; see [Validation and responses](validation.md).

Enabled Repository endpoints generate OpenAPI descriptions from their Collection and operation. Optional `computedFields` only documents additional read-only response fields; it neither computes fields nor changes responses. API documentation does not replace per-request authorization.

## Interfaces and implementation

- [Repository route declarations and implementation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/repository-routes.ts)
- [Repository route contract tests](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/tests/repository-routes.test.ts)
- [Remote Repository client](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/api-client/README.md)
- [Authorization plugin integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authorization/skills/nocobase-app-plugin-authorization/references/repository-routes.md)
