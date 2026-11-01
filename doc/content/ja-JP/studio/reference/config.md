---
title: 設定項目
description: "Studio の config.yml と環境変数：公開アドレス、暗号化キー、最初の管理者、データベース、言語とサインイン、メールとプッシュ、複数インスタンス、リリース管理、ログ。"
---

Studio の設定は、デプロイディレクトリの `config.yml` にあり、コンテナ内では `/app/config.yml` にマウントされます。テンプレートをイメージからコピーします。

```bash
export STUDIO_IMAGE='<supplied-image-name-and-version>'
docker run --rm --entrypoint cat "$STUDIO_IMAGE" /app/config.example.yml > config.yml
```

これらの設定を、イメージのテンプレートにトップレベルのノードを重複させずにマージします。プレースホルダーの認証情報を置き換え、設定ファイルへのアクセスを制限してください。

環境変数が上書きするのは、アプリが明示的に対応しているフィールドだけです。Compose の `.env` のエントリは `environment` または `env_file` で渡してください。`config.yml` は `${NAME}` を展開しません。変更後は `docker compose up -d --force-recreate studio` を実行し、マウントしたファイルの更新も読み込ませます。

## ファイルのアップロードとリリース成果物

| 内容 | 設定 | 既定の場所 |
| --- | --- | --- |
| アップロードされた添付ファイルなどのファイル | `drive.default` で `drive.disks` のディスクを選ぶ | `/app/storage` |
| CI やエージェントがアップロードしたリリース成果物 | `releases.artifact` | `/app/storage/releases/artifacts` |

ローカルストレージは追加の設定なしで使えますが、`/app/storage` は永続化してください。既定のファイルディスクを変更しても、成果物のストレージは変わりません。

ファイルストレージは `fs` と `s3` に対応しています。ドライバーの設定、リリース成果物、移行については、[ファイルと成果物のストレージ](storage.md) を参照してください。

## 招待メールとパスワード再設定メール

| 用途 | 送信設定 | パスワードの変数 |
| --- | --- | --- |
| 招待 | `notification.channels.system-email`（`type: smtp`） | `SMTP_PASSWORD` |
| パスワードの再設定 | `auth.email`（`provider: smtp`） | `AUTH_EMAIL_PASSWORD` |

`auth.passwordReset.emailChannel` は、以前の設定との互換性のためのフィールドです。新しい設定では `auth.email` を使い、招待には引き続き通知チャネルを使います。

両方で同じ SMTP アカウントを使えますが、別々に設定する必要があります。パスワードの再設定には、`auth.passwordReset.enabled: true` と正しい `APP_PUBLIC_ORIGIN` も必要です。

