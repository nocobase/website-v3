---
title: Studio をデプロイする
description: 1 つのコマンドで自分のコンピューターに Studio をインストールして試すか、チームで使うために Docker Compose で手動デプロイします。
---

## 1 つのコマンドでインストールする

自分のコンピューターで Studio を試すなら、コマンドを 1 つ実行するだけです。次のものが用意されます。

- PostgreSQL データベースを使う Studio コミュニティ版。Docker Compose で `~/.nocobase-studio/` に配置されます。
- 同じコンピューターで動く Git サーバー Gitea。最初のプロジェクトのリポジトリを保存します。
- このコンピューターを[個人ランタイム](../join/personal-runtime.md)として接続するための runner `nocobase-runner` とコマンドライン `nb-studio`。
- **My first project** という名前のプロジェクト。リポジトリには最初から NocoBase 3 アプリが入っています。
- サインイン済みのコーディングツールを使うエージェントとの会話と、開始を待っている最初のタスクの提案。

Studio と Gitea には、このコンピューターからしかアクセスできません。ドメインと HTTPS でチームが使う場合や、プロフェッショナル版・エンタープライズ版を使う場合は、[手動でデプロイ](#手動でデプロイする)してください。

### 始める前に

- macOS、Linux、または WSL を使う Windows。Windows では、Ubuntu などの WSL のターミナルでコマンドを実行し、Docker Desktop を Windows にインストールします。Git Bash と MSYS には対応していません。
- Compose v2 を含む Docker。Docker デーモンが起動していること。
- Node.js 24、Git、curl。
- インストールしてサインイン済みのコーディングツールが 1 つ以上あること：Claude Code、Codex、OpenCode、Pi。ACP ツールはインストールだけで使えます。

不足しているものがあると、インストーラーはその名前と、使っているプラットフォーム向けのインストールコマンドを表示して停止します。対話できるターミナルで実行すると、Docker や Node.js のインストールを提案することもあります。

### インストーラーを実行する

次のコマンドは、Studio を日本語で使う設定でインストールします。

```bash
curl -fsSL https://get.nocobase.com/studio | sh -s -- --lang ja-JP
```

[オプション](#インストーラーのオプション)は `sh -s --` のあとに指定します。

初回の実行には数分かかります。時間の大半は、イメージのダウンロードと最初のプロジェクトのアプリ作成です。Studio はポート 13000、Gitea はポート 3000 を使います。ポートが使用中の場合は次の空いているポートを使い、以降の実行でもそのポートを使い続けます。

完了すると、インストーラーは概要を表示します。開くアドレスとその下にサインイン情報、Gitea のアドレス、ランタイムの状態、このインストールを停止・アップグレード・アンインストールするコマンドです。

### Studio を開く

概要に表示されたアドレスを開きます。アドレスは `http://127.0.0.1:13000/main/` で始まります。初期管理者としてサインインします。メールアドレスは `admin@nocobase.com`、パスワードは `admin123` です。サインインすると最初の会話が開きます。

サインインしたら、すぐに **アカウント設定 › アカウントとセキュリティ** でパスワードを変更してください。変更してもインストーラーはそのまま使えますが、以降の実行の概要には初期パスワードが表示されたままになります。

概要に表示された Gitea のアドレスでは、同じメールアドレスと初期パスワードでサインインできます。Studio でパスワードを変更しても、Gitea のパスワードは変わりません。

**完了の条件**：会話にエージェントの計画と **開始** ボタンのある提案タスクが表示され、プロジェクト一覧に **My first project** があり、**Agent 管理 › 実行環境** でこのコンピューターがオンラインになっていること。

### 設定を変更する

Studio は `~/.nocobase-studio/` にある 2 つのファイルを読み込みます。

| ファイル | 内容 | 編集後に実行するコマンド |
| --- | --- | --- |
| `config/config.yml` | データベース接続、[メール](#招待メールとパスワード再設定メール)、[ファイルストレージ](#ファイルと成果物のアップロード)など、Studio 自体の設定。初回の実行時に作成され、上書きされることはありません | `docker compose -f ~/.nocobase-studio/compose.yml restart studio` |
| `.env` | イメージ、ポート、表示言語、初期管理者、暗号化キー `SECRETS_KEYS`、データベースのパスワード `POSTGRES_PASSWORD`。インストーラーは不足している値だけを追加するので、変更した内容は残ります | `docker compose -f ~/.nocobase-studio/compose.yml up -d` |

Studio のポート、公開アドレス、言語、暗号化キー、初期管理者は、Compose が `.env` をもとに設定します。これらは `config.yml` の同じ設定より優先されます。`compose.yml` はインストーラーを実行するたびに書き直されるため、変更は上の 2 つのファイルに書いてください。

`SECRETS_KEYS` は保管してください。これがないと、Studio は保存済みの認証情報を復号できません。`POSTGRES_PASSWORD` がデータベースのパスワードを設定するのは初回の起動時だけです。あとから変更しても、既存のデータベースのパスワードは変わりません。

Studio のファイル、PostgreSQL と Gitea のデータは `data/` にあります。イメージが変わるアップグレードの前に、インストーラーは `data/` を `backups/` にアーカイブし、最新の 3 つを残します。

### インストーラーのオプション

| オプション | 効果 |
| --- | --- |
| `--lang <locale>` | インストーラーの出力と Studio の言語。`en-US`（既定）、`zh-CN`、`zh-TW`、`ja-JP`、`ko-KR`、`es-ES`、`fr-FR`、`de-DE`、`pt-BR`、`ru-RU`、`id-ID`、`vi-VN` のいずれか |
| `--mirror <registry>` | Studio、PostgreSQL、Gitea のイメージを Docker Hub ではなくこのレジストリから取得します。中国本土では `registry.cn-shanghai.aliyuncs.com` を使います |
| `--npm-registry <url>` | 最初のプロジェクトの npm パッケージを `https://registry.npmmirror.com/` などのレジストリからインストールします。`@nocobase` パッケージは引き続き npmjs から取得します |
| `--dry-run` | 何も変更せず、実行する内容だけを表示します |
| `--uninstall` | コンテナー、runner、`nb-studio` を削除し、データと設定は残します |
| `--purge` | `--uninstall` と一緒に指定すると、確認のうえ `~/.nocobase-studio/` も削除します |
| `-h`、`--help` | 使い方を表示します |

`--lang`、`--mirror`、`--npm-registry` は `.env` に保存されるため、以降の実行でも引き継がれます。

### アップグレード・停止・アンインストール

アップグレードするには、インストールコマンドをもう一度実行します。概要には、現在のオプションを含むコマンドが表示されます。インストーラーは最新のイメージを取得し、イメージが変わった場合は先に `data/` をバックアップします。設定はそのまま残ります。最初のプロジェクトの作成など、完了済みの手順は繰り返されません。

Studio と Gitea を停止する、または再び起動するには次のコマンドを使います。

```bash
docker compose -f ~/.nocobase-studio/compose.yml down
docker compose -f ~/.nocobase-studio/compose.yml up -d
```

データを残してアンインストールします。再インストールすると、続きから使えます。

```bash
curl -fsSL https://get.nocobase.com/studio | sh -s -- --uninstall
```

runner と `nb-studio` が削除されるのは、インストーラーがインストールし、ほかの Studio で使われていない場合だけです。データと設定も削除するには、`--purge` を追加します。

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
| インストーラーが停止し、不足しているツールを表示する | インストーラーが表示したコマンドでインストールし、インストーラーをもう一度実行します |
| ランタイムがコーディングツールをサインイン済みと認識していないとインストーラーが表示する | runner はバックグラウンドサービスとしてサインイン状態を確認するため、シェルの設定ファイルの環境変数を読み込みません。ツールを通常の方法でサインインします。Claude Code の場合は、シェルの設定ファイルにある `ANTHROPIC_*` 変数を `~/.claude/settings.json` の `env` に移します。**Agent 管理 › 実行環境** でツールを再検出してから、インストーラーをもう一度実行します |
| イメージへのアクセスが拒否される | リポジトリ名とバージョンタグを確認します。プロフェッショナル版またはエンタープライズ版の場合は、提供されたレジストリへのアクセス権も確認します |
| ダウンロードがタイムアウトする | Docker のプロキシ設定と、サーバーからレジストリへのネットワーク接続を確認します。1 つのコマンドでインストールした場合は `--mirror` を使います |
| コンテナが再起動を繰り返す | `docker compose logs --tail=100 studio` を実行し、データベースと設定のエラーを確認します。1 つのコマンドでインストールした場合は `docker compose -f ~/.nocobase-studio/compose.yml logs --tail=100 studio` を実行します |
| 設定ファイルを読み込めない | `config.yml` が、Docker が作成したディレクトリではなく、イメージからコピーしたファイルであることを確認します |
| ストレージに書き込めない | UID 1000 が `storage` に書き込めることを確認します |
| ページやサインインのコールバックが失敗する | `/main/`、`app.publicOrigin`、リバースプロキシを確認します |

継続的な保守については、[アップグレードとバックアップ](../admin/upgrade-and-backup.md) を参照してください。
