---
title: Localization and themes
description: Organize translations and locales, configure default language and appearance, and keep interfaces consistent through theme tokens.
---

Localization and themes shape the whole application. New business pages should use existing translation, language-switching and appearance mechanisms so menus, forms, errors and color modes remain consistent.

This guide follows default template `1.0.0-beta.81`, used by the current getting-started example. `projects` is an example of new business copy. Distinguish language, color-scheme, and theme defaults from preferences users have already saved.

## With an agent

```text
Please review localization and theme consistency for the project feature.

Menus, buttons, field hints, empty states and success and error feedback need complete English and Chinese copy without visible translation keys.
Changing language should format numbers and dates for that language without changing stored values or business time-zone rules.
Tables, dialogs, inputs, errors and keyboard focus must remain readable in light and dark modes.

Reuse existing language and appearance controls and preserve saved user preferences.
If theme changes are needed, change shared styles consistently rather than recoloring only Projects.
Check both languages and both color modes in the application, and report anything unverified.
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

### Use semantic theme tokens

Use semantic classes such as `bg-background`, `text-foreground`, `text-muted-foreground` and `border-border`. Themes provide colors and dimensions. Avoid hard-coded light backgrounds followed by separate dark fixes in every component.

The current example organizes themes as follows:

| File | Responsibility |
| --- | --- |
| `client/theme/themes/compact.css` | Compact, the default preset |
| `client/theme/themes/default.css` | Spacious, with ID `default` |
| `client/theme/theme-presets.ts` | Available presets and label keys |
| `client/styles.css` | Preset imports and Tailwind token connections |
| `client/theme/theme-provider.tsx` | Existing theme state; do not add another Provider |

Color mode and preset are independent choices. A preset defines light and dark rules instead of forcing a mode. Manage density, typography, radii and shadows through tokens too.

### Change or add a theme

For an existing preset, edit its theme file and check all affected pages. To add an independent brand preset:

1. Copy a complete preset to `client/theme/themes/brand.css`, retaining all color and non-color tokens.
2. Change light, dark and `.theme-preview` selectors to `data-theme='brand'`, then adjust colors in each rule. A partial `--primary` override is not a complete preset.
3. Import the file from `client/styles.css`, preserving existing presets and import order.
4. Append `{ id: 'brand', labelKey: 'appearance.themes.brand' }` to `theme-presets.ts`, preserve the existing fallback order and translate the label into both languages.
5. Check readability, focus and color modes in actual pages and previews, then run theme tests.

These are instructions for creating a preset; the example does not ship a finished `brand` theme. Do not rerun `shadcn init`, introduce another `next-themes` Provider or bypass presets with global `:root` overrides.

### Set appearance defaults

For existing presets, configure `config.yml`:

```yaml
client:
  app:
    defaultColorScheme: system
    defaultTheme: compact
```

`defaultColorScheme` accepts `light`, `dark` or `system`; `defaultTheme` names a registered preset. Valid saved browser choices win, followed by configured defaults and built-in fallbacks. `default` is the Spacious preset's ID, not a special instruction to choose automatically.

Reload server configuration and refresh the page after changes. Code reads or changes appearance through existing `useTheme()` and `useThemePreset()` hooks, not direct storage-key or `<html>` attribute manipulation.

## Verify results

For copy edits, run relevant locale and type checks. Add theme tests for theme changes:

```bash
pnpm exec vitest run tests/client/app-locale-coverage.test.ts
pnpm exec tsc -p tsconfig.json --noEmit
pnpm exec vitest run tests/client/theme-tokens.test.ts tests/client/theme-preferences.test.ts tests/client/client-theme.test.tsx
```

Check both languages, light and dark modes, narrow screens, keyboard focus, empty states and field errors in the browser. Verify defaults separately from saved preferences. Types and CSS compilation cannot establish visual readability.
