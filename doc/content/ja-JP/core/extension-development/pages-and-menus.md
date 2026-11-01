---
title: ページ、ルート、メニュー
description: アプリにプラグインのページ、ナビゲーション、入れ子のビューを追加し、既定のルートとアクセスのルールを設定します。
---

プラグインはルートの宣言でページを提供し、その宣言がアプリのメニューにもなります。この記事では、サイドバーの項目 1 つと、Guide と FAQ の 2 つのビューを持つヘルプセンターを作ります。再読み込みやリンクの共有でも、選んだビューが保たれます。

[最初のプラグインを書く](write-your-first-plugin.md) では、1 つのページを API につなぎました。ここでは、ページとナビゲーションの整理を扱います。この例に必要なのは Client の機能だけです。

この記事ではプラグインの提供内容を扱います。`routes.ts` がページのコンポーネントを参照し、`client/plugin.ts` がルートを集約し、アプリは Client のファクトリーを登録してそれらを読み込みます。コンポーネントの実装については [コンポーネントとスタイル](frontend-components.md) を参照し、フォームと URL の状態には [アプリの UI の操作](../developing-apps/pages-and-interactions.md) と [データのリクエストと状態管理](../developing-apps/data-requests-and-state.md) を再利用してください。

## エージェントを使う場合

既存のアプリで、機能を説明します。

```text
サインイン後のメニューに Help center の項目を持つ、ヘルプセンターのプラグインを作成してください。
Guide と FAQ の子ページを追加し、Guide を既定にしてください。
ページの切り替え、再読み込み、ブラウザーの履歴の操作でも、選んだビューを保ってください。
英語と中国語に対応してください。@nocobase/create-plugin を使い、テストして、アプリに登録してください。
```

以下の手順では、手動での実装を説明します。

## 1. プラグインとページのコンポーネントを用意する

動作するアプリから始めます。**すべてのコマンドはアプリのルートで実行し、以下のファイルのパスは `packages/app-plugin-help-center/` からの相対パスです。** NocoBase のソースのチェックアウトは必要ありません。

```bash
pnpm create @nocobase/plugin@beta help-center \
  --with client.routes --with client.locales

pnpm --filter @nocobase/app-plugin-help-center exec shadcn add \
  @nocobase/page-container @nocobase/page-header
```

ジェネレーターは、プラグインをアプリの `packages/` の workspace に追加し、`workspace:*` の依存関係を宣言します。コンポーネントのインストーラーは、`PageContainer` と `PageHeader` をプラグインの `client/components/` にコピーします。プラグインがすでにある場合は、生成し直さずに編集してください。

プラグインの `package.json` で、実行時にインポートする `react` と `react-router` を、生成されたバージョンのまま `devDependencies` から `peerDependencies` に移します。コンポーネントのインストーラーが新しく追加した `cn` の依存関係も `peerDependencies` に移し、アプリのルートで `pnpm install` を実行します。

生成された `client/plugin.ts` と `client/index.ts` は保ちます。前者はすでにルートとロケールをつないでおり、後者は登録の入口を公開します。ジェネレーターのオプションについては [プラグインを作成する](create-plugin.md) を参照してください。

## 2. ページとナビゲーションを宣言する

`client/routes.ts` を置き換えます。

```ts
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const routes: readonly AppClientRouteContribution[] = [
  defineAppRoutes([
    {
      name: 'help',
      path: '/help',
      auth: 'required',
      authz: 'skip',
      navigation: { title: 'title', order: 100 },
      breadcrumb: { title: 'title' },
      componentLoader: () => import('./pages/help/index.js'),
      children: [
        {
          name: 'helpGuide',
          path: 'guide',
          componentLoader: () => import('./pages/help/guide.js'),
        },
        {
          name: 'helpFaq',
          path: 'faq',
          componentLoader: () => import('./pages/help/faq.js'),
        },
      ],
    },
  ]),
];
export default routes;
```

