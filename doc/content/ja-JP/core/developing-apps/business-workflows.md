---
title: ワークフロー
description: ワークフローの状態、操作、条件、バージョンを定義し、自動処理、外部からの結果、タイムアウト、復旧、管理者による進行中プロセスの操作を組み込み、進捗と履歴を表示します。
---

ワークフローは、状態機械（ステートマシン）を使って業務レコードの状態、許可する遷移、その発生条件を定義します。複数のリクエストにまたがって長期間進行し、人の操作、自動処理、外部システムが関わる業務プロセスに適しています。たとえば、注文は顧客の支払いを待ち、決済コールバックを受け取ったあと、担当者による出荷の確認を待つことができます。待機中は現在の状態を保存するだけでよく、タスクを動かし続ける必要はありません。`@nocobase/lifecycle` でこれらのルールをコードとして宣言し、アプリ側でストレージ、API、ページを用意します。

以下では、サンプルプロジェクトの **Order payment（注文の支払い）** を軸に基本的な組み込みを説明し、**Expense approval（経費精算）** と **Help desk（ヘルプデスク）** を例に複数バージョンの管理と管理者による進行中プロセスの操作を紹介します。多段階承認、合議、承認者の追加などについては、[承認プラグイン](../using-plugins/collaboration/approval.md) を参照してください。

## 状態と遷移

**状態**はレコードの現在の段階を表します。**遷移**は、支払い開始、キャンセル、出荷などの名前を持つ状態変更です。注文の `status` がワークフローの状態であり、別のプロセスインスタンスの状態は保持しません。遷移履歴には実行者、時刻、状態変更を記録し、自動処理の記録にはコミット後の実行結果を保存します。

`defineLifecycle()` で識別子、初期状態、許可する遷移、終了状態を宣言します。以下は `server/lifecycles/order.ts` の抜粋です。パラメーター設定などを省略し、遷移とタイムアウトのルールを `orderTransitions`、`orderTriggers` として表しています。`OrderTypes` はサンプルの型、`orderProblems` は作成時の検証関数です。

```ts
export const orderLifecycle = defineLifecycle<OrderTypes>({
  name: 'orders',
  key: 'orders',
  version: 1,
  definitionField: 'lifecycleDefinition',
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

レコードの作成には `runtime.create('orders', values, { actor })` を使います。runtime が初期状態、定義の紐付けフィールド、`$create` の履歴を記録します。`actor` はサーバーで検証済みの本人情報から取得し、`values` には許可した業務フィールドだけを含めます。作成後の状態変更は汎用の更新 API ではなく、遷移を通じて行います。

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

注文、遷移履歴、自動処理の実行記録を保存するテーブルを用意します。注文には業務フィールドに加え、状態、待機期限、同時更新の確認、定義の紐付けに使う `status`、`statusChangedAt`、`lifecycleVersion`、`lifecycleDefinition` を保存します。パッケージがマイグレーションを自動実行することはありません。フィールドとインデックスは使用バージョンの [ストレージ要件][storage] に従ってください。アプリへの組み込みは [データモデルとマイグレーション](data-models-and-migrations.md) を参照してください。

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

アプリ側で作成、参照、操作用の API を用意します。認証、認可、入力検証のあと、レコードに紐付く定義を解決してから runtime を呼び出します。

```ts
const actor = { id: String(signedInUserId) };
const definition = await runtime.boundLifecycle('orders', orderId);
const result = await runtime.fire(definition, orderId, body.transition, {
  actor,
  manual: true,
  input: body.input,
  requestId: body.requestId,
  expect: { version: body.expectVersion },
});

