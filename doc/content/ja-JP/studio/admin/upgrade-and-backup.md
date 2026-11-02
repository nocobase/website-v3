---
title: "アップグレードとバックアップ"
description: "Studio のバックアップと復元、サーバー・runner・CLI の更新を行います。"
---

## バックアップする

データベース、設定、暗号化キー、ファイルをまとめて保存します。以下は[デプロイ手順](../setup/install.md)の Compose と PostgreSQL を使う例です。

| 対象 | 保存するもの |
| --- | --- |
| データベース | PostgreSQL のダンプ、またはマネージドデータベースのバックアップ |
| 設定 | `config.yml`、Compose ファイル、`.env` |
| キー | `SECRETS_KEYS` の暗号化キーとプッシュ通知の秘密鍵 |
| ファイル | `storage`、オブジェクトストレージのファイル、スキル、成果物 |

デプロイディレクトリで実行します。

```bash
mkdir -p backup
docker compose exec -T postgres pg_dump -U studio -Fc studio   > "backup/studio-$(date +%F).dump"
```

ユーザー名とデータベース名は実際の設定に合わせてください。バックアップ中は書き込みを停止するか、データベースとファイルの整合性を保てるスナップショットを使います。業務アプリのデータベースは別にバックアップします。

## 復元する

1. Studio を停止し、現在のデータのコピーを保存します。
2. 同じバックアップ時点の設定、キー、ファイル、データベースを復元します。
3. そのバックアップに対応するバージョンのイメージを起動します。
4. サインイン、プロジェクトのタスク、ファイルのダウンロード、Git 接続を確認します。

用意した空のデータベースに復元します。例：

```bash
docker compose exec -T postgres pg_restore -U studio -d studio   < backup/studio-backup.dump
```

既存データがある場合は、バックアップのレコードを追加するのではなく、チームの置き換え手順に従ってください。インストール例では `STUDIO_SECRET_KEY` を `SECRETS_KEYS` に渡しています。復元時も同じキーを使います。

## Studio をアップグレードする

1. バックアップを完了し、更新先のイメージを入手します。
2. デプロイ設定の `STUDIO_IMAGE` を更新します。
3. イメージを取得し、Studio コンテナを再作成します。

```bash
docker compose pull studio
docker compose up -d studio
docker compose ps
docker compose logs --tail=100 studio
```

マイグレーションは起動時に実行されます。サービスの正常性、サインイン、タスク、ランタイムを確認してください。Studio は商用製品です。イメージについては[お問い合わせ](https://www.nocobase.com/ja-JP/contact/)ください。

古いイメージに戻す前に、データベースの互換性を確認します。マイグレーションを戻す必要がある場合は、更新前のデータベースとファイルを復元し、対応する旧バージョンを起動してください。

## runner と CLI を更新する

runner は自動で更新できます。マシン上で次のコマンドを実行することもできます。

```bash
nocobase-runner update
nb-studio update
```

`nb-studio update` はインストール済みのスキルも更新します。互換性のないバージョンは、ランタイム画面に更新が必要と表示されます。
