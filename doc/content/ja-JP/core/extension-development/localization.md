---
title: クライアントの多言語化
description: Client のリソース、名前空間、公開のコンポーネントを整理し、レンダリングと言語の切り替えを確認します。
---

文言はプラグインが所有します。どの言語を提供するか、ユーザーがどの言語を選ぶかはアプリが決めます。この記事では `client/locales/` を管理します。リクエストとバックグラウンドのメッセージの文言については [サーバーの多言語化](server-localization.md) を参照してください。Client と Server はリソースを別々に宣言し、どちらもプラグインのパッケージの完全な名前を名前空間に使います。

## エージェントを使う場合

```text
メニュー、ページのフィードバック、エラーに、プラグインが所有する翻訳を追加してください。
エクスポートするコンポーネントでは、プラグインの名前空間を明示的に指定してください。
生成された言語のファイルをすべて埋め、英語、中国語、言語の切り替えをテストしてください。
言語の選択はアプリに任せてください。
```

## ロケールリソースを作成する

アプリのルートで実行します。パスは `packages/app-plugin-notice-i18n/` からの相対パスです。

```bash
pnpm create @nocobase/plugin@beta notice-i18n --with client.components --with client.locales
```

`client.locales` は、リソースと遅延読み込みのローダーを生成し、`client/plugin.ts` につなぎます。既存のプラグインに多言語化を追加する場合は、リソースのファイル、ローダー、`locales` の宣言の 3 つすべてを用意します。ファイルだけでは、リソースは登録されません。

## 英語でキーを定義する

`client/locales/en-US.ts` を置き換えます。

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

`client/locales/zh-CN.ts` を置き換えます。

```ts
import type { NoticeI18NResource } from './en-US.js';
const resource: NoticeI18NResource = {
  layout: '布局：{{mode}}',
  compact: '紧凑',
  comfortable: '舒适',
};
export default resource;
```

安定した意味のあるキーを使い、`{{mode}}` のような動的な値は補間します。`Partial` で抜けを隠すのではなく、すべての言語を完全なリソースの形に対して型付けします。

ひな形はほかに 8 つの言語も生成します。同じキーとリソースの型を保ったまま、それぞれのファイルに次の値を入れます。変数名には `zhTW` や `jaJP` のようにロケールに基づく名前を使います。

| ロケール | `layout` | `compact` | `comfortable` |
| --- | --- | --- | --- |
| `zh-TW` | 版面配置：{{mode}} | 緊湊 | 舒適 |
| `ja-JP` | レイアウト：{{mode}} | コンパクト | ゆったり |
| `es-ES` | Diseño: {{mode}} | Compacto | Cómodo |
| `pt-BR` | Layout: {{mode}} | Compacto | Confortável |
| `fr-FR` | Disposition : {{mode}} | Compacte | Confortable |
| `de-DE` | Layout: {{mode}} | Kompakt | Komfortabel |
| `vi-VN` | Bố cục: {{mode}} | Gọn | Thoải mái |
| `id-ID` | Tata letak: {{mode}} | Ringkas | Nyaman |

`client/locales/index.ts` の各言語の動的インポートは保ちます。起動時にすべてのリソースを一度に読み込まないでください。英語のキーを追加すると、空のリソースは型チェックに失敗します。ローダーを削除するのではなく、翻訳を埋めてください。

## コンポーネントで翻訳を使う

生成された `client/components/plugin-component.tsx` を置き換えます。

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

export function NoticeLabel(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notice-i18n');
  return <p>{t('layout', { mode: t('comfortable') })}</p>;
}
```

プラグインが提供するページと React の Provider のツリーは、その名前空間を引き継ぐため、引数なしで `useTranslation()` を呼び出せます。このコンポーネントはアプリやほかのプラグインがレンダリングすることもあるため、パッケージの名前空間を明示的に指定しています。

名前空間を指定しても、そのリソースは登録されません。アプリが `client/plugins.ts` で Client のファクトリーを登録する必要があり、コンポーネントをインポートするだけでは登録されません。この例では、生成された `./client/components/plugin-component` の公開のエクスポートを残しているため、アプリはそこから `NoticeLabel` をインポートできます。ほかの公開のコンポーネントについては、[プラグインの構成](plugin-structure.md) で説明しているとおり、ソースと `publishConfig.exports` のエントリーを対にして管理します。

<span id="server-copy-has-separate-resources"></span>

Server のリソース、リクエストの翻訳、バックグラウンドのメッセージについては [サーバーの多言語化](server-localization.md) で扱います。

## 構造とレンダリングを確認する

生成された `tests/client/component.test.tsx` を置き換えます。Hooks を使うコンポーネントの関数を直接呼び出さないでください。

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

このテストは、レンダリングの既定の `namespace` をわざと省き、ホストの名前空間に意図せず依存しているコンポーネントがわかるようにしています。動作中のアプリでも言語を切り替え、マウントされたコンポーネント、メニュー、日付の書式、エラーを確認してください。リクエストとバックグラウンドのメッセージの確認については [サーバーの多言語化](server-localization.md#組み込みを確認する) を参照してください。

NocoBase 自身のプラグインは 10 の言語を提供していますが、アプリはその一部だけを提供することもできます。プラグインのリソースによって、アプリの言語の選択肢が自動で増えることはありません。アプリは、ロケールの上書きで製品の言い回しを変えられます。一般的な翻訳の抜けは、プラグインのソースで補うべきものです。

プラグインの型チェックと、独立したアプリでの動作のテストを使ってください。`pnpm i18n:check` は NocoBase のソースリポジトリのスクリプトで、すべてのアプリにあるコマンドではありません。
