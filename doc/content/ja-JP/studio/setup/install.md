---
title: Studio をデプロイする
description: 1 つのコマンドで自分のコンピューターに Studio をインストールして試すか、チームで使うために Docker Compose で手動デプロイします。
---

## 1 つのコマンドでインストールする

1 つのコマンドで、自分のコンピューターに次のものが用意されます。

- Studio コミュニティ版と PostgreSQL。Docker Compose で `~/.nocobase-studio/` に配置されます
- ローカルの Git サーバー Gitea
- このコンピューターを[個人ランタイム](../join/personal-runtime.md)として接続する runner とコマンドライン `nb-studio`
- NocoBase 3 アプリが入ったリポジトリを持つ **My first project**
- エージェントとの会話と、最初のタスクの提案

### 始める前に

- macOS、Linux、または Windows の WSL と Docker Desktop
- Compose v2 を含む Docker が起動していること
- Node.js 24、Git、curl
- インストールしてサインイン済みのコーディングツールが 1 つ以上あること：Claude Code、Codex、OpenCode、Pi

### インストーラーを実行する

```bash
curl -fsSL https://get.nocobase.com/studio | sh -s -- --lang ja-JP
```

完了すると、開くアドレスとサインイン情報が表示されます。

### Studio を開く

表示されたアドレスを開き、`admin@nocobase.com` と `admin123` でサインインします。その後、**アカウント設定 › アカウントとセキュリティ** でパスワードを変更します。

Gitea にも同じメールアドレスと初期パスワードでサインインできます。

**完了の条件**：最初の会話にエージェントの計画と **開始** ボタンのある提案タスクが表示されること。

### 設定を変更する

