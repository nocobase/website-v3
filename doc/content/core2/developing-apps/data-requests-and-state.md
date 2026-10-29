---
title: Data requests and state management
description: Use the application's API Client and list Hooks, organize URL, remote and form state, and handle races, errors and refreshes after saving.
---

A page has to handle API data, user input and navigation state at the same time. Work out where each kind of state comes from before deciding where it lives; only then do searching, paging, editing and returning stay consistent.

This guide follows the client implementation of default template `1.0.0-beta.84`. `useListData` and `useListLocation` are source files generated into the application that you can change for your business; they are not exports of `@nocobase/app-client`. The example assumes the application already implements the task APIs below; keep request paths and response shapes consistent with your own server.

## With an Agent

```text
Complete request and state handling for the task list. Inspect existing endpoints and client/hooks/ first.

Keep search and pagination in the URL so reloads and browser history restore them. Reset pagination when search changes.
Reuse useListData and useListLocation; an old response must not overwrite a newer query.
Distinguish loading, empty results, failure and retry. Stop showing old data when access is denied.
Preserve drafts after a failed save and refresh the current query after success without losing search conditions.
Check closing routed dialogs, deleting the last page's final item, out-of-order responses and duplicate submissions.
Use existing shadcn components, translations and themes, and report the verification scope.
```

## Decide where each kind of state belongs

| State | Suggested location | When it changes |
| --- | --- | --- |
| Search, sorting, page and shareable tabs | URL query parameters | When the user changes the view; browser back and forward |
| Records, totals and action permissions returned by the server | A request Hook or a query cache | When query conditions change, after a successful save, or on an explicit refresh |
| Unsubmitted fields and validation errors | Local form or page state | On input, validation, save and cancel |
| Expansion, hover and temporary selection | Local component state | During the current interaction |
| Values shared within one component tree | A common parent component or React Context | When related components work together |
| Business operations and observable state across pages | A client business service | When business methods are called or the service emits events |

