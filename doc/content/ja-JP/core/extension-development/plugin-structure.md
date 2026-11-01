---
title: プラグインの構成
description: アプリの中でプラグインがどこにあるか、ディレクトリと入口がどうつながるか、ソースとビルドの出力がどう関係するかを理解します。
---

このガイドは create-app で生成したアプリから始め、ローカルのプラグインのファイルがどこにあり、何をし、アプリにどうつながるかを説明します。プラグインはアプリの `packages/` ディレクトリの下に置きます。構成は選んだ機能によって異なり、すべてのプラグインに Client、Server、CLI の入口が必要なわけではありません。

## アプリの中のプラグインの場所

お知らせを読み取るためのページと API を提供する、お知らせのプラグインを考えます。以下は、実装してアプリに登録したあとの主なファイルです。共通の設定と一部のテストは省いています。`client/pages/`、`shared/`、ページのコンポーネントは、ひな形に追加したものです。実装については [最初のプラグインを書く](write-your-first-plugin.md) を参照してください。

```text
my-app/
├── client/plugins.ts                          # アプリが Client の入口を登録する
├── server/plugins.ts                          # アプリが Server の入口を登録する
├── packages/
│   └── app-plugin-announcements/
│       ├── client/
│       │   ├── components/                    # ページのコンテナとヘッダーのコンポーネント
│       │   ├── pages/announcements.tsx        # ページ：お知らせをリクエストして表示する
│       │   ├── locales/                       # メニューとページの翻訳
│       │   ├── routes.ts                      # ページのルートとナビゲーション
│       │   ├── plugin.ts                      # Client の提供内容をまとめる
│       │   └── index.ts                       # 公開の Client の入口
│       ├── server/
│       │   ├── routes/index.ts                # お知らせの API
│       │   ├── routes/schemas.ts              # API のレスポンスのスキーマ
│       │   ├── plugin.ts                      # Server の提供内容をまとめる
│       │   └── index.ts                       # 公開の Server の入口
│       ├── shared/announcement.ts             # 共有のデータの型
│       ├── tests/                             # API、ページ、ルートのテスト
│       ├── package.json                       # 依存関係、エクスポート、スクリプト
│       └── AGENTS.md                          # プラグイン開発のガイダンス
├── package.json                               # workspace:* でプラグインを参照する
└── pnpm-workspace.yaml                        # プラグインのディレクトリを含める
```

ページを開くと、`client/pages/announcements.tsx` がリクエストを送り、`server/routes/index.ts` がお知らせを返し、ページがリストを表示します。ページと API は同じプラグインに属します。この例は固定のサンプルデータを読み取るため、プラグインのデータベースのマイグレーションも CLI の入口も必要ありません。

プラグインの `package.json` は Client と Server の入口をエクスポートし、アプリはそれらを 2 つの `plugins.ts` のファイルで登録します。依存関係でプラグインが解決可能になり、登録でその機能が読み込まれます。ジェネレーターの使い方については [プラグインを作成する](create-plugin.md) を、ほかの機能については下の完全なツリーを参照してください。

## 完全なディレクトリ構成

下の `demo-full` の例は、アプリの中のローカルのプラグインの、すべての機能を含む構成をまとめたものです。ひな形は、選んだ機能に応じて `client/`、`server/`、`database/`、`cli/`、`skills/` を生成します。プラグインに必要な部分を残してください。ツリーには、開発中に必要に応じて追加する `client/pages/` と、ビルドで生成される `dist/` も含まれています。省いているのは、追加のロケールのファイル名だけです。

