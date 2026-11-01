---
title: アップグレードとバックアップ
description: Studio のデータベース、設定、ファイルをバックアップし、新しいバージョンにアップグレードし、問題があればロールバックします。ランタイムと CLI の更新方法も説明します。
---

## バックアップする

Studio のデータはすべてデプロイディレクトリにあります。次の 4 つをバックアップします。

| 対象 | 備考 |
| --- | --- |
| データベース | PostgreSQL のデータ。`pg_dump -Fc` でエクスポートするか、Studio を停止した状態で `postgres` ディレクトリをコピーします |
| `.env` | 暗号化キー `STUDIO_SECRET_KEY` などの値。これを失うと、保存済みの Git 認証情報と API キーを復号できなくなります |
| `config.yml` | Studio の設定。プッシュ用の秘密鍵をここに保存している場合はそれも含みます |
| `storage` ディレクトリ | アップロードされたファイル、ログ、スキルのファイルなど |

たとえば、毎日データベースをエクスポートするには次のようにします。

```bash
cd studio
docker compose exec -T postgres pg_dump -U studio -Fc studio > backup/studio-$(date +%F).dump
```

バックアップには暗号化キーが含まれるため、パスワードと同じように保管してください。

デプロイした業務アプリのデータベースは、別にバックアップが必要です。[デプロイ環境](environments.md) を参照してください。

## バックアップから復元する

1. Studio を停止します：`docker compose stop studio`。
2. `.env`、`config.yml`、`storage` ディレクトリを元に戻します。
3. データベースを復元します。たとえば：

   ```bash
   docker compose exec -T postgres pg_restore -U studio -d studio --clean --if-exists < backup/studio-2026-10-25.dump
   ```

4. `docker compose start studio` で Studio を起動し、サインインでき、プロジェクトとタスクがすべてそろっていることを確認します。

`.env` の暗号化キーは、バックアップ時と同じである必要があります。そうでないと保存済みの認証情報を復号できず、全員がサインインし直す必要があります。

## アップグレードする

1. 先にバックアップします。
2. `docker-compose.yml` のイメージのバージョンを新しいものに変更します。
3. 取得して再起動します。

   ```bash
   docker compose pull
   docker compose up -d
   ```

4. `docker compose ps` に `healthy` と表示されるまで待ち、サインインして確認します。

データベースのマイグレーションは起動時に自動で実行されます。利用できる Studio のイメージとバージョンについては、[お問い合わせ](https://www.nocobase.com/ja-JP/contact/) ください。

> [!WARNING] ロールバックはデータベースと一緒に
> 新しいバージョンは起動時にデータベースをアップグレードするため、イメージのバージョンを戻すだけでは、古いバージョンがデータベースを読めない可能性があります。ロールバックするには、先にアップグレード前のデータベースのバックアップを復元してから、古いバージョンを起動します。

## ランタイムと CLI の更新

先に Studio をアップグレードすると、ランタイムと CLI はそれに追従します。

- **runner** は、エージェントが実行されていないときに、Studio が提供するバージョンに自動で更新されます。すぐに更新するには、マシンで `nocobase-runner update` を実行します。現在のプロトコルに対応できないほど古い runner は、**Agent management › Runtimes** でアップグレードが必要と表示されます。
- **nb-studio**：`nb-studio update` を実行すると、Studio が提供するバージョンに、インストール済みのスキルとともに更新されます。Studio に新しいバージョンがあるときも、`nb-studio` が知らせてくれます。
