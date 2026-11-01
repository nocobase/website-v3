---
title: PM2 でデプロイする
description: Agent に app-installer でのインストールを依頼し、PM2 管理と再起動後のデータを確認します。
---

## アプリとサーバーを準備する

<a id="前提条件"></a>

開発マシンにテスト済みのソース、ロックファイル、pnpm を用意します。サーバーには Node.js 24、PATH 上で使える PM2 4.3 以降、tar、固定のサービスアカウントが書き込める新しいディレクトリが必要です。以後の管理も同じアカウントで行います。

OS、CPU、libc とビルド対象を合わせ、必要なデータベースドライバーをアプリに含めます。空きポート、URL、データベース、ファイル保存先を伝えます。プロキシと HTTPS はサーバー側で設定します。

npx を実行するマシンは registry にアクセスする必要があります。SSH デプロイはインストーラーとアーカイブを転送するため、対象サーバーにはソース、Agent、オンラインでの依存関係インストールは不要です。

## Agent にデプロイ要件を伝える

<a id="エージェントを使う場合"></a>

アプリのソースディレクトリで対象を伝えます。

```prompt
このアプリを app-installer で <SSH サーバー> の <新しいインストール先> に初めて配置し、PM2 で管理して <URL> から使えるようにしてください。新しいデータベースを使い、設定とファイルは別に保存してください。まず実行設定と配置計画を示し、私の確認を待ってからインストールしてください。
```

管理者とデータベースの認証情報は安全に渡します。既存データがある場合はバックアップと復元先を指定します。

## インストール先と実行設定を確認する

サーバー、サービスアカウント、新しいディレクトリ、一意の PM2 名、ポート、Node、成果物のダイジェスト、データの保存先を確認します。`--origin` にアプリのパスは含めず、`--base-path` で別に指定します。既定ではループバックで待ち受け、プロキシが公開アクセスを提供します。

SSH は非対話ログインと厳密なホスト鍵確認を使います。指紋を確認し、非対話 PATH から Node、PM2、tar を実行できることを事前に確かめます。

## Agent に app-installer での配置を依頼する

対象に合ったアーカイブをビルドして転送後のダイジェストを確認し、新しいディレクトリで設定とマイグレーションの初期化、PM2 起動、ヘルスチェックを実行してもらいます。ここではインストーラーを beta.10 に固定し、アプリのテンプレート更新は要求しません。

`config.yml`、`app.env`、`storage/`、ログ、バックアップはバージョン別ディレクトリの外にあり、`current` が稼働中のリリースを指します。以降の更新は同じインストール先に対して行います。

## アクセスとプロセス管理を確認する

<a id="検証の範囲"></a>

インストール結果の `ok: true`、`result.started: true` を確認します。status の `result.health.ok`、`result.process.status`、`result.node.matches`、`result.pending` はそれぞれ `true`、`online`、`true`、`null` が期待値です。

実際の URL からログインし、業務の読み書きと権限を確認します。レコード ID とファイルを記録します。商品操作は[サンプルの説明](https://github.com/nocobase/docs-examples-v3/blob/51658852e7290b0ed3c0735d2856681850560efb/apps/product-catalog/README.md#create-and-publish)を参照してください。このアプリだけを PM2 で再起動し、同じレコード、ファイル、権限を確認します。

インストーラーはプロセス一覧を保存します。OS 起動時の復帰には、サービスアカウントで `nextCommands` に従い `pm2 startup` と表示されるシステムコマンドを実行し、停止可能な環境でホスト再起動を検証します。SSH の `result.remote.publicHealth: false` は公開先の DNS、プロキシ、ネットワークを調べる必要があります。

## 手動デプロイの参考

<a id="エージェントを使わない場合"></a>
<a id="1-開発マシンでビルドする"></a>
<a id="2-ローカルでのインストールか-ssh-でのデプロイかを選ぶ"></a>
<a id="3-インストールとアクセスを確認する"></a>
<a id="4-監視と永続性を確認する"></a>
<a id="エージェントを使う場合-1"></a>
<a id="エージェントを使わない場合-1"></a>

以下は Bash、Linux x64/glibc、Node.js 24、SQLite の例です。サーバーで `node --version`、`command -v pm2`、`command -v tar` を確認し、PM2 は管理者が準備します。開発マシンのアプリでビルドします。
```bash
pnpm build --target linux-x64 --node-version 24 --tar
sha256sum storage/exports/dist.tar.gz
```

生成される `storage/exports/dist.tar.gz` は実行時の依存関係を含みます。サーバーの `/tmp/my-app.tar.gz` にコピーし、サービスアカウントで新規インストールします。`/srv` に権限がなければ、自分の書き込み可能な場所に変更します。
```bash
read -r -s -p 'Initial admin password: ' APP_INITIAL_PASSWORD
export APP_INITIAL_PASSWORD
npx --yes @nocobase/app-installer@0.1.0-beta.10 install /srv/nocobase/my-app \
  --archive /tmp/my-app.tar.gz --origin http://127.0.0.1:13000 \
  --base-path /shop --host 127.0.0.1 --port 13000 --name nocobase-my-app \
  --set app.sampleData=false \
  --set-from-env users.initialAdmin.password=APP_INITIAL_PASSWORD --json
unset APP_INITIAL_PASSWORD
```

初期管理者設定は空のユーザーテーブルだけに適用されます。返されたユーザー名を確認してください。独自パスワードなら `result.initialAdmin.defaultPassword` は false です。状態確認と再起動を行います。
```bash
npx --yes @nocobase/app-installer@0.1.0-beta.10 status --dir /srv/nocobase/my-app --json
curl --fail http://127.0.0.1:13000/shop/api/healthz
pm2 restart nocobase-my-app
```

開発マシンから SSH でインストールする場合は `install /srv/nocobase/my-app` を `deploy --ssh deploy@server --dir /srv/nocobase/my-app` に置き換え、archive にローカルのパスを指定します。先に `ssh deploy@server 'node --version && command -v pm2 && command -v tar'` を確認します。必要に応じて `--ssh-port`、`--ssh-identity`、`--ssh-config` を使い、以降の status にも同じ接続引数を付けます。

`--set-from-env` は開始側の環境変数を読み取り、SSH で暗号化して転送します。先頭の `npx --yes` はツール取得の確認だけで、更新やロールバック計画の承認はインストーラー自身の `--yes` です。

次の作業は[更新と復旧](../deployment/publish-app-release.md)、[日常の保守とトラブルシューティング](../deployment/maintenance-and-troubleshooting.md)を参照してください。

<a id="新しいリリースを公開する"></a>
<a id="失敗とロールバック"></a>

[更新と復旧](../deployment/publish-app-release.md)

> [!NOTE]
> beta.85 サンプルはローカルの Node.js 24、PM2 6.0.14、インストーラー beta.10、SQLite で、インストール、ネイティブログイン、業務書き込み、再起動後の永続化を確認済みです。SSH、公開プロキシ・HTTPS、ホスト起動時の復帰は未検証です。
