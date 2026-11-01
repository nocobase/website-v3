---
title: 絞り込み、並べ替え、ページネーション
---

Repository はレコードを絞り込み、並べ替えてから、ページに分けます。一覧、件数、エクスポートで同じ認可の範囲を共有し、合計が漏れたり、存在しないページが生じたりしないようにします。

## 上限のある一覧の照会

```ts
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export async function searchOrders(db: DatabaseManager, policy: RepositoryPolicy,
  input: { q: string; page: number; pageSize: number }) {
  const { q, page, pageSize } = input;
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize)
    || pageSize < 1 || pageSize > 100) throw new Error('Invalid pagination');
  const offset = (page - 1) * pageSize;
  if (!Number.isSafeInteger(offset)) throw new Error('Invalid offset');
  const orders = db.repository('orders').withPolicy(policy);
  const filter = q ? ((f: import('@nocobase/db').FilterBuilder) =>
    f.string('title').includes(q)) : undefined;
  const data = await orders.findMany({
    filter, select: (s) => s.fields('id', 'title', 'status'),
    sort: (s) => s.field('id').asc(), limit: pageSize, offset,
  });
  const total = await orders.count({ filter });
  return { data, total };
}
```

ここでは、認可済みの Repository とフィルターを再利用しています。検索文字列の長さにも上限を設け、大きなオフセットのコストを評価してください。一覧と件数は別々の照会で、自動で 1 つのスナップショットになるわけではありません。

## 入力の形式

スカラー値の等価には `{ status: 'draft' }` を、複雑な条件には Filter Builder または JSON AST を使います。`{ amount: { gte: 100 } }` のようなネストした演算子のオブジェクトは、等価の省略形ではありません。使わないフィルターには、空のオブジェクトを渡さずに省略します。

ノードは `f.and([...])` と `f.or([...])` で組み合わせます。文字列、数値、日付、JSON にはそれぞれ別の演算子があります。文字列の比較で、タイムゾーンを考慮した日付の意味を表すことはできません。

## カーソルによるページネーション

カーソルは並べ替えの値の排他的な境界で、そのレコードがまだ存在している必要はありません。NULL を許可しないメタデータを持つ明示的なスカラーの並べ替えと、同順位を決めるための完全な主キーまたは一意キーを用意します。カーソルのキーは最終的な並べ替えの軸と完全に一致している必要があり、オフセットとは組み合わせられません。

`direction: 'backward'` は、元の並べ替えの順序を保ったまま、境界の直前のページを選びます。最初のページでは direction を省略します。direction を明示する場合はカーソルが必要です。結果には、pageInfo や nextCursor の包みは自動では付きません。

## 整合性とコスト

ページネーションはリクエストをまたいだスナップショットを提供せず、並べ替えの値が変わるとレコードが移動することがあります。必要な場合は、適切な分離レベルや業務上のスナップショットを使ってください。並べ替えは安定させ、フィルターと並べ替えに合わせてインデックスを設計します。

リレーションのローカルなページについては [関連の照会](association-queries.md) を、シリアライズについては [照会の入力](query-inputs.md) を参照してください。

## インターフェースと実装

- [絞り込み](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/filter.md)
- [ページネーション](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/pagination.md)
