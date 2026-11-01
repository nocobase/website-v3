---
title: クライアントのサービス
metaDescription: NocoBase のクライアントのサービスを登録して利用し、API Client を注入し、共有の状態を購読し、キャンセルと後片付けを管理します。
---

クライアントのサービスは、コンポーネントやページをまたいで操作を共有したり、状態の変化を調整したり、アプリレベルのリソースを管理したりします。業務操作をまとめることも、キャッシュや通知などの汎用的な機能を提供することもできます。ServiceProvider がそれらをアプリのコンテナに登録します。

製品カタログの例では、名前の変更をサービスに切り出しています。エディターがそれを呼び出し、一覧は変更の通知を受けて再読み込みし、2 つのカウンターが同じ状態を購読します。既定のテンプレート `1.0.0-beta.85` とその shadcn コンポーネントを使います。[ソースを取得して実行する](#サンプルのソースとセットアップ)。

## クライアントのサービスが役立つとき

独立した計算や書式化には通常の関数を、フォームの下書きや読み込み状態にはコンポーネントの状態や独自のフックを使います。React Context を使えば、コンポーネントツリー内でコンテキストを共有できます。複数のページで操作を再利用する、変更を調整する、独自のライフサイクルを持つリソースを共有する、といった場合にクライアントのサービスを検討します。

クライアントのサービスは、サーバーの業務ルールの代わりにはなりません。権限、データ範囲、トランザクション、最終的な検証は、引き続きサーバーに属します。基本的な API の呼び出しについては [データのリクエストと状態管理](data-requests-and-state.md) を参照してください。

## サービスを実装して登録する

### 操作と変更の通知をまとめる

`client/services/products.ts` では、コンストラクターで API Client を受け取ります。`rename()` は製品の ID、名前、リクエストのオプションを受け取り、API が成功したらカウンターを増やして購読者に通知します。

```ts
import type { ApiClient } from '@nocobase/app-client';

export interface Product {
  id: string;
  name: string;
  sku: string;
}
export type DemoMode = 'normal' | 'slow' | 'fail';
export interface RenameOptions {
  signal?: AbortSignal;
  mode?: DemoMode;
}

export class ProductsService {
  private revision = 0;
  private disposed = false;
  private readonly listeners = new Set<() => void>();
  constructor(private readonly api: ApiClient) {}
  getSnapshot = (): number => this.revision;
  subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) throw new Error('ProductsService has been disposed.');
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  async rename(
    id: string,
    name: string,
    options: RenameOptions = {},
  ): Promise<Product> {
    if (this.disposed) throw new Error('ProductsService has been disposed.');
    const response = await this.api.request<{ data: Product }>({
      method: 'PATCH',
      path: `clientServiceProducts/${encodeURIComponent(id)}`,
      json: { name },
      signal: options.signal,
      // This header controls this example's HTTP response, not a framework feature.
      headers: { 'x-demo-mode': options.mode ?? 'normal' },
    });
    if (!this.disposed) {
      this.revision += 1;
      for (const listener of this.listeners) listener();
    }
    return response.data;
  }
  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }
}
```

`getSnapshot()` はカウンターを返し、`subscribe()` は購読を解除する関数を返し、`dispose()` はリスナーをクリアして以降の通知を止めます。これらはアプリが定義したメソッドで、NocoBase のサービスの基底クラスから継承したものではありません。

`revision` は、このサービスが受け取った変更の成功レスポンスの数です。製品のレコードのバージョンでも、一覧のキャッシュでもありません。失敗または中止されたリクエストは呼び出し元に reject され、カウンターは増えません。購読のコールバックは軽い無効化だけを行い、非同期の更新での失敗はそこで処理すべきです。

リクエストのパスはアプリの API のベース URL からの相対パスで、デプロイのパスと `/api` の接頭辞は省きます。`x-demo-mode` ヘッダーはこの例の遅いレスポンスと失敗のレスポンスを制御するもので、API Client の機能ではありません。サンプルには対応するサーバーのエンドポイントが含まれています。クライアントのサービスを追加しても、エンドポイントは作成されません。

[サービスを見る](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/services/products.ts) · [デモの API を見る](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/server/routes/demo-products.ts)

### 共有のトークンを定義する

`client/services/tokens.ts` で、サービスの識別子を定義してエクスポートします。

```ts
import { createServiceToken } from '@nocobase/service-provider';
import type { ProductsService } from './products.js';
export const productsServiceToken =
  createServiceToken<ProductsService>('app.products');
```

登録と利用側は、同じトークンをインポートする必要があります。`createServiceToken('app.products')` をもう一度呼び出すと、同じ名前でも別の識別子が作られます。

[トークンを見る](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/services/tokens.ts)

### ServiceProvider を登録し、依存関係を注入する

`client/providers/products.ts` で、アプリの既存の API Client を解決するファクトリーを登録します。

```ts
import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';
import { ProductsService } from '../services/products.js';
import { productsServiceToken } from '../services/tokens.js';
export class ProductsServiceProvider extends ServiceProvider<ClientApplication> {
  readonly name = 'app.products';
  override register(): void {
    this.app.container.singleton(
      productsServiceToken,
      (services) => new ProductsService(services.resolve(apiClientToken)),
    );
  }
  override async shutdown(): Promise<void> {
    this.app.container.resolveIfCreated(productsServiceToken)?.dispose();
  }
}
```

`singleton()` は最初の解決時にインスタンスを作成し、同じコンテナでの以降の解決ではそのインスタンスを返します。登録は依存関係を宣言するだけで、リクエストを始めたり、ページの DOM にアクセスしたりはしません。終了時の後片付けは [購読を解除してリソースを解放する](#購読を解除してリソースを解放する) で説明します。

`client/service-provider.ts` の既存の配列に Provider を追加します。

```ts
import { ProductsServiceProvider } from './providers/products.js';

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  DefaultClientServiceProvider,
  ProductsServiceProvider,
];

export default serviceProviders;
```

これは部分的な編集です。既存の型のインポート、`DefaultClientServiceProvider`、ほかの Provider は残してください。既定の Provider は、Toast とドキュメントのタイトルの動作も提供しています。テンプレートの `client/runtime.ts` は、すでにこの集約の入口を読み込んでいます。`services/` と `providers/` のディレクトリはソースファイルを整理するだけで、自動で登録はしません。

[Provider を見る](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/providers/products.ts) · [登録の入口を見る](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/service-provider.ts)

## ページからサービスを呼び出す

### 変更を送信し、失敗を処理する

コンポーネントや独自のフックのトップレベルで `useService(productsServiceToken)` を呼び出し、送信のハンドラーでサービスのメソッドを呼び出します。イベントのコールバック内でフックを呼び出したり、レンダリングのたびに新しいサービスを作成したりしないでください。

エディターは、下書き、送信中の状態、フィードバックを持ちます。この抜粋は状態と送信のロジックを示しています。`product` は選択したレコードで、`mode` は **Response mode** から来ます。マウントとアンマウントの処理は次のセクションで扱います。

```tsx
// Inside ProductEditor. Imports, validation and form markup are in the full source.
const products = useService(productsServiceToken);
const [name, setName] = useState(product.name);
const [pending, setPending] = useState(false);
const [feedback, setFeedback] = useState('');
const activeRef = useRef<AbortController | null>(null);
const mountedRef = useRef(false);

async function submit(event: FormEvent) {
  event.preventDefault();
  // Name validation is omitted here.
  if (activeRef.current) return;
  setFeedback('');
  setPending(true);
  const controller = new AbortController();
  activeRef.current = controller;
  try {
    const saved = await products.rename(product.id, name.trim(), {
      signal: controller.signal,
      mode,
    });
    if (mountedRef.current) {
      setName(saved.name);
      setFeedback('saved');
    }
  } catch {
    if (mountedRef.current)
      setFeedback(controller.signal.aborted ? 'cancelled' : 'failed');
  } finally {
    activeRef.current = null;
    if (mountedRef.current) setPending(false);
  }
}
```

完全なフォームは名前を検証し、送信中は入力と保存を無効にし、`activeRef` で重複した送信を防ぎます。失敗しても `name` はそのまま残り、ページがフィードバックのキーを翻訳します。業務アプリでは、フィールドの検証、権限の失敗、そのほかの API エラーも区別すべきです。

`/service-products` を開き、製品の行の **Edit** をクリックして名前を変え、**Save changes** をクリックします。一覧に新しい名前が表示され、2 つの **Successful changes** のカウンターが増えます。

![保存後、製品一覧と 2 つのカウンターが更新されます](/assets/core/client-services/saved.png)

**Response mode** を **Fail** にして、もう一度保存します。エラーメッセージが表示され、下書きは残り、一覧もカウンターも変わりません。

![失敗したリクエストでは、下書きと既存のカウンターが保たれます](/assets/core/client-services/failed.png)

[エディターの全体を見る](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/pages/service-products/editor.tsx)

### ページが所有するリクエストをキャンセルする

ページは、自分が始めたリクエストを所有します。`AbortSignal` をサービス経由で API Client に渡し、アンマウント時にキャンセルして、アンマウントされたコンポーネントを更新しないようにします。

```tsx
// Inside ProductEditor, using the refs declared above.
useEffect(() => {
  mountedRef.current = true;
  return () => {
    mountedRef.current = false;
    activeRef.current?.abort();
  };
}, []);

// The cancel button in the form:
<Button
  variant="outline"
  type="button"
  onClick={() => activeRef.current?.abort()}
>
  {t('serviceProducts.cancel')}
</Button>
```

**Slow (3 seconds)** を選んで保存します。入力が無効になり、**Saving…** と **Cancel request** が表示されます。キャンセルするとクライアントは待つのをやめ、カウンターは増えません。

![保留中のレスポンスはキャンセルできます](/assets/core/client-services/pending.png)

キャンセルしても、サーバーが変更を取り消すとは限りません。この例では、レスポンスを遅らせる前に、わざとメモリ上のレコードを更新しています。キャンセルしたあとに **Refresh list** をクリックすると、サーバーに保存された名前が表示されます。業務上の変更を取り消すには、別のサーバーの操作が必要です。

![キャンセル後に再読み込みすると、サーバーにすでに保存された名前が表示されます](/assets/core/client-services/cancelled.png)

[キャンセルとアンマウント時の後片付けを見る](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/pages/service-products/editor.tsx)

## サービスが変わったら複数のビューを更新する

### useSyncExternalStore で購読する

`useService()` はインスタンスを解決するだけで、そのフィールドを監視しません。サービスの状態が変わったときにコンポーネントを再レンダリングするには、`useSyncExternalStore` で購読とスナップショットを接続します。

```ts
import { useService } from '@nocobase/app-client';
import { useSyncExternalStore } from 'react';
import { productsServiceToken } from '../services/tokens.js';
export function useProductRevision(): number {
  const products = useService(productsServiceToken);
  return useSyncExternalStore(products.subscribe, products.getSnapshot);
}
```

2 つの `ChangeCounter` コンポーネントはどちらもこのフックを使います。コンポーネントのインポートはここでは省いています。実装の全体は下のリンクを参照してください。

```tsx
function ChangeCounter({ title }: { title: string }) {
  const { t } = useTranslation();
  const count = useProductRevision();
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <p role="status">{t('serviceProducts.count', { count })}</p>
      </CardContent>
    </Card>
  );
}
```

保存すると 2 つの購読者に通知され、React がスナップショットを読み直し、[保存後の状態](#変更を送信し失敗を処理する) のように両方のカウンターが更新されます。コンポーネントがアンマウントされると、React は `subscribe()` が返した後片付けの関数を呼び出します。

状態が変わらない間、スナップショットは安定している必要があります。この例では数値を返しています。オブジェクトのスナップショットでは、読み取りのたびに新しく作るのではなく、変わっていない値を再利用します。この例はブラウザーでレンダリングします。サーバーでレンダリングする場合は、適切な `getServerSnapshot` も必要です。[React の useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) を参照してください。

[購読のフックを見る](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/hooks/use-product-revision.ts) · [カウンターを見る](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/pages/service-products/index.tsx)

### 通知を購読して一覧を再読み込みする

一覧は、一覧全体をサービスに保存しなくても、再読み込みの操作を直接購読できます。この例では、初回の読み込み、キャンセル、古いレスポンスを扱うテンプレートの `useListData` を再利用しています。

```ts
import { useService } from '@nocobase/app-client';
import { useEffect } from 'react';
import { useListData } from './use-list-data.js';
import { productsServiceToken } from '../services/tokens.js';
import type { Product } from '../services/products.js';
export function useProducts() {
  const products = useService(productsServiceToken);
  const request = useListData<{ data: Product[] }>('clientServiceProducts');
  const { reload } = request;
  useEffect(() => products.subscribe(reload), [products, reload]);
  return {
    rows: request.data?.data ?? [],
    loading: request.loading,
    failed: Boolean(request.error),
    reload,
  };
}
```

マウントすると、過去の通知に依存せずに一覧を読み込み、アンマウントすると購読を解除します。保存ではこの 1 つの更新経路を使うため、送信のハンドラーで `reload()` も呼び出すことはしません。結果は [保存後の状態](#変更を送信し失敗を処理する) のとおりです。

これらの通知が対象にするのは、このサービスを通じて行われた成功した変更だけです。ほかのユーザーやブラウザーからの変更には、手動での更新かリアルタイムの組み込みが必要です。

[一覧の購読を見る](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/hooks/use-products.ts) · [テンプレートの一覧のフックを見る](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/hooks/use-list-data.ts)

## サービスのライフサイクルを管理する

### シングルトンの範囲を理解する

コンテナのシングルトンは、現在のブラウザーのアプリのインスタンスに属します。同じトークンを解決するコンポーネントは、1 つのサービスを共有します。ページの再読み込み、別のタブ、別のアプリのコンテナには、それぞれ独自のインスタンスがあります。

この例を再読み込みすると、2 つのカウンターはリセットされますが、製品名はサーバーのメモリに残っています。サーバーを再起動すると、初期の製品に戻ります。クライアントのサービスの寿命と、サーバーのデータの保持は別の問題です。

2 つ目のタブを開くと、そのカウンターは 0 から始まり、別のタブでの成功した変更で一覧が自動で更新されることはありません。**Refresh list** で製品を読み直します。

React の Provider は `client/react-providers.ts` でコンポーネントツリーのコンテキストを提供し、ServiceProvider は `client/service-provider.ts` でコンテナのサービスを登録します。サービスを呼び出すのに、追加の React の Provider は必要ありません。あとで身元に依存するキャッシュを追加する場合は、身元が変わったときにキャッシュしたデータと実行中のリクエストをクリアしてください。

### 購読を解除してリソースを解放する

ページはアンマウント時に、購読とリクエストを片付けます。サービスは自分が所有するリソースを解放します。終了時、この例の Provider は次を呼び出します。

```ts
this.app.container.resolveIfCreated(productsServiceToken)?.dispose();
```

`resolveIfCreated()` はすでに作成されたインスタンスだけを返すため、終了時に使われていないサービスを組み立てることを避けられます。ここでの `dispose()` はリスナーをクリアし、保留中のリクエストがあとで通知を発行しないようにします。アプリで共有している API Client は閉じません。

**Hide second view** をクリックして 2 つ目のカウンターをアンマウントしてから、製品を保存します。1 つ目のカウンターは引き続き更新されます。**Show second view** をクリックすると、新しいコンポーネントがマウントされ、次の保存を待たずにすぐに現在のスナップショットを読み取ります。

![2 つ目のビューをアンマウントしたあとも、残ったカウンターは更新されます](/assets/core/client-services/unmounted.png)

サービスが接続、タイマー、バックグラウンドのリクエストを作成する場合は、それらも閉じるかキャンセルする必要があります。コンテナの取り決めとライフサイクルの順序については、[サービスコンテナ](../framework/services/container.md) と [ServiceProvider とサービスのライフサイクル](../extension-development/service-provider.md) を参照してください。

[破棄の処理を見る](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/client/providers/products.ts) · [シングルトン、購読の解除、終了のテストを見る](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/tests/client/products-service.test.ts)

## サンプルのソースとセットアップ

[サンプルの全体と README](https://github.com/nocobase/docs-examples-v3/blob/36708ad5b081835c6ab206cdc5ec1a40618971f3/apps/client-business-services/README.MD) には、Node.js 24 以降と pnpm 11 が必要です。依存関係のバージョンは `pnpm-lock.yaml` で固定されています。別のディレクトリで実行します。

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 36708ad5b081835c6ab206cdc5ec1a40618971f3
cd apps/client-business-services
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite --json
pnpm nocobase config check --json
pnpm dev
```

起動時に表示されるアプリの URL に `service-products` を付けます。ベース URL が `/main/` で終わる場合は、`/main/service-products` を開きます。デモのページにはログインは不要です。SQLite は、この単独の例でテンプレートの機能を起動するためのものです。クライアントのサービスは特定のデータベースに依存しません。既存のアプリでは、独自の設定をそのまま使ってください。

この例は実際の API Client と HTTP のエンドポイントを使いますが、製品はサーバーのメモリにしか保存しません。公開のデモ API で名前を変えられるのは 3 つの固定の製品だけで、実際の業務データにはアクセスせず、身元の権限やデータベースへの保存も示していません。業務アプリでは、サーバーの既存の認証、認可、データアクセスの仕組みを使ってください。

サンプルのアプリのルートで、サービス、ページ、API のテストを実行します。

```bash
pnpm exec vitest run tests/client/products-service.test.ts tests/client/service-products.test.tsx tests/server/demo-products.test.ts
```

テストの詳細とブラウザーの自動化のコマンドは、サンプルの README を参照してください。
