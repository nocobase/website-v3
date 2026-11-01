---
title: 設定リファレンス
description: ファイルと環境変数の優先順位、よく使うセクション、ブラウザーから見える値、独自のルール、検証のコマンド。
---

設定は、アプリと組み込まれたモジュールが一緒に定義します。このページは既定のテンプレートのよく使うフィールドの索引です。インストールされたアプリのメタデータの全体は、`pnpm nocobase config variables --json` で確認してください。開発の流れについては [アプリの設定（config.yml）](../developing-apps/configuration-and-settings.md) を参照してください。

## ファイルと優先順位

既定のテンプレートは、次の順に値をマージし、あとのものが優先されます。

```text
Code defaults in server/config/
    → config.yml
    → explicitly mapped environment variables
```

プレーンなオブジェクトは再帰的にマージされ、配列とスカラー値は置き換えられます。環境変数には宣言された対応付けが必要で、任意にパスへ変換されることはありません。YAML の `${NAME}` はリテラルの文字列で、自動で展開されることはありません。

| 場所 | 役割 |
| --- | --- |
| `server/config/` | セクションの既定値、環境変数の対応付け、検証 |
| `config.example.yml` | 初期化時に使う、コミットできる例 |
| `config.yml` | 環境ごとのローカルの設定。シークレットを含むことがあり、Git に入れてはいけない |
| `APP_CONFIG_FILE` | 別の設定ファイルを選ぶ。相対パスはアプリのルートから解決される |
| `dist/variables.json` | 生成されたデプロイの設定のメタデータ。シークレットの値のバックアップではない |

初期化していないアプリで `pnpm nocobase config init --dialect sqlite` を実行すると、例からローカルの設定とキーを生成します。アップグレードでは既存のキーを保ってください。初期化し直すことはアップグレードの手順ではありません。

## よく使う設定のフィールド

| フィールド / セクション | 意味 |
| --- | --- |
| `server.host` / `server.port` | 待ち受けのアドレスとポート。テンプレートのコードの既定値は `127.0.0.1` / `13000` |
| `server.startLog` | 起動時のアドレスを表示するかどうか。開発用のコマンドには独自のバナーがある |
| `app.publicOrigin` | 公開のスキームとホスト。絶対リンクとコールバックに使う |
| `app.sampleData` | 初回のセットアップでサンプルデータを読み込むかどうか |
| `database.default` | 既定の接続名。テンプレートでは `main` |
| `database.connections.<name>` | ダイアレクト、接続のオプション、スキーマの管理のモード |
| `api.bodyLimit` / `api.timeout` / `api.rateLimit` | HTTP のボディの上限、タイムアウト、レート制限。必要に応じて設定する |
| `secrets.keys` | バージョン付きのマスターキー。機密データを保護し、アップグレードをまたいで残す必要がある |
| `session` / `auth` | それぞれのモジュールが所有するセッションと認証の設定 |
| `users.initialAdmin` | 空のユーザーのデータベースの初期セットアップ用のユーザー名、メールアドレス、パスワード。既存のアカウントはリセットしない |
| `i18n.defaultLocale` | 既定のロケール。利用できる言語は、読み込まれたリソースにも依存する |
| `logging` | ログレベル、出力先、ファイルのローテーション |
| `client.app.title` | ブラウザーに表示されるアプリのタイトル |
| `client.app.defaultColorScheme` | `light`、`dark`、`system`。ユーザーが保存した設定が優先される |
| `client.app.defaultTheme` | アプリのテーマのプリセットの ID。テーマのソースに存在する必要がある |
| `jobs` / `queue` / `caching` / `drive` | バックグラウンドジョブ、キュー、キャッシュ、ストレージのアダプター |
| `mail` / `notification` / `scheduler` / `knowledge` | プラグインや組み込みの設定。インストールされたバージョンと登録による |

これは設定の場所の索引で、コピーして使える完全なファイルではありません。既定値、対応しているフィールド、プラグインのセクションは、現在のテンプレートとパッケージの宣言を参照してください。

