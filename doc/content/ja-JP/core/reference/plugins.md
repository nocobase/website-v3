---
title: プラグイン一覧
description: NocoBase 3 のプラグイン、その用途、組み込みかどうか。
---

この一覧は、確認したソースにあるアプリのプラグインを対象にしています。メインリポジトリに 24 個、商用リポジトリに 2 個あります。パッケージ名のアルファベット順に並べ、ソースが公開されているものにはリンクを付けています。

「組み込みプラグイン」は、アプリの作成時に既定のテンプレートがそのプラグインを含むかどうかを示します。含まれるものは「はい」、別途インストールが必要なものは「いいえ」です。プラグインが有効かどうかは、アプリのプラグインの登録ファイルで確認してください。登録、削除、更新については [プラグインを管理する](../developing-apps/manage-plugins.md) を参照してください。

## メインリポジトリのプラグイン

| パッケージ | 用途 | 組み込みプラグイン |
| --- | --- | --- |
| [`@nocobase/app-plugin-agent-sessions`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-agent-sessions) | ローカルのコーディングエージェントを接続し、ブラウザーでの会話、記録、作業の成果物を管理します。 | いいえ |
| [`@nocobase/app-plugin-agents`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-agents) | モデルの API を設定するか、マシン上のエージェントを接続して、会話、ツールの呼び出し、タスクの実行に使います。 | はい |
| [`@nocobase/app-plugin-api-keys`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-api-keys) | API キーで API のリクエストを認証します。 | はい |
| [`@nocobase/app-plugin-authentication`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authentication) | サインイン、セッション、認証の組み込みを提供します。 | はい |
| [`@nocobase/app-plugin-authorization`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authorization) | 業務の権限を宣言し、アクセスの判定を適用し、権限管理の UI を提供します。 | はい |
| [`@nocobase/app-plugin-authz-default-access`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-default-access) | 業務のリソースに既定のデータアクセスの範囲を設定します。 | はい |
| [`@nocobase/app-plugin-authz-restriction-rules`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-restriction-rules) | データアクセスをさらに制限するルールを適用します。 | はい |
| [`@nocobase/app-plugin-authz-sharing-rules`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-authz-sharing-rules) | ルールによってレコードの共有を広げます。 | はい |
| [`@nocobase/app-plugin-database-explorer`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-database-explorer) | 読み取り専用のブラウザーで、データベースの接続、コレクション、フィールドを確認します。 | はい |
| [`@nocobase/app-plugin-demo-mode`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-demo-mode) | 繰り返し使えるデモのデータセット、訪問者のアカウント、書き込みの保護を提供します。 | いいえ |
| [`@nocobase/app-plugin-file`](https://github.com/nocobase/nocobase/tree/d9a625d93b4098c7e2cc664ed01f187178e145d4/packages/plugins/app-plugin-file) | ファイルの Repository、アップロードとコンテンツの API を提供します。編集可能なファイルの UI は NocoBase UI Library から提供されます。 | はい |
| [`@nocobase/app-plugin-foundation`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-foundation) | アプリが使う Core の機能と、その実行時の根拠を表示します。 | はい |
| [`@nocobase/app-plugin-i18n`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-i18n) | 多言語化とアプリの言語の切り替えを組み込みます。 | はい |
| [`@nocobase/app-plugin-knowledge`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-knowledge) | Markdown のスペース、バージョン、検索、提案、レビューを管理します。 | はい |
| [`@nocobase/app-plugin-mail`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-mail) | メールの送信、再開可能なメールボックスの同期、プロバイダーの拡張を提供します。 | はい |
| [`@nocobase/app-plugin-notification`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification) | 通知の保存、配信のランタイム、ログを提供します。 | はい |
| [`@nocobase/app-plugin-notification-in-app`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-in-app) | アプリ内通知のチャネル、認証付きの受信箱の API、クライアントの機能を提供します。 | はい |
| [`@nocobase/app-plugin-notification-providers`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-providers) | 組み込みの通知のチャネルとプロバイダーを提供します。 | はい |
| [`@nocobase/app-plugin-notification-web-push`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-notification-web-push) | ブラウザーのプッシュの購読を管理し、Web Push の通知を配信します。 | いいえ |
| [`@nocobase/app-plugin-projects`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-projects) | プロジェクト、タスク、開発の協働を管理します。 | いいえ |
| [`@nocobase/app-plugin-releases`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-releases) | アプリ、リリース、環境、差し替え可能なデプロイのドライバーを管理します。 | いいえ |
| [`@nocobase/app-plugin-scheduler`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-scheduler) | コードでスケジュールを宣言し、実行の記録と有効化・無効化の API を提供します。 | はい |
| [`@nocobase/app-plugin-template-print`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-template-print) | DOCX と PDF のテンプレート印刷を実装するためのエージェントのスキルを提供します。 | はい |
| [`@nocobase/app-plugin-users`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins/app-plugin-users) | ユーザー管理の API とページを提供します。 | はい |

`app-plugin-template-print` は現在、Client、Server、CLI の実行時の入口を持たずにスキルだけを配布しているため、プラグインの登録の配列には入れません。`agents` と `knowledge` は既定のテンプレートの依存関係ですが、既定では登録されていません。

## 商用リポジトリのプラグイン

これらの商用プラグインは既定のテンプレートに含まれません。利用には該当するライセンスが適用されます。

| パッケージ | 用途 |
| --- | --- |
| `@nocobase/app-plugin-approval` | 人による承認のタスクを、ポリシーと結果とともにレコードのライフサイクルに結び付けます。 |
| `@nocobase/app-plugin-task-center` | 複数の業務のソースから個人のタスクを集約し、照会の API と再利用できる UI を提供します。 |

## データベースのダイアレクト

ダイアレクトはデータベースのアダプターで、アプリのプラグインとは組み込み方が異なります。接続のモード、テストのバージョン、設定の違いについては [データベースの対応状況とバージョンの互換性](compatibility.md) を、そのほかのフレームワークのライブラリーとツールについては [Core とツールのパッケージ一覧](packages.md) を参照してください。

`@nocobase/db` は、次の 8 つのダイアレクトのパッケージでデータベースの組み込みに対応しています。メインリポジトリに 5 つ、商用リポジトリに 3 つあります。ソースが公開されているパッケージ名にはリンクを付けています。

| ダイアレクトのパッケージ | データベース | リポジトリ |
| --- | --- | --- |
| `@nocobase/db-dameng` | Dameng (DM) | 商用 |
| `@nocobase/db-kingbase` | KingbaseES（PostgreSQL 互換モード） | 商用 |
| [`@nocobase/db-mssql`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-mssql) | Microsoft SQL Server | メイン |
| [`@nocobase/db-mysql`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-mysql) | MySQL | メイン |
| `@nocobase/db-oceanbase` | OceanBase CE（MySQL 互換のテナント） | 商用 |
| [`@nocobase/db-oracle`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-oracle) | Oracle Database | メイン |
| [`@nocobase/db-postgres`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-postgres) | PostgreSQL | メイン |
| [`@nocobase/db-sqlite`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/libs/db-sqlite) | SQLite | メイン |

商用のダイアレクトのパッケージは Pro のレジストリーから配布され、ソースへのアクセスと利用は該当する権利によります。確認したリビジョンでは、`db-dameng` は実験的とされており、選んだ Dameng のサーバーのバージョンに対する統合の取り決めの検証がまだ必要です。

## ソースの基準

2026-10-25 に [nocobase `db419f1d4`](https://github.com/nocobase/nocobase/tree/db419f1d4828a88236860f2e69a9442e2f2c5f9c/packages/plugins) と商用プラグインのソースで確認しました。既定のテンプレートに含まれるかどうかは、同じメインリポジトリのリビジョンに基づきます。リリース版では、プラグインの提供状況と登録が異なることがあります。

ファイルの UI の提供元は、ソースのコミット [`d9a625d93b40`](https://github.com/nocobase/nocobase/tree/d9a625d93b4098c7e2cc664ed01f187178e145d4) でも確認しました。そのほかの一覧と既定のテンプレートの状況は、上記の基準のままです。
