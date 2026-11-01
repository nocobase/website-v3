---
title: Repository のデータ API
---

`defineRepositoryApiRoutes()` は、選んだコレクションの Repository の操作に対して HTTP のエンドポイントを宣言します。クライアントは `api.repository(name)` を呼び出し、サーバーが照会の入力を解析し、ポリシーを適用し、Repository を呼び出して、標準の結果を返します。アプリとプラグインは同じ宣言を使います。

公開の入口は `@nocobase/app-server/router` で、現在のエクスポートの名前は `defineRepositoryApiRoutes` です。データベース側の意味については [Repository とデータの操作](../database/repositories.md) を参照してください。

## 使うべきとき

| 要件 | 選択 |
| --- | --- |
| 1 つの Repository の操作で完結する一覧、詳細、フィールドの編集 | 明示的なアクセスポリシーを持つ Repository のエンドポイント |
| 保存された業務の状態を確認する、権限の範囲をまたぐ、副作用がある操作 | 独自のルートと業務サービス |
| サーバー内部でのデータアクセス | データベースの Repository を直接呼び出す |

個人のメモのタイトルを編集するのは、このアダプターに向いています。状態の確認、在庫の更新、後続のジョブを伴う注文の提出には、業務のエンドポイントが必要です。1 つのリソースで両方の方法を使い、操作ごとに選ぶこともできます。[HTTP ルートと API](../../developing-apps/apis-and-services.md) を参照してください。

## エンドポイントを宣言して登録する

この例では、公開のカテゴリーのカタログを意図的に匿名の閲覧者に公開し、`id` と `title` だけを返します。自動採番の数値の `id` と文字列の `title` を持つ既存の `categories` コレクションを前提にしています。[スキーマとフィールド](../database/schema.md) と [マイグレーション](../database/migrations.md) で用意してください。

アプリでは `server/routes/public-categories.ts` として、プラグインでは同等のルートのモジュールとして、宣言を保存します。

```ts
import { defineRepositoryApiRoutes } from '@nocobase/app-server/router';

export default defineRepositoryApiRoutes({
  repositories: [
    {
      name: 'publicCategories',
      collection: 'categories',
      actions: {
        findMany: { maxLimit: 50 },
        findOne: {},
        count: {},
      },
      policy: {
        read: { scope: true, fields: ['id', 'title'] },
        create: false,
        update: false,
        delete: false,
      },
    },
  ],
});
```

アプリでは、そのデフォルトエクスポートを `server/routes/index.ts` の既存のルートの配列に追加します。プラグインでは、`defineServerPlugin()` の `routes` 配列に追加してから、対象のアプリにプラグインを登録します。ほかのルートは残してください。宣言しても照会は実行されません。実行時に、提供内容がホストのコンテナから `databaseManagerToken` を解決します。

この例では意図的にカテゴリーのデータを公開しています。ユーザー、注文などの業務データのエンドポイントには、認証と業務上の認可が必要です。このヘルパーは、認証のミドルウェアをインストールしたり、テーブルを作成したり、宣言していないコレクションを公開したりはしません。

| オプション | 意味 |
| --- | --- |
| `name` | HTTP での公開名。`api.repository(name)` にも渡す |
| `collection` | 論理的なデータベースのコレクション。既定は `name` |
| `connection` | 設定済みの接続名。既定は既定の接続 |
| `actions` | 明示的な操作。それぞれにオプションのオブジェクトを付ける。`{}` はその操作の既定値を使う |
| `policy` | 必須の完全な Repository のポリシー。またはリクエストの主体からそれを導く関数 |

名前には、`salesOrders` のように小文字で始まるキャメルケースを使います。名前の重複、プラグインの名前空間との衝突、`auth`、`healthz`、`swagger` などの予約名は避けてください。`collection` は論理的なコレクションの名前で、物理的なテーブルの名前ではありません。

## 操作を有効にする

| 操作 | 用途 |
| --- | --- |
| `findMany`、`findOne` | 一覧と個々のレコード |
| `count`、`exists` | 件数と存在 |
| `createOne`、`updateOne`、`deleteOne` | 1 件のレコードの変更 |
| `aggregate`、`groupBy` | 集計とグループ化 |

ルートがあるのは `actions` に列挙した操作だけです。この例には、作成、更新、削除のルートはありません。`createMany`、`updateMany`、`deleteMany`、`upsertOne` は、データベースの Repository では対応していても、現在この HTTP のアダプターの対象外です。

`findMany.maxLimit` は既定の件数と最大の件数の両方を設定し、既定は `100` です。上限を超えると、件数を黙って切り詰めるのではなく `400` を返します。`limit: 0` のリクエストは、無制限の結果ではなく空の配列を返します。この上限が適用されるのは `findMany` だけです。集計の入力と計算の範囲には、別に上限を設けてください。

## クライアントと HTTP での呼び出し

React のページは `useApiClient()` で設定済みのクライアントを取得し、通常の関数やサービスに渡します。

```ts
import type { ApiClient } from '@nocobase/app-client';

type Category = { id: number; title: string };

export async function loadCategories(api: ApiClient) {
  return await api.repository<Category>('publicCategories').findMany({
    select: (selection) => selection.fields('id', 'title'),
    limit: 20,
  });
}
```

`publicCategories` は公開名で、データベースのコレクションは `categories` のままです。この呼び出しは次のリクエストを送ります。アプリのベースパスの下にデプロイした場合は、そのパスが付きます。

```http
POST /api/publicCategories/findMany
Content-Type: application/json

{
  "select": {
    "kind": "select",
    "version": 1,
    "root": { "kind": "selection", "fields": ["id", "title"], "includes": [] }
  },
  "limit": 20
}
```

