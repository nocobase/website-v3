---
title: API リファレンス
description: NocoBase 3 のサービス、HTTP、設定、データベースのよく使う公開の入口と取り決め。
---

このページでは、よく使う公開の API、戻り値、制約を用途ごとに一覧にしています。完全なパラメーター、オーバーロード、補助の型は、インストールされた宣言を参照してください。データベースのリファレンスの章へのリンクは下にあります。作業の流れについては [アプリ開発](../developing-apps/overview.md) と [フレームワーク](../framework/overview.md) を参照してください。

概念のガイドは [フレームワーク](../framework/overview.md) を参照してください。スキーマ、照会、トランザクションは [データベースのトピック](../framework/database/overview.md) で学べます。

## 公開のインポートの入口

| 入口 | よく使うエクスポート | 用途 |
| --- | --- | --- |
| `@nocobase/app-client` | `createApp`、`defineClientPlugin`、`defineAppRoutes`、`useService`、`useApiClient` | クライアントの組み立て、ルート、サービス、リクエスト |
| `@nocobase/app-server` | `defineServerPlugin`、`defineServerPlugins` | サーバーのプラグインの宣言 |
| `@nocobase/app-server/router` | `defineApiRoutes`、`defineRepositoryApiRoutes`、`defineRootRoutes`、`defineHttpMiddleware`、`apiValidator`、`ApiError` | HTTP のエンドポイント、検証、エラー |
| `@nocobase/app-server/config` | `defineAppConfig`、`defaultAppConfigs`、`envString`、`envInteger`、`envBoolean` | サーバーの設定と環境変数の対応付け |
| `@nocobase/service-provider` | `ServiceProvider`、`ServiceContainer`、`createServiceToken` | クライアントとサーバーのサービスコンテナとライフサイクル |
| `@nocobase/api-client` | `createApiClient`、`ApiClientError` | 単独の HTTP クライアント |
| `@nocobase/db` | `createDatabaseManager`、`databaseManagerToken` | データベースの管理とアプリのデータベースのサービス |

ソースのディレクトリと npm のエクスポートは異なることがあります。依存関係の非公開の `src/` やビルドのファイルではなく、`package.json` で宣言された公開の入口からインポートしてください。パッケージの用途については [Core とツールのパッケージ一覧](packages.md) を参照してください。

## サービスコンテナと依存性注入

クライアントとサーバーは同じサービスコンテナの概念を使い、それぞれのランタイムで別々のインスタンスを持ちます。

| API | 用途と戻り値 |
| --- | --- |
| `createServiceToken<T>(name)` | 型付きのサービスの識別子を作成する |
| `container.instance(token, value)` | 既存のインスタンスを登録する。`void` を返す |
| `container.singleton(token, factory)` | 同期のファクトリーを登録し、最初の解決時に作成してキャッシュする |
| `container.resolve(token)` | サービスを返す。登録がない場合や依存関係が循環している場合は例外を投げる |
| `container.has(token)` | 登録を確認する |
| `container.resolveIfCreated(token)` | 作成せずに既存のインスタンスを読み取る。`undefined` を返すことがある |
| `ServiceProvider.register()` | サービスを同期で登録する |
| `boot()`、`start()`、`ready()`、`shutdown()` | Provider の非同期のライフサイクルのフック |

```ts
import { createServiceToken, ServiceContainer } from '@nocobase/service-provider';

interface GreetingService {
  greet(name: string): string;
}

const greetingToken = createServiceToken<GreetingService>('example.greeting');
const services = new ServiceContainer();
services.singleton(greetingToken, () => ({
  greet: (name) => `Hello, ${name}`,
}));

const message = services.resolve(greetingToken).greet('NocoBase');
// Hello, NocoBase
```

1 つのコンテナで同じトークンを 2 回結び付けることはできません。同じ名前で新しいトークンを作っても同じ識別子にはならないため、利用側は提供側がエクスポートしたトークンをインポートする必要があります。シングルトンのファクトリーは同期です。非同期の初期化はライフサイクルのフックで行います。

アプリでは、ランタイムの既存のコンテナを使います。React のコンポーネントは `useService(token)` でサービスを解決し、サーバーのコードでは一般に `app.container.resolve(token)` を使います。React の Provider はコンポーネントツリーのコンテキストを提供するもので、ServiceProvider とは異なります。登録と実行の順序については [ServiceProvider](../extension-development/service-provider.md) を参照してください。

