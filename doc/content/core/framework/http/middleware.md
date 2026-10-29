---
title: Middleware
---

Middleware handles cross-cutting request behavior such as identity parsing, limits and response headers. Register it with explicit paths and ordering while keeping business workflows in services.

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

Call `app.addHttpMiddleware(responseHeaders)` during application composition, before startup and route registration. Plugins can contribute middleware during stages where contributions remain mutable.

The registration callback receives the application's root Router, so `/api/*` is application-relative. The host adapts external base paths. Logic local to a route module can use `use()` on that module's Hono Router.

## Execution order

Code before `await next()` runs on the way in; code after it runs after downstream handling. To refuse a request, return a response or throw an API error without calling the next handler.

Identity must be established before identity-dependent authorization. Avoid consuming request bodies twice, especially streaming uploads; share parsed values through an explicit context contract.

## Limits and failures

Use `api` configuration for common body limits, timeouts and rate limiting. Per-process limits are not deployment-wide counters, and client addresses behind a proxy depend on actual hosting.

Do not wrap unknown failures as successful responses. Log request identifiers, duration and outcomes without cookies, authorization headers or sensitive bodies.

Test path matching, short-circuit refusal, errors and middleware ordering. See [Validation](validation.md) and [Configuration reference](../../reference/configuration.md).

## Interfaces and implementation

- [Middleware declarations](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/routes.ts)
- [Routing lifecycle](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [API limits](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/api-limits.ts)
