---
title: Repository とデータの操作
---

Repository は、コレクションの論理的なフィールドとリレーションを読み書きし、コーデック、照会の取り決め、結び付けたポリシーを適用します。取得しても、テーブルが作成されたり、呼び出し元が認証されたりはしません。

このページでは、サーバー側からのデータベースへの直接のアクセスを扱います。クライアントから呼び出すには、`defineRepositoryApiRoutes()` で [Repository のデータ API](../http/repository-routes.md) を宣言し、`api.repository(name)` を使います。データベースの操作が自動で HTTP のエンドポイントになることはありません。

## 1 件のレコードの書き込み

ここでは [注文のモデル](schema.md) を使い、`SO-001` が存在しないことを前提にしています。ユーザー向けの呼び出し側は、先に認可から得たポリシーを結び付ける必要があります。

```ts
import type { DatabaseManager } from '@nocobase/db';

export async function createOrder(database: DatabaseManager) {
  const orders = database.repository('orders');
  const result = await orders.createOne({
    values: { orderNo: 'SO-001', title: 'First order', amount: '19.90' },
  });
  return result.record;
}
```

`createOne()`、`updateOne()`、`upsertOne()` は変更の結果を返します。結果を行として扱わず、`.record` を読み取ってください。正確な小数の文字列を使うと、金額の浮動小数点の誤差を避けられます。

## 読み書きの取り決め

| メソッド | 動作 |
| --- | --- |
| `findMany()` | 遅延評価の照会。配列を await するか、非同期で反復する |
| `findOne()` | レコードまたは `undefined`。一意であることは保証しない |
| `count()` / `exists()` | 件数または存在 |
| `updateOne()` / `deleteOne()` | 対象がちょうど 1 件であることが必要 |
| `upsertOne()` | 一意のセレクターと、作成と更新で別々の入力 |
| 一括の作成、更新、削除 | 件数と、必要に応じて選んだレコード |

await と反復を混ぜたり、同じ照会を何度も反復したりしないでください。一括の更新と削除には、フィルターまたは明示的な `all: true` が必要です。一括の値は、1 件のレコードでのネストしたリレーションの操作のすべてに対応しているわけではありません。

## 選択と認可

必要なフィールドだけを選びます。選択を省略すると通常すべてのスカラーが読み取られますが、それで機密のフィールドを公開してはいけません。サーバーが導いた行、フィールド、リレーションのポリシーは `withPolicy()` で適用します。変更後に返す読み取りも、ポリシーに従います。

呼び出し側が指定したフィルターは、アクセスを付与しません。外部からの照会の入力では、フィールド、上限、複雑さを検証してください。

## Query を使うべきとき

Query は、集合単位の埋め戻しや、Repository では表現できないテーブルの照会に使います。Query は Repository の対応付けやポリシーの意味をすべて引き継ぐわけではないため、命名と認可は明示的に扱ってください。[トランザクション](transactions.md) と [関連の照会](association-queries.md) を参照してください。

## インターフェースと実装

- [Repository のメソッド](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/repository.md)
- [ポリシーの動作](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