完全な例、Compose での変数の渡し方、移行については、[招待メール](../admin/notifications.md#招待メール) を参照してください。チームに使い始めてもらう前に、招待メールの配信とパスワードの再設定の両方を確認してください。

## 環境変数

| 変数 | 設定する内容 |
| --- | --- |
| `APP_PUBLIC_ORIGIN` | ブラウザーが Studio にアクセスするアドレス。パスは含めません。たとえば `https://studio.example.com` です。コードホストのコールバック、メール内のリンク、プッシュ通知のすべてで使われます |
| `SECRETS_KEYS` | 暗号化キー。`1:<key>` の形式です。`openssl rand -hex 32` で生成します。暗号化された認証情報と API キーがこれに依存し、サインインセッションもここから導出されます |
| `INITIAL_ADMIN_USERNAME`、`INITIAL_ADMIN_EMAIL`、`INITIAL_ADMIN_PASSWORD` | 最初の管理者。アカウントがまだない初回起動時にだけ作成されます。あとから変更しても既存のアカウントは変わりません |
| `DB_DIALECT`、`DB_HOST`、`DB_PORT`、`DB_DATABASE`、`DB_USERNAME`、`DB_PASSWORD`、`DB_SSL` | データベースの接続 |
| `WEB_PUSH_PRIVATE_KEY` | プッシュ用の秘密鍵。[通知とプッシュ](../admin/notifications.md) を参照してください |
| `SMTP_PASSWORD`、`RESEND_API_KEY` | 招待で使う `system-email` 通知チャネルの認証情報 |
| `AUTH_EMAIL_PASSWORD`、`AUTH_EMAIL_API_KEY` | 独立したパスワード再設定の送信設定の認証情報 |
| `AUTH_EMAIL_PROVIDER`、`AUTH_EMAIL_HOST`、`AUTH_EMAIL_PORT`、`AUTH_EMAIL_SECURE`、`AUTH_EMAIL_USER`、`AUTH_EMAIL_FROM`、`AUTH_EMAIL_REPLY_TO` | 対応する `auth.email` の送信設定を上書きします |
| `API_BODY_LIMIT`、`API_TIMEOUT` | API リクエストの最大ボディサイズと処理のタイムアウト |

Studio は `https://studio.example.com/main/` のように `/main` の下で提供されます。ランタイムを追加したり `nb-studio` にサインインしたりするときは、`/main` を含むこの完全なアドレスを使います。

> [!WARNING] 暗号化キー
> デプロイ後に `SECRETS_KEYS` を変更しないでください。変更すると全員がサインアウトされ、失うと保存済みの認証情報を復号できなくなります。キーを置き換えるには、新しいキーをより大きいバージョン番号で先頭に置き（`2:<new key>,1:<old key>`）、再暗号化してから古いキーを削除します。

## config.yml の主な設定

| 設定 | 設定する内容 |
| --- | --- |
| `i18n.defaultLocale` | 画面の言語。`en-US` など、チームの言語に設定します。設定しない場合、画面は英語です |
| `auth.emailAndPassword.disableSignUp` | `true` にするとセルフ登録がオフになり、メンバーは招待でのみ参加します。テンプレートには含まれていないので、自分で追加してください |
| `auth.passwordReset.enabled` | 有効な `auth.email` と公開オリジンがある場合に、組み込みの再設定機能を有効にします |
| `auth.email` | `provider: smtp` または `provider: resend` を使う、独立したパスワード再設定の送信設定 |
| `users.invitations.emailChannel` | 招待の通知チャネル。既定は `system-email` です |
| `notification.channels` | リマインダーのチャネル：アプリ内（`inbox`）、メール（`system-email`、SMTP または Resend 経由）など。[通知とプッシュ](../admin/notifications.md) を参照してください |
| `push` | プッシュ通知：`privateKey` と `contact` |
| `database` | データベースの接続。環境変数で上書きされます |
| `users.initialAdmin` | 最初の管理者。環境変数で上書きされます |
| `secrets.keys` | 暗号化キー。環境変数 `SECRETS_KEYS` で上書きされます |
| `logging` | ログレベルと、ログを保持する日数と量 |
| `studio.git.apiBaseUrls` | セルフホストの GitHub Enterprise や GitLab の API アドレス（既定の場所にない場合） |
| `studio.agents.queuedExpiryHours` | キューに入った作業が失敗になるまでランタイムを待つ時間。既定は 24 時間です。0 にすると無期限に待ちます |
| `agents.runs.retentionDays` | 終了した実行のトランスクリプトとプロンプトを保持する日数。既定は 14 日です |
| `drive` | ファイルストレージ。既定はローカルの `storage` ディレクトリです。S3 互換のオブジェクトストレージにも対応しています |
| `releases.artifact` | リリース成果物のストレージ。既定のファイルディスクとは別に設定します |
| `studio.testing.enabled` | 品質管理のメニューを表示します。`STUDIO_TESTING_ENABLED=true` でも設定できます |

## 複数のインスタンスを動かす

単一の Studio インスタンスでは Redis は不要です。複数のインスタンスでは、`realtime`（リアルタイムメッセージ）と `jobs`（定期ジョブ）の両方を Redis に切り替え、すべてのインスタンスで 1 つの名前空間を共有します。Redis で永続化をオンにし、`maxmemory-policy noeviction` を設定してください。そうしないと定期ジョブが失われる可能性があります。

## リリース管理

| 設定 | 設定する内容 |
| --- | --- |
| `releases.docker` | Docker モードをオンにします：`enabled: true` と、Docker アプリの入口アドレスとポート。[デプロイ環境](../admin/environments.md) を参照してください |
| `releases.host.launchPrefix` | Studio の設定を読めない別のシステムユーザーでプレビューを実行します |
| `studio.releases.previewPublicUrl` | Studio のアドレスを共有せず、プレビュー専用のドメインを使います。たとえば `https://studio-preview.example.com/{appId}/` です |
| `studio.releases.previewEnvironment` | `false` にすると、インストール時にプレビュー環境を作成しません |

本格的に使う場合は、プレビューに専用のドメインを使い、別のシステムユーザーで実行してください。プレビューはまだマージされていないコードを実行するため、Studio の設定とシークレットを読めないようにすべきです。
