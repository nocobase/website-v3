---
title: 設定項目
description: Studio の config.yml の項目、アップロード制限、環境変数を確認します。
---

Studio の設定はデプロイ先の `config.yml` に保存し、コンテナの `/app/config.yml` にマウントします。提供されたイメージからテンプレートを取り出す手順は [Studio のデプロイ](../setup/install.md)を参照してください。

## config.yml を使う

同名のキーを重複させず、既存の設定に反映します。パスワードとキーは対応する項目に記入し、ファイルへのアクセスを制限してください。変更後は Studio コンテナを作り直します。

```bash
docker compose up -d --force-recreate studio
```

## アプリのアドレスと画面

| 項目 | 説明 |
| --- | --- |
| `app.publicOrigin` | パスを含まない公開アドレス。例：`https://studio.example.com`。コールバック、メールのリンク、プッシュに使用 |
| `app.sampleData` | 初回インストール時にサンプルデータを読み込むか。空の環境では `false` |
| `client.app.title` | 画面に表示するアプリ名。`client` の値はブラウザーに公開されるため、認証情報は入れない |
| `i18n.defaultLocale` | 既定の表示言語。省略時は英語 |

Studio の既定パスは `/main` です。ランタイムと CLI の接続には `https://studio.example.com/main/` のような完全な URL を使います。

## データベース

| 項目 | 説明 |
| --- | --- |
| `database.default` | 既定の接続名。通常は `main` |
| `database.connections.main.dialect` | データベースの種類。テンプレートは `sqlite`、デプロイ例は `postgres` |
| `database.connections.main` | 接続先の `host`、`port`、`database`、`username`、`password`、TLS 用の `ssl` |
| `database.connections.main.schemaManagement` | Studio のデータベースには `managed` を使用 |
| `database.connections.main.migrations.autoRun` | `true` で起動時にマイグレーションを実行 |
| `database.connections.main.seeds.autoRun` | `true` で起動時に初期データを設定 |

PostgreSQL の完全な例は [Studio のデプロイ](../setup/install.md)を参照してください。既存のデータベースでは実際のホスト、ポート、認証情報を指定します。

