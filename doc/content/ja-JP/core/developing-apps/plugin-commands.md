---
title: プラグインのコマンドを組み込む
description: 既存のプラグインのコマンドを cli/plugins.ts で登録し、名前空間、開発用コマンド、ビルドフック、デプロイ時の動作を確認します。
---

プラグインは `./cli` の入口からコマンドを公開します。アプリは `cli/plugins.ts` で提供内容を選びます。このガイドではアプリ側での登録と利用を扱います。プラグインのコマンドの実装とエクスポートについては [CLI を拡張する](../extension-development/extend-command-line.md) を参照してください。

## プラグインが提供するものを確認する

プラグインのドキュメント、`package.json` の exports、`cli/index.ts` を読みます。`./cli` の入口と、コマンドが必要とするサービスや設定を確認します。クライアントやサーバーのプラグインが、必ずしもコマンドを提供するとは限りません。

既定のテンプレートは、`cli/plugins.ts` に Foundation と Scheduler を登録しています。Examples ではさらに、CLI Example、Agents などの提供内容も登録しています。アプリの既存のエントリーを残し、各プラグインに必要な実行時の部分を接続してください。

CLI、サーバー、クライアントの登録は、それぞれ目的が異なります。CLI の提供内容を登録しても、そのコマンドが必要とするサービスが自動で登録されるわけではありません。`server/plugins.ts` も確認してください。インストールと登録については [プラグインを管理する](manage-plugins.md) を参照してください。

## アプリに登録する

この例では、[CLI を拡張する](../extension-development/extend-command-line.md) で作成したローカルの `@nocobase/app-plugin-notice-cli` を使います。先にそのガイドを終え、パッケージが解決できるようワークスペースの依存関係をインストールしておきます。これはチュートリアル用のパッケージで、この名前が npm で入手できることを意味するものではありません。

登録をプレビューしてから、適用します。

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install
```

`--no-install` は依存関係のインストールを省略します。先にワークスペースをインストールし、`package.json` とロックファイルを管理しておいてください。生成された `cli/plugins.ts` を確認します。既定のテンプレートを拡張すると、次のような一覧になります。アプリにほかのエントリーがあれば残してください。

```ts
// cli/plugins.ts
import { defineCliPlugins, type AppCliPlugins } from '@nocobase/app-cli';
import foundation from '@nocobase/app-plugin-foundation/cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';
import noticeCli from '@nocobase/app-plugin-notice-cli/cli';

const cliPlugins: AppCliPlugins = defineCliPlugins([
  scheduler,
  foundation,
  noticeCli,
]);

export default cliPlugins;
```

`defineCliPlugins()` は配列の順序で提供内容を組み合わせます。自動で登録したあとに、もう一度エントリーを追加しないでください。手動で編集する場合は、インポートと配列のエントリーの両方を管理します。

## コマンドを探して実行する

`@nocobase/app-plugin-notice-cli` のトピックは `notice-cli` です。宣言された `preview` コマンドは次のように呼び出します。

```bash
pnpm nocobase notice-cli preview --help
pnpm nocobase notice-cli preview --text " Hello " --json
pnpm nocobase notice-cli preview --text " " --json
```

2 つ目のコマンドは `result: { text: "Hello", length: 5 }` を返します。3 つ目は終了コード `2` で `INVALID_TEXT` を返します。コマンドを探すには `pnpm nocobase commands --json` を、引数を確認するにはコマンドの `--help` を使います。共通の出力とエラーの取り決めについては [アプリのコマンドを書く](application-commands.md) を参照してください。

Examples には、すでに実行できる別のコマンドも含まれています。

```bash
pnpm nocobase cli-example greet world --json
```

これは `@nocobase/app-plugin-cli-example` から来ており、挨拶と対象の名前を返します。既定のテンプレートはこのサンプルプラグインを登録していないため、そこにこのコマンドがあるとは考えないでください。

トピックは通常、パッケージ名から npm のスコープと `app-plugin-` の接頭辞を除いたものになります。トピックが重複すると競合し、登録の順序で上書きすることはできません。無関係なアプリのコマンドを削除するのではなく、プラグインの命名の競合を解決してください。

## 開発用コマンドとビルドフック

| 提供内容 | アプリでの用途 | デプロイ時 |
| --- | --- | --- |
| `commands` | 実行時の診断と保守 | 含まれる |
| `devCommands` | ソースの確認と生成 | 登録されない |
| `buildHooks` | アプリのビルド中のタスク | ビルド時に実行され、デプロイ時のコマンドではない |
| `devHooks` | 開発時の起動前のタスク | 開発時に実行される |

ビルドの段階は `beforeBuild`、`afterClientBuild`、`afterServerBuild`、`afterBuild` で、開発時の段階は `beforeDev` です。アプリの CLI は登録されたフックを収集します。プロジェクトの `pnpm build` と `pnpm dev` を使い、すべてのフックをアプリのスクリプトにコピーしないでください。

フックの `command` は実行ファイルと引数の配列で、シェルの式ではありません。作成の詳細は [CLI を拡張する](../extension-development/extend-command-line.md#開発用コマンドとフック) を参照してください。Examples の `preview-acceptance.ts` ヘルパーは、そのアプリの検収のチェックを支えるもので、一般的なプラグインの登録には必要ありません。

## 確認して削除する

ヘルプにトピックが含まれること、有効な入力で期待どおりの結果が返ること、無効な入力で固定のエラーコードが返ることを確認します。ビルド後、デプロイ用の入口を確認します。

```bash
pnpm build
node dist/cli/index.js notice-cli preview --text Hello --json
node dist/cli/index.js commands --json
```

デプロイ時のコマンドのセットには `commands` が含まれ、`devCommands` は含まれないはずです。サービスやデータベースを使うコマンドでは、分離した設定で実際のサービスへのアクセスも確認します。テキストのプレビューで確認できるのは、登録と出力だけです。

CLI の提供内容だけを公開しないようにするには、`cli/plugins.ts` からそのインポートと配列のエントリーを削除し、ビルドし直します。プラグイン全体をアンインストールする前に、[プラグインを管理する](manage-plugins.md) の説明に従って、ほかのランタイム、依存関係、データベースのリソースを確認してください。

出典：[Examples の CLI の登録](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/cli/plugins.ts) と [CLI Example の宣言](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/examples/app-plugin-cli-example/cli/index.ts)。
