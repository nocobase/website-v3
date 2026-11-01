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

Docker で旧イメージに切り替えてもマイグレーションや業務書き込みは戻りません。app-installer rollback は旧 release を選べます。既定では、対応する更新でマイグレーション、seed、チェックサム修復を行った場合などに、記録された SQLite バックアップを復元します。返された計画を確認してください。

データ復旧ではサービスを停止し、バックアップと合うコードを用意して、データベース、ファイル、設定、鍵を復元してから起動します。設定のスナップショットがあっても、rollback がすべての設定、ファイル、外部データベースを自動復元するわけではありません。外部データベースとオブジェクトストレージは復旧時点を揃えます。

復旧後はログイン、旧レコード、権限、ファイル、書き込みを検証します。隔離コピーで演習し、失われる後続書き込みを確認してから実環境を復旧します。

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

ロールバック計画を調べ、対象 release、SQLite 復元、後続書き込みの損失を確認してから実行します。
```bash
npx --yes @nocobase/app-installer@0.1.0-beta.10 rollback --dir /srv/nocobase/my-app --json
# After accepting the recovery point and any loss of later writes:
npx --yes @nocobase/app-installer@0.1.0-beta.10 rollback --dir /srv/nocobase/my-app --yes --json
```

外部データベースの復元にはその製品のツールを使います。一式の復旧では先に `pm2 stop nocobase-my-app` で停止し、対応するデータベース、ファイル、設定を復元し、インストーラーで対応する release を選びます。status 確認後に利用を再開します。`current` の改変や pending の削除は行いません。バックアップは[日常の保守とトラブルシューティング](maintenance-and-troubleshooting.md)を参照してください。

> [!NOTE]
> ローカル SQLite ではテスト用マイグレーションの追加、明示的ロールバック、起動失敗後の復旧、オフライン storage 復元を確認しました。フレームワーク更新、外部データベース、オブジェクトストレージは個別の復旧演習が必要です。
