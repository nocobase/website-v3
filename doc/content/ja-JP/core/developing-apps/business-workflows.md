---
title: ワークフロー
description: ワークフローの状態、操作、条件を定義し、自動処理、外部からの結果、タイムアウト、復旧を組み込み、進捗と履歴を表示します。
---

ワークフローは、状態機械（ステートマシン）を使って業務レコードの状態、許可する遷移、その発生条件を定義します。複数のリクエストにまたがって長期間進行し、人の操作、自動処理、外部システムが関わる業務プロセスに適しています。たとえば、注文は顧客の支払いを待ち、決済コールバックを受け取ったあと、担当者による出荷の確認を待つことができます。待機中は現在の状態を保存するだけでよく、タスクを動かし続ける必要はありません。`@nocobase/lifecycle` でこれらのルールをコードとして宣言し、アプリ側でストレージ、API、ページを用意します。

例として **Order payment（注文の支払い）** を使います。ユーザーが支払いを開始すると、システムが決済画面を作成し、決済サービスからのコールバックを待ちます。支払い済みの注文は出荷または返金できます。未払いの注文はタイムアウトで閉じ、キャンセル後に入金が通知された場合は返金します。多段階承認、合議、承認者の追加などについては、[承認プラグイン](../using-plugins/collaboration/approval.md) を参照してください。

## 状態と遷移

**状態**はレコードの現在の段階を表します。**遷移**は、支払い開始、キャンセル、出荷などの名前を持つ状態変更です。注文の `status` がワークフローの状態であり、別のプロセスインスタンスの状態は保持しません。遷移履歴には実行者、時刻、状態変更を記録し、自動処理の記録にはコミット後の実行結果を保存します。

`defineLifecycle()` で初期状態、許可する遷移、終了状態を宣言します。以下は `server/lifecycles/order.ts` の抜粋です。パラメーター設定などを省略し、遷移とタイムアウトのルールを `orderTransitions`、`orderTriggers` として表しています。`OrderTypes` はサンプルの型、`orderProblems` は作成時の検証関数です。

```ts
export const orderLifecycle = defineLifecycle<OrderTypes>({
  name: 'orders',
  collection: LIFECYCLE_EXAMPLE_COLLECTIONS.orders,
  initial: 'draft',
  create: { validate: orderProblems },
  states: [
    'draft', 'creatingCheckout', 'awaitingPayment', 'paymentFailed',
    'paid', 'cancelled', 'refunding', 'refundNeedsAttention',
    { name: 'fulfilled', final: true },
    { name: 'refunded', final: true },
  ],
  parameters: { paymentWindowMinutes: 3 },
  transitions: orderTransitions,
  onEnter: { creatingCheckout: [createCheckout], refunding: [refund] },
  triggers: orderTriggers,
});
```

支払いを開始すると、注文は下書きから決済画面の作成を経て、支払い待ちに進みます。決済コールバックで支払い済みになり、その後は出荷または返金できます。`fulfilled`（出荷済み）と `refunded`（返金済み）が終了状態です。`cancelled` は終了状態ではありません。キャンセル後に入金が通知されると、返金に進みます。

レコードの作成には `runtime.create('orders', values, { actor })` を使います。runtime が初期状態と `$create` の履歴を記録します。`actor` はサーバーで検証済みの本人情報から取得し、`values` には許可した業務フィールドだけを含めます。作成後の状態変更は汎用の更新 API ではなく、遷移を通じて行います。

## 操作、条件、分岐

操作は名前を持つ遷移に対応します。`from` と `to` で遷移元と遷移先を制限します。`set` は同じトランザクション内で業務フィールドを更新し、`accept` は許可した入力を保存します。以下の 2 つの定義で、支払いを開始し、決済画面の作成成功を記録します。

```ts
checkout: {
  from: ['draft', 'paymentFailed'],
  to: 'creatingCheckout',
  set: ({ record }) => ({
    paymentAttempt: record.paymentAttempt + 1,
    paymentSessionId: null,
    checkoutUrl: null,
    lastError: null,
  }),
},
checkoutCreated: {
  manual: false,
  from: 'creatingCheckout',
  to: 'awaitingPayment',
  accept: ['paymentSessionId', 'checkoutUrl'],
},
```

**Pay** をクリックすると `checkout` が実行され、支払い回数を増やして前回の決済画面の情報を消去します。自動処理が成功すると、`checkoutCreated` がセッションと URL を保存します。注文作成時には `create.validate` が顧客、注文名、正の金額を検証します。汎用の `guard`、遷移の `validate`、`route` API は、条件判定、入力検証、遷移先の選択に使えます。この例では、決済結果と現在の状態に応じた個別の遷移で分岐を表しています。

