---
title: 照会の入力とビルダー
---

`@nocobase/repository-input` は、クライアントとサーバーのための移植可能な照会の取り決めを提供します。ビルダーはコードの式をシリアライズ可能なデータに変換し、実行と認可は引き続きサーバーの責任です。

## 入力を組み立てる

```ts
import { buildFilter, buildSelect, buildSort } from '@nocobase/repository-input';

export const orderQuery = {
  filter: buildFilter((f) => f.string('status').eq('paid')),
  select: buildSelect((s) => s.fields('id', 'orderNo', 'amount')),
  sort: buildSort((s) => s.field('id').asc()),
};
const json = JSON.stringify(orderQuery);
```

`buildFilter`、`buildSelect`、`buildSort`、`buildAggregate` は AST または同期のコールバックを受け取り、切り離された JSON のスナップショットを返します。Filter はスカラー値の等価の省略形も受け付けます。入力を組み立てても、データベースに接続したり、フィールドへのアクセスを付与したりはしません。

## 入力の形式

| 形式 | 用途 |
| --- | --- |
| 等価の省略形 | 単純なスカラー値の条件 |
| ビルダーのコールバック | 読みやすいプログラムでの組み立て |
| JSON AST | 保存、送信、動的な組み立て |

JSON で送信する前に、コールバックを具体化します。非同期のコールバック、循環、無効な数値、サポートされない位置の関数は失敗します。日付は ISO 文字列に、bigint は 10 進数の文字列になります。ネイティブの bigint は、Filter の JSON のリテラルとしては引き続き無効です。

## 変数と変更

`context` は照会の変数を提供するもので、トランザクションのハンドルや権限ではありません。どの変数を信頼できる身元から導き、どの変数を検証済みのユーザーの入力から取るかは、サーバーが決めます。

`buildCreateValues` と `buildUpdateValues` は、変更の入力を具体化します。API Client の `build*Options` ヘルパーは、完全なリモートのリクエストを生成します。フレームワーク内部の `internal/*` の入口は避けてください。

## サーバーでの検証

保存された照会は、コレクション、フィールドの型、リレーションの深さ、上限、ポリシーに照らして検証します。公式のビルダーが任意のアクセスを認可するわけではありません。BIGINT や DECIMAL のフィールドで必要な場合は、文字列で正確な数値を保ちます。

テストでは、ビルダーと AST の実行結果を比較します。JSON の形だけでは、データベースでの意味は確認できません。[API Client](../http/api-client.md) と [絞り込みとページネーション](filtering-pagination.md) を参照してください。

## インターフェースと実装

- [移植可能な入力のビルダー](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/repository-input/README.md)
- [Repository の入力の取り決め](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/signatures/inputs.md)
