---
title: "設定項目"
description: "Studio の設定ファイル、環境変数、ストレージ、メール設定を確認します。"
---

設定はデプロイディレクトリの `config.yml` に保存し、コンテナの `/app/config.yml` にマウントします。イメージからテンプレートを取り出します。

```bash
export STUDIO_IMAGE='<supplied-image-name-and-version>'
docker run --rm --entrypoint cat "$STUDIO_IMAGE" /app/config.example.yml > config.yml
```

使うイメージのテンプレートに設定を統合し、最上位の項目を重複させないでください。仮の認証情報を置き換え、設定ファイルへのアクセスを制限します。

環境変数で上書きできるのは、アプリが対応する項目だけです。Compose の `.env` は `environment` または `env_file` でコンテナに渡します。`config.yml` は `${NAME}` を展開しません。変更後は `docker compose up -d --force-recreate studio` で、マウントしたファイルの変更も反映します。

## ファイルアップロードとリリース成果物

| 内容 | 設定 | 既定の保存先 |
| --- | --- | --- |
| 添付ファイルなどのアップロード | `drive.default` で `drive.disks` のディスクを選択 | `/app/storage` |
| CI やエージェントが送るリリース成果物 | `releases.artifact` | `/app/storage/releases/artifacts` |

ローカル保存は追加設定なしで使えますが、`/app/storage` を永続化してください。既定のファイル用ディスクを変えても、成果物の保存先は変わりません。

ファイル保存は `fs` と `s3` に対応しています。ドライバー、成果物、移行は[ファイルと成果物のストレージ](storage.md)を参照してください。

## 招待とパスワード再設定メール

| 用途 | 送信設定 | パスワード変数 |
| --- | --- | --- |
| 招待 | `notification.channels.system-email`、`type: smtp` | `SMTP_PASSWORD` |
| パスワード再設定 | `auth.email`、`provider: smtp` | `AUTH_EMAIL_PASSWORD` |

`auth.passwordReset.emailChannel` は旧設定との互換用です。新しい設定は `auth.email` を使い、招待には引き続き通知チャネルを使います。

同じ SMTP アカウントを使えますが、設定は別々に行います。パスワード再設定には `auth.passwordReset.enabled: true` と、正しい `APP_PUBLIC_ORIGIN` も必要です。

