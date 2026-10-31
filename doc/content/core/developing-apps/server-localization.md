---
title: Server localization
description: Configure server locale resources, choose request and recipient languages, override plugin wording and return localized error messages.
---

Server-generated mail, notifications and exports use `server/locales/`. These resources load independently of `client/locales/`: a key available on a page must still be declared on the server.

The report-ready notification below uses the request language for HTTP responses and the recipient's language for background messages. Run the [example App](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization) through commands; see [Example source and setup](#example-source-and-setup). It renders wording without accessing real reports or sending mail.

## Add and load locale resources

### Define wording and interpolation parameters

Add `reports` to the existing object in `server/locales/en-US.ts`, keeping its other keys and type export. The plugin overrides introduced later are omitted here:

```ts
import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  reports: {
    ready: 'Report {{name}} is ready.',
    subject: 'Your report: {{name}}',
    notReady: 'Report {{name}} is not ready yet.',
  },
};
export type AppServerResource = LocaleResource<typeof enUS>;
export default enUS;
```

Add the matching keys in `server/locales/zh-CN.ts`:

```ts
import type { AppServerResource } from './en-US.js';

const zhCN = {
  reports: {
    ready: '报表 {{name}} 已准备好。',
    subject: '你的报表：{{name}}',
    notReady: '报表 {{name}} 尚未准备好。',
  },
} satisfies AppServerResource;
export default zhCN;
```

`LocaleResource` checks key structure while allowing different translated strings. `{{name}}` is an interpolation parameter: keep its name consistent across languages and pass the report name as a value, rather than constructing a key from it. Type checking does not verify the rendered interpolation.

[View the locale resources](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/locales). Run `pnpm demo request zh-CN` to insert `Q3` into the Chinese message, or `pnpm demo request en-US "Sales summary"` to receive `Report Sales summary is ready.`.

### Register languages and set the default

The Default template's `server/locales/index.ts` already declares locale loaders:

```ts
import type { LocaleLoaders } from "@nocobase/i18n";
const locales: LocaleLoaders = {
  "en-US": () => import("./en-US.js"),
  "zh-CN": () => import("./zh-CN.js"),
};
export default locales;
```

`server/runtime.ts` connects this entry through `locales`. Add both a resource file and its loader for each new language. Plugin translations do not add languages to the App's offered list. Maintain client and server resource lists separately.

Set the default language in the App's `config.yml`, for example:

```yaml
i18n:
  defaultLocale: en-US
```

Alternatively, use `APP_DEFAULT_LOCALE`; see [Application configuration](configuration-and-settings.md). This default provides a fallback when no preference matches; it does not replace a user's saved choice.

The example's [App entry](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/app.ts) sets `i18n.defaultLocale` to English and registers the real `I18nProvider` and locale resources. Run `pnpm demo request fr-FR`: French is not declared by the App, so the response is English. Although the example plugin supplies Japanese resources, `pnpm demo request ja-JP` also falls back to English.

## Translate HTTP responses

### Use the current request language

In `server/app.ts`, the Default template mounts session middleware before `i18nHttpMiddleware`. The latter resolves the request language and awaits its resources. Routes then obtain the App translator with `getRequestTranslator(c)` and the resolved language with `getRequestLocale(c)`.

This is a standalone version of the report preview endpoint in [report-messages.ts](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/routes/report-messages.ts). Save it under `server/routes/` and register it in `server/routes/index.ts` as described in [HTTP routes and APIs](apis-and-services.md):

```ts
import { Hono } from 'hono';
import { z } from 'zod';
import {
  apiErrorHandler, apiErrorResponses, apiValidator,
  dataResponse, defineApiRoutes, describeRoute,
} from '@nocobase/app-server/router';
import {
  getRequestLocale, getRequestTranslator,
} from '@nocobase/i18n/server';

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
        200: dataResponse(z.object({
          locale: z.string(), message: z.string(),
        })),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', z.strictObject({
      name: z.string().trim().min(1).max(80),
    })),
    (c) => c.json({
      data: {
        locale: getRequestLocale(c),
        message: getRequestTranslator(c)(
          'reports.ready', { name: c.req.valid('query').name },
        ),
      },
    }),
  );
  return router;
});
```

In an existing App, request `<APP_BASE_PATH>/api/report-message-preview?name=Q3` with `Accept-Language: zh-CN`. Without a session-language override, the response is:

```json
{
  "data": {
    "locale": "zh-CN",
    "message": "报表 Q3 已准备好。"
  }
}
```

The example's `pnpm demo request zh-CN` command dispatches this request through `Application.fetch` without opening a port. This public endpoint only previews wording. `security: []` describes the API; add authentication and data authorization before adapting it to access real reports.

### Session language, request header and default

A saved session language takes precedence. Without one, middleware searches the `Accept-Language` preferences in priority order for a supported language, then uses the default if none matches. An unsupported value already stored in the session is resolved with fallback; the request header does not override it.

Run `pnpm demo session zh-CN`. The [demo script](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/scripts/demo.ts) first saves English in a real session through the example endpoint, then requests the preview with its cookie and a Chinese header. The result remains `locale: "en-US"` and `Report Q3 is ready.`. A new request without that cookie uses Chinese.

The example's `/demo-locale` endpoint only demonstrates precedence; preferences live in the current process. Existing Apps should retain their language-selection entry point; see [Client localization](localization.md).

## Render background messages in the recipient's language

### Inject the runtime and bind the translator

Background work has no current HTTP request. Accept the recipient's preference from the caller, inject the runtime through `i18nToken`, and render in that language. [report-message.ts](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/services/report-message.ts) defines the service:

```ts
import metadata from "../../package.json" with { type: "json" };
import type { I18nRuntime } from "@nocobase/i18n";
import { createServiceToken } from "@nocobase/service-provider";

export class ReportMessageService {
  constructor(private readonly i18n: I18nRuntime) {}

  async render(recipientLocale: string, name: string) {
    const locale = this.i18n.resolveLocale(recipientLocale);
    await this.i18n.ensureLocaleLoaded(locale);
    const t = this.i18n.getFixedT(metadata.name, locale);
    return {
      locale,
      subject: t("reports.subject", { name }),
      message: t("reports.ready", { name }),
    };
  }
}
export const reportMessageToken =
  createServiceToken<ReportMessageService>("report-message");
```

`resolveLocale()` resolves a preference to a supported language; `ensureLocaleLoaded()` loads its resources; `getFixedT()` binds a translator to the namespace and language. Keep this order: unloaded wording can silently fall back to the default or the key. The namespace is the App's `package.json` name.

[ReportMessageProvider](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/providers/report-message.ts) injects the runtime:

```ts
import type { Application } from "@nocobase/app-server/application";
import { i18nToken } from "@nocobase/app-server/i18n";
import { ServiceProvider } from "@nocobase/service-provider";
import {
  ReportMessageService,
  reportMessageToken,
} from "../services/report-message.js";

export default class ReportMessageProvider extends ServiceProvider<Application> {
  readonly name = "report-message";
  override register() {
    this.app.container.singleton(
      reportMessageToken,
      (container) => new ReportMessageService(container.resolve(i18nToken)),
    );
  }
}
```

Add this Provider to an existing App's `server/providers/index.ts`, keeping its other Providers. The `server/services/` directory only organizes code; it does not register services automatically. The example's [App entry](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/app.ts) already registers the Provider.

Run `pnpm demo background zh-CN`. The command resolves the service from the container and produces this output without an HTTP context:

```json
{
  "locale": "zh-CN",
  "subject": "你的报表：Q3",
  "message": "报表 Q3 已准备好。"
}
```

### Render different languages concurrently

After the App starts, a background job or command can reuse this service for concurrent recipients. This invocation follows the [demo script](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/scripts/demo.ts):

```ts
import { reportMessageToken } from './server/services/report-message.js';

// app has completed app.start().
const service = app.container.resolve(reportMessageToken);
const messages = await Promise.all([
  service.render('en-US', 'Q3'),
  service.render('zh-CN', 'Q3'),
  service.render('fr-FR', 'Q3'),
]);
```

Run `pnpm demo concurrent`. The three messages are `Report Q3 is ready.`, `报表 Q3 已准备好。` and `Report Q3 is ready.`, with resolved languages `en-US`, `zh-CN` and `en-US` respectively.

Each call binds the recipient's language explicitly without calling `changeLanguage()` on the shared runtime. Tasks and HTTP requests therefore do not compete for a global current language. Obtain each recipient's preference from business data rather than applying the initiating user's language to everyone.

## Override a plugin's server wording

Use the plugin's full package name under the App locale object's `overrides` key. For example, add this to the English resource:

