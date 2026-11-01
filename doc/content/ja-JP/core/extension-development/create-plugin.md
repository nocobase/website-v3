---
title: プラグインを作成する
description: 既存のアプリの中で @nocobase/create-plugin を使い、ローカルのプラグインのひな形を生成して、機能を選び、workspace につなぎます。エージェントを使う方法と使わない方法があります。
---

まず [アプリを作成](../getting-started/create-app.md) し、その依存関係をインストールします。プラグインはこのアプリの `packages/` ディレクトリの下に生成され、アプリと一緒に開発、ビルドされます。

エージェントにプラグインの作成を依頼するか、自分で `pnpm create @nocobase/plugin@beta` を実行します。どちらの方法も `@nocobase/create-plugin` を使います。

## エージェントを使う場合

プラグイン開発のガイダンスはアプリの `@nocobase/app-skills` に同梱され、`.agents/skills/nocobase-app-plugin-development/SKILL.md` に同期されます。グローバルなインストールは必要ありません。見つからない場合は、インストール済みのパッケージにそのスキルが含まれているかを確認します。含まれている場合は `pnpm nocobase skills sync` を実行します。含まれていない場合は、フレームワークのパッケージを 1 つだけ更新するのではなく、[NocoBase Core をアップグレードする](../developing-apps/upgrade-nocobase-core.md) に従って互換性のあるリリースにします。

アプリのディレクトリでエージェントを開き、プラグインの名前と目的を説明します。たとえば次のように依頼します。

```text
このアプリのコマンドラインツールを拡張する demo-tools というプラグインを作成してください。
まずは基本の構成から始め、ビルドが成功することを確認してください。
```

エージェントは `@nocobase/create-plugin` でプラグインを生成し、目的に合った機能を選び、依存関係を処理して、結果を確認します。例の名前と目的は自分の要件に置き換えてください。コマンドのオプションやファイルの変更をすべて指定する必要はありません。

## エージェントを使わない場合

以下のコマンドは、アプリが求める Node.js と pnpm のバージョンを使って、アプリのルートで実行します。ジェネレーターとアプリの CLI は、アプリの workspace に対応している必要があります。`@beta` はジェネレーターのベータ版のリリースチャネルを選びます。このガイドでは `cli` の機能だけを持つ `demo-tools` を使い、動作中のデータベースや Web サーバーは必要ありません。

### ジェネレーターが行うこと

`@nocobase/create-plugin` は、選んだ機能をもとに、開発を続けるためのプラグインのパッケージを生成し、現在のアプリの workspace につなぎます。

| 作業 | 生成または更新される内容 |
| --- | --- |
| パッケージの土台 | マニフェスト、開発のガイダンス、TypeScript、リント、ビルドの設定 |
| 機能のコード | `--with` で選んだディレクトリ、宣言、例や下書き、関連するテスト |
| 公開の入口 | 必要に応じた Client、Server、CLI、コンポーネントのエクスポートと、ソースとコンパイル後の成果物の対応付け |
| 依存関係 | 選んだ機能の依存関係の分類と、このアプリにインストールされたパッケージから解決したバージョン |
| workspace への組み込み | アプリの `packages/` の下のパッケージ、必要な workspace の設定、アプリのローカルの依存関係 |
| インストール | 既定で依存関係のインストールとロックファイルの更新を行う。`--no-install` で後回しにできる |

生成したあと、機能を実装し、テストを仕上げ、実行時の入口をアプリに登録します。このツールは、業務のページ、エンドポイント、権限のルールを実装せず、プラグインの公開やデータベースのマイグレーションの実行も行いません。

### プラグインの機能を選ぶ

基本の使い方：

```bash
pnpm create @nocobase/plugin@beta <name> --with <capability>
```

`--with` は**生成するコードの機能**を選びます。既存のプラグインをインストールしたり、完成した機能を有効にしたりするものではありません。少なくとも 1 つの機能を選ぶか、パッケージの土台だけなら `--empty` を使います。機能を組み合わせるには `--with` を繰り返します。名前をカンマでつながないでください。

#### Client の機能

