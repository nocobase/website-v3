---
title: プラグイン開発のガイダンス（AGENTS.md）
description: プラグインのソースで作業するエージェントのために、プラグインの役割、変更の規約、互換性の要件、確認の手順を AGENTS.md で管理します。
---

プラグインの `AGENTS.md` は、そのソースを保守するエージェントへのガイダンスです。プラグインが何を所有するか、機能の変更がどのファイルに影響するか、結果をどう確認するかを示します。タスクをまたいで役に立つ規約は、プラグインのコードと一緒に置いておきます。

この記事では、そうした保守の指示の書き方を説明します。アプリのエージェントがプラグインの機能を呼び出し、組み込み、組み合わせるためのスキルについては、[プラグインのスキル](write-plugin-skills.md) を参照してください。どちらも同じ機能を説明することがありますが、答える問いが異なります。

## ガイダンスの置き場所

アプリのワークスペースでは、開発のガイダンスはプラグインのルートに置きます。

```tree
my-app/
├── AGENTS.md                       # アプリ全体の開発の規約
├── .agents/skills/                 # 依存関係から同期した開発と利用のガイダンス
└── packages/
    └── app-plugin-notice-cli/
        ├── AGENTS.md              # このプラグインのソースの保守の規約
        ├── CLAUDE.md              # 隣の AGENTS.md を参照する
        ├── README.md              # プラグインの説明と組み込み
        ├── cli/                   # コマンドの実装
        ├── tests/                 # 実装のテスト
        └── skills/                # 利用側向けのスキル（任意）
```

作成のツールはすでに `AGENTS.md` と `CLAUDE.md` を生成します。ガイダンスを追加するためにプラグインを作り直さないでください。現在のテンプレートの `CLAUDE.md` には次の内容があります。

```text
@AGENTS.md
```

開発の規約を `AGENTS.md` の 1 か所で管理できるよう、この参照は保ってください。プラグインを変更する前に、エージェントにアプリとプラグインのルートのガイダンスを読ませ、そのうえでタスクに関係するソースを確認させます。

テンプレートは、アプリのインストール済みのパッケージにある `.agents/skills/nocobase-app-plugin-development/SKILL.md` も参照しています。この一般的な開発のスキルは `@nocobase/app-skills` から提供されます。プラグインの `AGENTS.md` は、共通の開発ガイド全体をコピーせずに、そのプラグイン固有の規約を追加します。

`pnpm nocobase skills sync` はパッケージが提供するスキルを同期します。プラグインのルートの `AGENTS.md` をアプリのスキルにコピーすることはありません。ソースの保守の要件はプラグインに、利用側向けの説明はその `skills/` ディレクトリに置きます。

## 記録する保守の規約

ファイル名からは推測できないものの、実装を変更するときにエージェントが必要とする情報を優先します。

| トピック | 説明すること |
| --- | --- |
| 役割と境界 | 実装済みの機能。アプリやほかのプラグインが所有するデータ、権限、業務ルール |
| 主な入口 | 機能を実装するファイルと、それを宣言、登録、公開するファイル |
| 関連する変更 | 機能と一緒に変更が必要な宣言、依存関係、テスト、ドキュメント |
| 互換性 | 利用側が使う公開のパス、引数、レスポンスの形、エラーコード、サービスの Token |
| 確認 | 作業ディレクトリ、コマンド、期待される結果、対象のアプリが必要かどうか |
| 特別な規約 | プラグイン固有の状態のルール、マイグレーションの制約、リソースの所有、外部のサービスの前提条件 |

具体的なファイルと動作を書きます。たとえば「`preview` のレスポンスのフィールドを変えたら、CLI のテストとプラグインのスキルを確認する」のほうが、「コードの品質を確保する」よりもエージェントに明確な方向を示します。

ディレクトリのリファレンスは [プラグインの構成](plugin-structure.md) を、入口と取り決めは [プラグインの宣言と公開のエクスポート](plugin-declarations.md) を参照してください。既存の説明にはリンクし、現在のプラグイン固有の内容を追加します。UI の作業では、shadcn のプリミティブを使い、まず NocoBase UI Library を参照するという規約を残します。ソースアセットの整理については [コンポーネントとスタイル](frontend-components.md) で扱います。

## 例：notice-cli の保守のガイダンス

この例では、[コマンドラインの拡張](extend-command-line.md) で完成させた `notice-cli` プラグインを使います。`preview` はお知らせのテキストを正規化し、その文字数を返します。利用側向けのスキルは [プラグインのスキル](write-plugin-skills.md) で説明しています。

次のセクションをプラグインの既存の `AGENTS.md` に追記します。テンプレートの共通のスキルの入口と、当てはまる開発のルールは保ってください。ファイルのパスはプラグインのルートからの相対パスで、コマンドはアプリのルートで実行します。

````markdown
## notice-cli maintenance

### Responsibility

This plugin previews text through `notice-cli preview`. It does not save,
publish or send notices, and the preview command does not start application services.

### Implementation and public contract

