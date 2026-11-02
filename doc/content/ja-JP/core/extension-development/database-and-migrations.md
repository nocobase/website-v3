---
title: データベースのリソースとマイグレーション
description: プラグインのマイグレーションとシードのディレクトリを宣言し、アプリの既定の接続に組み込んで、ビルド、インストール、アップグレードを確認します。
---

プラグインは、Server の宣言でマイグレーションとシードを提供し、インストールしたアプリがそれを実行します。この例では、`notice-data` にお知らせのカテゴリーの辞書を追加します。モデリング、Context、実行のルールはアプリと共通です。[テーブルとフィールド](../framework/database/schema.md)、[データベースのマイグレーション](../framework/database/migrations.md)、[シードデータ](../framework/database/seeds.md) を参照してください。

## データベースのリソースのディレクトリを作成する

新しいプラグインでは、アプリのルートでデータベースの機能を選びます。

```bash
pnpm create @nocobase/plugin@beta notice-data --with database
```

既存のプラグインでは、作り直さずにディレクトリと宣言を追加します。以下のプラグインのパスは `packages/app-plugin-notice-data/` からの相対パスです。

```text
server/
├── index.ts
└── plugin.ts
database/
├── migrations/
│   └── 202611040020_notice_data_create_categories.ts
└── seeds/
    └── 202611040020_notice_data_default_categories.ts
```

プラグインのデータベースのディレクトリには、`main/` の階層はありません。生成される `.ts.example` のファイルは使われない下書きです。機能に合わせて実際の `.ts` のファイルを書いてください。初期のレコードが不要な場合は、シードの宣言を省きます。

## リソースのパスと接続の所有を宣言する

`server/plugin.ts` でリソースを宣言します。既存のプラグインのほかの提供内容は保ってください。

```ts
import path from 'node:path';
import { defineServerPlugin, type AppServerPlugin } from '@nocobase/app-server/plugins';

const plugin: AppServerPlugin = defineServerPlugin({
  packageName: '@nocobase/app-plugin-notice-data',
  baseDir: path.resolve(import.meta.dirname, '..'),
  database: {
    migrations: './database/migrations',
    seeds: './database/seeds',
  },
});

export default plugin;
```

`server/index.ts` から入口を公開します。

```ts
export { default } from './plugin.js';
```

`baseDir` は絶対パスである必要があります。リソースのパスは `./` で始まり、親ディレクトリにさかのぼることはできません。これはソースではプラグインのルートに、`dist/server/plugin.js` からは `dist/` に解決されるため、コンパイルの出力にも対応するデータベースのディレクトリが含まれている必要があります。

宣言したプラグインのマイグレーションとシードが対象にするのは、`database.default` で選ばれたアプリの既定の接続だけです。その名前が `main` である必要はありません。宣言で別の接続を選ぶことはできず、別のデータベースが作られることもありません。ディレクトリの作成、リソースの宣言、プラグインの登録、タスクの実行は、それぞれ別の手順です。

## マイグレーションと初期データを書く

`database/migrations/202611040020_notice_data_create_categories.ts` で辞書を作成します。

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040020_notice_data_create_categories',
  async up({ builder }) {
    await builder.createCollection('noticeCategories', (c) => {
      c.string('code', { length: 32 }).primary().notNull();
      c.string('title', { length: 100 }).notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('noticeCategories');
  },
});
```

アプリやほかのプラグインとの衝突を避けるため、タスクの名前にはプラグインの識別子を含めます。1 つの接続のソースは、プラグインの登録の順ではなく、名前によって全体で順序付けられます。ほかのプラグインのスキーマに依存する場合は、登録の順に頼るのではなく、前提となるバージョンとマイグレーションの順序を指定します。

`database/seeds/202611040020_notice_data_default_categories.ts` で既定のカテゴリーをインストールします。

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040020_notice_data_default_categories',
  async run(context) {
    const categories = context.repository('noticeCategories');
    if (await categories.findOne({ filter: { code: 'general' } })) return;
    await categories.createOne({ values: { code: 'general', title: 'General' } });
  },
});
```

アプリはマイグレーションのあとにシードを実行し、`general` / `General` を作成します。既存のカテゴリーに対する管理者の編集は保たれます。Provider の起動時にこれらのテーブルを作成したり、既定値を繰り返し挿入したりしないでください。

