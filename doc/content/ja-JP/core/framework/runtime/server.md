---
title: サーバーのランタイム
---

サーバーのランタイムは、設定、リソースのパス、サービスのライフサイクル、HTTP/WebSocket の組み込みを担います。業務のアプリと待ち受けるホストを分けることで、同じアプリを単独のサーバー、コマンド、テストで動かせます。

## ランタイムとアプリ

```text
server/runtime.ts + server/config/
  → resolved runtime
  → createApp(runtime)
  → Application + ServiceProviders
  → app.start()
  → HTTP / WebSocket host
```

`server/runtime.ts` は、設定の読み込み、プラグイン、ServiceProvider、ルート、ロケールを宣言します。`server/app.ts` の `createApp(runtime)` が、アプリとフレームワークのサービスを組み立てます。`Application` は、`config`、`paths`、`container`、リクエストの処理を所有します。

`app.start()` は内部の起動を完了させます。ネットワークのリスナーを開くのはホストなので、Provider の `ready()` はポートに到達できることを意味しません。テストでは、リスナーなしにアプリの `fetch` の境界でリクエストを送れます。

## 業務の機能を登録する

| 提供内容 | 入口 |
| --- | --- |
| 設定のセクション | `server/config/` とその集約の入口 |
| 業務サービス | `server/providers/` またはプラグインの `serviceProviders` |
| HTTP のエンドポイント | アプリのルートの配列またはプラグインの `routes` |
| データベースのリソース | `database/<connection>/` またはプラグインの宣言 |
| プラグイン | `server/plugins.ts` |

既存のデータベース、ログ、ジョブのサービスは、ホストのコンテナから解決します。プラグインは、別のアプリのコンテナを作成したり、ホストのサービスを重複させたりすべきではありません。接続、状態、破棄の所有が分裂してしまいます。

## リクエストと共有の状態

コンテナは通常プロセスと同じ寿命を持ち、身元と入力はリクエストごとに属します。現在のユーザーをシングルトンのフィールドに保存しないでください。身元はルートの境界で検証し、必要な入力をサービスに渡し、トランザクションの接続は明示的に渡します。

作業ディレクトリを仮定するのではなく、`app.paths` を使います。アップロードされたファイルと SQLite のデータベースには、置き換えられるビルドの出力の外にある、永続的な場所が必要です。

## 失敗と終了

リソースは、非同期のライフサイクルのフックで作成、確認、解放します。後片付けは、初期化が途中までの場合にも耐え、所有するリソースだけを閉じる必要があります。ホストの起動の方針、ヘルスチェック、プロセスの監視でも、内部の準備状態を考慮すべきです。

続けて [ライフサイクル](lifecycle.md)、[サーバーのサービス](../services/integration.md#サーバーのサービス)、[デプロイ方法](../../deployment/choose-a-deployment-method.md) を読んでください。

## インターフェースと実装

- [Application](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/application/index.ts)
- [サーバーのランタイムの宣言](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/templates/app-template-default/server/runtime.ts)
