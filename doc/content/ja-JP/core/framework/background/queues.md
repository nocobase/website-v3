---
title: メッセージキュー
---

`@nocobase/queue` は、メッセージの生成と消費を提供します。ほとんどのバックグラウンドの作業は [ジョブ](jobs.md) から始めます。チャネル、遅延、優先度、バッチ、レート制限が必要な場合に、キューを直接使います。

## ホストのサービス

`@nocobase/app-server/queue` から `queueServiceToken` を解決し、接続とライフサイクルを共有します。`producer(name)` と `consumer(name)` は同じキューを指し、チャネルはメッセージの目的を区別します。

```ts
import { queueServiceToken } from '@nocobase/app-server/queue';
import { withChannel } from '@nocobase/queue';
import type { ServiceResolver } from '@nocobase/service-provider';

export function consumeOrderRefresh(
  container: ServiceResolver,
  refresh: (message: unknown, signal: AbortSignal) => Promise<void>,
) {
  const queue = container.resolve(queueServiceToken);
  return queue.consumer('orders').consume(
    withChannel('refresh', async (_channel, message, signal) => {
      await refresh(message, signal);
    }),
  );
}

export async function requestOrderRefresh(container: ServiceResolver, orderId: string) {
  const queue = container.resolve(queueServiceToken);
  return queue.producer('orders').publish('refresh', { orderId });
}
```

業務の層は、ペイロードの検証を含む `refresh` を提供します。コンシューマーは Provider の `boot()` で登録し、ホストの Queue の Provider が `start()` で消費を始めます。公開は起動が完了してから行います。`consume()` が返す登録解除の関数を保持し、業務の依存関係を解放する前にそれを待ちます。

アプリとプラグインは、どちらのヘルパーにも `app.container` を渡せます。キューの名前は業務モジュールやプラグインが所有するものを使い、投入側とコンシューマーで同じ慣習を使います。アプリが接続、アダプター、名前空間を設定します。プラグインは自分のコンシューマーの登録を解除し、共有のホストの Queue サービスは止めません。

ジョブのクラス、進捗、定期的なルールには Jobs を使います。ページの購読には [リアルタイム通信](../realtime/topics.md) を使います。キューはメッセージをワーカーに割り当てるもので、接続しているすべてのページにブロードキャストはしません。

## 配信の動作

1 つのプロセスで登録したハンドラーは、そのプロセスが受け取ったメッセージに対して並行して実行されます。どれか 1 つが失敗するとメッセージ全体が再試行され、すでに成功したハンドラーも繰り返されることがあります。異なるプロセスはメッセージを奪い合い、配信はブロードキャストではありません。

`withChannel()` はチャネルで絞り込むだけで、ペイロードは検証しません。`publish()` の受付記録は受け付けたことを示すだけで、完了は示しません。独自の Job ID による重複の排除は、ジョブがキューに残っている間だけ有効で、永久ではありません。必要な場合は、業務上の冪等性キーを保持してください。

## 設定と永続性

キューのアダプターの名前は `inMemory` と `redis` で、jobs のアダプターの `memory` とは異なります。設定は、既定値、接続、名前空間、並行性、再試行、バックオフ、レート制限を扱います。キューは最初に解決されたときに設定に結び付けられ、以降の呼び出し側が同じキューを別の設定で解釈し直すことはできません。

メモリはローカルの開発に向いています。正常な終了時に状態を保存しても、突然の終了後の復旧は保証されません。Redis には、適切な永続化とリソースの上限が必要です。バッチの入力は投入の前に確認されますが、ネットワークやサーバーの障害で、バッチの一部だけが投入されることもあります。

キャンセルのシグナルを確認してください。ハンドラーから自分自身の登録解除を待たないでください。自分自身の完了を待つことになりかねません。業務の正式な結果を保存し、繰り返しの配信と復旧が安全になるようにします。

## インターフェースと実装

- [キューの API と保証](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/queue/README.md)
- [ホストのサービスの取り決め](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/queue/token.ts)
