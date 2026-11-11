---
title: Studio をデプロイする
description: Docker Compose で空の Studio インスタンスをデプロイし、データを永続化して、管理者としてサインインします。
---

Studio と Studio EE は商用製品です。イメージとアクセス許可については[お問い合わせ](https://www.nocobase.com/ja-JP/contact/)ください。品質管理は Studio EE で利用できます。

このガイドでは、PostgreSQL を使う Studio インスタンスを 1 つデプロイします。既存のデータベースを使うこともできます。[設定リファレンス](../reference/config.md) を参照してください。

## 環境を準備する

- Docker と Docker Compose が使えるサーバー。イメージは Linux の amd64 と arm64 に対応しています。
- 提供された Studio のイメージ。オフラインのイメージアーカイブの場合は `docker load -i <archive>` を使います。
- 固定のアドレス。チームで使う場合はドメインと HTTPS を使います。ローカルで試すだけなら `http://localhost:13000` で十分です。

コーディングツールは別の [ランタイム](shared-runtimes.md) で動作し、あとから接続します。単一インスタンスでは Redis は不要です。チームに使い始めてもらう前に、ファイルと成果物のストレージ、招待メール、パスワード再設定メールを準備してください。

## 設定を準備する

提供されたイメージから設定テンプレートを取り出します。プレースホルダーを、正確なバージョンを含む完全なイメージ名に置き換えてください。

```bash
mkdir studio
cd studio
mkdir storage

docker run --rm --entrypoint cat '<supplied-image-name-and-version>' \
  /app/config.example.yml > config.yml
```

暗号化キーを生成します。

```bash
openssl rand -hex 32
```

`config.yml` を編集し、以下の値をテンプレートの対応する項目に反映します。管理者アカウント、生成した暗号化キー、データベースの接続情報を入力してください。他の設定は保持し、同名のキーを重複させないでください。

この例では PostgreSQL を使います。既存のデータベースを使う場合は、Studio コンテナから接続できるホスト、ポート、データベース名、ユーザー名、パスワードを入力します。

以下の [Compose 設定](#サービスを起動する)でデータベースを作成する場合、Studio はコンテナネットワーク経由で PostgreSQL に接続します。`host: postgres` は Compose のサービス名、`port: 5432` はデータベースコンテナ内の待受ポートです。データベース名、ユーザー名、パスワードは自分で設定します。

```yaml
app:
  publicOrigin: http://localhost:13000
  sampleData: false

users:
  initialAdmin:
    username: admin
    email: admin@example.com
    password: replace-with-admin-password

secrets:
  keys:
    - version: 1
      key: replace-with-generated-key

auth:
  passwordReset:
    enabled: false
  emailAndPassword:
    enabled: true
    autoSignIn: false
    disableSignUp: true

database:
  default: main
  connections:
    main:
      dialect: postgres
      host: postgres
      port: 5432
      database: replace-with-database-name
      username: replace-with-database-user
      password: replace-with-database-password
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true
```

`app.publicOrigin` にはブラウザーからアクセスするスキーム、ホスト、ポートを指定し、`/main` は含めません。初期管理者は、ユーザーがいないデータベースでの初回起動時だけ作成されます。

> [!NOTE] 暗号化キーを保管する
> `secrets.keys` は Studio に保存した認証情報の暗号化に使います。再起動やアップグレードでも保持し、データベースと一緒にバックアップしてください。紛失すると保存済みの認証情報を復号できません。

## ファイルと成果物のアップロード

ローカルストレージはそのまま使えます。後述の Compose 設定で `/app/storage` を永続化します。タスク、コメント、エージェント会話の添付ファイルは、1 ファイルあたり既定で 20 MiB までです。変更する場合は `config.yml` の保存先ディスクに設定します。以下は 50 MiB の例です。

```yaml
drive:
  disks:
    local:
      maxFileSizeMb: 50
```

`maxFileSizeMb` は正の整数で指定します。オブジェクトストレージでは、対応するディスクに設定してください。リバースプロキシのリクエストサイズ上限にも、アップロードフォームの分を含めた余裕を持たせます。

オブジェクトストレージを使う場合は、次の設定を `config.yml` に反映します。ここでは Amazon S3 を使用します。

```yaml
drive:
  default: s3
  disks:
    s3:
      driver: s3
      maxFileSizeMb: 50
      bucket: example-studio-files
      region: us-east-1
      supportsACL: false
      visibility: private
      credentials:
        accessKeyId: replace-with-access-key-id
        secretAccessKey: replace-with-access-key-secret

releases:
  artifact:
    disk: s3
    prefix: releases/artifacts
```

バケット、リージョン、認証情報を置き換え、バケットは非公開にします。`drive.default` には、アップロードされた添付ファイルなどのファイルが保存されます。CI やエージェントがアップロードするビルド成果物用には、`releases.artifact` を別に設定します。

オブジェクトストレージを使う場合も、`storage` ボリュームのマウントは残してください。ローカルファイルと S3 互換サービスについては、[ファイルと成果物のストレージ](../reference/storage.md) を参照してください。

## 招待メールとパスワード再設定メール

メンバーを招待する前にメールを設定します。招待とパスワード再設定は 1 つの SMTP 設定を共有します。以下を `config.yml` の対応する項目に統合してください。

```yaml
mailers:
  default: system
  system:
    provider: smtp
    host: smtp.example.com
    port: 587
    secure: false
    auth:
      user: notifications@example.com
      pass: replace-with-smtp-password
    from: "Studio <notifications@example.com>"

auth:
  passwordReset:
    enabled: true
```

`users.initialAdmin` や `auth.emailAndPassword` などの設定は残します。SMTP のホスト、ポート、アカウント、送信元アドレスを、メールサービスで認可された値に置き換えてください。

パスワードは `mailers.system.auth.pass` に設定します。`app.publicOrigin` はメンバーがアクセスできる Studio のアドレスにします。メールのリンクに使われます。

メールを使わずにローカルで試す場合は、`auth.passwordReset.enabled: false` のままにします。招待リンクは手動で共有できます。Resend の設定と送信確認は[通知とプッシュ](../admin/notifications.md#招待メール)を参照してください。

## サービスを起動する

同じディレクトリに `docker-compose.yml` を作成します。イメージ名を置き換え、`POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD` に `config.yml` と同じデータベース名、ユーザー名、パスワードを設定します。

```yaml
services:
  studio:
    image: <supplied-image-name-and-version>
    init: true
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "127.0.0.1:13000:13000"
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./storage:/app/storage

  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: replace-with-database-name
      POSTGRES_USER: replace-with-database-user
      POSTGRES_PASSWORD: replace-with-database-password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres-data:
```

既存のデータベースを使う場合は、Compose から `postgres` サービス、`studio.depends_on`、`postgres-data` ボリュームの設定を削除してください。

Studio イメージは既定で `/app/config.yml` を読み込み、`/main` を使用します。上記の環境変数は PostgreSQL コンテナの初期化用です。Studio の設定は `config.yml` にまとめます。

Studio コンテナは UID 1000 で動作します。起動前に設定ファイルの読み取りとストレージへの書き込みを許可し、設定ファイルの閲覧を制限します。

```bash
sudo chown 1000:1000 config.yml storage
sudo chmod 600 config.yml
```

この設定では、ポート 13000 をローカルホストにだけ公開します。リモートサーバーの場合は、下の説明に従って HTTPS を設定するか、最初の確認には SSH のポートフォワーディングを使います。

```bash
docker compose config --quiet
docker compose up -d
docker compose ps
curl -fsS http://localhost:13000/main/api/healthz
```

初回起動時に、データベースのテーブルと管理者が作成されます。Studio が `healthy` になり、ヘルスチェックのエンドポイントが `"ok": true` を返すまで待ちます。

## 公開アドレスを設定する

ローカルで試すだけならこのステップは不要です。チームで使う場合は、ドメインをサーバーに向け、WebSocket に対応した HTTPS リバースプロキシを設定します。

たとえば、同じサーバーで Caddy を使う場合は次のとおりです。

```text
studio.example.com {
    reverse_proxy 127.0.0.1:13000
}
```

`config.yml` の `app.publicOrigin` を実際の公開アドレスに変更します。

```yaml
app:
  publicOrigin: https://studio.example.com
```

設定を反映するため Studio コンテナを作り直します。

```bash
docker compose up -d --force-recreate studio
```

## サインインする

`https://studio.example.com/main/` を開きます。ローカルで試す場合は `http://localhost:13000/main/` です。`config.yml` の `users.initialAdmin` に設定したユーザー名とパスワードでサインインします。

![初期管理者アカウントでサインインします](https://static-docs.nocobase.com/studio-en-login-20261111-normal-2x.webp)

これらの管理者の設定は、初回インストール時にだけ適用されます。あとからパスワードを変更するには、**Account settings › Account and security** を使います。

**完了の条件**：管理者がサインインでき、プロジェクト一覧が空で、サインインページに登録用のリンクがないこと。runner と CLI を接続するときは、`/main` を含む完全な URL を使います。

License Key の入力を求められたら、製品とともに提供されたキーを入力します。Studio EE には Enterprise Key が必要です。管理者は **Settings › License** でライセンスと更新を確認できます。アプリの初期化で商用パッケージが必要な場合は、提供されたアクセス認証情報もここで設定します。

![初回サインイン後の空のプロジェクト一覧](https://static-docs.nocobase.com/studio-en-empty-projects-20261111-normal-2x.webp)

チームに使い始めてもらう前に、次のことができるか確認します。

- テスト用のファイルをアップロードし、ページを再読み込みしてからダウンロードする。
- 自分が管理するテスト用のメールボックスで招待を受け取り、そのリンクを開く。
- 既存のテスト用アカウントのパスワードを再設定し、新しいパスワードでサインインする。

成果物のアップロードとプレビューの起動は、[チェックとプレビューを設定](ci.md) したあとに確認します。

次に、[コードホストを接続します](git.md)。

## トラブルシューティング

| 症状 | 確認すること |
| --- | --- |
| イメージへのアクセスが拒否される | 提供されたバージョンとアクセス許可を確認します。必要に応じてお問い合わせください |
| イメージのダウンロードがタイムアウトする | Docker サービスのプロキシと、提供されたダウンロード先へのアクセスを確認します |
| コンテナが再起動を繰り返す | `docker compose logs --tail=100 studio` を実行し、データベースと設定のエラーを確認します |
| 設定ファイルを読み込めない | `config.yml` が、Docker が作成したディレクトリではなく、イメージからコピーしたファイルであることを確認します |
| ストレージに書き込めない | UID 1000 が `storage` に書き込めることを確認します |
| ページやサインインのコールバックが失敗する | `/main/`、`app.publicOrigin`、リバースプロキシを確認します |

継続的な保守については、[アップグレードとバックアップ](../admin/upgrade-and-backup.md) を参照してください。
