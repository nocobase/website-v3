---
title: Request validation and responses
---

Validate external input before business logic and report outcomes through stable responses. TypeScript constrains development code, not runtime input.

## Input validation

```ts
import { Hono } from 'hono';
import { z } from 'zod';
import { apiValidator, defineApiRoutes } from '@nocobase/app-server/router';

const input = z.object({ title: z.string().trim().min(1).max(120) });
export default defineApiRoutes(() => {
  const router = new Hono();
  router.post('/example/normalize', apiValidator('json', input), (context) => {
    const value = context.req.valid('json');
    return context.json({ data: { title: value.title } });
  });
  return router;
});
```

This example normalizes text without storing it. `apiValidator()` accepts Standard Schema-compatible validators; `context.req.valid()` returns validated input. Use the appropriate targets for route parameters, query strings and forms.

Define ranges, lengths, permitted fields and business-state constraints. Valid syntax does not establish identity, permissions or consistency; a caller-supplied ownerId is not the current user.

## Success and errors

Custom APIs can consistently return `{ data, meta }` with documented pagination semantics. `ApiClient.request()` preserves the entire body rather than unwrapping `data`.

```ts
import { ApiError } from '@nocobase/app-server/router';

throw new ApiError({
  status: 'NOT_FOUND',
  reason: 'ORDER_NOT_FOUND',
  domain: 'orders',
  message: 'The requested order was not found.',
});
```

The framework converts `ApiError` into a standard response with `error`. `status` determines the HTTP category, while `domain` and `reason` provide stable machine identifiers. Do not branch on developer-facing `message`. Supply translated user text and report field problems through `fieldViolations` where needed.

## Streams and interruption

Once streaming starts, the response cannot become a normal JSON error. Define stream completion/error semantics and release resources on cancellation. A timeout response also does not undo committed database work or external requests.

Test valid input, empty values, length boundaries, wrong types, unauthorized access and missing records. See [Request validation and error handling](../../developing-apps/request-validation-and-errors.md) for a complete business example.

## Interfaces and implementation

- [API error contract](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/api-error.ts)
- [Validation and OpenAPI](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/openapi/index.ts)
