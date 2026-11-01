---
title: アプリのコマンドを書く
description: cli/commands に AppCommand クラスを書き、アプリのサービスにアクセスし、パスと JSON 出力を扱い、デプロイ環境でコマンドを確認します。
---

アプリが所有するコマンドは `cli/commands/` に置きます。データのエクスポート、診断、一度きりの保守に使います。たとえば `pnpm nocobase app statuses export` は、ステータス辞書を読み取ってファイルに保存します。

このガイドは、アプリのディレクトリと設定にアクセスできる開発者と運用担当者向けです。ユーザーやエージェントにネットワーク経由で業務操作を行わせるには、[アプリの CLI クライアントを提供する](cli-client.md) を参照してください。複数のアプリで共有するコマンドについては、[プラグインのコマンドを組み込む](plugin-commands.md) を参照してください。

## ディレクトリとコマンド名

```text
cli/
├── commands/
│   └── statuses/
│       ├── export.ts       # app statuses export
│       └── _helpers.ts     # ヘルパー。コマンドではない
└── plugins.ts              # プラグインのコマンドの登録
```

各コマンドファイルは `AppCommand` のサブクラスをデフォルトエクスポートします。パスが `app` の下での名前を決め、索引への登録は不要です。`_` で始まるファイルとディレクトリ、`lib` という名前のディレクトリはスキップされます。`dist`、`build`、`coverage`、`generated` はコマンドのディレクトリに使わないでください。プロジェクトのバージョン管理、フォーマット、チェックのルールがこれらの名前を無視します。

アプリのコマンドはデプロイ用のビルドに含まれるため、実行時に使うパッケージは `dependencies` に入れる必要があります。ソースでしか使わないジェネレーターは、プロジェクトのスクリプトかプラグインの `devCommands` に置きます。アプリのコマンドには、開発専用の宣言は別にありません。

## 例：ステータス辞書をエクスポートする

まず [テーブルを作成してデータを初期化する](data-models-and-migrations.md) の冒頭にある独立した `appStatuses` の例を終えておきます。そのマイグレーションとシードを適用し、`code` と `title` のフィールドと既定のレコードを作成します。任意の説明フィールドを追加しても、このコマンドがエクスポートするフィールドや既定のコードは変わりません。

`cli/commands/statuses/export.ts` を追加します。

```ts
// cli/commands/statuses/export.ts
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { AppCommand, CommandError, appPath } from '@nocobase/app-cli';
import { Flags, type Interfaces } from '@oclif/core';

export interface StatusExportResult {
  readonly file: string;
  readonly count: number;
  readonly written: boolean;
}

export default class ExportStatuses extends AppCommand {
  static override summary = 'Export the application status dictionary.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --dry-run --json',
    '<%= config.bin %> <%= command.id %> --output ./statuses.json --json',
  ];
  static override flags: {
    output: Interfaces.OptionFlag<string | undefined>;
    'dry-run': Interfaces.BooleanFlag<boolean>;
  } = {
    output: appPath({ description: 'Write a new JSON file at this path.' }),
    'dry-run': Flags.boolean({
      default: false,
      description: 'Read the dictionary without writing a file.',
    }),
  };

  async run(): Promise<StatusExportResult> {
    const { flags } = await this.parse(ExportStatuses);
    const { databaseManagerToken } = await import('@nocobase/db');
    const result = await this.withApp(async ({ app }) => {
      app.registerProviders();
      const database = app.container.resolve(databaseManagerToken);
      const rows = await database.repository('appStatuses').findMany({
        select: (s) => s.fields('code', 'title'),
        sort: (s) => [s.field('code').asc()],
        limit: 101,
      });
      if (rows.length > 100) {
        throw new CommandError('This example exports at most 100 statuses.', {
          code: 'EXPORT_LIMIT_EXCEEDED',
          suggestions: ['Add pagination before exporting larger dictionaries.'],
        });
      }

      const file = flags.output ?? app.paths.storage('exports/statuses.json');
      if (flags['dry-run'] || rows.length === 0) {
        return { file, count: rows.length, written: false };
      }
      try {
        await mkdir(dirname(file), { recursive: true });
      } catch (cause) {
        throw new CommandError('The output directory could not be prepared.', {
          code: 'EXPORT_WRITE_FAILED',
          cause,
        });
      }
      try {
        await writeFile(file, JSON.stringify(rows, null, 2) + '\n', {
          encoding: 'utf8',
          flag: 'wx',
        });
      } catch (cause) {
        if ((cause as NodeJS.ErrnoException).code === 'EEXIST') {
          throw new CommandError('The output file already exists.', {
            code: 'OUTPUT_EXISTS',
            exit: 2,
            suggestions: ['Choose another path with --output.'],
          });
        }
        throw new CommandError('The export file could not be written.', {
          code: 'EXPORT_WRITE_FAILED',
          cause,
        });
      }
      return { file, count: rows.length, written: true };
    });

    if (!result.written) this.setStatus('success-noop');
    this.log(result.written
      ? `Exported ${result.count} statuses to ${result.file}.`
      : `No file written: ${result.count} statuses; target ${result.file}.`);
    return result;
  }
}
```

