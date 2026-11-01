---
title: テーブルとフィールド
description: CollectionBuilder でコレクション、フィールド、インデックス、制約を作成・変更します。命名、メタデータ、データベースの機能も扱います。
---

`CollectionBuilder` は、論理的なコレクションの定義をデータベースのスキーマに変換し、モデルに必要なメタデータを同期します。アプリとプラグインは、[マイグレーション](migrations.md) のコールバック `up({ builder })` と `down({ builder })` の中でこれを使います。以下のコード片は、それらのコールバックの中に置きます。

## コレクションを作成する

コールバックで注文のテーブルを宣言します。

```ts
await builder.createCollection('orders', (c) => {
  c.increments('id');
  c.string('orderNo', { length: 64 }).notNull().unique();
  c.string('status', { length: 32 }).notNull().defaultTo('draft');
  c.decimal('amount', { precision: 12, scale: 2 }).notNull().defaultTo(0);
  c.integer('customerId').unsigned().nullable();
  c.datetimeTz('createdAt').notNull();
  c.index(['status', 'id']);
});
```

マイグレーションを適用すると、`orders` には宣言した 6 つのフィールド、一意の注文番号、ステータスのインデックスができます。フレームワークが暗黙に `id`、`createdAt`、`updatedAt` のフィールドを追加することはありません。`increments()` は自動採番の主キーを明示的に作成します。通常のフィールドに `id` という名前を付けても主キーにはなりません。この例の `createdAt` には既定値がないため、注文の作成時に指定します。

`createCollection()` は定義のオブジェクトも受け付けます。これは注文のテーブルにフィールドを追加するのではなく、別のステータス辞書を作成します。

```ts
await builder.createCollection('orderStatuses', {
  fields: [
    { name: 'code', type: 'string', length: 32, primaryKey: true, nullable: false },
    { name: 'title', type: 'string', length: 100, nullable: false },
  ],
});
```

オブジェクトには `fields`、`indexes`、`constraints` などのプロパティが含まれます。フィールドの配列だけを 2 つ目の引数にすることはできません。変化していく業務モデルをインポートするのではなく、どちらかの形式で固定の定義をマイグレーションの中に書きます。複数のコレクションをまとめて作成するには、`createCollections([{ name, definition }])` が同じ定義の形式を受け付けます。

## フィールドと既定値を宣言する

オプションとメソッドチェーンで、同じルールを表せます。`c.string('title', { nullable: false })` と `c.string('title').notNull()` は同等です。1 つのファイルでは、主に 1 つの書き方を使ってください。

| データ | 宣言 | 境界 |
| --- | --- | --- |
| 短いテキスト | `c.string('title', { length: 120 })` | 空の内容と長さは、引き続きエンドポイントで検証する |
| 長いテキスト | `c.text('note')` | 長いテキストの上限を、短い文字列の長さで表さない |
| 真偽値 | `c.boolean('active').notNull().defaultTo(true)` | NULL を許可するかどうかを決める |
| 整数 | `c.integer('quantity').notNull().defaultTo(1)` | NULL でないことは正の値であることを意味しない |
| 正確な金額 | `c.decimal('amount', { precision: 12, scale: 2 })` | 読み書きで小数の精度を保つ |
| 大きな整数 | `c.bigInt('externalId')` | JavaScript の安全な整数の範囲を超える場合は 10 進数の文字列を使う |
| 暦の値 | `c.date('dueDate')`、`c.time('opensAt')`、`c.datetime('scheduledAt')` | 絶対的な時刻と区別する |
| 時刻 | `c.datetimeTz('paidAt')` | UTC の意味を使う |
| 構造化データ | `c.json('settings')` | ダイアレクトごとのエンコードは Repository に任せる |
| 固定の列挙 | `c.enum('state', { values: ['draft', 'paid'] })` | メンバーの変更にはマイグレーションが必要。制約の対応はダイアレクトによる |

そのほかの型には `char`、`float`、`double`、`blob`、`uuid`、`native` があります。`char` には長さが、`native` にはネイティブの型名が必要で、移植性が制限されます。完全な [フィールドの型とオプション](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/collection/types.ts) を参照してください。

既定値は、挿入時に省略されたフィールドを補います。既定値を変えても、既存のレコードが自動で更新されるわけではありません。埋め戻しはマイグレーションで明示的に定義してください。NULL 不可や一意性などのデータベースの制約は、エンドポイントの検証やアクセスのチェックの代わりにはなりません。

## キー、インデックス、制約を定義する

