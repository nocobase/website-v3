---
title: Repository data APIs
description: Use defineRepositoryApiRoutes() to declare HTTP endpoints for the Repository operations of selected Collections, and configure enabled operations, access policies, identity and business authorization.
---

`defineRepositoryApiRoutes()` declares the Repository operations of selected Collections as HTTP endpoints. Clients call them through `api.repository(name)`; the server parses the query input, applies the policies, calls the Repository and returns a result in a standard format. Applications and plugins use the same declaration.

The public entry is `@nocobase/app-server/router`, and the current export is named `defineRepositoryApiRoutes`. For the semantics of the operations on the database side, see [Repositories and data operations](../database/repositories.md).

## When to use it

| Requirement | Choice |
| --- | --- |
| A list, a detail view or a field edit that one Repository operation can complete | Repository data APIs with an access policy |
| A query or change that involves stored business state, several permission scopes or extra side effects | A custom route and business service |
| Data access only inside the server | Call the database Repository directly |

For example, editing the title of a personal note suits this kind of endpoint, while submitting an order needs to check the order state and inventory and trigger follow-up jobs, so it calls for a business endpoint. The same resource can use both approaches, chosen per operation. See also [Routes and HTTP APIs](../../developing-apps/apis-and-services.md).

## Declare and register endpoints

The following example provides a public category catalog that anonymous users can read, returning only `id` and `title`. It assumes an existing `categories` Collection with an auto-incrementing numeric `id` and a string `title`; prepare the structure first with [Tables and fields](../database/schema.md) and [Database migrations](../database/migrations.md).

Save the declaration as `server/routes/public-categories.ts` in an application, or as an equivalent route module in a plugin:

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

In an application, add the module's default export to the existing route array in `server/routes/index.ts`; in a plugin, add it to the `routes` array of `defineServerPlugin()` and then register the plugin with the target application. Keep the other existing routes. Declaring does not run any queries; at runtime the database is obtained through `databaseManagerToken` in the host container.

This example exposes the category catalog on purpose. For business data such as users or orders, connect authentication and business authorization first. The function does not install authentication middleware, create tables or expose Collections that are not declared.

| Option | Meaning |
| --- | --- |
| `name` | The HTTP exposure name, also used in `api.repository(name)` |
| `collection` | The logical Collection name in the database; defaults to `name` |
| `connection` | A configured connection name; defaults to the default connection |
| `actions` | Explicitly enabled operations, each with an options object; `{}` uses that operation's defaults |
| `policy` | Required: a complete Repository policy, or a function that derives one from the request identity |

Use camelCase names that start with a lowercase letter, such as `salesOrders`. Avoid duplicate names, collisions with plugin namespaces and reserved names such as `auth`, `healthz` and `swagger`. `collection` is a logical Collection name, not a physical table name.

## Which operations to enable

| Operation | Purpose |
| --- | --- |
| `findMany`, `findOne` | Lists and single records |
| `count`, `exists` | Counts and existence checks |
| `createOne`, `updateOne`, `deleteOne` | Creating, updating and deleting one record |
| `aggregate`, `groupBy` | Aggregation and grouping |

Only the operations that appear in `actions` get routes. The example above has no create, update or delete routes. `createMany`, `updateMany`, `deleteMany` and `upsertOne` are currently not operations of this HTTP adapter; even though the database Repository supports them, they are not exposed automatically.

`findMany.maxLimit` sets both the default number of records returned and the maximum allowed, and defaults to `100`. A request above the limit returns `400` instead of being truncated silently. A request with `limit: 0` returns an empty array and cannot be used to mean "no limit". This limit applies only to `findMany`; for aggregation and grouping, bound the input and the scope of computation separately.

## Client and HTTP calls

A React page gets the configured API Client through `useApiClient()` and passes it to an ordinary function or service:

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

`publicCategories` here is the exposure name, while the Collection in the database is still called `categories`. The call sends the request below; when the application is deployed under a base path, the request address also includes that path:

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

Every operation uses `POST /api/{name}/{action}`, including queries. A successful response is `{ data: result }`:

- `await findMany()` returns the record array directly, because the remote Repository has already unwrapped `data`; an ordinary `api.request()` returns the whole response body.
- When `findOne()` finds no record, HTTP returns `{ data: null }`, which the remote client turns into `undefined`.
- `createOne()` and `updateOne()` return mutation results; get the record from `.record`.
- `deleteOne()` returns a JSON deletion result, not an empty `204` response.

Remote queries also support query input builders, which the client converts into transferable JSON first; functions cannot be sent directly in HTTP JSON. `findMany()` can read an NDJSON stream through asynchronous iteration; consume each query object only once, and do not mix `await` with iteration. See [API Client](api-client.md) and [Query inputs and builders](../database/query-inputs.md).

## Policies, identity and business authorization

`policy` must declare all four entries, `read`, `create`, `update` and `delete`: `false` denies that category of operations, `true` allows all of its capabilities, and a rule object restricts the data scope, fields and relations. `actions` determines whether a route exists; `policy` determines what an existing route may do.

`fields` in a rule is an allowlist; omitting it does not mean all fields are allowed. Relation operations also need explicit rules. The read policy also applies to records returned after a write. A `filter` submitted by the client cannot widen the server's `scope`, and the request body cannot submit `policy` or `scope`.

Personal notes can use a policy derived from identity. The example below assumes `notes` already has `id`, `title` and `ownerId` fields, where `ownerId` is a string user identifier:

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

To connect it, call `createNoteRoutes(resolvePrincipal)` and register the route declaration it returns. `resolvePrincipal` is provided by the application's authentication integration and gets `userId` from a verified session or identity context; never read it from the request body or an unverified header. The function itself does not verify sign-in.

A dynamic policy requires a `principal` resolver; when it resolves to `null` or `undefined`, the request is rejected with `403`. The example above only allows reading and writing the current user's own notes; on creation the server fills in `ownerId`, and callers can only provide `title`.

When administrators need to configure roles, business actions and data scopes, also connect the authorization plugin's `authz.database.authorizeRepository()`. It maps exposure names and operations to business actions and adds request policies that are intersected with the policy here; it never relaxes existing field or scope restrictions. Authentication must run first and cover every operation that needs protection. For how to connect the plugin, see the authorization plugin integration under "Interfaces and implementation" at the end of this page.

## Validation, errors and API documentation

The adapter requires a JSON request body of at most 1 MiB and validates the allowed input options for each operation; fields, query ASTs and mutation structures are validated by the Repository. Business-specific text lengths, state checks and cross-record constraints still have to be implemented explicitly, and complex operations should use custom handlers.

Errors use the standard `{ error: ... }` structure: invalid input usually returns `400`, a policy denial `403`, a missing record `404`, and a version conflict or a single-record cardinality conflict `409`; content that is not JSON returns `415`, and an oversized body `413`. Base business handling on `status` and `reason`; see [Request validation and responses](validation.md).

Enabled Repository endpoints generate OpenAPI descriptions from their Collection and operation. The optional `computedFields` only documents extra read-only fields in the response; it neither computes fields nor changes the response. API documentation does not replace the permission checks on every request.

## Interfaces and implementation

- [Repository route declarations and implementation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/repository-routes.ts)
- [Repository route contract tests](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/tests/repository-routes.test.ts)
- [Remote Repository client](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/api-client/README.md)
- [Authorization plugin integration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authorization/skills/nocobase-app-plugin-authorization/references/repository-routes.md)
