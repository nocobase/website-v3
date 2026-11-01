---
title: PM2（app-installer）でデプロイする
description: app-installer で本番アプリをインストール・更新し、PM2 によるプロセスの監視と、永続化した設定とデータを使います。
---

このガイドでは製品カタログのアプリを実例として使いますが、自分の NocoBase Core のアプリにも当てはまります。対象の環境は [デプロイ方法を選ぶ](../deployment/choose-a-deployment-method.md) で確認してください。自分のプロジェクトでは、例のアプリ名、パス、業務の検収のチェックを置き換えます。

製品カタログのアプリを本番のサーバーに独立してデプロイし、PM2 でアプリのプロセスを監視します。`@nocobase/app-installer` は、リリースのアーカイブを展開し、設定を準備し、マイグレーションを適用し、PM2 を起動して、ヘルスチェックを行います。以降のアプリの更新も管理します。

アプリがテストに合格していることを確認してください。製品カタログの例については [製品カタログのサンプルの README](https://github.com/nocobase/docs-examples-v3/blob/b24857f529ae5bb80e97a881b846ea2fd1424242/apps/product-catalog/README.md) を参照してください。このガイドでは、単一のインスタンス、SQLite、Linux x64/glibc、Node.js 24、ベースパス `/shop` を使います。ほかのデータベースのダイアレクトには、ソースのアプリに適切なドライバーを入れ、ビルドし直す必要があります。

## 前提条件

ソースと pnpm は開発マシンに置きます。サーバーには、Node.js 24、グローバルに使える pm2 4.3 以降、`tar`、固定のサービスアカウントが所有する書き込み可能な空のインストール先ディレクトリが必要です。以下のコマンドは Bash を使います。

```bash
node --version
node -p "process.platform + '-' + process.arch"
command -v pm2
command -v tar
```

必要に応じて、サーバーの管理者が `npm install -g pm2` で pm2 をインストールします。以降の操作にも同じサービスアカウントを使います。この例では `/srv/nocobase/shop` を使います。ローカルでのリハーサルでは `$HOME/shop` を使い、すべてのディレクトリの引数を調整します。

アプリは `127.0.0.1:13000` で待ち受けます。別に設定したリバースプロキシが、ベースパスと WebSocket のアップグレードを保ったまま `https://shop.example.com/shop/` を提供します。ローカルでのリハーサルでは、オリジンに `http://127.0.0.1:13000` を使います。ポートが空いていることを確認してください。`npx` を実行するマシンにはレジストリへのアクセスが必要です。オフラインの対象には、開発マシンから SSH でインストーラーと成果物を送れます。

この例は既定のテンプレート `1.0.0-beta.85` を使い、上の固定コミットの README がそのソースとセットアップを説明しています。以下の設定では任意のサンプルを無効にしています。必要なロールは初期化されますが、製品カタログは空の状態で始まります。確認の手順で製品を作成してください。

## エージェントを使う場合

```text
app-installer を使って、現在の製品カタログのアプリをこのサーバーに初めてデプロイしてください。

サーバー：<my SSH server alias>
インストール先ディレクトリ：/srv/nocobase/shop。新しいディレクトリと SQLite のデータベースを使う
サーバーの環境：Linux x64/glibc、Node.js 24
アプリの待ち受け：127.0.0.1:13000
ユーザー向けの URL：https://shop.example.com/shop/

プロジェクトのデプロイのガイダンスに従い、対象と前提条件を確認してから、アプリを準備してインストールしてください。
このチュートリアルのアプリだけを操作し、開発中のデータのインポートやサンプルの製品の追加はしないでください。
管理者のサインインを設定し、私が渡すパスワードは安全に読み取り、パスワードとシークレットを出力やコードに含めないでください。

サインイン、製品の作成と公開、閲覧専用のメンバーの権限を確認してください。
このアプリを再起動し、作成した製品と権限が残っていることを確認してください。
URL、確認の結果、まだ私が対応する必要がある環境の設定を報告してください。
```

プレースホルダーは、実際に認可された対象に置き換えます。サーバーには、エージェント、ソースツリー、開発用の依存関係は必要ありません。

## エージェントを使わない場合

### 1. 開発マシンでビルドする

```bash
pnpm build --target linux-x64 --node-version 24 --tar
sha256sum storage/exports/dist.tar.gz
```

アーカイブには本番の依存関係が含まれます。そのプラットフォーム、libc、Node のメジャーバージョンは、サーバーと一致している必要があります。このアーカイブでのインストールでは、サーバーで `pnpm install` を実行しないでください。

### 2. ローカルでのインストールか SSH でのデプロイかを選ぶ

**A. サーバーでインストーラーを実行する。** 開発マシンからアーカイブをコピーします。

```bash
scp storage/exports/dist.tar.gz deploy@server:/tmp/shop.tar.gz
```

続いて、サーバーでサービスアカウントとして次を実行します。

```bash
read -r -s -p 'Initial admin password: ' CATALOG_INITIAL_PASSWORD
export CATALOG_INITIAL_PASSWORD

npx --yes @nocobase/app-installer@0.1.0-beta.9 install /srv/nocobase/shop \
  --archive /tmp/shop.tar.gz \
  --origin https://shop.example.com \
  --base-path /shop --host 127.0.0.1 --port 13000 \
  --name nocobase-catalog \
  --set app.sampleData=false \
  --set-from-env users.initialAdmin.password=CATALOG_INITIAL_PASSWORD \
  --json

unset CATALOG_INITIAL_PASSWORD
```

**B. 開発マシンから SSH でデプロイする。** 鍵によるログインを設定し、信頼できる経路でホストの鍵を確認します。非対話型のアカウントの PATH を確認します。

```bash
ssh deploy@server 'node --version && command -v pm2 && command -v tar'
```

続いて、ローカルで次を実行します。

```bash
read -r -s -p 'Initial admin password: ' CATALOG_INITIAL_PASSWORD
export CATALOG_INITIAL_PASSWORD

npx --yes @nocobase/app-installer@0.1.0-beta.9 deploy \
  --ssh deploy@server --dir /srv/nocobase/shop \
  --archive storage/exports/dist.tar.gz \
  --origin https://shop.example.com \
  --base-path /shop --host 127.0.0.1 --port 13000 \
  --name nocobase-catalog \
  --set app.sampleData=false \
  --set-from-env users.initialAdmin.password=CATALOG_INITIAL_PASSWORD \
  --json

unset CATALOG_INITIAL_PASSWORD
```

`--archive` は開発マシン上のパスで、`--dir` はサーバー上の絶対パスです。必要に応じて、以降のコマンドも含め、`--ssh-port`、`--ssh-identity`、`--ssh-config` を使います。ツールはインストーラーとアーカイブを転送しますが、サーバーには引き続き Node.js、pm2、tar が必要です。

どちらの初回インストールの方法でも、新しいディレクトリか空のディレクトリが必要です。オリジンには `/shop` を含めず、ベースパスは別に指定します。`--set-from-env` はインストーラーを実行するマシンでパスワードを読み取り、該当する場合は暗号化された SSH で転送します。初期の認証情報は、ユーザーのテーブルが空の場合にだけ影響します。先頭の `npx --yes` はツールのダウンロードを受け入れるもので、今後の更新やロールバックの計画を受け入れるものではありません。

### 3. インストールとアクセスを確認する

JSON の `ok: true`、`status: "success"`、`result.started: true` を確認します。返されたアプリの URL、初期のユーザー名、設定したパスワードを使います。独自のパスワードを設定した場合は、`result.initialAdmin.defaultPassword: false` になるはずです。

```bash
npx --yes @nocobase/app-installer@0.1.0-beta.9 status \
  --dir /srv/nocobase/shop --json
curl --fail http://127.0.0.1:13000/shop/api/healthz
```

リモートの状態を確認するには、`--ssh deploy@server` を付けます。ヘルスが true、プロセスの状態が `online`、Node が一致し、保留中の操作がないことを確認します。プロキシの準備ができたら、`https://shop.example.com/shop/api/healthz` もテストし、実際の公開 URL からサインインします。サーバー内のヘルスチェックでは、DNS、TLS、プロキシは検証されません。`result.remote.publicHealth: false` は、実行したマシンから設定した公開のエンドポイントに到達できなかったことを意味します。

インストーラーは、`installer.json`、`app.env`、`config.yml`、`storage/`、ログ、バックアップを、バージョンごとの `releases/` の外に置きます。`current` は有効なリリースを指します。インストールされたリリースやシンボリックリンクを手で上書きしないでください。製品カタログのサンプルアプリは、必須のシードで **Catalog viewer** と **Catalog editor** のロールを初期化します。開発中の製品、ユーザー、ロールの割り当てはアーカイブと一緒にはコピーされません。別に設定または移行してください。

### 4. 監視と永続性を確認する

管理者としてサインインし、`/shop/api/swagger/docs` を開きます。**Products** で `priceCents: 1200` の `Deployment Notebook` を作成し、返された ID を控えてから公開します。新しい操作ごとに新しい `Idempotency-Key` を指定します。[作成と公開](https://github.com/nocobase/docs-examples-v3/blob/b24857f529ae5bb80e97a881b846ea2fd1424242/apps/product-catalog/README.md#create-and-publish) を参照してください。`/shop/catalog` に表示されることを確認します。

管理者や **Catalog editor** のアクセスを持たない一般のアカウントに、**Catalog viewer** を割り当てます。読み取りと CSV のダウンロードは成功し、作成と公開のリクエストは `403` を返すはずです。同じサービスアカウントで `pm2 restart nocobase-catalog` を実行し、このアプリだけを再起動します。もう一度サインインして、同じ ID、名前、価格、公開状態、権限を確認します。インストール結果の `nextCommands` に従い、`pm2 startup` と、それが表示するシステムのコマンドで、起動時の復旧を設定します。プロセスの再起動とマシンの再起動後の復旧は、別々のチェックです。

## 新しいリリースを公開する

更新の流れの概要は [アプリのリリースを公開する](../deployment/publish-app-release.md) を参照してください。古い成果物とソースのリビジョンは保持しておきます。新しいアーカイブをビルドしてから、状態と更新の計画を確認します。

### エージェントを使う場合

```text
検証済みの新しい製品カタログのアプリを、既存のチュートリアルの環境に公開してください。

サーバー：<my SSH server alias>
既存のインストール先ディレクトリ：/srv/nocobase/shop
引き続き app-installer を使い、データベース、設定、サインインのシークレット、アップロードされたファイルを保ってください。

更新の前に、現在のバージョンと製品を確認し、バックアップを用意し、以前のバージョンを残してください。
データの変更、想定される停止時間、更新が失敗した場合の復旧を説明してください。
適用済みのデータの変更が書き換えられている場合は、修復やチェックの省略を試みる前に調査してください。
更新を新規インストールとして扱ったり、既存のデータを消したりしないでください。

古い価格、公開状態、閲覧者の権限が残り、新しい機能が動作することを確認してください。
再起動してもう一度確認してください。このチュートリアルのアプリだけを操作し、実際の結果を報告してください。
```

### エージェントを使わない場合

上と同じように新しいアーカイブをビルドしてコピーします。サーバーで、インストーラーの確認のフラグを付けずに計画を確認します。

```bash
npx --yes @nocobase/app-installer@0.1.0-beta.9 upgrade \
  --dir /srv/nocobase/shop --archive /tmp/shop-new.tar.gz --json
```

開発マシンからは、既存のディレクトリと新しいローカルのアーカイブで `deploy --ssh` を使います。オリジン、ポート、`--set` などの初回インストールのオプションは繰り返さないでください。インストーラーは既存の `installer.json` を認識し、同一の成果物では `success-noop` を返します。

保留中の更新では、古いアプリが動いたまま、停止時間、バックアップ、マイグレーションの詳細とともに `CONFIRMATION_REQUIRED` が返ります。インストーラー自身の `--yes` を付ける前に、それらを確認してください。

```bash
npx --yes @nocobase/app-installer@0.1.0-beta.9 upgrade \
  --dir /srv/nocobase/shop --archive /tmp/shop-new.tar.gz --yes --json
```

インストーラーは、新しいアプリの CLI で、設定、保留中のマイグレーション、過去のチェックサムを確認します。マイグレーションの数はリリースと一致するはずです。ページやサービスを変えただけでは、新しいマイグレーションは必要ありません。想定外のマイグレーションやチェックサムのずれは、データベースをリセットするのではなく調査してください。インストーラーはアプリを停止し、SQLite と設定をバックアップし、マイグレーションを行い、リリースを切り替えて、ヘルスを確認します。アップロードと外部のデータベースには別のバックアップが必要です。`--backup-done` はバックアップを作成するのではなく、バックアップ済みであることを認めるものです。

その後、状態と、古いデータと新しいデータの両方を確認します。製品の ID、名前、価格、公開状態が保たれていること。公開済みの製品は `/shop/catalog` に表示されたままで、下書きは非公開のままであること。管理者は作成と公開ができ、**Catalog viewer** のユーザーは読み取りと CSV のダウンロードはできても書き込みはできないこと。新しい機能と、記載されたスキーマの変更を確認してから、再起動して同じ確認を繰り返します。ソースのコミットと成果物のダイジェストを記録してください。バージョン番号だけでは、ビルドし直したものを識別できません。

### 失敗とロールバック

再試行する前に、エラーを保存し、状態、ログ、現在のリリース、保留中の操作を確認します。ロールバックの計画は次で確認します。

```bash
npx --yes @nocobase/app-installer@0.1.0-beta.9 rollback --dir /srv/nocobase/shop --json
```

データの損失と復旧を確認してから確定してください。更新でデータベースのマイグレーションが適用された場合、ロールバックの計画で更新前の SQLite のバックアップが復元され、その後の書き込みが破棄されることがあります。返された計画を確認してください。外部のデータベースとアップロードには、別の復旧の手順があります。

## 検証の範囲

製品カタログの例は、`@nocobase/app-installer@0.1.0-beta.9`、PM2 `6.0.14`、Node.js 24、SQLite で確認しています。ローカルでの新規インストール、状態の確認、ネイティブのログイン、製品の作成と公開、PM2 の再起動後も同じ製品とパスワードが保たれることです。ロールに基づく読み書きの制限は、実際のアプリのテストで別に網羅しています。ホストをまたぐ SSH、公開の TLS とプロキシの設定、マシンの起動時の復旧、バージョンをまたぐアップグレード、失敗からの復旧、ロールバックは試していません。