このコマンドは辞書を読み取るだけで、データベースは変更しません。この例でエクスポートするのは最大 100 件で、それを超えると明示的に失敗します。もっと大きなエクスポートには、ページネーションと適切なファイルの書き込み方法が必要です。ドライランや空の辞書では出力ファイルは作成されず、既存のファイルが上書きされることもありません。

アプリのルートで実行します。

```bash
pnpm nocobase app statuses export --help
pnpm nocobase app statuses export --dry-run --json
pnpm nocobase app statuses export --output ./statuses.json --json
```

既定の 2 件のレコードがある場合、ドライランは次のような形になります。パスはアプリとストレージの設定によって異なります。

```json
{
  "schemaVersion": 1,
  "ok": true,
  "command": "app statuses export",
  "status": "success-noop",
  "result": {
    "file": "/path/to/my-app/storage/exports/statuses.json",
    "count": 2,
    "written": false
  },
  "warnings": []
}
```

最後のコマンドで `statuses.json` が作成されます。同じ出力パスでもう一度実行すると、終了コード `2` で `OUTPUT_EXISTS` が返ります。続けるには別のファイル名を選びます。

## 必要なアプリの機能を選ぶ

| 必要なこと | 入口 |
| --- | --- |
| アプリのファイルの場所を知る | `this.rootDir`。アプリは作成しない |
| 設定、パス、環境を読み取る | `this.withApp(async ({ app, env }) => ...)` |
| データベースや業務サービスを解決する | コールバック内で `app.registerProviders()` を呼び出してから、`app.container` を使う |
| 完全な起動のライフサイクルを使う | コールバック内で `await app.start()` を呼び出す |

`withApp()` はアプリを作成し、コールバックを実行してから、アプリを終了してランタイムを破棄します。コールバックが失敗した場合も同様です。Provider を自動で登録したり起動したりはしません。`app.config` と `app.paths` は登録不要です。完全なライフサイクルは必要なときだけ起動してください。起動すると、コンシューマーやスケジュールも動き出すことがあります。サービスの構成については [サーバー側のサービス](server-business-services.md) を参照してください。

アプリのオブジェクトはコールバック内でだけ使い、プレーンな結果データを返します。後片付けの失敗は警告になります。完了した作業が失敗と報告され、誤って繰り返されないようにするためです。

ローカルのコマンドは、アプリの設定を使ってサービスにアクセスします。ブラウザーのユーザーのセッションやデータ範囲は引き継ぎません。ユーザーに結び付いた操作では、身元と範囲を明示的に検証するか、保護された HTTP API で公開してください。[認証、権限、データ範囲](authentication-and-permissions.md) を参照してください。

## 引数、パス、モジュールの読み込み

`AppCommand` は oclif をベースにしています。位置引数は `Args` で、オプションは `Flags` で宣言します。各引数に説明を付け、`summary` と `examples` でコマンドを説明します。`pnpm nocobase commands --json` によって、この情報を人とエージェントが見つけられるようになります。

