---
title: データベースの対応状況とバージョンの互換性
description: 対応データベース、ドライバーのインストールと接続設定、データベースのバージョン要件、実行環境とアップグレードの条件を確認します。
---

## 対応データベース

NocoBase は 8 種類のデータベースダイアレクトを提供しています。ダイアレクトは接続設定の `dialect` に指定する値で、使用するデータベースドライバーを選びます。MariaDB は MySQL と同じ `mysql` ダイアレクトを使います。

### オープンソースのデータベースドライバー

| データベース | ドライバーパッケージ | `dialect` |
| --- | --- | --- |
| SQLite | `@nocobase/db-sqlite` | `sqlite` |
| PostgreSQL | `@nocobase/db-postgres` | `postgres` |
| MySQL、MariaDB | `@nocobase/db-mysql` | `mysql` |
| Microsoft SQL Server | `@nocobase/db-mssql` | `mssql` |
| Oracle Database | `@nocobase/db-oracle` | `oracle` |

既定のアプリテンプレートは SQLite を使うため、ローカル開発ではデータベースサーバーを別途用意する必要がありません。他のデータベースを使う場合は、接続可能なサーバー、データベース、アカウントを準備し、対応するドライバーをインストールしてください。

### 商用データベースドライバー

| データベース | ドライバーパッケージ | `dialect` | 使用条件 |
| --- | --- | --- | --- |
| Dameng | `@nocobase/db-dameng` | `dameng` | ドライバーは実験段階です。使用前に対象のデータベースバージョンで検証してください |
| KingbaseES | `@nocobase/db-kingbase` | `kingbase` | PostgreSQL 互換モード、`DB_MODE=pg` |
| OceanBase CE | `@nocobase/db-oceanbase` | `oceanbase` | MySQL 互換テナント |

この 3 つのドライバーは NocoBase Pro の商用パッケージで、該当するライセンスが必要です。ライセンス提供元から非公開レジストリーの URL、アカウント情報、ダウンロード権限を持つ読み取り用トークン（`nbr_…`）を取得してください。以下の `<registry-url>` を提供された URL に置き換えてコマンドを実行し、パスワードの入力時にトークンを指定します。

```bash
pnpm login --registry="<registry-url>" --scope=@nocobase
```

このコマンドはユーザーレベルの設定で `@nocobase` スコープを Pro レジストリーに割り当てます。このレジストリーは公開 NocoBase パッケージもプロキシし、その他の依存関係は既存のレジストリーを使います。トークンをドキュメントやコマンドライン引数に記載したり、Git にコミットしたりしないでください。

## アプリのデータベースを設定する

各データベースの接続設定例は[異なるデータベースでアプリを作成する](../getting-started/create-app-with-database.md)を参照してください。ローカル、別のサーバー、クラウドデータベースの接続情報を使えます。

### ドライバーのインストールと設定の初期化