| `~/.nocobase-studio/` のファイル | 内容 | 編集後に実行するコマンド |
| --- | --- | --- |
| `config/config.yml` | データベース、[メール](#招待メールとパスワード再設定メール)、[ファイルストレージ](#ファイルと成果物のアップロード)などの Studio の設定 | `docker compose -f ~/.nocobase-studio/compose.yml restart studio` |
| `.env` | イメージ、ポート、言語、初期管理者、`SECRETS_KEYS`、`POSTGRES_PASSWORD` | `docker compose -f ~/.nocobase-studio/compose.yml up -d` |

インストーラーをもう一度実行しても、編集した内容は残ります。`.env` の設定は `config.yml` の同じ設定より優先されます。`SECRETS_KEYS` は保管してください。これがないと、Studio は保存済みの認証情報を復号できません。

### インストーラーのオプション

| オプション | 効果 |
| --- | --- |
| `--lang <locale>` | インストーラーと Studio の言語：`en-US`（既定）、`zh-CN`、`zh-TW`、`ja-JP`、`ko-KR`、`es-ES`、`fr-FR`、`de-DE`、`pt-BR`、`ru-RU`、`id-ID`、`vi-VN` |
| `--mirror <registry>` | Docker Hub の代わりにこのレジストリからイメージを取得します。中国本土では `registry.cn-shanghai.aliyuncs.com` など |
| `--npm-registry <url>` | 最初のプロジェクトの npm パッケージを `https://registry.npmmirror.com/` などのレジストリからインストールします |
| `--dry-run` | 何も変更せず、実行する内容だけを表示します |
| `--uninstall` | コンテナー、runner、`nb-studio` を削除し、データは残します |
| `--purge` | `--uninstall` と一緒に指定すると、`~/.nocobase-studio/` も削除します |
| `-h`、`--help` | 使い方を表示します |

### アップグレード・停止・アンインストール

アップグレードするには、インストールコマンドをもう一度実行します。設定はそのまま残り、イメージが変わる場合は先に `data/` を `backups/` にバックアップします。

停止と起動：

```bash
docker compose -f ~/.nocobase-studio/compose.yml down
docker compose -f ~/.nocobase-studio/compose.yml up -d
```

データを残してアンインストール：

```bash
curl -fsSL https://get.nocobase.com/studio | sh -s -- --uninstall
```

データも削除するには `--purge` を追加します。

## 手動でデプロイする

以下の手順ではライセンスキーが不要なコミュニティ版（CE）を使います。他のエディションの入手方法は[エディションを選ぶ](index.md#エディションを選ぶ)を参照してください。

PostgreSQL を使う Studio インスタンスを 1 つデプロイします。既存のデータベースを使うこともできます。[設定リファレンス](../reference/config.md) を参照してください。

### 環境を準備する

- Docker と Docker Compose が使えるサーバー。イメージは Linux の amd64 と arm64 に対応しています。
- サーバーからイメージレジストリにアクセスできること。オフラインの場合は `docker load -i <archive>` でイメージを読み込みます。
- 固定のアドレス。チームで使う場合はドメインと HTTPS を使います。ローカルで試すだけなら `http://localhost:13000` で十分です。

コーディングツールは別の [ランタイム](shared-runtimes.md) で動作し、あとから接続します。単一インスタンスでは Redis は不要です。チームに使い始めてもらう前に、ファイルと成果物のストレージ、招待メール、パスワード再設定メールを準備してください。

### 設定を準備する

[Docker Hub の CE 公式イメージ](https://hub.docker.com/r/nocobase/studio-ce)から設定テンプレートを取り出します。

```bash
mkdir studio
cd studio
mkdir storage

docker run --rm --entrypoint cat nocobase/studio-ce:latest \
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

### ファイルと成果物のアップロード

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

### 招待メールとパスワード再設定メール

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

### サービスを起動する

同じディレクトリに `docker-compose.yml` を作成します。`POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD` には、`config.yml` と同じデータベース名、ユーザー名、パスワードを設定します。

```yaml
services:
  studio:
    image: nocobase/studio-ce:latest
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
    command: ["postgres", "-c", "jit=off"]
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

Studio が使う PostgreSQL データベースでは、JIT（実行時コンパイル）を無効にすることを推奨します。[JIT は主に、実行時間が長く CPU 負荷の高いクエリに適しています](https://www.postgresql.org/docs/16/jit-decision.html)。Studio の日常的な操作は短いクエリが中心です。JIT が使われると、コンパイルの負担が時間短縮の効果を上回り、応答が遅くなることがあります。

上の `command` で `jit=off` を設定しています。既存のデータベースを使う場合は、データベース名を置き換え、所有者または管理者として次の SQL を実行します。

```sql
ALTER DATABASE "your_studio_database" SET jit = off;
```

この設定は新しい接続に適用されます。Studio が起動済みの場合は、再起動して接続を更新してください。Studio のデータベースアカウントで新しく接続し、`SHOW jit;` の結果が `off` になることを確認します。

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

### 公開アドレスを設定する

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

### サインインする

`https://studio.example.com/main/` を開きます。ローカルで試す場合は `http://localhost:13000/main/` です。`config.yml` の `users.initialAdmin` に設定したユーザー名とパスワードでサインインします。

![初期管理者アカウントでサインインします](https://static-docs.nocobase.com/studio-en-login-20261111-normal-2x.webp)

これらの管理者の設定は、初回インストール時にだけ適用されます。あとからパスワードを変更するには、**Account settings › Account and security** を使います。

**完了の条件**：管理者がサインインでき、プロジェクト一覧が空で、サインインページに登録用のリンクがないこと。runner と CLI を接続するときは、`/main` を含む完全な URL を使います。

プロフェッショナル版とエンタープライズ版では、提供されたライセンスキーを入力します。管理者は **Settings › License** でライセンスと更新を確認できます。アプリの初期化に商用パッケージが必要な場合は、ここで認証情報を設定します。

![初回サインイン後の空のプロジェクト一覧](https://static-docs.nocobase.com/studio-en-ce-empty-projects-20261119-7bcc68297d.webp)

チームに使い始めてもらう前に、次のことができるか確認します。

- テスト用のファイルをアップロードし、ページを再読み込みしてからダウンロードする。
- 自分が管理するテスト用のメールボックスで招待を受け取り、そのリンクを開く。
- 既存のテスト用アカウントのパスワードを再設定し、新しいパスワードでサインインする。

成果物のアップロードとプレビューの起動は、[チェックとプレビューを設定](ci.md) したあとに確認します。

次に、[コードホストを接続します](git.md)。

## トラブルシューティング

| 症状 | 確認すること |
| --- | --- |
| インストーラーが停止し、不足しているツールを表示する | 表示されたコマンドでインストールし、インストーラーをもう一度実行します |
| ランタイムがコーディングツールをサインイン済みと認識していないとインストーラーが表示する | ツールにサインインします。Claude Code の場合は、シェルの設定ファイルにある `ANTHROPIC_*` 変数を `~/.claude/settings.json` の `env` に移します。**Agent 管理 › 実行環境** でツールを再検出してから、インストーラーをもう一度実行します |
| イメージへのアクセスが拒否される | リポジトリ名とバージョンタグを確認します。プロフェッショナル版またはエンタープライズ版の場合は、提供されたレジストリへのアクセス権も確認します |
| ダウンロードがタイムアウトする | Docker のプロキシ設定と、サーバーからレジストリへのネットワーク接続を確認します。1 つのコマンドでインストールした場合は `--mirror` を使います |
| コンテナが再起動を繰り返す | `docker compose logs --tail=100 studio` を実行し、データベースと設定のエラーを確認します。1 つのコマンドでインストールした場合は `-f ~/.nocobase-studio/compose.yml` を追加します |
| 設定ファイルを読み込めない | `config.yml` が、Docker が作成したディレクトリではなく、イメージからコピーしたファイルであることを確認します |
| ストレージに書き込めない | UID 1000 が `storage` に書き込めることを確認します |
| ページやサインインのコールバックが失敗する | `/main/`、`app.publicOrigin`、リバースプロキシを確認します |

継続的な保守については、[アップグレードとバックアップ](../admin/upgrade-and-backup.md) を参照してください。