読み取りも含め、すべての操作で `POST /api/{name}/{action}` を使います。成功のレスポンスは `{ data: result }` を使います。

- リモートの Repository が `data` を取り出すため、`await findMany()` はレコードの配列を返します。通常の `api.request()` は、レスポンスのボディ全体を返します。
- `findOne()` の結果がない場合、HTTP では `{ data: null }` で、リモートのクライアントでは `undefined` になります。
- `createOne()` と `updateOne()` は変更の結果を返します。レコードには `.record` を使います。
- `deleteOne()` は、空の `204` のレスポンスではなく、JSON の削除の結果を返します。

リモートの照会は照会の入力のビルダーにも対応しており、クライアントが送信の前にシリアライズします。HTTP の JSON に関数は含められません。`findMany()` の非同期の反復は NDJSON のストリームを読み取ります。各照会は一度だけ消費し、await と反復を混ぜないでください。[API Client](api-client.md) と [照会の入力とビルダー](../database/query-inputs.md) を参照してください。

## ポリシー、身元、業務上の認可

`policy` では、`read`、`create`、`update`、`delete` の 4 つのエントリーをすべて宣言する必要があります。`false` はその種類の操作を拒否し、`true` はその機能をすべて許可し、ルールのオブジェクトは範囲、フィールド、リレーションを制限します。`actions` はルートが存在するかどうかを、`policy` は存在するルートで何ができるかを決めます。

ルールの `fields` は許可リストで、省略してもすべてのフィールドを意味するわけではありません。リレーションにも明示的なルールが必要です。読み取りのポリシーは、変更後に返されるレコードにも適用されます。呼び出し側が指定した `filter` でサーバーの `scope` を広げることはできず、リクエストのボディで `policy` や `scope` を指定することもできません。

個人のメモには、主体から導くポリシーを使えます。この例は、`id`、`title`、文字列のユーザー識別子 `ownerId` を持つ既存の `notes` コレクションを前提にしています。

```ts
import {
  defineRepositoryApiRoutes,
  type DefineRepositoryApiRoutesOptions,
} from '@nocobase/app-server/router';

type Principal = { userId: string };
type ResolvePrincipal = NonNullable<
  DefineRepositoryApiRoutesOptions<Principal>['principal']
>;

export function createNoteRoutes(resolvePrincipal: ResolvePrincipal) {
  return defineRepositoryApiRoutes<Principal>({
    principal: resolvePrincipal,
    repositories: [
      {
        name: 'myNotes',
        collection: 'notes',
        actions: { findMany: {}, createOne: {}, updateOne: {} },
        policy: ({ userId }) => ({
          read: { scope: { ownerId: userId }, fields: ['id', 'title'] },
          create: {
            scope: { ownerId: userId },
            fields: ['title'],
            defaults: { ownerId: userId },
          },
          update: { scope: { ownerId: userId }, fields: ['title'] },
          delete: false,
        }),
      },
    ],
  });
}
```

`createNoteRoutes(resolvePrincipal)` を呼び出し、返された提供内容を登録します。`resolvePrincipal` はアプリの認証の組み込みが提供するもので、ボディや検証されていないヘッダーではなく、検証済みのセッションや身元のコンテキストから `userId` を取得します。この関数自体はログインの検証を行いません。

動的なポリシーには、`principal` のリゾルバーが必要です。`null` や `undefined` を返すと、リクエストは `403` で拒否されます。この例では、読み取りと書き込みを現在のユーザーのメモに限定し、作成時の `ownerId` はサーバーが設定し、呼び出し側からは `title` だけを受け付けます。

管理者が設定するロール、業務操作、データ範囲には、認可プラグインの `authz.database.authorizeRepository()` を組み込みます。これは公開の操作を業務操作に対応付け、ルートのポリシーと交わるリクエストのポリシーを追加します。既存のフィールドや範囲のアクセスを広げることはできません。先に認証を実行し、保護するすべての操作を網羅してください。下にリンクしたプラグインの組み込みの完全な例を参照してください。

## 検証、エラー、API ドキュメント

このアダプターは JSON を必須とし、リクエストのボディを 1 MiB に制限して、操作ごとに許可されるオプションを検証します。Repository は、フィールド、照会の AST、変更の構造を検証します。業務固有のテキストの上限、状態の確認、レコードをまたぐ制約は明示的に実装してください。複雑な操作には独自のハンドラーが必要です。

エラーは標準の `{ error: ... }` の包みを使います。無効な入力は通常 `400`、ポリシーの拒否は `403`、レコードがない場合は `404`、バージョンや 1 件のレコードの件数の競合は `409` を返します。JSON 以外の内容は `415`、大きすぎるボディは `413` を返します。処理には `status` と `reason` を確認します。[検証とレスポンス](validation.md) を参照してください。

有効にした Repository のエンドポイントは、そのコレクションと操作から OpenAPI の記述を生成します。任意の `computedFields` は、追加の読み取り専用のレスポンスのフィールドを記述するだけで、フィールドを計算したりレスポンスを変えたりはしません。API ドキュメントは、リクエストごとの認可の代わりにはなりません。

## インターフェースと実装

- [Repository のルートの宣言と実装](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/repository-routes.ts)
- [Repository のルートの取り決めのテスト](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/tests/repository-routes.test.ts)
- [リモートの Repository のクライアント](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/api-client/README.md)
- [認可プラグインの組み込み](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authorization/skills/nocobase-app-plugin-authorization/references/repository-routes.md)