| `--with` の値 | 生成される内容 | 自分で実装すること |
| --- | --- | --- |
| `client.routes` | `client/routes.ts` のルートの宣言のひな形とテスト | ページのコンポーネント、パス、ナビゲーション、アクセスの条件。業務のページは生成されない |
| `client.components` | 例の `client/components/plugin-component.tsx`、公開のエクスポート、テスト | 再利用できるコンポーネントの UI、Props、操作 |
| `client.service-providers` | `client/providers/` の下の ServiceProvider のひな形とテスト | ブラウザー側のサービスの登録とライフサイクルの処理 |
| `client.react-providers` | `client/contexts.ts`、Provider のコンポーネント、`client/react-providers/` の宣言、テスト | React の Context のデータ、状態、コンポーネントツリーの組み立て |
| `client.locales` | `client/locales/` の下の言語のファイルと集約の入口 | 実際の翻訳と、コンポーネントでの利用 |

ServiceProvider はアプリのサービスとライフサイクルを扱い、React の Provider はコンポーネントツリーに Context を提供します。それぞれ必要に応じて選びます。Client のコードには、shadcn の設定とスタイルのための `components.json` と `client/styles.css` も含まれます。機能に必要な UI コンポーネントは、インストールするか実装してください。

#### Server の機能

| `--with` の値 | 生成される内容 | 自分で実装すること |
| --- | --- | --- |
| `server.service-providers` | `server/services/`、`server/providers/`、`server/tokens.ts`、テスト | サービスの取り決め、業務ロジック、サービスの登録 |
| `server.routes` | `server/routes/index.ts` のルートの宣言のひな形とテスト | API や Root Route のメソッド、パス、検証、認証、認可、レスポンス |
| `server.jobs` | 例の Job、`server/jobs/` の下のエグゼキューターを所有する Provider、テスト | ジョブのロジック、投入する箇所、再試行と冪等性の要件 |
| `server.locales` | `server/locales/` の下の言語のファイルと集約の入口 | サーバーで使う実際の翻訳 |

`server.routes` は CRUD のエンドポイントを生成せず、`server.service-providers` も必要としません。機能に別の業務のサービスが必要な場合に組み合わせます。`server.jobs` には、エグゼキューターを管理する Provider がすでに含まれています。ジョブのバックエンドはアプリが設定し、ジョブをいつ投入するかを自分で実装します。

#### データベース、CLI、スキル

| `--with` の値 | 生成される内容 | 自分で実装すること |
| --- | --- | --- |
| `database` | `database/migrations/` と `database/seeds/` の下の `.ts.example` の下書き、Server のリソースの宣言、テスト。ビルド時にデータベースのタスクのマニフェストが生成される | スキーマ、マイグレーション、シード。下書きを仕上げて `.ts` に名前を変えると、データベースのタスクになる |
| `cli` | `cli/index.ts`、例の `info` コマンド、`./cli` のエクスポート、テスト | 実際のコマンド、オプション、結果、エラー処理 |
| `skills` | パッケージの配布に含まれる、下書きの `skills/<plugin-skill-name>/SKILL.md` | プラグインを使うエージェント向けのガイダンス。使うきっかけ、公開の機能、前提条件、確認 |

`skills` が対象にするのは、プラグインを使うアプリのエージェントです。プラグインのルートの `AGENTS.md` は、そのソースを保守する開発者とエージェント向けです。これは土台のファイルで、`skills` を選ぶ必要はありません。スキルの下書きは、アプリに同期する前に実際の実装に合わせて仕上げてください。

#### 実行時の入口の導き方

ツールは機能から入口を導きます。`--with client` や `--with server` という追加の選択はありません。

| 選んだ機能 | 生成される実行時の入口 |
| --- | --- |
| `client.routes`、`client.service-providers`、`client.react-providers`、`client.locales` のいずれか | `client/index.ts`、`client/plugin.ts`、`./client` のエクスポート |
| いずれかの `server.*` の機能、または `database` | `server/index.ts`、`server/plugin.ts`、`./server` のエクスポート |
| `cli` | `cli/index.ts` と `./cli` のエクスポート |
| `client.components` だけ | 公開のコンポーネントのエクスポート。Client のプラグインの登録の入口はない |
| `skills` だけ、または `--empty` | 実行時の入口はない |

これらの入口を**生成すること**と、アプリに**登録すること**は別の手順です。公開のコンポーネントはパッケージのインポートで使います。プラグインが Client、Server、CLI の提供内容を持つ場合は、対応する入口を登録します。

#### よくある組み合わせ

以下はそれぞれ独立した例です。機能に必要なものを選んでください。

再利用できるコンポーネントだけ：

```bash
pnpm create @nocobase/plugin@beta feature-card --with client.components
```

ページ、サービス、エンドポイント、プラグインが所有するデータを持つ業務のモジュール：

