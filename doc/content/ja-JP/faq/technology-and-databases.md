---
title: "NocoBase 3 のフロントエンド・バックエンドと対応データベースは何ですか？"
---

Core アプリのフロントエンドは React、サーバーは Node.js を使用し、HTTP ルーティングには Hono を利用します。既定の UI は shadcn/ui のコンポーネント規約に従います。アプリの既存コンポーネントや NocoBase UI Library を再利用し、テーマでスタイルを調整できます。[クライアントランタイム](../core/framework/runtime/client.md)、[サーバーランタイム](../core/framework/runtime/server.md)、[テーマとスタイル](../core/developing-apps/themes-and-styles.md)を参照してください。

データベースは対応ドライバーから選べます。SQLite、PostgreSQL、MySQL/MariaDB、SQL Server、Oracle に対応しています。Dameng、KingbaseES、OceanBase のドライバーには該当する商用ライセンスが必要で、互換モードや実験的機能としての制限があります。バージョン、ドライバー、条件は[データベースの対応状況と互換性](../core/reference/compatibility.md)で確認してください。

既定のテンプレートは SQLite を使用しますが、必須ではありません。アプリ作成時に別のドライバーをインストールして接続を設定できます。[異なるデータベースでアプリを作成する](../core/reference/database-configuration.md)を参照してください。接続や方言を変更しても既存データは移動しないため、[データ移行](backup-and-migration.md)は別途計画します。
