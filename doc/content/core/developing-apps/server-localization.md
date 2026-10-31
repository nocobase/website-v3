---
title: Server localization
description: Organize server locale resources and render messages in the correct language for HTTP requests and background work.
---

Page wording normally belongs in `client/locales/`. Server-generated mail, notifications and exports use `server/locales/`. Resources load independently: a client key is not automatically available on the server.

This guide follows default template `1.0.0-beta.84` and its server locale/runtime wiring, independently of the historical project tutorial.

## Add application wording

Add report wording to the existing object in `server/locales/en-US.ts`, keeping other keys and the type export. This file shows only this example's wording:

```ts
import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  reports: {
    ready: 'Report {{name}} is ready.',
    subject: 'Your report: {{name}}',
  },
};
export type AppServerResource = LocaleResource<typeof enUS>;
export default enUS;
```

Add matching keys to `server/locales/zh-CN.ts`:

```ts
import type { AppServerResource } from './en-US.js';

const zhCN = {
  reports: {
    ready: '报表 {{name}} 已准备好。',
    subject: '你的报表：{{name}}',
  },
} satisfies AppServerResource;
export default zhCN;
```

`LocaleResource` checks key structure without requiring identical translated strings. Keep interpolation names consistent. Pass user or report names as parameters rather than constructing translation keys from them.

## Check resource registration

The template's `server/locales/index.ts` already declares both loaders:

```ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};
export default locales;
```

`server/runtime.ts` already connects this entry as `locales`; another Provider is normally unnecessary. Add a resource file and loader for a new language. A plugin containing a language does not add it to the application's language list. Configure defaults through [Application configuration (config.yml)](configuration-and-settings.md). Maintain client and server language lists separately and check both when offering a language.

## Use the request language

The template's `server/app.ts` mounts `i18nHttpMiddleware` after sessions. It resolves and loads resources using session language, `Accept-Language`, then the default. Routes use `getRequestTranslator(c)` without creating another translation instance.

The following public endpoint only previews wording; it neither reads nor generates reports. Save it as `server/routes/report-message-preview.ts` and add it to `server/routes/index.ts` as shown in [HTTP routes and APIs](apis-and-services.md):

```ts
import { Hono } from 'hono';
import { z } from 'zod';
import {
  apiErrorHandler, apiValidator, dataResponse,
  defineApiRoutes, describeRoute, apiErrorResponses,
} from '@nocobase/app-server/router';
import { getRequestTranslator } from '@nocobase/i18n/server';

export default defineApiRoutes(() => {
  const router = new Hono();
  router.onError(apiErrorHandler);
  router.get(
    '/report-message-preview',
    describeRoute({
      operationId: 'previewReportMessage',
      summary: 'Preview report wording',
      security: [],
      responses: {
        200: dataResponse(z.object({ message: z.string() })),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', z.strictObject({
      name: z.string().trim().min(1).max(80),
    })),
    (c) => c.json({
      data: {
        message: getRequestTranslator(c)(
          'reports.ready', { name: c.req.valid('query').name },
        ),
      },
    }),
  );
  return router;
});
```

Request `<APP_BASE_PATH>/api/report-message-preview?name=Q3` with `Accept-Language: zh-CN`. Without a session-language override it returns the Chinese report-ready message. Route tests must install real i18n middleware too; a bare Hono request without it has no request translator.

`security: []` only describes the API. This example has no authentication middleware. Add authentication and data authorization before adapting it to real report access.

## Render background messages in the recipient's language

Background jobs have no HTTP request. Do not depend on its translator or change the shared instance's global language. Load the recipient's language and obtain a fixed translator. For example, create the optional `server/services/report-message.ts`:

```ts
import metadata from '../../package.json' with { type: 'json' };
import type { I18nRuntime } from '@nocobase/i18n';

export async function renderReportMessage(
  i18n: I18nRuntime,
  recipientLocale: string,
  name: string,
) {
  const locale = i18n.resolveLocale(recipientLocale);
  await i18n.ensureLocaleLoaded(locale);
  const t = i18n.getFixedT(metadata.name, locale);
  return {
    locale,
    subject: t('reports.subject', { name }),
    message: t('reports.ready', { name }),
  };
}
```

Resolve `I18nRuntime` through `i18nToken` from `@nocobase/app-server/i18n` in a Provider, then inject it or pass it to this function. The namespace is the application's `package.json` name, not a deployment path or user input. `services/` is an optional organizational directory; ordinary imports connect the file.

`recipientLocale` comes from recipient preferences; `resolveLocale()` falls back for unsupported values. Await `ensureLocaleLoaded()` before `getFixedT()` to avoid silently using fallback wording or keys. Fixed translators support concurrent recipients without changing one another's language.

## Plugin overrides and errors

Application server locale objects can override server wording under `overrides`, keyed by plugin package name. Do not edit `node_modules/` or put client-page overrides in server resources.

API errors retain stable `reason` and `domain` values. Developer-facing `message` is not UI wording. Clients translate identifiers; servers may supply a separate `localizedMessage` where needed, but translated strings must not determine error types. See [Request validation and error handling](request-validation-and-errors.md).

## Verify

Run `pnpm nocobase locales check` and type checking. With real resources, test both languages, interpolation, session/header precedence, unsupported-language fallback and concurrent recipients with different languages. Resource checks do not replace runtime tests; mocked translators can hide missing keys.

See [Localization](localization.md) for client language selection and wording, and [Plugin Server localization](../extension-development/server-localization.md) for plugin resource declarations.
