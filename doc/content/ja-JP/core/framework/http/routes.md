---
title: ルートとリクエストのコンテキスト
---

HTTP のエンドポイントは、ルートの提供内容としてアプリに入ります。ファクトリーは起動時にサービスを解決し、ハンドラーはリクエストごとに入力と身元を読み取ります。

## API とルートの範囲

```ts
import { Hono } from 'hono';
import { defineApiRoutes } from '@nocobase/app-server/router';

export default defineApiRoutes(() => {
  const router = new Hono();
  router.get('/example/ping', (context) => context.json({ data: { ok: true } }));
  return router;
});
```

この宣言を、アプリの `server/routes/index.ts` の配列か、プラグインの `routes` に追加します。追加のベースパスがなければ、`/api/example/ping` で応答します。この公開の例は業務データを読み取りません。

`defineApiRoutes()` は API の接頭辞の下にマウントします。`defineRootRoutes()` は、ほかのプロトコルの境界のためにアプリのルートにマウントします。サブパスでのデプロイではアプリのベースパスが付きます。プラグインで、ホストやデプロイの接頭辞をハードコードしないでください。

## リクエストごとのコンテキスト

Hono の Context は、`req.param()`、`req.query()`、ボディへのアクセス、レスポンスのメソッドを提供します。パスとクエリーの値は最初は文字列で、宣言した型が外部からの入力を検証するわけではありません。

サービスは、ファクトリーの `app` のコンテナから解決します。認証の組み込みは、それぞれの取り決めに従ってリクエストの身元を設定します。すべての Hono のリクエストに `user` フィールドがあるとは考えないでください。

## 認可と公開

認証とデータのポリシーは明示的に組み込みます。フロントエンドのメニューを隠しても、エンドポイントは保護されません。[`defineRepositoryApiRoutes()`](repository-routes.md) は、名前を付けたコレクションを、明示的な操作と完全なポリシーで公開できます。すべてのテーブルを公開したり、スキーマを作成したりはしません。宣言、登録、ポリシー、クライアントからの呼び出しについては [Repository のデータ API](repository-routes.md) を参照してください。

API のメソッドとパスが重複すると、起動時のチェックで失敗します。別々の依存関係のコピーによるメタデータのレジストリーの混在を避けるため、OpenAPI の記述は `@nocobase/app-server/router` の `describeRoute` などのヘルパーで登録します。

[検証とレスポンス](validation.md)、[API Client](api-client.md)、[プラグインのサーバー API](../../extension-development/server-apis.md) を参照してください。

## インターフェースと実装

- [ルートの宣言](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/routes.ts)
- [Repository のルート](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/README.md)
