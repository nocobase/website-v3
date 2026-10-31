---
title: Request validation and error handling
description: Declare input and response contracts, translate domain errors into stable API errors and verify failure behavior.
---

Validation converts external input into values business code can use. Authorization decides whether the operation is permitted; the service checks whether the current business state permits the change. These checks have different responsibilities.

The following excerpts come from the [project API example](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/core/developing-apps/apis-and-services.md). Running them requires its historical app, data model and services. This guide explains that example's input and error contracts rather than creating another endpoint set.

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

Query strings become bounded integers with defaults. Names are trimmed before checking length. `strictObject()` rejects extra fields so the entire form cannot silently become writable input. `null` removes the association; omitting `projectId` violates this example's contract.

The example uses `z.uuid()` because its project and task IDs are UUIDs. Do not apply that assumption to other identifiers such as user IDs. Schemas do not establish database existence or permission to select a record.

## Use validated values

Pass schemas to `apiValidator('query' | 'param' | 'json', schema)` and read matching values through `c.req.valid(...)`. See [Historical project API example](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/core/developing-apps/apis-and-services.md) for complete handlers. This also declares API document inputs; calling `zod.parse()` inside a handler alone does not provide that integration.

Send JSON requests with `Content-Type: application/json`. Complete authentication, operation authorization and validation before business writes; validation afterward cannot undo an earlier write.

## Response and error contracts

Validate input with `apiValidator()` and let business code read only validated values. Clients must not freely set server-generated IDs, creation times or fields outside the action. Select response fields explicitly; use the same permission policy and filters for list rows and totals.

| Outcome | Behavior in this example |
| --- | --- |
| Successful query | `200` with `{ data, meta }`; `meta` contains pagination details |
| Successful creation | `201` with `{ data }` |
| Successful update | `200` with `{ data }`, containing only this operation's result fields |
| Invalid input | `400` with a standard API error and field details where applicable |
| Unauthenticated or denied action | `401` or `403`, respectively, without business writes |
| Task missing or outside the operation's scope | `404`, without disclosing out-of-scope record details |
| Target project missing or ineligible | `400` with a consistent project field error; the old association remains |

Use `ApiError` and the shared handler rather than a custom error JSON format or a `200` response for failures. Translate known business failures into specific API errors; leave unknown exceptions to the standard handler instead of treating them all as invalid input.

## Translate domain errors into API errors

The project route already declares or imports `router`, `ApiError`, `apiErrorHandler` and both domain error classes. This is its error-handling excerpt:

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

`reason` and `domain` are stable identifiers for client decisions. `message` and field `description` are developer-facing, not localized UI copy. Clients map identifiers to wording and use `fieldViolations` to locate fields; see [Data requests and state management](data-requests-and-state.md).

Translate only recognized domain failures. `apiErrorHandler()` handles known API/Repository errors and rethrows unknown exceptions so the outer application can produce an opaque `500`. Do not convert every exception into `400`. Use the response's `requestId` to correlate server logs.

## Response declarations do not filter output

`dataResponse()`, `listResponse()` and `apiErrorResponse()` inside `describeRoute()` describe contracts. They do not select fields or automatically remove sensitive data at runtime. Services must explicitly select permitted fields and convert dates or other values to the agreed format. Update schemas, responses and tests together.

## Verify failures

Check missing fields, empty strings, extra fields, invalid IDs and out-of-range pagination, followed by missing and inaccessible records. Read the database after refusals to confirm no unintended writes. Valid syntax with an invalid business state still needs a meaningful failure. Unknown exceptions must remain server failures rather than successful saves.

See [Historical project API example](https://github.com/nocobase/website-v3/blob/963e7d7570b6f4b0a4bb37ba48af54bff2f219e6/doc/content/core/developing-apps/apis-and-services.md) for complete tests and [Validation and response handling](../framework/http/validation.md) for standard input and error contracts.
