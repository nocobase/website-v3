---
title: テーマとスタイル
description: セマンティックなスタイルでコンポーネントを作り、テーマのプリセットをカスタマイズし、フックで見た目を切り替え、新しい訪問者向けの既定値を設定します。
---

業務の画面は、アプリの既存の shadcn コンポーネントとセマンティックなテーマのトークンで作ります。色、間隔、フォント、角の丸みはテーマのファイルで変更し、一覧、フォーム、ダイアログがまとめて追従するようにします。NocoBase UI Library のコンポーネントと業務ブロックも、同じコンポーネントの慣習に従います。

製品カタログの例は、既定のテンプレート `1.0.0-beta.85` を使います。製品の一覧、編集のダイアログ、3 つのプリセットが含まれます。製品の編集はメモリに残り、再読み込みでリセットされます。見た目の設定は、テンプレートのブラウザーのストレージの仕組みを使います。各機能を試す前に [サンプルを実行](#サンプルのソースとセットアップ) できます。

## カラーモードとテーマのプリセット

見た目には、独立した 2 つの設定があります。

- **カラーモード**：`light`、`dark`、`system` のいずれかで、ライトとダークのどちらのルールを使うかを選びます。`system` はオペレーティングシステムに従います。
- **テーマのプリセット**：パレット、フォント、密度、角の丸み、影。各プリセットはライトとダークの両方のモードに対応します。プリセットを選んでも、カラーモードは変わりません。

テンプレートには `compact`（Compact）と `default`（Spacious）が含まれます。`default` はプリセットの ID で、既定を自動で選ぶという指示ではありません。この例では `brand`（Brand）も登録しています。

これらのファイルはアプリのテンプレートに属し、アプリで管理できます。

| ファイル | 役割 |
| --- | --- |
| `client/theme/themes/*.css` | プリセットのトークンと、ライト・ダークのルール |
| `client/styles.css` | プリセットのインポートと、Tailwind のユーティリティへの接続 |
| `client/theme/theme-presets.ts` | プリセットの ID と、翻訳されるラベルのキー |
| `client/theme/theme-provider.tsx` | テーマの状態、保存された選択、タブ間の同期 |

`AppThemeProvider` は、すでにアプリのルートに登録されています。業務のコンポーネントはその状態を使うだけで、別の Provider も `shadcn init` の再実行も必要ありません。

## テーマのトークンでコンポーネントを作る

### 色と操作の状態

クラスは固定の色ではなく、目的で選びます。カタログのパネルは `bg-card text-card-foreground` を使い、補足のテキストには `text-muted-foreground` を使います。

```tsx
// client/pages/products/index.tsx: panel markup inside the component
<section className='overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm'>
  <div className='flex flex-col gap-2 border-b border-border p-6'>
    <h2 className='font-heading text-lg font-semibold'>{t('products.inventory')}</h2>
    <p className='text-sm text-muted-foreground'>{t('products.editHint')}</p>
  </div>
  <DataTable columns={columns} data={products} pagination={false} getRowId={(product) => product.id} />
</section>
```

`DataTable` はアプリの既存のテーブルコンポーネントで、`columns` と `products` はこのページで定義しています。インポート、列の定義、データについては [製品ページのソース](https://github.com/nocobase/docs-examples-v3/blob/d2a4fc7ef80558996299c2475abeefe049aa6874/apps/themes-and-styles/client/pages/products/index.tsx) を参照してください。

面と前景のクラスは組で選びます。

| 目的 | クラス |
| --- | --- |
| ページ | `bg-background text-foreground` |
| カードとパネル | `bg-card text-card-foreground` |
| 浮いている面 | `bg-popover text-popover-foreground` |
| 主要な操作 | `bg-primary text-primary-foreground` |
| 補足のテキスト | `text-muted-foreground` |
| 区切り線とエラーのテキスト | `border-border`、`text-destructive` |

ホバー、フォーカス、無効の状態をすでに扱っている既存のボタン、入力欄、ダイアログを再利用します。検証に失敗したときは、色だけに頼らず、`aria-invalid` を設定してエラーメッセージを表示します。[編集フォームのソース](https://github.com/nocobase/docs-examples-v3/blob/d2a4fc7ef80558996299c2475abeefe049aa6874/apps/themes-and-styles/client/pages/products/edit.tsx) を参照してください。

**Light → Compact** を選び、パネル、テーブル、ステータスのバッジを確認します。続いて **Dark** を選ぶと、同じコンポーネントがダークのトークンを使います。

![Compact プリセットでの製品一覧とセマンティックな色](/assets/core/themes-and-styles/compact-light.png)

### 間隔、角の丸み、フォント

寸法にもテーマのユーティリティを使います。上の例では、`p-6` は `--spacing` を、`rounded-lg` は `--radius` を、`shadow-sm` は `--shadow-sm` を読み取ります。見出しには `font-heading`、本文には `font-sans`、コードや SKU には `font-mono` を使います。

```tsx
// client/pages/products/index.tsx: contents of the SKU column
<code className='text-sm text-muted-foreground'>{row.original.sku}</code>
```

`text-sm` は、フォントサイズのトークンと行の高さのトークンの両方を使います。合わない固定の高さのままフォントサイズを変えると、入力欄やボタンのテキストが切れることがあるため、密度を調整するときはこれらの操作を確認してください。

**Spacious** を選ぶと、色はそのままでテーブルとパネルの間隔が広がります。**Brand** では、セリフ体の見出しと大きな角の丸みも示しています。[ブランドのプリセットを追加する](#ブランドのプリセットを追加する) を参照してください。

![Spacious プリセットでの製品一覧](/assets/core/themes-and-styles/default-light.png)

## テーマのプリセットをカスタマイズする

### 既存のプリセットを変更する

その CSS ファイルを直接編集します。この例では、`compact.css` の `--spacing` をテンプレートの `0.225rem` から `0.21rem` に変えています。

```css
/* client/theme/themes/compact.css: a token in the existing rule */
:root[data-theme='compact'],
.theme-preview[data-theme='compact'] {
  /* Retain the other tokens. */
  --spacing: 0.21rem;
}
```

**Compact** を選ぶと、[Compact のスクリーンショット](#色と操作の状態) のように、製品のパネル、ボタン、テーブルが詰まります。`.theme-preview` は、見た目の選択のサムネイルにも同じトークンを適用します。

テンプレートの Compact と Spacious のプリセットは、色、フォント、影を共有し、密度だけが異なります。共通のパレットやフォントを更新するときは、両方のファイルを変更します。それらと並べて別の見た目を残したい場合は、別のプリセットを追加します。ブラウザーの設定と構成がそれらを参照しているため、既存の ID は変えないでください。

[Compact プリセットのソースを見る](https://github.com/nocobase/docs-examples-v3/blob/d2a4fc7ef80558996299c2475abeefe049aa6874/apps/themes-and-styles/client/theme/themes/compact.css)

### ブランドのプリセットを追加する

完全なプリセットを `client/theme/themes/brand.css` にコピーし、そのセレクターの ID を `brand` に変えます。色と色以外のトークンをすべて残してから、必要な値を調整します。下の抜粋は一部の変更を示しています。残りのトークンは [Brand プリセットの全体](https://github.com/nocobase/docs-examples-v3/blob/d2a4fc7ef80558996299c2475abeefe049aa6874/apps/themes-and-styles/client/theme/themes/brand.css) に含まれています。

```css
/* client/theme/themes/brand.css: excerpt */
:root[data-theme='brand'],
.theme-preview[data-theme='brand'] {
  /* Retain the remaining tokens from the complete preset. */
  --font-heading: var(--font-serif);
  --spacing: 0.25rem;
  --radius: 0.75rem;
  --primary: #0f766e;
  --primary-foreground: rgb(255 255 255);
  --accent: #f0fdfa;
  --accent-foreground: #115e59;
  --ring: var(--primary);
}

:root.dark[data-theme='brand'],
:root.dark .theme-preview[data-theme='brand'] {
  /* Retain the full set of dark color tokens. */
  --primary: #5eead4;
  --primary-foreground: #042f2e;
  --accent: #134e4a;
  --accent-foreground: #99f6e4;
  --ring: var(--primary);
}
```

値は HEX、RGB、OKLCH などの完全な CSS の色で、追加の `hsl()` で包みません。背景と前景は一緒に調整し、ライト、ダーク、プレビューのセレクターを網羅します。新しいプリセットに、単独の `:root` や `:root.dark` のルールを含めないでください。ほかのプリセットのフォールバックの値を上書きすることがあります。

続いて、プリセットを 3 か所に接続します。

1. `client/styles.css` で、既存のプリセットのあとにインポートします。`default.css` は先頭のままにします。

   ```css
   @import './theme/themes/default.css';
   @import './theme/themes/compact.css';
   @import './theme/themes/brand.css';
   ```

2. `client/theme/theme-presets.ts` に追加します。`compact` は先頭のままにします。

   ```ts
   export const themePresets = [
     { id: 'compact', labelKey: 'appearance.themes.compact' },
     { id: 'default', labelKey: 'appearance.themes.default' },
     { id: 'brand', labelKey: 'appearance.themes.brand' },
   ] as const;

   export type ThemePresetId = (typeof themePresets)[number]['id'];
   ```

3. 既存の翻訳を残したまま、アプリのロケールファイルを拡張します。英語のエントリーを下に示します。中国語のファイルでも同じように、`systemZhCN.appearance` に `brand: '品牌'` を追加します。[多言語化](localization.md) を参照してください。

   ```ts
   // client/locales/en-US.ts: a field in the enUS object
   appearance: {
     ...systemEnUS.appearance,
     themes: { ...systemEnUS.appearance.themes, brand: 'Brand' },
   },
   ```

[スタイルシートの入口](https://github.com/nocobase/docs-examples-v3/blob/d2a4fc7ef80558996299c2475abeefe049aa6874/apps/themes-and-styles/client/styles.css)、[プリセットの一覧](https://github.com/nocobase/docs-examples-v3/blob/d2a4fc7ef80558996299c2475abeefe049aa6874/apps/themes-and-styles/client/theme/theme-presets.ts)、[ロケールのソース](https://github.com/nocobase/docs-examples-v3/tree/d2a4fc7ef80558996299c2475abeefe049aa6874/apps/themes-and-styles/client/locales) に、実装の全体があります。

見た目のパネルには、新しいプリセットが自動で表示されます。**Brand** を選んでから **Light** と **Dark** を選ぶと、主要な色、見出しのフォント、角の丸みが一緒に変わる様子が見られます。

![ライトモードの Brand プリセット](/assets/core/themes-and-styles/brand-light.png)

![ダークモードの Brand プリセット](/assets/core/themes-and-styles/brand-dark.png)

## 見た目を読み取って変更する

### カラーモードを変更する

`next-themes` から `useTheme()` をインポートします。`theme` は選択された `light`、`dark`、`system` の値で、`resolvedTheme` は実際のライトまたはダークのモードです。選択は `setTheme()` で変更します。

```tsx
// client/pages/products/appearance-controls.tsx: ColorModeControls excerpt
import { useTheme } from 'next-themes';
import { Button } from '#components/ui/button';

// Inside the component; t comes from useTranslation().
const { theme, resolvedTheme, setTheme } = useTheme();

// Render the mode buttons.
{(['light', 'dark', 'system'] as const).map((mode) => (
  <Button
    key={mode}
    variant={theme === mode ? 'default' : 'outline'}
    aria-pressed={theme === mode}
    onClick={() => setTheme(mode)}
  >
    {t(`appearance.${mode}`)}
  </Button>
))}
```

**System** を選びます。ページの **Applied mode** は `resolvedTheme` を読み取ります。オペレーティングシステムの見た目を変えると、**System** が選択されたまま、適用されるモードが追従します。システムモードで実際の色を判定するのに、`theme === 'dark'` を使わないでください。

![システムモードで、ライトの見た目が適用されている状態](/assets/core/themes-and-styles/system-light.png)

[カラーモードのコンポーネントを見る](https://github.com/nocobase/docs-examples-v3/blob/d2a4fc7ef80558996299c2475abeefe049aa6874/apps/themes-and-styles/client/pages/products/appearance-controls.tsx)

### テーマのプリセットを変更する

アプリのテンプレートの `useThemePreset()` は、現在の `preset` と `setPreset()` 関数を返します。この例では一覧からボタンを作るため、ID の型は登録されたプリセットに従います。

```tsx
// client/pages/products/appearance-controls.tsx: PresetControls excerpt
import { useThemePreset } from '../../theme/theme-context.js';
import { themePresets } from '../../theme/theme-presets.js';

// Inside the component; Button and t are the same as in the previous example.
const { preset, setPreset } = useThemePreset();

{themePresets.map(({ id, labelKey }) => (
  <Button
    key={id}
    variant={preset === id ? 'default' : 'outline'}
    aria-pressed={preset === id}
    onClick={() => setPreset(id)}
  >
    {t(labelKey)}
  </Button>
))}
```

両方のフックは、既存の `AppThemeProvider` の中で使います。業務のコンポーネントで、ストレージのキーや `<html>` の属性を操作したり、見た目の選択の 2 つ目のコピーをローカルの状態に持ったりしないでください。

製品のページでプリセットを選び、右上の **Appearance** を開きます。対応するオプションとサムネイルが選択されています。そこでプリセットを変えると、ページのボタンも更新されます。再読み込みしたり、同じアプリを別のタブで開いたりしても、選択は保たれます。

![Brand とそのダークのサムネイルが表示された見た目のパネル](/assets/core/themes-and-styles/appearance-preview.png)

[プリセットのコンポーネントを見る](https://github.com/nocobase/docs-examples-v3/blob/d2a4fc7ef80558996299c2475abeefe049aa6874/apps/themes-and-styles/client/pages/products/appearance-controls.tsx)

## 見た目の既定値を設定する

### 既定のモードとプリセットを設定する

保存された設定のないブラウザーにダークの Brand の見た目を与えるには、アプリのルートで次のコマンドを実行します。

```bash
pnpm nocobase config set client.app.defaultColorScheme=dark client.app.defaultTheme=brand --json
```

これにより、`config.yml` に次の値が設定されます。

```yaml
client:
  app:
    defaultColorScheme: dark
    defaultTheme: brand
```

`defaultColorScheme` には `light`、`dark`、`system` のいずれかを、`defaultTheme` には登録されたプリセットの名前を指定します。開発モードでは、設定を変更するとサーバーが再起動します。それ以外のモードでは、サーバーを再起動してからページを再読み込みします。この設定を `AppThemeProvider` の `defaultTheme` プロパティで置き換えないでください。起動時と React のマウント時で、異なる既定値が使われるおそれがあります。

新しいプライベートウィンドウで製品のページを開きます。**Dark** と **Brand** が選択されているはずです。これはユーザーの明示的な設定を保存せずに、既定値を適用するものです。

![設定したダークの Brand の既定値を使う新しいブラウザー](/assets/core/themes-and-styles/configured-defaults.png)

この例の初期設定に戻します。

```bash
pnpm nocobase config set client.app.defaultColorScheme=system client.app.defaultTheme=compact --json
```

[サンプルの設定を見る](https://github.com/nocobase/docs-examples-v3/blob/d2a4fc7ef80558996299c2475abeefe049aa6874/apps/themes-and-styles/config.example.yml)

### 既定値と保存された設定

それぞれの設定は、最初に見つかった有効な取得元を独立して使います。ブラウザーで保存された選択、`config.yml` の既定値、組み込みのフォールバックの順です。カラーモードのフォールバックは `system`、プリセットのフォールバックは一覧の最初のエントリーで、この例では `compact` です。無効なモードと、登録されていないプリセットの ID は無視されます。

これを確認するには、あるウィンドウで **Light → Spacious** を選んでから、設定の既定値を **Dark → Brand** に変えます。元のウィンドウを再読み込みすると Light と Spacious のままで、新しいプライベートウィンドウでは Dark と Brand が使われます。カラーモードだけを保存した場合、プリセットは設定の既定値を自由に使え、その逆も同様です。

設定は、ブラウザーのオリジンとアプリのデプロイのパスごとに分離されます。サインインしたアカウントを通じて、デバイス間で同期されることはありません。ストレージが使えない場合も、現在のページでは選択が機能しますが、再読み込みすると残らないことがあります。

[設定の解決のソースを見る](https://github.com/nocobase/docs-examples-v3/blob/d2a4fc7ef80558996299c2475abeefe049aa6874/apps/themes-and-styles/client/theme/theme-preferences.ts)

## 使われているテーマを確認する

プリセットを編集したら、ライトモード、ダークモード、狭いレイアウトで、実際のページを確認します。本文、補足のテキスト、主要なボタン、キーボードのフォーカス、ダイアログには特に注意してください。前景と背景のコントラストは一緒に確認します。CSS のビルドが成功しても、読みやすさは確認できません。

**Arc desk lamp** を選び、製品名を消して、価格に `-1` を入力し、**Save** を選びます。ダイアログは入力を保ち、2 つのエラーを表示して、名前のフィールドにフォーカスを移すはずです。修正して保存すると一覧が更新され、再読み込みするとデモのデータに戻ります。Escape でキャンセルすると、ダイアログを開いた製品のリンクにフォーカスが戻ります。

![ライトの Brand プリセットでの検証エラーとフォーカス](/assets/core/themes-and-styles/brand-error-light.png)

![ダークの Brand プリセットでの検証エラーとフォーカス](/assets/core/themes-and-styles/brand-error-dark.png)

狭い画面では、見た目の操作が縦に並びます。幅の広いテーブルは、ページ全体を広げるのではなく、自分の領域の中でスクロールします。

サンプルのアプリのルートで、テーマとページのテストと型チェックを実行します。

```bash
pnpm exec vitest run tests/client/theme-tokens.test.ts tests/client/theme-preferences.test.ts tests/client/client-theme.test.tsx tests/client/app-locale-coverage.test.ts tests/client/products.test.tsx
pnpm exec tsc -p tsconfig.json --noEmit
```

これらのテストは、トークンの網羅性、設定のフォールバック、切り替え、フォームの操作を網羅しています。サンプルの README には、ブラウザーのテストのコマンドが記載されています。スクリーンショットと自動のアサーションに加えて、目視での読みやすさの確認も必要です。

## サンプルのソースとセットアップ

[サンプルの全体と README](https://github.com/nocobase/docs-examples-v3/tree/d2a4fc7ef80558996299c2475abeefe049aa6874/apps/themes-and-styles) には、Node.js 24 以降と pnpm 11 が必要です。依存関係は、コミットされた `pnpm-lock.yaml` で固定されています。別のディレクトリでソースを取得します。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout d2a4fc7ef80558996299c2475abeefe049aa6874
cd apps/themes-and-styles
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite --json
pnpm nocobase config check --json
pnpm dev
```

起動時に表示されるアプリの URL に `products` を付けます。`/main/` にマウントされたアプリでは、デモは `/main/products` にあります。デモのページにはサインインは不要です。SQLite はこの単独の例を実行するために使っており、テーマは特定のデータベースや外部のサービスに依存しません。既存のアプリでは、初期化し直さずに既存の設定を使ってください。

README では、各使い方をソースファイルに対応付け、ブラウザーでのチェックを示し、検証の範囲を記録しています。カタログは固定の英語のデモデータを使い、製品の API は呼び出しません。
