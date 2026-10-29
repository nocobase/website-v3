---
title: Request validation and error handling
description: Declare the input and response contracts of an API, turn business errors into stable API errors, and verify data behavior on failure.
---

A request passes three kinds of check: validation turns external input into values the business can accept; permission checks decide whether the operation is allowed; and the service then decides whether the current business state permits the change. Each has its own responsibility, and none can replace another.

The excerpts below come from the [project API example](apis-and-services.md); running them requires the historical application, data model and services listed on that page. This guide only explains the input and error conventions in one place and does not build another set of endpoints.

## Declare input schemas

```ts
import { z } from 'zod';

export const listInput = z.strictObject({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const createInput = z.strictObject({
  name: z.string().trim().min(1).max(120),
});
export const assignInput = z.strictObject({
  projectId: z.uuid().nullable(),
});
```

Query parameters are converted from strings to integers, with defaults and a bounded page size; names are trimmed before their length is checked. `strictObject()` rejects extra fields, so a whole form object cannot be submitted as writable fields. `null` clears the project association, while a missing `projectId` violates this example's contract.

`z.uuid()` is used here because this example's contract makes project and task IDs UUIDs; do not copy that restriction to other identifiers such as the application's user IDs. Note also that an input schema does not check whether a database record exists, or whether the user may choose it.

## Use the validated values

Pass the schema to `apiValidator('query' | 'param' | 'json', schema)`, and have the handler read only the matching `c.req.valid(...)`. For the complete form, see [Routes and HTTP APIs](apis-and-services.md). This validation also declares the input in the API documentation; calling `zod.parse()` inside the handler alone does not provide that integration.

JSON requests must send `Content-Type: application/json`. Identity, action permissions, middleware order and input validation must all be settled before any business write; validating input after a write has happened cannot undo it.

## Response and error conventions

Input passes through `apiValidator()` first, and business code reads only the validated values. Clients must not freely set IDs or creation times that the server generates, or fields that do not belong to the operation. Select output fields explicitly, and use the same permission policy and filters for a paginated list and its total.

| Situation | Handling in this example |
| --- | --- |
| Successful query | `200` with `{ data, meta }`, where `meta` contains the pagination |
| Successful creation | `201` with `{ data }` |
| Successful change | `200` with `{ data }`, containing only the fields this operation produces |
| Invalid input | `400` with a standard API error; errors that can be pinned to a field include field details |
| Not signed in, or action denied | `401` or `403` respectively, with no business write |
| Task does not exist or is outside the operation's scope | `404`, revealing nothing about records outside the scope |
| Target project does not exist or may not be chosen | `400` with one consistent project field error; the existing association stays unchanged |

Express errors through `ApiError` and the standard handler: do not hand-write another error JSON format, and do not wrap failures in a `200`. Known business errors can become specific API errors, while unknown exceptions go to standard error handling; never disguise them all as "invalid input".

## Turn business errors into API errors

The project route file already declares or imports `router`, `ApiError`, `apiErrorHandler` and both business error classes. This is the error-handling excerpt from that file:

```ts
router.onError((error, c) =>
    apiErrorHandler(
      error instanceof ProjectUnavailableError
        ? new ApiError({
            status: 'INVALID_ARGUMENT',
            reason: 'PROJECT_UNAVAILABLE',
            domain: 'tutorialProjects',
            message: error.message,
            fieldViolations: [
              {
                field: 'projectId',
                description: 'Choose an available project.',
              },
            ],
          })
        : error instanceof TaskUnavailableError
          ? new ApiError({
              status: 'NOT_FOUND',
              reason: 'TASK_NOT_FOUND',
              domain: 'tutorialProjects',
              message: error.message,
            })
          : error,
      c,
    ),
  );
```

`reason` and `domain` are stable identifiers the client uses to tell error types apart; `message` and the field `description` are for developers and must not be shown directly as localized messages on a page. The client maps the stable identifiers to text and uses `fieldViolations` to place errors on fields; see [Data requests and state management](data-requests-and-state.md).

Convert only the errors this business recognizes. `apiErrorHandler()` handles known API and Repository errors and passes unknown exceptions on to the application's outer handling, which returns a `500` that reveals no internal details. Do not wrap every exception as a `400`. When troubleshooting, match the `requestId` in the response against the server logs.

## Declaring a response does not filter it

`dataResponse()`, `listResponse()` and `apiErrorResponse()` inside `describeRoute()` describe the API contract. They neither replace selecting output fields nor remove sensitive fields automatically at runtime. Services must select the permitted output fields explicitly and convert values such as dates to the agreed format. When an endpoint changes, update the schema, the actual response and the tests together.

## Verify failure paths

At minimum, check missing fields, empty strings, extra fields, invalid IDs, and negative or excessively large page numbers; then check records that do not exist and records outside the scope. After every rejection, read the database to confirm nothing was written by accident. When the input is valid but a business rule is not met, a meaningful error should still be returned. Unknown exceptions must stay server failures and never appear as a successful save.

For the complete tests, see [Routes and HTTP APIs](apis-and-services.md); for the standard error and input protocol, see [Request validation and responses](../framework/http/validation.md).