たとえば、初期化済みのローカル開発のアプリの既存の設定に、次の値をマージします。

```yaml
server:
  host: 127.0.0.1
  port: 13000

client:
  app:
    title: My App
    defaultColorScheme: system
```

データベースとキーの設定は保ってください。LAN からのアクセスを許可するには、必要に応じて `0.0.0.0` にバインドし、ブラウザーではマシンの実際の IP を使います。`0.0.0.0` はブラウザーのアドレスではありません。開発では別のフロントエンドのポートを使うことがあります。`pnpm dev` が表示する URL に従ってください。

## データベースの設定

接続は `database.connections.<name>` に置き、`database.default` が既定を選びます。SQLite は `filename` を使います。ほかのダイアレクトでは一般に `host`、`port`、`database`、`username`、`password` を使います。ダイアレクト固有のフィールドについては [データベースの対応状況とバージョンの互換性](compatibility.md) を参照してください。

`schemaManagement: managed` はフレームワークによるスキーマの管理を許可します。`external` は外部のデータベースに対するフレームワークのスキーマの変更を制限しますが、業務データを自動で読み取り専用にするわけではありません。アカウントの権限と認可のポリシーは引き続き適用されます。

SQLite は、テンプレートの `database` というファイル名の書き方も受け付け、`filename` と両方ある場合はそちらが優先されます。古い `database` の値が `DB_FILENAME` を上書きしないよう、ファイルの場所を変えるときは 1 つの書き方に統一してください。

既定の `DB_*` の対応付けは `main` だけを対象にします。追加の接続の対応付けは、既定の接続の対応付けを残したまま、`@nocobase/app-server/database` の `connectionEnvironment(name, prefix)` で宣言します。ダイアレクトやアドレスを変えても、既存のデータは移行されません。

## 環境変数

以下の対応付けは、確認したアプリのメタデータから来ています。認証、メール、通知の対応付けはそれぞれのモジュールに依存します。正確な型、説明、機密のフィールドの印は、現在のコマンドの出力を参照してください。

| 変数 | フィールド |
| --- | --- |
| `APP_SERVER_HOST` / `APP_SERVER_PORT` / `APP_SERVER_START_LOG` | `server.host` / `server.port` / `server.startLog` |
| `APP_PUBLIC_ORIGIN` / `APP_SAMPLE_DATA` | `app.publicOrigin` / `app.sampleData` |
| `DB_DIALECT` / `DB_HOST` / `DB_PORT` | `database.connections.main.dialect` / `.host` / `.port` |
| `DB_DATABASE` / `DB_FILENAME` | `database.connections.main.database` / `.filename` |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_SSL` | `database.connections.main.username` / `.password` / `.ssl` |
| `API_BODY_LIMIT` / `API_TIMEOUT` | `api.bodyLimit` / `api.timeout` |
| `SECRETS_KEYS` | `secrets.keys` |
| `AUTH_SECRET` / `SESSION_SECRET` | `auth.secret` / `session.secret` |
| `INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | `users.initialAdmin.username` / `.email` / `.password` |
| `APP_DEFAULT_LOCALE` | `i18n.defaultLocale` |
| `SNOWFLAKE_WORKER_ID` | `snowflake.workerId` |
| `APP_VITE_DEV_URL` | `spa.viteDevUrl` |
| `MAIL_JOBS` / `MAIL_SYNC_BATCH_SIZE` / `MAIL_AUTOMATIC_SYNC_INTERVAL_MS` | `mail.jobs` / `.syncBatchSize` / `.automaticSyncIntervalMs` |
| `MAIL_OAUTH_CALLBACK_URL` / `MAIL_OAUTH_RETURN_URL` | `mail.oauthCallbackUrl` / `.oauthReturnUrl` |
| `MAIL_PUSH_WEBHOOK_URL` / `MAIL_PUSH_WEBHOOK_SECRET` | `mail.pushWebhookUrl` / `.pushWebhookSecret` |
| `RESEND_API_KEY` / `SMTP_PASSWORD` | `notification.channels.system-email.apiKey` / `.auth.pass` |
| `SCHEDULER_JOBS` | `scheduler.jobs` |

