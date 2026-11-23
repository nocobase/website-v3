---
title: クイックスタート
---

## 事前準備

Node.js 24+、テンプレートに対応する pnpm、Main と子アプリテンプレートの取得権限を用意します。以下のコマンドは互換パッケージが配布元に公開されていることが前提です。未提供の場合は利用可能な版を取得してください。

開始前に、[商用パッケージの認証済みレジストリーを設定する](../../developing-apps/overview.md#商用パッケージの認証済みレジストリーを設定する)に従って商用レジストリーと読み取りトークンを設定してください。

Main 用に `13230`、ノード用に `13231`、子アプリのローカル開発用に `13240` を空けます。この例は SQLite を使いますが、必要に応じて他の対応データベースを選べます。

例の LAN IP `192.168.1.10` は、すべて自分のマシンのアドレスに置き換えてください。HTTP の手順は管理された内部ネットワーク向けです。公開する場合は先に [HTTPS](nodes.md#https-とリバースプロキシを設定する) を設定します。

## ステップ 1：Main を作成して起動する

プロジェクトの保存先で実行します。

```bash
pnpm create @nocobase/app@beta platform --template multi-app --template-tag beta
cd platform
pnpm nocobase config init --dialect sqlite
pnpm nocobase config set server.host=0.0.0.0 server.port=13230 app.publicOrigin=http://192.168.1.10:13230
```

初回起動前に、専用の初期管理者パスワードを設定します。`config init` は設定を生成しますが、このパスワードの入力は求めません。以下の Bash コマンドは入力を表示せず、履歴にもパスワードを残しません。安全に保存してください。既定のユーザー名は `nocobase` です。生成された暗号鍵と Main のデータベースも保持します。

```bash
read -r -s -p "Main administrator password: " MAIN_ADMIN_PASSWORD
printf '\n'
export MAIN_ADMIN_PASSWORD
pnpm nocobase config set --from-env users.initialAdmin.password=MAIN_ADMIN_PASSWORD
unset MAIN_ADMIN_PASSWORD
```

生成された `config.yml` の `sso` に以下を設定します。同名の YAML キーを重複させないでください。

```yaml
sso:
  insecureRedirectOrigins:
    - http://192.168.1.10:13230
```

これは管理された HTTP origin への子アプリのログインコールバックを許可する、Main 側の設定です。

開発サーバーは `config.yml` とは別にポートを選びます。以下のように `APP_SERVER_PORT` を明示し、表示された URL が `app.publicOrigin` と一致することを確認します。使用中なら、そのポートを空けてください。

```bash
pnpm nocobase config check
APP_SERVER_HOST=0.0.0.0 APP_SERVER_PORT=13230 pnpm dev
```

`http://192.168.1.10:13230/main/` に初期管理者でログインします。**System settings → Deployment management → Runtime nodes** で `local` が利用可能なことを確認します。ノードは Main が自動起動するため、画面から追加しません。

利用できない場合は `13231` の競合、保存先の書き込み権限、Main のログを確認します。ブラウザーにはノード内部ポートではなく Main のポートを使います。

![最初のインスタンスを作る前に、local 実行ノードが利用可能であることを確認します。](/assets/core/multi-app/hd-runtime-nodes.png)

## ステップ 2：子アプリを作成する

Main を起動したまま、別のターミナルでプロジェクトの親ディレクトリに戻ります。

```bash
pnpm create @nocobase/app@beta child-app --template sub-app --template-tag beta
cd child-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config set server.host=0.0.0.0 server.port=13240 app.publicOrigin=http://192.168.1.10:13240
```

起動前に、子アプリのローカル管理者には別のパスワードを設定します。ステップ 1 と同じ Bash の非表示入力を使います。このアカウントは、後でホスト型インスタンス用に生成する管理者とは別です。

```bash
read -r -s -p "Child administrator password: " CHILD_ADMIN_PASSWORD
printf '\n'
export CHILD_ADMIN_PASSWORD
pnpm nocobase config set --from-env users.initialAdmin.password=CHILD_ADMIN_PASSWORD
unset CHILD_ADMIN_PASSWORD
pnpm nocobase config check
APP_SERVER_HOST=0.0.0.0 APP_SERVER_PORT=13240 pnpm dev
```

ターミナルに表示された入口を開き、子アプリ自身の初期管理者でホーム画面を確認します。テンプレートにはデプロイ CLI、プラットフォームログイン、アプリ切り替えが含まれます。プラットフォーム資格情報がないローカル開発では、ローカルログインを使います。

Main と子アプリのデータベース・設定は独立しています。確認後、子アプリの開発プロセスは停止できます。配置するインスタンスはこのプロセスに依存しません。

![子アプリをローカルで起動し、専用の管理者アカウントでログインします。](/assets/core/multi-app/hd-child-local-home.png)

## ステップ 3：子アプリのデプロイ管理を設定する

`child-app` のルートで実行します。

```bash
pnpm nocobase deploy init --server http://192.168.1.10:13230/main --instance dev --id quickstart-child --node local
pnpm nocobase deploy auth
pnpm nocobase deploy validate
pnpm nocobase deploy doctor
```

`init` が `deploy.yml` を生成します。`dev` は設定内のキー、`quickstart-child` は Main 上のインスタンス ID、`local` はノード ID です。Main の URL には `/main` を含めます。

`auth` が開始するブラウザー認証で、デプロイ権限を持つアカウントを使って対象 Main と要求を確認し、承認します。ターミナルで成功を確認してください。これは開発者のデプロイ認可であり、子アプリの SSO とは別です。

既定ではインスタンス管理者を生成し、プラットフォーム SSO を有効にします。続行前に `deploy.yml` の接続先、ID、ノードを確認します。

![プロジェクト CLI の認可を承認してから、ターミナルに戻ります。](/assets/core/multi-app/hd-cli-authorization.png)

## ステップ 4：子アプリをビルドしてデプロイする

```bash
pnpm nocobase deploy artifact upload --build --yes
pnpm nocobase deploy instance plan dev --action create
```

アップロードはバージョンを公開し、初回はアプリパッケージも作成します。ビルドとノードの実行環境が一致しない場合は、CLI の案内に従って再ビルドします。

計画のバージョン、ノード、ID、設定と阻害要因を確認し、返された値で `<planId>` を置き換えます。

```bash
pnpm nocobase deploy instance create dev --plan <planId> --yes --wait
pnpm nocobase deploy instance status dev
```

承認が必要なノードでは、別の権限を持つ管理者が Main で承認します。完了後、**Application instances** で実際のバージョン、実行状態、URL を確認します。

![デプロイしたインスタンスが稼働し、プラットフォーム SSO が有効になっています。](/assets/core/multi-app/hd-instance-overview.png)

## ステップ 5：ログインと業務権限を確認する

インスタンス詳細で **View and save** を選び、初期管理者の資格情報を安全に保存してから保存済みと確認します。その後 Main はパスワードを保持しません。CLI からも取得できません。

![生成された管理者の資格情報を保存してから確認します。画像ではパスワードを非表示にしています。](/assets/core/multi-app/hd-save-initial-admin.png)

**Open application** で `http://192.168.1.10:13230/quickstart-child/` を開き、次を確認します。

1. ログイン済みのプラットフォームユーザーが、追加のパスワード入力なしで子アプリに入れる。
2. アプリ切り替えメニューを開き、Main に戻れる。他のアプリがあれば切り替えも確認する。
3. 一般ユーザーが許可された業務操作だけを実行でき、管理権限を自動取得しない。
4. 子アプリの `/login?auth=local` で保存したローカル管理者が使える。必要な業務ロールは子アプリで設定する。

![アプリ切り替えメニューからプラットフォームのワークベンチへ戻れます。](/assets/core/multi-app/hd-application-switcher.png)

`SSO_REDIRECT_NOT_ALLOWED` は、最初に設定した HTTP origin と実際の URL を照合します。Main の設定変更後は再起動し、元の操作記録から再試行してください。詳しくは [SSO と業務権限](single-sign-on.md)を参照してください。

更新と CI は[子アプリの開発とデプロイ](development.md)へ進んでください。
