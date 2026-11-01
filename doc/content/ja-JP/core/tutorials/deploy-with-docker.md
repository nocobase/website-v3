---
title: Docker でデプロイする
description: イメージをビルドして本番アプリを独立してデプロイし、Docker Compose で設定とデータを保ちます。
---

このガイドでは製品カタログのアプリを実例として使いますが、自分の NocoBase Core のアプリにも当てはまります。対象の環境は [デプロイ方法を選ぶ](../deployment/choose-a-deployment-method.md) で確認してください。自分のプロジェクトでは、例のアプリ名、パス、業務の検収のチェックを置き換えます。

アプリ自身の `Dockerfile` でイメージをビルドし、本番のサーバーで Docker Compose を使って動かします。設定、SQLite、アップロードされたファイルには、それぞれ別の永続化されたディレクトリを使います。アプリがテストに合格していることを確認してください。製品カタログの例については [製品カタログのサンプルの README](https://github.com/nocobase/docs-examples-v3/blob/b24857f529ae5bb80e97a881b846ea2fd1424242/apps/product-catalog/README.md) を参照してください。このガイドでは、Linux x64、単一の SQLite のインスタンス、テンプレートの Node.js 24 の Debian のランタイムを使います。

## 前提条件

```bash
docker version
docker compose version
docker context show
```

コマンドは Bash を使います。サーバーには、`--wait` に対応した Compose プラグインが必要です。バインドマウントの元のパスは、リモートの Docker コンテキストにコマンドを送るマシンではなく、Docker サーバー上に存在する必要があります。このチュートリアル用に、独立したプロジェクト名、ディレクトリ、使われていないホストのポートを選んでください。

この例は既定のテンプレート `1.0.0-beta.85` を使い、上の固定コミットの README がそのソースとセットアップを説明しています。以下の設定では任意のサンプルを無効にしています。必要なロールは初期化されますが、製品カタログは空の状態で始まります。確認の手順で製品を作成してください。

## エージェントを使う場合

アプリのソースのディレクトリで、下のサーバー、ディレクトリ、URL を実際の対象に置き換えます。

```text
現在の製品カタログのアプリを、初めて Docker でデプロイしてください。

サーバー：<my Docker server>
サーバーのプラットフォーム：linux/amd64
デプロイ先のディレクトリ：<absolute server path>/catalog-docker
データベース：新しい SQLite のデータベース。開発中のデータやサンプルの製品は含めない
サーバー内の待ち受け：127.0.0.1:13000
ユーザー向けの URL：https://shop.example.com/shop/

プロジェクトの Docker のデプロイのガイダンスに従い、このチュートリアルのアプリだけを操作してください。
コンテナを作り直しても残るよう、設定、パスワード、業務データはイメージから分けてください。
管理者のサインインを設定し、アプリのシークレットはコードやレポートに出さずに保持してください。
必要な設定やストレージが足りない場合は、空のデータのまま黙って起動するのではなく、問題を説明してください。

サインイン、製品の作成と公開、閲覧者の権限を確認してから、このアプリのコンテナを作り直し、元のデータと権限が残っていることを確認してください。
URL、確認の結果、ドメインや HTTPS など未完了の設定を報告してください。
```

DNS、HTTPS、リバースプロキシは別に設定します。ローカルでのリハーサルでは、オリジンを `http://127.0.0.1:13000` に置き換えます。

## エージェントを使わない場合

### 1. 開発マシンでイメージをビルドする

```bash
pnpm build --target linux-x64 --node-version 24

docker build --platform linux/amd64 \
  --build-arg DIST=prebuilt \
  -t catalog-app:1 .
```

Docker が読むのは `dist/` で、`dist.tar.gz` ではありません。app-installer 用のアーカイブも必要な場合は、アプリのビルドに `--tar` を付けます。`linux-x64` は Docker の `linux/amd64` に対応し、glibc を使います。ARM64 の対象には、`linux-arm64` と `linux/arm64` の両方が必要です。Node のメジャーバージョンは Dockerfile と一致している必要があります。

`Dockerfile.dockerignore` は残してください。ローカルの設定、データベース、開発用の依存関係を除外しています。ビルド済みの段階では、プラットフォーム、Node のメジャーバージョン、再配置可能性が検証されます。それらのチェックを回避するのではなく、一致しないビルドのパラメーターを修正してください。

イメージはレジストリで転送するか、書き出します。

```bash
# Development machine
docker save -o catalog-app-1.tar catalog-app:1
scp catalog-app-1.tar deploy@server:/tmp/catalog-app-1.tar
```

サーバーで次を実行します。

```bash
docker load -i /tmp/catalog-app-1.tar
```

必要に応じて、転送の前後で `docker image inspect catalog-app:1 --format '{{.Id}}'` を比較します。イメージのアーカイブはデータのバックアップではありません。以降のコマンドは Docker サーバーで実行します。ローカルでのリハーサルでは転送は不要です。

### 2. 永続化するストレージと設定を準備する

```bash
mkdir -p "$HOME/catalog-docker/config" "$HOME/catalog-docker/storage"
cd "$HOME/catalog-docker"
```

このインストールには新しいディレクトリを使います。テンプレートのコンテナは UID 1000（`node`）で動作し、マウントに書き込める必要があります。必要に応じて、管理者がこれらのディレクトリの所有者だけを調整します。たとえば `sudo chown 1000:1000 config storage` です。

イメージの CLI で設定を生成します。

```bash
docker run --rm \
  --mount "type=bind,src=$PWD/config,dst=/config" \
  catalog-app:1 \
  node dist/cli/index.js config init --dialect sqlite --config /config/config.yml
```

初回の起動の前に、管理者のパスワードを設定します。

```bash
read -r -s -p 'Initial admin password: ' CATALOG_INITIAL_PASSWORD
export CATALOG_INITIAL_PASSWORD

docker run --rm \
  -e CATALOG_INITIAL_PASSWORD \
  -e APP_CONFIG_FILE=/config/config.yml \
  --mount "type=bind,src=$PWD/config,dst=/config" \
  catalog-app:1 \
  node dist/cli/index.js config set \
  --from-env users.initialAdmin.password=CATALOG_INITIAL_PASSWORD

unset CATALOG_INITIAL_PASSWORD
```

生成された設定と固定のシークレットは、アクセスを制限したバックアップで保持してください。再起動のたびに生成し直さないでください。初期管理者の設定は、ユーザーのテーブルが空のときにだけ適用されます。

### 3. compose.yml を作成する

```yaml
services:
  app:
    image: catalog-app:1
    init: true
    restart: unless-stopped
    ports:
      - '127.0.0.1:13000:13000'
    environment:
      APP_BASE_PATH: /shop
      APP_PUBLIC_ORIGIN: https://shop.example.com
      APP_SAMPLE_DATA: 'false'
    volumes:
      - type: bind
        source: ./config/config.yml
        target: /app/config.yml
        read_only: true
        bind:
          create_host_path: false
      - type: bind
        source: ./storage
        target: /app/storage
        bind:
          create_host_path: false
```

オリジンにはベースパスを含めません。コンテナは `0.0.0.0:13000` で待ち受け、ホストはループバックにだけ公開します。公開の HTTPS、パスの転送、WebSocket のアップグレードはリバースプロキシが扱います。ループバックでのリハーサルでは、対応する HTTP のオリジンを設定し、`http://127.0.0.1:13000/shop/` を開きます。

`create_host_path: false` を指定すると、マウントの元がない場合に、誤った空のディレクトリを黙って作るのではなく失敗します。動作中のコンテナでは設定は読み取り専用で、SQLite、アップロード、そのほかの永続的な内容は書き込み可能なストレージを使います。

### 4. 検証して起動する

```bash
docker compose -p catalog-app config --quiet

docker compose -p catalog-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p catalog-app up -d --wait --wait-timeout 180

docker compose -p catalog-app ps
docker compose -p catalog-app logs --tail=80 app
curl --fail http://127.0.0.1:13000/shop/api/healthz
```

`--wait` は、イメージのヘルスチェックを待ちます。タイムアウトした場合は、コンテナを何度も作り直すのではなく、状態とログを調べてください。設定のチェックは起動の前に行われ、実際のマイグレーションと必要な初期化はアプリの起動時に行われます。

`ok: true`、期待どおりのベースパス、マイグレーションやデータベースのエラーがないことを確認します。既定のユーザー名 `nocobase` と、新しく設定したパスワードでサインインします。製品カタログのサンプルアプリは、必須のシードで **Catalog viewer** と **Catalog editor** のロールを初期化します。開発中のユーザー、ロールの割り当て、製品はイメージと一緒にはコピーされません。実際の公開 URL もテストしてください。コンテナが正常でも、ドメイン、HTTPS、プロキシが検証されたことにはなりません。

### 5. 作り直したあとの永続性を確認する

管理者としてサインインし、`/shop/api/swagger/docs` を開きます。**Products** で `priceCents: 1200` の `Deployment Notebook` を作成し、その ID を控えてから、公開のエンドポイントを呼び出します。操作ごとに新しい `Idempotency-Key` を使います。[作成と公開](https://github.com/nocobase/docs-examples-v3/blob/b24857f529ae5bb80e97a881b846ea2fd1424242/apps/product-catalog/README.md#create-and-publish) を参照してください。`/shop/catalog` に表示されることを確認します。この公開カタログには公開済みの製品が表示され、作成は API ドキュメントで行います。このプロジェクトだけを作り直します。

```bash
docker compose -p catalog-app up -d --force-recreate --wait --wait-timeout 180
```

もう一度サインインして同じ製品の ID を照会し、名前、価格、公開状態を確認してから、`/shop/catalog` を再読み込みします。管理者や **Catalog editor** のアクセスを持たない一般ユーザーに、明示的に **Catalog viewer** を割り当てます。製品の読み取りと CSV のダウンロードは成功し、作成と公開のリクエストは `403` を返すことを確認します。

リハーサルを止めるには、このディレクトリで `docker compose -p catalog-app down` を実行します。ホストの設定とストレージは残ります。もう一度始めるには `up` を使い、設定の初期化は再実行しないでください。

## 新しいリリースを公開する

`catalog-app:2` などの新しいイメージのタグをビルドし、サーバーに転送します。概要は [アプリのリリースを公開する](../deployment/publish-app-release.md) を参照してください。データベース、ファイル、設定をバックアップしてから、マウントとシークレットは保ったまま、イメージの参照だけを変更します。

既存のインストールに対して、新しいイメージを確認します。

```bash
docker compose -p catalog-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p catalog-app run --rm --no-deps app \
  node dist/cli/index.js db apply --dry-run --json

docker compose -p catalog-app run --rm --no-deps app \
  node dist/cli/index.js db repair --dry-run --json
```

これらのチェックで別のアプリのサービスが起動することはありません。保留中のマイグレーションと過去のチェックサムを確認し、バックアップを確かめてから、`docker compose -p catalog-app up -d --wait --wait-timeout 180` を実行します。起動時に新しいマイグレーションが適用されます。古いレコード、ロール、新しい機能を確認してください。古いイメージに戻してもコードが変わるだけで、データベースのマイグレーションや書き込みは元に戻りません。

エージェントを使う場合は、既存のディレクトリ、Compose のプロジェクト名、新しいタグを伝え、同じ確認と保持のチェックを求めてください。新しい設定を初期化させないでください。

設定を変更したあとも、コンテナを作り直します。ツールが設定ファイルをアトミックに置き換えると、古い単一ファイルのマウントが以前の inode を指したままになることがあります。コンテナを作り直すと、マウントし直されます。Compose の環境変数を変更した場合も作り直しが必要です。`docker restart` では新しい環境変数は反映されません。

## トラブルシューティングと検証の範囲

| 症状 | 確認すること |
| --- | --- |
| バインドの元がない | サーバーのディレクトリが正しいこと、設定が生成され、ストレージがあること |
| `EACCES` | UID 1000 が設定を読み、ストレージに書き込めること |
| ホストのポートが使用中 | 別のホストのポートを選び、直接アクセスするオリジンを更新する |
| 異常またはタイムアウト | プロジェクトのログ、データベース、マイグレーション、ベースパス |

製品カタログの例は、Linux x64、Node.js 24、SQLite で確認しています。ビルド済みのイメージ、設定の初期化、独自のパスワード、Compose のヘルスチェックの待機、ネイティブのログイン、製品の作成と公開、CSV のダウンロード、匿名での管理のリクエストの拒否、コンテナを作り直しても同じ製品とパスワードが保たれることです。ロールに基づく読み書きの制限は、実際のアプリのテストで別に網羅しています。サーバー間の転送、公開の HTTPS とプロキシの設定、バージョンをまたぐデプロイとロールバックは試していません。
