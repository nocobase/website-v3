---
title: データのリクエストと状態管理
description: アプリの API Client、テンプレートの一覧のフック、useSubmission を使い、照会を同期し、リクエストの競合を処理し、送信を復旧し、保存したデータを更新します。
---

Customer Directory の例では、検索、ページネーション、詳細、編集を通してデータを追います。照会の条件は URL に、レコードはサーバーから、保存していないフィールドはフォームに置きます。実際のデータベース、アプリの権限、変更の受付記録を使い、デモ用の制御で遅いリクエスト、拒否される書き込み、失われたレスポンスを発生させます。[ソースとセットアップ](#サンプルのソースとセットアップ) は最後にあります。

この記事では既定のテンプレート `1.0.0-beta.85` を使います。`useApiClient` と `useSubmission` は `@nocobase/app-client` のエクスポートです。`useListData`、`useListLocation`、`useTableUrlState` はアプリの `client/hooks/` ディレクトリに生成されるソースファイルで、調整できます。画面は shadcn の慣習に従い、テンプレートの `DataTable`、ルートのダイアログ、ドロワーを使います。コンポーネントの組み込みについては [UI コンポーネントと操作](pages-and-interactions.md) を参照してください。

## アプリの API Client を使う

### クライアントを取得して業務のエンドポイントを呼び出す

コンポーネントやフックの中で `useApiClient()` を呼び出し、クライアントを通常の関数に渡します。クライアントはすでにアプリの API のアドレスとセッションの設定を使っているため、ページで別のクライアントやデプロイの接頭辞を用意する必要はありません。

これは最小限の顧客の詳細のリクエストです。サンプルの詳細ページでは、下で紹介する `useListData` でそのライフサイクルを管理しています。

```ts
import { useApiClient } from '@nocobase/app-client';
import type { Customer } from './api.js';

const api = useApiClient(); // Inside a component or hook
const response = await api.request<{ data: Customer }>({
  path: `customerRecord/${encodeURIComponent(id)}`,
  signal,
});
const customer = response.data;
```

`path` はアプリの API のルートからの相対パスで、`/api` と `/main` は省きます。`request<T>()` はレスポンスのボディ全体を返します。ここでの `data` は業務のエンドポイントが定義したフィールドです。ジェネリクスは期待する型を記述するだけで、実行時にレスポンスを検証はしません。`id` はルートのパラメーターから、`signal` は現在のリクエストの `AbortController` から来ます。

**Customer directory** で **Alpine Goods** をクリックします。ドロワーは `GET customerRecord/:id` で保存されたレコードを読み取ります。この例ではサーバーでこのエンドポイントを実装しています。クライアントから呼び出しても、エンドポイントは生成されません。

![API が返した顧客の詳細](/assets/core/developing-apps/data-requests-and-state/detail.png)

出典：[詳細ページ](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/detail.tsx)、[業務のエンドポイント](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/server/routes/customers.ts)。一般的なリクエストのオプションについては [API Client](../framework/http/api-client.md) を参照してください。

### Repository のデータエンドポイントを呼び出す

サーバーが Repository のデータエンドポイントを登録したら、`api.repository<Customer>('customers')` でそのプロトコルを呼び出します。この例の更新の操作は `client/pages/customers/api.ts` にあります。

```ts
const result = await api.repository<Customer>('customers').updateOne({
  filter: { id },
  values,
  idempotencyKey: key,
  signal,
});
return result.record;
```

Repository のクライアントは、`request()` で使う `response.data` ではなく、レコードを `result.record` に持つ処理済みの結果を返します。`values` には保存するフィールドが入ります。`key` と `signal` は、下で扱う `useSubmission` から来ます。標準の書き込みのエンドポイントには、操作のキーと、テンプレートですでに登録されている送信の受付記録の Provider が必要です。

詳細のドロワーで **Edit customer** をクリックし、連絡先を変えて保存します。実際のリクエストは `POST customers/updateOne` です。作成と削除には `createOne` と `deleteOne` を使い、それぞれその論理的な送信のキーを付けます。認証、業務上の権限、許可するフィールド、入力の検証は、引き続きサーバーの責任です。

![顧客の編集ダイアログ](/assets/core/developing-apps/data-requests-and-state/edit.png)

出典：[リクエストと書き込みのヘルパー](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/api.ts)。サーバーでの登録については [Repository のデータエンドポイント](../framework/http/repository-routes.md) を参照してください。

## 一覧を読み取り、照会の条件を同期する

### useListData で読み取りと更新を行う

`useListData` はリクエストのパスを受け取り、その結果、エラー、更新の操作を公開します。これは `useCustomerList` の中心となる呼び出しです。`query` には、現在の検索、ステータス、ページネーション、並べ替えのパラメーターが入ります。

```ts
import { useListData } from '#hooks/use-list-data';
import type { CustomerList } from './api.js';

const request = useListData<CustomerList>(`customerList?${query}`, { active });
// request.data: { data: Customer[], meta: { total: number } } | undefined
// request.loading / request.error / request.reload()
```

一覧を開くと `GET customerList` を読み取ります。**Refresh** は現在の照会を読み直します。レコードはデータベースから来るため、保存した変更はページを再読み込みしても残ります。`reload()` が影響するのはこのフックのインスタンスだけで、ほかのページを更新したり、共有の照会のキャッシュを提供したりはしません。

![ページネーション付きの顧客一覧](/assets/core/developing-apps/data-requests-and-state/list.png)

出典：[一覧のフック](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/use-customer-list.ts)、[useListData](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/hooks/use-list-data.ts)。

### 検索、ページネーション、並べ替えを URL に置く

`useListLocation()` は一覧独自の照会のパラメーターを提供します。`readTableUrlState()` はページ、ページあたりの件数、並べ替えを解析し、`useTableUrlState()` はテーブルの操作を URL に書き戻します。この例では、サーバーがサポートする 4 つの並べ替えのフィールドと、5、10、20 のページあたりの件数だけを許可しています。

検索の入力は、読者が **Search** をクリックするか Enter を押すまでローカルにとどまります。検索やステータスが変わったら、既存のパラメーターをコピーして `page` を削除し、並べ替えとページあたりの件数を保ったまま 1 ページ目に戻ります。

```ts
setParams((old) => {
  const next = new URLSearchParams(old);
  if (value) next.set('q', value);
  else next.delete('q');
  next.delete('page');
  return next;
}, { replace: true });
```

`Al` を検索し、**Active** を選んでから、ページあたりの件数と並べ替えを変えます。次のようなアドレスにより、再読み込み後も照会が復元されます。このパスは、アプリの実際のマウントパスに付けてください。

```text
/customers?q=Al&status=active&pageSize=5&sort=name&order=desc
```

![検索とステータスで絞り込み、URL で並べ替えた顧客](/assets/core/developing-apps/data-requests-and-state/query.png)

出典：[URL と一覧のパラメーター](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/use-customer-list.ts)、[テーブルの URL の状態](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/hooks/use-table-url-state.ts)。

### 覆われたルートを一時停止し、戻ったときに一覧を復元する

詳細や編集の子ルートが一覧を覆っている間、`useListLocation()` は一覧のパラメーターを保ち、`active: false` を返します。これを `useListData` に渡すと、子ルートが閉じるまでバックグラウンドの一覧のリクエストが一時停止します。この状態での `loading: true` は、リクエストが実行中であることを意味するとは限りません。更新のフィードバックでは `active` も確認する必要があります。

この例では、クエリー文字列付きの相対リンクで詳細のルートに入り、続いてその編集に入ります。

```tsx
<RecordLink to={`${customer.id}${search}`}>{customer.name}</RecordLink>
// Inside the detail page
<Link to={`edit${search}`}>...</Link>
```

絞り込んだ一覧から **Alpine Goods** を開き、編集して保存してから、詳細のドロワーを閉じます。検索、ステータス、ページあたりの件数、並べ替えは変わらないはずです。ドロワーは [クライアントを取得して業務のエンドポイントを呼び出す](#クライアントを取得して業務のエンドポイントを呼び出す) を、その編集の層は [Repository のデータエンドポイントを呼び出す](#repository-のデータエンドポイントを呼び出す) を参照してください。

これらのフックは、テンプレートのルーティングのコンテキストに依存します。そのルートツリーの外にあるページでは、独自のルーターからパラメーターと有効状態を導き出す必要があります。出典：[一覧ページと Outlet](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/index.tsx)、[useListLocation](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/hooks/use-list-location.ts)。

## リクエストの状態とエラーを処理する

### 読み込み、空の結果、更新中

ページはリクエストの状態を `DataTable` の `listState` に対応付け、「まだ読み込んでいない」と空の結果を区別します。

| 状況 | この例での動作 |
| --- | --- |
| 結果がない状態での最初の読み取り | 読み込み中のフィードバックを表示する |
| 読み取りに成功したが、一致するレコードがない | No results と、フィルターをクリアする操作を表示する |
| 既存のデータがある状態で同じ照会を更新する | 行を残したまま、更新中であることを示す |
| 照会の条件が変わった | 既定では、前の照会の行を表示せずに新しい照会を待つ |

**Request demonstrations** を展開し、**Slow response (1.6 seconds)** を選ぶと読み込み中の状態が見られます。レコードが表示されたら **Refresh** をクリックすると、更新中も既存の行が残る様子が見られます。

![遅い一覧のリクエストを読み込んでいる状態](/assets/core/developing-apps/data-requests-and-state/loading.png)

![同じ照会を更新している間も行を表示したままにする](/assets/core/developing-apps/data-requests-and-state/refreshing.png)

`NoSuchCustomer` を検索すると、一致するレコードが 0 件の成功レスポンスが返ります。

![一致する結果がない、成功した検索](/assets/core/developing-apps/data-requests-and-state/empty.png)

出典：[一覧の状態の対応付け](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/index.tsx)。デモ用の制御には、最後に説明するとおり、起動時に `CUSTOMER_DEMO_FAULTS=1` が必要です。

### 古いリクエストをキャンセルし、順序が乱れた結果を無視する

`useListData` は、パスが変わったときやコンポーネントがアンマウントされたときに古い読み取りを中止し、レスポンスがまだ現在のリクエストの世代に属しているかを確認します。`reload()` は、次の読み取りを始める前に、前のリクエストを同期的に無効にします。キャンセルと結果の所属の両方が重要です。最後に届いたレスポンスをそのまま受け入れると、競合が生じます。

**Out-of-order responses** を選び、`A` を検索してから、すぐに `Al` を検索します。この例では、最初の読み取りを 1.8 秒、2 つ目を 0.15 秒遅らせます。一覧は `Al` の結果のままでなければなりません。表示される結果は [検索、ページネーション、並べ替えを URL に置く](#検索ページネーション並べ替えを-url-に置く) と同じです。スクリーンショットではレスポンスの順序は確認できません。ページのテストで、両方のレスポンスが解決するタイミングを制御し、古い行が一度も表示されないことをアサートしています。

出典：[リクエストのライフサイクル](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/hooks/use-list-data.ts)、[競合のテスト](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/tests/client/customers.test.tsx)。ブラウザーのリクエストを中止しても、サーバーがすでに行った書き込みはロールバックされません。

### リクエストの失敗、再試行、権限の変更

**Read failure** を選ぶと、サーバーがデモ用の 503 を返します。**Retry** で読み取りを通常に戻します。同じ照会の更新が失敗した場合、フックは既存の結果をエラーとともに残します。401、403、404 では古い結果をクリアし、ページはセッションの終了、アクセスの拒否、レコードが利用できないことを説明します。

![再試行の操作がある読み取りの失敗](/assets/core/developing-apps/data-requests-and-state/read-error.png)

`ApiClientError.status`、`reason`、`domain` を翻訳されたアプリのメッセージに対応付け、ネットワークの例外は別に扱います。サーバーの開発者向けの `error.message` をそのまま表示しないでください。トラブルシューティングに必要な場合は、`requestId` を記録します。

権限のデモでは、組み込みの **Users** と **Permission management** を使います。一般ユーザーに **Customer viewer** を割り当て、そのユーザーで一覧を開きます。管理者として、ページへのアクセスは残したまま顧客の閲覧の操作を取り消し、そのユーザーのセッションで **Refresh** をクリックします。古いレコードは消え、API を直接読み取っても 403 が返るはずです。編集者は **Customer editor** を使います。どちらのロールも、すべてのユーザーに自動では割り当てられません。

![業務上の閲覧の付与が取り消されたあと、古い顧客データをクリアする](/assets/core/developing-apps/data-requests-and-state/permission.png)

出典：[エラーの対応付け](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/api.ts)、[サーバーの認可](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/server/routes/customers.ts)、[権限のブラウザーテスト](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/tests/playwright/customers.test.ts)。ページへのアクセスとデータの操作は別々に付与されます。ボタンを隠しても、エンドポイントは保護されません。

## 変更を送信してページを更新する

### useSubmission で送信と重複した試行を管理する

フォームごとに 1 つの `useSubmission` を使い、すべての送信の入口を同じ `run()` に通します。コントローラーは同期のロックを取得し、入力のスナップショットを取り、操作のキーを作成します。繰り返しクリックしたり Enter を押したりしても、並行した送信は始まりません。送信中のフィードバックには `submitting` を使い、送信中のフィールドの編集を防ぎます。

この抜粋はエディターの送信の中心部分で、フォーム、エラーの表示、デモ用の制御は省いています。

```ts
import { useSubmission } from '@nocobase/app-client';

const submission = useSubmission({
  scope: `${session?.user.id}:customers:${id ?? 'new'}`,
});
const saved = await submission.run(
  { id, ...values },
  async (key, signal, input) => {
    const { id: recordId, ...fields } = input;
    return saveCustomer(api, fields, recordId, key, signal);
  },
);
```

`scope` は、未解決の送信を復旧するときに、身元、操作、フォームのインスタンスを区別します。独立したフォームで共有してはいけません。この例では、ブラウザーのタブごとに対応するルートのエディターを 1 つだけ開きます。サーバーでは、標準の Repository の書き込みとその受付記録が同じトランザクションでコミットされます。同じキーと入力で再試行すると、元の結果を返せます。

作成または編集のダイアログで **Submission demonstrations** を展開し、**Slow submission (1.6 seconds)** を選びます。保存中に繰り返し送信を試みます。ページは送信中のままで、データベースが受け取る書き込みは 1 回だけのはずです。

![遅い送信の間、フィールドと保存の操作がロックされます](/assets/core/developing-apps/data-requests-and-state/submitting.png)

出典：[エディターと送信のコントローラー](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/edit.tsx)、[テンプレートの送信の Provider](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/server/providers/submission.ts)。副作用のある独自の業務 API では、受付記録のトランザクションに明示的に参加する必要があります。ヘッダーを付けるだけでは同じ保証は得られません。

### 失敗した下書きを残し、結果が不明な送信を再試行する

新しい顧客を入力し、**Reject before saving** を選んで保存します。エンドポイントは保存の前に書き込みを明示的に拒否します。フィールドの値は残っているので、**Normal submission** に戻して編集し、もう一度送信できます。

![書き込みが拒否されたあとも下書きを残す](/assets/core/developing-apps/data-requests-and-state/draft.png)

**Lose response after saving** では、実際の書き込みと受付記録をコミットしてから 503 を返し、クライアントが確実な結果を受け取れない状況を再現します。`submitting` は終わりますが、`pending` は true のままです。元のフィールドはそのままにして **Retry original submission** をクリックすると、元のキーと入力で結果を復旧します。新しいキーを作って別の作成を送信しないでください。

![結果が不明な状態と、元の送信を復旧する操作](/assets/core/developing-apps/data-requests-and-state/uncertain.png)

`pending` は「リクエストが実行中」という意味ではありません。ネットワークの失敗、タイムアウト、あいまいなサーバーエラーでは、未解決の操作が残ることがあります。失敗のレスポンスだけでは、何も保存されなかったことの証明にはなりません。ページを再読み込みすると、コントローラーはタブのセッションストレージからキーと入力のダイジェストを復旧できますが、**フォームの下書きは復元しません**。この例では元の値をもう一度入力する必要があり、異なる入力で新しい操作を始めることは拒否します。

出典：[フォームと復旧のフィードバック](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/edit.tsx)、[コミット済みの書き込みでレスポンスが失われるテスト](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/tests/server/customers.test.ts)。保存していない変更の確認は [UI コンポーネントと操作](pages-and-interactions.md) に従います。ダイアログを閉じても、書き込みはロールバックされません。

### 保存後に詳細を更新し、一覧を再読み込みする

エディターが保存の成功結果を受け取ると、Outlet のコンテキストを通じて親の更新の操作を呼び出し、編集の層を閉じます。詳細ページは、自分とバックグラウンドの一覧の両方を更新する操作を提供します。

```tsx
<Outlet context={{
  reload: () => {
    request.reload(); // Current details
    parent.reload();  // Customer list
  },
}} />
```

詳細のドロワーで連絡先を編集して保存します。エディターが閉じ、ドロワーが最新のフィールドを読み取ります。ドロワーを閉じると、保たれた照会で一覧が再開します。作成、削除、並べ替えのフィールドの変更では、位置や件数が変わることがあります。照会を読み直せば、1 行の置き換えより広い範囲に対応できます。

![保存後に更新された顧客の詳細](/assets/core/developing-apps/data-requests-and-state/saved-detail.png)

保存と更新は別々に扱います。書き込みは成功したのにその後の読み取りが失敗した場合は、書き込みの再送信を求めるのではなく、読み取りのフィードバックと更新の操作を提供します。出典：[親の更新の操作](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/detail.tsx)、[保存の完了](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/edit.tsx)。

### 削除後にページネーションを補正し、照会の条件を保つ

削除後は現在の照会を更新し、その成功した読み取りの件数を `useTableUrlState` に渡します。更新中に古い件数でページネーションを補正すると、間違ったページを選ぶことがあります。

```ts
const table = useTableUrlState({
  ...tableOptions,
  active,
  revision: request.revision,
  rowCount: !request.loading && !request.error
    ? request.data?.meta.total
    : undefined,
});
```

共通の接頭辞を持つ名前で 6 人の顧客を作成し、その接頭辞で検索して 1 ページあたり 5 行にし、2 ページ目の唯一のレコードを削除します。一覧は検索、ステータス、並べ替えを保ったまま 1 ページ目に戻るはずです。自動テストは、自分専用の 6 件のレコードを作成して片付けます。

![現在のページのレコードの削除を確認する](/assets/core/developing-apps/data-requests-and-state/delete.png)

![照会を保ったまま有効なページに戻る](/assets/core/developing-apps/data-requests-and-state/corrected-page.png)

出典：[削除](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/delete.tsx)、[件数とページの補正](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/client/pages/customers/use-customer-list.ts)。

## 操作とデータの結果を検証する

### 読み取り、送信、戻る流れを検証する

まず検索、ページ移動、詳細の表示、編集、保存、戻る操作を行います。次に、デモ用の制御で失敗の経路を確認します。

- `A` と `Al` の検索をすばやく送信し、`Al` の結果だけが残ること。
- 失敗した読み取りは再試行できる。通常の更新の失敗では現在の照会のデータが残り、403 では古いレコードがクリアされること。
- 拒否された書き込みでは下書きが残る。失われたレスポンスを再試行しても、2 つ目の顧客レコードは作成されないこと。
- 保存後に戻っても照会の条件が保たれる。最後のページの最後の行を削除しても、有効なページが残ること。
- 閲覧者には書き込みの操作がなく、直接の書き込みは拒否される。閲覧の操作を取り消すと、読み取りが 403 を返すこと。

スクリーンショットで見た目の状態を比較できます。重複した書き込み、権限、保存は、API のレスポンスとデータベースの結果で検証します。サンプルのブラウザーテストでは、変更のあるエディターから離れる操作と、狭いビューポートも確認しています。

### テストとビルドを実行する

サンプルのアプリのディレクトリで実行します。

```bash
pnpm exec vitest run tests/client/customers.test.tsx tests/client/list-recovery.test.tsx tests/client/table-url-state.test.tsx tests/server/customers.test.ts tests/server/authorization-assignment-safety.test.ts tests/database/customers.test.ts
pnpm typecheck
pnpm build
```

ページのテストはアプリのフックを実物のままにし、ネットワークの境界だけを差し替えます。サーバーのテストは分離したデータベースで、実際のルート、認可、書き込み、受付記録を動かします。マイグレーションのテストは作成とロールバックを検証します。ブラウザーのテストは、動作中のサンプルに接続します。[README](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/README.md) の説明に従って `APP_URL`、`E2E_USERNAME`、`E2E_PASSWORD` を設定してから、次を実行します。

```bash
pnpm exec playwright test tests/playwright/customers.test.ts
```

## サンプルのソースとセットアップ

### サンプルのアプリの全体

[Customer Directory のソース](https://github.com/nocobase/docs-examples-v3/tree/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory) には、一覧、詳細、編集のルート、実際の API、データベースのマイグレーション、サンプルデータ、テストが含まれます。その [README](https://github.com/nocobase/docs-examples-v3/blob/0db1a6aade41a18757f5a709aacd2df695fcf7f8/apps/customer-directory/README.md) は、ドキュメントの各使い方を、入口、実装ファイル、期待される結果に対応付けています。

この例が管理するのは、名前、連絡先、メールアドレス、ステータスだけです。遅延、明示的な拒否、失われたレスポンスはデモ用に制御された条件で、読み取り、書き込み、権限の判定、変更の受付記録は実際のアプリの仕組みを使います。

### 要件と起動

Node.js 24 以降と pnpm 11.11.0 を使います。依存関係のバージョンはロックファイルで固定されています。これらのコマンドはすぐに始められるよう SQLite を使っていますが、それはこの例での選択で、API Client やフックの前提条件ではありません。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 0db1a6aade41a18757f5a709aacd2df695fcf7f8
cd apps/customer-directory
npm pkg set packageManager=pnpm@11.11.0
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
APP_SAMPLE_DATA=true CUSTOMER_DEMO_FAULTS=1 pnpm dev
```

初期設定で `config.yml` が作成されます。その `users.initialAdmin` の設定でサインインします。起動時に表示されるアプリのアドレスを開き、マウントパスに `/customers` を付けるか、メニューで **Customer directory** を選びます。`APP_SAMPLE_DATA=true` は架空の英語の顧客レコードをインストールします。書き込みは保存され、アプリを再び起動してもリセットされません。一般ユーザーには **Users** で **Customer viewer** または **Customer editor** を割り当てます。

LAN からアクセスする場合は、README の説明に従って `APP_SERVER_HOST` と `APP_PUBLIC_ORIGIN` を設定します。障害のスイッチを無効にすると追加のデモの動作がなくなり、通常の読み取りと書き込みはそのまま使えます。
