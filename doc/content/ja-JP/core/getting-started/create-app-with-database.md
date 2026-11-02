---
title: 異なるデータベースでアプリを作成する
metaDescription: 既存の接続情報を使って NocoBase アプリを作成し、SQLite、PostgreSQL、MySQL、SQL Server、Oracle、商用データベースドライバーを設定します。
---

## データベースの接続情報を準備する

データベースサーバーはローカル、別のサーバー、クラウドのいずれでも利用できます。Docker は必須ではありません。新しいアプリ専用の空のデータベースまたはスキーマを準備してください。アカウントには接続、データの読み書きに加え、アプリが使う範囲内でテーブルやインデックスなどを作成・変更する権限が必要です。ネットワーク経由のデータベースでは、アプリを実行するマシンからのアクセスを許可してください。

データベース管理者またはクラウドサービスから、以下の情報を取得します。

| 情報 | 用途 |
| --- | --- |
| ホストとポート | データベースの接続先。クラウドでは提供されたエンドポイントとポートを使います |
| データベース名、スキーマ、サービス名 | アプリのデータの保存先。指定するフィールドはデータベースによって異なります |
| ユーザー名とパスワード | アプリ用に割り当てられたアカウント |
| TLS の要件 | 暗号化の要否と、専用 CA 証明書の要否 |

SQLite はローカルファイルを使うため、ホスト、ポート、アカウントは不要です。対応バージョン、機能の制限、商用ドライバーのライセンスは[データベースの対応状況とバージョンの互換性](../reference/compatibility.md)を参照してください。

ここでは新しいアプリのメインデータベースを設定します。起動時にはアプリが必要とするテーブルが初期化されます。既存の業務テーブルを読み込む場合は[既存のデータベースに接続する](../developing-apps/existing-databases.md)を参照してください。接続情報を変更するだけでは、他のデータベースにあるアプリのデータは移行されません。

## アプリのプロジェクトを作成する

Node.js 24 以降と pnpm 11 を用意します。Windows では WSL を使い、以下のコマンドは Bash などの POSIX シェルで実行します。プロジェクト作成後、SQLite の初期化はまだ実行しないでください。

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
```

作成ツールが `my-app` を生成し、依存関係をインストールします。NocoBase 3 はベータ版です。`PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` は、この作成コマンドに限って公開直後のパッケージのインストールを許可します。

## ドライバーをインストールしてデータベースを設定する

以下はすべて `my-app` ディレクトリで実行します。使用するデータベースの節を 1 つ選んでください。`config init` は `config.yml` とアプリのシークレットを生成します。対話型ターミナルでは接続情報を尋ね、接続を試みます。スクリプトなどの非対話環境では、起動前に入力が必要な接続パラメーターを生成します。

各例は `database` セクション全体を示しています。初期化後、実際の接続情報を入力し、シークレットや他の設定を保持してください。この断片で `config.yml` 全体を置き換えないでください。`db.example.com`、ポート、`my_app`、アカウント、パスワードは実際の値に置き換えます。例のポートはデプロイの必須条件ではありません。`schemaManagement: managed` は、アプリがマイグレーションで自身のテーブル構造を管理することを許可します。

`config.yml` は Git に入れないでください。既定のテンプレートでは、プロセスの環境変数 `DB_PASSWORD` でメイン接続のパスワードを指定することもできます。環境変数がファイルの値より優先されます。YAML に `${DB_PASSWORD}` と書いても展開されません。その他の優先順位は[設定リファレンス](../reference/configuration.md)を参照してください。

すでに `config.yml` がある場合は、必要なドライバーをインストールし、既存のシークレットを保持して接続セクションを変更します。ドライバーのバージョンはアプリの依存関係と互換性が必要です。以下の `@beta` コマンドは新しいベータ版アプリ向けです。

### SQLite

既定のテンプレートには SQLite ドライバーが含まれるため、そのまま初期化します。

```bash
pnpm nocobase config init --dialect sqlite
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: sqlite
      database: database.sqlite
      schemaManagement: managed
