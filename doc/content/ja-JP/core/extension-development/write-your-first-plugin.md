---
title: 最初のプラグインを書く
description: アプリの中にお知らせのプラグインを作り、API、ページ、ナビゲーション、テスト、登録までを扱います。
---

お知らせのプラグインを作ります。アプリのメニューから Announcements を開き、プラグインの API をリクエストして結果を表示します。この例では Client と Server の両方を使い、プラグインがアプリに機能を追加する方法を示します。

データベースのテーブルや編集の機能は使わず、固定のお知らせ 1 件から始めます。流れが動いたら、必要に応じて保存や管理のページで拡張します。

## エージェントを使う場合

既存のアプリのプロジェクトをエージェントで開き、機能を説明します。

```text
@nocobase/create-plugin を使って、このアプリにお知らせのプラグインを作成してください。
公開のお知らせの API と、サインイン後のナビゲーションにページを追加してください。
まずは固定のお知らせ 1 件から始め、英語と中国語の UI に対応し、テストしてアプリに登録してください。
```

以下の手順では、手動での実装を説明します。エージェントの作業を確認するときにも役立ちます。

## 1. ひな形を用意する

create-app で作成し、依存関係をインストール済みで、開発サーバーが動くアプリから始めます。ジェネレーターのオプションについては [プラグインを作成する](create-plugin.md) を、ファイルの役割については [プラグインの構成](plugin-structure.md) を参照してください。**すべてのコマンドはアプリのルートで実行し、ファイルのパスはそのルートからの相対パスです。**

ページのルート、Client の翻訳、Server のルートを選びます。

```bash
pnpm create @nocobase/plugin@beta announcements \
  --with client.routes --with client.locales --with server.routes
```

プラグインがすでにある場合は、作り直さずに編集を続けます。プラグインは `packages/app-plugin-announcements/` にあり、アプリから `workspace:*` で参照されます。ひな形は、ルートと翻訳をすでにプラグインの定義につないでいます。その `client/plugin.ts`、`server/plugin.ts`、2 つの `index.ts` は保ってください。

NocoBase UI Library のページのコンテナとヘッダーをプラグインにインストールします。そのソースはプラグインが所有します。

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add \
  @nocobase/page-container @nocobase/page-header
```

プラグインの `package.json` を確認します。ページは実行時に `react` を使うため、生成されたバージョンのまま `devDependencies` から `peerDependencies` に移します。コンポーネントのインストーラーが追加した Client の依存関係（この例では `cn`）も `peerDependencies` に移します。Server の `hono` は `dependencies` に残し、`pnpm install` を実行して依存関係とロックファイルを同期します。

## 2. お知らせの API を用意する

ページと API で共有する型として、`packages/app-plugin-announcements/shared/announcement.ts` を追加します。

```ts
export interface Announcement {
  readonly id: string;
  readonly title: string;
  readonly content: string;
}
```

API のドキュメントでお知らせを記述するため、`packages/app-plugin-announcements/server/routes/schemas.ts` を追加します。

```ts
import type { ApiSchema } from '@nocobase/app-server/router';

export const announcementSchema: ApiSchema = {
  type: 'object',
  required: ['id', 'title', 'content'],
  properties: {
    id: { type: 'string', description: 'Announcement ID.' },
    title: { type: 'string', description: 'Announcement title.' },
    content: { type: 'string', description: 'Announcement body.' },
  },
};
```

`packages/app-plugin-announcements/server/routes/index.ts` の空のルートを置き換えます。

```ts
import {
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import type { Announcement } from '../../shared/announcement.js';
import { announcementSchema } from './schemas.js';

const announcements: Announcement[] = [
  { id: 'welcome', title: 'Welcome', content: 'Your first plugin is ready.' },
];

export const apiRoutes: AppApiRouteContribution<unknown> = defineApiRoutes(
  () => {
    const router = new Hono();
    router.get(
      '/announcements',
      describeRoute({
        operationId: 'announcementsList',
        summary: 'List public announcements',
        tags: ['Announcements'],
        security: [],
        responses: { 200: listResponse(announcementSchema) },
      }),
      (context) =>
        context.json({
          data: announcements,
          meta: { total: announcements.length },
        }),
    );
    return router;
  },
);

const routes: readonly AppApiRouteContribution<unknown>[] = [apiRoutes];
export default routes;
```

`defineApiRoutes()` はアプリの API にルートを提供します。書くのは `/announcements` だけで、API の接頭辞はアプリが付けます。`describeRoute()` はエンドポイントのドキュメントを宣言し、`listResponse()` はその `{ data, meta }` のレスポンスを記述します。

このエンドポイントは、誰でも読み取れる固定のサンプルのお知らせを意図的に返し、`security: []` を宣言しています。認証情報は必要ありません。あとで内部向けのお知らせを返す場合は、Server の認証と認可を追加してください。ページでサインインが必要でも、その API は保護されません。お知らせの内容はページに組み込まれているのではなく、Server から返されます。

## 3. ページを作る

`packages/app-plugin-announcements/client/pages/announcements.tsx` を追加します。

```tsx
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useState, type ReactElement } from 'react';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import type { Announcement } from '../../shared/announcement.js';

