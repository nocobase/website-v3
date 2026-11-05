---
title: ページのレイアウト
description: 製品カタログの例を使い、ページのコンテナ、レスポンシブな列、アプリのシェル、子ビューを組み合わせ、スクロールとナビゲーションを予測どおりに動作させます。
---

業務のページは、既存のコンテナ、見出し、コンテンツ領域を組み合わせて作ります。アプリのシェルは、ブランド、ナビゲーション、グローバルな操作を担います。これらのコンポーネントはアプリが所有するソースで、操作できるコンポーネントには shadcn の慣習を使います。コンポーネントの追加については [UI コンポーネントと操作](pages-and-interactions.md) を参照してください。

製品カタログの例は、既定のテンプレート `1.0.0-beta.85`、英語の画面、固定の製品のフィクスチャーを使います。製品の API の呼び出しや書き込みは行いません。検索と長い見出しの切り替えは親ページのメモリにあり、カタログから離れたり再読み込みしたりするとリセットされます。実行するには [サンプルのソースとセットアップ](#サンプルのソースとセットアップ) を参照してください。

## レイアウトを変える場所を選ぶ

| 変更内容 | 場所 |
| --- | --- |
| 業務のページのフィルター、テーブル、フォーム | `client/pages/` 以下のページとそのローカルなコンポーネント |
| ページの余白、セクションの間隔、見出し、操作 | `client/components/page-container.tsx` と `page-header.tsx` |
| ブランド、サイドバーのフッター、ヘッダーのグローバルな操作 | `client/layouts/components/` |
| サイドバー、ヘッダー、コンテンツの関係 | `client/layouts/app-layout.tsx` |
| インライン、ダイアログ、ドロワー、覆う形の子ビュー | 親の `Outlet` と子のレイアウトコンポーネント |
| サインインと単独のページで共有するシェル | `client/routing/standalone-page-layout.tsx` |

メニューの項目は、既存の選択と権限による絞り込みを保ったまま、ルートの `navigation` の宣言で追加します。[ページ、ルート、ナビゲーション](pages-routes-and-navigation.md) を参照してください。

## 業務のページを組み立てる

### ページのコンテナ、見出し、操作

通常のページは 1 つの `PageContainer` を使い、見出し、説明、ページ全体の操作には `PageHeader` を使います。カタログはこの組み合わせを `ProductPageFrame` に切り出し、ページはフィルターとテーブルの内容を担います。

```tsx
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';

// Outer structure of ProductPageFrame; the next section adds its columns.
<PageContainer>
  <PageHeader title={title} description={description} actions={actions} />
  {children}
</PageContainer>
```

`PageContainer` は `w-full space-y-6 p-6 md:p-8` を提供し、通常の `section` の属性を受け付けます。`PageHeader` は `title`、`description`、`actions` に React のノードを受け取り、タイトルを `h1` としてレンダリングします。`ProductPageFrame` を使うページに、追加のページのコンテナは必要ありません。

サインインし、サイドバーから **Product catalog** を開きます。**Long heading** をクリックすると、操作の領域と並んだ見出しの折り返しを確認できます。狭い画面では、操作が見出しの下に移ります。

![カタログの見出し、操作の領域、2 列のコンテンツ](/assets/core/developing-apps/page-layouts/catalog.png)

[ページの組み立てを見る][catalog] · [レイアウトコンポーネントを見る][frame]

### レスポンシブなフィルターと一覧

データとイベントの処理はページに残したまま、フィルターと一覧をレイアウトのスロットに渡します。

```tsx
// Inside ProductPageFrame, after PageHeader.
<div className="grid min-w-0 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
  <aside aria-label={filterLabel} className="flex min-w-0 flex-col gap-4">
    {filters}
  </aside>
  <div className="min-w-0">{children}</div>
</div>
```

`lg` のブレークポイント以上では、フィルターの列の幅は `14rem` で、一覧が残りの幅を使います。それより狭い場合は、フィルターが一覧の上に縦に並びます。`minmax(0,1fr)` と `min-w-0` によって、幅の広いテーブルがアプリを押し広げることなく、コンテンツの列が縮められます。支援技術がフィルターの領域を識別できるよう、`filterLabel` は翻訳してください。

**Search products** に `lamp` と入力すると照明の製品が、存在しない名前を入力すると一致なしの状態が表示されます。ウィンドウを狭めると、フィルターがテーブルの上に来るはずです。

![狭い画面では一覧の上にフィルターがあり、テーブルの中で横スクロールします](/assets/core/developing-apps/page-layouts/mobile.png)

[レイアウトコンポーネントを見る][frame]。ページ固有のフレームはそのページのディレクトリに置き、複数のページで実際に共有するようになったら `client/components/` に移します。

### 長いコンテンツとスクロール

ページの縦スクロールはアプリのシェルが、横スクロールはテーブルが担います。この例では `DataTable` を再利用しており、その内部のテーブルのコンテナにはすでに `overflow-x-auto` があります。

```tsx
import { DataTable } from '#components/data-table';

// The catalog page defines columns and the filter state.
<DataTable
  columns={columns}
  data={products.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase()),
  )}
  pagination={false}
  emptyMessage={t('layouts.empty')}
/>
```

この例では、スクロールを観察しやすいよう 48 件のレコードをまとめて表示しています。狭い画面ではテーブルの中で横にスクロールし、アプリ自体に横スクロールバーが出てはいけません。一覧を下にスクロールしても、アプリのヘッダーはその場に残ります。フィルターと一覧に、追加の高さ固定の縦スクロール領域は必要ありません。

[一覧のソースを見る][catalog]。色と間隔の慣習については [テーマとスタイル](themes-and-styles.md) を参照してください。

## アプリのシェルをカスタマイズする

### ブランド、サイドバー、ヘッダーの操作

`AppLayout` はサイドバー、ヘッダー、コンテンツの領域を組み合わせます。局所的な変更には、対応するコンポーネントを編集します。この例の `AppBrand` は、展開時に **Northstar Supply** を表示し、折りたたみ時はアイコンを残します。`HeaderActions` は、既存のテーマとアカウントの操作と並べて **Catalog guide** を追加します。

```tsx
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '#components/ui/button';

// Inside HeaderActions, before the existing ThemeSettings and UserMenu.
<Button
  variant="ghost"
  size="icon"
  aria-label={t('layouts.guide')}
  title={t('layouts.guide')}
  render={<Link to="/catalog-guide" />}
>
  <BookOpen />
</Button>
```

このテンプレートの Base UI のコンポーネントは `render` で組み合わせます。本のアイコンをクリックするとガイドが開きます。ブランドとヘッダーの項目は、[カタログのスクリーンショット](#ページのコンテナ見出し操作) で確認できます。

[ブランドを見る][brand] · [ヘッダーの操作を見る][header]

全体の領域を並べ替えるときは `app-layout.tsx` を変更します。`RouteTreeProvider`、`PageBreadcrumbProvider`、権限による絞り込み、`useSyncServerLocale()`、アカウントメニューのセッションの処理は残してください。これらは戻る操作、パンくずリスト、メニューの表示、ロケールの同期、サインアウトを支えています。

### サイドバーの折りたたみとモバイルのナビゲーション

テンプレートのデスクトップとモバイルの動作には、`AppSidebarProvider`、`AppSidebar`、`AppSidebarToggle` を再利用します。

```tsx
// AppLayout excerpt; the full source also provides route context and the header.
<AppSidebarProvider>
  <AppSidebar label={navigationLabel} footer={<AppSidebarFooter />}>
    <NavigationMenu
      items={menuItems}
      label={navigationLabel}
      selectedKey={selectedKey}
    />
  </AppSidebar>
  {/* Header and main content column */}
</AppSidebarProvider>
```

デスクトップでは、ヘッダーの切り替えでナビゲーションがアイコンだけに折りたたまれ、再読み込みしてもその設定が保たれます。モバイルでは、同じ入口でナビゲーションのパネルが開き、その開閉状態はデスクトップの折りたたみとは独立しています。ページで 2 つ目のサイドバーの状態を持たないでください。

![モバイルでは、ヘッダーのボタンでアプリのナビゲーションが開きます](/assets/core/developing-apps/page-layouts/mobile-navigation.png)

[アプリのシェルを見る][shell] · [サイドバーのコンポーネントを見る][sidebar]

## 子ページを整理する

### タブとインラインの子ルート

インラインの子は、親が選んだ位置にレンダリングされます。製品の詳細の **Overview** と **Handling notes** は、見出し、戻るリンク、ページのコンテナを共有します。親はタブのナビゲーションのあとに `Outlet` をレンダリングします。

```tsx
import { Outlet } from 'react-router';

// Inside the detail PageContainer, after PageHeader and tab navigation.
<Outlet />
```

`overview.tsx` は製品の情報を、`handling.tsx` は取り扱いの注意事項をレンダリングします。どちらも別の `PageContainer` や主見出しは作りません。一覧から **Details** を開くと **Overview** に入り、続いて **Handling notes** を選びます。URL と内容の両方が変わります。直接のリンクや再読み込みでも、そのセクションにとどまります。

![インラインの内容は、詳細ページの見出し、タブ、コンテナを共有します](/assets/core/developing-apps/page-layouts/inline-tabs.png)

[親の詳細ページを見る][detail] · [インラインのセクションを見る][handling]。既定のセクションへのリダイレクトと子ルートの登録については [ページ、ルート、ナビゲーション](pages-routes-and-navigation.md) で扱います。

### ダイアログ、ドロワー、覆う形の子ページ

これらのコンポーネントが、子ページの表示の仕方を決めます。子は `routes.ts` で宣言し、親の `Outlet` はページのコンテナのあとに兄弟として置きます。

```tsx
<>
  <ProductPageFrame {...frameProps}>{/* Product list */}</ProductPageFrame>
  <Outlet />
</>
```

これにより、`RouteChildPage` は一覧の DOM を残したまま親を覆い、その操作を無効にできます。子の中で別の `AppLayout` や `BrowserRouter` をレンダリングしないでください。

**Summary** は、ダイアログに製品の簡潔な情報を表示します。

```tsx
import { RouteDialog } from '#components/route-dialog';

<RouteDialog
  title={t('layouts.summaryTitle')}
  description={t('layouts.readOnly')}
  className="sm:max-w-md"
  footer={<CloseProduct />}
>
  <ProductInfo />
</RouteDialog>
```

![ルートのダイアログに表示される製品の簡潔な情報](/assets/core/developing-apps/page-layouts/dialog.png)

製品名をクリックすると、長い内容のドロワーが開きます。

```tsx
import { RouteDrawer } from '#components/route-drawer';

<RouteDrawer
  title={t('layouts.drawerTitle')}
  description={t('layouts.readOnly')}
  footer={<CloseProduct />}
>
  <ProductInfo extended />
</RouteDrawer>
```

![ドロワーの内容は、固定の見出しとフッターの間でスクロールします](/assets/core/developing-apps/page-layouts/drawer.png)

ダイアログとドロワーは、独自の余白、スクロールする本体、固定のフッターを提供します。その中に `PageContainer` をネストしないでください。ボタンは直接 `footer` に渡します。閉じるコンポーネントは、オーバーレイの中から `useRouteOverlay()` を呼び出します。

```tsx
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { useTranslation } from '@nocobase/i18n/client';

function CloseProduct() {
  const { close } = useRouteOverlay();
  const { t } = useTranslation();
  return <Button onClick={() => void close()}>{t('layouts.done')}</Button>;
}
```

**Details** は `RouteChildPage` を使ってアプリのコンテンツ領域を覆い、サイドバーとヘッダーは使えるままにします。こちらはページのコンテナを持ちます。

```tsx
import { RouteChildPage } from '#components/route-child-page';

<RouteChildPage>
  <PageContainer>
    <BackButton>{t('layouts.back')}</BackButton>
    <PageHeader title={product?.name ?? t('layouts.missing')} />
    {/* Tab navigation and inline Outlet */}
  </PageContainer>
</RouteChildPage>
```

![覆う形の子ページはコンテンツ領域を占め、ナビゲーションは使えるままです](/assets/core/developing-apps/page-layouts/child-page.png)

覆う形のページはモーダルではなく、Esc では閉じません。この例では **Back to catalog** を使います。十分なパンくずリストの戻り先があるページでは、重複した戻るリンクを追加せず、それを使ってもかまいません。

[ダイアログを見る][dialog] · [ドロワーを見る][drawer] · [覆う形のページを見る][detail] · [ルートの宣言を見る][routes]

### 親の状態とスクロール位置を保つ

既定のシェルは、配置とスクロールを分けています。

```tsx
// Main content structure from AppLayout.
<main className="app-brand-surface relative isolate min-w-0 flex-1 overflow-hidden">
  {/* Brand watermark */}
  <div className="h-full overflow-y-auto">
    <Outlet />
  </div>
</main>
```

`main` は覆う形のページの配置の境界で、内側の `div` がページを縦にスクロールします。`RouteChildPage` も同様に外側の要素を配置し、内側でスクロールするため、その面が親の一覧と一緒に動いたり、一覧の高さまで伸びたりすることはありません。

`lamp` を検索し、下にスクロールして **Summary** または **Details** を開き、閉じるか戻ります。親はマウントされたままで、フィルターとスクロール位置が保たれます。ダイアログとドロワーは、フォーカスもそのトリガーに戻します。完全な再読み込みでは、メモリ上の状態は作り直されます。URL に基づくフィルターと編集については、[ページ、ルート、ナビゲーション](pages-routes-and-navigation.md) と [データのリクエストと状態管理](data-requests-and-state.md) を参照してください。

[シェルを見る][shell] · [親と子の組み立てを見る][catalog]

## サインインと単独のページのレイアウト

テンプレートの `AppRouter` は、`auth` でレイアウトを選びます。`required` のページは、認証とセッションの準備のあとに `AppLayout` を使います。`guest` と `optional` のページは、それぞれの認証ルールで `StandalonePageLayout` を使います。

**Catalog guide** は公開の静的な説明で、任意の認証で宣言します。

```tsx
{
  name: 'catalogGuide',
  path: '/catalog-guide',
  auth: 'optional',
  authz: 'skip',
  componentLoader: () => import('./guide.js'),
}
```

その `PageContainer` は `className="mx-auto max-w-3xl pt-24"` を使い、コンテンツの幅を制限して上部の操作のための余白を確保します。サインインしたユーザーもゲストもガイドを開けます。**Open product catalog** は、未認証の訪問者をサインインに送ります。

![単独のガイドは、アプリのサイドバーなしでページのコンテナを再利用します](/assets/core/developing-apps/page-layouts/standalone.png)

`auth` はアクセスの条件を記述するものです。サイドバーを消すために保護されたページを公開にすると、だれが入れるかが変わってしまいます。別の認証済みのシェルが必要な場合は、認証、セッションの準備、認可を保ったまま、アプリのルートの組み立てをカスタマイズします。任意の `layout` フィールドで、その組み込みが成り立つわけではありません。

[ガイドを見る][guide] · [レイアウトの選択を見る][router] · [単独のシェルを見る][standalone]

## レイアウトを確認する

動作中のサンプルで、次の操作を試します。

- デスクトップの幅と 375px で長い見出しを切り替えます。見出し、操作、フィルター、テーブルを確認し、横スクロールがテーブルの中にとどまることを確かめます。
- ナビゲーションを折りたたんで再読み込みします。モバイルのナビゲーションを開き、その項目が使えることを確かめます。
- 絞り込んでスクロールした一覧から、それぞれの子の表示方法を開きます。戻って、状態とキーボードのフォーカスが保たれていることを確かめます。
- 見出しと **Done** に手が届くまま、ドロワーの長い内容をスクロールします。アプリのナビゲーションが使えるまま、覆う形のページをスクロールします。
- 子の URL を直接開き、再読み込みし、ブラウザーの戻る・進むを使います。表示方法と戻り先を確認します。
- 存在しない名前を検索するか、詳細の URL の製品 ID を `missing` に置き換え、状態のメッセージを確認します。
- 英語と中国語、ライトモードとダークモードを切り替えます。折り返し、枠線、操作を確認します。サインアウト後にカタログにアクセスすると、サインインに移るはずです。

## サンプルのソースとセットアップ

[サンプルのアプリの全体][app] は Node.js 24 と pnpm 11 を使います。製品はフィクスチャーですが、テンプレートのアカウント、セッション、設定にはデータベースが必要です。次の SQLite の設定で検証しています。ほかのデータベースでは、[アプリを作成する](../../getting-started/develop-your-first-app.md#アプリを作成して起動する) の説明に従ってドライバーをインストールし、接続を設定します。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 929240c07561b2fa02afbe82a3a104a6f0a908b0
cd apps/page-layouts
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

起動時に表示される、ベースパスを含むアプリのアドレスを開きます。サインインページからデモ用のアカウントを登録してサインインし、**Product catalog** を選びます。既定の `/main/` の接頭辞では、カタログは `/main/layouts`、公開のガイドは `/main/catalog-guide` です。フィクスチャーのカタログはサインインしたすべてのユーザーが使え、管理機能ではテンプレートの実際の権限チェックが残っています。

[README][readme] には、使い方とコードやスクリーンショットの対応と、コンポーネントとブラウザーのテストのコマンドが記載されています。ブラウザーのテストは、ローカルのサンプルのデータベースに独立したアカウントを作成します。製品の保存、在庫の操作、業務ロールによる認可は、この例の範囲外です。

[app]: https://github.com/nocobase/docs-examples-v3/tree/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts
[readme]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/README.MD
[catalog]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/index.tsx
[frame]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/product-page-frame.tsx
[brand]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/layouts/components/app-brand.tsx
[header]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/layouts/components/header-actions.tsx
[shell]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/layouts/app-layout.tsx
[sidebar]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/layouts/components/app-sidebar.tsx
[detail]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/detail.tsx
[handling]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/handling.tsx
[dialog]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/summary.tsx
[drawer]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/drawer.tsx
[routes]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/routes.ts
[guide]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/pages/layouts/guide.tsx
[router]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/routing/app-router.tsx
[standalone]: https://github.com/nocobase/docs-examples-v3/blob/929240c07561b2fa02afbe82a3a104a6f0a908b0/apps/page-layouts/client/routing/standalone-page-layout.tsx
