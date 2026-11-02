---
title: Docker でデプロイする
description: Agent に Docker アプリのビルドとデプロイを依頼し、設定とデータの永続化を確認します。
---

## アプリ、サーバー、アクセス先を準備する

<a id="前提条件"></a>

テスト済みのソースと対象コミットを用意します。ビルド環境には Docker、実行サーバーには Docker と `--wait` 対応の Compose プラグインが必要です。Docker context が指すマシンを確認してください。マウント元は daemon が動くサーバー上に必要です。

デプロイ先ディレクトリ、CPU、空きポート、公開 URL を伝えます。プロキシではアプリのパス、Cookie、WebSocket を転送し、Host とプロトコルのヘッダーを保持します。設定と `storage` はイメージ外に保存します。テンプレートコンテナの UID 1000 に設定の読み取りとデータの書き込み権限を与えます。

## Agent にデプロイ要件を伝える

<a id="エージェントを使う場合"></a>

アプリのソースディレクトリで、次の内容を実際の値に置き換えて伝えます。

```prompt
このアプリを Docker で <サーバー> の <新しいデプロイ先> に配置し、<URL> から使えるようにしてください。新しいデータベースで始め、開発データは取り込みません。設定とデータは別に保存し、コンテナを作り直しても使えるようにしてください。まず配置計画を示し、私の確認を待ってから実行してください。
```

既存データが必要な場合は、新しいデータベースという条件を変更し、バックアップと復元先を指定します。

## デプロイ計画を確認する

コミット、イメージタグ、対象 CPU、Node のメジャーバージョン、ディレクトリ、ポート、データベース、マウント先を確認します。管理者設定と鍵の保管方法、ドメイン・HTTPS・プロキシの担当も決めます。

`APP_PUBLIC_ORIGIN` はスキームとホストのみ、`APP_BASE_PATH` はアプリのパスです。選択したストレージが永続化されることを確認してから起動を許可します。

## Agent にビルドとデプロイを依頼する

アプリ付属の `Dockerfile` と `Dockerfile.dockerignore` を使い、ソースからビルドするか、対象に合った `dist/` を格納してもらいます。prebuilt は Linux/glibc、CPU、Node のメジャーバージョンと relocatable マーカーを確認します。

初回のみ設定を生成して管理者パスワードを設定し、その後は設定と鍵を保持します。Compose、設定、データベース接続を確認してから起動し、ヘルスチェックを待ちます。別サーバーに転送する場合は前後のイメージ ID を比較します。イメージのエクスポートには業務データは含まれません。

## アクセスとデータの永続化を確認する

実際の URL でログインし、識別できるレコードを作成して ID を記録します。一般ユーザーの読み書き権限を確認し、ファイルを使う場合はアップロードとダウンロードも試します。商品カタログの操作は[サンプルの説明](https://github.com/nocobase/docs-examples-v3/blob/51658852e7290b0ed3c0735d2856681850560efb/apps/product-catalog/README.md#create-and-publish)を参照してください。

同じ Compose プロジェクトのコンテナを作り直してもらい、再ログインして同じレコードとファイルを確認します。マウントと鍵が変わらず、プロキシ経由の更新、API、リアルタイム接続が動くことを確認します。以降の変更は[更新と復旧](publish-app-release.md)に従います。

## 手動デプロイの参考

<a id="エージェントを使わない場合"></a>
<a id="1-開発マシンでイメージをビルドする"></a>
<a id="2-永続化するストレージと設定を準備する"></a>
<a id="3-composeyml-を作成する"></a>
<a id="4-検証して起動する"></a>
<a id="5-作り直したあとの永続性を確認する"></a>

以下は Bash、Linux x64/glibc、Node.js 24、SQLite、ローカルの `/shop` URL を使う例です。自分のアドレスと導入済みドライバーに合わせて変更します。最初に `docker version`、`docker compose version`、`docker context show` を確認します。

アプリのソースディレクトリでビルドします。
```bash
pnpm build --target linux-x64 --node-version 24
docker build --platform linux/amd64 --build-arg DIST=prebuilt -t my-app:1 .
```

ソースから直接 `docker build --platform linux/amd64 -t my-app:1 .` でもビルドできます。ARM64 では `linux-arm64` と `linux/arm64` の両方に変更します。転送にはレジストリ、または `docker save -o my-app-1.tar my-app:1` を使い、コピー後にサーバーで `docker load -i my-app-1.tar` を実行します。

サーバー上の新しいデプロイ先で設定を生成します。先にディレクトリ管理者が、このアプリの `config` と `storage` のみ UID 1000 で書き込めるようにします。
```bash
mkdir -p config storage
# Run in the new deployment directory on the Docker server.
docker run --rm --mount "type=bind,src=$PWD/config,dst=/config" my-app:1 \
  node dist/cli/index.js config init --dialect sqlite --config /config/config.yml
read -r -s -p 'Initial admin password: ' APP_INITIAL_PASSWORD
export APP_INITIAL_PASSWORD
docker run --rm -e APP_INITIAL_PASSWORD -e APP_CONFIG_FILE=/config/config.yml \
  --mount "type=bind,src=$PWD/config,dst=/config" my-app:1 \
  node dist/cli/index.js config set --from-env users.initialAdmin.password=APP_INITIAL_PASSWORD
unset APP_INITIAL_PASSWORD
```

`compose.yml` として保存します。
```yaml
services:
  app:
    image: my-app:1
    init: true
    restart: unless-stopped
    ports:
      - '127.0.0.1:13000:13000'
    environment:
      APP_BASE_PATH: /shop
      APP_PUBLIC_ORIGIN: http://127.0.0.1:13000
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

公開 URL が `https://apps.example.com/shop/` なら origin を `https://apps.example.com` に変更し、プロキシを別途設定します。長いマウント記法は存在しないパスを拒否し、意図しない空ディレクトリの使用を防ぎます。

同じデプロイ先で確認、起動、再作成を行います。
```bash
docker compose -p my-app config --quiet
docker compose -p my-app run --rm --no-deps app node dist/cli/index.js config check --connect
docker compose -p my-app up -d --wait --wait-timeout 180
curl --fail http://127.0.0.1:13000/shop/api/healthz
docker compose -p my-app up -d --force-recreate --wait --wait-timeout 180
```

ヘルスエンドポイントは `ok: true` と正しい base path を返すことを確認します。初期管理者名の既定値は `nocobase`、パスワードは設定した値です。再作成前後に上記のデータ確認を行います。演習終了時は `docker compose -p my-app down` を使い、設定とデータのディレクトリは保持します。

設定変更、バックアップ、ログ、障害対応は[日常の保守とトラブルシューティング](maintenance-and-troubleshooting.md)を参照してください。

<a id="新しいリリースを公開する"></a>

[更新と復旧](publish-app-release.md)

<a id="トラブルシューティングと検証の範囲"></a>

[日常の保守とトラブルシューティング](maintenance-and-troubleshooting.md)

> [!NOTE]
> これらの Docker コマンドの実行検証は未完了です。公開前に Docker ホストでイメージのビルド、コンテナの再作成、復旧を演習してください。
