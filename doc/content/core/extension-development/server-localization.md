---
title: Server localization
description: Declare plugin Server resources and use the correct namespace and language in requests and background jobs.
---

Plugins maintain Server copy in `server/locales/` and contribute it through `locales` in `server/plugin.ts`. Client pages use separate [Client resources](localization.md); registering the Client plugin does not register Server resources.

## Use an Agent

```prompt
Add Server translations for this plugin's API feedback and background messages.
Keep stable error codes and bind the full plugin package namespace explicitly.
Translate requests in their current language and background messages in each
recipient's language. Complete supported resources and verify two request
languages and messages for recipients with different preferences in the target App.
```

## Declare Server resources

Select `server.locales` when creating a plugin. For an existing plugin, preserve its implementation and add resources, loaders and the Server declaration. Paths below are relative to the plugin root:

```text
server/
├── locales/
│   ├── en-US.ts
│   ├── zh-CN.ts
│   ├── …
│   └── index.ts
└── plugin.ts
```

English defines the key structure; other languages use the complete resource type. Loaders dynamically import each language. Reuse the conventions in [Define keys in English](localization.md#define-keys-in-english), placing files in `server/locales/` with a Server-owned resource type. Do not import Client resources.

Preserve `packageName`, `baseDir` and existing contributions in `server/plugin.ts`. Assign the loader collection exported by `server/locales/index.ts` to `locales`. Adding files alone does not register them: the App must also register the Server entry. See [Plugin declarations and public exports](plugin-declarations.md#server).

<span id="server-copy-has-separate-resources"></span>

## Translate request copy

The following assumes the Server entry and resources are registered. See [Routes and HTTP APIs](server-apis.md) for request integration and [Background jobs and executors](background-jobs.md) for background entry points.

For example, add `messages.ready` to every Server language, then use it inside an App-mounted request handler:

```ts
import { getRequestTranslator } from '@nocobase/i18n/server';

// Inside a handler mounted by the App, with the plugin's Server locales registered:
const t = getRequestTranslator(context, '@nocobase/app-plugin-notice-i18n');
return context.json({ data: { message: t('messages.ready') } });
```

The App resolves request language from session preferences, `Accept-Language` and its default. Hono does not infer a plugin namespace from source ownership, so specify the package name.

Keep a stable `ApiError.reason` for programmatic decisions and supply translated user copy through `localizedMessage`. Translated sentences are not error codes.

Jobs, mail and notifications have no current request. Choose the recipient’s locale, call `i18n.ensureLocaleLoaded(locale)`, then `i18n.getFixedT(namespace, locale)`. Do not reuse the initiating user’s language for every recipient.

## Verify integration

Use a test App with the real Server plugin registered. Request the same endpoint in different supported languages and assert translated copy while error codes and response structure remain stable. For application integration and request-language examples, see [Server localization](../developing-apps/server-localization.md).

Run background jobs for recipients with different language preferences and verify that resources load before messages are generated. Avoid sharing a mutable “current language” field between requests or jobs.

Run plugin type checks, relevant Server tests and the App build. Resource types verify key completeness only; check Server registration, real requests, error feedback and background messages in the target App. Application language configuration and module overrides are covered in [Application Server localization](../developing-apps/server-localization.md).
