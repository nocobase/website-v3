---
title: ミドルウェア
---

ミドルウェアは、身元の解析、制限、レスポンスのヘッダーなど、リクエストに横断的にかかわる動作を扱います。業務の流れはサービスに置いたまま、明示的なパスと順序で登録します。

## 宣言と組み込み

```ts
import { defineHttpMiddleware } from '@nocobase/app-server/router';

export const responseHeaders = defineHttpMiddleware({
  name: 'example.response-headers',
  register(router) {
    router.use('/api/*', async (context, next) => {
      await next();
      context.header('X-Content-Type-Options', 'nosniff');
    });
  },
});
```

アプリの組み立て時、起動とルートの登録の前に `app.addHttpMiddleware(responseHeaders)` を呼び出します。プラグインは、提供内容をまだ変更できる段階でミドルウェアを提供できます。

登録のコールバックはアプリのルートの Router を受け取るため、`/api/*` はアプリからの相対パスです。外部のベースパスはホストが合わせます。ルートのモジュール内で完結するロジックには、そのモジュールの Hono の Router で `use()` を使えます。

## 実行順序

`await next()` より前のコードは行きで、そのあとのコードは下流の処理のあとに実行されます。リクエストを拒否するには、次のハンドラーを呼び出さずに、レスポンスを返すか API エラーを投げます。

身元に依存する認可の前に、身元を確定させる必要があります。特にストリーミングのアップロードでは、リクエストのボディを 2 回消費しないでください。解析した値は、明示的なコンテキストの取り決めで共有します。

## 制限と失敗

一般的なボディの上限、タイムアウト、レート制限には `api` の設定を使います。プロセスごとの制限はデプロイ全体のカウンターではなく、プロキシの背後のクライアントのアドレスは実際のホスティングに依存します。

未知の失敗を成功のレスポンスで包まないでください。リクエストの識別子、所要時間、結果はログに記録しますが、Cookie、認可のヘッダー、機密のボディは記録しないでください。

パスの照合、途中での拒否、エラー、ミドルウェアの順序をテストします。[検証](validation.md) と [設定リファレンス](../../reference/configuration.md) を参照してください。

## インターフェースと実装

- [ミドルウェアの宣言](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/routes.ts)
- [ルーティングのライフサイクル](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [API の制限](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/api-limits.ts)
