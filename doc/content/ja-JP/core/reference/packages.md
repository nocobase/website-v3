---
title: Core とツールのパッケージ一覧
description: NocoBase Core のランタイム、ライブラリー、データベースのダイアレクト、開発ツールを役割ごとに探します。
---

この一覧で、機能とそのパッケージ、公開のソースを対応付けます。すべてのアプリがインストールすべき依存関係の一覧ではありません。依存関係はアプリのマニフェストとロックファイルで決まります。プラグインと共通のインターフェースについては [プラグイン一覧](plugins.md) と [API リファレンス](api.md) を参照してください。

## この一覧の使い方

- アプリテンプレートにすでに組み込まれているランタイムとサービスを優先します。
- `src/` や `dist/` の下の非公開の依存ファイルではなく、パッケージのルートか、`package.json` で宣言された公開のサブパスをインポートします。
- サーバーのライブラリーはサーバーのコードにとどめ、クライアントのコードではブラウザー互換の入口を使います。
- プラグインは実行時の拡張を提供します。UI Registry は、利用側のプロジェクトにインストールされる編集可能なソースを提供します。それぞれの依存関係と更新は別々に管理します。

## アプリのランタイム

| パッケージ | 用途 |
| --- | --- |
| [`@nocobase/app-client`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client) | クライアントのアプリ、ルート、サービス、React の拡張 |
| [`@nocobase/app-server`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server) | サーバーのアプリ、HTTP、設定、リソースの組み込み |
| [`@nocobase/app-cli`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli) | アプリのコマンドと、開発・ビルドのツール |
| [`@nocobase/app-websocket`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-websocket) | WebSocket の取り決めと Node のサーバーのアダプター |

## コアライブラリー

| パッケージ | 用途 |
| --- | --- |
| [`@nocobase/api-client`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/api-client) | HTTP のリクエスト、ストリーミングのレスポンス、リモートの Repository |
| [`@nocobase/authorization`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/authorization) | 認可、権限セット、データ範囲 |
| [`@nocobase/caching`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching) | キャッシュのインターフェースとアダプター |
| [`@nocobase/config`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/config) | 設定の取得元、パーサー、マージ |
| [`@nocobase/db`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db) | データモデル、照会、マイグレーション、トランザクション、データベースの拡張 |
| [`@nocobase/drive`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/drive) | ファイルストレージとストレージのドライバー |
| [`@nocobase/i18n`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/i18n) | クライアントとサーバーの多言語化のランタイム |
| [`@nocobase/jobs`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/jobs) | バックグラウンドジョブと定期的なスケジュール |
| [`@nocobase/lifecycle`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/lifecycle) | レコードの状態、遷移、コミット後の影響 |
| [`@nocobase/logging`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/logging) | ログのインターフェース、形式、出力 |
| [`@nocobase/mailer`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/mailer) | SMTP、Resend などによるメールの配信 |
| [`@nocobase/queue`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/queue) | キュー、投入側、コンシューマー |
| [`@nocobase/realtime`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/realtime) | リアルタイムのメッセージ、クライアントの購読、サーバーのトピックの認可 |
| [`@nocobase/repository-input`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/repository-input) | ブラウザーとサーバーで共有する照会の入力の取り決めとビルダー |
| [`@nocobase/secrets`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/secrets) | バージョン付きのキーと機密データの暗号化 |
| [`@nocobase/service-provider`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/service-provider) | サービスコンテナ、トークン、依存性注入、ライフサイクル |
| [`@nocobase/session`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/session) | セッションとセッションの保存先 |
| [`@nocobase/snowflake`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/snowflake) | Snowflake の ID の生成 |
| [`@nocobase/document-extractor`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/document-extractor) | 分離したドキュメントのテキスト抽出 |
| [`@nocobase/markdown-mermaid`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/markdown-mermaid) | React Markdown での Mermaid の図 |

## データベースのダイアレクト

| パッケージ | 用途 |
| --- | --- |
| [`@nocobase/db-sqlite`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-sqlite) | SQLite |
| [`@nocobase/db-postgres`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-postgres) | PostgreSQL |
| [`@nocobase/db-mysql`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-mysql) | MySQL と MariaDB |
| [`@nocobase/db-mssql`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-mssql) | Microsoft SQL Server |
| [`@nocobase/db-oracle`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-oracle) | Oracle Database |

商用のダイアレクトには `@nocobase/db-dameng`、`@nocobase/db-kingbase`、`@nocobase/db-oceanbase` があります。接続のモードとバージョンの確認については [データベースの対応状況とバージョンの互換性](compatibility.md) を参照してください。

## エージェントとリモートコマンドのパッケージ

| パッケージ | 用途 |
| --- | --- |
| [`@nocobase/acp-bridge`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/acp-bridge) | ACP でローカルのコーディングエージェントを接続する |
| [`@nocobase/agent-protocol`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/agent-protocol) | アプリ、Runner、リモートの CLI の通信プロトコル |
| [`@nocobase/agent-runner`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/agent-runner) | アプリに接続し、エージェントの実行を引き受けて実行する |
| [`@nocobase/app-cli-client`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli-client) | アプリにサインインし、公開されたリモートの業務コマンドを呼び出す |
| [`@nocobase/cli-envelope`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/cli-envelope) | CLI の JSON 出力の取り決めと Node のバージョンのチェック |

## 開発とテストのツール

| パッケージ | 用途 |
| --- | --- |
| [`@nocobase/app-skills`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-skills) | アプリ開発、アップグレード、デプロイ、プラグイン開発のスキル |
| [`@nocobase/app-testing`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/app-testing) | アプリとプラグインのテストのヘルパー |
| [`@nocobase/db-testing`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-testing) | 分離したデータベースの環境と移植可能なテストのヘルパー |
| [`@nocobase/db-testkit`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-testkit) | データベースのダイアレクトで共有する統合テストの取り決め |
| [`@nocobase/dev-config`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/dev-config) | 共有の TypeScript、ESLint、Vitest、Vite などの設定 |
| [`@nocobase/create-app`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/create-app) | アプリのひな形の生成 |
| [`@nocobase/create-plugin`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/create-plugin) | プラグインのひな形の生成 |

## デプロイとホスティングのツール

| パッケージ | 用途 |
| --- | --- |
| [`@nocobase/app-installer`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/tools/app-installer) | デプロイのアーカイブからアプリをインストール、アップグレード、ロールバックする |
| [`@nocobase/app-host`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-host) | アプリのランタイムのホスティング |
| [`@nocobase/app-host-docker`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-host-docker) | App Host の Docker のホスティングのバックエンド |

## インストールとバージョン

依存関係の再現には、プロジェクトのロックファイルを使います。アップグレードでは、テンプレート、ランタイム、プラグインの peer 依存関係、データベースのダイアレクトをまとめて確認します。パッケージのバージョン番号はそれぞれ独立しており、メジャーバージョンで NocoBase 2 と 3 のどちらに属するかは決まりません。

アプリは `pnpm create @nocobase/app@beta` で、プラグインは `pnpm create @nocobase/plugin@beta` で作成します。その実装のパッケージは `@nocobase/create-app` と `@nocobase/create-plugin` です。アプリの中のコマンドについては [コマンドラインリファレンス](cli.md) を参照してください。

## 検証の範囲

パッケージの名前、場所、用途は、2026-10-27 に [Core のリビジョン `015404ecd0db`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages) と照合しました。ベータ版のバージョンは恒久的な互換性の基準ではありません。利用できるインターフェースは、インストールされた公開の入口と型の宣言で決まります。
