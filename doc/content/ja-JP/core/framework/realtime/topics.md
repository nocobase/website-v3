---
title: リアルタイムのメッセージとトピックの購読
---

`@nocobase/realtime` は、業務上の無効化の通知を、購読しているページに届けます。アプリは通常 `@nocobase/app-server/realtime` の `realtimeServiceToken` を共有し、コンポーネントはクライアントのランタイムの接続を再利用します。

## アプリとプラグインの組み込み

サーバーの Provider の `boot()` で `app.container` を渡し、このモジュールが所有するトピックを宣言します。

```ts
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import type { ServiceResolver } from '@nocobase/service-provider';

export function registerOrderInbox(container: ServiceResolver) {
  const realtime = container.resolve(realtimeServiceToken);
  return realtime.defineTopic<{ changed: true }, 'user'>(
    'orders:inbox',
    { audience: 'user' },
  );
}
```

トピックのハンドルを保持し、業務上の変更がコミットされたあとに `inbox.publishFor(userId, { changed: true })` を呼び出します。`userId` は、任意のリクエストのフィールドを信頼するのではなく、サーバーが認可した受信者から選びます。Provider の終了時には `inbox.close()` を呼び出し、所有するトピックを解放します。共有のサービスとトランスポートの起動と終了はホストが行います。

アプリとプラグインは同じ方法を使い、トピック名の衝突を避ける必要があります。クライアントのページとコンポーネントは、サーバーのトピックを改めて宣言せずに購読します。

## トピックを宣言する

この単独の例では、宣言、公開、後片付けを示します。アプリでは、Provider の `boot()` でトピックを宣言し、接続の管理はホストに任せます。

```ts
import { createRealtimeService } from '@nocobase/realtime/server';

const realtime = createRealtimeService({ namespace: 'orders-demo' });
const inbox = realtime.defineTopic<{ changed: true }, 'user'>(
  'orders:inbox',
  { audience: 'user' },
);
await realtime.setup();
try {
  await inbox.publishFor('user-1', { changed: true });
} finally {
  inbox.close();
  await realtime.close();
}
```

`user` の対象は、指定したユーザーを対象にします。購読の身元は接続の認証から来るため、クライアントがユーザーの対象を選ぶことはできません。`public` のトピックは共有の購読を許可し、`authenticated: true` でサインインを必須にできます。サインインしただけで、すべての業務レコードへのアクセスが付与されるわけではありません。

リソースごとの範囲を持つ購読には、`defineTopicFamily()` と `authorize()` を使い、HTTP のアクセスポリシーを共有します。認可は購読時と配信時に実行されるため、取り消されたアクセスが古い購読を通じて残ることはありません。トピックは使う前に宣言します。未知のトピックは拒否されます。

## ページを更新する

```tsx
import { useRealtimeRefresh } from '@nocobase/app-client';

export function OrderUpdates({
  refresh,
}: {
  refresh: (signal: AbortSignal) => Promise<void>;
}) {
  useRealtimeRefresh('orders:inbox', refresh, { delayMs: 100 });
  return null;
}
```

`refresh` は認可された API で現在の状態を読み取り、その Promise を返します。このフックは、購読の準備ができたあとや変更があったときに読み取りをスケジュールし、立て続けの変更をまとめ、アンマウント時に後片付けをします。使っていないページは、`enabled: false` か null のトピックで無効にします。コンポーネントごとに接続を作成しないでください。

生のイベントと購読の状態には `useRealtimeTopic()` を使います。低レベルの `watch()` は、確認応答のあとで初めて `subscribed` になります。`onReady` は、再接続の確認応答のあとにも再び実行されます。WebSocket が開いていても、特定のトピックが購読されていることの証明にはなりません。

## 配信の境界

イベントは一時的な無効化の通知で、再接続時に再送されることはありません。更新するのに十分な情報だけを含めてください。正式な状態はデータベースと API に保ちます。公開の受付記録はブラウザーへの配信の確認応答ではなく、公開が失敗しても、すでにコミットされた業務のトランザクションは元に戻せません。

既定の `inMemory` のブローカーは、1 つのサービスのインスタンス内に閉じています。複数のプロセスには、共有の名前空間を持つ Redis Pub/Sub が必要です。名前空間が一致していても、メモリのブローカー同士がつながるわけではありません。ローカルの購読者の数に基づいて公開をスキップしないでください。別のインスタンスに購読者がいる可能性があります。

ペイロードは、有限で循環のない JSON のデータである必要があります。接続、関数、`Date` のオブジェクトは直接送れません。サインイン、サインアウト、身元の変更のあとは再接続し、以前のアカウントのキャッシュをクリアしてください。トランスポートの組み込みについては [WebSocket](websocket.md) を参照してください。

## インターフェースと実装

- [リアルタイムの取り決めとフック](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/realtime/README.md)
- [ホストの WebSocket の組み込み](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/realtime/websocket.ts)
- [ホストのサービスの取り決め](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/realtime/types.ts)
