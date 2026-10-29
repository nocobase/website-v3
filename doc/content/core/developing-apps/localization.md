---
title: Localization
description: Organize application translations, format localized data, add languages and configure the default locale.
---

Use `client/locales/` to organize application copy and reuse the existing translation and language-switching mechanisms. Menus, forms, empty states and errors should follow the same locale. For appearance, see [Themes and styles](themes-and-styles.md).

This guide follows default template `1.0.0-beta.81`, used by the getting-started example. `projects` illustrates new business copy. Distinguish the default language from preferences users have already saved.

## With an agent

```text
Please complete English and Chinese copy for the project feature.

Cover menus, buttons, field hints, empty states and success and error feedback without visible translation keys.
Format numbers and dates for the current language without changing stored values or business time-zone rules.
Reuse the existing language controls, preserve saved user preferences and check default behavior in a fresh browser context.
Check both languages in the application and report anything unverified.
```

## Without an agent

### Keep copy in application locale files

| Location | Responsibility |
| --- | --- |
| `client/locales/en-US.ts` | Application English copy and the `AppResource` type |
| `client/locales/zh-CN.ts` | Matching Chinese copy using the same resource structure |
| `client/locales/system/` | Template copy maintained with template upgrades |
| `client/locales/index.ts` | Browser locales and their loaders |
| `server/locales/` | Server-produced text and locale loaders |

Add business copy to application files, in groups such as `projects`. Do not put it in `system/`. Spread existing shared groups such as `navigation` or `actions` before extending them, so template keys remain available.

For example, add a `projects` group with the following count messages in both locale files. If the group already exists, append these keys without replacing its other content:

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

Use the application's translation hook:

```tsx
import { useTranslation } from '@nocobase/i18n/client';

export function ProjectCount({ count }: { count: number }) {
  const { t } = useTranslation();
  return <span>{t('projects.count', { count })}</span>;
}
```

Use interpolation for complete sentences such as creation confirmations rather than concatenating words. Reuse shared Save and Cancel keys; keep feature-specific successes and errors in their feature group so changes do not alter other pages.

Locale types check resource structure, but TypeScript may not catch `t('projects.titel')`. Run copy coverage tests and check the browser too.

### Format data and handle server copy

Read the current language with `useLocale()` and format displayed values with `Intl.NumberFormat` and `Intl.DateTimeFormat`. Locale formatting and business time zones are different concerns. Switching language must not modify stored dates, and date-only values should not accidentally become cross-time-zone timestamps.

Map API statuses and stable `reason` values to page copy, associating field errors with their inputs. Do not display arbitrary server `message` values directly as final user copy. Server-produced notifications, mail and other text belong in `server/locales/`. Background content follows the recipient's language, not the administrator who triggered it.

To reword plugin text, use the plugin namespace's `overrides` in application locale resources instead of editing installed packages. Check the owning plugin's locale contract rather than depending on internal keys.

### Add locales and set the default

Add a resource file and dynamic loader in the relevant `locales/index.ts`. Adding translations to a plugin alone does not add a language to the application's selector.

Client and server locale lists are independent. Add server resources when server-produced text needs that language, then run:

```bash
pnpm nocobase locales check
```

This checks matching language lists, not translation completeness. A client-only locale can work with server fallback, but the check reports the mismatch.

Set the default in `config.yml`:

```yaml
i18n:
  defaultLocale: zh-CN
```

A saved browser choice takes precedence. Verify defaults in a fresh browser context rather than clearing every user's preferences. Preserve `useSyncServerLocale()` so the server session follows supported browser choices.

## Verify results

Run the locale coverage and type checks for this example:

```bash
pnpm exec vitest run tests/client/app-locale-coverage.test.ts
pnpm exec tsc -p tsconfig.json --noEmit
```

Check both languages in the browser, including menus, empty states, field errors, plural counts and date formatting. Verify the default in a fresh browser context and confirm that an existing saved preference remains effective. Type checks do not replace checking displayed copy.