パスのオプションには `appPath()` を使います。ユーザーが指定した相対パスは現在の作業ディレクトリから、宣言された既定値はアプリのルートから解決されます。コマンドは絶対パスを受け取ります。デプロイ時のストレージはコードのディレクトリの外にあることがあるため、例では `app.paths.storage()` で既定値を計算しています。

ヘルプもコマンドのモジュールをインポートします。トップレベルのインポートは `@nocobase/app-cli`、`@oclif/core`、Node の組み込みモジュールにとどめます。重い依存関係は `run()` の中で動的にインポートし、モジュールのスコープでデータベースに接続したり作業を始めたりしないでください。

## 出力、エラー、ログ

`AppCommand` はすでに `--json` を提供しています。成功時は型付きのプレーンなデータを返し、失敗時は `CommandError` を投げます。

| 目的 | API | `--json` のとき |
| --- | --- | --- |
| 人が読む結果 | `this.log(text)` | 抑制される |
| プログラムが読む結果 | `return result` | `result` に含まれる |
| 進捗 | `this.logToStderr(text)` | 引き続き stderr に出力される |
| 警告 | `this.warn(text)` | `warnings` に含まれる |
| 失敗 | `throw new CommandError(...)` | `ok: false`、`error.code`、0 以外の終了コード |

固定の大文字のエラーコード、対処方法がわかる `suggestions`、プレーンな `details` を使います。エラーの終了コードは既定で `1` で、使い方が正しくない場合は `2` を使います。フレームワークの別のコマンドを提案するときは、`this.cliCommand(['db', 'apply'])` を使うと、ソースの環境でもデプロイの環境でも正しい呼び出し方になります。

既定のステータスは `success` です。プレビューや何もすることがない場合は `success-noop` を、作業の一部が残っている場合は `partial-success` を設定し、完了していないことを説明します。認証情報やエクスポートの全体は結果に含めないでください。

`console.log()`、手書きの JSON 出力、`process.exit()`、`this.exit()`、`this.logJson()`、`this.error()` は避けてください。出力の取り決めや終了の意味を崩します。`CommandError` はその `cause` を出力しません。`NOCOBASE_CLI_DEBUG=1` を設定すると、伏せ字にしたエラーの連鎖を stderr で確認できます。運用上の永続的な記録には、アプリのログサービスを使います。[ログ](../framework/support/logging.md) を参照してください。

## テストと引き渡し

コマンドのテストは `tests/cli/` に置きます。`@nocobase/app-testing/cli` は `bindAppCommand()` と `runAppCommand()` をエクスポートしています。コマンドを分離したフィクスチャーのルートと `app:statuses:export` などの ID に結び付け、実行して結果、JSON、stdout、stderr、終了コードを確認します。サービスを差し替えるには、`loadRuntime` と `createApp` を注入します。

実際のアプリとデータベースには、同じ入口の `createTestAppConfig()` と `bindTestAppCommand()` を使います。[データベースのコマンドのテスト例](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/command.md) に従ってマイグレーションとシードを準備し、終わったら `config.dispose()` を呼び出します。独自のランタイムローダーでは、テスト用の設定とストレージの分離を自分で組み込む必要があります。

正常なエクスポートとファイルの内容、ファイルを作らないドライラン、`success-noop` を返す空の辞書、`OUTPUT_EXISTS` で保持される既存のファイル、読み取りや書き込みの失敗後のリソースの後片付けを網羅します。プロセスの出力を取得するテストは、順番に実行します。

```bash
pnpm lint
pnpm typecheck
pnpm nocobase commands --json
pnpm build
node dist/cli/index.js app statuses export --help
node dist/cli/index.js app statuses export --dry-run --json
```

これらのチェックの前に、プロジェクトの CLI のテストを実行します。デプロイ環境でのドライランも、デプロイの設定で選ばれたデータベースを読み取るため、準備した検証用の環境を使ってください。ヘルプだけではデータベースへのアクセスは確認できません。

このガイドは [アプリのコマンドの作成リファレンス](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/commands.md) に沿っています。共通の仕組みは [CLI ランタイム](../framework/runtime/cli.md) を、組み込みのコマンドは [CLI リファレンス](../reference/cli.md) を参照してください。