A value that can be computed from existing state usually does not need its own copy. For example, the number of selected items on the current page can be computed from the selected IDs and the records. A custom Hook reuses logic; two components that each call the same Hook do not automatically share one state. For React Context and Providers, see [UI components and interactions](pages-and-interactions.md#use-react-context-and-providers); for organizing services, see [Client business services](client-business-services.md).

## Obtain the application's API Client

In a component or Hook, get the client the application has already configured with `useApiClient()`; ordinary functions receive it as a parameter, and business services get it injected from the container. Do not create a new client for each page or assemble deployment URLs yourself.

The examples below assume these APIs:

| API | Input | Successful response |
| --- | --- | --- |
| `GET /tasks` | `q`, `page`, `pageSize` | `{ data: Task[], meta: { total: number } }` |
| `PATCH /tasks/:id` | JSON `{ title: string }` | `{ data: Task }` |

These are example business endpoints; creating client files does not generate them. The server is responsible for validation, authentication, authorization and data scopes; see [Routes and HTTP APIs](apis-and-services.md) for how to build them.

Keep the response types and the update operation in `client/pages/tasks/api.ts`:

```ts
import type { ApiClient } from '@nocobase/app-client';

export interface Task {
  id: string;
  title: string;
}

export interface TaskListResponse {
  data: Task[];
  meta: { total: number };
}

export async function renameTask(
  api: ApiClient,
  id: string,
  title: string,
  signal?: AbortSignal,
): Promise<Task> {
  const response = await api.request<{ data: Task }>({
    method: 'PATCH',
    path: `/tasks/${encodeURIComponent(id)}`,
    json: { title },
    signal,
  });
  return response.data;
}
```

`path` is relative to the API Client's address and usually leaves out `/api` and the application's mount path. `request<T>()` returns the whole response body; the generic only describes the expected type and does not validate data at runtime. Here, `response.data` is a field of the business API itself, not an extra wrapper added by the HTTP client.

If the server uses Repository data endpoints, use `api.repository(name)` and its protocol instead of the response assumptions above. See [API Client](../framework/http/api-client.md) and [Repository data APIs](../framework/http/repository-routes.md).

## Read list conditions from the URL

Combine the template's existing Hooks in `client/pages/tasks/use-task-list.ts`:

```ts
import { useListData } from '#hooks/use-list-data';
import { useListLocation } from '#hooks/use-list-location';
import type { TaskListResponse } from './api.js';

export function useTaskList() {
  const { params, setParams, active } = useListLocation();
  const q = params.get('q') ?? '';
  const inputPage = Number(params.get('page') ?? '1');
  const page = Number.isSafeInteger(inputPage) && inputPage > 0 ? inputPage : 1;
  const pageSize = 20;
  const query = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) });
  const request = useListData<TaskListResponse>(`/tasks?${query}`, { active });

  function setSearch(value: string) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set('q', value);
      else next.delete('q');
      next.set('page', '1');
      return next;
    }, { replace: true });
  }

  function setPage(value: number) {
    if (!Number.isSafeInteger(value) || value < 1) return;
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set('page', String(value));
      return next;
    });
  }

  return { ...request, q, page, pageSize, active, setSearch, setPage };
}
```

The page connects `q` and `setSearch` to the search control, and `page` and `setPage` to the pagination control. To debounce, keep the text being typed in local state and update the URL only when the search is committed, taking care of IME composition. Search uses `replace` here so that typing does not add a history entry each time, while paging keeps back and forward history.

`useListLocation()` relies on the routing context provided by the template. When a child route covers the list, it keeps the list's own query parameters and pauses reading through `active`, resuming when you return to the list. During that time, `useListData` may report `loading` as `true` without any request actually running. Pages outside the template's route tree should organize reading around their own Router instead of copying how `active` is decided.

For sorting, a variable page size and automatic page correction after deletion, see the template's `client/hooks/use-table-url-state.ts`. Accept only the sort fields the API supports and keep the other query parameters; correct parameters with `replace` to avoid bouncing back and forth.

## Handle loading, races and errors

`useListData` cancels old reads when the path changes or the component unmounts, and uses request generations to stop stale responses from being written back. `reload()` first invalidates the old result synchronously, then starts a new read. When you reuse this implementation, the page still handles presentation itself:

| State | Page behavior |
| --- | --- |
| First load, no data yet | Show a loading state |
| Success with an empty `data.data` | Show an empty state; never treat a failed request as an empty list |
| Refreshing while data for the same query exists | Mark it as updating; actions that need the latest result wait until the refresh finishes |
| Network failure or a temporarily unavailable server | Show retryable feedback, keep drafts, and read again with `reload()` |
| 401, 403 or 404 | Respond according to identity, permission or record state, and stop showing old restricted data |
| Request cancelled by a condition change or unmount | Show no error, and never let the cancelled result overwrite the new page |

By default, data from the previous path is not shown after the request path changes. `keepPreviousData: true` keeps the previous result while the query changes, but it must be clearly marked as old, and must not be used to compute the new query's total or to run bulk operations. It is not a complete shared query cache either.

Check HTTP errors with the `status`, `reason` and `domain` of `ApiClientError`; network errors may be ordinary exceptions. Map known errors to translated messages and field hints; `requestId` helps with troubleshooting. Do not show the developer-oriented `error.message` to users. For the general mechanism, see [API Client](../framework/http/api-client.md).

When you write a request Effect yourself, handle cancellation and result ownership together, clean up subscriptions and declare the real dependencies. In development mode, React may run an Effect's setup and cleanup more than once; see [React useEffect](https://react.dev/reference/react/useEffect).

## Refresh after saving and keep drafts

A form gets its client with `useApiClient()` and calls `renameTask(api, id, title)`. Before submitting, validate and mark the form as submitting, with a synchronous submission lock against rapid repeated clicks; release the lock when the operation ends.

After a successful save, update the current details with the record returned by the server, or call the list's `reload()` to read the current query again. Creating, deleting or changing a sort field affects totals and positions, so the list should usually be read again. `replaceData()` only replaces the current Hook's result; it does not update other pages and does not recompute pagination, permissions or aggregates.

When a save fails, keep the draft and attach errors to fields according to the API contract. Do not reinitialize the editing form every time the list refreshes; reset it explicitly, by record ID, only when switching to another record. When the current record no longer exists or access to it is lost, end editing and explain why.

A list and its editing child route can pass a refresh action through parent state, Outlet context or callbacks. Restore the original search conditions after closing a dialog or returning to the list; when the last record on the last page is deleted, adjust the page using the latest total for the matching query, not the old total.

Note that cancelling a browser request does not mean the server undid the change, and a timeout does not prove the save failed. Before retrying writes automatically, define their idempotency semantics; when concurrent edits are possible, use server-side version checks or conflict handling. For wrapping operations consistently across pages, see [Client business services](client-business-services.md).

## When to introduce a shared query cache

A list on a single page can start with the template Hooks. Once several pages need to share a query, deduplicate requests, refresh in the background or update optimistically, use the project's existing query-cache approach and mount its Provider in one consistent place.

Cache keys must cover the resource, the query parameters, and any identity or context that affects visible results. On sign-out or a change of identity, clear old requests and caches. Do not let components, services and the cache each keep their own unrelated copy of the record list.

## Verify results

Add tests for your pages and Hooks, focusing on these cases:

- Type two searches in a row and deliberately make the first request return last; the page still shows the second search's result.
- After refreshing, going back and forward, or entering a child route and returning, the query parameters and the list stay consistent.
- Read failures, cancellation, 401, 403, 404 and a successful empty result each show the correct state.
- A failed save keeps the draft; repeated clicks submit only once; a successful save refreshes the current query.
- Deleting the last record on the last page corrects the page while keeping search and sorting.
- After unmounting or a change of identity, old requests and shared state no longer affect the current interface.

The default template's `tests/client/list-recovery.test.tsx` and `tests/client/table-url-state.test.tsx` can serve as references. Run the relevant tests using the actual paths in your project, then run `pnpm typecheck` and `pnpm build`; for verification methods, see [Testing and acceptance](testing-and-acceptance.md).

The API contract in this guide must be implemented by your business server. Client tests replace the network boundary and can only verify request and state behavior; real authorization and persistence still need API and integration tests.

Source baseline: [useListData](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/hooks/use-list-data.ts), [useListLocation](https://github.com/nocobase/nocobase/blob/82f9c1dcf16a39810f9014ce2bcc93ec7088b3e2/packages/templates/app-template-default/client/hooks/use-list-location.ts).
