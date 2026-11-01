---
title: データベースの対応状況とバージョンの互換性
description: データベースのダイアレクト、接続の違い、実行時の要件と、アップグレード時に一緒に確認すべきバージョンを調べます。
---

このページでは、利用できるダイアレクトのパッケージ、ソースで設定されている統合テストの環境、アプリで実際に検証した組み合わせを区別します。テストの対象は、最小バージョンやサポート期間の完全な方針ではありません。

## 実行時とパッケージのバージョン

| 項目 | 確認すること |
| --- | --- |
| Node.js | 確認したテンプレートとランタイムは `>=24.0.0` を求めます。ビルド、依存関係のインストール、実行の環境をそろえてください |
| pnpm | アプリのマニフェストの `packageManager` を使います。検証したテンプレートは `pnpm@11.7.0` を宣言しています |
| アプリテンプレート | `package.json` の `nocobase.defaultTemplateVersion` を確認します |
| Core のパッケージ | インストールされたバージョン、ロックファイル、パッケージの `peerDependencies` を確認します |
| データベースのダイアレクト | `@nocobase/db`、Node、対象のプラットフォームとの互換性を確認します |
| プラグイン | Client、Server、CLI のエクスポート、依存関係の範囲、マイグレーションを確認します |

パッケージのバージョンはそれぞれ独立しています。検証したアプリは、NocoBase 3 で `app-client` `4.0.0-beta.3`、`app-server` `3.0.0-beta.3`、`app-cli` `1.0.0-beta.29` を一緒に使っています。パッケージのメジャーバージョンは、製品の世代を示すものではありません。

```bash
node --version
pnpm --version
pnpm list @nocobase/app-client @nocobase/app-server @nocobase/app-cli @nocobase/db --depth 0
```

## 公開のデータベースのダイアレクト

以下の統合テストの環境は、確認した Docker Compose の設定から来ています。ソースで定義されたテストの対象で、このドキュメントの確認では、これらの外部のデータベースのサービスでの再実行は行っていません。

| データベース | パッケージ / `dialect` | ドライバー | ソースの統合テストの環境または要件 |
| --- | --- | --- | --- |
| SQLite | `@nocobase/db-sqlite` / `sqlite` | `better-sqlite3` | 組み込みのデータベース。ネイティブのモジュールは Node、オペレーティングシステム、アーキテクチャと一致している必要がある |
| PostgreSQL | `@nocobase/db-postgres` / `postgres` | `pg` | PostgreSQL 16 |
| MySQL | `@nocobase/db-mysql` / `mysql` | `mysql2` | MySQL 8.4 |
| MariaDB | `@nocobase/db-mysql` / `mysql` | `mysql2` | MariaDB 10.11 |
| Microsoft SQL Server | `@nocobase/db-mssql` / `mssql` | `tedious` | SQL Server 2022 |
| Oracle Database | `@nocobase/db-oracle` / `oracle` | `oracledb` | Oracle Free 23 |

MySQL のダイアレクトの JSON のフィルターは `JSON_OVERLAPS` を使うため、MySQL 8.0.17 以降または MariaDB 10.9 以降が必要です。TEXT の既定値に使う式の構文は、MySQL 8.0.13 から使えます。これらは機能ごとの要件です。デプロイするバージョンを選ぶときは、アプリが使うほかの機能も確認してください。[MySQL のダイアレクトの注意事項](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db-mysql/README.md) を参照してください。

## 商用のデータベースのダイアレクト

| データベース | パッケージ / `dialect` | 接続のモードと確認すること |
| --- | --- | --- |
| Dameng | `@nocobase/db-dameng` / `dameng` | `knex-dm` と `dmdb` を使います。確認した注意事項では、対象のサーバーに対する統合の取り決めの検証が済むまで、実験的なものとされています |
| KingbaseES | `@nocobase/db-kingbase` / `kingbase` | PostgreSQL 互換モード、`DB_MODE=pg` |
| OceanBase | `@nocobase/db-oceanbase` / `oceanbase` | OceanBase CE の MySQL 互換のテナント |

商用のパッケージは、該当するライセンスのもとで Pro のレジストリーから入手します。互換モードは接続の前提条件で、独自の動作がすべて PostgreSQL や MySQL と一致することを保証するものではありません。OceanBase の TEXT の既定値は、レコードの作成時に Repository が補います。直接の SQL の挿入では値を指定する必要があります。

## アプリの接続の設定

既定のアプリのデータベースの設定は、インストールされた公式のダイアレクトを必要に応じて読み込みます。接続を設定する前に、選んだダイアレクトを本番の依存関係に追加してください。単独で `@nocobase/db` を使う場合は、ドライバーのファクトリーかドライバーのレジストリーを明示的に渡します。

新しい、まだ設定していない PostgreSQL のアプリの場合：

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres
pnpm nocobase config set database.connections.main.host=127.0.0.1 database.connections.main.database=my_app database.connections.main.username=my_app
pnpm nocobase config set --from-env database.connections.main.password=MAIN_DB_PASSWORD
pnpm nocobase config check
```

先に、環境の管理の仕組みで `MAIN_DB_PASSWORD` を設定してください。既存の接続を変更するときは、ほかの設定、キー、データを保ってください。`dialect` を変えても、業務データが別のデータベースに移行されることはありません。

| 違い | 意味 |
| --- | --- |
| SQLite | `filename` を使います。既定のテンプレートは、データベースのファイルをアプリの `storage/` の下に解決します |
| ユーザー名 | 高レベルの接続の設定では、各ドライバーのネイティブの `user` フィールドではなく `username` を使います |
| Oracle | `serviceName` を使います。通常のデータベース名だけでは不十分です |
| PostgreSQL | 必要に応じて `schema` と `ssl` を設定します |
| SQL Server | デプロイの証明書に応じて `encrypt` と `trustServerCertificate` を設定します |
| 複数の接続 | `database.default` が既定を選び、リソースは `database/<connection>/` を使います |
| 外部のデータベース | `schemaManagement: external` はフレームワークによるスキーマの変更を制限します。データアクセスは、引き続きアカウントの権限と認可のポリシーに依存します |

## アップグレードとクロスプラットフォームのビルド

1. ロックファイル、実行時の設定、復元可能なデータのバックアップを保持します。
2. [NocoBase Core をアップグレードする](../developing-apps/upgrade-nocobase-core.md) に従い、テンプレートの変更をマージし、依存関係と peer の範囲を確認します。
3. 分離した環境で、マイグレーション、照会、トランザクション、権限、プラグインの動作を検証します。
4. ネイティブの依存関係をオペレーティングシステムやアーキテクチャをまたいでコピーするのではなく、対象のプラットフォーム向けにビルドし直します。
5. コードのロールバックとデータベースの復旧は、別々に検証します。プログラムのコードを戻しても、コミット済みのスキーマの変更は自動では元に戻りません。

`--target` と `--node-version` については [コマンドラインリファレンス](cli.md) を、本番のデプロイについては [デプロイ方法を選ぶ](../deployment/choose-a-deployment-method.md) を参照してください。

## 検証の範囲

2026-10-27 に確認しました。公開のダイアレクトとテンプレートは [Core `015404ecd0db`](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/libs) と、商用のダイアレクトの注意事項はそのソースのリビジョン `138665ffaaaa` と照合しています。実行したコマンドのチェックでは、既定のテンプレート beta.83、Node 24.21.0、pnpm 11.7.0、`@nocobase/db` 1.0.0-beta.22、SQLite のダイアレクト 0.1.0-beta.6 を使いました。