PostgreSQL サーバーで JIT を無効にすることを推奨します。設定方法は[サービスを起動する](../setup/install.md#サービスを起動する)を参照してください。

## 管理者とサインイン

| 項目 | 説明 |
| --- | --- |
| `users.initialAdmin` | 初期管理者の `username`、`email`、`password`。ユーザーがいないときだけ作成。設定変更で既存アカウントは更新されない |
| `auth.emailAndPassword.enabled` | パスワードでのサインインを有効にする |
| `auth.emailAndPassword.disableSignUp` | チーム用の環境では `true` にして自己登録を無効にする |
| `auth.emailAndPassword.autoSignIn` | 登録後の自動サインイン。デプロイ例では `false` |
| `auth.passwordReset.enabled` | パスワード再設定を有効にする。メールサービスと正しい `app.publicOrigin` も必要 |
| `auth.session.storeSessionInDatabase` | テンプレートは `true`。サインインセッションをデータベースに保存 |

## 暗号化キー

| 項目 | 説明 |
| --- | --- |
| `secrets.keys` | `version` と `key` のリスト。先頭を新規暗号化に、他を既存データの復号に使用 |

`openssl rand -hex 32` でキーを生成します。`secrets.keys` のリスト全体をバックアップしてください。紛失すると保存済み認証情報を復号できません。現在のキーを変更するとセッションが無効になります。再暗号化が終わるまで古いキーは削除しないでください。

## ファイルストレージとアップロード制限

| 項目 | 説明 |
| --- | --- |
| `drive.default` | ファイルの保存先ディスク。既定は `local` |
| `drive.disks.<name>` | ディスクのドライバー、保存先、認証情報。`fs`、`s3` に対応 |
| `drive.disks.<name>.maxFileSizeMb` | ディスクの 1 ファイルあたりの上限。MiB 単位、既定は `20`。正の整数で指定 |

`maxFileSizeMb` はタスク、コメント、エージェント会話の添付ファイルに適用され、保存先ディスクごとに設定します。変更後は Studio を再起動し、ページを再読み込みしてください。リバースプロキシの上限にも multipart フォームの分を含めた余裕が必要です。`api.bodyLimit` を設定した場合は、その上限も満たす必要があります。ドライバーの例は[ファイルと成果物の保存](storage.md)を参照してください。

## API リクエスト制限

| 項目 | 説明 |
| --- | --- |
| `api.bodyLimit` | API リクエスト本文の上限。例：`60mb`。既定では全体制限なし。ルート独自の制限は適用される |
| `api.timeout` | 処理タイムアウト。例：`30s`。既定では無効。開始済みのストリーミング応答は中断しない |
| `api.rateLimit` | 任意の `max` と `window`。例：`1m` あたり `600` 回。プロセスと接続元アドレスごとに集計 |

リバースプロキシ経由のリクエストは、接続元アドレスと制限枠を共有する場合があります。`api.rateLimit` はこの点を考慮して設定します。

## メールと通知

| 項目 | 説明 |
| --- | --- |
| `mailers.default` | 既定のメールサービス名。例：`system` |
| `mailers.<name>` | SMTP は `provider: smtp`、`host`、`port`、`secure`、`auth.user`、`auth.pass`、`from`。Resend は `provider: resend`、`apiKey`、`from` |
| `users.invitations.mailer` | 招待メールのサービス。省略時は `mailers.default` |
| `auth.passwordReset.mailer` | パスワード再設定のサービス。省略時は `mailers.default` |
| `notification.channels` | アプリ内通知は `type: in-app`、メール通知は `type: email`。`mailer` でサービスを選択可能。メールサービスの設定だけでは通知チャネルは作成されない |
| `push.privateKey`, `push.contact` | プッシュ用の秘密鍵と連絡先。HTTPS が必要 |

招待とパスワード再設定は既定のメールサービスを共有します。パスワード再設定には `auth.passwordReset.enabled` も必要です。SMTP、Resend、送信確認は[通知とプッシュ](../admin/notifications.md)を参照してください。

## エージェントと実行記録

| 項目 | 説明 |
| --- | --- |
| `studio.agents.queuedExpiryHours` | 待機中の作業の期限。既定は `24` 時間、`0` は無期限 |
| `studio.agents.managerIdleMinutes` | コーディネーターエージェントの待機復旧しきい値。既定は `15` 分、`0` で無効 |
| `studio.agents.managerIdleSweepMinutes` | 待機チェックの間隔。既定は `5` 分。正の値が必要 |
| `agents.runs.retentionDays` | 終了した実行のイベントとプロンプトの保持日数。既定は `14`、`0` で保持 |
| `agents.conversations.archivedRetentionDays` | アーカイブ済み会話の保持日数。既定は `30`、`0` で保持 |
| `agents.skills.disk` | スキル内容の保存先。既定は `drive.default` |

## Git プラットフォーム

| 項目 | 説明 |
| --- | --- |
| `studio.git.apiBaseUrls` | ホスト名ごとに自前の Git サービスの API URL を指定。既定の URL が使える場合は不要 |

Git 接続と認可は画面で設定します。[コードホスティング](../configure/git.md)を参照してください。

## プレビューとリリース成果物

| 項目 | 説明 |
| --- | --- |
| `releases.artifact` | 成果物の保存先。既定は `/app/storage/releases/artifacts`。`drive.default` とは独立 |
| `releases.maxArtifactSizeMB` | リリース成果物の上限。既定は `256` MiB。添付ファイルの `maxFileSizeMb` とは別 |
| `releases.host.memoryBudget` | `targetRatio` は `0.7`、`appMemoryMb` は `320`、`reserveMb` は `0` が既定。アプリのピーク使用量とサーバー容量に合わせて調整 |
| `releases.host.maxActiveApps` | 実行中アプリ数の上限。メモリーチェックも適用される |
| `releases.host.launchPrefix` | プレビュー起動コマンドのプレフィックス。Studio の設定を読めないシステムユーザーへの切り替えに使用可能 |
| `releases.docker` | `enabled: true` で Docker 実行を有効化。固定の入口ポートとリバースプロキシを設定 |
| `studio.releases.previewPublicUrl` | プレビュー用の独立したオリジン。例：`https://studio-preview.example.com/{appId}/` |
| `studio.releases.previewEnvironment` | `false` でプレビュー環境の自動作成を無効化 |

プレビューには独立したオリジンと、Studio の設定を読めないシステムユーザーを使います。実行方式は[ホスト環境](../admin/environments.md)を参照してください。本番デプロイはチームで管理します。

## ログ

| 項目 | 説明 |
| --- | --- |
| `logging.level` | ログレベル。テンプレートでは `info` |
| `logging.file` | ファイルログの `enabled`。テンプレートは `retentionDays: 7`、`maxFileSizeMB: 10`、`maxTotalSizeMB: 500` |
| `logging.loggers.request.file.name` | リクエストログ名。テンプレートは `request` |
| `logging.console` | コンソールの `enabled` と `pretty`。テンプレートは整形表示を無効化 |

## 環境変数

デプロイ基盤から値を渡す場合は、Studio が明示的に対応する環境変数を使えます。対応する `config.yml` の値を上書きします。環境変数がない項目はファイルに設定してください。

Compose の `.env` は Compose 設定内の変数置換用です。Studio に渡すには `services.studio.environment` または `env_file` で明示します。`config.yml` 内の `${NAME}` は展開されません。

| 環境変数 | config.yml の項目または用途 |
| --- | --- |
| `APP_PUBLIC_ORIGIN` | `app.publicOrigin` |
| `APP_SAMPLE_DATA` | `app.sampleData` |
| `INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | `users.initialAdmin.username` / `email` / `password` |
| `SECRETS_KEYS` | `secrets.keys` — `2:<new-key>,1:<old-key>` |
| `DB_DIALECT` / `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` / `DB_SSL` / `DB_FILENAME` | `database.connections.main.dialect` / `host` / `port` / `database` / `username` / `password` / `ssl` / `filename` |
| `MAILERS_DEFAULT` | `mailers.default` |
| `MAILERS_SYSTEM_PROVIDER` / `MAILERS_SYSTEM_HOST` / `MAILERS_SYSTEM_PORT` / `MAILERS_SYSTEM_SECURE` | `mailers.system.provider` / `host` / `port` / `secure` |
| `MAILERS_SYSTEM_USER` / `MAILERS_SYSTEM_PASSWORD` | `mailers.system.auth.user` / `auth.pass` |
| `MAILERS_SYSTEM_API_KEY` | `mailers.system.apiKey` |
| `MAILERS_SYSTEM_FROM` / `MAILERS_SYSTEM_REPLY_TO` / `MAILERS_SYSTEM_ENABLED` | `mailers.system.from` / `replyTo` / `enabled` |
| `WEB_PUSH_PRIVATE_KEY` | `push.privateKey` |
| `API_BODY_LIMIT` / `API_TIMEOUT` | `api.bodyLimit` / `api.timeout` |
| `STUDIO_MANAGER_IDLE_MINUTES` / `STUDIO_MANAGER_IDLE_SWEEP_MINUTES` | `studio.agents.managerIdleMinutes` / `managerIdleSweepMinutes` |
| `RELEASES_HOST_ENABLED` | `releases.host.enabled` |
| `APP_CONFIG_FILE` | 起動時に読む設定ファイル。提供イメージの既定は `/app/config.yml` |
| `APP_BASE_PATH` | 起動時の公開パス。提供イメージの既定は `/main` |
| `APP_SERVER_HOST` / `APP_SERVER_PORT` | 待ち受けアドレスとポート。提供イメージの既定は `0.0.0.0` / `13000` |
