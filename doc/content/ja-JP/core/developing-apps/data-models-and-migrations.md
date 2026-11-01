---
title: テーブルを作成してデータを初期化する
description: アプリのステータス辞書を作成し、既定値をインストールし、以降の変更は新しいマイグレーションと実際のデータベースでのテストで管理します。
---

既存の NocoBase アプリで、マイグレーションでステータス辞書を作成し、シードで既定値をインストールします。ここでは `appStatuses` が固定のコードと編集可能なタイトルを保存し、のちのアップグレードで説明を追加します。アプリが必要な場合は [先に作成する](../getting-started/create-app.md) か、下の [完全なサンプル](#サンプルのソースと実行) を実行してください。

## ディレクトリとファイルの規約

これらのファイルはアプリのルートの下に置きます。この例では、設定済みの管理対象の接続 `main` を使います。

```text
database/
└── main/
    ├── migrations/
    │   ├── 202611040001_create_app_statuses.ts
    │   └── 202611040003_add_app_status_description.ts
    ├── seeds/
    │   └── 202611040002_default_app_statuses.ts
    └── collections/  # Generated cache
```

ディレクトリ名は接続を識別しますが、ディレクトリを作成しても接続は登録されません。別の接続の場合は、ディレクトリと `--connection` 引数の両方を変更します。[複数のデータベース接続](multiple-databases.md) を参照してください。データベースのファイルがサーバーの型チェックに含まれるよう、テンプレートの `database/tsconfig.json` は残しておきます。

各タスクの定義はデフォルトエクスポートし、`name` は拡張子を除いたファイル名と一致させ、その接続の同じ種類のタスクの中で一意にします。マイグレーションはスキーマとアップグレード時のデータ変更を管理し、シードは既定値をインストールします。日常のステータスの編集は業務サービスが扱います。

## テーブルを作成する

`database/main/migrations/202611040001_create_app_statuses.ts` を作成します。

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040001_create_app_statuses',
  async up({ builder }) {
    await builder.createCollection('appStatuses', (collection) => {
      collection.string('code', { length: 32 }).primary().notNull();
      collection.string('title', { length: 100 }).notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('appStatuses');
  },
});
```

実行後、`code` は一意のステータス識別子、`title` は必須の表示名になります。ステータスの名前を変えても、`code` によって同一性は保たれます。`down()` は辞書とそのレコードをすべて削除するため、それらを失ってもよい場合にだけ使います。

ここではマイグレーションのコンテキストの `builder` を使っています。フィールド、インデックス、制約については [テーブルとフィールド](../framework/database/schema.md) を、定義のオプションについては [マイグレーション](../framework/database/migrations.md) を参照してください。[このマイグレーションを見る](https://github.com/nocobase/docs-examples-v3/blob/96410dc943d7ac65737b50f110c129da1588fa94/apps/database-basics/database/main/migrations/202611040001_create_app_statuses.ts)。

## 既定のレコードを初期化する

`database/main/seeds/202611040002_default_app_statuses.ts` を作成します。

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040002_default_app_statuses',
  async run(context) {
    const statuses = context.repository('appStatuses');
    for (const values of [
      { code: 'draft', title: 'Draft' },
      { code: 'published', title: 'Published' },
    ]) {
      if (await statuses.findOne({ filter: { code: values.code } })) continue;
      await statuses.createOne({ values });
    }
  },
});
```

初回のインストールで `draft` / `Draft` と `published` / `Published` が作成されます。管理者がすでに `draft` を `Writing` に名前変更している場合、そのタイトルは保持され、足りないステータスだけが補われます。主キーがコードの重複を防ぎます。読み取りと挿入の間に並行して競合が起きた場合は、黙って無視するのではなく、タスクを失敗させるべきです。

`context.repository()` はシードの接続とトランザクションに結び付いています。シードで別の DatabaseManager を取得したり、テーブルを作成したりしないでください。既定値の更新、設定、任意のサンプルについては [シードデータ](../framework/database/seeds.md) を参照してください。[シードを見る](https://github.com/nocobase/docs-examples-v3/blob/96410dc943d7ac65737b50f110c129da1588fa94/apps/database-basics/database/main/seeds/202611040002_default_app_statuses.ts)。

## 変更を適用して結果を確認する

アプリの設定が意図したデータベースを対象にしていることを確認してから、アプリのルートで次を実行します。

```bash
pnpm nocobase config check
pnpm nocobase db apply --connection main --dry-run
pnpm nocobase db apply --connection main
pnpm nocobase collections generate --connection main --check
```

`--dry-run` はタスクを実行せずに計画を一覧表示します。実際に実行すると、その接続の保留中のマイグレーションをすべて適用してから、シードを実行します。既定の接続には登録済みのプラグインのリソースも含まれるため、出力にはこれらのファイル以外のものも含まれることがあります。

初回の実行後、辞書には 2 件の既定のレコードが入ります。のちのアップグレード用のマイグレーションがすでにある場合は、どちらも `description: null` になります。`db apply` を繰り返しても、成功した履歴はスキップされ、重複したレコードは追加されないはずです。

既定では、マイグレーションがスキーマを変更すると、`db apply` が `database/main/collections/` を更新します。その `collection.json`、`metadata.json`、`schema.json` と接続のマニフェストは再生成できるキャッシュなので、編集しないでください。`collections generate --check` は、データベースと一致していることを報告するはずです。マイグレーションが成功したあとに更新が失敗した場合は、別に `pnpm nocobase collections generate --connection main` を実行します。

既定の接続では、通常、アプリの起動時にデータベースのタスクが実行されます。手動のコマンドを使えば、計画を事前に確認して適用できます。起動時の設定と、ほかの接続での自動実行については [複数のデータベース接続](multiple-databases.md) を参照してください。

## マイグレーションを追加して既存のデータを保つ

辞書が使われ始めたら、最初のマイグレーションは編集せず、新しいファイル `database/main/migrations/202611040003_add_app_status_description.ts` で説明を追加します。

```ts
import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040003_add_app_status_description',
  async up({ builder }) {
    await builder.alterCollection('appStatuses', (collection) => {
      collection.text('description').nullable();
    });
  },
  async down({ builder }) {
    await builder.dropField('appStatuses', 'description');
  },
});
```

同じ `db apply` コマンドを実行します。既存のコードとタイトルは残り、`description: null` になります。このマイグレーションをロールバックすると説明は失われますが、元のステータスのレコードは残ります。説明を必須にする前に、既存の行をどう埋めるかを決めて、別のマイグレーションを追加します。[過去のデータを埋め戻して変換する](../framework/database/migrations.md#過去のデータを埋め戻して変換する) を参照してください。

編集を反映させるためにデータベースを空にしないでください。実行済みのファイルを編集しても、再び実行されることはありません。チェックサム、バッチ単位のロールバック、シードの履歴については [マイグレーション](../framework/database/migrations.md#ロールバックと元に戻せない変更) を参照してください。[アップグレード用のマイグレーションを見る](https://github.com/nocobase/docs-examples-v3/blob/96410dc943d7ac65737b50f110c129da1588fa94/apps/database-basics/database/main/migrations/202611040003_add_app_status_description.ts)。

## インストールとアップグレードを検証する

完全なサンプルの [`tests/database/app-statuses.test.ts`](https://github.com/nocobase/docs-examples-v3/blob/96410dc943d7ac65737b50f110c129da1588fa94/apps/database-basics/tests/database/app-statuses.test.ts) は、分離された実際のデータベースを使います。サンプルアプリのルートで次を実行します。

```bash
pnpm exec vitest run --project node tests/database/app-statuses.test.ts
```

テストは、スキーマの作成、コードの重複の拒否、既定値のインストール、履歴に基づくスキップ、カスタマイズされたタイトルの保持を網羅します。アップグレードのテストは、説明を追加する前に古いレコードを挿入し、マイグレーションの適用、ロールバック、再適用のあとに保持されていることを確認します。

失敗のテストは、実際のシードを呼び出してからわざと例外を投げ、レコードと成功の履歴がロールバックされたことを確認し、失敗の条件を取り除いて再試行します。別のテストでは、別の履歴テーブルを使って同じシードをもう一度実行し、履歴に基づくスキップとは別に、業務上の冪等性を確認します。

これらのテストは、アプリの開発用データベースをリセットしません。`describeMigration()`、`createDatabaseTest()`、ほかのテスト用データベースの設定については、[データベースとコマンドラインのテスト](testing-and-acceptance.md#データベースとコマンドラインのテスト) を参照してください。

## サンプルのソースと実行

独立した [Database basics アプリ](https://github.com/nocobase/docs-examples-v3/tree/96410dc943d7ac65737b50f110c129da1588fa94/apps/database-basics) は、業務の管理ページを必要とせず、データベースのコマンドと分離されたテストでステータス辞書を示します。Node.js 24 と pnpm 11 を使います。依存関係と設定については、固定コミットの [README](https://github.com/nocobase/docs-examples-v3/blob/96410dc943d7ac65737b50f110c129da1588fa94/apps/database-basics/README.MD) を参照してください。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 96410dc943d7ac65737b50f110c129da1588fa94
cd apps/database-basics
pnpm install --frozen-lockfile
pnpm exec vitest run --project node tests/database/app-statuses.test.ts
```

テストには開発用データベースの設定は不要です。アプリの CLI でマイグレーションを適用するには、インストール後に `pnpm nocobase config init` を実行し、データベースを設定してから前述のコマンドを使います。すでに設定済みのアプリでは初期化し直す必要はありません。テストは既定で SQLite を使います。ほかのデータベースにはそのドライバーとテスト用の接続設定が必要です。業務アプリを SQLite に切り替える必要はありません。
