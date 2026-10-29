---
title: Routes and request context
---

HTTP endpoints enter the application as route contributions. Factories resolve services during startup; handlers read input and identity for each request.

## API and root scopes

```ts
import { Hono } from 'hono';
import { defineApiRoutes } from '@nocobase/app-server/router';

export default defineApiRoutes(() => {
  const router = new Hono();
  router.get('/example/ping', (context) => context.json({ data: { ok: true } }));
  return router;
});
```

Add this declaration to the application's `server/routes/index.ts` array or a plugin's `routes`. Without an extra base path, it answers at `/api/example/ping`. This public example reads no business data.

`defineApiRoutes()` mounts under the API prefix. `defineRootRoutes()` mounts at the application root for other protocol boundaries. Subpath deployments add their application base path; do not hard-code hosts and deployment prefixes in plugins.

## Per-request context

Hono Context provides `req.param()`, `req.query()`, body access and response methods. Path and query values begin as strings; declared types do not validate external input.

Resolve services from the factory's `app` container. Authentication integrations populate request identity according to their own contracts; do not assume every Hono request has a `user` field.

## Authorization and exposure

Integrate authentication and data policies explicitly. Hidden frontend menus do not protect endpoints. [`defineRepositoryApiRoutes()`](repository-routes.md) can expose named Collections with explicit actions and complete policies; it neither exposes every table nor creates schema. See [Repository data APIs](repository-routes.md) for declaration, registration, policies and client calls.

Duplicate API methods and paths fail startup checks. Register OpenAPI descriptions through helpers such as `describeRoute` from `@nocobase/app-server/router` to avoid mixing metadata registries from separate dependency copies.

See [Validation and responses](validation.md), [API Client](api-client.md) and [Plugin server APIs](../../extension-development/server-apis.md).

## Interfaces and implementation

- [Route declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/routes.ts)
- [Repository routes](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/README.md)
