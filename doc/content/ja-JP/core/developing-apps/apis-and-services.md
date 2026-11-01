---
title: HTTP ルートと API
description: ページ、リダイレクト、ダウンロード、権限、API ドキュメントのために、サーバーの Web ルート、独自の API、Repository のデータエンドポイントを登録します。
---

アプリは、HTML、リダイレクト、ファイルを直接返すことも、ページやほかのクライアント向けに JSON の API を返すこともできます。Product Catalog の例でこれらの使い方を示します。アプリの全体は [サンプルのソースとセットアップ](#サンプルのソースとセットアップ) を参照してください。

## ルートの種類を選ぶ

### Web ルートと API ルート

| 要件 | 宣言 | パスの例 |
| --- | --- | --- |
| HTML のページ、リダイレクト、ファイルのダウンロード、プロトコルのコールバック | `defineRootRoutes()` | `/catalog` |
| 独自の照会、レコードの作成、業務操作 | `defineApiRoutes()` | `/api/products` |
| 1 つのコレクションに対する標準の Repository の操作を HTTP で行う | `defineRepositoryApiRoutes()` | `/api/publicCategories/findMany` |

`defineRootRoutes()` のルートはアプリのルートを意味し、ドメインのルートとは異なることがあります。Web ルートは、内容とステータスコードを自分で選びます。API ルートは標準の検証、JSON のレスポンス、エラーを使い、API ドキュメントに表示されます。どちらのルートの種類も、エンドポイントを公開するかどうかを決めるものではありません。用途に合わせてアクセスを設定してください。

この例の公開カタログは、公開済みの製品を表示します。カテゴリーは匿名での読み取りを許可します。製品管理の API と CSV のダウンロードには、認証と該当する権限が必要です。

### サーバーのルートとクライアントのページのルート

ここでいう Web ルートは、サーバーで HTTP リクエストを処理し、HTML などのレスポンスを直接返すものです。React のページのルートは、クライアントのページ、レイアウト、ナビゲーションを整理します。[ページ、ルート、ナビゲーション](pages-routes-and-navigation.md) を参照してください。サーバーのルートを追加しても、サイドバーの項目は追加されません。

アプリの一覧、フォーム、ドロワーには、通常、API を呼び出すクライアントのページのルートを宣言します。サーバーの Web ルートは、単独の HTML ページ、古いアドレスからのリダイレクト、ダウンロードに向いています。

## ルートを宣言して登録する

### ルートのファイルと登録の入口

ルートは `server/routes/` で宣言し、`server/routes/index.ts` に追加します。ファイルを作成するだけでは、そのルートは公開されません。

```ts
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';
import catalogWeb from './catalog-web.js';
import products from './products.js';
import categories from './categories.js';

const routes: readonly AppRouteContribution<Application>[] = [
  catalogWeb,
  products,
  categories,
];
export default routes;
```

これらの宣言は、ほかのルートを残したまま既存の配列に追加します。既定のテンプレートの `server/runtime.ts` はすでにこの入口を接続しているため、通常はランタイムを変更する必要はありません。ルートのファクトリーは起動時に実行され、そのハンドラーはリクエストごとに実行されます。

出典：[ルートの登録](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/index.ts)。サンプルを起動したら、アプリの入口の下の `/catalog` を開くとカタログが表示されます。

### アプリのベースパスと API の接頭辞

個々のハンドラーでは、`/api` もデプロイのベースパスも宣言しません。アプリを `/shop` にマウントした場合は次のようになります。

| 宣言 | コード内のパス | リクエストのパス |
| --- | --- | --- |
| `defineRootRoutes()` | `/catalog` | `/shop/catalog` |
| `defineApiRoutes()` | `/products` | `/shop/api/products` |
| Repository の `publicCategories`、操作 `findMany` | アダプターが生成 | `/shop/api/publicCategories/findMany` |

起動時に表示されるアプリのアドレスを使います。生成する HTML のリンクには、`/shop` や `/main` をハードコードせず、`app.publicBasePath` を使います。API Client はすでに API のベース URL を持っており、`/products` などのリクエストのパスはそのアドレスからの相対パスです。

## Web ルートを書く

### HTML のページを返す

`defineRootRoutes()` は Hono のルーターを返すファクトリーを受け取ります。`c.html()` は HTML を返します。`hono/html` のテンプレートは、補間した通常の文字列をエスケープします。製品名などの外部のデータを HTML に連結しないでください。

これは `server/routes/catalog-web.ts` のカタログのハンドラーの中心となるパターンで、ナビゲーションとスタイルは省いています。

```ts
import { Hono } from 'hono';
import { html } from 'hono/html';
import type { Application } from '@nocobase/app-server/application';
import { defineRootRoutes } from '@nocobase/app-server/router';
import { catalogServiceToken } from '../providers/catalog.js';
import { publicProductPolicy } from '../providers/catalog-service.js';

export default defineRootRoutes<Application>((app) => {
  const router = new Hono();
  const service = app.container.resolve(catalogServiceToken);

  router.get('/catalog', async (c) => {
    const { data } = await service.list(publicProductPolicy, {
      q: '', page: 1, pageSize: 50,
    });
    return c.html(html`<ul>${data.map((product) =>
      html`<li>${product.name}</li>`,
    )}</ul>`);
  });
  return router;
});
```

`publicProductPolicy` はこの例のものです。`published` が true の製品の指定したフィールドだけを許可し、書き込みは拒否します。公開の範囲は、ブラウザーが指定するフィルターとは無関係に、サーバーが定めます。

`<アプリの入口>/catalog` を開きます。初期データでは **Canvas Backpack** と **Desk Lamp** が表示され、未公開の **Travel Mug** は表示されないはずです。ページには最大 50 件の製品が表示されます。

![サーバーでレンダリングしたカタログ。公開済みの 2 つの製品と、アプリ、API ドキュメント、CSV ダウンロードへのリンクが表示されます](/assets/core/developing-apps/apis-and-services/catalog-web.png)

出典：[Web ルート](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/catalog-web.ts)、[公開の読み取りポリシーと照会のサービス](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/providers/catalog-service.ts)。

### 別のアドレスにリダイレクトする

同じ Web ルーターで `c.redirect()` を使います。

```ts
router.get('/old-catalog', (c) => c.redirect('/catalog', 302));
```

`/shop/old-catalog` をリクエストすると、`Location: /shop/catalog` とともに `302` が返り、ブラウザーがそれに従います。この例で使うランタイムは、`/` で始まるアプリ内のリダイレクト先にアプリのベースパスを付け、外部の絶対 URL はそのままにします。確認していないユーザーの入力をリダイレクト先に使わないでください。

`curl -i "$APP_URL/old-catalog"` を実行すると、ステータスと `Location` を確認できます。`APP_URL` はアプリのベースパスを含み、末尾にスラッシュは付けません。[Web ルートの実装](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/catalog-web.ts) を参照してください。

### ファイルとダウンロードを返す

ダウンロードも Web ルートにできます。次のハンドラーは、認証と認可のミドルウェアのあとで実行されます。`productPolicy()` は、現在のリクエストで許可されたデータの範囲を提供します。

```ts
router.get('/catalog/export.csv', async (c) => {
  const policy = await productPolicy(c, 'view');
  const records = await service.repository(policy).findMany({
    limit: 500,
    sort: (s) => s.field('name').asc(),
  });
  // The example handles quotes, newlines and spreadsheet formula prefixes.
  const csv = toCsv(records);
  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', 'attachment; filename="products.csv"');
  c.header('Cache-Control', 'private, no-store');
  return c.body(csv);
});
```

`toCsv` は [この例の CSV 変換関数](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/catalog-web.ts) で、フレームワークの API ではありません。`Content-Type` は内容を記述し、`Content-Disposition: attachment` はファイルとしてのダウンロードを求めます。

製品の閲覧権限を持つアカウントで同じアプリにサインインし、カタログで **Download CSV** をクリックします。ダウンロードした `products.csv` には、そのアカウントが閲覧できる最大 500 件の製品が含まれ、許可されていれば下書きも含まれます。管理者のエクスポートの範囲は、公開ページの公開済みだけのポリシーとは異なります。匿名でのダウンロードは `401` を返し、閲覧権限のない認証済みの呼び出し元は `403` を受け取ります。

この例では、小さなファイルをメモリ上で生成しています。より大きなエクスポートでは、上限を外してすべてのレコードを一度に読み込むのではなく、バッチでの読み取りやストリーミングが必要です。

## 独自の API を書く

以下のハンドラーは、`server/routes/products.ts` の `defineApiRoutes()` ファクトリーの中に置くものです。ファクトリーは認証、認可、製品のサービスを解決し、エラー処理を登録します。`service` は製品のサービスで、`productPolicy(c, action)` は現在の操作のデータベースのポリシーを返します。どちらもこの例のコードです。それらの組み込みの全体は [製品の API](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/products.ts) を参照してください。

ファクトリーは `defineApiRoutes()` を使います。これは組み込みの骨組みです。上のソースには、認証、ハンドラー、例のヘルパーのインポートが含まれます。

```ts
import { Hono } from 'hono';
import type { Application } from '@nocobase/app-server/application';
import { defineApiRoutes } from '@nocobase/app-server/router';
import { catalogServiceToken } from '../providers/catalog.js';
import {
  catalogErrorHandler, type CatalogEnv,
} from './catalog-access.js';

export default defineApiRoutes<Application>((app) => {
  const router = new Hono<CatalogEnv>();
  const service = app.container.resolve(catalogServiceToken);
  router.onError(catalogErrorHandler);
  // Register path-scoped authentication and the handlers below here.
  return new Hono().route('/', router);
});
```

### クエリーのパラメーターを読み取り、一覧を返す

クエリーのパラメーターは `apiValidator('query', schema)` で検証し、変換された値を `c.req.valid('query')` で読み取ります。

```ts
const Query = z.strictObject({
  q: z.string().max(100).default(''),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

router.get('/products',
  describeRoute({
    tags: ['Products'], summary: 'List products', operationId: 'listProducts',
    responses: { 200: listResponse(Product), ...apiErrorResponses },
  }),
  apiValidator('query', Query),
  async (c) => c.json(await service.list(
    await productPolicy(c, 'view'), c.req.valid('query'),
  )),
);
```

サインインしてから、API ドキュメントで `GET /products?q=Desk&page=1&pageSize=10` を実行します。**Desk Lamp** と、`data`、`meta.page`、`meta.pageSize`、`meta.total` が返るはずです。行と件数には同じポリシーとフィルターを適用します。そうしないと、件数から呼び出し元がアクセスできないレコードが漏れることがあります。`pageSize=51` は `400` を返します。

出典：[一覧のハンドラー](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/products.ts)、[ページ分けした照会](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/providers/catalog-service.ts)。

### パスのパラメーターを読み取り、レコードを返す

Hono ではパスのパラメーターを `:id` と宣言し、OpenAPI では `{id}` と表示されます。

```ts
router.get('/products/:id',
  describeRoute({
    tags: ['Products'], summary: 'Get a product', operationId: 'getProduct',
    responses: { 200: dataResponse(Product), ...apiErrorResponses },
  }),
  apiValidator('param', z.object({ id: z.uuid() })),
  async (c) => c.json({ data: await service.get(
    await productPolicy(c, 'view'), c.req.valid('param').id,
  ) }),
);
```

一覧から製品の ID を取得し、`GET /products/{id}` をリクエストします。`{ data: product }` が返るはずです。この例では UUID を生成するため `z.uuid()` を使っていますが、ほかのアプリでは別の識別子を使うこともあります。無効な UUID は `400` を返します。有効な ID でも、存在しない場合や呼び出し元の読み取りの範囲外の場合は、同じ `404` を返します。

出典：[詳細のハンドラー](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/products.ts)。

### リクエストのボディを検証してレコードを作成する

作成では、名前とセント単位の価格を受け付けます。公開状態はサーバーが管理します。

```ts
const Values = z.strictObject({
  name: z.string().trim().min(1).max(100),
  priceCents: z.number().int().min(0).max(100000000),
});
```

ルートはこのスキーマを `apiValidator('json', Values)` に渡し、`c.req.valid('json')` を読み取ります。API ドキュメントで、次の内容で `POST /products` を実行します。

```json
{ "name": "Travel Notebook", "priceCents": 1200 }
```

`Idempotency-Key` ヘッダーも、`<13 桁のミリ秒のタイムスタンプ>.<UUID v4>` の形式で指定します。アプリのディレクトリで、新しい操作のキーを生成します。

```bash
node -e 'console.log(`${Date.now()}.${require("node:crypto").randomUUID()}`)'
```

成功すると `201` が返り、`data` に `id`、`name`、`priceCents`、`published: false` が含まれます。余分な `published` フィールド、空の名前、負の価格は、レコードを作成せずに `400` を返します。`strictObject()` は宣言されていないフィールドを拒否します。`describeRoute()` のレスポンスの宣言自体は、実際のレスポンスを絞り込みません。

この例では、`executeIdempotentMutation()` を明示的に使い、作成とその受付記録を 1 つのトランザクションでコミットしています。レスポンスが失われた操作は、元のキーと入力で再試行します。再送に成功すると `Idempotency-Replayed: true` が含まれ、2 つ目の製品は作成されません。意図して新しいレコードを作るときは新しいキーを使います。ヘッダーを付けるだけでは、通常の独自の POST にこの動作は備わりません。

出典：[作成のハンドラーと受付記録の組み込み](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/products.ts)。入力とエラーの取り決めについては [検証とレスポンスの処理](../framework/http/validation.md) を参照してください。

### 業務サービスを呼び出す

業務ルールは `server/providers/` に置き、Provider でサービスを登録して、ルートのファクトリーで一度だけ解決します。

```ts
const service = app.container.resolve(catalogServiceToken);
```

`POST /products/{id}/publish` の中心となるサービスの呼び出しは次のとおりです。

```ts
const policy = await productPolicy(c, 'publish');
const id = c.req.valid('param').id;
// Inside executeIdempotentMutation's execute(transaction) callback:
return service.publish(policy, id, transaction);
```

ルートは HTTP の入力、身元、認可、レスポンスを担います。サービスは製品が存在して未公開であることを確認し、渡されたポリシーとトランザクションの接続で更新します。Hono の Context を読んだり、HTTP ステータスを選んだりはしません。

作成したばかりの製品を、新しいキーと空のボディ `{}` で公開します。`published: true` とともに `200` が返り、公開カタログを再読み込みすると表示されるはずです。同じキーで再試行すると、元の結果が返ります。新しいキーでもう一度公開すると、`409 PRODUCT_ALREADY_PUBLISHED` が返ります。条件付きの更新で期待する状態を保つため、並行する呼び出し元が同じ下書きを両方とも未公開として扱うことはありません。

出典：[Provider とトークン](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/providers/catalog.ts)、[製品のサービス](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/providers/catalog-service.ts)、[公開のルート](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/products.ts)。サービスのライフサイクルについては [ServiceProvider](../extension-development/service-provider.md) を、トランザクションの境界については [トランザクションとデータの整合性](transactions-and-consistency.md) を参照してください。

## Repository のデータ API を使う

### コレクションと公開する操作を設定する

`defineRepositoryApiRoutes()` は、1 つのコレクションに対する標準の操作に向いています。テーブルも管理ページも作成しません。マイグレーションで `catalogCategories` を用意してから、次のように宣言します。

```ts
import { defineRepositoryApiRoutes } from '@nocobase/app-server/router';

export default defineRepositoryApiRoutes({
  repositories: [{
    name: 'publicCategories',
    collection: 'catalogCategories',
    actions: { findMany: { maxLimit: 50 }, findOne: {}, count: {} },
    policy: {
      read: { scope: true, fields: ['id', 'title'] },
      create: false, update: false, delete: false,
    },
  }],
});
```

`name` は HTTP のリソース名、`collection` はデータベースのコレクション名です。`actions` に列挙した操作だけが登録されるため、この宣言では `createOne` のルートは公開されません。読み取りにも POST を使います：`POST /api/publicCategories/findMany`。

出典：[カテゴリーの API](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/categories.ts)、[マイグレーション](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/database/main/migrations/202610310001_create_catalog.ts)。

### レコードとフィールドを制限する

`actions` はどの操作が存在するかを、`policy` はそれらの操作で許可するレコード、フィールド、書き込みを制御します。両方を設定してください。

上のポリシーは、すべてのカテゴリーの匿名での読み取りを許可しますが、返すのは `id` と `title` だけです。保存されている `internalNote` はレスポンスに現れてはならず、クライアントのフィルターでサーバーの範囲を広げることもできません。`findMany.maxLimit: 50` は結果の件数を制限し、`limit: 51` は `400` を返します。

身元やロールに応じたアクセスには、認証済みの身元の解決と動的なポリシーを組み込みます。完全なオプションと認可プラグインとの組み込みについては [Repository のデータ API](../framework/http/repository-routes.md) を参照してください。

### API Client と HTTP で呼び出す

React のページで `useApiClient()` でクライアントを取得し、通常の関数に渡します。

```ts
import type { ApiClient } from '@nocobase/app-client';

type Category = { id: string; title: string };
export async function loadCategories(api: ApiClient) {
  return api.repository<Category>('publicCategories').findMany({ limit: 20 });
}
```

結果はカテゴリーの配列です。リモートの Repository が `{ data }` を取り出します。生の HTTP レスポンスでは、ラッパーが残ります。

```bash
curl "$APP_URL/api/publicCategories/findMany" \
  -H 'Content-Type: application/json' \
  -d '{"limit":20}'
```

```json
{ "data": [
  { "id": "office", "title": "Office" },
  { "id": "travel", "title": "Travel" }
] }
```

明示的な並べ替えがない場合は、配列の順序に頼らないでください。同じクライアントの `count()` は数値を返し、`findOne()` はレコードまたは `undefined` を返します。クライアントのラッパーは [loadCategories](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/client/catalog-api.ts) を参照してください。サンプルの [エンドポイントのテスト](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/tests/server/catalog.test.ts) でも、実際の API Client で登録されたルートを呼び出しています。クライアントのリクエストの状態については [データのリクエストと状態管理](data-requests-and-state.md) を参照してください。

## ルートを保護し、エラーを処理する

### 認証と業務上の認可を追加する

`/api` の下にマウントしても、何も認証されません。各モジュールは自分が所有するパスを保護すべきで、ほかのモジュールの登録順序に頼ったり、グローバルなワイルドカードのミドルウェアで誤って公開のルートを保護したりしないでください。

```ts
const auth = app.container.resolve(authenticationToken);
const authz = app.container.resolve(authorizationToken);
for (const path of ['/products', '/products/*']) {
  router.use(path, auth.required({ scopedKeys: false }), authz.middleware());
}
```

認証は呼び出し元を特定します。認可は `view`、`create`、`publish` を確認し、その結果のデータベースのポリシーがレコードとフィールドを制限します。ダウンロードも認証と `view` のポリシーを使います。この例の管理操作はサインインしたセッションを使い、範囲を限定した API キーは受け付けません。

インストール時に **Catalog viewer** と **Catalog editor** のロールが作成されますが、一般ユーザーには割り当てられません。管理者は **Users** で特定のユーザーにロールを割り当て、**Permission management** で操作とデータの範囲を編集します。ページへのアクセスは、サーバーの操作を認可しません。

出典：[業務上の権限](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/catalog-resource.ts)、[リクエストの認可](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/catalog-access.ts)、[初期のロール](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/database/main/seeds/202610310001_catalog_roles.ts)。

### 無効な入力と業務エラーを処理する

HTTP のエラーは、ハンドラーごとに異なるエラーの JSON を組み立てるのではなく、`ApiError` で表して `apiErrorHandler()` に渡します。この例では、サービスのエラーを標準の API エラーに変換しています。

```ts
new ApiError({
  status: 'NOT_FOUND',
  reason: 'PRODUCT_NOT_FOUND',
  domain: 'catalog',
  message: 'Product not found.',
});
```

| 状況 | レスポンス |
| --- | --- |
| 匿名での製品 API やダウンロードのリクエスト | `401` |
| サインインしているが必要な操作の権限がない | `403` |
| 無効な入力 | `400`。検証エラーにはフィールドの情報が付く |
| 製品が存在しない、または許可された範囲外 | `404 PRODUCT_NOT_FOUND` |
| 公開済みの製品を新しい操作のキーで公開する | `409 PRODUCT_ALREADY_PUBLISHED` |

呼び出し側は、`message` のテキストではなく、ステータスと `reason` で分岐します。[エラーハンドラー](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/catalog-access.ts) を参照してください。Web ルートは API の形式を使う必要はありません。この例では失敗したダウンロードに標準の JSON のエラーを再利用していますが、HTML のページは独自のエラーページを用意してもかまいません。

### パスの衝突を避ける

各メソッドとパスには、明確なハンドラーを 1 つだけ与えます。フレームワークは、重複した API ルートを起動時に報告します。登録の順序に頼って別のエンドポイントを上書きしないでください。Web ルートは、`/api`、静的アセットのパス、クライアントのページのパスと重ならないようにします。ほかの入口を飲み込んでしまう、すべてを受け付けるハンドラーは避けてください。

この例では、HTML に `/catalog` を、業務 API に `/api/products` を使い、`/` はクライアントのアプリに任せています。API ドキュメントと [エンドポイントのテスト](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/tests/server/catalog.test.ts) で、登録された結果を確認できます。

## API ドキュメントを生成して使う

### 入力、レスポンス、エラーを記述する

独自の API では、`describeRoute()` で固定の `operationId`、タグ、目的、レスポンスを記述します。`apiValidator()` に渡したスキーマが入力の記述になります。`dataResponse()` と `listResponse()` はレコードと一覧のレスポンスを記述するもので、データベースを照会したり、実行時の検証の代わりになったりはしません。

Repository のエンドポイントは、そのコレクションと有効な操作から記述を生成します。Web ルートは API ドキュメントには載りません。上で示したように、ブラウザーや HTTP リクエストで直接確認してください。

出典：[API の宣言](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/server/routes/products.ts)。レスポンスのフィールドが変わったら、実際の結果とそのスキーマの両方を更新します。

### 対話型のドキュメントからリクエストを送る

サインインしてから `<アプリの入口>/api/swagger/docs#/Products` を開くと、製品のグループに直接移動できます。JSON のドキュメントは `<アプリの入口>/api/swagger` にあります。どちらも、アクセスを許可されたセッションまたは認証情報が必要です。

**Products** の下の操作を展開し、**Try it out** をクリックして、パラメーターとボディを入力し、**Execute** をクリックします。作成と公開には、前述の `Idempotency-Key` も必要です。詳細と公開のリクエストには、作成のレスポンスから新しい製品の ID をコピーして使います。

![対話型の API ドキュメントの Products グループには、一覧、作成、詳細、公開の操作があります](/assets/core/developing-apps/apis-and-services/catalog-api.png)

## ルートと API を検証する

### レスポンスと保存されたデータを確認する

サンプルの初期データで次を確認します。

1. 匿名で `/catalog` を開き、公開済みの製品だけが表示されることを確認します。`/old-catalog` を開き、リダイレクト先が同じアプリのベースパスの下にあることを確認します。
2. 匿名でカテゴリーの `findMany` を呼び出します。カテゴリーのタイトルが返り、`internalNote` が含まれないことを確認します。
3. 管理権限でサインインし、API ドキュメントで製品を作成します。`201` が返り、その詳細は読み取れますが、公開カタログには表示されません。
4. 公開します。`200` が返り、カタログを再読み込みすると表示されます。元の操作を再送しても再実行されず、新しい公開の操作は `409` を返します。
5. CSV をダウンロードし、ファイル名、内容、呼び出し元に許可されたレコードを確認します。

### アクセスの制限と失敗のケースを検証する

一般ユーザーでも確認します。ロールがない場合、製品の API とダウンロードは拒否されます。閲覧権限があれば読み取りとダウンロードはできますが、作成や公開はできません。製品の範囲を制限した場合、一覧、件数、詳細、ダウンロードのすべてに同じように影響する必要があります。

無効な入力でレコードが作成されないこと、範囲外の詳細で製品の情報が漏れないこと、権限を取り消すと次のリクエストが拒否されることも確認します。サンプルの自動チェックを実行します。

```bash
pnpm exec vitest run tests/server/catalog.test.ts tests/database/catalog.test.ts tests/server/authorization-assignment-safety.test.ts
```

これらのテストは、分離したデータベースと実際のサインインで実際のアプリを起動します。上記の境界、マイグレーションのロールバックと再適用、受付記録の再送、API ドキュメントを網羅しています。ブラウザーでのチェックとスクリーンショットの手順は、[サンプルの README](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/README.md) にあります。

## サンプルのソースとセットアップ

[Product Catalog のソースの全体](https://github.com/nocobase/docs-examples-v3/tree/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog) には、3 種類のルートすべて、製品のサービス、マイグレーション、英語のサンプルレコード、権限、テストが含まれます。

この例は、既定のテンプレート `1.0.0-beta.85`、Node.js 24 以降、pnpm 11.7.0 を使います。ロックファイルでサンプルの依存関係を固定しています。設定と、ドキュメントの各使い方とその実装の対応については [README](https://github.com/nocobase/docs-examples-v3/blob/0639e6a2a6cba857bf967757083e9f8d7aa6b9fe/apps/product-catalog/README.md) を参照してください。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 0639e6a2a6cba857bf967757083e9f8d7aa6b9fe
cd apps/product-catalog
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
APP_SAMPLE_DATA=true pnpm dev
```

SQLite はこの例のセットアップでの選択で、HTTP ルーティングの要件ではありません。初回の起動の前に、ローカルの `config.yml` の `users.initialAdmin` で管理者を設定します。起動時に表示される完全なアプリのアドレスでサインインします。`APP_SAMPLE_DATA=true` を指定すると、初回のインストール時にサンプルの製品とカテゴリーがインストールされます。以降の起動で、編集したデータが上書きされることはありません。初回のインストールでサンプルを省いた場合は、開発環境で `pnpm nocobase db sample` を使って追加します。

公開ページにはアプリのアドレスに `/catalog` を、API の操作には `/api/swagger/docs` を付けてアクセスします。保存した製品は、ページの再読み込みやサーバーの再起動のあとも残ります。