```text
packages/app-plugin-demo-full/
├── client/                                     # Client（任意）
│   ├── components/                             # プラグインのコンポーネント
│   │   ├── plugin-component.tsx
│   │   └── provider.tsx
│   ├── contexts.ts                             # React の Context の定義
│   ├── index.ts                                # 公開の Client の入口
│   ├── locales/                                # Client の翻訳
│   │   ├── en-US.ts
│   │   ├── index.ts
│   │   ├── zh-CN.ts
│   │   └── …
│   ├── pages/                                  # 必要に応じて追加：業務のページ
│   ├── plugin.ts                               # Client の提供内容をまとめる
│   ├── providers/                              # Client のサービスとライフサイクル
│   │   ├── demo-full.ts
│   │   └── index.ts
│   ├── react-providers/                        # React の Provider を登録する
│   │   └── index.ts
│   ├── routes.ts                               # ページのルートの宣言
│   └── styles.css                              # Client のスタイル
├── server/                                     # Server（任意）
│   ├── index.ts                                # 公開の Server の入口
│   ├── jobs/                                   # バックグラウンドジョブとエグゼキューターの Provider
│   │   ├── demo-full.ts
│   │   └── provider.ts
│   ├── locales/                                # Server の翻訳
│   │   ├── en-US.ts
│   │   ├── index.ts
│   │   ├── zh-CN.ts
│   │   └── …
│   ├── plugin.ts                               # Server の提供内容とリソースのパスをまとめる
│   ├── providers/                              # サービスの登録とライフサイクル
│   │   ├── demo-full.ts
│   │   └── index.ts
│   ├── routes/                                 # HTTP のエンドポイントの宣言
│   │   └── index.ts
│   ├── services/                               # 業務の実装
│   │   └── demo-full.ts
│   └── tokens.ts                               # 公開のサービスのインターフェースと Token
├── database/                                   # プラグインのデータ（任意）
│   ├── README.md
│   ├── migrations/                             # マイグレーションの下書き。有効にする前に実装する
│   │   └── 202610260001_demo_full_create_records.ts.example
│   └── seeds/                                  # シードの下書き。有効にする前に実装する
│       └── 202610260002_demo_full_create_welcome_record.ts.example
├── cli/                                        # CLI（任意）
│   ├── index.ts                                # CLI の宣言
│   └── info.ts                                 # 例のコマンドの実装
├── skills/                                     # アプリのエージェント向けのガイダンス（任意）
│   └── nocobase-app-plugin-demo-full/
│       └── SKILL.md
├── tests/                                      # 選んだ機能のテスト
│   ├── cli/
│   │   └── info.test.ts
│   ├── client/
│   │   ├── component.test.tsx
│   │   ├── react-provider.test.tsx
│   │   ├── routes.test.ts
│   │   └── service-provider.test.ts
│   ├── database/
│   │   └── migrations.test.ts
│   └── server/
│       ├── jobs.test.ts
│       ├── plugin.test.ts
│       ├── routes.test.ts
│       └── service-provider.test.ts
├── dist/                                       # ビルドで生成：コンパイルしたプラグインの出力
├── components.json                             # Client のコードの shadcn の設定
├── package.json                                # 依存関係、エクスポート、スクリプト
├── package.ts                                  # 土台の目印。空のプラグインもビルドできるようにする
├── tsconfig.json                               # 型チェックとコンパイル
├── eslint.config.js                            # リントの設定
├── vitest.config.ts                            # テストの設定
├── .gitignore                                  # Git の無視のルール
├── .prettierignore                             # フォーマットの無視のルール
├── AGENTS.md                                   # プラグイン開発のガイダンス
├── CLAUDE.md                                   # AGENTS.md を参照するエージェント向けのガイダンス
├── README.md                                   # プラグインのドキュメント
└── CHANGELOG.md                                # リリースの履歴
```

マイグレーションとシードのタイムスタンプは、生成した日付によって変わります。実際のページは `client/pages/` で整理し、`client/routes.ts` でつなぎます。ディレクトリを作成しても、ルートは登録されません。

ツリーには 3 種類のファイルがあります。生成されたひな形のファイル、開発中に追加したソース、ビルドの出力です。`client/pages/` は 2 つ目に、`dist/` は 3 つ目に当たります。生成される機能のディレクトリは選択によって異なります。オプションについては [プラグインを作成する](create-plugin.md) を参照してください。

## 入口のつながり

