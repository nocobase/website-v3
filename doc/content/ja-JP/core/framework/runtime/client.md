---
title: クライアントのランタイム
---

クライアントのランタイムは、設定、サービス、プラグイン、ルート、React の拡張を組み合わせて、ブラウザーのアプリにします。アプリとプラグインは同じランタイムに提供内容を加え、最終的なレイアウトとコンポーネントはアプリが決めます。

## 組み立てとレンダリング

```text
client/runtime.ts
  → resolveAppRuntime()
  → ClientApplication
  → app.start()
  → AppClientRoot
  → React Providers + routes
```

`client/runtime.ts` は、アプリの提供内容と `client/plugins.ts` のプラグインを集めます。`resolveAppRuntime()` は宣言と公開の HTML の設定を解決します。`ClientApplication` は、設定、そのサービスコンテナ、ライフサイクルを所有します。ホストは、`app.start()` が成功したあとに `AppClientRoot` をレンダリングします。

起動時に必要な宣言は静的にインポートします。ページのコンポーネント、大きな SDK、ロケールのメッセージは遅延読み込みします。宣言のモジュールは、インポート時に接続を開いたり DOM にアクセスしたりすべきではありません。

## アプリのリソース

| リソース | 役割 |
| --- | --- |
| `app.config` | マージされた公開のブラウザーの設定 |
| `app.services` / `app.container` | アプリのサービスの解決と登録 |
| `apiClientToken` | HTTP クライアント |
| `realtimeClientToken` | リアルタイムの接続とトピックの購読 |
| ルートの宣言 | パス、ローダー、認証、アクセスの制約 |
| `reactProviders` | ページのツリーを包むコンテキスト |

これらのリソースは、1 つのブラウザーのアプリのインスタンスに属します。ほかのウィンドウ、サーバー、アプリは、それぞれ独立したコンテナを持ちます。

## 拡張ポイント

ページは `client/routes.ts` で、サービスはクライアントの ServiceProvider で、ツリーのコンテキストは React の Provider の宣言で追加します。テンプレートがすでにこれらの集約のファイルをランタイムに接続している場合は、起動の処理を作り直すのではなく、該当するファイルを更新します。

`AppClientRoot` はブラウザーのルーターを提供します。独自のルーターが必要なテストでは、`AppClientProviders` を包むか、`@nocobase/app-testing/client` のレンダリングのツールを使います。BrowserRouter のネストは避けてください。

## 状態と破棄

サービスの値を変えても、React は自動では再レンダリングされません。状態、Context、購読を使ってください。破棄の際、ホストは React のルートをアンマウントし、`app.shutdown()` を呼び出して Provider が所有するリソースを解放します。

続けて [クライアントのサービス](../services/integration.md#クライアントのサービス)、[React の Provider](react-providers.md)、[ページ、ルート、ナビゲーション](../../developing-apps/pages-routes-and-navigation.md) を読んでください。

## インターフェースと実装

- [クライアントのランタイム](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [既定のランタイムの宣言](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/templates/app-template-default/client/runtime.ts)
