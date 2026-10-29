---
title: Client localization
description: Organize Client resources, namespaces and public components, and verify rendering and language changes.
---

Plugins own their copy. The App chooses which languages it offers and which language the user selects. This article maintains `client/locales/`; see [Server localization](server-localization.md) for request and background-message copy. Client and Server declare resources separately, using the full plugin package name as their namespace.

## Use an Agent

```text
Add plugin-owned translations for menus, page feedback and errors.
Bind the plugin namespace explicitly in exported components.
Complete the generated language files and test English, Chinese and language switching.
Keep language selection owned by the App.
```

## Create locale resources

Run from the App root. Paths are relative to `packages/app-plugin-notice-i18n/`:

```bash
pnpm create @nocobase/plugin@beta notice-i18n --with client.components --with client.locales
```

`client.locales` generates resources and lazy loaders and connects them to `client/plugin.ts`. When adding localization to an existing plugin, provide all three: resource files, loaders and the `locales` declaration. Files alone do not register resources.

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

Use stable semantic keys and interpolate dynamic values such as `{{mode}}`. Type every language against the complete resource shape rather than hiding omissions with `Partial`.

The scaffold also generates eight other languages. Fill their files with these values, preserving the same keys and resource type. Use locale-based variable names such as `zhTW` and `jaJP`:

| Locale | `layout` | `compact` | `comfortable` |
| --- | --- | --- | --- |
| `zh-TW` | 版面配置：{{mode}} | 緊湊 | 舒適 |
| `ja-JP` | レイアウト：{{mode}} | コンパクト | ゆったり |
| `es-ES` | Diseño: {{mode}} | Compacto | Cómodo |
| `pt-BR` | Layout: {{mode}} | Compacto | Confortável |
| `fr-FR` | Disposition : {{mode}} | Compacte | Confortable |
| `de-DE` | Layout: {{mode}} | Kompakt | Komfortabel |
| `vi-VN` | Bố cục: {{mode}} | Gọn | Thoải mái |
| `id-ID` | Tata letak: {{mode}} | Ringkas | Nyaman |

Keep each language’s dynamic import in `client/locales/index.ts`; do not eagerly load every resource at startup. Adding an English key makes empty resources fail type checking. Complete the translations instead of only removing loaders.

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

Pages and React Provider trees contributed by the plugin inherit its namespace, so they can call `useTranslation()` without an argument. This component may be rendered by an App or another plugin, so it explicitly binds the package namespace.

Binding a namespace does not register its resources. The App still registers the Client factory in `client/plugins.ts`; importing a component alone does not do so. This example retains the generated `./client/components/plugin-component` public export, from which the App can import `NoticeLabel`. For other public components, maintain paired source and `publishConfig.exports` entries as explained in [Plugin structure](plugin-structure.md).

<span id="server-copy-has-separate-resources"></span>

Server resources, request translation and background messages are covered in [Server localization](server-localization.md).

## Verify structure and rendering

Replace the generated `tests/client/component.test.tsx`; do not directly call a component function that uses Hooks:

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

The test deliberately omits a default rendering `namespace`, exposing components that accidentally depend on their host’s namespace. Also switch language in the running App and check mounted components, menus, date formatting and errors. See [Server localization](server-localization.md#verify-integration) for request and background-message checks.

NocoBase’s own plugins provide ten languages; an App may offer a subset. Plugin resources do not automatically add languages to the App selector. An App can override product wording in its locale overrides, while missing general translations belong in plugin source.

Use plugin type checks and behavior tests in an independent App. `pnpm i18n:check` is a NocoBase source-repository script, not a command every App provides.
