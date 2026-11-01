---
title: フレームワークの概要
---

この章では、アプリとプラグインが共有する仕組みと、主要な `@nocobase/*` パッケージの役割、使い方、実行時の境界を説明します。実装の流れは [アプリ開発](../developing-apps/overview.md) または [プラグイン開発](../extension-development/when-to-write-a-plugin.md) から始め、基盤の仕組みを知りたいときにここに戻ってきてください。

## ランタイムと共通の仕組み

アプリは、クライアント、サーバー、CLI のランタイムを組み立てます。プラグインは公開の入口を通じて機能を提供します。どちらも同じサービスの取り決めを使い、登録する場所が異なります。

| 疑問 | 読むページ |
| --- | --- |
| アプリはどう起動し、プラグインはどう参加するのか | [クライアントのランタイム](runtime/client.md)、[サーバーのランタイム](runtime/server.md)、[CLI ランタイム](runtime/cli.md)、[プラグインの読み込み](runtime/plugins.md)、[起動とライフサイクル](runtime/lifecycle.md) |
| 業務サービスはどう登録、共有、解放されるのか | [サービスコンテナ](services/container.md)、[取り決めとトークン](services/tokens.md)、[ServiceProvider](../extension-development/service-provider.md)、[クライアントとサーバーの組み込み](services/integration.md) |
| React のコンテキストはどうページのツリーに加わるのか | [React の Provider](runtime/react-providers.md) |
| HTTP の API はどう宣言され、呼び出されるのか | [ルートとリクエストのコンテキスト](http/routes.md)、[ミドルウェア](http/middleware.md)、[検証とレスポンス](http/validation.md)、[Repository の API](http/repository-routes.md)、[API Client](http/api-client.md) |

コンテナと依存性注入は両側に適用されます。ブラウザーとサーバーは、それぞれ別のコンテナ、インスタンス、ライフサイクルを持ちます。トークンの定義を共有しても、メモリ上のオブジェクトが両者で共有されるわけではありません。ランタイムをまたぐ呼び出しには、引き続き API を使います。

## 主要なパッケージ

メニューのトピックは機能ごとに分かれています。それぞれパッケージの仕組みと、ホストへの組み込みを説明します。この章で主に扱うのは次のパッケージです。

| パッケージ | 役割 | 読むページ |
| --- | --- | --- |
| `@nocobase/service-provider` | コンテナ、トークン、依存性注入、Provider のライフサイクル | [サービスコンテナ](services/container.md) |
| `@nocobase/db` | 接続、モデル、照会、トランザクション、スキーマの進化 | [データベース](database/overview.md) |
| `@nocobase/caching` | 名前空間付きのキャッシュ、カウンター、ブルームフィルター | [キャッシュ](support/caching.md) |
| `@nocobase/drive` | ファイルの操作とストレージのドライバー | [ファイルストレージとドライバー](file-storage.md) |
| `@nocobase/jobs` | バックグラウンドでの実行と定期的なスケジュール | [バックグラウンドジョブ](background/jobs.md)、[スケジュール](background/scheduling.md) |
| `@nocobase/queue` | メッセージの生成、消費、配信の制御 | [メッセージキュー](background/queues.md) |
| `@nocobase/realtime` | リアルタイムのトピック、公開、購読 | [リアルタイム通信](realtime/topics.md) |
| `@nocobase/logging` | 構造化ログ、出力先、ローテーション | [ログ](support/logging.md) |
| `@nocobase/snowflake` | 時刻、ワーカー、シーケンスに基づく ID | [ID の生成](support/ids.md) |

データベースには独自の章があります。接続とダイアレクト、モデリング、読み書き、リレーション、トランザクション、マイグレーションとシードです。アプリのファイルについては [テーブルと初期データ](../developing-apps/data-models-and-migrations.md) を、プラグインのリソースの宣言については [データベースのリソースとマイグレーション](../extension-development/database-and-migrations.md) を参照してください。

## アプリとプラグインでパッケージを使う

基本のパッケージが機能を定義し、アプリのランタイムが設定とインスタンスをホストに組み込みます。サーバーのサービスの多くは、公開のトークンで `app.container` から解決します。データベースのトークンは `@nocobase/db` から、キャッシュ、ストレージ、ジョブなどのホストのトークンは、対応する `@nocobase/app-server/*` の入口から取得します。

アプリとプラグインは、ホストのインスタンスを再利用すべきです。業務サービスはコンストラクターで依存関係を受け取り、Provider がそれを解決して組み立てられます。プラグインは自分が登録したエグゼキューター、購読、トピックを管理し、データベースの接続やキューのサービスなどの共有のインスタンスはホストが閉じます。リソースの所有者は各ガイドで説明しています。登録の場所については [クライアントとサーバーの組み込み](services/integration.md) を参照してください。

単独のスクリプトやテストでは、独自のインスタンスを作成し、その設定、起動、後片付けを自分で担うことがあります。「単独」と書かれた例はそのライフサイクルを示すものです。リクエストごとに作成しないでください。

## プラグインの機能との関係

ストレージのパッケージはディスクとファイルの操作を提供し、ファイルプラグインがレコード、アップロード、認可されたアクセスを加えます。Jobs は実行とスケジュールを提供し、定期タスクプラグインが管理ページと実行記録を加えます。Realtime は変更を届け、通知のプラグインは永続的な通知と個人の受信トレイを提供できます。

既存の機能を組み込むには [プラグインを使う](../using-plugins/overview.md) を読みます。より低レベルの動作を実装するには、この章を使います。公開の入口とパラメーターの索引は [API リファレンス](../reference/api.md) にあります。
