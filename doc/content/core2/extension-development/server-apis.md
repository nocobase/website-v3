---
title: Routes and HTTP APIs
description: Add APIs to a plugin, covering input validation, response format, access control and testing.
---

A plugin's server API receives requests, checks input and access permissions, then calls business logic. This guide implements an announcement text preview API: it receives a piece of text, trims whitespace from both ends, and returns the processed text and its character count, without saving any data.

If the plugin needs to expose standard queries or simple writes on a Collection, use [`defineRepositoryApiRoutes()`](../framework/http/repository-routes.md) and add the declaration to the plugin's `routes`. Applications and plugins share this mechanism; this guide continues with a custom business API.

## Use an Agent

```text
Create a notice-api plugin in this App with a notice text preview endpoint.
It processes only text supplied in this request, reads no business data, and saves nothing, so it can be public.
Validate length, use standard responses and errors, document and test the API, then register it.
```

## Prepare the plugin

Run the following commands in the root of an existing App; file paths are relative to `packages/app-plugin-notice-api/`. If a plugin with the same name already exists, check its implementation first instead of creating it again.

```bash
pnpm create @nocobase/plugin@beta notice-api --with server.routes --with server.service-providers
```

Add `zod` to `dependencies` in the plugin's `package.json`, keeping its version consistent with the compatible version already installed in the App, then run `pnpm install` in the App root. `hono` and the required runtimes are configured by the scaffold; keep the generated Provider aggregation file, Server declaration and public entry.

## Provide the preview service

Replace `server/tokens.ts` to define the service contract and Token:

```ts
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface NoticePreview {
  readonly text: string;
  readonly length: number;
}
export interface NoticeApiService {
  preview(text: string): NoticePreview;
}
export const noticeApiServiceToken: ServiceToken<NoticeApiService> =
  createServiceToken<NoticeApiService>(
    '@nocobase/app-plugin-notice-api/service',
  );
```

Replace `server/services/notice-api.ts`:

```ts
import type { NoticePreview, NoticeApiService } from '../tokens.js';

export class DefaultNoticeApiService implements NoticeApiService {
  public preview(text: string): NoticePreview {
    const normalized = text.trim();
    return { text: normalized, length: Array.from(normalized).length };
  }
}
```

The generated Provider already binds `noticeApiServiceToken` to this implementation, so there is no need to create a second container in the API. The service only processes text and does not depend on the HTTP request; for what the Provider does, see [ServiceProviders and service lifecycle](service-provider.md). The character count uses Unicode code points, which is not the same as the number of graphemes a user perceives.

## Declare input, output and routes

Add `server/routes/schemas.ts`:

```ts
import { z } from 'zod';
import type { NoticePreview } from '../tokens.js';

export const PreviewQuery: z.ZodObject<{ text: z.ZodString }> = z.object({
  text: z.string().trim().min(1).max(200),
});
export const PreviewSchema: z.ZodType<NoticePreview> = z.object({
  text: z.string(),
  length: z.number().int().nonnegative(),
});
```

Input is trimmed at both ends before its length is checked. The limit of 200 here is a JavaScript string length; if the business counts graphemes, define a separate rule. Exported schemas need explicit types, so generating the plugin's declaration files does not trigger `isolatedDeclarations` errors.

Replace `server/routes/index.ts`:

```ts
import type { ServiceContainer } from '@nocobase/service-provider';
export interface NoticeRoutesApplication {
  readonly container: ServiceContainer;
}
import {
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { noticeApiServiceToken } from '../tokens.js';
import { PreviewQuery, PreviewSchema } from './schemas.js';

export const apiRoutes: AppApiRouteContribution<NoticeRoutesApplication> =
  defineApiRoutes((app) => {
    const service = app.container.resolve(noticeApiServiceToken);
    const router = new Hono();
    router.onError(apiErrorHandler);
    router.get(
      '/noticeApi/preview',
      describeRoute({
        tags: ['NoticeApi'],
        summary: 'Preview notice text',
        operationId: 'noticeApiPreviewText',
        security: [],
        responses: {
          200: dataResponse(PreviewSchema),
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('query', PreviewQuery),
      (context) => {
        const { text } = context.req.valid('query');
        return context.json({ data: service.preview(text) });
      },
    );
    return router;
  });
const routes: readonly AppApiRouteContribution<NoticeRoutesApplication>[] = [
  apiRoutes,
];
export default routes;
```

`NoticeRoutesApplication` declares only the container capability the routes actually use; the real App satisfies this interface too, so tests can provide a small but complete object.

| Part | Purpose |
| --- | --- |
| `defineApiRoutes()` | Hands the routes to the App, which mounts them under the API prefix |
| `describeRoute()` | Generates the API's OpenAPI description; this example declares it publicly accessible |
| `apiValidator()` | Validates input and returns a standard 400 error on failure; the handler reads only `req.valid()` |
| `dataResponse()` | Describes a response of the form `{ data }`; it does not replace the actual return value |
| `apiErrorHandler` | Makes the routes use the App's standard error format even when tested on their own |