## クライアントのリクエスト

アプリの React のコンポーネントの中で `useApiClient()` を呼び出し、設定済みのクライアントを取得します。独立した呼び出し側は、`@nocobase/api-client` を直接の依存関係として宣言し、その `createApiClient({ baseURL })` を使えます。アプリのクライアントも、これらのインターフェースと型を再エクスポートしています。

| API | 戻り値 / 制約 |
| --- | --- |
| `api.request<T>(options)` | 解析済みのレスポンスのボディ全体を含む `Promise<T>` |
| `api.stream(options)` | `Promise<ReadableStream<Uint8Array>>` |
| `api.repository(name)` | 対応するサーバーの Repository のエンドポイントのためのリモートのクライアント |
| `ApiClientError` | ステータスの情報を含む、構造化された HTTP の失敗 |

リクエストのオプションには、`path`、`method`、`query`、`headers`、`signal`、`credentials` があります。JSON のボディには `json` を、それ以外のボディには `body` を使い、両方を設定しないでください。既定のメソッドは `GET`、既定の credentials は `include` です。

```ts
import type { ApiClient } from '@nocobase/app-client';

type Announcement = { id: string; title: string };

export async function loadAnnouncements(api: ApiClient) {
  const response = await api.request<{ data: Announcement[] }>({
    path: '/announcements',
    method: 'GET',
    query: { limit: 20 },
  });
  return response.data;
}
```

これは、`{ data: [...] }` を返すお知らせのエンドポイントをアプリが提供していることを前提にしています。`request()` は包みを保ち、TypeScript のジェネリクスはレスポンスを検証しません。リモートの `repository()` の呼び出しには対応するサーバーのエンドポイントが必要で、データベースのテーブルを作成しても HTTP で公開されることはありません。身元、入力の検証、データの権限は、引き続きサーバーが扱います。

## サーバーの HTTP

| API | 用途 |
| --- | --- |
| `defineApiRoutes(createRouter)` | アプリの API の接頭辞の下に Hono のルートを宣言する |
| [`defineRepositoryApiRoutes({ repositories, principal? })`](../framework/http/repository-routes.md) | 明示的なコレクション、操作、ポリシーで Repository のデータエンドポイントを宣言する |
| `defineRootRoutes(createRouter)` | アプリのルートの下にルートを宣言する |
| `defineHttpMiddleware({ name, register })` | 名前付きの HTTP のミドルウェアを登録する |
| `apiValidator(target, schema)` | リクエストの入力を検証する |
| `ApiError` | フレームワークが認識する API エラーを投げる |

ルートのファクトリーはアプリを受け取り、Hono の Router を返します。宣言は、アプリまたはプラグインの拡張の入口で登録します。通常の API の接頭辞は `/api` で、アプリのベースパスも考慮します。

別々の依存関係のコピーによるメタデータのレジストリーの混在を避けるため、OpenAPI の記述のヘルパーは `@nocobase/app-server/router` からインポートします。アクセスのチェックが有効な場合、アプリは `/api/swagger` で画面を、`/api/swagger/docs` でドキュメントを公開します。既定のテンプレートでのアクセスは引き続き身元と権限のチェックに従い、自動で匿名のエンドポイントのディレクトリになるわけではありません。

完全な例については、[HTTP ルートと API](../developing-apps/apis-and-services.md) と [プラグインのサーバー API](../extension-development/server-apis.md) を参照してください。

## 設定

| API | 用途 |
| --- | --- |
| `defineAppConfig({ defaults, env, validate, public })` | サーバーの設定のセクションとそのルールを定義する |
| `defaultAppConfigs({ section: factory })` | 設定のセクションを組み立てる |
| `config.get<T>(key)` | パスを読み取る。`undefined` を返すことがある |
| `config.reload()` | 設定を再読み込みする。サービスが新しい値をどう使うかは、呼び出し側が扱う必要がある |

`public` は、ブラウザーから読み取れる、セクションからの相対の末端のパスを宣言します。似た名前のクライアントのファイルがあっても、サーバーの設定が自動で公開されることはありません。優先順位、例、環境変数については [設定リファレンス](configuration.md) を参照してください。