決済が拒否されると `paymentFailed` に入り、ユーザーは再び支払いを開始できます。成功すると `paid` に入り、`ship` で出荷するか、`refundOrder` で返金できます。返金に失敗した場合は `refundNeedsAttention` に入り、`retryRefund` で返金を再開します。

`cancel` は `draft`、`awaitingPayment`、`paymentFailed` からのキャンセルを許可し、決済画面を閉じる処理を登録します。決済コールバックや自動処理の結果に対応する遷移には `manual: false` を指定します。ユーザー操作用の API は `manual: true` を渡し、ユーザーが決済成功を直接選べないようにします。ロールやレコードのアクセス範囲は、引き続き API 側で認可します。

## アプリへの組み込みとアクセス制御

注文、遷移履歴、自動処理の実行記録を保存するテーブルを用意します。注文には業務フィールドに加え、状態、待機期限、同時更新の確認に使う `status`、`statusChangedAt`、`lifecycleVersion` を保存します。パッケージがマイグレーションを自動実行することはありません。フィールドとインデックスは使用バージョンの [ストレージ要件][storage] に従ってください。アプリへの組み込みは [データモデルとマイグレーション](data-models-and-migrations.md) を参照してください。

Provider は共有の runtime、ストア、実行器を組み立てます。ワークフローのルールは定義側に置きます。以下の `database` と `executors` は、アプリの `databaseManagerToken` と `jobExecutorServiceToken` から取得します。`flowServices` はサンプルの `FlowServices` を実装し、決済サンドボックスと失敗のシミュレーションを提供します。

```ts
import {
  LifecycleRuntime,
  createRepositoryLifecycleStore,
} from '@nocobase/lifecycle';
import { createLifecycleJobs } from '@nocobase/lifecycle/jobs';

const jobs = createLifecycleJobs({
  jobs: executors.getJobExecutor('app/orders'),
  schedule: executors.getScheduleExecutor('app/orders'),
  jobName: 'app/orders/effect',
  sweepEveryMs: 5_000,
});

const runtime = new LifecycleRuntime({
  store: createRepositoryLifecycleStore(database),
  dispatcher: jobs,
});
runtime.register(orderLifecycle, { services: flowServices });
```

サービス Token を使って runtime をコンテナに登録し、`server/providers/index.ts` に Provider を追加します。`start()` で `jobs.start(runtime)`、`shutdown()` で `jobs.shutdown()` を呼び出します。ルートでも同じ runtime を使います。登録方法は [サーバー側サービス](server-business-services.md)、バックエンドや複数インスタンスの構成は [バックグラウンドジョブと定期実行](background-tasks.md) を参照してください。

遷移は、レコードの変更、履歴、実行待ちの処理を 1 つのトランザクションで保存します。外部への呼び出しはコミット後に実行します。guard が別のテーブルを参照する場合は、現在のトランザクションに紐づく services ファクトリーから接続を取得します。[トランザクションとデータ整合性](transactions-and-consistency.md) を参照してください。

アプリ側で作成、参照、操作用の API を用意します。runtime を呼ぶ前に認証、認可、入力検証を行います。

```ts
const result = await runtime.fire('orders', orderId, body.transition, {
  actor: { id: String(signedInUserId) },
  manual: true,
  input: body.input,
  requestId: body.requestId,
  expect: { version: body.expectVersion },
});

const view = await runtime.view('orders', orderId, {
  id: String(signedInUserId),
});
return c.json({ data: { ...view, replayed: result.replayed === true } });
```

`body` は検証済みの入力で、ユーザー ID は信頼できるセッションから取得します。レコードのアクセス範囲を確認し、参照、遷移、復旧をそれぞれ認可してください。実行記録を操作する前に、その記録が対象の注文に属することも確認します。ストアはリクエストのポリシーを継承しません。[認証、権限、データスコープ](authentication-and-permissions.md) と [リクエスト検証とエラー処理](request-validation-and-errors.md) を参照してください。

通信障害のあとに同じ操作を再送するときは、同じ `requestId` を使います。入力や判断が変わった場合は新しい識別子が必要です。成功済みの操作を再送しても、新たな遷移は発生しません。表示中のバージョンを `expectVersion` として渡すと、古いバージョンでの操作は `CONFLICT` になります。表示を更新して、改めて操作を判断してください。リクエスト識別子は重複操作を防ぎ、バージョンは古い判断が新しい進捗を上書きするのを防ぎます。

## 自動処理、待機、復旧