さらに 3 つの変数をランタイムが読み取ります。

| 変数 | 役割 |
| --- | --- |
| `APP_BASE_PATH` | アプリのマウントのベースパス |
| `APP_CONFIG_FILE` | 設定ファイルの場所 |
| `NOCOBASE_STRICT_STARTUP` | プロセスマネージャーが検出できるよう、起動に失敗したら厳格に終了する |

`SECRETS_KEYS` には、現在のキーを先頭にして、カンマで区切った `version:key` のエントリーを入れます。古いデータの復号に引き続き必要なエントリーは残し、ローテーションの手順に従ってください。キーを変えると、既存のセッションが無効になることもあります。各モジュールは、それぞれのルールに従って、明示的なキーか導出したキーを選びます。たとえばセッションは明示的な `session.secret` を優先し、ない場合は Secrets からの導出を試みます。これらの値を変える前に、モジュールの設定の取り決めとキーのローテーションの要件を確認してください。

## ブラウザーから見える設定

`client` セクションはアプリのページに埋め込まれ、ブラウザーから読み取れます。ほかのサーバーのセクションが公開するのは、`defineAppConfig()` の `public` オプションに明示的に列挙した末端のパスだけです。データベースのパスワード、署名のキー、メールの認証情報は、`client` や公開のパスに入れないでください。

announcements のセクションには、`server/config/announcements.ts` を追加します。

```ts
import { defineAppConfig, envInteger } from '@nocobase/app-server/config';

export default defineAppConfig({
  defaults: { pageSize: 20 },
  env: {
    ANNOUNCEMENTS_PAGE_SIZE: envInteger('pageSize', {
      description: 'Default number of announcements per page.',
    }),
  },
  public: ['pageSize'],
  validate(value, context) {
    if (!Number.isInteger(value.pageSize) || value.pageSize < 1 || value.pageSize > 100) {
      context.error('pageSize', 'Expected an integer between 1 and 100.');
    }
  },
});
```

`server/config/index.ts` の既存の `defaultAppConfigs({ ... })` に `announcements` をインポートして追加し、明示的に列挙した戻り値の型を更新します。ファイルのキーは `announcements.pageSize` で、環境変数による上書きは `ANNOUNCEMENTS_PAGE_SIZE` です。`public: ['pageSize']` はそのフィールドだけを公開します。

検証は、起動時、再読み込み時、`config check` で実行されます。実際の値を検証し、ネットワークへのリクエストや書き込みは避けてください。設定を再読み込みしても、既存のサービスが自動で新しい動作に切り替わる保証はありません。サービスは更新を自分で扱う必要があります。

## 編集と確認

```bash
pnpm nocobase config set server.port=13000
pnpm nocobase config env
pnpm nocobase config variables --json
pnpm nocobase config check --no-connect
```

既存の環境変数から、機密の値をローカルの設定に読み込みます。

```bash
pnpm nocobase config set --from-env database.connections.main.password=MAIN_DB_PASSWORD
```

先に、環境の管理の仕組みで `MAIN_DB_PASSWORD` を設定してください。これは動的な変数の参照ではなく、その現在の値を書き込みます。`DB_PASSWORD` も設定されている場合は、それがファイルの値を上書きします。

`config check` は通常、設定を検証し、SQLite 以外の接続を試みます。オフラインでは `--no-connect` を、警告を失敗として扱うには `--strict` を使います。問題を報告するときは、設定ファイル全体ではなく、フィールド名、伏せ字にしたエラー、パッケージのバージョンを伝えてください。[コマンドラインリファレンス](cli.md) を参照してください。

## 検証の範囲

定義は [Core `015404ecd0db` の設定のソース](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/config) と照合しました。変数のメタデータとオフラインのチェックには、既定のテンプレート beta.83、`@nocobase/app-cli` 1.0.0-beta.29、`@nocobase/config` 0.1.0-beta.3 を使いました。追加のプラグインによって、さらにセクションと対応付けが加わることがあります。
