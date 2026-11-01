---
title: コマンドラインの拡張
description: 引数、JSON の出力、エラー、ビルドのフックを備えたプラグインのコマンドを登録します。
---

プラグインは、診断、成果物の生成、一度きりの保守のためのアプリのコマンドを提供できます。この例では `notice-cli preview` を追加します。テキストを検証してプレビューを返し、アプリの起動やデータベースのレコードの書き込みは行いません。

## エージェントを使う場合

```text
--text を受け付ける preview コマンドを持つ notice-cli プラグインを作成してください。
テキストが空でないことと長さを検証し、正規化したテキストとその文字数を返し、
--json と安定したエラーコードに対応してください。生成された info コマンドは残し、
成功と失敗をテストして、このアプリにプラグインを登録してください。
```

## CLI の機能を作成する

アプリのルートで実行します。パスは `packages/app-plugin-notice-cli/` からの相対パスです。

```bash
pnpm create @nocobase/plugin@beta notice-cli --with cli
```

ひな形は、`cli/index.ts`、`info` コマンド、`./cli` のエクスポート、開発とビルドの設定を用意します。CLI のプラグインには、Client や Server の入口は必要ありません。

## コマンドを書く

`cli/preview.ts` を作成します。

```ts
import { AppCommand, CommandError } from '@nocobase/app-cli';
import { Flags, type Interfaces } from '@oclif/core';

export interface NoticePreview { readonly text: string; readonly length: number; }

export default class PreviewNotice extends AppCommand {
  static override summary = 'Preview notice text without saving it.';
  static override flags: { text: Interfaces.OptionFlag<string> } = {
    text: Flags.string({ description: 'Text to preview.', required: true }),
  };
  public async run(): Promise<NoticePreview> {
    const { flags } = await this.parse(PreviewNotice);
    if (!flags.text.trim() || flags.text.trim().length > 200) {
      throw new CommandError(
        'Text must contain between 1 and 200 UTF-16 code units.',
        { code: 'INVALID_TEXT', exit: 2 },
      );
    }
    const text = flags.text.trim();
    const result: NoticePreview = { text, length: Array.from(text).length };
    this.log(`${result.text} (${result.length})`);
    return result;
  }
}
```

`AppCommand` は、解析の環境と出力の取り決めを提供します。`--json` はすでに用意されているため、もう一度宣言しないでください。成功時はプレーンなデータを返し、失敗時は `CommandError` を投げます。`process.exit()` や `this.exit()` を呼び出したり、独自の JSON を出力したりしないでください。

入力の上限には JavaScript の文字列の長さを使い、報告する数には Unicode のコードポイントを使います。純粋なテキストの処理には `withApp()` は不要です。アプリを作成するのは、コマンドがその設定やサービスを必要とする場合だけです。

| 必要なこと | 使うもの |
| --- | --- |
| アプリのファイルの場所を知る | `this.rootDir` |
| 設定を読み取る、またはサービスを使う | `this.withApp(async ({ app }) => ...)`。サービスを解決する前に Provider を登録する |
| 完全なライフサイクルを実行する | `withApp()` の中で `await app.start()` を呼び出す |

`withApp()` は、成功しても失敗してもクリーンアップします。完全な起動ではバックグラウンドの処理が始まることがあるため、設定の値を 1 つ読み取るためだけにすべての Provider を起動しないでください。

## コマンドを宣言する

`cli/index.ts` で `info` を残し、`preview` を追加します。

```ts
import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';
import PluginInfo from './info.ts';
import PreviewNotice from './preview.ts';

const cliPlugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-notice-cli',
  commands: { info: PluginInfo, preview: PreviewNotice },
});
export default cliPlugin;
```

`@nocobase/app-plugin-notice-cli` からはトピック `notice-cli` が導かれ、コマンドは `pnpm nocobase notice-cli preview` になります。npm のスコープが異なっていても短い名前が同じパッケージは、同じトピックが導かれるため、そのコマンドの名前空間で共存できません。`build` などの組み込みの名前も予約されています。

| 出力 | 書き方 | `--json` のとき |
| --- | --- | --- |
| 人が読む結果 | `this.log(...)` | 出力されない |
| プログラム向けの結果 | `return result` | 1 つのドキュメントの `result` に含まれる |
| 進捗 | `this.logToStderr(...)` | 引き続き stderr に出力される |
| 警告 | `this.warn(...)` | warnings に含まれる |
| 失敗 | `CommandError` を投げる | `ok: false`、安定した `error.code`、0 以外の終了コード |

## コマンドをテストする

`tests/cli/preview.test.ts` を作成します。

```ts
import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import { describe, expect, it } from 'vitest';
import cliPlugin from '../../cli/index.ts';
import PreviewNotice from '../../cli/preview.ts';

const Preview = bindAppCommand(PreviewNotice, {
  id: `${cliPlugin.topic}:preview`,
  rootDir: import.meta.dirname,
});
describe('preview command', () => {
  it('returns one JSON result', async () => {
    const run = await runAppCommand(Preview, ['--text', ' Hello ', '--json']);
    expect(run.json()).toMatchObject({
      ok: true,
      command: 'notice-cli preview',
      result: { text: 'Hello', length: 5 },
    });
    expect(run.exitCode).toBeUndefined();
  });
  it('reports invalid text with a nonzero exit', async () => {
    const run = await runAppCommand(Preview, ['--text', ' ', '--json']);
    expect(run.json()).toMatchObject({
      ok: false,
      error: { code: 'INVALID_TEXT' },
    });
    expect(run.exitCode).toBe(2);
  });
});
```

生成された `tests/cli/info.test.ts` が、コマンドのマップ全体に `info` だけが含まれることをアサートしている場合は、`expect(cliPlugin.commands.info).toBe(PluginInfo)` に変更します。既存の出力のテストは削除せずに残してください。

```bash
pnpm --filter @nocobase/app-plugin-notice-cli format
pnpm --filter @nocobase/app-plugin-notice-cli check
```

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install
```

```bash
pnpm nocobase notice-cli preview --text " Hello "
pnpm nocobase notice-cli preview --text " Hello " --json
pnpm nocobase notice-cli preview --text " " --json
```

最初の 2 つは `Hello` と長さ 5 を返します。最後のコマンドは `INVALID_TEXT` を返し、終了コード 2 で終了します。アプリの `pnpm build` のあと、`node dist/cli/index.js notice-cli preview --text Hello --json` を実行して、デプロイ環境のコマンドも確認してください。

## 開発用コマンドとフック

デプロイ後に必要なコマンドは `commands` に置きます。ソースでだけ使うコンパイルや生成のコマンドは `devCommands` に置き、デプロイ環境のコマンドからは除外されます。

`buildHooks` や `devHooks` は、アプリが本当に生成の手順を必要とする場合にだけ使います。ビルドの段階は `beforeBuild`、`afterClientBuild`、`afterServerBuild`、`afterBuild` で、開発には `beforeDev` があります。フックの `command` は、実行ファイルと引数の配列で、シェルの文字列ではありません。`&&`、パイプ、リダイレクトは使えません。失敗するとパイプラインが止まるため、フックは必須の成果物の生成に向いています。

アプリ側の設定と確認については [プラグインのコマンドを組み込む](../developing-apps/plugin-commands.md) を参照してください。1 つのアプリだけが所有するコマンドは `cli/commands/` に直接置けます。[アプリのコマンドを書く](../developing-apps/application-commands.md) を参照してください。