```bash
pnpm create @nocobase/plugin@beta orders \
  --with client.routes \
  --with server.service-providers \
  --with server.routes \
  --with database
```

エージェント向けの組み込みのガイダンスを持つツールのコマンド：

```bash
pnpm create @nocobase/plugin@beta audit-tools --with cli --with skills
```

パッケージの土台だけ：

```bash
pnpm create @nocobase/plugin@beta shared-tools --empty
```

`--empty` は機能のディレクトリを生成せず、`--with` と組み合わせることはできません。`--with all` は、そのツールのバージョンが対応するすべての機能を選び、完全なひな形を調べるのに便利です。開発では、必要な機能を明示的に選んでください。

### 1. 生成の計画をプレビューする

```bash
pnpm create @nocobase/plugin@beta demo-tools --with cli --dry-run --json
```

ドライランでは、プラグインのファイルは生成されず、アプリのファイルも変更されず、アプリの依存関係もインストールされません。ただし、`pnpm create` 自体がジェネレーターをダウンロードしてキャッシュすることはあります。JSON のレスポンスは `ok: true` と `status: "success-noop"` になるはずです。次のフィールドを確認します。

| フィールド | 期待される結果 |
| --- | --- |
| `result.project` | `kind` が `application` で、`root` がこのアプリのルートディレクトリ |
| `result.plugin` | パッケージ名が `@nocobase/app-plugin-demo-tools` で、出力先がアプリの中の `packages/app-plugin-demo-tools/` |
| `result.requestedCapabilities`、`result.capabilities` | 要求した機能と正規化された選択 |
| `result.derivedStructure` | Client や Server のプラグインの入口が生成されるかどうか。この例ではどちらも `false` |
| `result.files` | パスと生成の理由。`cli/index.ts`、`cli/info.ts`、対応するテストを含む |
| `result.projectEdits` | 予定されているアプリの編集。`package.json` や、必要に応じて `pnpm-workspace.yaml` など |
| `result.dependencies` | このアプリにインストールされたパッケージから解決したプラグインの依存関係 |
| `result.nextSteps` | 推奨されるインストール、チェック、登録。実際の機能に合わせて適用する |

ジェネレーターは、`package.json` の `nocobase.templateKind: "app"` でアプリを識別します。workspace の設定とインストール済みの依存関係を読み取り、ファイルを書き込む前に、パス、名前、バージョンを確認します。先にアプリの依存関係のインストールを済ませてください。

### 2. プラグインを生成して workspace につなぐ

同じ名前と機能でプラグインを作成します。

```bash
pnpm create @nocobase/plugin@beta demo-tools --with cli
```

ジェネレーターは次のことを行います。

- パッケージのマニフェスト、CLI の実装、テスト、開発の設定を含む `packages/app-plugin-demo-tools/` を作成します。ローカルのプラグインは既定で `private: true` です。
- 既存の設定を保ったまま、pnpm の workspace にプラグインのディレクトリが含まれるようにします。`packages/*` を追加するのは必要な場合だけです。
- アプリの `dependencies` に `"@nocobase/app-plugin-demo-tools": "workspace:*"` を追加します。
- インストール済みのアプリから外部の依存関係のバージョンを解決し、実際のローカルのパッケージには workspace の参照を保ち、依存関係をインストールしてロックファイルを更新します。

`workspace:*` により、アプリはローカルのプラグインのパッケージを使います。ジェネレーターは、すべての外部の依存関係にそのプロトコルを割り当てたり、最新のバージョンを任意に選んだりはしません。解決できないパッケージや互換性のない依存関係を避けるため、アプリにインストールされたバージョンを使います。

### 3. 生成されたひな形を確認する

```bash
pnpm --filter @nocobase/app-plugin-demo-tools check
```

チェックが通れば、ひな形が存在し、アプリのローカルの依存関係になっています。各ファイルの役割については [プラグインの構成](plugin-structure.md) を参照してください。

依存関係のインストールでパッケージが解決可能になり、実行時の登録でアプリが読み込む機能が決まります。ジェネレーターは実行時の入口を自動では登録しません。あとで `pnpm nocobase plugin register <full-package-name> --no-install` を使い、パッケージが実際に提供する Client、Server、CLI の入口を登録します。実装、登録、確認については [最初のプラグインを書く](write-your-first-plugin.md) に従ってください。

### 名前とよく使うオプション