const view = await runtime.view(definition, orderId, actor);
return c.json({ data: { ...view, replayed: result.replayed === true } });
```

`body` は検証済みの入力で、ユーザー ID は信頼できるセッションから取得します。レコードのアクセス範囲を確認し、参照、遷移、復旧をそれぞれ認可してください。実行記録を操作する前に、その記録が対象の注文に属することも確認します。ストアはリクエストのポリシーを継承しません。[認証、権限、データスコープ](authentication-and-permissions.md) と [リクエスト検証とエラー処理](request-validation-and-errors.md) を参照してください。

通信障害のあとに同じ操作を再送するときは、同じ `requestId` を使います。入力や判断が変わった場合は新しい識別子が必要です。成功済みの操作を再送しても、新たな遷移は発生しません。表示中の同時更新バージョンを `expectVersion` として渡すと、古いバージョンでの操作は `CONFLICT` になります。表示を更新して、改めて操作を判断してください。リクエスト識別子は重複操作を防ぎ、同時更新バージョンは古い判断が新しい進捗を上書きするのを防ぎます。

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
const definition = await runtime.boundLifecycle('orders', orderId);
await runtime.fire(definition, orderId, 'paymentSucceeded', {
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

## バージョン管理

業務ルールを変更する時点で、既存のレコードがまだ進行中であることは珍しくありません。`@nocobase/lifecycle` は各レコードを作成時の具体的な定義バージョンに永続的に紐付けることで、新旧バージョンが同じ業務テーブルを共有しながら互いに干渉せずに動作できるようにします。

### バージョン識別子とレコードの紐付け

すべてのワークフロー定義で、次の識別プロパティを明示的に宣言します。

| プロパティ | 役割 |
| --- | --- |
| `name` | 1 つの具体的な定義を表す永続的な識別子。レコード、遷移履歴、effect 実行記録、パラメータースナップショットがこれを参照するため、変更しない |
| `key` | 同じ業務プロセスに属する全バージョンで共有する識別子。プラグインでは衝突を避けるため名前空間を付ける |
| `version` | `key` 内で一意な正の整数バージョン番号。最大値が最新定義を示すが、新規レコードが自動でそのバージョンを使うわけではない |
| `collection` | 共有する業務テーブル。既定値は `name` のため、新しいバージョンでは明示的に指定する |
| `definitionField` | 具体的な定義の `name` を保存する NULL 許容文字列フィールド（例：`lifecycleDefinition`）。1 つのテーブルが複数のプロセスを持つ場合は、プロセスごとに別フィールドを用意する（例：`approvalDefinition`、`paymentDefinition`） |
| `versionField` | レコード単位の同時更新カウンター（既定は `lifecycleVersion`）。定義の `version` とは無関係 |

`runtime.create()` はレコード作成と同じトランザクション内で `definitionField` を書き込みます。これは runtime が管理するフィールドであり、`set`、`accept`、作成時の入力値からは変更できません。その後のすべてのレコード操作（`view()`、`available()`、`can()`、`fire()`、effect、続行処理）は紐付けを検証し、別バージョンに紐付くレコードや未紐付けのレコードを `DEFINITION_MISMATCH`（`lifecycleErrorFields()` により `400 FAILED_PRECONDITION` に変換され、`metadata.bound` に実際の紐付けが入る）で拒否します。最新バージョンへ自動でフォールバックすることはなく、各バージョンの trigger も自身に紐付くレコードだけを走査します。

定義を登録する際、runtime は同じ `key` のすべてのバージョンで `collection`、`stateField`、`changedAtField`、`versionField`、`definitionField`（および管理機能有効時の `management.field`）が一致しているかを検証します。1 つの `key` に複数バージョンがある場合は `definitionField` が必須です。`key` や `version`、または単一バージョン時の `definitionField` を省略すると現在は警告が出力され、次のマイナーリリースで必須になります。

### 新バージョンの作成と作成入口の切り替え

対象のメインブランチへマージ済みのバージョンは**凍結**されます。状態、遷移条件や遷移先、guard、`route`、`validate`、`set`、`accept`、フック、trigger、effect の挙動、またはパラメーター契約を変更する場合は、旧バージョンと元の挙動を保持したまま新しいバージョンを追加します。未マージの作業ブランチ上で新しく追加したバージョンはそのまま編集でき、タイトル・説明・翻訳など表示専用のメタデータもそのまま編集できます。複数バージョンで共有している guard、effect、ヘルパーを変更する場合は、凍結済みバージョンの挙動が変わらないよう注意してください。

新バージョンを作成するときは、現在の定義と対象メインブランチの履歴（削除済みバージョンを含む）にある同じ `key` の最大 `version` に 1 を足し、マージ済み定義で使われたことのない `name` を付けます。以下は `server/lifecycles/expense-v2.ts` の抜粋で、v1 の業務テーブルと変更のない遷移を共有しながら `awaitingAudit` 段階を追加しています。

```ts
export const expenseV2Lifecycle = defineLifecycle<ExpenseV2Types>({
  name: 'expenses-v2',
  key: 'expenses',
  version: 2,
  definitionField: expenseLifecycle.definitionField,
  collection: expenseLifecycle.collection,
  initial: 'draft',
  states: [
    'draft', 'awaitingManager', 'awaitingFinance', 'awaitingAudit',
    'needsInfo', 'approved',
    { name: 'rejected', final: true },
    { name: 'paid', final: true },
  ],
  parameterConfiguration: {
    groups: [expenseParameterGroup, expenseTimingGroup, expenseAuditGroup],
  },
  parameters: {
    autoApproveLimit: 5000,
    financeLimit: 50000,
    escalateAfterMinutes: 3,
    auditLimit: 20000,
  },
  transitions: {
    // ...audit の追加と approve のルーティング更新。変更のない遷移は v1 を再利用
    escalate: expenseLifecycle.transitions.get('escalate')!.definition as never,
    paid: expenseLifecycle.transitions.get('paid')!.definition as never,
  },
  onEnter: {
    awaitingManager: [notifyApprover as never],
    awaitingFinance: [notifyApprover as never],
    awaitingAudit: [notifyApprover as never],
    approved: [notifyApplicant as never, requestPayment as never],
  },
  triggers: { /* ... */ },
});
```

すべてのアプリプロセスおよび Worker の同じ `LifecycleRuntime` に新旧両方のバージョンを登録します。`runtime.create()` に「最新バージョンを既定で使う」仕組みはなく、作成入口（API ルート、イベント購読、定期ジョブ、インポート、バッチ、子プロセス作成）が開始する定義の `name` を明示的に指定します。デプロイ時は先に新バージョン定義をすべてのプロセスと Worker に展開してから作成入口を切り替え、スキーマ変更は旧バージョンとの互換性を保ちます。ロールバックは作成入口を旧定義へ戻すだけで済み、すでに新バージョンで作成されたレコードはそのまま新バージョンで進行します。

### 複数バージョンの参照、パラメーター、廃止

レコードを扱うルートはバージョン名ではなくプロセス `key` でパスを構成します。各ルートでは `runtime.boundLifecycle(key, recordId)`（すでにレコードを取得済みの場合は `runtime.recordLifecycle(key, record)`。ポリシーの読み取りフィールドや射影に `definitionField` を含める）で紐付け先を取得し、その定義名を `view()` や `fire()` に渡します。定義の参照ルートは任意の `?definition=<name>` を受け付け、省略時は `runtime.group(key).latest` を返します。

同じテーブル上の複数バージョンを表示する一覧画面では、`runtime.groupStates(key)` で全バージョンの状態の和集合を取得してフィルターや状態ラベルを構成します。`runtime.groups()` と `runtime.group(key)` はワークフロー一覧の集約に使います。詳細画面の `view.lifecycle` と `view.definitionVersion` は常にそのレコード自身のバージョンを示すため、操作ボタン、図、履歴が最新バージョンと混ざることはありません。

**パラメーター設定は具体的な定義バージョンごとに独立して保持されます。** `parameterConfiguration` を宣言した場合、各バージョンは独自のパラメーター契約と設定リビジョンを持ち、暗黙的に設定を共有しません。画面から旧バージョンの互換フィールドを未保存入力として明示的にコピーし、新バージョンの検証を通過したうえで独立して保存できます。`runtime.create()` は作成トランザクション内（下書き状態を含む）で有効なパラメーターを不変のスナップショットとして凍結し、以降の遷移、trigger、effect、復旧は常にそのスナップショットのみを参照します。後から管理者が設定を変更しても、対象バージョンで今後作成されるレコードにのみ適用され、進行中レコードのパラメーターや待機期限は変わりません。

**Workflow management** では、同じ `key` の複数バージョンが定義一覧で 1 行にまとまり、最新バージョンのメタデータと全バージョン合計の実行件数を表示します。定義詳細のヘッダーにはバージョン切り替えがあり、ワークフロー図、実行履歴リンク、右側のパラメーター設定が選択したバージョンに連動します。また、最新表示は最大バージョン番号を示すものであり、新規レコードが必ずそのバージョンで開始されるわけではないことが明示されます。

![ワークフロー定義詳細でのバージョン切り替えとバージョン別パラメーター設定](/assets/core/developing-apps/business-workflows/workflow-version-detail.png)

バージョンの**廃止と削除**では次を守ります。

- 紐付け済みレコード、履歴の閲覧、復旧、または待機中の処理が残っている間は、旧バージョン定義とその依存コードを保持します。
- メインブランチへマージ済みのバージョンコードを削除する前に、関連するすべてのデプロイ環境でそのバージョンが使用されておらず、保持・実行・閲覧・復旧が必要なインスタンスやタスクが存在しないことを確認します。コード削除時は登録と作成入口も整理しますが、マージ済みのマイグレーションと履歴データは削除しません。
- マージ済みバージョンの `name` と `key + version` は削除後も永久に予約され、新しい定義に再利用できません。プロセス全体を削除した場合も、元の `key` を別プロセスに割り当てないでください。

## 管理者による進行中プロセスの操作

進行中のレコードが異常で停止した場合や、一時保留、指定段階からのやり直しが必要な場合、`@nocobase/lifecycle` のオプトイン管理機能を使って一時停止、再開、初期化、指定状態での再開始を行えます。管理コマンドは既定で無効になっており、定義側でポリシーを明示した場合にのみ有効化され、すべての操作はトランザクション内で `$manage` 監査ログとして記録されます。承認者の変更や承認者追加といった承認固有の操作には、[承認プラグイン](../using-plugins/collaboration/approval.md) とそのアダプターを使用してください。

### ポリシー宣言とストレージのマイグレーション

`defineLifecycle()` に `management` ポリシーを追加して必要なコマンドを有効にします。以下は `server/lifecycles/ticket.ts` の抜粋です。

```ts
export const ticketLifecycle = defineLifecycle<TicketTypes>({
  name: 'tickets',
  key: 'tickets',
  version: 1,
  definitionField: 'lifecycleDefinition',
  collection: LIFECYCLE_EXAMPLE_COLLECTIONS.tickets,
  initial: 'new',
  management: {
    field: 'lifecycleManagement',
    suspend: true,
    reset: true,
    resetWhileActive: true,
    restartAt: ['new', 'open', 'awaitingCustomer', 'closed'],
    restartWhileActive: true,
    canEnter: ({ previous, to }) =>
      to === 'new' || to === 'closed' || Boolean(previous.assigneeId),
    set: ({ to }) => ({
      closedReason: to === 'closed' ? 'administrative' : null,
      ...(to === 'new' ? { assigneeId: null } : {}),
    }),
  },
  // ...states, parameters, transitions, triggers
});
```

Repository ストアで `management` を有効にする場合、次のマイグレーションを追加します（サンプルの `202611190001_lifecycle_example_ticket_management.ts` を参照）。

1. 業務テーブルに NULL 許容 JSON フィールド `management.field`（例：`lifecycleManagement`）と NULL 許容整数フィールド `<field>Revision`（例：`lifecycleManagementRevision`）を追加します。既存レコードで値が `null` の場合は第 1 ラウンドの稼働中として扱われます。
2. 遷移履歴テーブル（既定は `lifecycleTransitions`）に NULL 許容 JSON フィールド `management` と非 NULL 整数フィールド `journalRevision`（既定値 `0`）を追加します。
3. 遷移履歴テーブルの一意制約を `(lifecycle, recordId, version)` から `(lifecycle, recordId, version, journalRevision)` に置き換え、`(lifecycle, recordId, requestKey)` は維持します。独立した `journalRevision` により、`suspend` と `resume` が同じ業務バージョンのまま個別の監査ログを残せます。

> [!NOTE]
> `management` は定義の実行挙動に含まれるため、バージョン凍結ルールに従います。v2 で `management` ポリシーを追加しストレージを移行しても、管理コマンドを使えるのは v2 に紐付くレコードだけです。v1 に紐付く既存レコードは v1 の定義のまま動作し、v2 の管理機能は自動適用されません。

### 管理コマンドと進行中の書き込み保護

4 つの管理コマンドの前提条件と動作は次のとおりです。

| コマンド | 前提条件 | 実行時の効果 |
| --- | --- | --- |
| `suspend` | 稼働中かつ `management.suspend: true` | 業務バージョンと現在の滞在（stay）を維持したまま、通常の遷移を `SUSPENDED` で拒否し、trigger の待機と effect の配信・続行を一時停止する |
| `resume` | 一時停止中 | 同じ滞在を継続し、停止時間を `pausedMs` に加算して `dueAtField` を延長する。トランザクション内で `management.onResume` を実行し、コミット後に待機中の effect と期限到達済みの続行処理を再開する |
| `reset` | `management.reset: true`、一時停止中または `resetWhileActive: true`、かつ `canEnter` が許可 | 一時停止を解除し、業務バージョンとラウンド（`round`）を 1 増やして初期状態で新しいラウンドを開始する |
| `restartAt` | 対象が `management.restartAt` に含まれ、一時停止中または `restartWhileActive: true`、かつ `canEnter` が許可 | 一時停止を解除し、業務バージョンとラウンドを 1 増やして指定状態で新しいラウンドを開始する（許可されていれば同一状態への再入も可能） |

`reset` と `restartAt` は**管理による再入**を行い、1 つのトランザクション内で `management.set` による業務フィールド更新と `management.onReenter`（旧タスクの終了や新タスクの作成など）を実行します。同時に待機中の effect をキャンセルし、遅れて届いた続行処理を遮断します（すでに外部へ送信済みの呼び出しは完了する可能性があります）。再入時に実行したい外部処理は `management.onEnter` に明示的に指定し、effect コンテキストの `management` から監査イベントを参照できます。

`management.onResume` は `resume` 時のみ実行され、`previous`、`record`、`suspendedAt`、`now`、`pausedForMs`、`actor`、`event`、`entry`、`services`、`tx` を受け取ります。関連タスクの期限延長などのドメイン更新は `tx.handle` またはトランザクションに紐付く `services` 経由で行います。再開対象レコード自身のライフサイクル管理フィールドの変更や、同レコードへの `tx.fire()` は禁止されており、例外や禁止された書き込みがあると再開状態・監査ログ・リクエスト予約・ドメイン更新が一括でロールバックされ、同じ `requestId` で再試行できます。

承認段階をまだ進めない投票記録のように、現在の滞在を開いたまま行うドメイン書き込みでは、事前に `runtime.boundLifecycle()` で定義を解決し、`runtime.transaction()` 内で `tx.requireActive()` を呼び出してレコードをロックし、紐付けと停止状態を検証したうえで `tx.handle` から書き込みます。

```ts
const definition = await runtime.boundLifecycle(key, recordId);
await runtime.transaction(async (tx) => {
  const record = await tx.requireActive(definition, recordId);
  await assertCurrentStay(tx.handle, record, expectedStayId);
  await writeDomainChange(tx.handle, payload);
});
```

ドメイン側でインスタンスロックより先に取得すべき独自ロックがある場合は、`management.prepare` でも同じ順序でロックを取得します。特定の滞在がすでに終了しているか（`reset` や `restartAt` による終了を含む）を確認するには、`@nocobase/lifecycle` がエクスポートする `findStayExit()` を使えます。

### 管理 API と画面の組み込み

管理画面用の情報を読み込むには `runtime.managementDetails(key, recordId, actor, authorize)` を使います。`actor` は認証済みセッションから取得し、`authorize` はサーバー側でコマンド、紐付け定義、レコードの業務スコープを検証します。定義に `management` ポリシーがないか、いずれのコマンドも許可されない場合は `undefined` を返します。許可がある場合は、現在状態、`suspended`、`round`、不透明な `version`、実行可能な `actions`、遷移先候補 `targets`、進行中の処理 `work`（`queued` / `running` / `continuation`）、および `$manage` 履歴 `history` を返します。候補算出時、`canEnter` は空の `reason` で読み取り専用に評価されます。

管理コマンドの実行には認証・認可済みの POST エンドポイントを用意し、`runtime.suspend()`、`runtime.resume()`、`runtime.reset()`、`runtime.restartAt()` を呼び出します。以下は `server/routes/ticket-management.ts` の抜粋です。

```ts
const actor = { id: signedInUser(context) };
const authorize: ManagementAuthorization = (request) =>
  request.actor.id === actor.id && request.lifecycle === 'tickets';
