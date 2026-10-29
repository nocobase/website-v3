---
title: Themes and styles
description: Use semantic styles and theme variables, adjust theme presets, and set color modes and the default appearance.
---

An application maintains its appearance in `client/styles.css` and `client/theme/`. Business components use shadcn primitives and semantic theme variables, so every page stays consistent in light and dark modes. For translating theme names, see [Localization](localization.md).

This guide follows default template `1.0.0-beta.81`, used by the getting-started example. Color mode and theme preset are two independent settings; also keep each one's default apart from the choices users have already saved.

## With an Agent

```text
Please review theme consistency for the project feature.

Use the existing shadcn components and semantic theme tokens.
Tables, dialogs, inputs, errors and keyboard focus must remain readable in light and dark modes.
Apply shared style changes consistently across pages and check narrow layouts.
Reuse the existing appearance controls and preserve saved user preferences. Verify defaults separately.
Check the application and report anything unverified.
```

## Without an Agent

### Use semantic theme variables

Business components use semantic classes such as `bg-background`, `text-foreground`, `text-muted-foreground` and `border-border`, and the theme decides the actual colors and sizes. Do not hard-code a light background on a page and then patch dark styles onto every component.

In the current example application, the theme files are:

| File | Responsibility |
| --- | --- |
| `client/theme/themes/compact.css` | The Compact theme, which is the default preset |
| `client/theme/themes/default.css` | The Spacious theme, with the ID `default` |
| `client/theme/theme-presets.ts` | The available presets and their translation keys |
| `client/styles.css` | Imports the presets and connects the theme variables to Tailwind |
| `client/theme/theme-provider.tsx` | Provides the existing theme state; do not create another Provider |

Color mode and theme preset are independent choices. A preset should define both light and dark rules rather than forcing users into one mode. Layout density, typography, corner radii and shadows should also be managed through theme variables.

### Adjust or add a theme

To adjust an existing preset, change its theme file and check every page that uses it. To add a separate brand preset:

1. Copy a complete preset to `client/theme/themes/brand.css`, keeping all color and non-color variables.
2. Change the light, dark and `.theme-preview` selectors to the new `data-theme='brand'`, then adjust the colors in each rule. A partial `--primary` override on its own is not a complete preset.
3. Import the new file in `client/styles.css`, keeping the existing presets and their import order.
4. Append `{ id: 'brand', labelKey: 'appearance.themes.brand' }` to `theme-presets.ts`, keep the order of the existing default entries, and provide English and Chinese translations for the label.
5. Check readability, focus and both color modes on real pages and in the preview, then run the theme tests.

These are instructions for adding a preset; the current example does not ship a ready-made theme named `brand`. Do not rerun `shadcn init`, add another `next-themes` Provider, or bypass the existing preset mechanism with global `:root` overrides.

### Set the default appearance

When using the existing themes, you can set the defaults in `config.yml`:

```yaml
client:
  app:
    defaultColorScheme: system
    defaultTheme: compact
```

`defaultColorScheme` accepts `light`, `dark` or `system`, and `defaultTheme` must be the ID of a registered preset. The order of precedence is: a valid choice saved in the browser first, then the configured default, and finally the built-in fallback. Note that `default` here is the ID of the Spacious preset, not a special instruction to pick a default theme automatically.

After changing the configuration, have the server load it and refresh the page. When code needs to read or change the appearance, use the existing `useTheme()` and `useThemePreset()`; do not read or write the storage keys or the attributes on `<html>` yourself.

## Verify results

After changing a theme, run this example's theme tests and type check:

```bash
pnpm exec vitest run tests/client/theme-tokens.test.ts tests/client/theme-preferences.test.ts tests/client/client-theme.test.tsx
pnpm exec tsc -p tsconfig.json --noEmit
```

Then check light mode, dark mode and every changed preset on real pages, including narrow layouts, keyboard focus, dialogs and error states. Verify the defaults separately from saved preferences. Type checks and CSS compilation cannot replace checking how the result actually reads.