[アプリを作成する](../getting-started/create-app.md)で生成したプロジェクトディレクトリで操作します。以下は、まだ `config.yml` がない PostgreSQL アプリの例です。接続可能な PostgreSQL サーバー、データベース、アカウントを準備してから実行してください。

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres --json
```

コマンドはデータベースに接続せず、`config.yml` とアプリのシークレットを生成します。接続前に、実際のホスト、ポート、データベース名、ユーザー名、パスワード、必要な TLS 設定を入力してください。各データベースの例は[異なるデータベースでアプリを作成する](../getting-started/create-app-with-database.md)を参照してください。他のデータベースでは、パッケージ名と `--dialect` を対応する値に置き換えます。`config init` はドライバーのインストールや、データベースサーバー・アカウントの作成は行いません。

`config.yml` にはパスワードやシークレットが含まれる場合があるため、Git に入れないでください。[設定コマンド](cli.md)で接続パラメーターを指定することもできます。

設定後に接続を確認します。

```bash
pnpm nocobase config check
```

確認に成功すると、ターミナルにデータベースへの接続成功が表示されます。問題があれば、該当する設定項目と修正案が表示されます。既定では SQLite 以外のデータベースに接続します。SQLite も接続確認する場合は `--connect`、接続せず設定のみを確認する場合は `--no-connect` を付けてください。このコマンドはマイグレーションを実行しません。

すでに `config.yml` がある場合は、既存のシークレットを保持したまま必要な接続設定を変更してください。`dialect` を変更しても、既存のデータは他のデータベースに移行されません。

### データベースごとの接続パラメーター

接続は `database.connections.<name>` に設定します。`database.default` で既定の接続を選び、既定のテンプレートでは `main` を使います。ネットワーク接続の共通フィールドは `host`、`port`、`database`、`username`、`password` です。データベースに応じて次のフィールドを調整してください。

| データベース | 設定の要点 |
| --- | --- |
| SQLite | 生成された設定は `database` でファイルを指定します。`filename` や `DB_FILENAME` を使う場合は `database` を削除し、`DB_DATABASE` による上書きも確認してください。残っている場合は `database` が優先されます。相対パスはアプリの `storage/` を基準に解決されます |
| PostgreSQL、KingbaseES | 必要に応じて `schema` と `ssl` を設定します |
| MySQL、MariaDB、OceanBase | `database` でデータベース名、`username` でユーザーを指定します |
| Microsoft SQL Server | サーバーの証明書設定に合わせて `encrypt` と `trustServerCertificate` を設定します |
| Oracle | `serviceName` でサービスを指定します |
| Dameng | `schema` でスキーマを指定します。初期化では `database` フィールドは生成されません |

環境変数はファイル内の接続設定を上書きする場合があります。優先順位は[設定リファレンス](configuration.md)を参照してください。接続の追加は[複数のデータベース接続](../developing-apps/multiple-databases.md)、既存の業務データベースへの接続とフレームワークによるテーブル構造の変更制限は[既存のデータベースに接続する](../developing-apps/existing-databases.md)を参照してください。

## データベースのバージョンと機能の制限

以下は、ドライバーの統合テストで対象として設定されているバージョンです。対応バージョンの全範囲や最小バージョンを示すものではありません。

| データベース | 統合テストの対象バージョン |
| --- | --- |
| PostgreSQL | 16 |
| MySQL | 8.4 |
| MariaDB | 10.11 |
| Microsoft SQL Server | 2022 |
| Oracle Database | Oracle Free 23 |

デプロイ先のバージョンは、アプリが使う機能の要件も満たす必要があります。

- **MySQL、MariaDB**：JSON フィルターは `JSON_OVERLAPS` を使うため、MySQL 8.0.17 以降または MariaDB 10.9 以降が必要です。TEXT フィールドの既定値に使う式の構文には、MySQL 8.0.13 以降または MariaDB 10.2.1 以降が必要です。[MySQL ドライバーの説明](https://github.com/nocobase/nocobase/blob/09646a97a60ce0758b3635454cb483cb3f1a57c3/packages/libs/db-mysql/README.md)を参照してください。
- **OceanBase**：TEXT フィールドの既定値は、レコード作成時に Repository が補います。SQL で直接挿入する場合は、そのフィールドの値を指定してください。
- **SQLite**：ネイティブモジュールは Node.js のバージョン、OS、CPU アーキテクチャと一致している必要があります。

KingbaseES と OceanBase では、[対応データベース](#対応データベース)に記載した互換モードが必要です。対象のデータベースでアプリのクエリー、マイグレーション、トランザクションを検証してください。

## 実行環境とパッケージのバージョン

| 項目 | 要件と確認方法 |
| --- | --- |
| Node.js | 24 以降 |
| pnpm | アプリの `package.json` の `packageManager` に指定されたバージョンを使います |
| アプリテンプレート | `package.json` の `nocobase.defaultTemplateVersion` を確認します |
| Core、データベースドライバー、プラグイン | 各パッケージの依存バージョン範囲と `peerDependencies` に合うバージョンをインストールし、ロックファイルを保持します |

NocoBase の各パッケージは独立したバージョン番号を持ちます。パッケージのメジャーバージョンは、NocoBase 製品のバージョンを表すものではありません。現在の環境とインストール済みパッケージは次のコマンドで確認できます。

```bash
node --version
pnpm --version
pnpm list @nocobase/app-client @nocobase/app-server @nocobase/app-cli @nocobase/db --depth 0
```

## アップグレードとクロスプラットフォームのデプロイ

アップグレード前にデータベース、実行時の設定、シークレットをバックアップし、ロックファイルを保持してください。[NocoBase Core をアップグレードする](../developing-apps/upgrade-nocobase-core.md)に従ってテンプレートと依存関係を更新し、独立した環境でマイグレーション、クエリー、トランザクション、権限を検証します。コードを戻してもデータベース構造の変更は元に戻らないため、データの復旧手順も準備してください。

異なる OS や CPU アーキテクチャにデプロイする場合は、ローカルのネイティブ依存関係をコピーせず、対象のプラットフォーム向けにビルドし直してください。データベースドライバーはアプリの本番依存関係に追加し、追加後にデプロイ用パッケージを再ビルドします。ビルドオプションは[コマンドラインリファレンス](cli.md)、デプロイ手順は[デプロイ方法を選ぶ](../deployment/choose-a-deployment-method.md)を参照してください。
