---
title: Docker でデプロイする
description: アプリを作成して Docker イメージをビルド・転送し、Docker Compose と永続ストレージで初回デプロイと新しいバージョンのデプロイを行います。
---

## 前提条件

開発マシンには Node.js 24 以上、pnpm 11、Docker が必要です。サーバーには Docker と `--wait` に対応する Docker Compose プラグインが必要です。以下は Bash を使い、Linux x64、SQLite、単一インスタンスでデプロイする例です。別のデータベースを使う場合は、イメージのビルド前に対応するドライバーをアプリにインストールし、サーバーで接続を設定してください。

両方のマシンで Docker を、サーバーでは Compose も確認します：

```bash
docker version
docker context show
docker compose version
```

アプリ名と Compose プロジェクト名は `my-app`、サーバーのポートは `13000` を使います。複数のアプリを配置する場合は、それぞれ別のプロジェクト名、デプロイ先ディレクトリ、ポートを使ってください。マウント元のディレクトリは、Docker デーモンが動作するサーバー上に必要です。

## エージェントを使う

アプリのソースディレクトリで開発用エージェントを使います。まだアプリがない場合は、先に[アプリを作成してディレクトリに移動](#アプリを作成してディレクトリに移動する)してください。エージェントによるデプロイと手動コマンドは、どちらか一方を選びます。

エージェントが対象サーバーに接続でき、Docker を操作できるようにしておきます。イメージレジストリを使う場合は先にログインを設定してください。パスワードや認証情報は安全な方法で提供し、プロンプトには書きません。アプリ付属の `AGENTS.md` と `nocobase-deployment` Skill に、そのバージョンに対応するデプロイ手順があります。

### 初回デプロイ

サーバー、ディレクトリ、URL を自分の環境に置き換えます。データベースは新しい SQLite を使うか、外部データベースの接続要件を指定してください。イメージの転送はレジストリまたはファイルを選びます。

```text
現在のアプリを Docker で私のサーバーにデプロイしてください。初回のデプロイです。

サーバー：<SSH ユーザーとアドレス>
デプロイ先：<サーバー上の絶対パス>
アクセス URL：<アプリのパスを含む完全な URL>
データベース：新しい SQLite。開発データやサンプルデータは取り込まない
イメージの転送：ファイルに書き出して SSH でサーバーに転送する

管理者のサインインを設定し、コンテナを作り直しても使えるように設定と業務データをサーバーに保存してください。
デプロイ後にサインインと主要な業務操作を確認し、コンテナを作り直してデータが残ることを確認してください。アクセス URL と確認結果を教えてください。
```

レジストリを使う場合は、転送の要件を「`<レジストリのアドレス>` を通じてイメージをプッシュ・プルする」に変更します。ドメインと HTTPS を使う場合は、既存のプロキシ設定や必要な設定を伝えてください。サーバーのアーキテクチャ、空きポート、Docker 環境はエージェントが確認できます。

完了後は[アクセスと永続性の確認](#アクセスとデータの永続性を確認する)に従って結果を確認します。サーバーに接続できないエージェントは設定とコマンドを準備できますが、実際のデプロイはサーバーで行う必要があります。

### 新しいバージョンをデプロイする

コードを更新し、テストを通したアプリのソースディレクトリで、次のプロンプトを使います。停止してよい時間帯を明示してください。確認、バックアップ、切り替えは元のデプロイ環境で行います。

```text
現在のプロジェクトの新しいバージョンをサーバーにデプロイし、稼働中のバージョンを置き換えてください。

サーバー：<SSH ユーザーとアドレス>
元のデプロイ先：<サーバー上の絶対パス>
Compose プロジェクト名：<元のプロジェクト名>
新しいイメージタグ：<例：my-app:2>
停止可能な時間帯：<メンテナンス時間帯>

既存のイメージ転送方法、URL、設定、シークレット、業務データを引き継ぎ、再初期化しないでください。
バージョンの変更内容を確認してバックアップを取ってから更新してください。更新後は既存データ、ユーザー権限、新機能を確認し、結果を教えてください。失敗した場合は、復元できるか、データにどのような影響があるかを説明してください。
```

エージェントが[変更内容の確認とバックアップ](#バージョンの変更内容を確認してバックアップする)を完了したことを確かめ、[新しいバージョンの確認](#新しいバージョンを起動して確認する)に従って結果を確認します。ロールバックにはデータベースの互換性確認が必要です。古いイメージに戻すだけではデータは復元されません。

## 手動でデプロイする

### アプリを作成してディレクトリに移動する

開発マシンで実行します：

```bash
pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
```

既存のアプリでは、そのソースディレクトリに移動します。ビルド前にアプリのテストが通ることを確認し、付属の `Dockerfile`、`Dockerfile.dockerignore`、`config.example.yml`、ロックファイルを保持してください。古いプロジェクトに Docker ファイルがない場合は、互換性のあるバージョンのアプリテンプレートから追加します。

### Docker イメージをビルドする

アプリのルートで実行します：

```bash
docker build --platform linux/amd64 -t my-app:1 .
```

Dockerfile が依存関係のインストールとアプリのビルドを行うため、先に `pnpm build` を実行する必要はありません。ARM64 サーバーでは `linux/arm64` を指定します。

イメージにはコードと本番用の依存関係が入り、開発環境の設定、データベース、アップロードファイルは入りません。ローカルの設定とデータを除外する `Dockerfile.dockerignore` を Dockerfile と一緒に保持してください。実行時の設定はサーバーで別途用意します。

### レジストリまたはファイルでイメージを転送する

どちらかの方法を選びます。同じ Docker サーバーでビルドして実行する場合、この手順は不要です。

**イメージレジストリを使う**

`registry.example.com/team` を自分のレジストリに置き換え、開発マシンで実行します：

```bash
docker tag my-app:1 registry.example.com/team/my-app:1
docker login registry.example.com
docker push registry.example.com/team/my-app:1
```

サーバーで実行します：

```bash
docker login registry.example.com
docker pull registry.example.com/team/my-app:1
docker tag registry.example.com/team/my-app:1 my-app:1
```

最後のコマンドでローカルタグを追加するため、以降は `my-app:1` を使えます。レジストリを含む完全な名前を使う場合は、以降のコマンドと Compose のイメージ名も置き換えてください。

**イメージファイルを使う**

`deploy@server` をサーバーの SSH ユーザーとアドレスに置き換え、開発マシンで実行します：

```bash
docker save -o my-app-1.tar my-app:1
scp my-app-1.tar deploy@server:/tmp/my-app-1.tar
```

サーバーで実行します：

```bash
docker load -i /tmp/my-app-1.tar
```

`docker save` が保存するのはイメージであり、業務データのバックアップではありません。

### サーバーにデプロイ先ディレクトリを作成する

ここからはすべてサーバーで実行します。初回デプロイには新しいディレクトリを使います：

```bash
mkdir -p "$HOME/my-app-deploy/storage"
cd "$HOME/my-app-deploy"
sudo chown 1000:1000 . storage
```

テンプレートのコンテナは UID `1000` の `node` ユーザーで動作します。設定の初期化にはデプロイ先ディレクトリへの書き込み権限、実行時には `storage/` への書き込み権限が必要です。上のコマンドは新しいデプロイ先と storage ディレクトリだけの所有者を変更し、ほかのファイルを再帰的に変更しません。

### 設定を初期化して管理者パスワードを設定する

イメージ内の CLI を使い、現在のディレクトリに `config.yml` を生成します：

```bash
docker run --rm \
  --mount "type=bind,src=$PWD,dst=/config" \
  my-app:1 \
  node dist/cli/index.js config init \
  --dialect sqlite \
  --config /config/config.yml
```

初期管理者パスワードを設定します：

```bash
read -r -s -p 'Initial admin password: ' MY_APP_ADMIN_PASSWORD
export MY_APP_ADMIN_PASSWORD

docker run --rm \
  -e MY_APP_ADMIN_PASSWORD \
  -e APP_CONFIG_FILE=/config/config.yml \
  --mount "type=bind,src=$PWD,dst=/config" \
  my-app:1 \
  node dist/cli/index.js config set \
  --from-env users.initialAdmin.password=MY_APP_ADMIN_PASSWORD

unset MY_APP_ADMIN_PASSWORD
```

テンプレートの管理者ユーザー名は既定で `nocobase` です。初期管理者の設定はユーザーテーブルが空の場合にだけ適用され、既存アカウントのパスワードをリセットするものではありません。

生成した `config.yml` を保持してください。アプリのシークレットをデータベースと合わせてバックアップし、バックアップへのアクセスを制限します。再起動や新しいバージョンのデプロイ時に設定を再初期化しないでください。実行用イメージに pnpm はなく、管理コマンドには `node dist/cli/index.js` を使います。

### Docker Compose ファイルを作成する

デプロイ先に `docker-compose.yml` を作成します。ディレクトリの所有者をコンテナユーザーに変更したため、`sudo tee` で書き込みます：

```bash
sudo tee docker-compose.yml > /dev/null <<'YAML'
services:
  app:
    image: my-app:1
    init: true
    restart: unless-stopped
    ports:
      - '13000:13000'
    environment:
      APP_BASE_PATH: /main
      APP_PUBLIC_ORIGIN: http://YOUR_SERVER_IP:13000
      APP_SAMPLE_DATA: 'false'
    volumes:
      - type: bind
        source: ./config.yml
        target: /app/config.yml
        read_only: true
        bind:
          create_host_path: false
      - type: bind
        source: ./storage
        target: /app/storage
        bind:
          create_host_path: false
YAML
```

`sudoedit docker-compose.yml` を実行し、`YOUR_SERVER_IP` を実際のサーバー IP に置き換えます。ディレクトリは次の構成になります：

```text
my-app-deploy/
├── docker-compose.yml
├── config.yml
└── storage/
```

設定は読み取り専用でマウントされ、データベースとアップロードファイルは書き込み可能な `storage/` に保存されます。`create_host_path: false` により、設定ファイルや保存先がない場合に空のディレクトリを作らずエラーになります。`APP_SAMPLE_DATA: 'false'` は初回インストール時の任意のサンプルデータを無効にします。

`APP_PUBLIC_ORIGIN` は公開するプロトコル、ホスト、ポートで、アプリのパスを含みません。パスは `APP_BASE_PATH` で指定します。この例はサーバーの `13000` ポートを直接公開するため、ファイアウォールやセキュリティグループでアクセスを許可してください。

ドメインと HTTPS を使う場合は、origin を `https://apps.example.com` などの実際のアドレスに変更します。リバースプロキシで `/main/` を転送し、Host とプロトコルのヘッダーを保持し、Cookie と WebSocket を扱えるように設定してください。プロキシが同じホストで動作する場合、ポートを `127.0.0.1:13000:13000` にしてローカルのプロキシだけが接続できるようにできます。

### 設定を確認してアプリを起動する

デプロイ先ディレクトリで実行します：

```bash
docker compose -p my-app config --quiet

docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p my-app up -d --wait --wait-timeout 180
```

最初の 2 つのコマンドは Compose とアプリの設定、データベース接続を確認し、マイグレーションは実行しません。既定の設定では、アプリの起動時にマイグレーションと初期データの投入が行われます。自動マイグレーションや自動シードを無効にしたアプリでは、そのデプロイルールに従って先に個別に実行してください。

状態とログを確認します：

```bash
docker compose -p my-app ps
docker compose -p my-app logs --tail=100 app
```

`--wait` はイメージのヘルスチェックが成功するまで待ちます。タイムアウトや unhealthy の場合は、ログでデータベース接続、権限、マイグレーションのエラーを確認してください。

### アクセスとデータの永続性を確認する

実際のサーバー IP に置き換え、ヘルスエンドポイントを確認します：

```bash
curl --fail http://YOUR_SERVER_IP:13000/main/api/healthz
```

`ok: true` を確認してから `http://YOUR_SERVER_IP:13000/main/` を開き、`nocobase` と設定したパスワードでサインインします。リバースプロキシを使う場合は実際のドメインで確認してください。

ページの再読み込み、管理者と一般ユーザーの権限、レコードの作成と取得などの業務操作を確認します。ファイルストレージを使うアプリでは、アップロードとダウンロードも確認してください。その後、コンテナを作り直します：

```bash
docker compose -p my-app up -d \
  --force-recreate \
  --wait \
  --wait-timeout 180
```

再度サインインし、同じレコード、ファイル、権限が残っていることを確認します。定期実行ジョブを使う場合は、ジョブが引き続き動作することも確認してください。ヘルスチェックの成功だけでは、これらの業務確認の代わりにはなりません。

## 新しいバージョンを手動でデプロイする

### 新しいイメージをビルドして転送する

開発マシンでアプリのコードを更新して検証した後、ソースディレクトリで新しいタグのイメージをビルドします：

```bash
docker build --platform linux/amd64 -t my-app:2 .
```

[イメージの転送手順](#レジストリまたはファイルでイメージを転送する)に従い、タグ `1` を `2` に、ファイル名 `my-app-1.tar` を `my-app-2.tar` に置き換えて転送します。レジストリを使う場合もローカルタグ `my-app:2` を追加してください。

### バージョンの変更内容を確認してバックアップする

新しいバージョンのマイグレーション、設定変更、アップグレードの説明を先に確認します。元のデプロイ先、設定、シークレット、データを保持し、`config init` は実行しません。

以下の停止中のバックアップは、データベースとローカルファイルの両方が `storage/` にある SQLite 環境向けです。外部データベースやオブジェクトストレージは、それぞれの方法でバックアップし、設定やファイルと同じ復元時点にそろえてください。

サーバーで実行します：

```bash
cd "$HOME/my-app-deploy"
docker compose -p my-app stop

mkdir -p "$HOME/my-app-backups"
chmod 700 "$HOME/my-app-backups"

sudo tar -czf \
  "$HOME/my-app-backups/my-app-$(date +%Y%m%d-%H%M%S).tar.gz" \
  config.yml storage docker-compose.yml
```

バックアップの成功を確認し、設定、storage、Compose ファイルがアーカイブに含まれることを調べてから続行します。古いイメージを残し、バックアップの復元方法も確認してください。

### イメージタグを更新してマイグレーションを確認する

`sudoedit docker-compose.yml` で `image: my-app:1` を `image: my-app:2` に変更し、マウント先はそのままにします。新しい設定が必要な場合は元の `config.yml` を更新し、コンテナユーザーが引き続き読めるようにしてください。

新しいイメージで確認します：

```bash
docker compose -p my-app config --quiet

docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js db apply --dry-run --json

docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js db repair --dry-run --json
```

データベースのコマンドは既定の接続を確認します。複数のデータベースを使うアプリでは、ほかの関連する接続も確認してください。実行予定のマイグレーションとシードが想定どおりか確認します。過去のマイグレーションのチェックサム変更が報告された場合は、単に `--dry-run` を外して修復せず、対象バージョンのアップグレード手順に従ってください。

### 新しいバージョンを起動して確認する

```bash
docker compose -p my-app up -d --wait --wait-timeout 180

docker compose -p my-app ps
docker compose -p my-app logs --tail=100 app
```

既定の設定では、起動時に新しいマイグレーションを適用します。元の URL からサインインし、既存レコード、ファイル、権限、新機能、バックグラウンドジョブを確認してください。新しいバージョンが使えると確認できるまで、バックアップと古いイメージを保持します。

### ロールバック時のデータを扱う

イメージタグを戻しても、置き換わるのはコードだけです。マイグレーションや新しいバージョンのデプロイ後の業務データの書き込みは元に戻りません。古いバージョンが現在のデータベースと互換性を持つか確認してから、イメージだけを切り替えられるか判断します。

復元が必要な場合は、先にアプリを停止し、新しいバージョンのデプロイ前のデータベース、ファイル、設定、イメージのバージョンを組み合わせて復元してください。新しいバージョンのデプロイ前のバックアップに戻すと、それ以降の業務データの書き込みは失われます。データを失わずに戻せる操作とは異なります。

## アプリを停止して起動する

元のデプロイ先ディレクトリで実行します：

```bash
cd "$HOME/my-app-deploy"

# Stop and remove the containers; keep host configuration and data.
docker compose -p my-app down

# Start again with the same configuration and data.
docker compose -p my-app up -d --wait --wait-timeout 180
```

設定ファイルや Compose の環境変数を変更した場合は、コンテナを作り直して設定とマウントを読み込み直します：

```bash
docker compose -p my-app up -d --force-recreate --wait --wait-timeout 180
```

`docker restart` だけでは新しいコンテナの環境変数は反映されません。設定ツールがファイルを置き換えた場合、既存コンテナの単一ファイルマウントが古いファイルを指したままになることもあります。

## よくある問題

| 現象 | 対処 |
| --- | --- |
| 設定ファイルやマウント先がない | サーバーのデプロイ先を確認し、`config.yml` を生成して `storage/` を作成します。 |
| `permission denied` / `EACCES` | UID 1000 が設定を読み、storage に書き込めるようにします。設定の初期化にはデプロイ先への書き込み権限も必要です。 |
| ホストのポートが使用中 | `ports` の左側のホストポートを変更します。そのポートに直接アクセスする場合は `APP_PUBLIC_ORIGIN` も更新します。 |
| コンテナが unhealthy またはタイムアウト | `ps` と `logs` でデータベース、マイグレーション、ファイル権限、アプリのパスを確認します。 |
| コンテナは healthy だが別の端末からアクセスできない | サーバー IP、ポートマッピング、ファイアウォール、セキュリティグループを確認します。ドメインを使う場合はプロキシ、DNS、HTTPS も確認します。 |
| サインイン後のリダイレクト先が違う | `APP_PUBLIC_ORIGIN` と `APP_BASE_PATH` を実際の URL に合わせ、コンテナを作り直します。 |
