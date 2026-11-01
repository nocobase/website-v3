---
title: コマンドラインリファレンス
description: アプリのコマンドの入口、ソースとデプロイの違い、設定、データベース、プラグイン、JSON の出力。
---

このページでは、アプリの `nocobase` コマンドを扱います。アプリやプラグインの作成、本番のリリースのインストールには、別のツールを使います。[アプリを作成する](../getting-started/create-app.md)、[プラグインを作成する](../extension-development/create-plugin.md)、[PM2 でデプロイする](../tutorials/deploy-with-app-installer.md) を参照してください。

## 入口

アプリのソースのルートで、ローカルの依存関係のコマンドを実行します。

```bash
pnpm nocobase commands
pnpm nocobase config check --no-connect
pnpm nocobase plugin register --help
```

デプロイの出力には、独自の CLI が含まれます。デプロイしたアプリのルートで次を実行します。

```bash
node dist/cli/index.js commands
node dist/cli/index.js config check --no-connect
```

デプロイ環境に含まれるのは、ビルド時に残された実行時のコマンドで、`dev`、ソースのプラグインの組み込み、ビルドなどの開発用のコマンドは含まれません。app-installer でのインストールでは、デプロイのガイドで説明しているリリースのディレクトリの下の入口を使います。

## コマンドの索引

「ソース」は開発のワークスペースを、「両方」はソースとデプロイの両方の実行環境を意味します。プラグインが追加のコマンドを提供するため、現在のアプリの `commands` の出力を確認してください。

| コマンド | 環境 | 用途と主なオプション |
| --- | --- | --- |
| `dev` / `build` / `start` | ソース | 開発、ビルド、ビルドの出力の起動。フラグはそれぞれのコマンドが扱う |
| `info` / `commands` | 両方 | アプリの情報 / コマンドのツリーを確認する。`commands --json` は引数と実行の機能を報告する |
| `config init` | 両方 | ローカルの設定を初期化する。`--dialect`、`--config`。データベースのドライバーはインストールしない |
| `config set` | 両方 | `key=value` を書き込む。`--from-env` は環境変数から値を読み取る |
| `config check` | 両方 | 設定を確認する。オフラインのチェックには `--no-connect`。`--strict` は警告を失敗として扱う |
| `config env` / `config variables` | 両方 | 環境変数の対応付け / デプロイのメタデータを一覧表示する。`variables --out` はマニフェストを書き出す |
| `db apply` | 両方 | 保留中のマイグレーションとシードを適用する。`--dry-run` に対応 |
| `db rollback` / `db redo` | 両方 | 最新のマイグレーションのバッチをロールバックする / ロールバックして再適用する。データベースを変更する |
| `db reset` | 両方 | 管理対象のテーブルをリセットする。データを削除する |
| `db repair` | 両方 | マイグレーションのチェックサムを修復する。スキーマのマイグレーションの代わりではない |
| `db unlock` | 両方 | 古くなったマイグレーションのロックを扱う。先に、マイグレーションのプロセスが動いていないことを確認する |
| `db sample` | 開発のみ | サンプルデータを読み込む。カタログに表示されていても、デプロイ環境での実行は拒否される |
| `collections generate` | 両方 | コレクションの成果物を生成する。`--check` は書き込まずに比較する |
| `collections doctor` | 両方 | コレクションとデータベースの違いを診断する。`--fix` で変更を適用する |
| `locales check` | 両方 | ロケールリソースを確認する |
| `secrets status` / `secrets rotate` | 両方 | 暗号化されたデータを確認する / ローテーションする。`rotate --dry-run` はプレビューし、`--batch-size` はバッチを制御する |
| `plugin inspect` | ソース | プラグインの入口と組み込みの情報を確認する |
| `plugin register` | ソース | プラグインをインストールまたは登録する。`--dry-run` でプレビューする |
| `plugin unregister` | ソース | プラグインの登録を解除する。その業務データは削除しない |
| `plugin update` | ソース | 指定したプラグイン、省略した場合は登録済みのすべてのプラグインをアップグレードし、スキルを同期する |
| `package remove` | ソース | 依存関係と関連する組み込みを削除する。`--dry-run` に対応 |
| `skills sync` | ソース | 依存関係のスキルを同期する。パッケージやプラグインのセレクターと `--dry-run` に対応 |
| `dist check` / `dist retarget` | ソース | デプロイの出力を確認する / 対象を変更する |
| `cli build` / `cli link` | ソース | 配布できる業務の CLI をビルドする / ローカルのコマンドのリンクをインストールする |

## 開発とビルド

既定のアプリのスクリプトは、よく使うショートカットを提供しています。

