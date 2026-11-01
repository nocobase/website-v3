---
title: プラグインのスキル
description: アプリのエージェントに公開の機能を説明し、プラグインのスキルを保守、同期、検証します。
---

プラグインのスキルは、実装済みのどの機能があるか、どの公開の入口を呼び出すか、データを誰が所有するか、成功をどう確認するかを、アプリのエージェントに伝えます。機能を実装することも、プラグインを自動で登録することもありません。

この記事では、プラグイン自身の使い方の説明を書きます。開発ガイドの `nocobase-app-plugin-development` は `@nocobase/app-skills` に属します。業務のプラグインにコピーしたり、その予約された名前を使ったりしないでください。

プラグインのソースを変更、保守するときに使う `AGENTS.md` の指示については、[プラグイン開発のガイダンス（AGENTS.md）](plugin-development-guidance.md) を参照してください。この記事では、アプリのエージェントがプラグインの機能を使う場面を扱い、呼び出しの例、配布、同期、検証を説明します。

## エージェントを使う場合

```text
アプリのエージェントがお知らせのテキストをプレビューできるよう、notice-cli のスキルを書いてください。
実装済みの preview コマンドだけを、入力、出力、エラー、登録の前提条件とともに説明してください。
スキルはプラグインのソースで管理し、生成されたアプリのコピーは編集せずに、同期と呼び出しを確認してください。
```

## プラグインにスキルが必要な場合

エージェントが API の呼び出し、公開のコンポーネントの組み合わせ、サービスの利用、設定の診断を頻繁に行う場合、スキルが役立ちます。通常のページが 1 つだけで、特別な組み込みの流れのないプラグインでは、ディレクトリを埋めるためだけにスキルを追加する必要はありません。

この例では、[コマンドラインの拡張](extend-command-line.md) の `notice-cli` を説明します。作成をやり直さずに、既存のプラグインに `skills/` を追加します。新しいプラグインでは、`--with skills` で下書きが生成されるため、実装済みの動作に合わせて書き換えます。

## プラグインが所有するソースを管理する

アプリには次のものがあります。

```text
packages/app-plugin-notice-cli/
├── cli/
├── skills/
│   └── nocobase-app-plugin-notice-cli/
│       └── SKILL.md
└── package.json
```

名前はパッケージの所有関係に従います。`@nocobase/app-plugin-notice-cli` は `nocobase-app-plugin-notice-cli` を所有します。独自のスコープは保ちます。`@acme/app-plugin-notice-cli` は `acme-app-plugin-notice-cli` を所有します。独立した作業には、この接頭辞に接尾辞を付けて追加できますが、ほかのパッケージの名前を使ってはいけません。

プラグインの `package.json` の `files` の一覧に `skills` を含め、`dist`、README、そのほかの既存のエントリーは保ちます。スキルは TypeScript のコンパイルを必要としませんが、公開するパッケージに含める必要があります。

## 実行できるスキル

`skills/nocobase-app-plugin-notice-cli/SKILL.md` を作成します。

````markdown
---
name: nocobase-app-plugin-notice-cli
description: Preview notice text with the installed notice-cli plugin when checking whitespace or character counts. Does not save, publish or send notices.
---

# Preview notice text

Work from the target App root. This Skill describes the public CLI of the installed plugin; do not import its private source files.

## Prerequisites

The App depends on `@nocobase/app-plugin-notice-cli` and registers its `./cli` export in `cli/plugins.ts`. If the command is unavailable, check the installed package exports and registration before retrying.

## Preview

Run:

```bash
pnpm nocobase notice-cli preview --text "Hello" --json
```

The command trims surrounding whitespace, accepts 1–200 UTF-16 code units after trimming, and returns `result.text` plus `result.length` counted in Unicode code points. It creates no records and starts no App background services. For deployment-only use, run the built CLI entry instead of pnpm.

A successful result has `ok: true`, `result.text: "Hello"` and `result.length: 5`. Blank or oversized text returns `error.code: "INVALID_TEXT"` and a nonzero exit status. Report the error and correct the input; do not retry unchanged input.

This capability does not store, publish or send notices. Those actions need a separate implemented capability and the user’s request.
````

`description` は、その機能がどんなときに当てはまるかを示します。本文には、役に立つ最短の手順と期待される結果を書きます。実装の設計はほかの場所に置き、長い API のスキーマやトラブルシューティングの表は、スキルの隣の `references/` のファイルにしてリンクします。

## 公開の入口と境界

| 説明すること | アプリのエージェントにさせないこと |
| --- | --- |
| 公開のパッケージのエクスポート、API、CLI のコマンド | 非公開のソースのパスをインポートする |
| 認証、リソースと操作の権限、データ範囲 | Server の認可の代わりにボタンを隠す |
| アプリが担う前提条件、設定、登録 | ファイルがあるだけで機能が有効だとみなす |
| 安定したエラーコードと結果 | たまたま出たログのメッセージから成功を推測する |
| 実際に対応している動作 | 予定の機能を実装済みのように呼び出す |

公開のコンポーネントをインポートしても、Client のファクトリーは登録されません。Server の利用側は、公開の入口から元の Token をインポートする必要があります。すべてのアプリがあらためて調べなくて済むよう、こうした組み込みの条件を書いておきます。

## UI のソースアセットを説明する

プラグインが shadcn の UI Registry でソースアセットを提供する場合、そのスキルでは、ローカルでのビルドとアセットのパス、または公開の URL を、アプリやプラグインへのインストール、入力、依存関係、公開のプラグインの機能との組み込みとあわせて説明します。ローカルのアセットは、先に Registry のサイトを用意しなくても直接追加できます。エージェントが対象のプロジェクトで結果を組み立てられるよう、レイアウトや操作の変更の例と確認の手順を含めてください。

コンポーネントのファイルをインストールしても、バックエンドのプラグイン、翻訳、ルートは登録されません。これらの前提条件を明記し、インストールしたソースは対象のプロジェクトが保守し、プラグインのパッケージをアップグレードしても更新されないことを説明します。完全な例は [UI のソースアセットを公開する](frontend-components.md#エージェント向けの使い方を書く) を参照してください。

## アプリに同期する

アプリのルートで実行します。

```bash
pnpm nocobase skills sync --package @nocobase/app-plugin-notice-cli
```

プラグインの登録でも、既定で同梱のスキルが同期されます。アプリの `.agents/skills/` にあるのは生成されたコピーで、保守するソースではありません。もう一度同期すると、そこでの編集は置き換えられます。動作中のエージェントがそれを読み込み直すかどうかは、そのクライアントによります。必要に応じて新しいセッションを始めてください。

## 引き渡しと動作を確認する

まず、同期されたコピーがあることを確認します。次にエージェントにそれに従って `preview --text Hello --json` を実行させ、`Hello` と長さ 5 が返ることを確認します。空白だけのテキストで説明どおりのエラーになること、エージェントがプレビューでお知らせを保存した、または送信したと主張しないことも確認します。

同期で証明できるのは引き渡しで、正しさではありません。公開の前に、`pnpm --filter @nocobase/app-plugin-notice-cli pack` の出力に `skills/` と公開の実行時の入口が含まれていることを確認します。ほかのアプリへのインストールについては [ビルドと公開](publish-plugin.md) を参照してください。

公開のコマンド、引数、権限、レスポンスが変わったら、ソース、テスト、プラグインのスキルを一緒に更新します。アプリは、生成されたコピーを個別に修正するのではなく、パッケージをアップグレードして同期することで、更新されたガイダンスを受け取ります。