設定例、Compose への変数の渡し方、移行は[招待メール](../admin/notifications.md#招待メール)を参照してください。チームの利用開始前に、招待とパスワード再設定の両方を確認します。

## 環境変数

| 変数 | 設定内容 |
| --- | --- |
| `APP_PUBLIC_ORIGIN` | ブラウザーからアクセスする、パスを含まない URL。例：`https://studio.example.com`。Git のコールバック、メールのリンク、プッシュに使用 |
| `SECRETS_KEYS` | `1:<key>` 形式の暗号化キー。`openssl rand -hex 32` で生成。保存済み認証情報と API キーの暗号化に使い、サインインセッションもこのキーから派生 |
| `INITIAL_ADMIN_USERNAME`、`INITIAL_ADMIN_EMAIL`、`INITIAL_ADMIN_PASSWORD` | 初期管理者。アカウントがない初回起動時だけ作成し、後の変更で既存アカウントは更新しない |
| `DB_DIALECT`、`DB_HOST`、`DB_PORT`、`DB_DATABASE`、`DB_USERNAME`、`DB_PASSWORD`、`DB_SSL` | データベース接続 |
| `WEB_PUSH_PRIVATE_KEY` | プッシュ用の秘密鍵。[通知とプッシュ](../admin/notifications.md)を参照 |
| `SMTP_PASSWORD`、`RESEND_API_KEY` | 招待で使う `system-email` 通知チャネルの認証情報 |
| `AUTH_EMAIL_PASSWORD`、`AUTH_EMAIL_API_KEY` | 独立したパスワード再設定の送信元の認証情報 |
| `AUTH_EMAIL_PROVIDER`、`AUTH_EMAIL_HOST`、`AUTH_EMAIL_PORT`、`AUTH_EMAIL_SECURE`、`AUTH_EMAIL_USER`、`AUTH_EMAIL_FROM`、`AUTH_EMAIL_REPLY_TO` | `auth.email` の対応する送信設定を上書き |
| `API_BODY_LIMIT`、`API_TIMEOUT` | API リクエスト本文の最大サイズと処理タイムアウト |

Studio は `https://studio.example.com/main/` のように `/main` 配下で動作します。ランタイムの追加や `nb-studio` のサインインには、`/main` を含む完全なアドレスを使います。

> [!WARNING] 暗号化キー
> デプロイ後に `SECRETS_KEYS` を不用意に変更しないでください。変更すると全員がサインアウトし、紛失すると保存済み認証情報を復号できません。交換時は、より大きなバージョン番号の新しいキーを先頭に置きます（`2:<new key>,1:<old key>`）。再暗号化後に旧キーを削除します。

## config.yml の主な設定

| 設定 | 内容 |
| --- | --- |
| `i18n.defaultLocale` | 表示言語。既定は英語で、他の言語を使う場合だけ設定 |
| `auth.emailAndPassword.disableSignUp` | `true` で自己登録を無効にし、招待のみで参加。テンプレートにはないため追加が必要 |
| `auth.passwordReset.enabled` | 有効な `auth.email` と公開 URL を使った標準の再設定機能 |
| `auth.email` | `provider: smtp` または `provider: resend` を使う独立した再設定メール送信元 |
| `users.invitations.emailChannel` | 招待用の通知チャネル。既定は `system-email` |
| `notification.channels` | アプリ内通知の `inbox`、SMTP・Resend の `system-email` など。[通知とプッシュ](../admin/notifications.md)を参照 |
| `push` | プッシュ通知の `privateKey` と `contact` |
| `database` | データベース接続。環境変数で上書き可能 |
| `users.initialAdmin` | 初期管理者。環境変数で上書き可能 |
| `secrets.keys` | 暗号化キー。`SECRETS_KEYS` で上書き可能 |
| `logging` | ログレベル、保存日数、保存容量 |
| `studio.git.apiBaseUrls` | 既定と異なる場所で動く GitHub Enterprise・GitLab の API アドレス |
| `studio.agents.queuedExpiryHours` | ランタイムを待つキューの期限。既定は 24 時間、0 は無期限 |
| `agents.runs.retentionDays` | 完了した実行の記録とプロンプトの保存日数。既定は 14 日 |
| `drive` | ファイル保存。既定はローカルの `storage`。S3 互換の保存先にも対応 |
| `releases.artifact` | リリース成果物の保存先。既定のファイル用ディスクとは別に設定 |
| `studio.testing.enabled` | 品質管理メニューを表示。`STUDIO_TESTING_ENABLED=true` でも指定可能 |

## 複数インスタンスで動かす

単一インスタンスでは Redis は不要です。複数の場合は、リアルタイム通知の `realtime` と定期ジョブの `jobs` を両方 Redis に切り替え、全インスタンスで同じ名前空間を使います。ジョブの消失を防ぐため、Redis の永続化を有効にし、`maxmemory-policy noeviction` を設定してください。

## リリース管理

| 設定 | 内容 |
| --- | --- |
| `releases.docker` | `enabled: true` で Docker 方式を有効化し、アプリの入口アドレスとポートを指定。[ホスト環境](../admin/environments.md)を参照 |
| `releases.host.launchPrefix` | Studio の設定を読めない別のシステムユーザーでプレビューを実行 |
| `studio.releases.previewPublicUrl` | Studio と共有しないプレビュー専用ドメイン。例：`https://studio-preview.example.com/{appId}/` |
| `studio.releases.previewEnvironment` | `false` でインストール時のプレビュー環境作成を省略 |

実際の運用では、プレビュー専用ドメインと別のシステムユーザーを使ってください。未マージのコードを実行するため、Studio の設定やシークレットを読み取れないようにします。