const options = { ...body, actor, authorize };
const data =
  body.command === 'restartAt'
    ? await runtime.restartAt('tickets', recordId, body.target, options)
    : await runtime[body.command]('tickets', recordId, options);
return context.json({ data });
```

コマンド実行には空でない `reason`、`managementDetails` から取得した `expectedVersion`、および冪等な `requestId` が必須です。承認ランなど第 2 層の滞在も同時に一致確認したい場合は `expectCurrent` を渡します。runtime は**冪等リプレイの判定より前に `authorize` を実行します**。

- 権限がない場合は `MANAGEMENT_FORBIDDEN`（`lifecycleErrorFields()` により `403`）を返します。
- 同じ `requestId` でコマンド、実行者 ID、`expectedVersion`、前後空白を除いた `reason`（`restartAt` の場合は `target` も含む）が一致していれば、`expectCurrent` やフックを再実行せずに初回の結果を返します。いずれかが異なる場合は `CONFLICT`（`409`）を返します。
- 同時更新により `expectedVersion` または `expectCurrent` が一致しない場合も `CONFLICT` になります。画面を更新して最新状態を確認してから、新しい `requestId` で再実行してください。

UI では `managementDetails` の `actions` と `targets` に基づいて操作ダイアログを表示し、理由の入力を必須にするとともに、リセットや再開始の前に遷移先と影響範囲を明示します。成功後はレコード詳細、利用可能な業務アクション、管理履歴を再読み込みします。図に現在ラウンドの進捗だけを表示したい場合は `RecordView.roundStartedVersion` で遷移を絞り込みつつ、全履歴も参照できる状態を保ちます。

![チケット詳細画面の管理者操作ダイアログ](/assets/core/developing-apps/business-workflows/workflow-management-dialog.png)

![一時停止後の保留通知と管理操作履歴](/assets/core/developing-apps/business-workflows/workflow-management-suspended.png)

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

現在の段階、遷移のタイムライン、自動処理の結果を分けて表示します。試行回数、エラー、続行待ちの処理も確認できるようにします。Hook は既定でポーリングし、外部からの結果を取得します。システム設定の **Workflow management** ではプロセス単位でまとめた定義バージョン、実行一覧、実行詳細を確認し、再試行・続行・管理操作の権限を制限できます。

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

バージョン管理と管理者操作を確認するには、サンプルプロジェクトの **Workflow management**（`expenses` / `expenses-v2`）と **Help desk**（`tickets`）もあわせて試してください。

- **Workflow management** で **Expense approval** を開き、Version 1 と Version 2 を切り替えてワークフロー図とパラメーター設定がバージョン別に独立していることを確認します。新しい経費精算を作成し、実行履歴が該当バージョンに紐付くこと、既存レコードが v1 のまま進行することを確認します。
- **Help desk** で管理者としてチケット詳細を開き、**Manage lifecycle** から理由を入力して **Suspend** を実行し、`Suspended` バッジ、業務操作の停止、管理操作履歴の記録を確認します。その後 **Resume** による再開と、**Reset** / **Restart at** による新ラウンド開始を確認します。

支払い、返金、コールバックにはサンプルのサンドボックスを使い、実際の資金は動きません。ヘルプデスクのサンプルでは管理者権限がデモ全体を対象としているため、実アプリではレコード単位の業務スコープ認可に置き換えてください。認可境界、`tx.requireActive()` による同時更新保護、冪等リプレイ、トランザクションのロールバック、再起動後の復旧は、アプリの統合テストで確認してください。[テスト](testing-and-acceptance.md) を参照してください。

実装の参照先：[注文の定義と effects][order-source]、[経費精算の複数バージョン定義][expense-v2-source]、[チケット管理 API][ticket-management-source]、[コールバックの受信処理][webhook-source]、[バージョン管理の設計][version-design]、[進行中プロセス管理の設計][management-design]、[復旧テスト][recovery-tests]、[管理操作テスト][management-tests]。

[storage]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/docs/design.md#storage
[version-design]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/docs/design.md#versions-of-a-process
[management-design]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/docs/design.md#managing-a-running-instance
[order-source]: https://github.com/nocobase/nocobase/tree/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/examples/app-plugin-lifecycle-example/server/lifecycles
[expense-v2-source]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/examples/app-plugin-lifecycle-example/server/lifecycles/expense-v2.ts
[ticket-management-source]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/examples/app-plugin-lifecycle-example/server/routes/ticket-management.ts
[webhook-source]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/examples/app-plugin-lifecycle-example/server/webhooks/receiver.ts
[recovery-tests]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/tests/pending-continuation.test.ts
[management-tests]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/tests/management.test.ts