任意の架空のお知らせには、`sample: true` の別のシードを使います。これはホストの新規インストールと `app.sampleData` の設定によって制御されます。通常のシードがサンプルの内容を自動で見分けることはありません。サンプルがほかのプラグインのサービスを必要とする場合は、`boot()` の中ですぐにレコードを書き込むのではなく、Provider の `boot()` で `sampleDataToken` を通じてジェネレーターを登録し、アプリの準備ができてから実行されるようにします。サービスの名前にもプラグインの識別子を含めます。実行の条件については [任意のサンプル](../framework/database/seeds.md#必須のデータと任意のサンプル) を参照してください。

マージ済みやリリース済みのマイグレーションとシードは変更せず、その後の変更には新しいファイルを追加します。スキーマの変更と過去のデータの埋め戻しは、シードでユーザーのレコードを繰り返し上書きするのではなく、マイグレーションで行います。

## プラグインを登録して変更を適用する

ローカルのプラグインが解決可能な workspace の依存関係になったら、アプリのルートでプレビューして登録します。

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-data --no-install
pnpm nocobase db apply --dry-run
pnpm nocobase db apply
```

`--no-install` が省くのはインストールで、workspace の依存関係の設定ではありません。Server の入口が `server/plugins.ts` に含まれていることを確認してください。[プラグインの宣言と公開の入口](plugin-declarations.md#実行時の入口) を参照してください。

データベースの計画には、これらのマイグレーションとシードの名前と、保留中のほかのアプリやプラグインのタスクが含まれるはずです。最初の実行のあと、`noticeCategories` が解決でき、既定のカテゴリーが含まれているはずです。コマンドを繰り返すと、成功した履歴はスキップされます。`db apply` はこのプラグインだけを対象にするものではありません。

データベースの宣言は、CRUD のエンドポイントもメニューも公開しません。業務の API と権限は別に実装してください。データアクセスについては [Repository とデータの操作](../framework/database/repositories.md) を、組み込みについては [ルートと HTTP の API](server-apis.md) を参照してください。

## インストールとアップグレードを確認する

プラグインの `tests/database/categories.test.ts` で、実際のマイグレーションのソースを使います。

```ts
import { fileURLToPath } from 'node:url';
import { describeMigration } from '@nocobase/app-testing/server';
import metadata from '../../package.json' with { type: 'json' };

describeMigration('202611040020_notice_data_create_categories', {
  sources: [{
    packageName: metadata.name,
    directory: fileURLToPath(new URL('../../database/migrations/', import.meta.url)),
  }],
  up: async ({ expectCollection }) => {
    await expectCollection('noticeCategories').toHaveField('code', {
      type: 'string', nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('noticeCategories').not.toExist();
  },
});
```

`describeMigration()` はマイグレーションを適用し、スキーマとメタデータを確認し、ロールバックしてから再適用します。カテゴリーのコードの重複が拒否されることを、業務のアサーションとして追加します。シードのテストでは、初回のインストール、名前が保たれること、再試行を確認します。リソースがほかのプラグインのコレクションに依存する場合は、前提となるマイグレーションのソースを含めるか、完全なアプリのフィクスチャーを使います。

アプリのルートで実行します。

```bash
pnpm --filter @nocobase/app-plugin-notice-data exec vitest run tests/database/categories.test.ts
```

アップグレードのマイグレーションでは、古いバージョンのレコードを用意してから、新しいデータと制約を確認します。共通のテストのツールについては [データベースのテスト](../developing-apps/testing-and-acceptance.md#databaseデータとマイグレーション) を参照してください。

## データベースのリソースをビルドして引き渡す

ひな形のコンパイルと `nocobase-db-manifests` の手順は保ちます。これらは、コンパイルしたマイグレーションとシードのマニフェストを生成します。マニフェストはプラグインが自分で生成し、アプリがインストール済みの依存関係のマニフェストを生成し直してはいけません。[チェックサムとコンパイル済みの成果物](../framework/database/migrations.md#チェックサムとコンパイル済みの成果物) を参照してください。

アプリのルートで、プラグインを確認してアプリをビルドします。

```bash
pnpm --filter @nocobase/app-plugin-notice-data check
pnpm build
```

公開するパッケージに、`dist/database/migrations/`、使用している場合は `dist/database/seeds/`、それぞれのディレクトリの `.manifest.json` が含まれていることを確認します。分離したアプリで、コンパイル済みの成果物を使って空の状態からのインストールとアップグレードの両方を確認し、`baseDir` がリソースを解決できることを証明します。workspace のソースでのテストが通っても、パッケージにすべてが含まれていることの証明にはなりません。

プラグインの登録を解除しても、そのスキーマやデータは削除されません。ロールバックはアプリのバッチのルールに従い、ほかのプラグインにも影響することがあります。`db rollback` はプラグインのアンインストールのコマンドではありません。引き渡しのチェックについては [ビルドと公開](publish-plugin.md) を参照してください。

[リソースの宣言の型](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/app/app-server/src/plugins/types.ts)、[ひな形の宣言](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/tools/create-plugin/template/server/plugin.ts)、[ひな形のテスト](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/tools/create-plugin/template/tests/database/migrations.test.ts) を参照してください。