提供内容の宣言、公開のサービス、プラグイン間の呼び出しについては [プラグインの宣言と公開のエクスポート](plugin-declarations.md) を参照してください。

実装のファイル、プラグインの公開の入口、アプリの登録のファイルは、それぞれ役割が異なります。

| 場所 | 役割 |
| --- | --- |
| プラグインのコンポーネント、ルート、サービス、コマンド | 機能を実装する |
| プラグインの `client/plugin.ts` と `server/plugin.ts` | ルート、Provider、データベースのリソースなど、ランタイムごとの提供内容をまとめる |
| プラグインの `client/index.ts` と `server/index.ts` | プラグインの定義をエクスポートする。ひな形では通常、隣の `plugin.ts` を再エクスポートする |
| プラグインの `cli/index.ts` | 別の `cli/plugin.ts` を使わず、CLI のプラグインを直接宣言してエクスポートする |
| プラグインの `package.json` | これらの入口をパッケージの公開のエクスポートとして宣言する |
| アプリの `client/plugins.ts`、`server/plugins.ts`、`cli/plugins.ts` | プラグインが提供する、対応する入口を登録する |

お知らせのページと API には、それぞれ組み込みの経路があります。

```text
Client：pages/announcements.tsx → client/routes.ts → client/plugin.ts
        → client/index.ts → package.json ./client → アプリの client/plugins.ts

Server：server/routes/index.ts → server/plugin.ts
        → server/index.ts → package.json ./server → アプリの server/plugins.ts
```

プラグインの `client/plugin.ts` とアプリの `client/plugins.ts` は、別のパッケージに属します。前者はプラグインが何を提供するかを定義し、後者はアプリが読み込むプラグインを選びます。ページや API を追加するときは、通常プラグインの中の実装とルートの宣言を変更します。すでに実行時の入口を登録しているアプリは、ページやエンドポイントごとにプラグインを登録し直す必要はありません。

### 3 つの実行時の入口

| プラグインの公開のエクスポート | アプリの登録のファイル | 組み込み |
| --- | --- | --- |
| `<package>/client` | `client/plugins.ts` | Client のファクトリーを呼び出す。対応している設定を渡すこともできる |
| `<package>/server` | `server/plugins.ts` | Server のプラグインの定義を含める |
| `<package>/cli` | `cli/plugins.ts` | CLI のプラグインの定義を含める |

組み込むのは、プラグインが提供する入口だけです。たとえば `client.components` だけを選ぶと、`client/index.ts` や `client/plugin.ts` なしで公開のコンポーネントのエクスポートが生成され、アプリはそれらのコンポーネントを直接インポートします。`database` を選ぶと、データベースのリソースを宣言する Server の入口が生成されます。

ジェネレーターは入口を作成し、`pnpm nocobase plugin register` は実行時の入口をアプリにつなぎます。一連の流れについては [最初のプラグインを書く](write-your-first-plugin.md) を参照してください。

## 主なファイル

### package.json：メタデータ、依存関係、公開のエクスポート

プラグインは、アプリのルートのものとは別に、自分の `package.json` を管理します。

| フィールド | プラグインでの役割 |
| --- | --- |
| `name`、`version` | プラグインのパッケージとそのバージョンを識別する |
| `private` | ローカルのプラグインでは既定で `true`。npm に公開せずにアプリの中で使える |
| `exports` | 利用側が使えるインポートのパスを宣言する。ひな形はローカルの開発用にソースの入口を使う |
| `publishConfig.exports` | エクスポートをコンパイル後の成果物に対応付ける。アプリのビルドがローカルのパッケージを集めるときにも使われる |
| `files` | `dist/` と、選んだ場合は `skills/` など、パッケージの内容を宣言する |
| `scripts` | プラグインのチェック、テスト、ビルドを実行する |

アプリの `package.json` は、`dependencies` の `workspace:*` でローカルのプラグインを参照します。その依存関係でパッケージが解決可能になり、実行時の登録でアプリが読み込む機能が決まります。