各フィールドの役割は次のとおりです。

| フィールド | 役割 |
| --- | --- |
| `name` | プラグインの中で安定した一意のルート名。表示のタイトルとは別 |
| `path` | ページの URL。子は `guide` のような相対パスを使う |
| `componentLoader` | 既定のエクスポートが React のコンポーネントであるモジュールを必要に応じて読み込む |
| `navigation` | サイドバーの項目を追加する。`title` はプラグインの翻訳のキーで、`order` の値が小さいほど先に表示される |
| `breadcrumb` | `navigation` とは独立して、この階層をアプリのパンくずリストに追加する |
| `children` | 親の `<Outlet />` の位置にレンダリングされる子ページ |

宣言した `/help` のパスには、アプリのデプロイの接頭辞は含まれません。既定の `/main` の接頭辞では、ブラウザーの URL は `/main/help` になります。子には `navigation` がないため、サイドバーの項目は追加されません。子はヘルプセンターの中のビューで、パンくずリストの階層も追加しません。

`auth: 'required'` はサインインを求めます。`authz: 'skip'` は、これらのヘルプのページにページの権限を別に設ける必要がないことを意味し、子はそのポリシーを引き継ぎます。業務のページでは、`authz: { resource: { type: 'page', id: 'orders' }, action: 'access' }` のようにリソースと操作を宣言し、アプリで認可を設定します。親のチェックも通る必要があり、子がそれを迂回することはできません。Client のルートのチェックは、サーバーの API の認可の代わりにはなりません。

## 3. 親ページと子ページを実装する

`client/pages/help/index.tsx` を作成します。

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import {
  matchPath,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useResolvedPath,
} from 'react-router';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';

export default function HelpPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const parentPath = useResolvedPath('.');
  const isParentEntry = matchPath(
    { path: parentPath.pathname, end: true },
    location.pathname,
  );

  if (isParentEntry) {
    return (
      <Navigate to={{ pathname: 'guide', search: location.search }} replace />
    );
  }

  return (
    <PageContainer>
      <PageHeader title={t('title')} />
      <nav aria-label={t('sections')} className='flex gap-4 border-b pb-3'>
        <NavLink
          to={{ pathname: 'guide', search: location.search }}
          className='text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground'
        >
          {t('guide.title')}
        </NavLink>
        <NavLink
          to={{ pathname: 'faq', search: location.search }}
          className='text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground'
        >
          {t('faq.title')}
        </NavLink>
      </nav>
      <Outlet />
    </PageContainer>
  );
}
```

親は、共有のコンテナ、見出し、ナビゲーションを提供します。`Outlet` は子の内容が表示される位置を決めます。`NavLink` は URL からアクティブな状態を導くため、別の `activeTab` の状態はありません。これらはキーボードで通常どおり操作できる、普通のナビゲーションのリンクです。

`guide` にリダイレクトするのは、親の URL がちょうど `/help` のときだけです。`replace` により「戻る」で既定の入口に戻らないようにし、`search` でクエリーのパラメーターを保ちます。`/help/faq` に直接移動した場合はリダイレクトしません。ルートの宣言の API には `index` フィールドはありません。既定の入口のために子のルートを作らないでください。

この例では、2 つの子のアクセスのポリシーは同じです。子ごとに必要な権限が異なる場合は、権限の読み込みを待ってから、最初にアクセスできるものを既定として選びます。どれにもアクセスできない場合は、リダイレクトを繰り返すのではなく、メッセージを表示します。

`client/pages/help/guide.tsx` を作成します。

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

export default function GuidePage(): ReactElement {
  const { t } = useTranslation();
  return (
    <section className='space-y-2'>
      <h2 className='text-lg font-semibold'>{t('guide.title')}</h2>
      <p className='text-sm text-muted-foreground'>{t('guide.content')}</p>
    </section>
  );
}
```

