---
title: Studio をデプロイする
description: Docker Compose で空の Studio インスタンスをデプロイし、データを永続化して、管理者としてサインインします。
---

Studio は商用製品です。イメージ、利用できるバージョン、アクセス許可については [お問い合わせ](https://www.nocobase.com/ja-JP/contact/) ください。

このガイドでは、PostgreSQL を使う Studio インスタンスを 1 つデプロイします。既存のデータベースを使うこともできます。[設定リファレンス](../reference/config.md) を参照してください。

## 環境を準備する

- Docker と Docker Compose が使えるサーバー。イメージは Linux の amd64 と arm64 に対応しています。
- 提供された Studio のイメージ。オフラインのイメージアーカイブの場合は `docker load -i <archive>` を使います。
- 固定のアドレス。チームで使う場合はドメインと HTTPS を使います。ローカルで試すだけなら `http://localhost:13000` で十分です。

コーディングツールは別の [ランタイム](shared-runtimes.md) で動作し、あとから接続します。単一インスタンスでは Redis は不要です。チームに使い始めてもらう前に、ファイルと成果物のストレージ、招待メール、パスワード再設定メールを準備してください。

## 設定を準備する

提供時の手順に従ってイメージを入手します。`STUDIO_IMAGE` に、正確なバージョンを含む完全なイメージ名を設定します。

```bash
export STUDIO_IMAGE='<supplied-image-name-and-version>'
mkdir studio
cd studio
mkdir storage
sudo chown 1000:1000 storage

docker run --rm --entrypoint cat "$STUDIO_IMAGE" \
  /app/config.example.yml > config.yml
```

Studio のコンテナは UID 1000 で動作し、`storage` への書き込み権限が必要です。

`config.yml` の該当するセクションを編集して、セルフ登録を無効にします。テンプレートのほかの部分はそのまま残し、YAML のキーが重複しないようにします。画面は既定で英語です。

```yaml
auth:
  passwordReset:
    enabled: false
  emailAndPassword:
    enabled: true
    autoSignIn: false
    disableSignUp: true
```

ランダムな暗号化キー、管理者パスワード、データベースのシークレットを含む `.env` を生成します。

```bash
umask 077
cat > .env <<EOF
STUDIO_IMAGE=${STUDIO_IMAGE}
STUDIO_SECRET_KEY=$(openssl rand -hex 32)
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=$(openssl rand -hex 18)
DB_PASSWORD=$(openssl rand -hex 24)
APP_PUBLIC_ORIGIN=http://localhost:13000
EOF
```

管理者のメールアドレスは自分のものに置き換えます。`APP_PUBLIC_ORIGIN` には公開時のスキーム、ホスト、ポートを書き、`/main` は含めません。

> [!NOTE] 暗号化キーを保管する
> `STUDIO_SECRET_KEY` は、Studio に保存される認証情報を暗号化します。再起動やアップグレードのときも保持し、データベースと一緒にバックアップしてください。このキーがないと、保存済みの認証情報を復号できません。

## ファイルと成果物のアップロード

ローカルストレージは追加の設定なしで使えます。下の Compose ファイルで `/app/storage` を永続化します。オブジェクトストレージを使う場合は、次の内容を `config.yml` にマージします。この例では Amazon S3 を使います。

```yaml
drive:
  default: s3
  disks:
    s3:
      driver: s3
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

チームに使い始めてもらう前に、両方を設定します。招待は通知チャネルを使い、パスワード再設定は独立した `auth.email` の送信設定を使います。この例では両方に同じ SMTP アカウントを使います。`config.yml` の該当するセクションにマージしてください。

```yaml
users:
  invitations:
    emailChannel: system-email

notification:
  channels:
    inbox:
      type: in-app
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      secure: false
      auth:
        user: notifications@example.com
      from: "Studio <notifications@example.com>"

auth:
  passwordReset:
    enabled: true
  email:
    provider: smtp
    host: smtp.example.com
    port: 587
    secure: false
    auth:
      user: notifications@example.com
    from: "Studio <notifications@example.com>"
```

`users.initialAdmin` や `auth.emailAndPassword` など、既存の設定は残します。SMTP のホスト、ポート、アカウント、送信元アドレスは、メールプロバイダーで許可された値に置き換えます。

パスワードを `.env` に追加します。

```dotenv
SMTP_PASSWORD=<invitation-email-smtp-password>
AUTH_EMAIL_PASSWORD=<password-reset-smtp-password>
```

下の Compose ファイルの `services.studio.environment` に、次のエントリを追加します。

```yaml
SMTP_PASSWORD: ${SMTP_PASSWORD:?set SMTP_PASSWORD in .env}
AUTH_EMAIL_PASSWORD: ${AUTH_EMAIL_PASSWORD:?set AUTH_EMAIL_PASSWORD in .env}
```

変数は Compose からコンテナに渡す必要があります。`config.yml` に `${SMTP_PASSWORD}` と書いても展開されません。2 つの送信設定で同じパスワードを使うこともできますが、変数は別々にする必要があります。`APP_PUBLIC_ORIGIN` には、メンバーがアクセスできるアドレスを設定します。メール内のリンクにはこのアドレスが使われます。

メールを使わずにローカルで試す場合は、`auth.passwordReset.enabled: false` のままにします。招待リンクは手動で共有できます。Resend の使い方や旧設定からの移行については、[通知とプッシュ](../admin/notifications.md#旧設定から移行する) を参照してください。

## サービスを起動する

同じディレクトリに `docker-compose.yml` を作成します。

```yaml
services:
  studio:
    image: ${STUDIO_IMAGE:?set STUDIO_IMAGE in .env}
    init: true
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "127.0.0.1:13000:13000"
    environment:
      APP_CONFIG_FILE: /app/config.yml
      APP_PUBLIC_ORIGIN: ${APP_PUBLIC_ORIGIN}
      APP_BASE_PATH: /main
      APP_SAMPLE_DATA: "false"
      SECRETS_KEYS: 1:${STUDIO_SECRET_KEY:?set STUDIO_SECRET_KEY in .env}
      INITIAL_ADMIN_USERNAME: ${INITIAL_ADMIN_USERNAME}
      INITIAL_ADMIN_EMAIL: ${INITIAL_ADMIN_EMAIL}
      INITIAL_ADMIN_PASSWORD: ${INITIAL_ADMIN_PASSWORD:?set INITIAL_ADMIN_PASSWORD in .env}
      DB_DIALECT: postgres
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: studio
      DB_USERNAME: studio
      DB_PASSWORD: ${DB_PASSWORD:?set DB_PASSWORD in .env}
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./storage:/app/storage

  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: studio
      POSTGRES_USER: studio
      POSTGRES_PASSWORD: ${DB_PASSWORD:?set DB_PASSWORD in .env}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U studio -d studio"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres-data:
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

`.env` に `APP_PUBLIC_ORIGIN=https://studio.example.com` を設定し、コンテナを作り直します。

```bash
docker compose up -d
```

## サインインする

`https://studio.example.com/main/` を開きます。ローカルで試す場合は `http://localhost:13000/main/` です。`.env` の `INITIAL_ADMIN_USERNAME` と `INITIAL_ADMIN_PASSWORD` を使います。

![初期管理者アカウントでサインインします](https://static-docs.nocobase.com/studio-en-setup-login-20261030.png)

これらの管理者の設定は、初回インストール時にだけ適用されます。あとからパスワードを変更するには、**Account settings › Account and security** を使います。

**完了の目安**：管理者がサインインでき、プロジェクト一覧が空で、サインインページに登録用のリンクがないこと。runner と CLI を接続するときは、`/main` を含む完全な URL を使います。

![初回サインイン後の空のプロジェクト一覧](https://static-docs.nocobase.com/studio-en-setup-empty-projects-20261030.png)

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
| ページやサインインのコールバックが失敗する | `/main/`、`APP_PUBLIC_ORIGIN`、リバースプロキシを確認します |

継続的な保守については、[アップグレードとバックアップ](../admin/upgrade-and-backup.md) を参照してください。
