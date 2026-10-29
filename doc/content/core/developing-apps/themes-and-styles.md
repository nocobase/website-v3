---
title: Themes and styles
description: Use semantic styles, customize theme presets, and configure color modes and appearance defaults.
---

Use `client/styles.css` and `client/theme/` to maintain application appearance. Business components use shadcn components and semantic theme tokens so pages remain consistent across light and dark modes. Translate theme names using [Localization](localization.md).

The configuration examples follow default template `1.0.0-beta.81`; for a new project, check the corresponding configuration in its installed template. Color mode and theme preset are separate settings; distinguish their defaults from saved user choices.

## With an agent

```prompt
Please review theme consistency for the project feature.

Use the existing shadcn components and semantic theme tokens.
Tables, dialogs, inputs, errors and keyboard focus must remain readable in light and dark modes.
Apply shared style changes consistently across pages and check narrow layouts.
Reuse the existing appearance controls and preserve saved user preferences. Verify defaults separately.
Check the application and report anything unverified.
```

## Without an agent

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

After theme changes, run the theme tests and type check for this example:

```bash
pnpm exec vitest run tests/client/theme-tokens.test.ts tests/client/theme-preferences.test.ts tests/client/client-theme.test.tsx
pnpm exec tsc -p tsconfig.json --noEmit
```

Check both color modes and each changed preset on real pages, including narrow layouts, keyboard focus, dialogs and error states. Verify defaults separately from saved preferences. Type checks and CSS compilation cannot establish visual readability.
