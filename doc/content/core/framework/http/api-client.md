---
title: API Client
---

API Client centralizes application HTTP addresses, credentials and request formatting. Components should use the configured runtime client instead of assembling server URLs individually.

## Obtaining and calling the client

Use `useApiClient()` in React components or hooks. Inject it into ordinary services or resolve `apiClientToken`. This assumes a server `/orders` endpoint returning `{ data: [...] }`:

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

`path` is relative to the configured API address. Defaults are GET and `credentials: include`; cross-origin cookies and CORS still follow browser policy.

## Request and response contracts

| Need | Interface |
| --- | --- |
| Query parameters | `query`, using supported scalar/array values |
| JSON body | `json` |
| FormData and other bodies | `body`, mutually exclusive with `json` |
| Cancellation | `signal` |
| Complete parsed response | `request<T>()` |
| Byte stream | `stream()` |
| Repository protocol | `repository(name)` |

Generics describe expected responses without validating runtime data. Handle `ApiClientError` and distinguish refusal, permission failures, cancellation and retryable errors.

## Remote Repositories

Remote Repositories offer query builders but require explicitly exposed server resources and actions. They run separately from database Repositories, and authorization stays on the server. Never import database services, credentials or private connection modules into browser code.

The server declares endpoints with `defineRepositoryApiRoutes()`, and clients use `api.repository(name)`. This name identifies the exposure and may differ from the Collection name. Reads also use POST, and the remote Repository unwraps the response's `data`. See [Repository data APIs](repository-routes.md) for a complete example.

## State and retries

API Client does not manage page request state. Prevent older results from replacing newer searches with cancellation, request identities or a request-state library. Retry mutations only with known idempotency semantics; timeout does not prove nonexecution.

Independent scripts can directly depend on `@nocobase/api-client` and call `createApiClient({ baseURL })`. Application types and entries are also re-exported by `@nocobase/app-client`. See the [API reference](../../reference/api.md).

## Interfaces and implementation

- [API Client](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/api-client/README.md)
- [Client hooks](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/src/hooks.ts)