## データベースの管理

アプリでは、既存の `databaseManagerToken` を解決します。独立したツールやテストでは、自分で DatabaseManager を作成して解放します。

| API | 戻り値 / 用途 |
| --- | --- |
| `createDatabaseManager(config)` | マネージャーを作成する |
| `db.connection(name?)` | 接続を取得する。既定は設定された既定の接続 |
| `db.connect(name?)` | 非同期で接続し、接続を返す |
| `db.builder(name?)` | CollectionBuilder を取得する |
| `db.query(name?)` | QueryAdapter を取得する |
| `db.collections(name?)` | コレクションの発見と診断を取得する |
| `db.repository(collection, connection?)` | 論理的なコレクションの Repository を取得する |
| `db.transaction(callback, name?)` | トランザクションの接続でコールバックを実行し、その結果を返す |
| `db.destroy()` | マネージャーのデータベースのリソースを解放する |

`db.builder()` はメソッドで、`connection.builder` はプロパティです。`CollectionBuilder` は型としてだけエクスポートされています。`new CollectionBuilder()` を呼び出すのではなく、データベースからインスタンスを取得してください。

## Repository の戻り値

| メソッド | 戻り値 / 重要な動作 |
| --- | --- |
| `findMany(options?)` | 遅延評価の `RepositoryQuery`。配列を await するか、レコードを非同期で反復する |
| `findOne(options)` | 1 件のレコードまたは `undefined`。フィルターが一意であることは証明しない |
| `count(options?)`、`exists(options?)` | 件数 / 存在 |
| `createOne({ values, ... })` | 1 件の変更の結果。その `.record` を読み取る |
| `updateOne({ filter, values, ... })` | 1 件の変更の結果。対象がない場合やあいまいな場合は拒否する |
| `upsertOne({ filter, create, update, ... })` | 1 件の変更の結果。一意に識別するフィルターが必要 |
| `deleteOne({ filter, ... })` | 削除の結果。返されるレコードが必要な場合は `select` を指定する |
| `createMany`、`updateMany`、`deleteMany` | 件数と、必要に応じて返されるレコードを含む一括の結果 |

同じ `findMany()` の照会で、await と非同期の反復を混ぜたり、繰り返し消費したりしないでください。一括の更新と削除には、フィルターまたは明示的な `all: true` が必要です。

`context` は照会の変数を提供するもので、トランザクションのハンドルではありません。Repository はコールバックのトランザクションの接続から取得します。外側の接続の Repository が、自動でトランザクションに参加することはありません。Builder の `transaction()` メソッドも、現在データベースのトランザクションを開始しません。

Repository は、現在の HTTP のユーザーを推測しません。認可からポリシーを導き、`withPolicy()` を適用して行とフィールドの権限を設けます。ユーザーが指定したフィルターは認可ではありません。[データの照会と操作](../developing-apps/querying-data.md) を参照してください。

## 完全な宣言とデータベースの章

- [データベースの API の目次](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/README.md)
- [公開のエクスポートの一覧](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/exports.md)
- [DatabaseManager](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/database-manager.md)
- [接続とダイアレクトの取り決め](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/connection.md)
- [マイグレーションとシード](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/migration-and-seed.md)
- [コレクション、フィールド、リレーション、メタデータ](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/collection-and-schema.md)
- [Query](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/query.md)
- [Repository](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/repository.md)
- [権限のポリシー](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
- [トランザクション](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/transactions.md)
- [データベースのイベント](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/events.md)
- [テストのツール](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/testing.md)

これらのリンクは Core のリビジョン `015404ecd0db`（2026-10-26）に固定されており、完全なシグネチャー、エクスポートの境界、既知の制限を含みます。[パッケージ一覧](packages.md) は、同じリビジョンのクライアント、HTTP、設定のソースにリンクしています。ロックファイルとローカルにインストールされた型も確認してください。パッケージが 1 つのバージョン番号を共有しているわけではありません。

サービス、リクエスト、設定の例は、型チェックと実行に合格しています。メモリ上の SQLite でのチェックでも、1 件の変更の戻り値、照会、トランザクションのロールバックを、既定のテンプレート beta.83 のインストール済みの依存関係で、外部のデータベースに接続せずに検証しています。
