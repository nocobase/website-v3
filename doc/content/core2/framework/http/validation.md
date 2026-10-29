---
title: Request validation and responses
description: Learn how to validate API input at runtime, define the structure of success and error responses, and handle streaming responses and interrupted requests.
---

An endpoint validates external input before running business logic, and reports the outcome through a stable response structure. TypeScript types only constrain code at development time and cannot replace runtime validation.

## Validate input

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

The example only normalizes text and stores nothing. `apiValidator()` accepts Standard Schema-compatible validators, and `context.req.valid()` returns the validated value. For input in other places, use the corresponding path parameter, query or form validation.

Make ranges, lengths, allowed fields and business states explicit. After format validation passes, identity, permissions and business consistency still need checking; never treat an ownerId submitted by the user as the current user.

## Success and failure

Custom endpoints can consistently return `{ data, meta }` and establish stable conventions for meanings such as pagination. `ApiClient.request()` keeps the whole response body and does not unwrap `data` automatically.

```ts
import { ApiError } from '@nocobase/app-server/router';

throw new ApiError({
  status: 'NOT_FOUND',
  reason: 'ORDER_NOT_FOUND',
  domain: 'orders',
  message: 'The requested order was not found.',
});
```

The framework turns an `ApiError` into a standard failure response containing `error`. `status` maps to the HTTP status category, while `domain` and `reason` are stable machine identifiers; the developer-facing `message` must not be used for branching on the client. Use translated text for messages shown to users, and report field-level problems through `fieldViolations`.

## Streaming responses and interruption

Once a stream has started sending, it cannot be turned into an ordinary JSON error response. A streaming protocol needs its own conventions for completion and errors, and must release resources after cancellation. A timeout response also does not automatically undo database commits or external requests that have already happened.

Tests should cover valid input, empty values, boundary lengths, wrong types, unauthorized access and missing records. Tests of only the success path cannot prove that the endpoint's boundaries are complete. For a complete business example, see [Request validation and error handling](../../developing-apps/request-validation-and-errors.md).

## Interfaces and implementation

- [API error contract](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/api-error.ts)
- [Validation and OpenAPI](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/openapi/index.ts)
