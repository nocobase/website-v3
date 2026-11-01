---
title: コマンドラインのランタイム
---

`@nocobase/app-cli` は、フレームワークのコマンド、アプリの業務コマンド、プラグインのコマンドを 1 つのツリーにまとめます。アプリのメタデータによって、ソースとデプロイのどちらの入口を読み込むかが決まります。

## アプリの場所を特定する

ソースの入口は、作業ディレクトリから上に向かってアプリの `package.json` を探します。`nocobase.templateKind` はソースを、`nocobase.buildTarget` はデプロイの出力を示します。`NOCOBASE_APP_ROOT` を使うと、作業ディレクトリを変えずにアプリを選べます。

デプロイの `dist/cli/index.js` は自分の場所を知っているため、グローバルな CLI も pnpm も必要ありません。別のプロジェクトのコマンドのバージョンを解決しないよう、実際のリリースの入口を使ってください。

```bash
pnpm nocobase commands --json
node dist/cli/index.js commands --json
```

## 業務コマンドの名前空間

| 取得元 | 宣言 | 例 |
| --- | --- | --- |
| アプリ | `cli/commands/orders/sync.ts` | `nocobase app orders sync` |
| プラグイン | `cli/plugins.ts` の CLI の提供内容 | `nocobase orders info` |
| 開発用のツール | プラグインの `devCommands` とフック | ソースの環境にだけ残る |

プラグインのトピックは通常、スコープと `app-plugin-` の接頭辞を取り除いたものになります。同じトピックを生成するパッケージは競合し、登録の順序は上書きの仕組みではありません。

## 必要なサービスだけを起動する

`AppCommand` を継承したコマンドは、`withApp()` でアプリを作成、使用、破棄できます。設定の読み取りやマイグレーションには、通常すべてのバックグラウンドのコンシューマーは必要ありません。業務の動作が完全なライフサイクルを必要とする場合にだけ、`app.start()` を呼び出します。

モジュールのインポートでは、コマンドを宣言するだけにすべきです。トップレベルでデータベースに接続すると、ヘルプやコマンドの発見でも処理が実行されてしまいます。開発用のフックは登録された CLI を通じて集められます。その周りで内部のビルドのスクリプトを呼び出さないでください。

## 出力と引き渡し

コマンドが返したデータは、JSON の包みの `result` になります。進捗は stderr に出します。呼び出し側は、終了コード、`ok`、`status`、警告を確認します。コマンドを追加したら、デプロイの出力に含めるためにビルドし直します。

アプリ側での作成と登録については [アプリのコマンドを書く](../../developing-apps/application-commands.md) と [プラグインのコマンドを組み込む](../../developing-apps/plugin-commands.md) を、プラグインでの宣言については [CLI を拡張する](../../extension-development/extend-command-line.md) を、組み込みのオプションについては [CLI リファレンス](../../reference/cli.md) を参照してください。単独の HTTP クライアントについては [アプリの CLI クライアントを提供する](../../developing-apps/cli-client.md) を参照してください。

## インターフェースと実装

- [CLI ランタイム](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli/README.md)