- `cli/preview.ts` implements the preview command.
- `cli/index.ts` declares commands. Preserve the generated `info` command when adding commands.
- `package.json` exposes `./cli` for source and compiled consumers. Keep both mappings valid.
- Keep `preview --text ... --json` compatible with its documented callers.
- Input is trimmed and must contain 1–200 UTF-16 code units after trimming.
- `result.text` is the trimmed value; `result.length` counts Unicode code points.
- Blank or oversized text returns `INVALID_TEXT` with exit code 2.

### Changes and verification

When changing command behavior, update `tests/cli/preview.test.ts`, the README
and `skills/nocobase-app-plugin-notice-cli/SKILL.md` where affected.
Keep usage examples consistent with the actual command; maintain the Skill
in this package, not the synchronized copy in the application.

Run from the owning application root:

```bash
pnpm --filter @nocobase/app-plugin-notice-cli test tests/cli/preview.test.ts
pnpm --filter @nocobase/app-plugin-notice-cli typecheck
pnpm --filter @nocobase/app-plugin-notice-cli build
```

After the application's `cli/plugins.ts` registers this plugin, verify:

```bash
pnpm nocobase notice-cli preview --text " Hello " --json
```

Expect `ok: true`, `result.text: "Hello"` and `result.length: 5`.
For changes to exports, dependencies or CLI integration, also build the owning
application and verify the command through its built CLI entry.
````

この例は、混同しやすい 2 つのルールを記録しています。入力の上限は UTF-16 のコードユニットで数え、結果の長さは Unicode のコードポイントで数えます。また、動作の変更が影響するファイルを挙げ、プラグインのビルドとアプリでの呼び出しを区別しています。

テストのファイルとスキルは、リンク先のチュートリアルで作成したものです。プラグインにそれらがない場合は、先に実装するか、実際のパスを使ってください。Client、Server、データベースの機能を追加するときは保守の要件を追加し、存在しない入口への参照は削除します。

## エージェントにガイダンスに従わせる

タスクの依頼は現在の作業を説明し、`AGENTS.md` は継続的な保守の規約を提供します。たとえば、次のように組み合わせて使います。

```prompt
このアプリの packages/app-plugin-notice-cli で、preview の境界のテストを確認してください。

アプリとプラグインの AGENTS.md と、同期されたプラグイン開発のスキルを読んでください。
既存の実装とコミットしていない変更を確認してください。

前後の空白、空白だけのテキスト、長さの上限、Unicode の文字数がテストされているかを確認してください。
既存のテストは再利用し、足りないケースを追加して、現在のコマンドの引数とレスポンスの構造の互換性を保ってください。
README とプラグインのスキルを実装と照らし合わせ、古くなったガイダンスを直してください。

影響を受けるテストと必要なチェックを実行し、結果と確認していない範囲を報告してください。
```

保守する人には、実装のファイル、登録の場所、互換性の要件が必要です。利用する人には、前提条件、公開のコマンド、結果が必要です。それぞれのドキュメントが自分の役割に集中できるよう、前者を `AGENTS.md` に、後者をプラグインのスキルに書きます。

## ガイダンスが機能することを確認する

ファイルがあることを確認するだけでなく、実際の保守のタスクでガイダンスを評価します。

- 参照しているパスが存在し、説明どおりの役割を持っている。
- コマンドが現在の `package.json` のスクリプトと一致し、作業ディレクトリが示されている。
- 挙げたテストが検出、実行され、結果が期待どおりである。
- 機能の変更の際に、関連する宣言、エクスポート、依存関係、使い方の例の確認が促される。
- プラグインのテストと対象のアプリでの確認が区別され、確認していない作業が記録されている。

現在のプラグインとアプリで使えるコマンドを使います。NocoBase のソースリポジトリだけのチェックを、通常のアプリのプラグインのガイダンスにコピーしないでください。プラグインのテストについては [テストと検証](testing-and-verification.md) を、アプリの検収については [テストと検収](../developing-apps/testing-and-acceptance.md) を参照してください。

ガイダンスだけの編集では、パス、コマンド、説明を確認します。機能や組み込みの確認が必要な場合にコードのチェックを実行します。1 つの段落を確かめるためだけに、変更していない業務のテストをすべて繰り返す必要はありません。

## 機能と一緒にガイダンスを保守する

公開のコマンド、API、サービス、リソースの配置が変わったら、開発のガイダンス、README、テスト、プラグインのスキルを一緒に確認します。開発のガイダンスは整理と保守の制約を、README とスキルは現在の使い方を説明します。互換性の変更は、プロジェクトのバージョン管理とリリースの規約に従って記録します。[ビルドと公開](publish-plugin.md) を参照してください。

長く有効な業務の決定と保守の規約はガイダンスに残します。一時的なトラブルシューティングの経緯、個々のタスクの記録、古くなった手順は削除します。`AGENTS.md` がわかりやすい入口であり続けるよう、プラグインの中で保守している長い説明にはリンクします。

**完了の目安**：プラグインを引き継いだエージェントが、変更する箇所を見つけ、公開の取り決めを守り、関係する確認を行い、更新が必要な指示を特定できること。
