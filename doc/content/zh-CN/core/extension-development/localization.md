---
title: 客户端多语言
description: 组织插件的客户端语言资源、命名空间和公共组件，验证显示与语言切换。
---

插件管理自己的文案，App 决定界面提供哪些语言以及用户当前选择的语言。本篇维护 `client/locales/`；请求和后台消息的文案见[服务端多语言](server-localization.md)。两端分别声明资源，使用相同的插件包名作为命名空间。

## 使用 Agent

```text
请给插件补齐多语言，把菜单、页面提示和错误文案放到插件自己的语言资源里。
对外导出的组件要明确使用插件命名空间。
保留并补齐生成的语言文件，测试中英文显示和语言切换，不要修改 App 的语言选择器。
```

## 创建语言资源

在 App 根目录执行，文件路径相对于 `packages/app-plugin-notice-i18n/`：

```bash
pnpm create @nocobase/plugin@beta notice-i18n --with client.components --with client.locales
```

`client.locales` 生成资源和动态加载器，并接到 `client/plugin.ts`。已有插件增加语言支持时，需要同时补齐资源文件、加载器和插件声明中的 `locales`，不能只增加 JSON 或 TypeScript 文件。

## 用英文定义键结构

替换 `client/locales/en-US.ts`：

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

替换 `client/locales/zh-CN.ts`：

```ts
import type { NoticeI18NResource } from './en-US.js';
const resource: NoticeI18NResource = {
  layout: '布局：{{mode}}',
  compact: '紧凑',
  comfortable: '舒适',
};
export default resource;
```

键名表达稳定含义，动态值通过 `{{mode}}` 等插值传入。其他语言使用同一个完整资源类型，不使用 `Partial` 掩盖遗漏。

脚手架还生成另外八种语言。按下面的值补齐各自文件，保留相同的 `layout`、`compact`、`comfortable` 键和类型，变量名使用对应语言标识，如 `zhTW`、`jaJP`：

| 语言 | `layout` | `compact` | `comfortable` |
| --- | --- | --- | --- |
| `zh-TW` | 版面配置：{{mode}} | 緊湊 | 舒適 |
| `ja-JP` | レイアウト：{{mode}} | コンパクト | ゆったり |
| `es-ES` | Diseño: {{mode}} | Compacto | Cómodo |
| `pt-BR` | Layout: {{mode}} | Compacto | Confortável |
| `fr-FR` | Disposition : {{mode}} | Compacte | Confortable |
| `de-DE` | Layout: {{mode}} | Kompakt | Komfortabel |
| `vi-VN` | Bố cục: {{mode}} | Gọn | Thoải mái |
| `id-ID` | Tata letak: {{mode}} | Ringkas | Nyaman |

保留 `client/locales/index.ts` 中每种语言各自的动态导入，不要改成启动时把所有资源直接导入。新增英文键后，其他语言的空对象也会导致类型检查失败；应补译，而不是只删加载器。

## 在组件中使用

替换生成的 `client/components/plugin-component.tsx`：

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

export function NoticeLabel(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notice-i18n');
  return <p>{t('layout', { mode: t('comfortable') })}</p>;
}
```

插件自己的页面或 React Provider 树下可以用不带参数的 `useTranslation()`，默认命名空间来自插件贡献。但这个组件可能由 App 或其他插件直接渲染，所以明确绑定包名。

绑定命名空间不等于注册资源。App 仍需在 `client/plugins.ts` 注册插件的 Client 工厂；单独导入组件不会自动执行注册。本例沿用生成的 `./client/components/plugin-component` 公开导出，App 可从该包路径导入 `NoticeLabel`。新增其他公开组件时，成对维护源码及 `publishConfig.exports`，规则见[插件结构](plugin-structure.md)。

<span id="服务端文案属于另一份资源"></span>

服务端资源、请求翻译与后台消息已单独整理到[服务端多语言](server-localization.md)。

## 验证资源和实际显示

用以下内容替换生成的 `tests/client/component.test.tsx`，不再直接调用带有 Hook 的组件函数：

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

测试故意不指定渲染器的默认 `namespace`，这样能发现对外组件错误依赖宿主命名空间的问题。还应在实际 App 中切换语言，验证已挂载组件、菜单、日期格式和错误提示一起变化。服务端与后台消息的验证见[服务端多语言](server-localization.md#验证接入结果)。

NocoBase 自身插件约定提供十种语言，App 可以只显示其中一部分。插件新增一种资源不会自动增加 App 的语言选项。App 特定的产品措辞可以通过自己的 locale overrides 覆盖插件键，而通用缺失翻译应修正插件源文件。

独立 App 使用插件的类型检查与行为测试。`pnpm i18n:check` 是 NocoBase 源码仓库的脚本，不能假设每个 App 都有这条命令。