**effect** は、遷移のコミット後に行う処理です。`creatingCheckout` に入ると決済画面を作成します。成功すると `checkoutCreated` が実行され、支払い待ちに進みます。再試行を使い切ると `checkoutFailed` が実行され、`paymentFailed` に進みます。

```ts
import { defineEffect } from '@nocobase/lifecycle';

const createCheckout = defineEffect<OrderTypes>({
  name: 'orders.createCheckout',
  retry: { attempts: 3, backoffMs: 2_000, factor: 2, maxMs: 10_000 },
  timeoutMs: 10_000,
  onSuccess: 'checkoutCreated',
  onFailure: 'checkoutFailed',
  async run({ record, services }) {
    if (services.shouldFail(`order-checkout:${record.id}`, record.failCheckouts)) {
      throw new Error('The payment provider is unavailable (simulated).');
    }
    const session = await services.sandbox.createCheckout({
      idempotencyKey: `order-checkout:${record.id}:${record.paymentAttempt}`,
      orderId: String(record.id),
      amountCents: record.amountCents,
    });
    return { paymentSessionId: session.sessionId, checkoutUrl: session.url };
  },
});
```

`services.sandbox.createCheckout` はサンプルの決済サンドボックス API で、実際の決済サービスは呼び出しません。`failCheckouts` で意図的に失敗させる回数を指定します。同じ支払い操作に対する再試行では、同じ冪等キーを使います。ユーザーが改めて支払いを開始すると `paymentAttempt` が増え、新しいセッションを作成します。`attempts: 3` には最初の試行も含まれます。

**外部からの結果を待つ**間は、状態を保存するだけでよく、ジョブを動かし続ける必要はありません。決済画面の作成成功は支払い完了を意味せず、決済サービスのコールバックで入金を確認します。以下は、受信側でコールバックを検証したあと、未キャンセルの注文を進める呼び出しです。

```ts
import { SYSTEM_ACTOR } from '@nocobase/lifecycle';

// After verifying the payment callback, for an order still awaiting payment.
await runtime.fire('orders', orderId, 'paymentSucceeded', {
  actor: SYSTEM_ACTOR,
  input: { paymentRef },
  requestId: `payments:${eventId}`,
});
```

`SYSTEM_ACTOR` は送信元を検証しません。受信側で先に署名とイベント形式を検証します。再配信には同じイベント識別子を使います。`paymentSucceeded` は `creatingCheckout` と `awaitingPayment` の両方を受け付けるため、決済画面の作成結果が記録される前に入金通知が届いても処理できます。キャンセル済みの注文では、受信側が `paidAfterCancel` を使って返金を開始します。データベースエラーや競合が起きた場合は、再配信が必要です。

**待機のタイムアウト**には trigger を使います。サンプルの既定値は 3 分です。以下の `orderTriggers` の定義では、注文が `awaitingPayment` または `paymentFailed` に指定時間とどまると `expire` を実行し、`cancelled` に進めます。

```ts
expireUnpaid: {
  transition: 'expire',
  when: ['awaitingPayment', 'paymentFailed'],
  after: ({ paymentWindowMinutes }) => paymentWindowMinutes * 60_000,
},
```

定期確認の間隔は待機時間より短く設定します。期限を過ぎたレコードは確認時に検出されます。`expire` はタイムアウトの理由を記録し、決済画面を閉じる処理を登録します。支払いが完了していてコールバックだけが遅れて届いた場合は、`paidAfterCancel` が返金を開始します。

**復旧方法**は、外部の処理がすでに完了しているかどうかで変わります。

| 状況 | 対処 |
| --- | --- |
| 決済画面の作成で一時的なエラーが発生 | 同じ支払い操作の冪等キーを使い、設定した方針に従って再試行する |
| 決済画面の作成の再試行を使い切った | `paymentFailed` に進む。ユーザーは Pay を再度クリックできる |
| 返金の再試行を使い切った | `refundNeedsAttention` に進む。Retry refund で新たな実行を開始し、注文と決済参照番号で重複を防ぐ |
| 再試行可能なその他の実行 | 認可したうえで `runtime.retryRun(runId)` を呼ぶ。`RUN_SETTLED` のあとに一律で強制再試行しない |
| 外部処理は成功したが、次の遷移が阻まれている | 原因を取り除き、`runtime.continueRun(runId)` で保存済みの結果を適用する。外部リクエストは再送しない |
| アプリの再起動や実行の中断 | Jobs アダプターと定期確認が再開可能な処理を再開する |

