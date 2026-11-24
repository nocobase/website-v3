---
title: 子アプリの開発とデプロイ
---

## 子アプリのプロジェクトを作成する

取得権限のある互換テンプレートを使います。

```bash
pnpm create @nocobase/app@beta customer-app --template sub-app --template-tag beta
cd customer-app
pnpm nocobase config init
pnpm nocobase config check
```

`sub-app` はデプロイ CLI と Platform SSO を含む独立プロジェクトです。業務機能は Main が生成するのではなく、[アプリ開発](../../developing-apps/overview.md)の方法で実装します。

## ローカル開発とログイン

[クイックスタート](quickstart.md#ステップ-2子アプリを作成する)に従って専用データベース、公開 URL、初期管理者を設定します。起動時に開発ポートを明示し、表示された URL を確認します。開発用と配置後の管理者は別に初期化します。開発データはアーカイブに含まれません。

```bash
APP_SERVER_HOST=0.0.0.0 APP_SERVER_PORT=13240 pnpm dev
```

プラットフォーム資格情報がなければローカルログインを使います。配置済みインスタンスの SSO 秘密情報をソースや設定例へコピーしないでください。

![子アプリをローカルで起動し、専用の管理者アカウントでログインします。](/assets/core/multi-app/hd-child-local-home.png)

## デプロイ設定を初期化する

```bash
pnpm nocobase deploy init --server https://apps.example.com/main --instance dev --id customer-dev --node local
pnpm nocobase deploy validate
```

子アプリのルートで実行すると `deploy.yml` ができます。URL には Main の base path を含めます。同じファイル内のインスタンスは同じ Main を使います。`validate` はローカルの設定を検証し、Main には接続しません。

## プロジェクト CLI を認可する

```bash
pnpm nocobase deploy auth
pnpm nocobase deploy auth status
pnpm nocobase deploy doctor
```

ブラウザーでデプロイ権限を持つユーザーが承認します。セッションは Main ごとに保存され、`auth logout` で対象 Main のローカルセッションを削除できます。子アプリの業務権限とは別です。

`doctor` は Node.js、設定、Main への接続、認可、ノード、既存アーカイブを確認します。未ビルドなら接続と認可の問題を先に解決し、ビルド後に再確認します。

![プロジェクト CLI の認可を承認してから、ターミナルに戻ります。](/assets/core/multi-app/hd-cli-authorization.png)

## ノードとインスタンスを指定する

SQLite の例です。複数インスタンスも定義できます。

```yaml
version: 1
server: https://apps.example.com/main
build:
  platform: auto
instances:
  dev:
    id: customer-dev
    name: Customer Dev
    node: local
    database:
      dialect: sqlite
    access:
      platformSso: true
    admin: generated
    sampleData: false
    variables: {}
```

`dev` はローカルのキー、`id` は Main 上の ID です。予約済みの `main` は使いません。`node: auto` は画面と同じ推奨規則で選ぶため、実際の選択を計画で確認します。

外部 DB では接続先を分離し、`passwordEnv: CUSTOMER_DB_PASSWORD` のように環境変数名を指定します。`config: ./deploy/dev.config.yml` で設定ファイルを参照し、その秘密値は `${env:NAME}`、変数は `{ env: NAME }` を使います。

`DB_*`、`INITIAL_ADMIN_*`、`PLATFORM_*` や Main 管理の URL を通常の変数で上書きしません。全フィールドは `pnpm nocobase deploy schema` で確認します。

## ビルドしてバージョンを公開する

```bash
pnpm nocobase deploy artifact upload --build --yes
pnpm nocobase deploy artifact list
```

ビルド、検証、アップロード、公開を実行します。パッケージ名は `package.json.name` から取得し、初回に登録します。公開済みバージョンは上書きできないため、コードを変更したらバージョンも更新します。

`--build` は再ビルドを強制します。省略すると既存アーカイブを使うことがあります。開発版は `artifact upload --dev --build --yes` で作成でき、通常の一覧では非表示です。

ターゲットはノードに合わせます。互換性エラーは対応するビルドマシンやターゲットで解決し、メタデータだけを書き換えて回避しません。

## 計画を確認して実行する

```bash
pnpm nocobase deploy instance plan dev --action create
pnpm nocobase deploy instance create dev --plan <planId> --yes --wait
```

`<planId>` は計画が返した値に置き換えます。計画は読み取り専用で、バージョン、ノード、変更、阻害要因を示します。入力やインスタンス状態が変わったら計画を作り直します。

実行後は `instance status dev` と実際のアプリでログイン・業務機能を確認します。承認待ちや結果不明は成功ではありません。

![デプロイ記録でインスタンス、バージョン、ノード、完了した操作を確認します。](/assets/core/multi-app/hd-deployment-detail.png)

## バージョン更新と設定同期

新しいバージョンを公開後、計画を確認します。

```bash
pnpm nocobase deploy instance plan dev --version 0.0.2
```

DB、ファイル、設定のバックアップを確認してから実行します。

```bash
pnpm nocobase deploy instance upgrade dev --version 0.0.2 --plan <planId> --backup-acknowledged --yes --wait
```

実際のバージョンを指定してください。この確認フラグはバックアップを作りません。ダウングレードも実行済み DB マイグレーションを戻しません。

設定変更は `instance plan dev --action config` で確認後、`instance config dev --plan <planId> --backup-acknowledged --yes --wait` で適用します。適用時に再起動します。

CLI は前回の基準、ローカル設定、Main の現状を比較します。Main のみの変更は保持され、同じ項目を両側で変えると `CONFIG_DRIFT_CONFLICT` になります。`instance config dev --from-current` は現状をローカル設定へ書き出すため、自分の変更を保存してから実行し、マージ後に再計画します。

## Agent と CI でデプロイする

Agent はインストール済み `nocobase-deploy-cli` Skill と `pnpm nocobase deploy commands --json` を参照します。認可は二段階です。

```bash
pnpm nocobase deploy auth --start --json
# ユーザーが返された URL で承認した後に実行
pnpm nocobase deploy auth --resume --json
```

CI は秘密ストレージから `NB_DEPLOY_API_KEY` と `NB_DEPLOY_SERVER` を渡します。接続先は `deploy.yml` と一致させ、キーに必要な権限を付けます。自動化では `--json` の `ok`、`error.code`、終了コードを確認します。

| 終了コード | 対応 |
| --- | --- |
| `0` | コマンド完了。必要な業務確認は別途行う |
| `4` | 承認待ち |
| `5` | 計画に阻害要因があり、未送信 |
| `6` | 結果不明。状態と元の操作控えを確認 |
| `7` | 計画が変更されたため再確認 |

結果不明なら `instance status dev --wait --json` から確認します。`storage/deployment/` の操作控えを保持し、同じ入力で元の結果を照会します。ロック削除や入力変更で再送信しません。バックアップ確認、ダウングレード、データ削除は人の明示判断が必要です。
