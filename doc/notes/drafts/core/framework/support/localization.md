---
title: Localization mechanisms
---

`@nocobase/i18n` provides namespaces, resource loading, locale resolution and client/server translation bindings. The i18n plugin adds a picker, switch endpoints and stored preferences; translation works without that plugin.

## Resources and registration

A package's name is its namespace. Applications and plugins organize separate `client/locales/` and `server/locales/` resources. Files export translation objects and an aggregator maps locales to loaders:

```ts
// client/locales/index.ts or server/locales/index.ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};
export default locales;
```

Applications register resources through their runtime; plugins declare `locales` in `defineClientPlugin()` and `defineServerPlugin()`. This shows two loaders, not a complete language commitment: provide all languages supported by the module. Derive complete resource shapes from English with `LocaleResource`.

The application's loader lists determine offered languages. Installing a plugin with Japanese translations does not add Japanese to the app. `i18n.defaultLocale` selects the default rather than listing all languages.

## Translation and fallback

Components call `useTranslation()` from `@nocobase/i18n/client`. Default namespaces follow the render tree. A plugin component rendered directly by the application should name its namespace explicitly or wrap itself with `withNamespace()`.

Keys fall back from the current namespace to the application and then the base namespace. Languages fall back from the current language to the application default and then en-US. A fallback string or key is not evidence of complete translation.

Applications can override plugin wording:

```ts
// client/locales/zh-CN.ts
export default {
  save: '保存',
  overrides: {
    '@nocobase/app-plugin-scheduler': {
      nav: { schedules: '计划任务' },
    },
  },
};
```

Overrides apply after all namespaces register, without modifying plugin source.

## Server and background work

Mount `i18nHttpMiddleware` after session middleware. It resolves stored session preference, then `Accept-Language`, then the default, matching offered languages. Routes obtain an already-loaded translator through `getRequestTranslator()`.

Background work has no request locale. Call `ensureLocaleLoaded(locale)` before `getFixedT(namespace, locale)`. Outbound mail and notifications follow the recipient's language. Branch on stable API error codes and use localized messages for presentation.

Run `pnpm nocobase locales check` in an application. Component tests can use real resources and strict checks from `@nocobase/i18n/testing` instead of mocks that hide missing keys or wrong namespaces. See [Plugin localization](../../extension-development/localization.md) for resource organization.

## Interfaces and implementation

- [Localization contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/i18n/README.md)
