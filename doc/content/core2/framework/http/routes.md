---
title: Routes and request context
description: Learn how HTTP routes mount under the API prefix or the application root, what the request context provides, and where authorization and endpoint exposure boundaries lie.
---

HTTP endpoints join the application as route contributions: route factories obtain services during application startup, and handlers read input and identity each time a request arrives.

## API prefix and root path

```ts
import { Hono } from 'hono';
import { defineApiRoutes } from '@nocobase/app-server/router';

export default defineApiRoutes(() => {
  const router = new Hono();
  router.get('/example/ping', (context) => context.json({ data: { ok: true } }));
  return router;
});
```

Add this declaration to the route array in the application's `server/routes/index.ts`, or to a plugin's `routes`. Without an extra base path, the example endpoint answers at `/api/example/ping`. It is a public probe that reads no business data.

`defineApiRoutes()` mounts under the API prefix; `defineRootRoutes()` mounts at the application root and suits entries that need their own protocol boundary. When the application is deployed under a subpath, its base path is added as well; do not hard-code hosts and deployment prefixes in each plugin.

## The context of each request

The Hono Context provides `req.param()`, `req.query()`, access to the request body and response methods. Path and query parameters start out as strings; declaring a type does not mean external input has been validated.

Resolve application services from the container of the route factory's `app` parameter. The authentication integration puts the user's identity into the request context, and the field name and how to read it follow that integration; do not assume every Hono request has a `user`.

## Authorization and endpoint exposure

Identity checks and data policies for routes must be connected explicitly. Hiding a menu in the frontend does not protect an endpoint. For Repository-style endpoints, [`defineRepositoryApiRoutes()`](repository-routes.md) lets you list Collections, actions and complete policies explicitly; it does not expose every table automatically, and it does not create database structure. For declaration, registration, permission policies and client calls, see [Repository data APIs](repository-routes.md).

Duplicate API paths and methods fail the startup checks. Register OpenAPI documentation with description helpers from `@nocobase/app-server/router`, such as `describeRoute`, so that metadata from different copies of a dependency is not mixed.

See also [Request validation and responses](validation.md), [API Client](api-client.md) and, for plugins, [Routes and HTTP APIs](../../extension-development/server-apis.md).

## Interfaces and implementation

- [Route declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/routes.ts)
- [Repository routes](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/README.md)