永続ストレージには実行待ちの処理と記録済みの結果が残ります。復旧時に外部呼び出しを繰り返す可能性があるため、冪等性は引き続き必要です。新しいプロセスが既存の処理を識別できるよう、lifecycle、effect、ジョブの名前を安定させてください。実行エラーをログに記録し、保持方針に従って削除可能な記録を整理します。

## 進捗と処理履歴

アプリの shadcn コンポーネントを再利用します。`runtime.view()` を使う API は、レコード、バージョン、操作候補、履歴を返します。クライアントでは次のように接続します。

```ts
import { useApiClient } from '@nocobase/app-client';
import { createLifecycleHook } from '@nocobase/lifecycle/react';

export const useOrderLifecycle = createLifecycleHook({
  useTransport: useApiClient,
  basePath: 'lifecycleExample',
});

// Inside the order detail component:
const { view, busy, fire } = useOrderLifecycle('orders', orderId);
```

この設定では、アプリの API プレフィックスの下に `GET /lifecycleExample/orders/lifecycle`、`GET /lifecycleExample/orders/:id`、`POST /lifecycleExample/orders/:id/fire` を用意し、結果を `{ data }` で包んで返します。Hook が API を生成するわけではありません。

サーバーはユーザーの権限に応じて `view.available` を絞り込むか、操作可否を付けます。ページでは `allowed` と `blockers` をボタンと理由の表示に、`busy` を送信中の表示に使います。**Pay** は `fire('checkout')`、**Retry refund** は `fire('retryRefund')` を呼び出します。フィールドのエラーは入力欄の近くに表示し、バージョン競合時には更新を促します。実際の操作は API 側でも認可してください。

現在の段階、遷移のタイムライン、自動処理の結果を分けて表示します。試行回数、エラー、続行待ちの処理も確認できるようにします。Hook は既定でポーリングし、外部からの結果を取得します。システム設定の **Workflow management** では定義と実行をまとめて確認し、再試行や続行の操作を制限できます。

テンプレートまたは UI Library の `LifecycleDiagram` に、定義、現在の状態、実際の履歴を渡して表示できます。この図は確認用であり、ワークフローを視覚的に設計する機能ではありません。図をクリックして操作 API を通さずにレコードを進めることもできません。

![注文の支払いワークフロー](https://static-docs.nocobase.com/20261108090920.png)

## サンプルと確認方法

サンプルプロジェクトで **Order payment** を開きます。注文を作成して **Pay** をクリックし、**Payment provider (sandbox)** で支払いまたは拒否をシミュレーションします。**Demo options** では、決済画面の作成や返金を意図的に失敗させる回数を指定できます。**Hold the webhook** は配信を保留し、**Deliver** はイベントを配信、**Deliver again** は再配信します。

| 操作 | 期待する結果 |
| --- | --- |
| 支払いを開始し、サンドボックスで支払ったあと Ship をクリックする | Awaiting payment → Paid → Shipped |
| 決済画面の作成の失敗回数を 2 に設定し、支払いを開始する | 3 回目で成功し、支払い待ちになる |
| 未払いのまま期限を過ぎるまで待つ | 注文が閉じ、Cancelled になる |
| 決済コールバックを保留し、注文をキャンセルしてから配信する | Cancelled → Refunding → Refunded |
| 返金の失敗回数を 3 に設定し、支払ったあと返金を要求する | Refund needs attention になり、Retry refund で完了できる |
| 同じ決済コールバックを再配信する | Replayed と表示され、注文は重複して遷移しない |

支払い、返金、コールバックにはサンプルのサンドボックスを使い、実際の資金は動きません。認可、同時更新、トランザクションのロールバック、再起動後の復旧は、アプリの統合テストで確認してください。[テスト](testing-and-acceptance.md) を参照してください。

実装の参照先：[注文の定義と effects][order-source]、[コールバックの受信処理][webhook-source]、[復旧テスト][recovery-tests]。

[storage]: https://github.com/nocobase/nocobase/blob/0c485af61f71f9687f727ebcb34e2a9c5cf593f1/packages/libs/lifecycle/docs/design.md#storage
[order-source]: https://github.com/nocobase/nocobase/tree/0c485af61f71f9687f727ebcb34e2a9c5cf593f1/packages/examples/app-plugin-lifecycle-example/server/lifecycles
[webhook-source]: https://github.com/nocobase/nocobase/blob/0c485af61f71f9687f727ebcb34e2a9c5cf593f1/packages/examples/app-plugin-lifecycle-example/server/webhooks/receiver.ts
[recovery-tests]: https://github.com/nocobase/nocobase/blob/0c485af61f71f9687f727ebcb34e2a9c5cf593f1/packages/libs/lifecycle/tests/pending-continuation.test.ts