export default function AnnouncementsPage(): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation();
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void api.request<{ data: Announcement[] }>({ path: 'announcements' }).then(
      ({ data }) => {
        if (active) setItems(data);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [api]);

  return (
    <PageContainer>
      <PageHeader title={t('title')} />
      {failed ? (
        <p role='alert'>{t('error')}</p>
      ) : items === null ? (
        <p role='status'>{t('loading')}</p>
      ) : items.length === 0 ? (
        <p>{t('empty')}</p>
      ) : (
        <ul className='space-y-4'>
          {items.map((item) => (
            <li key={item.id} className='rounded-lg border p-4'>
              <h2 className='font-semibold'>{item.title}</h2>
              <p className='mt-2 text-sm text-muted-foreground'>
                {item.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
```

`useApiClient()` は現在のアプリの API の設定を使います。その `path` は API のルートからの相対パスです。サーバーのアドレスや `/main/api` を直接書かないでください。ページは、読み込み中、失敗、空の結果、データのあるリストを扱い、アンマウント後に返ってきた保留中のリクエストの結果は無視します。

`PageContainer` と `PageHeader` は、プラグインにインストールしたコンポーネントです。`#components/*` はプラグイン自身の `package.json` で解決され、これらのインポートがアプリの非公開のファイルに及ぶことはありません。

## 4. ナビゲーションと翻訳を追加する

`packages/app-plugin-announcements/client/routes.ts` を置き換えます。

```ts
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const routes: readonly AppClientRouteContribution[] = [
  defineAppRoutes([
    {
      name: 'announcements',
      path: '/announcements',
      auth: 'required',
      authz: 'skip',
      navigation: { title: 'title' },
      componentLoader: () => import('./pages/announcements.js'),
    },
  ]),
];
export default routes;
```

`navigation` はメニューの項目を追加し、`componentLoader` はページを遅延読み込みします。ルートにはデプロイの接頭辞を含めません。既定の `/main` のベースパスでは、ブラウザーの URL は `/main/announcements` になります。

`auth: 'required'` はページにサインインを求め、`authz: 'skip'` はこの例でページの権限を別に設ける必要がないことを意味します。お知らせの API を公開するかどうかは、上の Server の実装で決まります。

メニューとページのテキストは、プラグインの翻訳から来ます。`packages/app-plugin-announcements/client/locales/en-US.ts` を更新します。

```ts
import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  title: 'Announcements',
  loading: 'Loading announcements…',
  empty: 'No announcements yet.',
  error: 'Could not load announcements. Please refresh to try again.',
};
export type AnnouncementsResource = LocaleResource<typeof enUS>;
export default enUS;
```

`packages/app-plugin-announcements/client/locales/zh-CN.ts` を更新します。

```ts
import type { AnnouncementsResource } from './en-US.js';

const zhCN: AnnouncementsResource = {
  title: '公告栏',
  loading: '正在加载公告…',
  empty: '暂无公告。',
  error: '公告加载失败，请刷新页面重试。',
};
export default zhCN;
```

この例は英語と中国語に対応します。`packages/app-plugin-announcements/client/locales/index.ts` を下のように置き換え、そのディレクトリにある、翻訳していないほかのロケールのファイルを削除します。ほかの言語に対応するときは、完全な翻訳とそのローダーを追加します。

```ts
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};
export default locales;
```

## 5. API とページをテストする

生成されたルートのテストは、ルートがないことを前提にしています。その初期のアサーションを、実装した動作のテストに置き換えます。

`packages/app-plugin-announcements/tests/server/routes.test.ts` を置き換え、公開での読み取り、レスポンスの内容、API のドキュメント、書き込みのエンドポイントがないことを確認します。

```ts
import {
  findUndeclaredApiRoutes,
  findApiDocumentSchemaProblems,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { describe, expect, it } from 'vitest';

import { apiRoutes } from '../../server/routes/index.js';

describe('announcements API', () => {
  it('returns public announcements without credentials', async () => {
    const router = await apiRoutes.createRouter(undefined);
    const response = await router.request('/announcements');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [
        {
          id: 'welcome',
          title: 'Welcome',
          content: 'Your first plugin is ready.',
        },
      ],
      meta: { total: 1 },
    });
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Announcements', version: '1' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    expect(
      (await router.request('/announcements', { method: 'POST' })).status,
    ).toBe(404);
  });
});
```

`packages/app-plugin-announcements/tests/client/routes.test.ts` を置き換え、ページとナビゲーションの宣言を確認します。

```ts
import { describe, expect, it } from 'vitest';

import routes from '../../client/routes.js';

describe('announcements navigation', () => {
  it('declares the page and menu', () => {
    expect(routes).toMatchObject([
      {
        parent: 'app',
        routes: [
          {
            name: 'announcements',
            path: '/announcements',
            auth: 'required',
            authz: 'skip',
            navigation: { title: 'title' },
          },
        ],
      },
    ]);
  });
});
```

`packages/app-plugin-announcements/tests/client/page.test.tsx` を追加し、実際の API のクライアントからのリクエスト、表示される内容、空の結果、失敗を確認します。

```tsx
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import announcements from '../../client/index.js';
import AnnouncementsPage from '../../client/pages/announcements.js';

const options = {
  plugins: [announcements()],
  namespace: '@nocobase/app-plugin-announcements',
  locale: 'zh-CN',
};

describe('announcements page', () => {
  it('requests the API and displays announcements', async () => {
    await renderWithApp(<AnnouncementsPage />, {
      ...options,
      fetch: answerApi((call) => {
        expect(call).toMatchObject({ method: 'GET', path: 'announcements' });
        return {
          data: [{ id: 'one', title: 'Test announcement', content: 'Hello!' }],
          meta: { total: 1 },
        };
      }),
    });
    expect(await screen.findByText('Test announcement')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '公告栏' })).toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    await renderWithApp(<AnnouncementsPage />, {
      ...options,
      fetch: answerApi(() => ({ data: [], meta: { total: 0 } })),
    });
    expect(await screen.findByText('暂无公告。')).toBeInTheDocument();
  });

  it('shows an API failure', async () => {
    await renderWithApp(<AnnouncementsPage />, {
      ...options,
      fetch: answerApi(() => new Response(null, { status: 500 })),
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('公告加载失败');
  });
});
```

生成されたほかのテストは残し、変更をフォーマットして、プラグインのチェックを実行します。

```bash
pnpm --filter @nocobase/app-plugin-announcements format
pnpm --filter @nocobase/app-plugin-announcements check
```

## 6. アプリに登録して結果を確認する

依存関係のインストールと実行時の入口の登録は、別々の手順です。登録の計画をプレビューしてから、プラグインを登録します。

```bash
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
```

プラグインはすでにインストール済みの workspace の依存関係なので、`--no-install` でもう一度インストールするのを避けます。コマンドは、既存のプラグインを保ったまま、アプリの `client/plugins.ts` と `server/plugins.ts` に登録を追加します。

開発サーバーを起動するか、再起動します。

```bash
pnpm dev
```

開発サーバーが表示するアプリの URL を開き、サインインして **Announcements** を選びます。既定の `/main` のベースパスの場合：

| 場所 | 期待される結果 |
| --- | --- |
| `/main/announcements` | `Welcome` と `Your first plugin is ready.` が表示される |
| `/main/api/announcements` | サインインしなくても、`data` と `meta.total` を含む JSON が返る |
| 英語と中国語を切り替える | メニューとページのテキストが変わる。お知らせの内容は Server が返したデータのまま |

最後に、別のターミナルでアプリ全体のビルドを確認します。

```bash
pnpm build
```

これで、プラグインがページ、API、翻訳を所有し、アプリは公開の入口からそれらを読み込みます。ローカルのプラグインは、npm に公開しなくてもアプリと一緒にビルド、配布されます。必要に応じて、データベースのマイグレーション、お知らせの管理、権限で拡張してください。関係するディレクトリと入口については [プラグインの構成](plugin-structure.md) を参照してください。

バージョンを独立して管理しながら複数のアプリで共有するには、[ビルドと公開](publish-plugin.md) に進んでください。現在のアプリだけでプラグインを使う場合、公開は不要です。

複数のページとナビゲーションについては、[ページ、ルート、メニュー](pages-and-menus.md) に進んでください。

実行時の宣言、パッケージのエクスポート、プラグイン間のサービスの呼び出しをつなぐには、[プラグインの宣言と公開のエクスポート](plugin-declarations.md) に進んでください。
