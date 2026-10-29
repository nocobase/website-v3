---
title: Server localization
description: Declare a plugin's server language resources, and use the right namespace and language in requests and background jobs.
---

A plugin maintains its server text in `server/locales/` and connects it to the application through `locales` in `server/plugin.ts`. Client pages use separate [client language resources](localization.md); registering the Client plugin cannot replace registering the Server resources.

## Use an Agent

```text
Add Server translations for this plugin's API feedback and background messages.
Keep stable error codes and bind the full plugin package namespace explicitly.
Translate requests in their current language and background messages in each
recipient's language. Complete supported resources and verify two request
languages and messages for recipients with different preferences in the target App.
```

## Declare Server resources

You can choose `server.locales` when creating the plugin. An existing plugin keeps its implementation and only adds the resources, loaders and Server declaration. The paths below are relative to the plugin root:

```text
server/
├── locales/
│   ├── en-US.ts
│   ├── zh-CN.ts
│   ├── …
│   └── index.ts
└── plugin.ts
```

English defines the resource key structure, and other languages use the complete resource type; loaders import each language dynamically. The way of writing them and the conventions for complete translations are the same as in [Define keys in English](localization.md#define-keys-in-english): put the files in `server/locales/`, maintain the server's own resource type, and never import resources from the client.

In the generated `server/plugin.ts`, keep `packageName`, `baseDir` and the other contributions, and assign the loader collection exported by `server/locales/index.ts` to `locales`. Adding translation files alone does not register the resources; the application must also connect the plugin's Server entry, as described in [Plugin declarations and public exports](plugin-declarations.md#server).

<span id="server-copy-has-separate-resources"></span>

## Translate request copy

The examples below assume the Server entry and language resources are registered. For connecting APIs, see [Routes and HTTP APIs](server-apis.md); for the execution entry of background messages, see [Background jobs and executors](background-jobs.md).

For example, add `messages.ready` to the server resources, fill it in for every language, then use it in a request handler mounted by the App:

```ts
import { getRequestTranslator } from '@nocobase/i18n/server';

// Inside a handler mounted by the App, with the plugin's Server locales registered:
const t = getRequestTranslator(context, '@nocobase/app-plugin-notice-i18n');
return context.json({ data: { message: t('messages.ready') } });
```

The request language is decided by the App's session preference, `Accept-Language` and the default language rules together. Hono does not infer the plugin's namespace from where the source file lives, so the server must name the package explicitly.

Keep a stable `ApiError.reason` in errors for programs to act on; translated text meant for users can be provided through `localizedMessage`. Never use a translated sentence as a business error code.

Background jobs, mail and notifications have no current request, so they must choose the recipient's language: call `i18n.ensureLocaleLoaded(locale)` first, then `i18n.getFixedT(namespace, locale)`. Do not apply the language of the user who triggered the job to every recipient.

## Verify integration

Using a test application with the real Server plugin registered, verify translation through requests: the same API returns the matching text in different supported languages, while error codes and the data structure stay the same. For examples of integration and request language in applications, see [Server localization](../developing-apps/server-localization.md).

Background jobs must use each recipient's own language, and you should verify that text is generated only after the language resources load. Requests and jobs must never share state through a mutable "current language" field.

Run the plugin's type checks, the relevant server tests and the application build. Type checks on resources only prove the key structure is complete; you still need to check the Server registration, real requests, error messages and background messages in the target application. For how applications set languages and override module text, see [Server localization in application development](../developing-apps/server-localization.md).