依存関係はそれを使うパッケージで宣言し、ひな形の分類を保ちます。通常の Server の実行時の依存関係は `dependencies` に、ホストと同一性を共有する必要があるランタイムと Client の実行時の依存関係は `peerDependencies` に、テストとビルドのツールは `devDependencies` に置きます。パッケージがアプリにインストールされていても、プラグイン自身の依存関係の宣言の代わりにはなりません。

お知らせのプラグインでは、Client と Server のエクスポートのフィールドは次のとおりです。

```json
{
  "exports": {
    "./client": {
      "types": "./client/index.ts",
      "import": "./client/index.ts"
    },
    "./server": {
      "types": "./server/index.ts",
      "import": "./server/index.ts"
    }
  },
  "publishConfig": {
    "exports": {
      "./client": {
        "types": "./dist/client/index.d.ts",
        "import": "./dist/client/index.js"
      },
      "./server": {
        "types": "./dist/server/index.d.ts",
        "import": "./dist/server/index.js"
      }
    }
  }
}
```

アプリは、非公開のソースのパスではなく、`@nocobase/app-plugin-announcements/client` と `@nocobase/app-plugin-announcements/server` を使います。公開のコンポーネント、サービス、型を追加するときは、ソースとコンパイル後の対応付けをそろえてください。

### database：プラグインのデータのリソース

`database/migrations/` にはマイグレーションを、`database/seeds/` にはシードデータを置きます。生成される `.ts.example` のファイルは下書きで、実行されません。仕上げてから `.example` の接尾辞を削除し、各ファイル名をエクスポートするタスク名とそろえてください。

`server/plugin.ts` は、その `database` の設定でこれらのディレクトリを宣言します。リソースのパスは、プラグインの絶対パスの `baseDir` からの相対パスとして解決されます。

| 読み込まれるコード | `baseDir` が指す場所 | データベースのリソースの場所 |
| --- | --- | --- |
| ソースの `server/plugin.ts` | プラグインのルート | `database/migrations/`、`database/seeds/` |
| コンパイル後の `dist/server/plugin.js` | プラグインの `dist/` | `dist/database/migrations/`、`dist/database/seeds/` |

生成されたパスの計算とデータベースのビルドのスクリプトは保ちます。データベースの機能を持つプラグインは、コンパイル後に `.manifest.json` のファイルを生成します。コンパイル済みのマイグレーションとシードと一緒に保ってください。ビルドはリソースを用意するだけで、マイグレーションは実行しません。

### UI コンポーネントとソースの所有

`client/components/` には、プラグインが保守するコンポーネントを置きます。業務のページには必要に応じて `client/pages/` を追加し、`client/routes.ts` でつなぎます。公開のコンポーネントは、パッケージのエクスポートで公開します。

Client のコードを持つプラグインには、shadcn のファイルの場所、パッケージ内のエイリアス、スタイルの入口を設定する `components.json` と `client/styles.css` が含まれます。アプリもプラグインも、NocoBase UI Library からコンポーネントやブロックをインストールできます。アプリにインストールしたソースはアプリが、プラグインにインストールしたソースはプラグインが保守します。利用側がプラグインの公開のエクスポートを通じてコンポーネントを使う場合、その実装は引き続きプラグインが保守します。

`#components/*` などのエイリアスは、アプリの非公開のエイリアスとは独立して、プラグイン自身の `package.json` で定義します。コンポーネントを追加またはインストールするときは、ファイルの場所、インポート、ビルドの設定をそろえてください。

