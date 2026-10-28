---
title: Server APIs
description: Add plugin endpoints with validation, response contracts, access control and tests.
---

A plugin API receives requests, validates input and access, then calls business logic. This example previews notice text: it trims surrounding whitespace and returns the text and its character count without saving anything.

For standard Collection queries or simple writes, use [`defineRepositoryApiRoutes()`](../framework/http/repository-routes.md) and add its contribution to the plugin's `routes`. Applications and plugins share that mechanism; this guide demonstrates a custom business endpoint.

## Use an Agent

```text
Create a notice-api plugin in this App with a notice text preview endpoint.
It processes only text supplied in this request, reads no business data, and saves nothing, so it can be public.
Validate length, use standard responses and errors, document and test the API, then register it.
```

## Prepare the plugin

Run commands from the existing App root. File paths are relative to `packages/app-plugin-notice-api/`. Inspect an existing plugin with that name instead of generating it again.

```bash
pnpm create @nocobase/plugin@beta notice-api --with server.routes --with server.service-providers
```

Add `zod` to the plugin’s `dependencies`, using a compatible version already installed in the App, then run `pnpm install` from the App root. The scaffold configures `hono` and runtime contracts. Keep its Provider aggregation, Server declaration and public entry.

## Provide the preview service

Replace `server/tokens.ts` with the contract and Token:

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

The generated Provider already binds `noticeApiServiceToken` to this implementation. Do not create another container in the route. The service processes text independently of HTTP; see [ServiceProvider](service-provider.md). The count measures Unicode code points, not user-perceived graphemes.

## Declare input, output and routes

Create `server/routes/schemas.ts`:

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

Input is trimmed before validation. The 200 limit uses JavaScript string length; define a separate rule if the product counts graphemes. Exported schemas need explicit types for the plugin’s `isolatedDeclarations` build.

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

`NoticeRoutesApplication` declares only the container capability the route uses. The real App satisfies it, and tests can provide a small, complete fixture.

| Part | Purpose |
| --- | --- |
| `defineApiRoutes()` | Lets the App mount routes under its API prefix |
| `describeRoute()` | Adds an OpenAPI declaration, including this example’s public access |
| `apiValidator()` | Validates input and returns a standard 400 on failure; handlers read `req.valid()` |
| `dataResponse()` | Describes `{ data }`; it does not produce the response |
| `apiErrorHandler` | Uses standard errors even when testing the router on its own |

The declared path is `/noticeApi/preview`. With the default `/main` deployment prefix, open `/main/api/noticeApi/preview?text=Hello`. A Client using `useApiClient()` requests `path: 'noticeApi/preview'` without hard-coding a server URL.

## Define the access boundary

This example reads no user or business records and changes no state, so anonymous text preview is intentional. `security: []` describes authentication in the API document; it does not enforce access. Server middleware does that.

For an internal endpoint, import the original `authenticationToken` from `@nocobase/app-plugin-authentication`, install `app.container.resolve(authenticationToken).required()` on the relevant paths, and remove `security: []`. Declare added identity-sensitive runtimes, such as the authentication plugin, as compatible peer dependencies. Sensitive actions also need explicit resource/action authorization. Run authentication, authorization, input validation and business logic in that order. Page authentication cannot protect an API.

Throw `ApiError` for business failures, with a status such as `NOT_FOUND`, a stable `reason`, and the plugin’s `domain`. Do not construct error JSON by hand or expose stacks and credentials. Test anonymous, denied and allowed callers for protected operations.

## Test and register

Replace the empty-route assertion in `tests/server/routes.test.ts`:

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

Also replace the generated `tests/server/service-provider.test.ts` to check the preview behavior. Keep other generated tests that still match the plugin:

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

Start or restart the App. The URL above should return `{"data":{"text":"Hello","length":5}}`. Missing, blank or oversized input returns 400. After signing in, check `/main/api/swagger/docs` for the declaration, adjusting the deployment prefix as needed.

Run the App’s `pnpm build`. Router tests do not verify deployment prefixes, App-wide middleware or real sign-in; check those in the App. See [Testing and verification](testing-and-verification.md).