```bash
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

スクリプトはアプリの `package.json` で決まります。対象に合わせたデプロイのアーカイブは次でビルドします。

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

`--target` は `linux-x64` や `linux-arm64-musl` などのプラットフォームを選び、実際のサーバーに合わせます。`--node-version` は対象の Node のメジャーバージョンを選びます。`--tar` は `storage/exports/dist.tar.gz` を書き出します。データベースのネイティブの依存関係は、オペレーティングシステム間で単純にコピーできません。

## 設定のコマンド

```bash
pnpm nocobase config init --dialect sqlite
pnpm nocobase config set server.port=13000 client.app.title="My App"
pnpm nocobase config env
pnpm nocobase config variables --json
pnpm nocobase config check --no-connect --strict
```

`config init` は通常、既存の設定を保ちます。置き換えるには明示的な `--force` が必要です。`config set` はドットで区切ったパスと YAML のスカラー値を受け付けます。複雑なオブジェクトや配列は、ファイルを直接編集してください。未知のセクションは拒否され、環境変数による上書きは有効な値に影響します。

`config check` は既定で SQLite 以外の接続を試みます。`--no-connect` は設定だけを確認し、`--connect` は SQLite も確認します。接続のチェックでマイグレーションは適用されません。フィールドとシークレットの入力については [設定リファレンス](configuration.md) を参照してください。

## データベースのコマンド

接続の選択に対応したコマンドは、`--connection <name>` か、それと同時に使えない `--all` を受け付けます。どちらも省略すると既定の接続を選びます。これらはすべてのコマンドに共通のオプションではありません。

マイグレーションを適用する前に、計画を確認します。

```bash
pnpm nocobase db apply --connection main --dry-run
pnpm nocobase db apply --connection main
```

`rollback`、`redo`、`reset`、`repair` のプレビューと確認のオプションは、各コマンドの `--help` を参照してください。`--force` は操作を明示的に確定するもので、失敗の日常的な対処法ではありません。適用済みのマイグレーションのチェックサムが変わっている場合は、まず調査し、編集がデプロイ済みのスキーマの意味を変えていない場合にだけ修復を検討してください。[データベースのマイグレーション](../framework/database/migrations.md) を参照してください。

## プラグインとスキル

すでに `packages/app-plugin-announcements/` を作成したアプリで、登録の変更をプレビューします。

```bash
pnpm nocobase plugin register @nocobase/app-plugin-announcements --dry-run
pnpm nocobase skills sync --dry-run
```

プラグインの名前は、その `package.json` で決まります。`--no-install` や `--no-skills` などのオプションは、対応しているコマンドでだけ使ってください。組み込まれた実行時の入口を確定するには、生成された Client、Server、CLI の登録のファイルを確認します。[プラグインを管理する](../developing-apps/manage-plugins.md) を参照してください。

`.agents/skills/` の同期されたガイダンスは再生成できます。プラグインが配布するスキルは、そのソースの `skills/` ディレクトリで管理します。

## アプリとプラグインの業務コマンド

アプリのファイル `cli/commands/orders/sync.ts` は次に対応します。

```bash
pnpm nocobase app orders sync --help
```

プラグインは、CLI の入口でコマンドを宣言します。名前空間は通常、パッケージのスコープと `app-plugin-` の接頭辞を取り除いたもので、衝突すると失敗します。デプロイ環境では、新しく追加したソースのファイルをスキャンするのではなく、パッケージ化された業務コマンドを呼び出します。

作成と検証については [アプリのコマンドを書く](../developing-apps/application-commands.md) を、アプリでの登録については [プラグインのコマンドを組み込む](../developing-apps/plugin-commands.md) を、プラグインの実装については [CLI を拡張する](../extension-development/extend-command-line.md) を参照してください。

`cli link` は単独のクライアントのローカルの開発を可能にし、`cli build` はリモートの業務の呼び出しのためにそれをパッケージ化します。動作中のアプリの HTTP の API を使います。組み込みについては [アプリの CLI クライアントを提供する](../developing-apps/cli-client.md) を参照してください。

## JSON と自動化

```bash
pnpm nocobase commands --json
pnpm nocobase config check --no-connect --json
```

成功の包みの主なフィールドを下に示します。`result` は各コマンドが定義します。

```json
{
  "schemaVersion": 1,
  "ok": true,
  "command": "config check",
  "status": "success",
  "result": {},
  "warnings": []
}
```

これは包みのフィールドを示すもので、設定のチェックの完全な結果ではありません。自動化では、終了コード、`ok`、`status` を確認してから `result` を読み取ります。失敗すると通常 0 以外で終了します。`success-noop` は変更が不要だったことを、`partial-success` は作業が残っていることを意味するため、`warnings` と報告された問題を確認します。`commands --json` は、JSON、ドライラン、強制の機能を報告します。`dev`、`build`、`start` などのそのまま引き渡すコマンドは、一律に JSON に対応しているわけではありません。`NOCOBASE_CONTENT_TYPE=json` も、対応している場合にだけ適用されます。

## 検証の範囲

2026-10-27 に、既定のテンプレート beta.83、`@nocobase/app-cli` 1.0.0-beta.29、Node 24.21.0、pnpm 11.7.0 で確認しました。ソースとデプロイのコマンドのカタログ、オフラインでの設定の検証、変数のメタデータ、オプションのヘルプ、ローカルの announcements プラグインの登録のプレビューです。リセット、ロールバック、キーのローテーションなどの状態を変える操作は、このページのためには実行していません。[app-cli のソース](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli) を参照してください。