`primary()`、`unique()`、`index()` は、1 つのフィールド名または配列を受け付けます。たとえば `c.unique(['customerId', 'orderNo'])` は、各フィールドではなくその組み合わせを一意にします。中間テーブルでは、`c.primary(['orderId', 'tagId'])` で複合主キーにできます。

既存のコレクションには `addIndex()` と `addConstraint()` を使います。この例には、`orders.customerId` と互換性のある既存の `customers.id` と、既存の NULL でない顧客 ID がすべて有効な参照であることが必要です。

```ts
await builder.addIndex('orders', {
  name: 'idx_orders_customer',
  fields: ['customerId'],
});
await builder.addConstraint('orders', {
  type: 'foreignKey',
  name: 'fk_orders_customer',
  fields: ['customerId'],
  references: { collection: 'customers', fields: ['id'] },
  onDelete: 'restrict',
});
```

インデックスは照会を支え、外部キーは有効な参照を強制します。`onDelete: 'restrict'` は、注文がまだ参照している顧客の削除を拒否します。これらの操作は、同じ名前で元に戻します：`dropConstraint('orders', 'fk_orders_customer')` と `dropIndex('orders', 'idx_orders_customer')`。明示的なインデックスと制約の名前は、大文字小文字の変換なしにそのまま使われます。

リレーションのメタデータと自動のインデックスについては [リレーションと関連](relations.md) を参照してください。同じ外部キーに対して、インデックスや制約を重複して作成しないでください。

## 既存のスキーマを変更する

マージ済みまたはリリース済みのマイグレーションは変更しません。明示的な構造の操作を含む、あとのマイグレーションを追加します。

```ts
await builder.alterCollection('orders', (c) => {
  c.text('note').nullable();
});
```

明示的な業務ルールで `note` を埋め戻し、制約を厳しくする前に NULL が残っていないことを確認します。[過去のデータを埋め戻して変換する](migrations.md#過去のデータを埋め戻して変換する) を参照してください。

```ts
await builder.alterField('orders', 'note', { type: 'text', nullable: false });
```

フィールドを変更するときは、該当する型、長さ、精度を明示的に保ち、対象のデータベースで結果を確認してください。

1 つのフィールドには `addField(collection, field)` も使えます。フィールドは `dropField()` で、コレクションは `dropCollection()` で削除します。これらの操作では、影響を受けるデータが失われます。`renameCollection(oldName, newName)` はテーブルのコレクションに対応していますが、先に処理が必要なリレーション、外部キー、ビューの依存関係があると拒否されることがあります。テーブルを削除して作り直すことで名前の変更の代わりにしないでください。

## 論理的な命名とメタデータ

Builder の引数は、`orderItems` や `customerId` のような論理名です。`underscored` や `tablePrefix` を含む命名の設定が、物理名を決めます。接頭辞を自分で組み立てたり、`tableName` や `columnName` の対応を Builder に渡したりしないでください。

物理的なスキーマと補足のメタデータが一緒になってモデルを解決します。Builder はそれらを同期します。メタデータの同期を無効にしたり、`database/<connection>/collections/` 以下の生成されたファイルを編集したりしても、スキーマの変更の代わりにはなりません。キャッシュの確認については [アプリのテーブルの作成と初期化](../../developing-apps/data-models-and-migrations.md) を参照してください。別のシステムが所有するスキーマには [外部の接続](../../developing-apps/existing-databases.md) を使い、Builder の DDL は拒否されます。

## 変更のプレビューとデータベースの機能

Builder のプレビューは、個々の操作とダイアレクトの警告を報告します。

```ts
const result = await builder.addField(
  'orders',
  { name: 'note', type: 'text', nullable: true },
  { dryRun: true, previewSql: true },
);
console.log(result.sql, result.warnings, result.impact);
```

`dryRun: true` は、スキーマの変更もメタデータの同期も実行しません。`previewSql: true` は、アダプターが対応していれば SQL を返しますが、それ自体は実行を止めません。`warnings` は機能の制限を、`impact` はデータへの潜在的な影響を記述します。プレビューが成功を保証するわけではありません。この操作のプレビューは、保留中のタスクのファイルを一覧表示するだけの `db apply --dry-run` とは異なります。

実行時、`strict: true` は機能の警告をエラーにします。削除の確認のオプションではありません。`ifNotExists` と `ifExists` は、対応している作成や削除の操作をスキップしますが、既存のオブジェクトの形を修正することはありません。Builder の `transaction` オプションは、まだトランザクションを管理せず、`builder.transaction()` もトランザクションを開始しません。タスクのトランザクションはマイグレーションのランナーが管理します。[実行順序、履歴、トランザクション](migrations.md#実行順序履歴トランザクション) を参照してください。

[Builder の実装を見る](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/collection/builder/builder.ts)。
