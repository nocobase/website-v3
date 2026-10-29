---
title: API Client
description: Learn how to obtain and call the configured API Client, the request and response conventions, remote Repositories, and how to handle request state and retries.
---

The API Client handles the application's HTTP address, credentials and request format in one place. Components in the application should use the client that the runtime has already configured, instead of assembling the server address again on every page.

## Obtaining and calling the client

Use `useApiClient()` in React components or hooks; ordinary services receive it as an injected argument or resolve it from `apiClientToken`. The example assumes the server provides an `/orders` endpoint that returns `{ data: [...] }`:

```ts
import type { ApiClient } from '@nocobase/app-client';

type Order = { id: string; title: string };
export async function loadOrders(api: ApiClient, signal?: AbortSignal) {
  const response = await api.request<{ data: Order[] }>({
    method: 'GET',
    path: '/orders',
    query: { limit: 20 },
    signal,
  });
  return response.data;
}
```

`path` is relative to the API address configured for the client. The default method is GET, and `credentials` defaults to `include`; cross-origin requests are still subject to the browser's cookie and CORS policies.

## Request and response conventions

| Need | Usage |
| --- | --- |
| Query parameters | `query`, with scalar or supported array values |
| JSON request body | `json` |
| FormData and other bodies | `body`; cannot be combined with `json` |
| Cancel a request | `signal` |
| Get the complete response body | `request<T>()` |
| Read a byte stream | `stream()` |
| Repository protocol | `repository(name)` |

Generics only describe the expected response type and do not validate data at runtime. Handle errors returned by the server through `ApiClientError`; pages should distinguish rejected requests, missing permissions, cancellation and retryable failures, rather than showing "network error" for all of them.

## Remote Repositories

Remote Repositories provide builders for query input, but the server must explicitly expose the corresponding resources and actions. They run in a different place from Repositories that operate on the database directly, and authorization is enforced on the server. Never import database services, credentials or private connection modules into the client.

The server declares the endpoints with `defineRepositoryApiRoutes()`, and the client calls them with `api.repository(name)`; `name` is the exposed name and may differ from the Collection name. Queries also use POST, and the remote Repository unwraps the `data` in the response automatically. For a complete example, see [Repository data APIs](repository-routes.md).

## Request state and retries

The API Client does not replace request state management on the page. To keep an earlier request from overwriting newer search results, use cancellation, request identifiers or a suitable data-fetching state library. Retry requests that modify data only once you know they are idempotent; a timeout does not prove that the server did not execute the request.

Standalone scripts can depend on `@nocobase/api-client` directly and create a client with `createApiClient({ baseURL })`. `@nocobase/app-client` also re-exports the types and entries used in applications. For the related contracts, see the [API reference](../../reference/api.md).

## Interfaces and implementation

- [API Client](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/api-client/README.md)
- [Client hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/src/hooks.ts)
