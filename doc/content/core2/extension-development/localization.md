---
title: Client localization
description: Organize a plugin's client language resources, namespace and public components, and verify text display and language switching.
---

A plugin manages its own text, while the App decides which languages the interface offers and which one the user has chosen. This guide maintains `client/locales/`; for text in requests and background messages, see [Server localization](server-localization.md). Each side declares its own resources, and both use the same plugin package name as the namespace.

## Use an Agent

```text
Add plugin-owned translations for menus, page feedback and errors.
Bind the plugin namespace explicitly in exported components.
Complete the generated language files and test English, Chinese and language switching.
Keep language selection owned by the App.
```

## Create locale resources

Run in the App root; file paths are relative to `packages/app-plugin-notice-i18n/`:

```bash
pnpm create @nocobase/plugin@beta notice-i18n --with client.components --with client.locales
```

`client.locales` generates the language resources and dynamic loaders and connects them to `client/plugin.ts`. When adding language support to an existing plugin, add the resource files, the loaders and `locales` in the plugin declaration together; adding JSON or TypeScript files alone is not enough.

## Define keys in English

Replace `client/locales/en-US.ts`:

```ts
import type { LocaleResource } from '@nocobase/i18n';
const enUS = {
  layout: 'Layout: {{mode}}',
  compact: 'Compact',
  comfortable: 'Comfortable',
};
export type NoticeI18NResource = LocaleResource<typeof enUS>;
export default enUS;
```

Replace `client/locales/zh-CN.ts`:

```ts
import type { NoticeI18NResource } from './en-US.js';
const resource: NoticeI18NResource = {
  layout: '布局：{{mode}}',
  compact: '紧凑',
  comfortable: '舒适',
};
export default resource;
```

Key names should express stable meanings, and dynamic values are passed in through interpolation such as `{{mode}}`. Every other language uses the same complete resource type; do not hide omissions with `Partial`.

The scaffold also generates eight other languages. Fill in their files with the values in the table below, keeping the same `layout`, `compact` and `comfortable` keys and type, and name variables after the language identifier, such as `zhTW` and `jaJP`:

| Language | `layout` | `compact` | `comfortable` |
| --- | --- | --- | --- |
| `zh-TW` | 版面配置：{{mode}} | 緊湊 | 舒適 |
| `ja-JP` | レイアウト：{{mode}} | コンパクト | ゆったり |
| `es-ES` | Diseño: {{mode}} | Compacto | Cómodo |
| `pt-BR` | Layout: {{mode}} | Compacto | Confortável |
| `fr-FR` | Disposition : {{mode}} | Compacte | Confortable |
| `de-DE` | Layout: {{mode}} | Kompakt | Komfortabel |
| `vi-VN` | Bố cục: {{mode}} | Gọn | Thoải mái |
| `id-ID` | Tata letak: {{mode}} | Ringkas | Nyaman |

Keep each language's own dynamic import in `client/locales/index.ts`; do not change it to import every resource directly at startup. After adding an English key, empty objects in other languages also fail type checks; add the translations then, rather than just deleting the loaders.

## Use translations in a component

Replace the generated `client/components/plugin-component.tsx`:

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

export function NoticeLabel(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notice-i18n');
  return <p>{t('layout', { mode: t('comfortable') })}</p>;
}
```

Under the plugin's own pages or React Provider tree, `useTranslation()` without arguments works, with the default namespace coming from the plugin's contribution. But this component may be rendered directly by the App or another plugin, so it binds the package name explicitly.

Binding a namespace does not register the resources. The App still registers the plugin's Client factory in `client/plugins.ts`; importing the component alone does not register anything. This example keeps the generated public export `./client/components/plugin-component`, from which the App can import `NoticeLabel`. When adding other public components, maintain the source exports and `publishConfig.exports` as a pair; the rules are in [Plugin structure](plugin-structure.md).

<span id="server-copy-has-separate-resources"></span>

Server resources, request translation and background messages are covered separately in [Server localization](server-localization.md).

## Verify structure and rendering

Replace the generated `tests/client/component.test.tsx` with the following, so it no longer calls a component function that uses Hooks directly:

```tsx
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { renderWithApp } from '@nocobase/app-testing/client';
import { act, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import plugin from '../../client/index.js';
import locales from '../../client/locales/index.js';
import { NoticeLabel } from '../../client/components/plugin-component.js';

it.each([
  ['en-US', 'Layout: Comfortable'],
  ['zh-CN', '布局：舒适'],
])('renders the plugin namespace in %s', async (locale, text) => {
  await renderWithApp(<NoticeLabel />, { plugins: [plugin()], locale });
  expect(screen.getByText(text)).toBeInTheDocument();
});

it('updates a mounted component when the language changes', async () => {
  const runtime = await createTestI18nRuntime({
    namespaces: { '@nocobase/app-plugin-notice-i18n': locales },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <NoticeLabel />
    </TestI18nProvider>,
  );
  expect(screen.getByText('Layout: Comfortable')).toBeInTheDocument();
  await act(async () => {
    await runtime.changeLanguage('zh-CN');
  });
  expect(screen.getByText('布局：舒适')).toBeInTheDocument();
});
```

```bash
pnpm --filter @nocobase/app-plugin-notice-i18n format
pnpm --filter @nocobase/app-plugin-notice-i18n check
```

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-i18n --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-i18n --no-install
```

The test deliberately gives the renderer no default `namespace`, so that exposed components that wrongly depend on the host's namespace are caught. Also switch languages in a real App and verify that mounted components, menus, date formats and error messages change together. For verifying the server and background messages, see [Server localization](server-localization.md#verify-integration).

NocoBase's own plugins conventionally provide ten languages, and an App may show only some of them. Adding a language resource to a plugin does not add a language option to the App. App-specific product wording can override the plugin's keys through the App's own locale overrides, while missing general translations should be fixed in the plugin's source files.

In a standalone App, use the plugin's type checks and behavior tests. `pnpm i18n:check` is a script in the NocoBase source repository; do not assume every App has this command.