短い名前 `demo-tools` からは、既定で `@nocobase/app-plugin-demo-tools` が生成されます。自分の組織のスコープを保つには、完全なパッケージ名を使います。

```bash
pnpm create @nocobase/plugin@beta @my-company/app-plugin-audit-tools --with cli
```

ディレクトリは `packages/app-plugin-audit-tools/` のままで、登録には完全なパッケージ名を使います。名前の機能の部分は小文字で始め、小文字、数字、単独のハイフンを使います。既存のディレクトリや衝突するパッケージ名は拒否されます。ローカルのプラグインは公開する必要はありません。あとで公開する前に、`private`、パッケージ名、エクスポート、互換性、パッケージの内容を確認してください。

| オプション | 役割 |
| --- | --- |
| `--dir <directory>` | 既存のアプリを明示的に選ぶ。たとえば親ディレクトリから `--dir ./my-app` |
| `--dry-run --json` | 書き込まずに、生成されるファイル、アプリの編集、依存関係のバージョンをプレビューする。人やエージェントの確認用 |
| `--json` | 構造化された出力を返す。インストールのログは stderr に出力される |
| `--no-install` | インストールせずにファイルを生成する。登録の前にアプリのルートで `pnpm install` を実行する |
| `--display-name <name>`、`--description <text>` | 表示名と説明を設定する。空白を含む値は引用符で囲む |
| `--help`、`-h` | このバージョンが対応する機能とオプションを一覧表示する |
| `--version` | ジェネレーターのバージョンを表示する |

#### JSON の出力

エージェントやスクリプトでは、生成や `--dry-run` と `--json` を組み合わせます。成功すると `ok: true` と `result` が返ります。失敗すると 0 以外の終了コードとともに、`error.code`、`error.message`、`error.suggestions` が返ります。ジェネレーターの stdout が 1 つの JSON の結果のドキュメントになるよう、インストールのログは stderr に出力されます。

`--dry-run` は変更をプレビューします。`--no-install` はプラグインとアプリのファイルを書き込みますが、依存関係のインストールを後回しにします。この 2 つのオプションは目的が異なります。

### よくある問題

| 症状 | 対処 |
| --- | --- |
| アプリが見つからない | create-app で生成したアプリで実行するか、`--dir` で選ぶ。依存関係がインストール済みであることと、ジェネレーターのバージョンがアプリの workspace に対応していることを確認する |
| エラーが `packages/plugins` を探している | ソースリポジトリにしか対応していない古いジェネレーターが解決された可能性がある。`pnpm create @nocobase/plugin@beta --version` で実際のバージョンを確認し、パッケージマネージャーのキャッシュとリリース後の経過期間の設定を見直して、アプリの workspace に対応したバージョンを選び、ドライランをやり直す。エラーを回避するためにアプリに `packages/plugins` を作らないこと。このチュートリアルは `@nocobase/create-plugin@0.1.0-beta.26` で確認した |
| 依存関係がない、または互換性がない | アプリの依存関係のインストールを済ませ、報告されたバージョンを解決してから、もう一度プレビューする |
| ディレクトリ、パッケージ名、アプリの依存関係がすでにある | 既存の実装を確認するか、衝突しない名前を選ぶ。既存のプラグインは保つ |
| workspace のルールが出力先を除外している | `pnpm-workspace.yaml` の除外の設定を確認し、プロジェクトに合わせて調整してから、もう一度プレビューする |
| ファイルは生成されたがインストールに失敗した | 生成された結果は残し、インストールのエラーを解決して、アプリのルートで `pnpm install` をもう一度実行する。プラグインを生成し直さないこと |
| 既存のプラグインに機能を追加したい | ジェネレーターは既存のパッケージを変更せず、新しいパッケージを作成する。[プラグインの構成](plugin-structure.md) に従って、実装、宣言、エクスポート、依存関係、テストを拡張し、アプリでの登録を確認する |
| ルートやデータベースの機能を選んだのに、動く機能にならない | これらのオプションが生成するのは宣言や下書き。ページ、エンドポイント、マイグレーションを実装してから、組み込んで確認する |
| パッケージはインストールされているのにコマンドがない | `./cli` のエクスポートとアプリの `cli/plugins.ts` の登録を確認し、アプリのルートで呼び出す |

ファイルの役割については [プラグインの構成](plugin-structure.md) に、実装と組み込みについては [最初のプラグインを書く](write-your-first-plugin.md) に進んでください。インストール、更新、削除については [プラグインを管理する](../developing-apps/manage-plugins.md) を参照してください。