```

`database` はファイルパスです。`database.sqlite` はアプリの `storage/` ディレクトリに保存されます。絶対パスも指定できます。アプリを実行するアカウントには保存先ディレクトリへの書き込み権限が必要です。このファイルにはアプリのデータが保存されるため、再デプロイ時にも保持してください。

### PostgreSQL

PostgreSQL のデータベースと、対象スキーマを使用できるアカウントを準備します。

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: postgres
      host: db.example.com
      port: 5432
      database: my_app
      schema: public
      username: app_user
      password: "replace-with-your-password"
      ssl: true
      schemaManagement: managed
```

`database` はデータベース名です。`schema` には `public`、または管理者が準備して権限を付与したスキーマを指定します。例では TLS を有効にしています。TLS を使わないサービスでは `ssl: false` に変更してください。専用 CA が必要な場合は `ssl` をオブジェクトに変更し、`ssl.ca` に証明書ファイルのパスではなく PEM 形式の証明書の内容を指定します。

### MySQL と MariaDB

MySQL と MariaDB は同じドライバーと `mysql` ダイアレクトを使います。

```bash
pnpm add @nocobase/db-mysql@beta
pnpm nocobase config init --dialect mysql
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: mysql
      host: db.example.com
      port: 3306
      database: my_app
      username: app_user
      password: "replace-with-your-password"
      charset: utf8mb4
      ssl: true
      schemaManagement: managed
```

データベースは事前に作成し、アプリが必要とする文字セットに対応させてください。例の接続文字セットは `utf8mb4` です。TLS を使わない場合は `ssl: false` に変更し、専用 CA が必要なら `ssl.ca` に PEM 形式の証明書の内容を指定します。MariaDB でも `dialect: mysql` のままにし、`mariadb` に変更しないでください。

### Microsoft SQL Server

データベースと、そのデータベースへのアクセス、読み書き、構造管理を許可された SQL ログインを準備します。

```bash
pnpm add @nocobase/db-mssql@beta
pnpm nocobase config init --dialect mssql
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: mssql
      host: db.example.com
      port: 1433
      database: my_app
      username: app_user
      password: "replace-with-your-password"
      encrypt: true
      trustServerCertificate: false
      schemaManagement: managed
```

`database` はデータベース名です。名前付きインスタンスでも、接続可能なホストと TCP ポートを指定してください。例では接続を暗号化し、サーバー証明書を検証します。ローカルのテストサーバーが自己署名証明書を使う場合は、テスト環境に応じて `trustServerCertificate: true` を指定できますが、サーバー証明書の検証が省略されます。本番環境では検証可能な証明書を使ってください。

### Oracle Database

Oracle のサービス名と、必要なスキーマ権限・表領域クォータを持つアプリ用ユーザーを準備します。

```bash
pnpm add @nocobase/db-oracle@beta
pnpm nocobase config init --dialect oracle
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: oracle
      host: db.example.com
      port: 1521
      serviceName: APPPDB
      username: app_user
      password: "replace-with-your-password"
      schemaManagement: managed
```

`serviceName` には管理者から提供されたサービス名（対象 PDB のサービス名など）を指定します。SID や通常のデータベース名ではありません。例の `APPPDB` を置き換えてください。アプリのオブジェクトはアカウントに対応するスキーマに保存されます。MySQL の `database` フィールドで代用しないでください。

### Dameng

Dameng ドライバーには NocoBase Pro の商用ライセンスと Pro レジストリーへのアクセス権が必要です。先にレジストリー認証を設定してください。ドライバーは実験段階のため、対象のデータベースバージョンで検証してから使用します。

```bash
pnpm add @nocobase/db-dameng@beta
pnpm nocobase config init --dialect dameng
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: dameng
      host: db.example.com
      port: 5236
      schema: APP_USER
      username: APP_USER
      password: "replace-with-your-password"
      schemaManagement: managed
```

`schema` には割り当てられたスキーマ名を、大文字・小文字を含めて正確に指定します。例ではユーザーとスキーマの両方に `APP_USER` を使っています。初期化では `database` フィールドは生成されません。このフィールドにスキーマ名を設定しないでください。

### KingbaseES

サーバーが PostgreSQL 互換モード（`DB_MODE=pg`）で動作していることを確認し、データベースとスキーマを準備します。インストールには NocoBase Pro の商用ライセンスと Pro レジストリーの認証設定が必要です。

