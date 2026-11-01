---
title: 更新と復旧
description: Agent と変更、バックアップ、停止時間を確認し、既存データを検証してアプリとデータを復旧します。
---

## 更新対象と既存のデプロイ情報を伝える

<a id="エージェントを使う場合"></a>

対象コミット、既存サーバー、Compose プロジェクトとディレクトリ、または app-installer のインストール先、現行バージョン、データベースとファイルの場所を伝えます。

```prompt
<対象コミット> を <既存サーバーとディレクトリ> に公開してください。引き続き <Docker または app-installer> を使い、データ、設定、鍵を保持してください。まず変更、バックアップ、停止時間を調べ、更新と復旧の計画を示してください。私の確認を待ってから実行してください。
```

アプリの公開とフレームワーク更新は別です。依存関係を変える場合は、先に開発環境で [NocoBase Core をアップグレード](../developing-apps/upgrade-nocobase-core.md)し、互換性を検証します。

## 変更、バックアップ、停止時間を確認する

コード、設定、マイグレーション、必須 seed の変更を確認し、旧成果物とダイジェストを保管します。実行済みマイグレーションは履歴です。チェックサムの差は原因を調べ、履歴を書き換えたりデータベースを消去したりしません。

書き込み停止時間、許容する復旧時点、バックアップ先、復旧担当を決めます。データベース、ファイル、設定、安定した鍵を組み合わせて復元できる必要があります。外部データベースはその製品のツールで、ファイルやオブジェクトストレージは別途バックアップします。

app-installer の更新はアプリ停止後、設定に宣言された SQLite と関連ジャーナルファイル、`config.yml`、`app.env` を保存します。アップロードと外部データベースは保存しません。`--backup-done` は外部バックアップ完了の申告だけです。

## Agent に更新を実行してもらう

設定、マイグレーションの dry-run、履歴チェックサムを先に確認し、合意した停止計画で実行してもらいます。Docker は新しいタグと既存マウントを使い、app-installer は元のディレクトリに upgrade、SSH では deploy を実行します。

更新の事前確認は `CONFIRMATION_REQUIRED` を返し、旧アプリは稼働を続けます。計画を確認してからインストーラーの `--yes` を付けます。同じアーカイブなら `success-noop` です。設定や鍵の再生成、初回インストールとしての扱いは避けます。

## 新機能と既存データを確認する

稼働バージョンとヘルスを確認し、元の URL でログインします。記録済みの ID で既存データ、ファイル、権限を確認し、新機能を操作します。スキーマ変更時は旧レコードと追加フィールドを確認します。

演習環境で再起動またはコンテナ再作成後にも確認します。コミット、アーカイブまたはイメージのダイジェスト、マイグレーション結果、実際の業務確認結果を Agent に報告してもらいます。

## 更新失敗後の復旧方法を判断する

新しい業務書き込みを止め、エラー、ログ、現在の状態を保存します。稼働中のリリース、確定したマイグレーション、インストーラーの pending 操作、バックアップの完全性を調べます。

インストーラーは失敗後に旧リリースへの復帰を試みますが、それも失敗する可能性があります。pending やヘルス異常があれば再実行前に調べます。現在のデータと旧コードの互換性に応じ、新版修正、コードのみのロールバック、対応する一式のバックアップの復元を選び、バックアップ後の書き込みの扱いを決めます。

## アプリのロールバックとデータ復元を行う

Docker の旧イメージへの切り替えはマイグレーションや業務書き込みを戻しません。**インストーラーのスナップショットへのロールバック**では、返された計画を確認します。app-installer は更新前の SQLite を復元する場合があり、その後 release を切り替えてアプリを起動します。ファイル、設定、外部データベースは一緒に戻りません。`--no-restore` でも起動するため、オフラインでのコード選択には使えません。

**一式のバックアップからの復旧**では、外部アクセスを遮断し、アプリと他の書き込み元を停止します。まず選択した復旧時点に合うアーカイブを別の復旧ディレクトリに展開します。両アプリを停止したまま、同じ一式のデータベース、アップロード、設定、鍵を復元します。パスを調整して設定とマイグレーション計画をオフライン確認し、復旧したアプリだけを起動します。選んだデータベースを復元した後に installer rollback を実行すると、復旧時点が上書きされたり、サービスが早く起動したりするため、実行しません。

公開再開前にログイン、選択したレコード、権限、アップロードの内容、設定、書き込みを確認します。隔離コピーで演習し、後続書き込みの扱いを決めます。外部データベースとオブジェクトストレージの復旧時点も揃えます。

## 手動更新と復旧の参考

<a id="エージェントを使わない場合"></a>

旧アーカイブを保存してからソースで再ビルドします。
```bash
pnpm build --target linux-x64 --node-version 24 --tar
sha256sum storage/exports/dist.tar.gz
```