`client/pages/help/faq.tsx` を作成します。

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

export default function FaqPage(): ReactElement {
  const { t } = useTranslation();
  return (
    <section className='space-y-2'>
      <h2 className='text-lg font-semibold'>{t('faq.title')}</h2>
      <p className='text-sm text-muted-foreground'>{t('faq.content')}</p>
    </section>
  );
}
```

子の内容はすでに親のコンテナの中にあるため、別の `PageContainer` も、2 つ目のページの見出しも追加しません。ディレクトリはルートの階層に合わせています。

## 4. 英語と中国語の文言を追加する

`client/locales/en-US.ts` を置き換えます。

```ts
import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  title: 'Help center',
  sections: 'Help topics',
  guide: {
    title: 'Guide',
    content: 'Choose a menu item to start using the application.',
  },
  faq: {
    title: 'FAQ',
    content: 'Contact your administrator if you need help with access.',
  },
};
export type HelpCenterResource = LocaleResource<typeof enUS>;
export default enUS;
```

`client/locales/zh-CN.ts` を置き換えます。

```ts
import type { HelpCenterResource } from './en-US.js';

const zhCN: HelpCenterResource = {
  title: '帮助中心',
  sections: '帮助主题',
  guide: { title: '使用指南', content: '从菜单中选择功能，开始使用应用。' },
  faq: { title: '常见问题', content: '如果遇到权限问题，请联系管理员。' },
};
export default zhCN;
```

この例は英語と中国語だけに対応します。`client/locales/index.ts` を置き換えます。

```ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};
export default locales;
```

このディレクトリにある、翻訳していないほかの言語のファイルを削除します。それらの言語に対応するときに、翻訳とローダーを追加してください。リソースの型を共有しているため、空のオブジェクトを残すと型エラーになります。

プラグインのルートで読み込まれたページは、`useTranslation()` でプラグインの名前空間を引き継ぎます。メニューとパンくずリストのタイトルも同じリソースを使い、アプリのロケールのファイルを変更する必要はありません。

## 5. ナビゲーションをテストする

生成された `tests/client/routes.test.ts` は、ルートが空であることをアサートしています。これを削除し、`tests/client/routes.test.tsx` を作成します。

```tsx
import { renderWithApp } from '@nocobase/app-testing/client';
import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';

import helpCenter from '../../client/index.js';
import routes from '../../client/routes.js';

async function renderRoute(
  definition: AppClientRouteDefinition,
): Promise<ReactElement> {
  const Component = definition.componentLoader
    ? (await definition.componentLoader()).default
    : undefined;
  const children = await Promise.all(
    (definition.children ?? []).map(renderRoute),
  );
  return (
    <Route
      key={definition.name}
      path={definition.path}
      element={Component ? <Component /> : undefined}
    >
      {children}
    </Route>
  );
}

function LocationProbe(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid='location'>
        {location.pathname}
        {location.search}
      </output>
      <button onClick={() => void navigate(-1)}>Back</button>
    </>
  );
}

async function openPage(route: string, locale = 'zh-CN'): Promise<void> {
  const children = await Promise.all(
    routes.flatMap((contribution) => contribution.routes).map(renderRoute),
  );
  await renderWithApp(
    <>
      <Routes>{children}</Routes>
      <LocationProbe />
    </>,
    {
      plugins: [helpCenter()],
      namespace: '@nocobase/app-plugin-help-center',
      locale,
      route,
    },
  );
}