```ts
// Inside the default export of server/locales/en-US.ts:
overrides: {
  '@example/report-delivery': {
    delivery: {
      ready: 'Your report {{name}} is available in the customer portal.',
    },
  },
},
```

At the same location in the Chinese resource, add `ready: '报表 {{name}} 已可在客户门户中查看。'`. App overrides apply after plugin resources. Keys you do not override retain the plugin's wording; no plugin files or `node_modules/` changes are needed.

Specify the plugin namespace explicitly in the request handler. Hono does not infer it from the file location:

```ts
const t = getRequestTranslator(c, '@example/report-delivery');
return c.json({ data: {
  locale: getRequestLocale(c),
  message: t('delivery.ready', { name: c.req.valid('query').name }),
  channel: t('delivery.channel'),
} });
```

Run `pnpm demo override zh-CN`. The message becomes `报表 Q3 已可在客户门户中查看。`, while the untouched `delivery.channel` remains the plugin's `客户门户`.

The [example plugin resources](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/report-delivery.ts), [App overrides](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/locales) and [request handler](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/routes/report-messages.ts) implement this together. `@example/report-delivery` is an embedded resource plugin; substitute the real plugin package name and keys in your App. See [Plugin server localization](../extension-development/server-localization.md) for plugin declarations.

## Return user-facing error messages

Keep the API error's `reason`, `domain` and HTTP status stable, and retain an English developer description in `message`. When the server supplies user-facing text, put the resolved language and translation in `localizedMessage`.

This excerpt comes from the [report-not-ready handler](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/server/routes/report-messages.ts), which uses the same query validation and `apiErrorHandler` as the preview:

```ts
import { ApiError } from '@nocobase/app-server/router';
import {
  getRequestLocale, getRequestTranslator,
} from '@nocobase/i18n/server';

// Inside the validated /report-not-ready handler:
throw new ApiError({
  status: 'FAILED_PRECONDITION',
  reason: 'REPORT_NOT_READY',
  domain: 'reports',
  message: 'The requested report is not ready.',
  localizedMessage: {
    locale: getRequestLocale(c)!,
    message: getRequestTranslator(c)(
      'reports.notReady', { name: c.req.valid('query').name },
    ),
  },
});
```

Run `pnpm demo error zh-CN` to deliberately trigger the report-not-ready condition. It returns HTTP 400, `reason: "REPORT_NOT_READY"`, `domain: "reports"` and this `localizedMessage`:

```json
{
  "locale": "zh-CN",
  "message": "报表 Q3 尚未准备好。"
}
```

An English request changes only the user-facing language. Code continues to branch on stable identifiers rather than comparing translations. Clients can also translate the error identifiers themselves; see [Request validation and error handling](request-validation-and-errors.md).

## Verify translation and fallback

In a full template App, `pnpm nocobase locales check` compares the languages declared by client and server files; it does not check loaders, translation keys or interpolation results. `pnpm typecheck` checks key structure through resource types. The example does not install the template CLI; use `pnpm typecheck` and `pnpm test` there.

Runtime checks must use real resources and middleware. The [example tests](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization/tests/localization.test.ts) cover English and Chinese interpolation, header priorities, session isolation, default-language fallback, plugin overrides, and concurrent requests and background messages. They also check the explicit missing-middleware error, invalid input, and stable business error identifiers across languages.

An unsupported language and a missing key are different cases. The former resolves to the App default; the latter tries the default and English resources and may return the key if neither has it. An isolated test uses incomplete resources to reproduce missing translations; the normal App should still supply every language's keys.

## Example source and setup

The [complete source and README](https://github.com/nocobase/docs-examples-v3/tree/44cc65d121ea8cebf26fee77c924119cc57f4aad/apps/server-localization) provide version requirements, the usage-to-source map and expected command output. The example uses Node.js 24, pnpm 11.7.0, App Server `3.0.0-beta.5` and I18n `2.0.0-beta.1`, matching the dependency versions used by Default template `1.0.0-beta.85`.

```sh
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 44cc65d121ea8cebf26fee77c924119cc57f4aad
cd apps/server-localization
pnpm install --frozen-lockfile
pnpm demo request zh-CN
pnpm test
```

This minimal example composes NocoBase Application and Providers directly; it is not a full Default template. Commands dispatch requests or service calls in the same process and shut down the App when finished. No browser, database or mail service is required. When adapting the code to an existing App, retain its runtime, configuration and middleware and merge only the locale resources, routes and Provider registration.
