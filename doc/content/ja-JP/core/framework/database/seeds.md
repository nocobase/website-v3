---
title: シードデータ
description: defineSeed で既定値をインストールし、既存のレコード、設定、任意のサンプル、履歴、再試行を扱います。
---

シードは、既定のステータスやカテゴリーなど、アプリやプラグインに必要な初期レコードをインストールします。スキーマの変更とアップグレード時の埋め戻しは [マイグレーション](migrations.md) に、ユーザーが作成した注文などの日常のレコードは業務サービスに属します。

## シードを定義する

ここでは、[テーブルとフィールド](schema.md) の、`code` を主キー、`title` を表示名とする `orderStatuses` を使います。アプリまたはプラグインのシードのディレクトリに `202611040010_default_order_statuses.ts` として保存します。

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040010_default_order_statuses',
  async run(context) {
    const statuses = context.repository('orderStatuses');
    for (const values of [
      { code: 'draft', title: 'Draft' },
      { code: 'paid', title: 'Paid' },
    ]) {
      if (await statuses.findOne({ filter: { code: values.code } })) continue;
      await statuses.createOne({ values });
    }
  },
});
```

`defineSeed()` はタスクを定義し、ランナーが実行時に `run(context)` を呼び出します。定義はデフォルトエクスポートし、`name` はファイル名と一致させ、その接続のすべてのシードの取得元の中で一意にします。任意の設定は `transaction` と `sample` です。`down()`、`shouldRun()`、繰り返し実行のモードはありません。

初回の実行後、既存のステータスの名前を保ったまま、`draft` と `paid` が存在するようになります。必要なスキーマは、先にマイグレーションで作成しておく必要があります。

## シードのコンテキストを使う

`run()` は次のメンバーを受け取ります。

| メンバー | 用途 |
| --- | --- |
| `repository(name)` | フィールドのコーデックとリレーションの書き込みを使って、コレクションのレコードをインストールする |
| `query` | コレクションのない物理的なテーブルの読み取りなど、Repository ではうまく表現できない操作 |
| `connection` | 接続名、ダイアレクト、機能、低レベルの `client()` |
| `config` | `get()` で初期化の設定を読み取る |
| `container` | ランナーが許可したサービス |

シードには `builder` がありません。新しいテーブルやフィールドは、先にマイグレーションで追加します。`repository()` と `query` はタスクの接続と、有効な場合はそのトランザクションに結び付いています。外部のマネージャーから別の Repository を取得して書き込まないでください。

`connection` は制限されています。`connection.repository()` も、タスクのトランザクションを自分で開始する方法も提供しません。`config` と `container` には、[マイグレーションのコンテキスト](migrations.md#設定と許可されたサービスを読み取る) と同じアプリレベルの境界があります。コンテキストの Repository での書き込みは、実行時の変更のイベントを発行しません。

## 足りないレコードを追加する、または既存のレコードを更新する

初期化がどのフィールドを担うかを決めます。最初の例は足りないレコードを補うだけで、ユーザーの編集は保ちます。システムのステータスの固定のタイトルを元に戻すことをアプリが明示的に求める場合は、次を使います。

```ts
await context.repository('orderStatuses').upsertOne({
  filter: { code: 'draft' },
  create: { code: 'draft', title: 'Draft' },
  update: { title: 'Draft' },
});
```

`create` はレコードがない場合を、`update` は既存のレコードを扱います。これは既存のタイトルを `Draft` に戻すため、管理者がカスタマイズできる名前には向いていません。あとのバージョンでのデータの変更には、成功したファイルを編集するのではなく、新しいシードを追加します。

成功の履歴があれば、通常の起動ではシードはスキップされます。業務上の冪等性は、繰り返しの入力で重複したレコードが作られるのを防ぎます。どちらももう一方の代わりにはなりません。固定の業務キーは、データベースの一意性で支えます。挿入の前に確認しても、並行した競合はなくなりません。関係のないエラーを握りつぶすのではなく、競合でタスクを失敗させ、調査してから再試行してください。

## 初期化の設定を読み取る

設定できる既定値は、`run(context)` の中で読み取って検証します。これは固定の `Draft` のタイトルを置き換えます。

```ts
const title = context.config.get<unknown>('orders.initialDraftTitle') ?? 'Draft';
if (typeof title !== 'string' || title.trim().length === 0 || title.length > 100) {
  throw new Error('orders.initialDraftTitle must be a non-empty string of up to 100 characters.');
}
const statuses = context.repository('orderStatuses');
if (!(await statuses.findOne({ filter: { code: 'draft' } }))) {
  await statuses.createOne({ values: { code: 'draft', title } });
}
```

`orders.initialDraftTitle` は、アプリが所有するキーの例です。必要に応じてアプリの [設定](../../developing-apps/configuration-and-settings.md) で宣言し、宣言しない場合はこの例では `Draft` を使います。`config.get<T>()` の型パラメーターは、値を検証しません。

初期化後に設定を変えても、シードが再実行されたり、ユーザーの編集がリセットされたりはしません。編集可能なままにすべき設定には、起動のたびに上書きするシードではなく、業務の管理画面の入口が必要です。

## 必須のデータと任意のサンプル

既定の業務のステータスは必須のデータです。試すための架空の注文には `sample: true` を付けます。ここでは [注文のテーブル](schema.md) を使い、`202611040011_sample_order.ts` として保存します。

```ts
import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040011_sample_order',
  sample: true,
  async run(context) {
    const orders = context.repository('orders');
    if (await orders.findOne({ filter: { orderNo: 'SAMPLE-001' } })) return;
    await orders.createOne({
      values: {
        orderNo: 'SAMPLE-001',
        status: 'draft',
        amount: '12.50',
        customerId: null,
        createdAt: new Date('2026-10-01T00:00:00Z'),
      },
    });
  },
});
```

通常のシードは、そのレコードがサンプルのように見えるだけではスキップされません。アプリがサンプルのシードを自動で実行するのは、`app.sampleData: true` で接続を新規にインストールするときだけです。つまり、実行前にマイグレーションもシードの履歴もなかった場合か、管理対象のスキーマのリセットでそれを作り直したばかりの場合です。それ以外では `skipped` として記録され、あとで設定を有効にしても自動では実行されません。低レベルの Seeder を直接呼び出す場合は、`sample.enabled` で制御します。

開発中のアプリのディレクトリで、スキップされたサンプルを読み込むには次を実行します。

```bash
pnpm nocobase db sample
```

このコマンドは、スキップされたサンプルのシードと、登録されたサンプルデータのサービスを処理します。デプロイの成果物では拒否されます。ほかのプラグインの業務サービスが必要なサンプルは、それらのサービスをシードのコンテキストで公開しようとするのではなく、アプリの準備ができてから `sampleDataToken` を使って生成すべきです。組み込みについては [プラグインのデータベースのリソース](../../extension-development/database-and-migrations.md#マイグレーションと初期データを書く) を参照してください。

## 履歴、トランザクション、再試行

1 つの接続のシードは、アプリのデータベースの計画でマイグレーションのあとに、名前の順に実行されます。既定の `transaction: 'auto'` と `true` は、シードごとにトランザクションを開始し、書き込みを成功の履歴とともにコミットします。例外を投げるとそのトランザクションがロールバックされ、あとの実行で再試行できます。それより前に完了したシードは一緒に元に戻りません。

`transaction: false` では、失敗した書き込みの一部が残ることがあります。必要な場合にだけ使い、復旧の方法を定めてください。`run()` から正常に戻ると、途中の `return` も含め、成功として記録されます。必須の設定や前提条件が足りない場合は、戻ってあとで自動で再試行されることを期待するのではなく、例外を投げてください。

シードにはロールバックの入口がなく、マイグレーションのロールバックでもシードの履歴はクリアされません。成功したファイルを編集するとチェックサムがずれますが、再び実行されることはありません。共通の履歴、チェックサム、復旧のルールについては [マイグレーション](migrations.md#チェックサムとコンパイル済みの成果物) を参照してください。

## 初期化を検証する

分離した実際のデータベースで、空の状態からのインストール、既存の業務キー、ユーザーの編集の保持、再試行を確認します。2 つのテストを区別してください。Seeder をもう一度呼び出すと履歴によってスキップされるはずです。制御したテストで同じ `run()` のロジックをわざともう一度実行すると、その業務上の冪等性を確認できます。

失敗の網羅では、書き込み後に例外を投げ、レコードも成功の履歴も残っていないことを確認してから、失敗の条件を取り除いて実行が成功することを確認します。サンプルについては、モジュールがインポートできることを確認するだけでなく、有効、無効、あとから読み込んだ場合をテストします。[データベースのテスト](../../developing-apps/testing-and-acceptance.md#databaseデータとマイグレーション) を参照してください。

[シードのインターフェース](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/seed/types.ts)、[ランナーの実装](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/seed/seeder.ts)、[シードの動作のテスト](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db-testkit/tests/integration/seed/seeder.test.ts) を参照してください。
