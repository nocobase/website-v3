---
title: Localization
description: Organize application text and language resources, format displayed data by language, add languages and set the default language.
---

An application organizes its text in `client/locales/` and reuses the existing translation and language-switching mechanisms, so menus, forms, empty states and error messages all follow the same language. For appearance, see [Themes and styles](themes-and-styles.md).

This guide follows default template `1.0.0-beta.81`, used by the getting-started example; `projects` is just an example of new business text. Keep two things apart as you read: the application's default language, and the language preferences users have already saved.

## With an Agent

```text
Please complete English and Chinese copy for the project feature.

Cover menus, buttons, field hints, empty states and success and error feedback without visible translation keys.
Format numbers and dates for the current language without changing stored values or business time-zone rules.
Reuse the existing language controls, preserve saved user preferences and check default behavior in a fresh browser context.
Check both languages in the application and report anything unverified.
```

## Without an Agent

### Keep text in the application's locale files

| Location | Responsibility |
| --- | --- |
| `client/locales/en-US.ts` | The application's English text; also exports the `AppResource` type |
| `client/locales/zh-CN.ts` | The matching Chinese text, using the same resource structure |
| `client/locales/system/` | Text that ships with the template, maintained when upgrading the template |
| `client/locales/index.ts` | Languages available in the browser and their loaders |
| `server/locales/` | Messages produced by the server and their language loaders |

Put new business text in the application locale files, grouped by feature, such as `projects`. Do not edit `system/` to add business content; when extending shared groups such as `navigation` or `actions`, spread the existing group first so the template's keys are not overwritten.

For example, add a `projects` group with the following count messages to both locale files. If the group already exists, only append these keys and leave the rest untouched:

```ts
// client/locales/en-US.ts — inside projects
count_one: '{{count}} project',
count_other: '{{count}} projects',
```

```ts
// client/locales/zh-CN.ts — inside projects
count_one: '{{count}} 个项目',
count_other: '{{count}} 个项目',
```

Components use the translation Hook provided by the application:

```tsx
import { useTranslation } from '@nocobase/i18n/client';

export function ProjectCount({ count }: { count: number }) {
  const { t } = useTranslation();
  return <span>{t('projects.count', { count })}</span>;
}
```

Express complete sentences such as "Project X was created" with interpolation instead of joining separate words. Common text such as **Save** and **Cancel** can reuse existing keys, while success and error messages that mention a business object stay in their own feature group, so changing them does not alter the meaning on other pages.

The locale file types check the resource structure, but TypeScript may not catch a typo such as `t('projects.titel')`. That is why text coverage tests and browser checks are still needed.

### Format data and handle server text

Get the current language with `useLocale()`, then format displayed values with `Intl.NumberFormat` and `Intl.DateTimeFormat`. The language format of a date and the business time zone are separate concerns: do not implement "switch to Chinese" by changing times in the database, and do not mistake a date-only value for a timestamp that crosses time zones.

Map API errors to page text by status code and stable `reason`, and attach field errors to their inputs. Do not show an arbitrary server `message` to end users as final text. Notifications, mail and other text the server generates belong in `server/locales/`; content sent in the background follows the recipient's language, not that of the administrator who triggered it.

To reword a plugin's text, use `overrides` under that plugin's namespace in the application's language resources instead of editing the installed plugin. Check the keys against the plugin's public language contract first, so you do not depend on an internal, unpublished text structure.

### Add languages and set the default

To add a language, add its resource file and register a dynamic loader in the relevant `locales/index.ts`. Adding translations to a single plugin does not put the language into the application's language picker.

The client and server language lists are maintained separately. If the server should support the language as well, add server resources too, then run:

```bash
pnpm nocobase locales check
```

This command checks that the two language lists match; it does not check whether every key is translated. A client-only language can still be selected, but the server falls back to another language, and the check reports the mismatch.

Set the default language in `config.yml`:

```yaml
i18n:
  defaultLocale: zh-CN
```

A language choice already saved in the browser takes precedence over the default. To verify the default language, use a fresh browser context with no saved choice; do not clear every user's preference to force the default. Keep the application's existing `useSyncServerLocale()` synchronization, so the server session's language follows the supported choice in the browser.

## Verify results

Run this example's text coverage test and type check:

```bash
pnpm exec vitest run tests/client/app-locale-coverage.test.ts
pnpm exec tsc -p tsconfig.json --noEmit
```

Then check menus, empty states, field errors, plural counts and date formats in both languages in the browser. Verify the default language in a fresh browser context, and confirm that an existing personal choice still takes effect. Type checks cannot replace checking the actual text.