アプリとプラグインは、shadcn のプリミティブを使って、フロントエンドのコンポーネントを自由に書き、整理できます。モジュール化された画面を組み立てるときは、まず [NocoBase UI Library](https://ui.nocobase.com/) のコンポーネントとブロックを参照してください。このライブラリーは shadcn の UI Registry でソースアセットを配布しています。自分のアセットを公開するときも同じ仕組みを使います。コンポーネントの作成とページへの組み込みについては [コンポーネントとスタイル](frontend-components.md) を、独立した Registry のパッケージ、そのビルド、ローカルでのインストールについては [UI のソースアセットを公開する](frontend-components.md#必要に応じて-ui-のソースアセットを配布する) を参照してください。

ソースアセットは、`packages/` の下のプラグインと並べて、独立した Registry のパッケージで管理します。プラグインの機能は、プラグインの内部への相対インポートではなく、公開のパッケージの入口か、利用側が渡す入力で組み込みます。インストール後は、受け取ったアプリやプラグインが自分のソースのコピーを保守します。

### AGENTS.md と skills/：2 種類のエージェント向けガイダンス

| ファイル | 対象 | 目的 |
| --- | --- | --- |
| プラグインのルートの `AGENTS.md` | プラグインのソースを保守する開発者とエージェント | 内部の開発の規約 |
| プラグインのルートの `CLAUDE.md` | プラグインで作業する Claude Code | 同じ `AGENTS.md` を参照する |
| プラグインの `skills/*/SKILL.md` | プラグインを使うアプリのエージェント | 機能、組み込み、確認を説明する |
| アプリの `.agents/skills/` | アプリを開発するエージェント | 同期したガイダンスのコピーを置く |

プラグイン開発のガイダンスは土台の一部で、`skills/` は選んだ場合に生成されます。生成されたアプリのコピーを直接保守するのではなく、同期する前にプラグインのスキルのソースを仕上げてください。

プラグイン固有の保守の規約については [プラグイン開発のガイダンス（AGENTS.md）](plugin-development-guidance.md) を、アプリのエージェント向けの機能の説明と使い方の例については [プラグインのスキル](write-plugin-skills.md) を参照してください。

### テストと開発の設定

`tests/` は機能ごとにテストを整理します。`tsconfig.json`、`eslint.config.js`、条件に応じて生成される `vitest.config.ts` は、型とコンパイル、リント、テストの実行を設定します。機能を追加するときは、その実装、宣言、公開のエクスポート、依存関係、テストを一緒に更新します。チェックのコマンドについては [最初のプラグインを書く](write-your-first-plugin.md) を参照してください。

## ソース、プラグインのビルド、アプリのビルド

プラグインの `dist/` とアプリの `dist/` は、別の階層のビルドの出力です。

| 場所 | 内容 |
| --- | --- |
| `packages/app-plugin-announcements/client/`、`packages/app-plugin-announcements/server/` | プラグインの Client と Server のソース |
| `packages/app-plugin-announcements/dist/` | コンパイルしたプラグインの JavaScript と型の宣言 |
| アプリのルートの `dist/` | アプリのコードと実行時の依存関係を含む、アプリのビルドの出力 |

アプリのルートで、プラグインだけをビルドします。

```bash
pnpm --filter @nocobase/app-plugin-announcements build
```

開発中、アプリは workspace の依存関係とソースのエクスポートでローカルのプラグインを使います。アプリを引き渡す準備をするには、アプリのルートで次を実行します。

```bash
pnpm build
```

アプリのビルドは、依存の順序でローカルのパッケージをビルドし、コンパイル後のエクスポートの対応付けとローカルの依存関係のパスを使って、引き渡しに必要な workspace のパッケージをアプリの `dist/vendor/` に集めます。**ローカルのプラグインは、先に npm に公開しなくてもアプリと一緒に配布できます。**

これらの成果物は生成されたものです。`dist/` を直接編集するのではなく、ソースのファイルを変更してビルドし直してください。プラグインのビルドが成功したら、アプリでの実際の利用とアプリ全体のビルドを確認します。

## 次のステップ

[最初のプラグインを書く](write-your-first-plugin.md) に従って、お知らせの API とページを実装し、アプリでテスト、登録、確認します。機能のオプションと組み合わせについては [プラグインを作成する](create-plugin.md) を参照してください。インストール、更新、削除については [プラグインを管理する](../developing-apps/manage-plugins.md) を参照してください。

バージョンを独立して管理しながら複数のアプリで共有するには、[ビルドと公開](publish-plugin.md) に進んでください。現在のアプリだけでプラグインを使う場合、公開は不要です。
