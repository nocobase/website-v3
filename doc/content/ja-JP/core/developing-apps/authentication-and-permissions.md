---
title: 認証、権限、データ範囲
description: アプリのエンドポイントを認証し、業務操作を宣言し、Repository のポリシーでレコードとフィールドへのアクセスを強制します。
---

Customer Access の例では、営業担当者が自分の顧客を管理し、自分の注文にひも付く顧客を変更します。閲覧専用の営業ユーザーは、レコードを閲覧することしかできません。アプリは実際の認証、認可、データベースへの保存を使い、既定のテンプレートの shadcn コンポーネントとユーザー・ロールの管理を使います。アプリの全体は [サンプルのソースとセットアップ](#サンプルのソースとセットアップ) を参照してください。

## 認証、操作の権限、データ範囲の役割

認証は呼び出し元を特定します。操作の権限は、その人が業務上の操作を実行してよいかを決めます。データのポリシーは、その操作でアクセスできるレコードとフィールドを決めます。

| チェック | この例での組み込み | 拒否された場合の結果 |
| --- | --- | --- |
| 認証 | `authenticationToken` の `required()` | 未認証のリクエストは `401` を受け取る |
| 操作の権限 | リクエストの認可コンテキストの `authorize()` | 操作の権限がなければ `403` を返す |
| レコードとフィールドへのアクセス | 判定の `RepositoryPolicy` を Repository に結び付ける | 範囲外のレコードにはアクセスできず、宣言されていないフィールドは読み書きできない |

ページの権限やボタンの表示は、ユーザーが使える機能を見つけやすくするものです。エンドポイントは、これらのチェックを独立して強制する必要があります。ボタンを隠しても、直接のリクエストは防げません。

## エンドポイントを認証する

### サインインを必須にし、現在のユーザーを読み取る

既定のテンプレートは、すでに認証を登録しています。アプリのルートで `authenticationToken` を解決し、業務のパスに `auth.required()` をマウントして、`c.get('auth')` で検証済みのセッションを読み取ります。この例では、顧客の作成時に、クライアントが指定した担当者を受け付けるのではなく、セッションから `ownerId` を設定します。

```ts
import { authenticationToken } from '@nocobase/app-plugin-authentication';

const auth = app.container.resolve(authenticationToken);
// Inside a request handler after required():
const ownerId = c.get('auth')!.user.id;
```

匿名の `GET /api/customers` は `401` を受け取ります。サインインした呼び出し元にも、顧客を閲覧する権限が必要です。この例は独自のトークンを発行せず、標準のログインページとセッションを使います。サインインの方法とセッションの設定は、業務のエンドポイントとは別に `server/config/auth.ts` に置きます。

出典：[業務のルート][routes]、[認証の設定][auth-config]。

### 認証と認可のミドルウェアをマウントする

ルートのファクトリーはアプリのインスタンスを受け取ります。認証のあと、`authz.middleware()` がこのリクエストの認可コンテキストを作成します。`AuthEnv & AuthorizationEnv` は Hono のコンテキスト変数の型を定めます。

```ts
import { Hono } from 'hono';
import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';

const router = new Hono<AuthEnv & AuthorizationEnv>();
const authz = app.container.resolve(authorizationToken);
for (const path of ['/customers', '/customers/*', '/orders', '/orders/*']) {
  router.use(path, auth.required(), authz.middleware());
}
```

この抜粋は認証のセットアップを示しています。完全なルートでは、ボディのサイズの制限、入力の検証、API ドキュメントの宣言も行っています。ミドルウェアが対象にするのはこのモジュールのパスだけで、サインインなどのほかのエンドポイントには影響しません。コンテキストはリクエストごとに作成し、ユーザーや判定をモジュールの状態に保持しないでください。`describeRoute()` の `security` プロパティはエンドポイントを記述するもので、認証は行いません。

出典：[ルートと登録][routes]。ルートの種類と登録については [HTTP ルートと API](apis-and-services.md) を参照してください。

## 業務操作を宣言する

### データベースの機能とフィールドへのアクセスを定義する

`defineDatabasePermission()` は、操作に必要なデータベースの機能を宣言します。`defineCompositeResource()` はそれらを組み合わせて、ユーザーに付与できる業務操作にします。これらのオブジェクトを定義しても、登録もアクセスの付与も行われません。

```ts
import { defineDatabasePermission } from '@nocobase/app-plugin-authorization/server';
import { defineCompositeResource } from '@nocobase/authorization/core';

const customers = defineDatabasePermission((p) =>
  p.collection('accessCustomers')
    .read(['id', 'name', 'email', 'notes', 'ownerId']),
);

// Excerpt from accessResource, omitting titles and other actions.
const resource = defineCompositeResource('customerAccess', (r) =>
  r.action('editCustomer', (a) =>
    a.grant('customers', customers.update(['name', 'email', 'notes'])),
  ),
);
```

`read()` は出力のフィールドを、`create()` と `update()` は入力のフィールドを制限します。読み取りの宣言は `internalNote` を、更新の宣言は `ownerId` を除外しています。営業ユーザーはリクエストを改変しても、内部メモを読んだり担当者を変えたりできません。

フィールドの機能は開発者が定義します。管理者は任意のデータベースのフィールドを編集するのではなく、権限エディターで業務操作とレコードの範囲を選びます。アプリは、`viewCustomers`、`createCustomer`、`viewOrders`、`assignCustomer` も、個別に割り当てられる操作として宣言しています。

出典：[権限の宣言の全体][permissions]。閲覧専用の営業ユーザーとしてサインインすると、Customers には作成や編集の操作がない一覧が表示されます。

![閲覧専用の営業ユーザーには、作成や編集の操作なしで自分の顧客が表示されます](/assets/core/developing-apps/authentication-and-permissions/customers-readonly.png)

### コレクションをまたいで権限を組み合わせる

注文の顧客を変更するには、編集できる注文と、選択できる顧客の両方へのアクセスが必要です。`assignCustomer` は、両方の機能を 1 つの操作で宣言します。

```ts
const orders = defineDatabasePermission((p) =>
  p.collection('accessOrders').read(['id', 'number', 'customerId', 'ownerId']),
);

// Within the same customerAccess resource:
.action('assignCustomer', (a) =>
  a.grant('orders', orders.update(['customerId']))
    .grant('customers', customers),
)
```

`orders` と `customers` は、ロールの設定で使う範囲のキーです。その結果の `conditions.database` のポリシーは、コレクション名 `accessOrders` と `accessCustomers` をキーにします。これらの名前を混同したり、`assignCustomer` の顧客の範囲の代わりに `viewCustomers` の判定を使ったりしないでください。

注文の行のメニューから **Change customer** を選びます。ページ分けされた選択肢は、通常の顧客一覧ではなく、`assignCustomer` で保護された `/api/orders/customerOptions` から取得されます。

出典：[権限の宣言][permissions]、[顧客の選択ページ][assignment]。

### 操作と権限エディターの入口を登録する

Provider の `boot()` で、コレクション、リソース、そのワークスペースのセクションを登録し、Provider を `server/providers/index.ts` に追加します。`CustomerAccessProvider` は、業務サービスと、自分が所有するレコードの方針も登録します。

```ts
const authz = this.app.container.resolve(authorizationToken);
authz.database.collections.add({ name: 'accessCustomers', title: title('customers') });
authz.database.collections.add({ name: 'accessOrders', title: title('orders') });
const resource = authz.compositeResources.define(accessResource);
authz.ui.sections.add({
  name: 'customer-access', title: title('title'), parent: 'business',
});
authz.ui.place(resource, { section: 'customer-access' });
```

`title()` はアプリが所有する翻訳のヘルパーです。コレクションは明示的に登録する必要があります。データベースのテーブルがあるだけでは、認可の対象にはなりません。

`client/pages/settings/permission-workspace.ts` の `business` 配列で、これらの操作を選びます。

```ts
{
  type: 'composite',
  id: 'customerAccess',
  actions: ['viewCustomers', 'createCustomer', 'editCustomer', 'viewOrders', 'assignCustomer'],
  scopeTitles: {
    accessCustomers: { key: 'access.customers' },
    accessOrders: { key: 'access.orders' },
  },
  hiddenActionScopes: { createCustomer: ['customers'] },
}
```

作成時のフィールドと担当者はエンドポイントが制御するため、エディターでは新しいレコードに意味のない範囲の選択を省いています。`hiddenActionScopes` は表示を変えるだけで、保存された付与は変えません。ユーザーとロールの管理にアクセスできるよう、テンプレートで用意された `settingsRoutes` を `client/routes.ts` に登録します。

出典：[Provider][provider]、[権限エディターの設定][workspace]、[ページの登録][client-routes]。ロールエディターには Customer Access の 5 つの操作が表示され、Change customer の下に注文と顧客の範囲が別々に表示されるはずです。

## エンドポイントで操作の権限を確認する

### 認可の判定を取得する

リクエストの `authz` コンテキストを使って、特定の業務操作を確認します。

```ts
const decision = await c.get('authz').authorize({
  resource: { type: 'composite', id: 'customerAccess' },
  action: 'assignCustomer',
});
const database = decision.conditions?.database;
```

`authorize()` は完全な判定を返します。`permit`、`deny`、または条件付きの `conditional` です。条件付きの判定は、そのデータベースのポリシーで強制する必要があります。サインインしていることや、`deny` 以外の判定を受け取ったことだけでは不十分です。`can()` は機能が使えるかを確認するもので、データベースへのアクセスに必要なポリシーは提供しません。

出典：[authorizeAccess()][authorize]。顧客の閲覧権限しかないユーザーが割り当ての変更を直接リクエストすると、`403` を受け取ります。

### 拒否された判定とポリシーの欠落を拒否する

例の `authorizeAccess()` は、操作に必要なコレクションを確認します。割り当ての場合、このチェックは次と同等です。

```ts
if (
  decision.effect === 'deny' ||
  !database?.accessOrders?.read ||
  !database?.accessCustomers?.read
) {
  throw new ApiError({
    status: 'PERMISSION_DENIED',
    reason: 'CUSTOMER_ACCESS_DENIED',
    domain: 'customer-access',
    message: 'This operation is not allowed.',
  });
}
```

`ApiError` は `@nocobase/app-server/router` からインポートします。このチェックのあと、注文と顧客のポリシーを別々にサービスに渡します。Repository は、引き続き実際の読み書きの機能と範囲を強制します。ポリシーがない場合に、範囲を限定しない照会やすべてのレコードにフォールバックしないでください。

これらのルートは、入力の検証の前に操作の権限を確認します。書き込みでは、テンプレートの冪等な送信の仕組みも組み込んでいます。新しいリクエストはすべて、取り消し後の再送も含め、現在の認可を通過する必要があります。[ルートの全体][routes] と [リクエストの検証とエラー処理](request-validation-and-errors.md) を参照してください。

## データベースへのアクセスにポリシーを適用する

### 照会結果と件数の範囲を限定する

この例では、`defineRecordAccess()` で自分が所有するレコードの方針を定義しています。`ownerId` を検証済みの主体と比較します。

```ts
import { defineRecordAccess } from '@nocobase/authorization/core';
import { buildFilter } from '@nocobase/repository-input';

const ownedRecords = defineRecordAccess('customerAccess.owned', (r) =>
  r.title(title('owned'))
    .collections('accessCustomers', 'accessOrders')
    .resolver(({ principal }) =>
      principal.type === 'user'
        ? buildFilter((f) => f.string('ownerId').eq(principal.id))
        : false,
    ),
);
// Register in Provider.boot():
authz.recordAccess.define(ownedRecords);
```

ロールでこの方針を選ぶと、認可がそれを Repository のポリシーに変換します。一覧と件数の照会には、同じ検索フィルターとともに同じポリシーを結び付けます。

```ts
const repository = connection.repository('accessCustomers').withPolicy(policy);
const filter = (f) => f.string('name').includes(q, { mode: 'insensitive' });
const data = await repository.findMany({ filter, limit: pageSize, offset: (page - 1) * pageSize });
const total = await repository.count({ filter });
```

ここでは型と並べ替えは省略しています。[一覧のサービス][service] と [レコードアクセスの宣言][permissions] を参照してください。Alice と Bob が別々のレコードを持つ場合、それぞれに自分の顧客だけが表示され、件数にもほかのユーザーのレコードは含まれません。すべてのレコードを取得してブラウザーで絞り込まないでください。

![営業ユーザーが、検索とページネーション付きで自分の顧客を閲覧します](/assets/core/developing-apps/authentication-and-permissions/customers.png)

### 作成と更新でフィールドを制限する

作成のエンドポイントが受け付けるのは `name`、`email`、`notes` だけです。サービスが ID を生成し、認証済みのユーザーから `ownerId` を設定します。

```ts
const result = await transaction.repository('accessCustomers')
  .withPolicy(policy)
  .createOne({ values: { ...values, id: randomUUID(), ownerId } });
```

Customers で **New customer** を選び、名前とメールアドレスを入力して保存します。新しいレコードが現在のユーザーの一覧に表示されるはずです。

![クライアントが指定する担当者や内部メモなしで顧客を作成します](/assets/core/developing-apps/authentication-and-permissions/customer-create.png)

更新では、検索と書き込みの両方にポリシーを適用します。

```ts
await this.get(policy, id, transaction);
const result = await transaction.repository('accessCustomers')
  .withPolicy(policy)
  .updateOne({ filter: { id }, values: { ...values } });
```

`values` は検証済みの業務の入力です。厳格な入力のスキーマは `ownerId` や `internalNote` などの余分なフィールドを拒否し、Repository も書き込めるフィールドを独立して制限します。ブラウザーが内部メモを受け取って、隠すかどうかを判断する必要はありません。

**Edit customer** を選び、メモを変更して保存します。再読み込みしても変更は保たれるはずです。フォームは、古い一覧のデータを編集権限の証拠として扱うのではなく、`editCustomer` の操作で現在のレコードを取得します。

出典：[作成と更新のサービス][service]、[顧客のフォーム][customer-form]。

![顧客のフォームでは、名前、メールアドレス、メモだけを変更できます](/assets/core/developing-apps/authentication-and-permissions/customer-edit.png)

### 関連するレコードへのアクセスを確認する

割り当てのサービスは、`customerId` を書き込む前に、同じトランザクションで注文と移動先の顧客を確認します。

```ts
const orders = transaction.repository('accessOrders').withPolicy(policies.orders);
await this.getOrder(policies.orders, id, transaction);
const customer = await transaction.repository('accessCustomers')
  .withPolicy(policies.customers)
  .findOne({ filter: { id: customerId } });
if (!customer) {
  throw new ApiError({
    status: 'INVALID_ARGUMENT', reason: 'CUSTOMER_UNAVAILABLE',
    domain: 'customer-access', message: 'The selected customer is unavailable.',
  });
}
await orders.updateOne({ filter: { id }, values: { customerId } });
```

この例では、保護された業務操作で関連の ID を変更しており、汎用の注文の書き込みエンドポイントは公開していません。ルートの `executeIdempotentMutation()` がトランザクションを提供し、サービスの読み書きはすべてその接続を使います。Repository を取得するたびにポリシーを結び付け直してください。トランザクションが外側の Repository のポリシーを引き継ぐことはありません。

存在しない注文もアクセスできない注文も、同じ `404` を返します。存在しない顧客も選択できない顧客も、同じ `400 CUSTOMER_UNAVAILABLE` を返し、以前の関連を保ちます。選択肢の一覧はユーザーが選ぶのを助けるもので、保存時にはサーバーが移動先を改めて確認します。

出典：[割り当てのサービス][service]、[トランザクションの組み込み][routes]。サービスの再利用と、コレクションをまたぐトランザクションについては [サーバー側のサービス](server-business-services.md) を参照してください。

![注文の顧客を変更するときは、両方のレコードへのアクセスを確認します](/assets/core/developing-apps/authentication-and-permissions/order-customer.png)

## ロールとページへのアクセスを設定する

### 操作とレコードの範囲を割り当てる

初回の初期化で、編集可能な 2 つのロールが作成されます。**Sales representative** には 5 つの操作すべてが、**Read-only sales** には顧客と注文の閲覧だけが含まれます。どちらも最初は **Records I own** を使います。どちらも一般ユーザーに自動では割り当てられません。

管理者として **System settings → Permission management → Roles and permissions** を開き、ロールの業務操作と範囲を編集してから、**Users** で特定の人に割り当てます。Change customer では、注文と顧客の両方の範囲を確認してください。サインインしたすべてのユーザーが引き継ぐ `member` ロールに、これらの付与を追加しないでください。

初期化では、共有のリソースの宣言とともに `definePermissionSet()` を使います。たとえば、顧客の閲覧の付与は次のように範囲を選びます。

```ts
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { selection } from '@nocobase/authorization/core';

const role = definePermissionSet('customer-reader')
  .title(title('reader'))
  .grant(accessResource.reference().grant({
    viewCustomers: { customers: selection.recordAccess('customerAccess.owned') },
  }))
  .build();
```

これは宣言の抜粋です。[ロールのシード][roles] には、ページへのアクセス、ほかの操作、保存が含まれます。設定を初期化するのは一度だけで、再起動しても管理者の変更は上書きされません。シードを編集しても、既存のデータベースのロールは更新されません。

![ロールエディターでは、業務操作とそのレコードの範囲を別々に設定します](/assets/core/developing-apps/authentication-and-permissions/permissions.png)

### ページへのアクセスとエンドポイントへのアクセスを分ける

顧客のルートは独自のページの権限を宣言し、子のルートはそれを引き継ぎます。

```ts
{
  name: 'accessCustomers',
  path: '/customers',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'customerAccess.customers' }, action: 'access' },
  componentLoader: () => import('./pages/access/list.js'),
}
```

ボタンは `useCan()` で業務操作を確認し、確認中や失敗したときは使えないままにします。

```tsx
import { useCan } from '@nocobase/app-plugin-authorization/client';

const { can } = useCan({
  resource: { type: 'composite', id: 'customerAccess' },
  action: 'createCustomer',
});
```

ページへのアクセスだけでは、API は `403` を返したままです。操作の付与だけでは、範囲内の API にアクセスできてもページは開けません。アクセスには複数の付与元が寄与することがあり、あるロールで操作のチェックを外しても、別のロールの付与は取り消されません。

出典：[ページの登録][client-routes]、[一覧の操作][list]。クライアントのルーティングについては [ページ、ルート、ナビゲーション](pages-routes-and-navigation.md) を参照してください。

## 一般ユーザーで検証する

### 匿名、拒否、範囲外のリクエストをテストする

制限のない管理者のアクセスで誤りが隠れないよう、一般アカウントを使います。Alice と Bob にそれぞれ別の顧客と注文を用意します。Alice に Sales representative を、Bob に Read-only sales を割り当てます。

| 操作 | 期待される結果 |
| --- | --- |
| 匿名での顧客 API のリクエスト | `401` |
| 業務ロールがない、またはページの権限だけ | 顧客 API が `403` を返す |
| 閲覧専用ユーザーが一覧を取得する | 自分のレコードと、それに一致する件数だけ |
| 閲覧専用ユーザーが作成、編集、割り当て変更を直接リクエストする | `403` |
| 営業ユーザーがほかのユーザーの顧客を読み取る、または編集する | 存在しないレコードと同じ `404` |

[エンドポイントのテスト][tests] は、実際のログイン、認可、分離した SQLite のデータベースを使います。別の分離したチェックで、判定に必要なポリシーがない場合に拒否されることも確認しています。

### フィールドの制限、割り当て変更、取り消しをテストする

- 顧客のレスポンスに `internalNote` を含めてはいけません。`ownerId` や `internalNote` を指定すると失敗し、保存された値は変わらないこと。
- 許可された顧客の割り当ては成功し、その後の読み取りでも見えること。隠された、または存在しない移動先は同じエラーになり、関連が保たれること。
- 割り当ての操作の注文と顧客の範囲を、それぞれ個別にクリアします。一方のコレクションへのアクセスで、もう一方を補えないこと。
- 操作を取り消してから、もう一度リクエストを送ります。古いセッションでも冪等な再試行でも、取り消されたアクセスが残らないこと。

[エンドポイント][tests] と [ブラウザーのテスト][browser-tests] のコマンドは、サンプルの README を参照してください。

## サンプルのソースとセットアップ

[完全な Customer Access アプリ][source] は、既定のテンプレート `1.0.0-beta.85`、Node.js 24、pnpm 11.7.0 を使います。ロックファイルで、認証 `2.0.0-beta.16`、認可 `1.0.0-beta.33`、データベース `1.0.0-beta.24` を含む依存関係を固定しています。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 5c9b1dcae021f4e4ae94416e783e3e84a71a1781
cd apps/customer-access
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

初回の起動の前に、ローカルの `config.yml` の `users.initialAdmin` で管理者を設定します。SQLite はこの例を自己完結させるためのもので、認証や認可の要件ではありません。このアプリでは、ほかのデータベースエンジンは検証していません。起動時に表示される、マウントパスを含む完全なアプリの URL を開きます。

管理者が Users で一般ユーザーを作成してロールを割り当てたら、アプリのディレクトリから、そのユーザーの架空のレコードを追加します。

```bash
pnpm nocobase app sample-customers --email alice@example.test --dry-run
pnpm nocobase app sample-customers --email alice@example.test
```

メールアドレスは既存のユーザーのものに置き換えます。このコマンドが追加するのは顧客と注文だけで、アカウントやロールの割り当ては作成しません。レコードは保存され、再実行しても名前付きのサンプルレコードは重複しません。2 人目のユーザーにも実行すると、それぞれのアクセス範囲を比較できます。

設定、使い方とソースの対応、テストのコマンド、検証の範囲については [README][readme] を参照してください。

[source]: https://github.com/nocobase/docs-examples-v3/tree/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access
[routes]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/server/routes/customer-access.ts
[auth-config]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/server/config/auth.ts
[permissions]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/server/access/permissions.ts
[authorize]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/server/access/authorize.ts
[provider]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/server/providers/customer-access.ts
[service]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/server/providers/customer-access-service.ts
[workspace]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/client/pages/settings/permission-workspace.ts
[client-routes]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/client/routes.ts
[assignment]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/client/pages/access/assignment.tsx
[customer-form]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/client/pages/access/customer-form.tsx
[roles]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/database/main/seeds/202610310001_customer_access_roles.ts
[list]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/client/pages/access/list.tsx
[tests]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/tests/server/customer-access.test.ts
[browser-tests]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/tests/playwright/customer-access.test.ts
[readme]: https://github.com/nocobase/docs-examples-v3/blob/5c9b1dcae021f4e4ae94416e783e3e84a71a1781/apps/customer-access/README.md
