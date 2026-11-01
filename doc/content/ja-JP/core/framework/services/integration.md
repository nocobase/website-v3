---
title: クライアントとサーバーのサービスの組み込み
description: 共有のサービスの取り決めをクライアントとサーバーのコンテナに組み込み、アプリ、プラグイン、リクエスト、コンポーネントの所有を明確にします。
---

`@nocobase/service-provider` は、同じコンテナ、トークン、ライフサイクルの仕組みをアプリとプラグインに提供します。ブラウザーとサーバーはそれぞれ別のコンテナを所有し、取り決めを共有してもネットワークをまたいでインスタンスが共有されることはありません。

## 登録と利用の場所を選ぶ

| 場所 | 登録 | 利用 |
| --- | --- | --- |
| アプリのクライアント | アプリのクライアントの ServiceProvider。ランタイムで接続する | React では `useService()`、通常のサービスではコンストラクターの引数 |
| プラグインのクライアント | `client/plugin.ts` の `serviceProviders` | 公開のトークンをインポートし、現在のクライアントのコンテナを使う |
| アプリのサーバー | アプリの Provider の集約。ランタイムで接続する | `app.container.resolve()` で解決し、依存関係を業務コードに渡す |
| プラグインのサーバー | `server/plugin.ts` の `serviceProviders` | ホストのコンテナと、アプリが管理するライフサイクルを使う |

アプリの Provider は、一般に `client/service-provider.ts` と `server/providers/index.ts` に集めます。現在のランタイムが参照しているファイルに従ってください。ファイルが存在するだけでは登録されません。組み込みの手順については、[クライアントのサービス](../../developing-apps/client-business-services.md)、[サーバー側のサービス](../../developing-apps/server-business-services.md)、[プラグインの宣言](../../extension-development/plugin-declarations.md) を参照してください。

## クライアントのサービス

クライアントのサービスは、ページをまたぐ業務の動作、リクエストのラッパー、共有の状態を持ちます。コンポーネントはそれを表示し、サービスは独立して呼び出せる動作を公開します。フォームの一時的な入力は、通常コンポーネントや React Context に置きます。

### 状態を購読できるようにする

```ts
import type { ClientApplication } from '@nocobase/app-client';
import { useService } from '@nocobase/app-client';
import { ServiceProvider, createServiceToken } from '@nocobase/service-provider';
import { useSyncExternalStore } from 'react';

export class CompactPreference {
  private value = false;
  private listeners = new Set<() => void>();
  getSnapshot = () => this.value;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  set(value: boolean) {
    if (value === this.value) return;
    this.value = value;
    for (const listener of this.listeners) listener();
  }
}
export const compactToken = createServiceToken<CompactPreference>('orders.compact');

export class CompactServiceProvider extends ServiceProvider<ClientApplication> {
  readonly name = 'orders.compact';
  register() {
    this.app.container.singleton(compactToken, () => new CompactPreference());
  }
}

export function useCompact() {
  const service = useService(compactToken);
  const value = useSyncExternalStore(service.subscribe, service.getSnapshot);
  return { value, set: (next: boolean) => service.set(next) };
}
```

`CompactServiceProvider` を、アプリのクライアントの `serviceProviders` か、プラグインの提供内容の配列に追加します。コンポーネントは `useCompact()` を呼び出して設定を読み取り、更新します。

`useService()` はサービスを解決するだけで、購読はしません。`useSyncExternalStore` は更新を React に接続し、アンマウント時にリスナーを削除します。値が変わらない間、スナップショットは安定している必要があります。読み取りのたびに新しいスナップショットのオブジェクトを作ると、不要な更新が起きることがあります。

### サーバーを呼び出す

`useApiClient()`、`apiClientToken`、コンストラクターの注入で、設定済みの HTTP クライアントを使います。キャンセルのシグナルをリクエストに渡し、読み込み、失敗、再試行は UI で扱います。

ブラウザーにキャッシュした権限やユーザーのオブジェクトは、サーバーの認可ではありません。身元が変わったら、身元に固有の状態とリクエストのキャッシュをクリアしてください。

### 所有とテスト

この例はメモリ上の状態だけを保存します。接続とグローバルなリスナーは Provider が、ローカルな購読はコンポーネントが所有します。シングルトンの共有、更新後の再レンダリング、リスナーの後片付けをテストします。

関連：[API Client](../http/api-client.md) と [React の Provider](../runtime/react-providers.md)。

### インターフェースと実装

- [クライアントのサービスの組み込み](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [React のフック](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/src/hooks.ts)

## サーバーのサービス

サーバーのサービスは業務ルールをまとめ、HTTP、CLI、バックグラウンドの作業が同じ動作を共有できるようにします。入口は入力を検証して身元を確定し、データのポリシーと業務上の制約は呼び出しの連鎖を通じて明示的に渡します。

### フレームワークのリソースを注入する

この例は、`id` と `title` のフィールドを持つ `orders` コレクションを前提にしています。

```ts
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';

export class OrdersService {
  constructor(private readonly database: DatabaseManager) {}

  async list(policy: RepositoryPolicy) {
    return this.database.repository('orders').withPolicy(policy).findMany({
      select: (s) => s.fields('id', 'title'),
      sort: (s) => [s.field('id').asc()],
      limit: 20,
    });
  }
}
```

ServiceProvider が `databaseManagerToken` を解決して `OrdersService` に注入し、業務のトークンを登録します。ルートはサービスを解決し、リクエストの入力をそのまま信頼したポリシーではなく、認可から導いたポリシーを渡します。

### リクエストの状態をシングルトンに置かない

現在のユーザー、トランザクション、リクエストの入力をサービスのフィールドに保存しないでください。並行した呼び出しが互いに上書きするおそれがあります。それらは引数として渡します。サービスを Web フレームワークに結び付けるのではなく、ルートの境界で HTTP の Context を小さな業務のコンテキストに変換します。

### トランザクションと外部への影響

複数ステップのアトミックな書き込みでは、トランザクションを作成し、そのコールバックの接続から Repository を取得します。コールバックが終わったあとでその接続を使わないでください。メール、HTTP の呼び出し、キューへの投入は、通常データベースと一緒にはロールバックされません。業務に合った再試行と冪等性の識別子を用意して、コミット後に行うようにします。

データベースのコミットと通知の配信は別々の結果です。確実な配信が必要な場合は、明示的に保存した保留中の作業と復旧が必要です。

### 複数の入口とテスト

CLI とバックグラウンドのタスクには、ブラウザーの身元がありません。管理者のアクセスを前提にするのではなく、その実行の主体と、許可するデータの範囲を定めてください。

ルールはユニットテストで、ポリシー、トランザクション、並行性は実際のデータベースのテストで確認します。[サーバー側のサービス](../../developing-apps/server-business-services.md) と [トランザクション](../database/transactions.md) を参照してください。

### インターフェースと実装

- [データベースのサービスの組み込み](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/database/index.ts)
- [Repository のポリシー](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/db/docs/api-reference/permissions.md)
