---
title: 集計と統計
---

集計は、件数、合計、平均、最大値・最小値をデータベースで計算します。統計からも情報が漏れることがあるため、詳細のレコードと同じアクセスの範囲を適用します。

## 全体の集計とグループ化した集計

```ts
const totals = await db.repository('orders').aggregate({
  filter: { status: 'paid' },
  aggregate: (a) => ({ count: a.count(), total: a.sum('amount') }),
});

const byStatus = await db.repository('orders').groupBy({
  by: ['status'],
  aggregate: (a) => ({ count: a.count(), total: a.sum('amount') }),
  having: (f) => f.number('count').gte(2),
  sort: (s) => s.field('status').asc(),
});
```

`aggregate()` は、レコードの包みなしで、エイリアスと値のオブジェクトを返します。`groupBy()` は、グループ化したフィールドとエイリアスを返します。まず元のレコードを絞り込み、グループ化してから、グループ化した結果に having を適用します。

## 数値と空の集合

| 操作 | 意味 |
| --- | --- |
| `count()` | 行の数。空の集合では数値の 0 |
| `count(field)` | SQL の NULL を無視する |
| `sum()` / `avg()` | 整数や DECIMAL のフィールドでは精度を保つ文字列。浮動小数点では数値 |
| `min()` / `max()` | フィールドの論理的な結果の型を保つ |
| 空の集合での sum/avg/min/max | `null` |

金額や大きな整数を一律に `Number()` で変換しないでください。表示の書式と計算を分け、丸めをどこで行うかを決めてください。

## グループ化の制約

`by` は空でなく一意である必要があり、集計のエイリアスがグループ化したフィールドと同じ名前になってはいけません。having と並べ替えは、グループのフィールドかエイリアスに対して行い、グループ化していない任意のフィールドには使えません。

Repository の groupBy には、現在 select、limit、offset、カーソルがありません。複雑なレポートでは、認可を保ったまま、Query や専用の集計テーブルを検討してください。

## 関連の統計とテスト

対多の Select の分岐は、count、sum、combine に対応しています。レコードのページと合計の分岐では別々のローカルのオプションを使えるため、数える範囲を明示的に定めてください。

空の集合、NULL、正確な小数、ステータスのグループ、アクセスできないレコードをテストします。[関連の照会](association-queries.md) と [照会の入力](query-inputs.md) を参照してください。

## インターフェースと実装

- [Aggregate](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/methods/aggregate.md)
- [GroupBy](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/zh-CN/repository/methods/group-by.md)
