---
title: リクエストの検証とレスポンス
---

業務ロジックの前に外部からの入力を検証し、結果は固定のレスポンスで報告します。TypeScript が制約するのは開発時のコードで、実行時の入力ではありません。

## 入力の検証

```ts
import { Hono } from 'hono';
import { z } from 'zod';
import { apiValidator, defineApiRoutes } from '@nocobase/app-server/router';

const input = z.object({ title: z.string().trim().min(1).max(120) });
export default defineApiRoutes(() => {
  const router = new Hono();
  router.post('/example/normalize', apiValidator('json', input), (context) => {
    const value = context.req.valid('json');
    return context.json({ data: { title: value.title } });
  });
  return router;
});
```

この例はテキストを正規化するだけで、保存はしません。`apiValidator()` は Standard Schema に対応したバリデーターを受け付け、`context.req.valid()` は検証済みの入力を返します。ルートのパラメーター、クエリー文字列、フォームには、それぞれ適切な対象を使います。

範囲、長さ、許可するフィールド、業務上の状態の制約を定義します。構文が正しくても、身元、権限、整合性は確定しません。呼び出し側が指定した ownerId は現在のユーザーではありません。

## 成功とエラー

独自の API では、ページネーションの意味をドキュメントに記載したうえで、一貫して `{ data, meta }` を返せます。`ApiClient.request()` は `data` を取り出さず、ボディ全体を保ちます。

```ts
import { ApiError } from '@nocobase/app-server/router';

throw new ApiError({
  status: 'NOT_FOUND',
  reason: 'ORDER_NOT_FOUND',
  domain: 'orders',
  message: 'The requested order was not found.',
});
```

フレームワークは `ApiError` を、`error` を含む標準のレスポンスに変換します。`status` が HTTP の分類を決め、`domain` と `reason` が固定の機械向けの識別子になります。開発者向けの `message` で分岐しないでください。翻訳されたユーザー向けのテキストを用意し、必要に応じて `fieldViolations` でフィールドの問題を報告します。

## ストリームと中断

ストリーミングが始まると、レスポンスを通常の JSON のエラーに変えることはできません。ストリームの完了とエラーの意味を定め、キャンセル時にはリソースを解放します。タイムアウトのレスポンスも、コミット済みのデータベースの作業や外部へのリクエストを元に戻しません。

有効な入力、空の値、長さの境界、間違った型、権限のないアクセス、存在しないレコードをテストします。業務の完全な例は [リクエストの検証とエラー処理](../../developing-apps/request-validation-and-errors.md) を参照してください。

## インターフェースと実装

- [API エラーの取り決め](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/api-error.ts)
- [検証と OpenAPI](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/router/openapi/index.ts)