**Docker**：新しいタグでビルドしてサーバーに転送します。バックアップ後、元の Compose ディレクトリの `image` を変更します。次の最初の 3 コマンドで事前確認し、変更を確認してから最後の起動を実行します。
```bash
docker compose -p my-app run --rm --no-deps app node dist/cli/index.js config check --connect
docker compose -p my-app run --rm --no-deps app node dist/cli/index.js db apply --dry-run --json
docker compose -p my-app run --rm --no-deps app node dist/cli/index.js db repair --dry-run --json
docker compose -p my-app up -d --wait --wait-timeout 180
```

コードを戻す場合は旧タグに変更し、現在のデータベースと互換性がある場合だけ起動します。データ復元が必要なら `docker compose -p my-app stop app` で停止し、一式のバックアップを元のマウント先と権限に復元して、対応するイメージで `up -d --wait` を実行します。

**PM2**：新しいアーカイブをサーバーの `/tmp/my-app-new.tar.gz` にコピーします。同じサービスアカウントで事前確認し、バックアップと停止が承認されてから実行します。
```bash
npx --yes @nocobase/app-installer@0.1.0-beta.10 upgrade \
  --dir /srv/nocobase/my-app --archive /tmp/my-app-new.tar.gz --json
# After reviewing the plan and completing backups:
npx --yes @nocobase/app-installer@0.1.0-beta.10 upgrade \
  --dir /srv/nocobase/my-app --archive /tmp/my-app-new.tar.gz --yes --json
```

SSH は `deploy --ssh deploy@server --dir /srv/nocobase/my-app --archive <ローカルの新しいアーカイブ>` を使い、初回の origin、port、name、`--set` は再指定しません。

**インストーラーのスナップショットへのロールバック**：その復旧時点を使い、現行のファイルと設定もそのデータと互換性がある場合だけ実行します。それ以外は一式のバックアップから復旧します。外部アクセスを先に遮断し、release、SQLite 復元、後続書き込みの損失を確認します。承認したコマンドはアプリを起動します。
```bash
npx --yes @nocobase/app-installer@0.1.0-beta.10 rollback --dir /srv/nocobase/my-app --json
# After accepting the recovery point and any loss of later writes:
npx --yes @nocobase/app-installer@0.1.0-beta.10 rollback --dir /srv/nocobase/my-app --yes --json
```

**一式のバックアップからの復旧**：beta.10 にオフライン rollback 引数はありません。別ディレクトリと対応アーカイブを使い、手動復元後にインストーラー管理の release を切り替えません。

1. 外部アクセスを遮断し、`pm2 stop nocobase-my-app` を実行します。同じデータベースやストレージを使う他のアプリやバックグラウンド処理も止めます。
2. サービスアカウント用の新しい復旧ディレクトリを用意し、対応アーカイブを先に展開します。選んだバックアップの `config.yml`、`app.env`、完全な `storage/` を復元します。外部ストレージはその製品のツールで同じ時点に戻します。両アプリを停止したまま作業します。
3. 復元した `app.env` の `APP_CONFIG_FILE` と `APP_STORAGE_DIR` を復旧ディレクトリに変更します。他の絶対パスと環境変数の上書きを確認し、バックアップの鍵と業務設定は保持します。演習は別のループバックポートを使います。
4. 復旧ディレクトリで設定と以下の 2 つのデータベース dry-run を確認します。予期しないマイグレーションやチェックサム変更があれば、バックアップに合うバージョンを調べ、強引に適用しません。整合性を確認してから PM2 を起動します。

対応リリースのアーカイブと選んだバックアップは別のファイルです。旧サービス停止後、サービスアカウントで新しいディレクトリを準備します。
```bash
mkdir /srv/nocobase/my-app-recovery
tar -xzf /tmp/my-app-matching.tar.gz -C /srv/nocobase/my-app-recovery
tar -xzf /safe/backup/my-app-selected.tar.gz -C /srv/nocobase/my-app-recovery
```

復元した `app.env` のパスと環境変数を上記のとおり確認してから、復旧先で確認と起動を行います。
```bash
cd /srv/nocobase/my-app-recovery
node --env-file=./app.env dist/cli/index.js config check --connect
node --env-file=./app.env dist/cli/index.js db apply --dry-run --json
node --env-file=./app.env dist/cli/index.js db repair --dry-run --json
pm2 start node --name nocobase-my-app-recovery --interpreter none \
  --cwd /srv/nocobase/my-app-recovery --kill-timeout 60000 -- \
  --env-file=/srv/nocobase/my-app-recovery/app.env ./dist/server/standalone.js
```

この復旧先は手動デプロイで、app-installer のインストール先ではありません。ヘルス、ネイティブログイン、レコード、アップロードのメタデータとダウンロード内容、設定、権限を確認してから公開します。インストーラー管理への移行は別途計画します。旧ディレクトリの `current` や pending は変更しません。バックアップは[日常の保守とトラブルシューティング](maintenance-and-troubleshooting.md)を参照してください。

> [!NOTE]
> ローカル SQLite ではテスト用マイグレーション、インストーラーのロールバック、起動失敗後の復旧、レコード・ネイティブアップロード・設定の一式の復元を確認しました。フレームワーク更新、外部データベース、オブジェクトストレージは個別の復旧演習が必要です。