```bash
pnpm add @nocobase/db-kingbase@beta
pnpm nocobase config init --dialect kingbase
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: kingbase
      host: db.example.com
      port: 54321
      database: my_app
      schema: public
      username: app_user
      password: "replace-with-your-password"
      ssl: true
      schemaManagement: managed
```

`schema` には権限が付与されたスキーマを指定します。TLS 設定は PostgreSQL と同じです。例では TLS を有効にしています。使わない場合は `ssl: false` に変更し、専用 CA は `ssl.ca` に PEM 形式で指定します。PostgreSQL 互換モードでも KingbaseES ドライバーをインストールし、`dialect: kingbase` を使ってください。

### OceanBase

OceanBase CE の MySQL 互換テナントを使い、そのテナント内にデータベースとアカウントを準備します。インストールには NocoBase Pro の商用ライセンスと Pro レジストリーの認証設定が必要です。

```bash
pnpm add @nocobase/db-oceanbase@beta
pnpm nocobase config init --dialect oceanbase
```

```yaml
database:
  default: main
  connections:
    main:
      dialect: oceanbase
      host: db.example.com
      port: 2881
      database: my_app
      username: app_user
      password: "replace-with-your-password"
      charset: utf8mb4
      ssl: true
      schemaManagement: managed
```

実際の接続先ホストとポートを使ってください。プロキシ経由では、例の直接接続用ポートをそのまま使わず、プロキシのエンドポイントを指定します。ユーザー名には、必要なテナント情報を含む、管理者から提供された完全な形式を使います。TLS はサービスの要件に合わせて設定します。例では有効です。使わない場合は `ssl: false` に変更し、専用 CA は `ssl.ca` で設定できます。TEXT の既定値などの違いは[データベースの対応状況とバージョンの互換性](../reference/compatibility.md)を参照してください。

## 接続を確認してアプリを起動する

`config.yml` を保存し、接続確認が成功してからアプリを起動します。

```bash
pnpm nocobase config check --connect
pnpm dev
```

`--connect` は SQLite を含むすべての接続を確認します。成功すると `main` 接続の確認結果が表示されます。失敗した場合はターミナルの案内に従って修正し、再確認してください。この確認はマイグレーションを実行せず、起動後の動作確認の代わりにはなりません。

初回起動では未実行のマイグレーションと必要な初期化が行われます。ターミナルに `Local:` の URL が表示されたら、`/main/` などのアプリのパスを含む完全なアドレスを開き、[サインインの手順](create-app.md#サインインする)に従ってログインしてください。ホームページが表示され、ターミナルに初期化エラーがなければ、アプリが起動しています。ターミナルは開いたままにしてください。

## よくある接続の問題

| 現象 | 確認すること |
| --- | --- |
| データベースドライバーが見つからない | アプリのプロジェクトに対応するパッケージをインストールします。商用ドライバーではライセンスとプライベートレジストリー認証も確認します。デプロイ用パッケージは再ビルドが必要です |
| 接続がタイムアウトする、拒否される | アプリのマシンから、ホスト、ポート、データベースの待ち受けアドレス、ファイアウォール、クラウドサービスのアクセス許可リストを確認します |
| ユーザー名やパスワードが正しくない | 認証情報と許可された接続元を確認します。OceanBase ではテナントと完全なユーザー名も確認します |
| データベース、スキーマ、サービスが見つからない | データベースの作成とスキーマへの権限付与を確認します。Oracle では `serviceName` を確認します |
| TLS や証明書のエラー | 暗号化の要件、ホスト名、CA の信頼設定を確認し、データベースに対応するフィールドを設定します |
| 接続確認は成功するが起動時のマイグレーションに失敗する | 最初のマイグレーションエラーと、テーブル・インデックスの作成や変更権限を確認します。Oracle では表領域クォータも確認します |
| ファイルを変更しても以前のデータベースに接続する | `DB_DIALECT`、`DB_HOST`、`DB_PORT`、`DB_DATABASE` などの環境変数が上書きしていないか確認します |
| SQLite ファイルを開けない | 実際のファイルパス、保存先ディレクトリ、実行アカウントの書き込み権限を確認します |

すでに別のデータベースで初期化した場合は、そのデータベースとシークレットを保持し、データ移行を別途計画してください。`config init` を再実行しても既存データは移動しません。
