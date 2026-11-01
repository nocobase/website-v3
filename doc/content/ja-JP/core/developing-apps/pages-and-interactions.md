---
title: UI コンポーネントと操作
description: shadcn の慣習に従い、NocoBase UI Library のソースのコンポーネント、業務ブロック、ルートのダイアログ、アプリのコンテキストを組み込みます。
---

NocoBase のアプリは、UI について shadcn の慣習に従います。コンポーネントのソースはアプリの中にあり、ページがそれをデータと操作に接続し、アプリが独自のコンポーネントと操作のパターンを管理します。

以下の製品カタログの例で、それぞれの使い方を示します。製品、人、レビューの履歴はフィクスチャーです。製品の編集は完全に再読み込みするまで残り、レビューのメモはページを離れるとリセットされます。アプリの全体と起動の手順は、最後の [サンプルのソースとセットアップ](#サンプルのソースとセットアップ) を参照してください。

## コンポーネントの慣習

### 全体を通して shadcn の慣習に従う

共通のテーマ、操作、アクセシビリティの動作を保つため、アプリの shadcn のボタン、入力欄、フォーム、確認のダイアログを使います。[NocoBase UI Library](https://ui.nocobase.com/) は、同じ慣習に従い、shadcn Registry を通じて NocoBase アプリ向けのコンポーネントと業務ブロックを配布しています。

この例では、テンプレート `1.0.0-beta.85` の Base UI のコンポーネントを使います。インストールされたソースの組み合わせの API に従ってください。たとえばこれらのコンポーネントは `render` を使うので、別の実装の `asChild` の API を混ぜないでください。コンポーネントの一般的な使い方は [shadcn のドキュメント](https://ui.shadcn.com/docs) を参照してください。

### まずアプリの既存のコンポーネントを再利用する

まず `client/components/` と既存のページを確認します。既定のテンプレートには、すでに `PageContainer`、`PageHeader`、`DataTable`、ルートのオーバーレイが用意されています。プリミティブは `client/components/ui/` にあります。足りないコンポーネントは、プロジェクトの shadcn CLI で追加します。

製品カタログは、`DataTable`、`Input`、行の操作メニューを再利用し、在庫の状態には共有の `StockBadge` を使っています。別のテーブルやボタンの実装は必要ありません。

```tsx
import { PageHeader } from '#components/page-header';
import { DataTable } from '#components/data-table';
import { Input } from '#components/ui/input';

// Composition inside CatalogPage; see the full source for filtering, columns and state.
<PageHeader title={t('catalog.title')} description={t('catalog.description')} />
<DataTable
  data={products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))}
  columns={columns}
  pagination={false}
  toolbar={() => (
    <Input
      aria-label={t('catalog.search')}
      placeholder={t('catalog.search')}
      value={query}
      onChange={(event) => setQuery(event.target.value)}
    />
  )}
/>
```

**Product catalog** を開き、製品を検索するか、行のメニューから **Edit** を選びます。[カタログのソースを見る](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/catalog.tsx)。

![既存のヘッダー、テーブル、検索の入力欄、行のメニューで組み立てた製品カタログ](/assets/core/developing-apps/pages-and-interactions/catalog.png)

## NocoBase UI Library を使う

### Registry を設定してコンポーネントを追加する

既定のテンプレートは、すでに `components.json` で NocoBase Registry を設定しています。アプリにない場合は、既存の設定に次のエントリーを追加します。

```json
{
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  }
}
```

アプリのルートで、プロジェクトにインストールされた CLI を実行します。たとえば、ページのヘッダーや承認の表示ブロックを追加します。

```bash
pnpm exec shadcn add @nocobase/page-header
pnpm exec shadcn add @nocobase/approval-ui
```

既存のコンポーネントはそのまま使います。CLI がファイルの上書きを尋ねたときは、既存のコピーを残し、先に差分を確認してください。ブロックを追加しても、アプリのプリミティブを無差別に上書きすべきではありません。

`approval-ui` をインストールすると、この例には 13 のファイルが追加されました。主なソースの場所は次のとおりです。

```text
client/components/page-header.tsx
client/extensions/nocobase-approval-ui/
  index.ts
  types.ts
  approval-progress.tsx
  approval-timeline.tsx
  approval-action-bar.tsx
  approval-ui-provider.tsx
  locales/
  ...
```

[Registry の設定を見る](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/components.json) · [インストールされたブロックを見る](https://github.com/nocobase/docs-examples-v3/tree/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/extensions/nocobase-approval-ui)。

### コンポーネントと業務ブロックを使う

アプリのソースのパスからインポートします。個々のコンポーネントは通常 `client/components/` にあり、ブロックは複数のコンポーネント、型、ロケールリソースを含み、通常は `client/extensions/nocobase-<name>/` 以下にあります。

この例の **Review block** ページは、進捗、履歴、操作バーを組み合わせています。

```tsx
import {
  ApprovalProgress,
  ApprovalTimeline,
  ApprovalActionBar,
} from '#extensions/nocobase-approval-ui/index';

// Composition inside ReviewPage; the page supplies steps, lines and actions.
<ApprovalProgress steps={steps} />
<ApprovalTimeline lines={lines} />
<ApprovalActionBar actions={actions} />
```

**Review block** を開くと、提出された製品の情報と、進行中の内容のレビューが表示されます。[ブロックの組み立てを見る](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/review.tsx)。

![進捗、履歴、操作を組み合わせた製品レビューのページ](/assets/core/developing-apps/pages-and-interactions/review-block.png)

### 依存関係とソースの場所を確認する

Registry からのインストールはソースと宣言された依存関係を追加するだけで、業務への組み込みは完了しません。アセットの説明、生成されたファイル、`package.json`、ロックファイルを確認し、必要なデータ、コールバック、Provider、ロケールリソース、プラグインを特定します。

たとえば `approval-ui` は表示のブロックです。承認プラグインは不要で、承認エンジンも提供しません。この例では、フィクスチャーのレビューデータをコンポーネントに渡し、コールバックでローカルのメモを更新しています。実際の承認のプロセスには独自の業務への組み込みが必要で、ボタンを隠してもサーバーの認可の代わりにはなりません。

shadcn CLI は、新しいフロントエンドの依存関係を `dependencies` に入れることがあります。アプリの慣習に従ってください。クライアントだけで使うパッケージは `devDependencies` に、サーバーでも使うパッケージは `dependencies` に置きます。インポートのエイリアスは `package.json` の `imports` と `components.json` から来ます。同じディレクトリに対して、競合する Vite や TypeScript のエイリアスを追加しないでください。

独自のコンポーネントのソースを配布するには、[フロントエンドの拡張](../extension-development/frontend-components.md) を参照してください。一般的な配布の仕組みについては [shadcn Registry](https://ui.shadcn.com/docs/registry) を参照してください。

## アプリの操作を接続する

### ブロックをデータと操作に接続する

ブロックは入力と操作の取り決めを定義します。ページは業務データをその入力に対応付け、操作のあとに何が変わるかを決めます。`ApprovalActionBar` は、入力と検証に `form` を、操作の実行に `run` を使います。`false` を返すとフォームは開いたままになり、それ以外の成功の戻り値ではフォームが閉じます。

この例の **Add review note** の操作は、次の設定を使います。入力のレンダリングと状態の宣言については、[操作の組み込みのソース](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/review.tsx) を参照してください。

```tsx
{
  key: 'note',
  label: t('catalog.review.addNote'),
  primary: true,
  form: {
    initialValues: { note: '' },
    validate: (values) => noteText(values.note).trim() ? [] : ['note'],
    // render draws the form using the supplied values, setValues, invalid and busy.
  },
  run: async (values) => {
    setError('');
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (rejectNext) {
      setRejectNext(false);
      setError(t('catalog.review.refused'));
      return false;
    }
    setComment(noteText(values.note).trim());
  },
}
```

**Add review note** をクリックします。空のメモは送信できません。テキストを送信すると履歴に追加され、操作のフォームが閉じます。遅延は実行中の状態を観察しやすくするためのものです。実際のアプリでは、このコールバックで業務 API を呼び出し、失敗を処理すべきです。

![レビューのメモのフォームと、必須フィールドの検証](/assets/core/developing-apps/pages-and-interactions/review-note.png)

送信の前に **Refuse the next note** をクリックすると、`run` が `false` を返す場合を試せます。ページは失敗を説明し、入力を保ちます。もう一度送信すると成功します。例外はブロックに任せず、目に見えるフィードバックで処理してください。実際のリクエストと更新の動作については [データのリクエストと状態管理](data-requests-and-state.md) を参照してください。

![拒否された操作では、メモとそのフォームが開いたまま残ります](/assets/core/developing-apps/pages-and-interactions/review-refused.png)

### ルートのダイアログと、閉じるときのガードを使う

レコードのエディターや詳細のオーバーレイには、子ルートを使います。親が `<Outlet />` をレンダリングし、子のページがフォームを `RouteDialog` で包みます。開いているかどうかは URL で決まります。この例では、`catalog/edit/:productId` がカタログのページの子です。

```tsx
// The catalog route under /ui-components in client/routes.ts.
{
  name: 'uiCatalog',
  path: 'catalog',
  componentLoader: () => import('./pages/ui-components/catalog.js'),
  children: [{
    name: 'uiProductEdit',
    path: 'edit/:productId',
    componentLoader: () => import('./pages/ui-components/edit.js'),
  }],
}
```

**Arc desk lamp** をクリックするとエディターが開きます。同じ URL で直接開くこともできます。ルートの宣言とネストについては [ページ、ルート、ナビゲーション](pages-routes-and-navigation.md) を参照してください。[エディターのソースを見る](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/edit.tsx)。

![製品の子ルートで編集のダイアログが開きます](/assets/core/developing-apps/pages-and-interactions/edit-product.png)

`useRouteOverlay()` は、`footer` に渡すコンポーネントなど、`RouteDialog` の子孫で呼び出します。その `close()` は `beforeClose` を呼び出し、許可されれば親のルートに戻ります。既定ではクエリーのパラメーターを保ちます。`RouteDialog` 自体を返すページのコンポーネントで、このフックを呼び出さないでください。

```tsx
function EditorFooter({ pending, disabled }: { pending: boolean; disabled: boolean }) {
  const { t } = useTranslation();
  const { close, isClosing } = useRouteOverlay();
  return <>
    <Button variant="outline" disabled={pending || isClosing}
      onClick={() => void close()}>{t('catalog.cancel')}</Button>
    <Button type="submit" form="product-edit"
      disabled={pending || isClosing || disabled}>{t('catalog.save')}</Button>
  </>;
}
```

この例のガードは、まず送信中に離れることを防ぎます。保存していない変更がある場合は、確認を待つ Promise を返します。**Keep editing** で入力が保たれ、**Discard** で移動が許可されます。同時に複数の閉じる要求があっても保留中の Promise を共有するため、確認が複数出ることはありません。

```tsx
// Core checks in useEditorLeave; see the source for the confirmation and Promise management.
function guard() {
  if (allowedRef.current) return true;
  if (flagsRef.current.pending) return false;
  if (!flagsRef.current.dirty) return true;
  if (!requestRef.current) {
    let resolve!: (allow: boolean) => void;
    const promise = new Promise<boolean>((done) => { resolve = done; });
    requestRef.current = { promise, resolve };
    setOpen(true);
  }
  return requestRef.current.promise;
}
useNavigationGuard(guard);

// The editor passes the same check to the overlay.
<RouteDialog beforeClose={leave.guard} footer={<EditorFooter pending={pending} disabled={!product} />}>
  {/* Form and confirmation dialog */}
</RouteDialog>
```

この抜粋は組み込みのポイントを示すもので、実行できる実装は [閉じるときのガードのソース](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/use-editor-leave.tsx) にあります。送信中は、状態と ref を一緒に更新します。成功したら、閉じる前にガードを解除し、古い送信の状態が完了した保存を妨げないようにします。

![エディターの上に重なる、保存していない変更の確認](/assets/core/developing-apps/pages-and-interactions/discard-changes.png)

離れる方法は 3 つあり、それぞれ別に扱います。

| ユーザーの離れ方 | この例で使う仕組み |
| --- | --- |
| 閉じるボタン、Esc、背景、`close()` | `beforeClose` |
| ブラウザーの履歴やアプリのルートの移動 | `useNavigationGuard` |
| ブラウザーの再読み込みやタブを閉じる | `beforeunload`。ブラウザー独自の確認が表示される |

**Simulate save failure** にチェックを入れて保存すると、エディターは開いたままで入力も残ります。チェックを外して再試行します。この例での保存は、データベースではなく現在のページのセッションだけを更新します。

![保存に失敗しても、ダイアログと入力が残ります](/assets/core/developing-apps/pages-and-interactions/save-failure.png)

### ブロックにアプリのコンテキストを提供する

ブロックには、アプリ固有の名前、アバター、日付の書式が必要な場合があります。`ApprovalUiProvider` はユーザーを取得しないため、この例では人の検索と日付の書式化の関数を提供しています。`personName` がない場合、ブロックは既定で人の ID を表示します。

`CatalogApprovalProvider` の主な設定を示します。アバターの組み立てと実装の全体は [Provider のソース](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/approval-provider.tsx) を参照してください。

```tsx
<ApprovalUiProvider
  personName={(id) => people[id] ?? id}
  formatDateTime={(iso) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
    }).format(new Date(iso)) + ' UTC'
  }
>
  {children}
</ApprovalUiProvider>
```

この例ではデモの一貫性のために UTC を使っています。業務コードでは、アプリのタイムゾーンの要件を使ってください。複数のページでこのコンテキストが必要な場合は、`client/react-providers.ts` の `application` 層に Provider を登録します。

```tsx
// Add to the existing defineClientReactProviders([...]); retain other registrations.
{
  name: 'catalog-approval-ui',
  layer: 'application',
  component: CatalogApprovalProvider,
}
```

ブロックのロケールリソースも、`client/locales/en-US.ts` の `...approvalUi` のように、対応するアプリのロケールファイルにマージします。これは `client/service-provider.ts` でのサービスの登録とは異なります。React の Provider はレンダリングのコンテキストを提供し、サービスの Provider はアプリのサービスと起動を担います。[React の Provider](../framework/runtime/react-providers.md) を参照してください。

**Review block** でメモを送信したら、解決された名前、アバター、UTC の日付を確認します。[アプリでの登録を見る](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/react-providers.ts) · [ロケールリソースを見る](https://github.com/nocobase/docs-examples-v3/tree/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/locales)。

![共有のコンテキストが、進捗と更新された履歴に名前、アバター、書式化された日付を提供します](/assets/core/developing-apps/pages-and-interactions/review-updated.png)

## コンポーネントをカスタマイズして保守する

### コンポーネントのソースを整理する

ソースは再利用の範囲に応じて置きます。ページ固有のロジックをすべてグローバルなコンポーネントに置く必要はありません。

| 場所 | 製品の例での内容 |
| --- | --- |
| `client/pages/ui-components/` | ページ、ローカルなフォーム、フィクスチャーのデータ、操作のフック |
| `client/components/stock-badge.tsx` | テーブルとカードで共有する在庫のバッジ |
| `client/components/ui/` | shadcn CLI でインストールしたプリミティブ |
| `client/extensions/nocobase-approval-ui/` | Registry のブロックの全体 |
| `client/react-providers.ts` | アプリの React の Provider の登録 |
| `client/locales/` | アプリの文言とブロックのロケールリソース |

[ソースのディレクトリを見る](https://github.com/nocobase/docs-examples-v3/tree/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client)。ページのコンテナとレイアウトの慣習については [ページのレイアウト](page-layouts.md) を参照してください。

### コンポーネントを業務のニーズに合わせる

業務上の意味は、既存の props、バリアント、組み合わせで表すことを優先します。`StockBadge` は在庫のルールを担い、インストール済みの `Badge` を再利用して、テーブルとカードの一貫性を保ちます。

```tsx
export function StockBadge({ stock }: { stock: number }) {
  const { t } = useTranslation();
  const state = stock === 0 ? 'out' : stock < 5 ? 'low' : 'available';
  return (
    <Badge variant={state === 'out' ? 'outline' : state === 'low' ? 'secondary' : 'default'}>
      {t(`catalog.stock.${state}`)}
    </Badge>
  );
}
```

**Component variants** を開きます。3 枚のカードに、在庫あり、在庫少、在庫切れの製品が表示され、カタログのテーブルも同じコンポーネントを使っています。[StockBadge を見る](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/components/stock-badge.tsx) · [カードの例を見る](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/customize.tsx)。

![同じ在庫のバッジのコンポーネントで 3 つの業務上の状態を表します](/assets/core/developing-apps/pages-and-interactions/stock-variants.png)

`bg-muted` や `text-muted-foreground` などのセマンティックなトークンを使い、テーマの変更はアプリの `client/theme/` の慣習に従います。コピーしたブロックのソースを変更する場合は、業務への合わせ込みはできるだけ外側のコンポーネントに置き、更新後も残すべき変更は記録しておきます。1 つのページのニーズのために、プリミティブのボタンを書き直さないでください。

### 業務上の変更を失わずにコンポーネントを更新する

コピーしたソースは、npm のパッケージが変わっても自動では更新されません。現在のコードをコミットし、Registry の変更を確認して、必要な部分をマージします。たとえば `PageHeader` を確認します。

```bash
pnpm exec shadcn add @nocobase/page-header --diff client/components/page-header.tsx
```

差分がない場合、コマンドは `No changes.` と表示します。差分がある場合は、依存関係、インポートのパス、呼び出し側の取り決めも確認し、全体を上書きするのではなく、意図的にマージします。更新後は、業務のバリアント、コールバック、オーバーレイの閉じ方を確認し直します。

Registry の内容は変わることがあります。この記事は固定のサンプルのコミットにリンクしており、その [ソースの出所](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/docs/registry-sources.json) には、今後の比較のためにテンプレートのバージョンとブロックのアセットのチェックサムが記録されています。

## 操作を検証する

### 各使い方とその主要な状態を確認する

サンプルを起動したら、次の操作を試します。

| 入口 | 操作と期待される結果 |
| --- | --- |
| **Product catalog** | 検索で製品が絞り込まれ、一致しない検索では空の結果が表示される |
| **Edit product** | 空の名前は保存できない。成功すると一覧が更新され、再読み込みでフィクスチャーに戻る |
| エディターを閉じる | 編集後のキャンセルや戻る操作では確認が表示される。変更を残すと下書きが保たれる。直接開いたエディターからもカタログに戻れる |
| **Simulate save failure** | 送信中は閉じられない。失敗しても入力が残り、再試行できる |
| **Review block** | 空のメモは送信できない。拒否されてもフォームが残り、再試行で履歴が更新される |
| **Component variants** | どの在庫の状態にもテキストがある。ダークモードや狭いウィンドウでも、操作が読みやすく使える |

スクリーンショットは状態を示しますが、閉じる操作とナビゲーションは動作として確認する必要があります。[ブラウザーのテスト](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/tests/playwright/ui-components.test.ts) は、これらの流れ、クエリーの保持、再読み込み時の確認、モバイルでのオーバーレイの形状を網羅しています。

### テストとビルドを実行する

サンプルのアプリのディレクトリで実行します。

```bash
pnpm typecheck
pnpm exec vitest run tests/client/ui-components.test.tsx tests/client/client-routes.test.ts tests/client/page-permission-titles.test.ts tests/client/route-overlay.test.tsx tests/project/agents-md.test.ts
pnpm build
```

アプリを起動し、デプロイの接頭辞を含む実際の入口の URL をブラウザーのテストに渡します。

```bash
pnpm exec playwright install chromium
APP_URL=http://<host>:<port>/main/ pnpm exec playwright test tests/playwright/ui-components.test.ts
```

`APP_URL` を省略すると、ブラウザーのテストはスキップされます。業務データの保存、実際の承認の実行、業務ロールによる認可は、この UI の例の検証の範囲外です。

## サンプルのソースとセットアップ

### サンプルのアプリの全体

[サンプルの全体を見る](https://github.com/nocobase/docs-examples-v3/tree/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components) · [README を読む](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/README.MD)。

これはほかの章の例に依存しない単独のアプリです。README では、すべての使い方を、入口、ソースファイル、スクリーンショット、検証の方法に対応付けています。

### 環境を準備して起動する

Node.js 24 と pnpm 11 を使います。この例はテンプレート `1.0.0-beta.85` をベースにしており、ロックファイルでは `@nocobase/app-client@4.0.0-beta.5` を使っています。これらのコマンドは、テンプレートのシステムデータに SQLite を使います。UI のフィクスチャーはメモリにあり、外部のサービスは不要です。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout c8670ab1f784d76c4fef61936bdc3462fe1c1d89
cd apps/ui-components
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

起動ログに表示されたアプリの入口を開き、デプロイの接頭辞のあとに `ui-components/catalog` を付けます。入口が `/main/` で終わる場合、カタログは `/main/ui-components/catalog` にあります。これら 3 つのデモのページにはサインインは不要です。`config.yml` とローカルのデータベースはバージョン管理に入れないでください。ほかのデータベースの設定、LAN からのアクセス、スクリーンショットの生成については、サンプルの README を参照してください。
