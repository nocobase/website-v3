---
title: リレーションと関連
description: belongsTo、hasOne、hasMany、belongsToMany のリレーションを、明示的な外部キーのフィールド、インデックス、制約とともに定義します。
---

リレーションを使うと、Repository は論理モデルを通じて関連するレコードを読み書きできます。これらの例は、[テーブルとフィールド](schema.md) の、自動採番の `id` と NULL 許容の整数 `customerId` を持つ `orders` を使い、マイグレーションの `up({ builder })` のコールバックで実行します。

## リレーションのフィールドとデータベースの制約

注文の `customerId` は、その顧客の ID を保存する物理的なフィールドです。`customer` はリレーションのフィールドで、その顧客をどう読み取るかを Repository に伝えます。データベースの外部キーは、NULL でない ID が実際の顧客を参照することを保証します。これらはそれぞれ役割が異なり、リレーションを宣言しても顧客へのアクセスは付与されません。

どのリレーションにも明示的なキーが必要で、`id` やリレーションの名前から推測されることはありません。

| リレーション | 必須のオプション |
| --- | --- |
| `belongsTo` | `foreignKey`、`targetKey` |
| `hasOne`、`hasMany` | `sourceKey`、`foreignKey` |
| `belongsToMany` | `sourceKey`、`targetKey`、`through`、`foreignKey`、`otherKey` |

論理的なフィールド名と、ダイアレクト固有の unsigned 属性を含めた互換性のあるキーの型を使います。リレーションを作成する前に、既存のレコードが制約を満たしているかを確認してください。

## 多対一のリレーション

顧客を作成してから、注文のリレーションを追加します。この時点で、既存の注文の `customerId` は NULL であるはずです。過去の ID が入っている場合は、先に対応する顧客をインポートして参照を検証します。

```ts
await builder.createCollection('customers', (c) => {
  c.increments('id');
  c.string('name', { length: 120 }).notNull();
});
await builder.alterCollection('orders', (c) => {
  c.belongsTo('customer', 'customers')
    .foreignKey('customerId')
    .targetKey('id')
    .constraints(true)
    .onDelete('restrict');
});
```

`foreignKey('customerId')` は注文のフィールドを再利用し、`targetKey('id')` は顧客の主キーを指します。これで Repository は `include('customer', ...)` で顧客を読み取れます。[関連の照会](association-queries.md) を参照してください。

`belongsTo` はローカルに外部キーの列を作成することもできますが、明示的な `foreignKeyType` が必要です。たとえば `c.belongsTo('customer', 'customers', { foreignKeyType: 'integer', unsigned: true })` を使い、両方のキーを指定します。既存のスカラーのフィールドには、このオプションは不要です。NULL 許容、既定値、型を明示できるよう、スカラーのフィールドは別に宣言することを優先してください。

## 一対一と一対多のリレーション

顧客の注文の一覧は逆方向のリレーションで、外部キーは注文側に残ります。

```ts
await builder.alterCollection('customers', (c) => {
  c.hasMany('orders', 'orders')
    .sourceKey('id')
    .foreignKey('customerId');
});
```

`hasMany` はリレーションのメタデータを追加するだけで、別の外部キーのフィールドは作成しません。顧客ごとにプロフィールを最大 1 つにするには、`hasOne` を使い、プロフィールの顧客 ID を一意にします。

```ts
await builder.createCollection('customerProfiles', (c) => {
  c.increments('id');
  c.integer('customerId').unsigned().notNull().unique();
  c.text('notes');
  c.belongsTo('customer', 'customers', { index: false })
    .foreignKey('customerId').targetKey('id')
    .constraints(true).onDelete('cascade');
});
await builder.alterCollection('customers', (c) => {
  c.hasOne('profile', 'customerProfiles')
    .sourceKey('id').foreignKey('customerId');
});
```

`hasOne` だけでは、データベースでプロフィールが 1 つであることは強制されません。`unique()` が顧客 ID の重複を拒否します。これはすでにインデックスを提供しているため、リレーションでは別の既定のインデックスを作らないよう `index: false` を設定しています。ここでは顧客を削除するとそのプロフィールも削除されますが、これはこの例での明示的な業務上の選択です。

## 多対多のリレーションと中間テーブル

1 つの注文に複数のタグを付けられ、各タグも複数の注文に付けられます。リレーションを宣言する前に、タグと中間テーブルを作成します。

```ts
await builder.createCollection('tags', (c) => {
  c.increments('id');
  c.string('name', { length: 64 }).notNull().unique();
});
await builder.createCollection('orderTags', (c) => {
  c.integer('orderId').unsigned().notNull();
  c.integer('tagId').unsigned().notNull();
  c.primary(['orderId', 'tagId']);
  c.foreignKey('orderId', {
    references: { collection: 'orders', fields: ['id'] },
    onDelete: 'cascade',
  });
  c.foreignKey('tagId', {
    references: { collection: 'tags', fields: ['id'] },
    onDelete: 'cascade',
  });
});
await builder.alterCollection('orders', (c) => {
  c.belongsToMany('tags', 'tags')
    .sourceKey('id').targetKey('id')
    .through('orderTags').foreignKey('orderId').otherKey('tagId');
});
```

`foreignKey` は注文を指す中間テーブルのフィールドで、`otherKey` はタグを指します。複合主キーが、注文とタグの組の重複を防ぎます。リレーションが `orderTags` を自動で作成することはありません。並び順など、中間テーブルの追加のフィールドは明示的に宣言します。

この例では、注文やタグを削除すると、その中間の行は連鎖して削除されますが、反対側の業務レコードは削除されません。リレーションの書き込みについては [関連の照会と書き込み](association-queries.md) を参照してください。

## インデックス、削除と更新のルール

`belongsTo` は既定で外部キーのインデックスを追加し、`index: false` でこれを無効にします。名前付きのインデックスがすでにある場合、特に `addField()` で別にリレーションを追加する場合は、インデックスの重複を避けるため `index: false` を設定します。

自動の外部キーを作成するのは、`constraints: true` または `.constraints(true)` だけです。`foreignKey()` や `addConstraint()` ですでに作成している場合は、リレーションで `constraints: false` を使います。これで既存のデータベースの制約が削除されることはありません。`hasOne`、`hasMany`、`belongsToMany` が、相手のテーブルの制約を代わりに用意することはありません。

`onDelete` と `onUpdate` は、データベースの機能に応じて `restrict`、`cascade`、`set null`、`set default`、`no action` を受け付けます。`set null` には NULL 許容のフィールドが、`set default` には参照を満たす既定値も必要です。データベースによって削除の既定の動作が同じだとは考えないでください。

ロールバックでは、参照されるコレクションを削除する前に、依存関係の順にリレーション、制約、インデックス、追加したフィールドを削除します。スカラーのフィールドを再利用するリレーションを削除しても、そのフィールドや、明示的に作成したすべてのインデックスと制約は削除されません。テストでは、Repository がリレーションを読み取れることの確認にとどまらず、実際のスキーマ、無効な参照、重複した関連、削除後のレコードを確認してください。

[リレーションのキーの取り決め](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/collection/relation-contract.ts) と [スキーマのコンパイラー](https://github.com/nocobase/nocobase/blob/d04061ee252afbcc2f42cf1d69ab8888e72d604a/packages/libs/db/src/collection/compiler/compiler.ts) を参照してください。