The declared path is `/noticeApi/preview`. With the default deployment prefix `/main`, visit `/main/api/noticeApi/preview?text=Hello` in the browser. A client obtained through `useApiClient()` requests it with `path: 'noticeApi/preview'`; do not hard-code a server address.

## Aggregate contributions and integrate the App

The array exported by `server/routes/index.ts` reaches the application through `routes` in `server/plugin.ts`, and the service is registered through the same plugin's `serviceProviders`. Once the application connects the public exports of `server/index.ts`, it mounts the API prefix and provides the request environment. When adding routes, keep the existing contributions; do not skip the aggregating declaration just because the file already exists.

So that it can run on its own, this example keeps the complete preview service. For extracting the service, public Tokens and reuse across entries, see [Business services and ServiceProvider](server-services.md); for shared input and error rules, see [Request validation and error handling](../developing-apps/request-validation-and-errors.md). For asynchronous work, have the handler call the submission service of [Background jobs and executors](background-jobs.md) after the application starts; never submit jobs while the route factory is being created.

## Define the access boundary

This example neither reads users or business records nor writes any state, so anonymous text preview is allowed. `security: []` only declares the authentication requirement in the documentation and does not protect the API by itself; real protection comes from server middleware.

For internal APIs, import the original `authenticationToken` from `@nocobase/app-plugin-authentication`, install the authentication middleware on the relevant paths with `app.container.resolve(authenticationToken).required()`, and remove `security: []`. Identity-sensitive runtimes you add (such as the authentication plugin) should be declared as compatible peer dependencies. Sensitive operations also need the authorization service to check an explicit resource and action. The order of checks is authentication, authorization, input validation, then business processing; a page requiring sign-in cannot replace these checks.

For business failures, use `ApiError`, for example setting `status: 'NOT_FOUND'`, a stable `reason` and the plugin's own `domain` when a resource does not exist. Do not hand-build error JSON, and never return stack traces or credentials to callers. APIs that need authentication should verify at least three cases: anonymous, without permission and with permission. For how the application connects existing authentication, roles and data policies, see [Authentication, permissions and data scopes](../developing-apps/authentication-and-permissions.md).

## Test and register

Replace the scaffold's `tests/server/routes.test.ts`, which asserts that there are no routes:

```ts
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';
import { apiRoutes } from '../../server/routes/index.js';
import { NoticeApiProvider } from '../../server/providers/notice-api.js';

async function createRouter() {
  const container = new ServiceContainer();
  new NoticeApiProvider({ container }).register();
  return apiRoutes.createRouter({ container });
}
describe('notice preview API', () => {
  it('previews public text without persisting it', async () => {
    const router = await createRouter();
    const response = await router.request(
      '/noticeApi/preview?text=%20Hello%20',
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { text: 'Hello', length: 5 },
    });
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Notice Tools', version: '1' },
    });
    expect(document.paths?.['/api/noticeApi/preview']?.get).toBeDefined();
  });
  it.each(['', '?text=', `?text=${'a'.repeat(201)}`])(
    'rejects invalid input %s',
    async (query) => {
      const router = await createRouter();
      const response = await router.request(`/noticeApi/preview${query}`);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { reason: 'INVALID_INPUT' },
      });
    },
  );
});
```

Also replace the generated `tests/server/service-provider.test.ts` to verify the new preview behavior, keeping the other tests that still match the actual capabilities:

```ts
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';
import { NoticeApiProvider } from '../../server/providers/notice-api.js';
import { noticeApiServiceToken } from '../../server/tokens.js';

describe('notice service', () => {
  it('registers a lazy singleton and normalizes text', () => {
    const container = new ServiceContainer();
    new NoticeApiProvider({ container }).register();
    expect(container.resolveIfCreated(noticeApiServiceToken)).toBeUndefined();
    const service = container.resolve(noticeApiServiceToken);
    expect(service.preview('  欢迎 👋  ')).toEqual({
      text: '欢迎 👋',
      length: 4,
    });
    expect(container.resolve(noticeApiServiceToken)).toBe(service);
  });
});
```

```bash
pnpm --filter @nocobase/app-plugin-notice-api format
pnpm --filter @nocobase/app-plugin-notice-api check
```

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-api --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-api --no-install
```

Start or restart the App and visit the address above; you should get `{"data":{"text":"Hello","length":5}}`. When `text` is missing, entirely blank or over the length limit, the API should return 400. After signing in, check `/main/api/swagger/docs` to confirm the API declaration exists; the actual address follows the App's deployment prefix.

Finally, run the App's `pnpm build`. Standalone route tests verify neither the deployment prefix, the App's global middleware nor the real sign-in flow; check those in the App. For more verification methods, see [Testing and verification](testing-and-verification.md).
