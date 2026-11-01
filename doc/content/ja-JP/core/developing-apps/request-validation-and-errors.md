---
title: リクエストの検証とエラー処理
description: リクエストの入力を検証し、フィールドのエラー、業務上の失敗、予期しない例外を区別し、注文 API でレスポンスと保存されたデータを検証します。
---

注文 API の例は、注文の一覧、作成、編集に対応しています。リクエストは検証されてから、業務サービスが顧客を利用できるか、注文を編集できるかを確認します。失敗には標準のエラーのボディを使い、クライアントがフィールドを特定したり、業務上の制限を説明したりできるようにします。[サンプルのソースと実行](#サンプルのソースと実行) の手順は最後にあります。

この例では `@nocobase/app-server` `3.0.0-beta.4` と Zod `4.6.5` を使います。コマンドラインのスクリプトが実際の HTTP リクエストを送り、管理ページは必要ありません。以下の `pnpm request` コマンドは、デモ用のアカウントでサインインするサンプル付属のヘルパーです。実行する前に、インストールとセットアップを済ませてください。

## ルートにリクエストの検証を追加する

`@nocobase/app-server/router` から `apiValidator()` をインポートし、スキーマをハンドラーの前に置きます。ハンドラーでは、対応する `c.req.valid('query' | 'param' | 'json')` の値を読み取ります。この値には、変換、既定値、検証がすでに適用されています。

この抜粋は、`server/routes/orders.ts` の `defineApiRoutes()` ファクトリーの中に置くものです。ルーターには、すでに認証と認可コンテキストのミドルウェアがインストールされています。`requireOrderAction()` はこの例の操作の権限チェックで、`service` はアプリのコンテナから取得し、スキーマは同じディレクトリの `schemas.ts` からインポートします。

```ts
import {
  apiValidator,
  apiErrorResponse,
  apiErrorResponses,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';

router.post(
  '/orders',
  requireOrderAction('create'),
  describeRoute({
    tags: ['Orders'],
    summary: 'Create an order',
    operationId: 'ordersCreateOrder',
    responses: {
      '201': dataResponse(Order),
      '400': apiErrorResponse(400, 'The customer is unavailable (CUSTOMER_UNAVAILABLE).'),
      ...apiErrorResponses,
    },
  }),
  apiValidator('json', CreateOrderInput),
  async (c) => c.json({
    data: await service.create(c.get('orderPolicies'), c.req.valid('json')),
  }, 201),
);
```

認証と操作の認可は入力の検証より前に行われ、すべてのチェックは書き込みの前に実行されます。`apiValidator()` はログイン、権限、データベース上の存在を確認しません。これらの仕組みはそれぞれ役割が異なります。権限の設定については [認証、権限、データ範囲](authentication-and-permissions.md) を参照してください。

アプリのランタイムが読み込めるよう、ルートの宣言を `server/routes/index.ts` に登録します。

```ts
import orders from './orders.js';
export default [orders];
```

アプリに追加するときは、既存のルートの宣言を残してください。`/orders` は `/api` やデプロイの接頭辞を付けずに宣言します。登録の詳細は [ルートと HTTP API](apis-and-services.md) を参照してください。

```sh
pnpm request POST orders '{"customerId":"11111111-1111-4111-8111-111111111111","reference":"  SO-2000  ","items":[{"name":"Keyboard","quantity":2}]}'
```

作成すると、HTTP `201` で `{ data }` が返ります。`data.reference` は `SO-2000` にトリムされ、`data.id` はサーバーが生成します。以降の編集のために、その ID を控えておきます。同じリクエストを繰り返すと、別の注文が作成されます。

出典：[ルートと権限のミドルウェア](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/routes/orders.ts)、[登録](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/routes/index.ts)。

## 入力のルールを定義する

### クエリーの変換と既定値

クエリーのパラメーターは文字列として届きます。`z.coerce.number()` で変換してから、整数の範囲を制限します。パラメーターがない場合は既定値が適用されます。

```ts
import { z } from 'zod';

export const ListOrdersQuery = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
```

一覧のルートは `apiValidator('query', ListOrdersQuery)` を使います。そのサービスは、数値の `page` と `pageSize` を持つ `c.req.valid('query')` を受け取ります。

```sh
pnpm request GET 'orders?page=1&pageSize=1'
pnpm request GET 'orders?page=0'
```

1 つ目は、`meta.page: 1`、`meta.pageSize: 1`、`meta.total` とともに 1 件の注文を返します。2 つ目は、`page` フィールドについて `400 INVALID_INPUT` を返します。ページネーションを省略すると、1 ページ目を 1 ページあたり 20 件で返します。

### パスのパラメーターの形式

```ts
export const OrderParams = z.object({ id: z.uuid() });
```

詳細と更新のルートは `apiValidator('param', OrderParams)` を使い、`c.req.valid('param').id` を読み取ります。

```sh
pnpm request GET orders/not-a-uuid
pnpm request GET orders/99999999-9999-4999-8999-999999999999
```

1 つ目は形式の検証で失敗し、`400 INVALID_INPUT` を返します。2 つ目は有効な UUID ですが、この例の注文を指していないため、`404 ORDER_NOT_FOUND` を返します。UUID はこの例の注文と顧客の取り決めで、アプリのユーザーなどほかの識別子の要件ではありません。

### ボディの必須、null 許容、余分なフィールド

書き込み可能な JSON のフィールドは `z.strictObject()` で指定します。フォームのオブジェクト全体を送信しても、クライアントが `id` や `status` などのサーバーが管理するフィールドを変更できてはいけません。クエリーとパスのスキーマは `z.object()` を使います。この例では、それらに余分なパラメーターを拒否させる必要はありません。

```ts
const OrderItemInput = z.strictObject({
  name: z.string().trim().min(1).max(120),
  quantity: z.number().int().min(1).max(1000),
});
export const CreateOrderInput = z.strictObject({
  customerId: z.uuid(),
  reference: z.string().trim().min(1).max(120),
  items: z.array(OrderItemInput).min(1).max(20),
  note: z.string().trim().max(500).nullable().optional(),
});
export const UpdateOrderInput = CreateOrderInput.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'Provide at least one field to update.' },
);
```

作成では `customerId`、`reference`、`items` が必須です。更新では変更するフィールドだけを受け付けますが、空のオブジェクトは拒否します。JSON の `quantity` は文字列の `"2"` ではなく数値である必要があります。品目名と注文の参照番号はトリムされるため、空白だけの値は無効です。

更新では、`note` を省略すると保たれ、`note: null` でクリアされ、空文字列は空文字列として保存されます。`optional()` は省略を、`nullable()` は明示的な `null` を許可します。

```sh
pnpm request PATCH orders/22222222-2222-4222-8222-222222222222 '{"reference":"SO-1001-A"}'
pnpm request PATCH orders/22222222-2222-4222-8222-222222222222 '{"note":null}'
pnpm request PATCH orders/22222222-2222-4222-8222-222222222222 '{"status":"confirmed"}'
```

最初の 2 つは成功し、メモを保ってからクリアします。3 つ目は禁止されたフィールドを含んでいるため、注文のステータスを変えずに `400 INVALID_INPUT` を返します。ヘルパーは `Content-Type: application/json` を送ります。別の HTTP ツールを使う場合は、正しく設定してください。

これらのルールの出典：[入力とレスポンスのスキーマ](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/routes/schemas.ts)。

## 検証の失敗を認識する

### 標準のエラーとフィールドのパス

数量 `0` の注文品目を送信します。

```sh
pnpm request PATCH orders/22222222-2222-4222-8222-222222222222 '{"items":[{"name":"Keyboard","quantity":0}]}'
```

開発者向けの説明とリクエストの ID を省き、関係するレスポンスのフィールドを示します。

```json
{
  "error": {
    "code": 400,
    "status": "INVALID_ARGUMENT",
    "reason": "INVALID_INPUT",
    "domain": "app",
    "fieldViolations": [
      { "field": "items.0.quantity", "reason": "too_small" }
    ]
  }
}
```

`code` は数値の HTTP ステータス、`status` は標準のエラーの分類、`reason` は失敗を識別するもの、`domain` はその理由を定義するものを示します。フィールドの違反にはそれぞれ `description` も含まれます。任意のフィールドレベルの `reason` は、Zod の `too_small` のようにバリデーターから来ます。

フィールドのパスはドットを使い、配列のインデックスも含みます：`items.0.quantity`。余分なフィールドや空の更新のオブジェクトでは、`field` が空文字列のオブジェクトレベルの問題が生じることがあります。それはフォーム全体へのフィードバックとして表示してください。すべての問題が個々の入力欄に属するわけではありません。

### JSON の解析の失敗

不正な JSON は、スキーマの検証の前に失敗します。たとえば `pnpm demo` は、作成のエンドポイントに生のボディ `{` を送ります。固定したバージョンでは、`400`、`status: INVALID_ARGUMENT`、`reason: HTTP_400` を受け取ります。

すべての 400 を `INVALID_INPUT` として扱ったり、すべての失敗に `fieldViolations` が含まれると考えたりしないでください。通常のリクエストのヘルパーは `JSON.stringify()` を使います。デモのスクリプトは、不正なリクエストを別に組み立てています。

出典：[HTTP の手順](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/scripts/demo.ts)、[検証と解析のテスト](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/tests/orders.test.ts)。

## 業務エラーと予期しない例外を処理する

### 存在しないリソースと無効な参照

UUID が有効でも、存在することにはなりません。リクエストの URL で指定した注文が存在しない場合は `404 NOT_FOUND` を返します。ボディで参照した顧客が利用できない場合は、`customerId` の違反とともに `400 INVALID_ARGUMENT` を返します。

`toOrderApiError()` のこの分岐が、顧客のエラーを変換します。

```ts
if (error instanceof CustomerUnavailableError) {
  return new ApiError({
    status: 'INVALID_ARGUMENT',
    reason: 'CUSTOMER_UNAVAILABLE',
    domain: 'orders',
    message: error.message,
    fieldViolations: [{
      field: 'customerId',
      reason: 'CUSTOMER_UNAVAILABLE',
      description: 'Choose an available customer.',
    }],
    cause: error,
  });
}
```

```sh
pnpm request PATCH orders/22222222-2222-4222-8222-222222222222 '{"customerId":"99999999-9999-4999-8999-999999999999","note":"Must not be saved"}'
```

このリクエストは `400 CUSTOMER_UNAVAILABLE` を返し、元の顧客とメモの両方が保たれます。サービスは、注文を書き込む前に、この操作の Repository のポリシーで顧客を照会します。操作の権限が拒否された場合は、形式の検証や存在の確認より前に 403 を返します。すべての権限の拒否を「見つからない」に変換しないでください。

### 業務上の状態によって禁止される操作

確定済みの注文は編集できません。これは満たされていない業務上の前提条件で、HTTP 400 に対応する `FAILED_PRECONDITION` で表します。

```ts
if (error instanceof OrderLockedError) {
  return new ApiError({
    status: 'FAILED_PRECONDITION',
    reason: 'ORDER_LOCKED',
    domain: 'orders',
    message: error.message,
    cause: error,
  });
}
```

```sh
pnpm request PATCH orders/33333333-3333-4333-8333-333333333333 '{"note":null}'
```

レスポンスは `400 ORDER_LOCKED` で、確定済みの注文のメモは変わりません。並行したバージョンの競合には `ABORTED`（409）を、重複した作成には `ALREADY_EXISTS`（409）を使います。すべての業務上の制限を 409 の競合に分類しないでください。この例では確定済みの注文をシードで用意しており、確定のエンドポイントは提供していません。

### Repository のエラー処理を再利用する

フレームワークは、認識できる Repository のエラーをすでに対応付けています。そのまま伝播させてください。`WRITE_FORBIDDEN` は 403、`RECORD_NOT_FOUND` は 404、`VERSION_CONFLICT` は 409 を返します。Repository のコードが `reason` になり、ドメインは `app` です。

ドメインのエラーの変換が不要な独立したルーターでは、次をインストールできます。

```ts
import { Hono } from 'hono';
import { apiErrorHandler } from '@nocobase/app-server/router';

const router = new Hono();
router.onError(apiErrorHandler);
```

サンプルのテストでは、更新を禁止するポリシーを実際の Repository に渡します。注文のルートは `403 WRITE_FORBIDDEN` を返し、レコードは変わりません。別の素の Hono のテストでは、存在しないレコードを更新して `404 RECORD_NOT_FOUND` を受け取ります。これらのシナリオは次で実行します。

```sh
pnpm test -t 'Repository errors'
```

### 独自の業務上の例外を変換する

サービスは `OrderMissingError`、`CustomerUnavailableError`、`OrderLockedError` を投げます。ルートがそれらを HTTP エラーに変換するため、サービスには Hono のコンテキストが必要ありません。

```ts
router.onError((error, c) => apiErrorHandler(toOrderApiError(error), c));
```

`toOrderApiError()` はこの 3 つの例外だけを扱い、認識できないエラーはそのまま返します。`apiErrorHandler()` は既知のエラーをレンダリングし、未知の例外は外側のアプリに投げ直します。そのあと完全なアプリが、スタックや内部の原因を公開せずに `500 INTERNAL / INTERNAL_ERROR` を返します。すべての例外を 400 で包んだり、失敗をステータス 200 で返したりしないでください。

素の Hono でテストしたルーターには、アプリの 500 のフォールバックがありません。この例では、完全なアプリで更新の失敗を注入して確認しています。`pnpm test -t 'unexpected failures'` を実行してください。通常のサーバーには、わざとクラッシュさせるエンドポイントはありません。

出典：[業務サービス](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/orders/service.ts)、[ドメインのエラーの変換](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/routes/errors.ts)、[Repository と予期しないエラーのテスト](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/tests/orders.test.ts)。

## 成功とエラーのレスポンスを宣言する

`describeRoute()` の `responses` は API ドキュメントを記述します。一覧には `listResponse(Order, OrderListMeta)` を、個々の結果には `dataResponse(Order)` を使います。たとえば、更新のルートは次のように宣言します。

```ts
responses: {
  '200': dataResponse(Order),
  '400': apiErrorResponse(
    400,
    'The customer is unavailable (CUSTOMER_UNAVAILABLE), or the order is confirmed (ORDER_LOCKED).',
  ),
  '404': apiErrorResponse(404),
  ...apiErrorResponses,
}
```

`apiValidator()` を使うルートには、無効な入力に対する 400 の宣言が自動で付きます。上の明示的な 400 は、業務上の失敗の説明を加えるものです。`apiErrorResponses` には 401、403、500 だけが含まれ、認証と権限の両方を確認するルート向けです。公開のエンドポイントでは、実際の動作に合ったエラーを宣言してください。

`pnpm request GET swagger` を実行すると、`ordersListOrders`、`ordersCreateOrder`、`ordersUpdateOrder` などの操作が見つかります。一覧にはページネーションのパラメーターと、生成された検証エラーの宣言があります。更新の操作では、利用できない顧客と確定済みの注文も記述しています。

これらのヘルパーは、実際の HTTP ステータスを設定したり、実行時の出力を検証したり、機密のフィールドを取り除いたりはしません。ハンドラーは引き続き正しいステータスを返します。サービスの `toOrderView()` は公開するフィールドを明示的に選び、一覧の行と件数は同じ権限のポリシーを使います。レスポンスのスキーマに `z.ZodType<OrderView>` と注釈を付けると、サービスのビューの型とそろいますが、型チェックは実行時の検証の代わりにはなりません。

出典：[ルートのレスポンスの宣言](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/routes/orders.ts)、[レスポンスのスキーマ](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/server/routes/schemas.ts)。

## エラーの詳細を読み取り、リクエストを特定する

`ApiClientError.status` は数値の HTTP ステータスです。`reason`、`domain`、`requestId` は直接読み取ります。フィールドのエラーは `payload.error.fieldViolations` に残っています。読み取る前にその構造を検証してください。手順のエラーの要約では次を使います。

```ts
import { ApiClientError } from '@nocobase/api-client';
import { z } from 'zod';

const ErrorDetails = z.object({
  error: z.object({
    fieldViolations: z.array(z.object({
      field: z.string(),
      description: z.string(),
      reason: z.string().optional(),
    })).optional(),
  }),
});

export function errorSummary(error: unknown) {
  if (!(error instanceof ApiClientError)) throw error;
  const details = ErrorDetails.safeParse(error.payload);
  return {
    status: error.status,
    reason: error.reason,
    domain: error.domain,
    requestId: error.requestId,
    fields: details.success
      ? (details.data.error.fieldViolations ?? []).map(({ field, reason }) => ({ field, reason }))
      : [],
  };
}
```

`pnpm demo` を実行します。無効な数量では、`status: 400`、`reason: INVALID_INPUT`、`fields` の中の `items.0.quantity` が表示されます。ネットワークの例外にはサーバーのエラーレスポンスがないため、無理に `ApiClientError` として扱わないでください。このヘルパーは、それ以外の失敗を投げ直します。

`domain` と `reason` を、ローカライズした画面の文言に対応付けます。開発者向けの `message` やフィールドの `description` の文字列を解析したり、そのまま表示したりしないでください。フォームのフィードバックとリクエストの状態については、[データのリクエストと状態管理](data-requests-and-state.md) を参照してください。

問題を調査するときは `requestId` を控えておき、サーバーのリクエストログと照らし合わせます。完全なアプリは、同じ ID を `x-request-id` ヘッダーとエラーのボディで返し、API Client はヘッダーを優先します。この例では、`storage/logs/` 以下でリクエストログを有効にしています。

出典：[エラーの要約](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/scripts/client-errors.ts)、[クライアントのリクエスト](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/scripts/demo.ts)。

## 失敗後のデータの動作を検証する

```sh
pnpm demo
pnpm test
```

HTTP の手順では、有効なリクエスト、範囲外のページネーション、無効な ID、ネストしたフィールドのエラー、余分なフィールド、利用できない顧客、存在しない注文、確定済みの注文の編集の試みを確認します。拒否のあとには注文を読み直します。統合テストでは、失敗の前後でデータベースのレコードを比較し、さらに次のことも確認します。

- 未認証のリクエストは 401 を返す。閲覧者は、無効なフィールドや存在しない ID でも 403 を受け取る。
- 空の更新、空白だけの値、長すぎる値、JSON の型の誤りでは、注文の作成も更新も行われない。
- 省略したメモは保たれ、明示的な null は保存される。
- Repository のエラーは標準の分類を保ち、予期しない例外は詳細を隠した 500 を返す。
- OpenAPI の入力とエラーの宣言が、エンドポイントの動作と一致する。

HTTP のエラーレスポンスは、すでにコミットされた作業を元に戻しません。この例では、書き込みの前に入力と業務ルールを検証し、書き込みをデータベースのトランザクションで囲んでいます。複数の書き込みを伴う操作にも、正しいトランザクションの境界が必要です。[トランザクション](../framework/database/transactions.md) を参照してください。

テストは分離したデータベースを使い、手順のデータはリセットしません。Repository の拒否と予期しない例外には、テスト専用に注入した条件を使います。その範囲については [サンプルのテスト](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/tests/orders.test.ts) を参照してください。

## サンプルのソースと実行

ソース：[request-validation](https://github.com/nocobase/docs-examples-v3/tree/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation)。Node.js 24 と pnpm 11.7.0 を使い、ロックファイルで依存関係を固定しています。これは独立したサーバーアプリで、ほかの章の過去のプロジェクトは必要ありません。

```sh
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 12e46abf29509039d988bab437de0aad8931f93e
cd apps/request-validation
pnpm install --frozen-lockfile
pnpm setup
pnpm start
```

セットアップでは、ローカルの設定、アカウント、デモデータが生成されます。同じアプリのディレクトリで別のターミナルを開き、`pnpm demo` または前述の `pnpm request` コマンドを実行します。ヘルパーは `storage/demo.json` からアカウントを読み取るので、パスワードをコピーする必要はありません。閲覧者を選ぶには `DEMO_ROLE=reader pnpm request ...` を使います。

サーバーはポート 13220 で、`/main/api` の接頭辞で待ち受けます。別のホストのアドレスを使う場合は、セットアップ、起動、リクエストのコマンドで同じ `APP_PUBLIC_ORIGIN` を設定します。SQLite はこの例の設定で、検証とエラー処理は SQLite に依存しません。ほかのデータベースは、この例では検証していません。

設定、フィクスチャー、チェック、検証の範囲については [README](https://github.com/nocobase/docs-examples-v3/blob/12e46abf29509039d988bab437de0aad8931f93e/apps/request-validation/README.md) を参照してください。
