---
title: Middleware
description: Learn how to declare and connect HTTP middleware, the order in which middleware runs, and how to handle request limits and errors.
---

Middleware handles request behavior shared by several endpoints, such as resolving identity, limiting requests and setting response headers. Register it with an explicit path and order, and keep business workflows in services.

## Declaration and integration

```ts
import { defineHttpMiddleware } from '@nocobase/app-server/router';

export const responseHeaders = defineHttpMiddleware({
  name: 'example.response-headers',
  register(router) {
    router.use('/api/*', async (context, next) => {
      await next();
      context.header('X-Content-Type-Options', 'nosniff');
    });
  },
});
```

Call `app.addHttpMiddleware(responseHeaders)` while assembling the application, before the application starts and routes are registered. Plugins can also connect their own middleware during the stages that allow contributions to be registered.

The registration callback receives the application's root Router, so `/api/*` is relative to the application, and the host adapts the external base path. Logic that applies to a single route module can call `use()` directly on the Hono Router that the module returns.

## Execution order

Middleware runs the code before `await next()` first, and the code after it once the downstream handlers have finished. To reject a request, return a response directly or throw a framework API error, without calling the next handler.

Identity must be resolved before any authorization check that depends on it. Avoid reading the request body in one middleware and having downstream code read it again in a different way, especially for streaming uploads; share parsed results through an explicit context contract.

## Limits and errors

Common request size limits, timeouts and rate limits can be set in one place through the `api` configuration. In-process rate-limit counters are not global across instances, and behind a reverse proxy the client address must be checked against the actual deployment.

Middleware should not wrap unknown errors as successful responses. Log the request identifier, duration and outcome, and avoid logging cookies, Authorization headers or complete request bodies containing sensitive data.

Tests should cover matching and non-matching paths, not continuing after a rejection, error responses and the order of several middleware. See also [Request validation and responses](validation.md) and the [Configuration reference](../../reference/configuration.md).

## Interfaces and implementation

- [Middleware declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/routes.ts)
- [Routing lifecycle](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [API limits](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/api-limits.ts)