describe('help center navigation', () => {
  it.each(['/help', '/help/'])(
    'redirects only the parent %s and preserves query and history',
    async (parent) => {
      await openPage(`${parent}?from=menu`);
      expect(
        await screen.findByRole('heading', { name: '使用指南' }),
      ).toBeInTheDocument();
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/help/guide?from=menu',
      );
      fireEvent.click(screen.getByRole('link', { name: '常见问题' }));
      expect(
        await screen.findByRole('heading', { name: '常见问题' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '常见问题' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/help/faq?from=menu',
      );
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      await waitFor(() =>
        expect(screen.getByTestId('location')).toHaveTextContent(
          '/help/guide?from=menu',
        ),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/help/guide?from=menu',
      );
    },
  );

  it('keeps a direct child URL and renders English', async () => {
    await openPage('/help/faq?from=link', 'en-US');
    expect(
      await screen.findByRole('heading', { name: 'FAQ' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Help center' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/help/faq?from=link',
    );
    expect(
      screen.queryByRole('heading', { name: 'Guide' }),
    ).not.toBeInTheDocument();
  });
});
```

これらのテストは、実際のルートの宣言からコンポーネントを読み込み、既定のナビゲーション、クエリーのパラメーター、子の選択、履歴、英語の文言を確認します。`renderWithApp` はすでにルーティングと多言語化を提供しているため、別の `MemoryRouter` で囲まないでください。これらのテストはページのナビゲーションを動かすものです。登録後に、アプリのメニューの生成と認証のガードも確認してください。

```bash
pnpm --filter @nocobase/app-plugin-help-center format
pnpm --filter @nocobase/app-plugin-help-center check
```

## 6. アプリに登録する

アプリのルートで登録をプレビューして適用し、開発サーバーを起動するか再起動します。

```bash
pnpm nocobase plugin register @nocobase/app-plugin-help-center --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-help-center --no-install
pnpm dev
```

プラグインはすでにローカルの workspace の依存関係なので、`--no-install` でインストールを省きます。この例には Client の入口しかないため、登録で更新されるのはアプリの `client/plugins.ts` です。

サインインしたあと、次を確認します。パスは既定の `/main` のデプロイの接頭辞を使っています。デプロイに合わせて調整してください。

| 操作 | 期待される結果 |
| --- | --- |
| サイドバーの **Help center** をクリックする | `/main/help/guide` が開き、Guide が表示される |
| `/main/help?from=menu` を開く | `/main/help/guide?from=menu` にリダイレクトされる |
| **FAQ** をクリックする | `/main/help/faq` が開き、現在のリンクが強調表示される |
| `/main/help/faq` を直接開く、または再読み込みする | Guide に戻らず FAQ のまま |
| ブラウザーの「戻る」と「進む」を使う | 内容が現在の URL と一致する |
| 英語と中国語を切り替える | メニュー、パンくずリスト、見出し、本文の文言が一緒に変わる |
| サインアウトした状態でヘルプのページにアクセスする | アプリのサインインの流れが始まる |

最後に、アプリのルートで `pnpm build` を実行し、プラグインがアプリと一緒にビルドできることを確認します。

## さらにページを整理する

**詳細のビューや内部の子ビューなど、ほかのページからたどり着く内容**では、`navigation` を省けます。URL があってもメニューの項目が必要なわけではありません。パラメーター付きの詳細のパスには `:id` を使えますが、固定のメニューの移動先にはできません。

**独自の内容を持つ親ページ**では、`componentLoader`、`navigation`、`children` をまとめて宣言できます。そのコンポーネントは `Outlet` をレンダリングする必要があります。子もサイドバーに表示したい場合は、子に `navigation` を追加します。

**メニューのグループ**では、`componentLoader` なしで `navigation` と `children` を宣言します。たとえば、`help` のルート全体をこのグループの `children` に移します。

```ts
{
  name: 'support',
  navigation: { title: 'support' },
  children: [
    // Move the complete help route here, including its children.
  ],
}
```

両方の言語のリソースに `support` を追加し、それぞれ `Support` と「支持」にします。`path` がなければ、グループは `/help` を変えません。グループに `path` がある場合は、それが子のルートの接頭辞になります。

メニューはルートの宣言で追加します。アプリのサイドバーの編集や ServiceProvider は必要ありません。
