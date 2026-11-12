---
title: サーバー側のサービス
description: 再利用できるサービスを定義・登録し、HTTP、アプリのコマンド、ジョブから呼び出し、ポリシー、トランザクション、ライフサイクルを管理します。
---

## サービスの役割

サービスは、再利用できるロジックをまとめたクラスまたはオブジェクトです。フレームワークの基底クラスを継承する必要はありません。たとえば注文サービスを使えば、HTTP のエンドポイント、アプリのコマンド、バックグラウンドジョブが、注文の確定と在庫の引き当てのルールを共有できます。単純な照会や計算は、通常の関数のままでもかまいません。

サービスは入力を受け取り、業務操作を行い、結果を返します。認証、入力の検証、レスポンスの形式は入口が担います。Provider はサービスを組み立て、依存関係を与え、リソースを管理します。この例では、サービスは HTTP リクエストのコンテキストに依存せず、現在のユーザーの権限ポリシーを引数として受け取ります。

`order-services` の例は、画面のない注文アプリです。確定すると在庫を引き当て、コミット後に結果をログに記録します。実際の認証、認可ポリシー、データベースのトランザクション、ジョブのエグゼキューターを使います。セットアップについては [サンプルのソースとアプリの実行](#サンプルのソースとアプリの実行) を参照してください。

## サービスを定義する

### サービスのインターフェースと実装

`server/orders/service.ts` で呼び出し側が必要とする機能を宣言し、`DefaultOrderService` で実装します。

```ts
export interface OrderService {
  get(policy: RepositoryPolicy, orderId: string): Promise<OrderView>;
  confirm(policies: ConfirmationPolicies, orderId: string): Promise<OrderView>;
}
```

`get()` はアクセスできる注文を読み取り、`confirm()` は注文を確定して在庫を引き当てます。`RepositoryPolicy` はデータベースのアクセスポリシーです。`ConfirmationPolicies` には、注文と製品の別々のポリシーが含まれます。どちらのメソッドも、注文の ID、担当者、製品、数量、ステータスだけを含む `OrderView` を返します。型と実装の全体は [サービスのソース](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/service.ts) を参照してください。

`server/orders/` はこの例のディレクトリの慣習で、`server/services/` を使うこともできます。どちらのディレクトリも自動ではスキャンされません。何が読み込まれるかは、インポートと Provider の一覧で決まります。

### 依存関係を注入し、引数を渡す

データベースとコミット後のハンドラーはコンストラクターで注入します。注文の ID と現在の呼び出しのポリシーはメソッドに渡します。この抜粋はコンストラクターと読み取りのメソッドを示しています。ソースの全体には、`view()` によるフィールドの変換も含まれます。

```ts
export class DefaultOrderService implements OrderService {
  constructor(
    private readonly database: DatabaseManager,
    private readonly onConfirmed: (order: OrderView) => void | Promise<void>,
  ) {}

  async get(policy: RepositoryPolicy, orderId: string): Promise<OrderView> {
    const row = await this.database
      .repository('orders')
      .withPolicy(policy)
      .findOne({ filter: { id: orderId } });
    if (!row) throw new OrderError('ORDER_UNAVAILABLE');
    return view(row);
  }
  // confirm() and view() are included in the complete source.
}
```

1 つのインスタンスで異なるユーザーのリクエストを扱え、呼び出しごとにそれぞれのポリシーが適用されます。動作中の例では、Alice は自分の注文を読めますが、自分のポリシーでは Bob の注文を見つけられません。[サービスの統合テスト](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/tests/orders.test.ts) でこの動作を確認しています。

## サービスを登録する

### サービスのトークンを定義する

トークンは、コンテナがサービスを探すための型付きの識別子です。`server/providers/orders.ts` で定義してエクスポートします。

```ts
import { createServiceToken } from '@nocobase/service-provider';
import type { OrderService } from '../orders/service.js';

export const orderServiceToken = createServiceToken<OrderService>(
  'order-services/orders',
);
```

呼び出し側は同じトークンをインポートします。コンテナはオブジェクトの同一性で照合します。同じ名前で `createServiceToken()` をもう一度呼び出しても、別の識別子になります。

### Provider でサービスを登録する

同じファイルの `register()` で、トークンをサービスのファクトリーに結び付けます。この抜粋は上で宣言した `orderServiceToken` を使い、`boot()` での認可の初期化は省いています。ファイルの全体は [OrdersProvider](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/providers/orders.ts) を参照してください。

```ts
import type { Application } from '@nocobase/app-server/application';
import { loggingToken } from '@nocobase/app-server/logging';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import { DefaultOrderService } from '../orders/service.js';

export default class OrdersProvider extends ServiceProvider<Application> {
  readonly name = 'order-services/orders';
  override register(): void {
    this.app.container.singleton(
      orderServiceToken,
      (resolver) =>
        new DefaultOrderService(
          resolver.resolve(databaseManagerToken),
          (order) =>
            resolver
              .resolve(loggingToken)
              .getLogger('orders')
              .info({ orderId: order.id }, 'Order confirmed'),
        ),
    );
  }
}
```

`singleton()` は同期のファクトリーを登録します。サービスが最初に解決されたときに実行され、以降の呼び出しはアプリのコンテナ内でそのインスタンスを再利用します。ファクトリーは `resolver.resolve()` でデータベースとログの依存関係を取得し、サービスに渡します。サービスは、トランザクションのコミット後にログのコールバックを呼び出します。

非同期の初期化は、ファクトリーから Promise を返すのではなく、Provider のライフサイクルのメソッドに置きます。そのほかの登録方法については [サービスコンテナと依存性注入](../framework/services/container.md) を参照してください。

### Provider をアプリに接続する

```ts
// server/providers/index.ts
import OrdersProvider from './orders.js';
import OrderJobsProvider from './order-jobs.js';

export default [OrdersProvider, OrderJobsProvider];
```

[server/runtime.ts](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/runtime.ts) はこの配列を `defineAppRuntime({ serviceProviders, ... })` に渡し、アプリの組み立て時に読み込まれます。Provider のファイルを作成しただけでは、サービスは登録されません。

既存の Default テンプレートのアプリでは、元の一覧に Provider を追加します。`SubmissionProvider` やほかのテンプレートの設定は残してください。この例は独立したサーバーアプリを組み立てているため、その一覧全体で Default テンプレートの一覧を置き換えてはいけません。

## サービスを呼び出す

アプリが Provider を登録したら、アプリのコンテナからサービスを解決します。`server/routes/orders.ts` では、同じトークンをインポートし、`defineApiRoutes()` のコールバックに渡される `app` を使います。

```ts
import { orderServiceToken } from '../providers/orders.js';

// Inside the defineApiRoutes() callback.
const service = app.container.resolve(orderServiceToken);
```

1 つのアプリのコンテナ内で `resolve()` を繰り返し呼び出すと、同じ注文サービスのインスタンスが返ります。コマンドや別のワーカーのプロセスは、それぞれ独自のアプリとサービスのインスタンスを作成します。

トークンがない、重複して登録されている、依存関係が循環しているといった場合は、エラーが投げられます。失敗したシングルトンのファクトリーは失敗したままで、以降の解決では組み立てを再試行せずに同じエラーが投げられます。

### HTTP のエンドポイントから

サービスを呼び出す前に、認証、認可、入力の検証を行います。これは [確定のエンドポイント](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/routes/orders.ts) のハンドラーの部分です。ファイルの全体には、`auth.required()`、`authz.middleware()`、`apiValidator()`、API ドキュメントの宣言も含まれます。

```ts
const policies = await authorizeOrder(c.get('authz'), 'confirm');
return c.json({
  data: await service.confirm(policies, c.req.valid('param').id),
});
```

動作中の例に対して `pnpm demo` を実行します。一般ユーザーでサインインし、`POST /main/api/orders/:id/confirm` を呼び出します。自分の注文を確定すると、`data.status: "confirmed"` とともに `200` が返ります。閲覧専用ユーザーは `403` を、ほかのユーザーの注文へのアクセスは `404` を受け取ります。リクエストと期待されるレスポンスについては [デモのスクリプト](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/scripts/demo.ts) を、ルートの宣言については [HTTP ルートと API](apis-and-services.md) を参照してください。

### アプリのコマンドから

`AppCommand.withApp()` を使い、コマンドに必要なライフサイクルを明示的に起動します。これは [確定のコマンド](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/cli/commands/orders/confirm.ts) の中心となる呼び出しです。エラーの対応付けはソースの全体を参照してください。

```ts
const result = await this.withApp(async ({ app }) => {
  await app.start();
  return confirmFromCommand(app, args.actorId, args.orderId);
});
```

`withApp()` はアプリを作成し、終わったら片付けますが、Provider を自動で起動はしません。この例では `boot()` で認可の機能を宣言しているため、先に `app.start()` を呼び出します。続いて `confirmFromCommand()` ヘルパーが、選んだユーザーを確認し、権限ポリシーを取得して、サービスを呼び出します。

```ts
const policies = await authorizeOrder(
  await actorContext(app, actorId),
  'confirm',
);
return app.container.resolve(orderServiceToken).confirm(policies, orderId);
```

サンプルのディレクトリで `pnpm confirm <actorId> <orderId> --json` を実行します。成功すると、結果に `ok: true` と `result.status: "confirmed"` が含まれます。ID は、セットアップ時に生成される `storage/demo.json` から取得します。ローカルの運用担当者は既存のユーザーを明示的に選びます。[コマンドのアダプター](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/cli/confirm.ts) はそのアカウントを確認して最新の認可を取得し、管理者としてその範囲を回避することはありません。[アプリのコマンド](application-commands.md) を参照してください。

### バックグラウンドジョブから

ジョブのペイロードには JSON のデータだけを含めます。データベースの接続、サービスのオブジェクト、リクエストのコンテキストは入れないでください。エグゼキューターは、そのペイロードから新しいインスタンスを組み立て直します。Provider はクロージャーでサービスの依存関係を与えられます。

```ts
import { Job } from '@nocobase/jobs';
import type { Application } from '@nocobase/app-server/application';
import type { OrderService } from './service.js';
import { authorizeOrder } from './permissions.js';
import { actorContext } from './actor.js';
export function createConfirmOrderJob(app: Application, service: OrderService) {
  return class ConfirmOrderJob extends Job<{
    orderId: string;
    actorId: string;
  }> {
    static readonly jobName = 'orders.confirm';
    async execute(): Promise<void> {
      const context = await actorContext(app, this.payload.actorId);
      const policies = await authorizeOrder(context, 'confirm');
      await service.confirm(policies, this.payload.orderId);
    }
  };
}
```

[ジョブの Provider](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/providers/order-jobs.ts) は、`start()` でサービスを解決し、ファクトリーに渡します。

```ts
const ConfirmOrderJob = createConfirmOrderJob(
  this.app,
  this.app.container.resolve(orderServiceToken),
);
this.executor = this.app.container
  .resolve(jobExecutorServiceToken)
  .getJobExecutor('order-services');
this.executor.registerJob(ConfirmOrderJob);
await this.executor.setup();
```

エグゼキューターを起動する前に、ジョブのクラスを登録します。この抜粋では Provider のインポートと投入の入口を省いています。ファイルの全体では、`@nocobase/app-server/jobs` から `jobExecutorServiceToken` をインポートしています。ジョブの実装は [job.ts](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/job.ts) を参照してください。

HTTP の投入のエンドポイントは、認証済みのコンテキストからだけ `actorId` を取得し、実行時にもアカウントと権限を改めて確認します。この例ではロールをユーザーに直接割り当てています。業務がチームの所属に依存する場合は、HTTP 以外の入口でも、信頼できる所属を解決してください。

`pnpm demo` は `POST /main/api/orders/:id/confirmAsync` も呼び出し、`jobId` とともに `202` を受け取って、注文のステータスが `confirmed` になるまでポーリングします。受け付けは完了ではありません。エグゼキューターの設定については [バックグラウンドジョブと定期実行](background-tasks.md) を参照してください。

## ライフサイクルを管理する

### 初期化と起動

| フェーズ | この例での用途 |
| --- | --- |
| `register()` | 注文サービスのファクトリーを結び付ける |
| `boot()` | 業務操作とレコードの範囲を宣言する |
| `start()` | ジョブのクラスを登録し、そのエグゼキューターを起動して、投入の入口を公開する |
| `ready()` | すべての Provider の起動を必要とする作業。ここではオーバーライド不要 |
| `shutdown()` | この Provider が使うエグゼキューターを閉じる |

フレームワークは、1 つの Provider のすべてのフェーズを終えてから次に進むのではなく、フェーズごとに Provider を実行します。`boot()` が始まる時点で、すべての Provider は登録を終えていますが、すべてが初期化を終えているとは限りません。終了時は Provider を逆の順序でたどります。[ServiceProvider](../extension-development/service-provider.md) を参照してください。

### リクエストの状態を分離し、リソースを解放する

シングルトンはアプリの依存関係を共有できますが、現在のユーザー、ポリシー、リクエストの入力、トランザクションの接続をフィールドに保存すべきではありません。この例ではリクエストの状態を引数として渡すため、Alice と Bob が同じサービスを使っても、それぞれの範囲が保たれます。

[ジョブの Provider](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/providers/order-jobs.ts) は、エグゼキューターを保持し、その終了を待ちます。

```ts
override async shutdown(): Promise<void> {
  await this.executor?.shutdown();
}
```

HTTP サーバーが停止したときやアプリのコマンドが終了したとき、Provider はエグゼキューターが閉じるのを待ちます。解放するのは、現在の Provider が管理するリソースだけです。アプリのデータベースには独自の Provider があるので、注文サービスがそれを閉じるべきではありません。

## 権限、トランザクション、エラーを扱う

### 権限ポリシーを渡す

この例では `orders.read` と `orders.confirm` を宣言しています。確定には、注文の読み取りと更新、在庫の読み取りと更新が必要で、コレクションごとに別のポリシーがあります。[authorizeOrder()](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/permissions.ts) は、信頼できる認可の判定からポリシーを取得します。続いてサービスが、`withPolicy()` で各ポリシーをその Repository に結び付けます。

```ts
// Inside the service's transaction callback.
const orders = connection.repository('orders').withPolicy(policies.orders);
const products = connection.repository('products').withPolicy(policies.products);
```

`orders.owned` のレコードの範囲は、現在のユーザーで `ownerId` を絞り込みます。Alice と Bob はそれぞれ自分の注文を操作でき、Robin には読み取りの操作しかありません。[セットアップのヘルパー](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/scripts/fixtures.ts) は、すべての認証済みユーザーに業務上のアクセスを与えることなく、ロールとサンプルデータを作成します。

クライアントが送信した `RepositoryPolicy` を受け付けたり、注文のポリシーを製品に使ったりしないでください。新しく取得した Repository は、トランザクションのコールバック内であっても、既存のポリシーを引き継ぎません。権限の宣言と認可については [認証、権限、データ範囲](authentication-and-permissions.md) を参照してください。

### トランザクションとコミット後の処理を管理する

一緒に成功またはロールバックすべき操作は、サービスのメソッド内の 1 つのトランザクションにまとめます。この抜粋は `DefaultOrderService.confirm()` のトランザクションの境界を示しています。注文の読み取り、状態の確認、在庫の更新は省いています。それらの手順は [サービスのソース](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/service.ts) を参照してください。

```ts
return this.database.transaction(async (connection) => {
  const orders = connection.repository('orders').withPolicy(policies.orders);
  const products = connection.repository('products').withPolicy(policies.products);

  // ... Read the order, check its state and update it together with stock.
  const result = { ...order, status: 'confirmed' };
  connection.afterCommit(() => this.onConfirmed(result));
  return result;
});
```

注文の読み取り、ステータスの更新、在庫の引き当ては、すべてトランザクションのコールバックの接続を使います。在庫が足りないと例外が投げられ、それより前の注文の更新もロールバックされます。外側のデータベースから取得した Repository をコールバック内で混ぜて使わないでください。

この例では条件付きの更新を使い、注文がまだ `draft` であり、在庫が直前に読み取った値と一致していることを確認して、並行した書き込みが互いを上書きしないようにしています。すでに確定済みの注文は、もう一度引き当てずに戻ります。競合が起きたら、再試行するかどうかを決める前に状態を読み直します。[トランザクションとデータの整合性](transactions-and-consistency.md) を参照してください。

この例の 99 個の注文は、確定に失敗したあとも `draft` のままで、在庫は変わりません。[統合テスト](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/tests/orders.test.ts) では、重なった確定で二重に引き当てられないことも確認しています。

`afterCommit()` のコールバックは、最も外側のトランザクションがコミットされたあとに実行され、ロールバック時には破棄されます。トランザクション内で登録したコールバックについては、それが終わってから `transaction()` が戻ります。この例では、注入したログのコールバックを呼び出し、`Order confirmed` を書き込むのに使っています。

コールバックが失敗しても、コミット済みのデータを元に戻したり、トランザクションの Promise を reject させたりはできません。エラーは `onTransactionCallbackError` に送られ、ハンドラーが設定されていなければ警告になります。その時点でトランザクションの接続は終わっているため、以降の書き込みにはルートの接続か新しいトランザクションが必要です。ネストとコールバックの意味については [トランザクションの仕組み](../framework/database/transactions.md) を参照してください。

`pnpm test -t post-commit` を実行すると、コールバックが例外を投げる状況を再現できます。注文はそれでもコミットされ、確定を繰り返してもコールバックは再実行されません。確実な配信には、配信待ちのレコードを業務の変更と一緒に保存し、再試行と復旧を用意する必要があります。`afterCommit()` 自体がその保証を提供するわけではありません。

### 結果を返し、業務エラーを扱う

サービスは成功時に `OrderView` を返し、失敗時には HTTP ステータスを設定せずに業務エラーを投げます。この例の `OrderError` は、呼び出し側に固定のエラーコードを提供します。

```ts
export class OrderError extends Error {
  constructor(
    public readonly code:
      'ORDER_UNAVAILABLE' | 'OUT_OF_STOCK' | 'ORDER_CONFLICT',
  ) {
    super(code);
  }
}
```

HTTP の入口は、`ORDER_UNAVAILABLE` を 404 に、在庫不足や状態の競合を 409 に対応付けます。コマンドはこれらのエラーを `CommandError` に対応付け、ジョブではエグゼキューターが失敗を記録します。そのほかの Repository の例外は伝播します。[エラーの定義](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/orders/service.ts) と [HTTP での対応付け](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/server/routes/orders.ts) を参照してください。

## サンプルのソースとアプリの実行

### インストールと起動

[サンプルの全体と README](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/README.md) には、ソースの対応と詳しい手順が記載されています。Node.js 24 と pnpm 11.11.0 を使います。公開済みの依存関係は固定されており、`@nocobase/app-server` `3.0.0-beta.4`、`@nocobase/db` `1.0.0-beta.23`、`@nocobase/service-provider` `0.0.2-beta.2` を含みます。

```sh
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 89d899c436563335529aba9b75fbc12b5dc0db34
cd apps/order-services
npm pkg set packageManager=pnpm@11.11.0
pnpm install --frozen-lockfile
pnpm setup
pnpm start
```

`pnpm setup` は、ローカルの設定、一般ユーザー、サンプルの注文を生成します。認証情報と注文の ID は、Git で無視される `storage/demo.json` に入ります。既存の設定とデモデータは保持されます。既定の API のアドレスは `http://localhost:13210/main/api` です。別のホストを使う場合は、サーバーとデモのスクリプトに同じ `APP_PUBLIC_ORIGIN` を設定します。

SQLite とメモリのジョブアダプターは検証済みのローカルの設定であり、サービスを使うための一般的な要件ではありません。ほかのデータベース、Redis のエグゼキューター、外部への配信は、この例では検証していません。

### 実行と検証

`apps/order-services` で 2 つ目のターミナルを開き、HTTP とバックグラウンドジョブのデモを実行します。

```sh
pnpm demo
```

スクリプトはデモ用のユーザーでサインインし、正常な確定と繰り返しの確定、在庫不足、権限のないアクセス、バックグラウンドでの実行のレスポンスを表示します。最後の照会では、バックグラウンドジョブの注文が `confirmed` になっているはずです。最初に確定に成功するたびに、サーバーのログに `Order confirmed` が書き込まれます。確定を繰り返しても、在庫は引き当てられず、そのログも再び書き込まれません。

メモリのジョブアダプターは 1 つのプロセスで使います。先に HTTP サーバーを停止し、下の引数を `storage/demo.json` の `buyer.id` と `orders.cli` に置き換えます。

```sh
pnpm confirm <actorId> <orderId> --json
```

成功すると `ok: true` と `result.status: "confirmed"` が返ります。代わりに `reader.id` と `orders.reader` を使うと、0 以外の終了ステータスで拒否されます。

静的チェック、統合テスト、コンパイルを実行します。

```sh
pnpm typecheck
pnpm test
pnpm build
```

[統合テスト](https://github.com/nocobase/docs-examples-v3/blob/89d899c436563335529aba9b75fbc12b5dc0db34/apps/order-services/tests/orders.test.ts) は、分離したデータベースで実際のアプリを使います。繰り返しの確定と重なった確定、トランザクションのロールバック、ユーザーのデータの分離、コマンドとジョブの実行、ジョブのユーザーが権限を失ったり無効になったりした場合の拒否を確認します。コミット後の失敗のテストは、注文がコミットされたままでコールバックが再実行されないことを確認する際に、警告を出します。

`pnpm build` はこのサーバーの例をコンパイルするだけで、デプロイ用のアーカイブは作成しません。ブラウザーのページはないため、動作はエンドポイント、コマンド、ログで確認します。
