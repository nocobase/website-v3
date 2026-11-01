---
title: キャッシュ
---

`@nocobase/caching` は、名前空間付きのキャッシュ、カウンター、ブルームフィルターを提供します。アプリは `@nocobase/app-server/caching` の `cachingToken` でホストのインスタンスを共有します。キャッシュは読み取りを速くするもので、正式な業務データの保存先ではありません。

## アプリとプラグインの組み込み

キャッシュの Provider は、アプリの設定から共有のサービスを作成します。アプリやプラグインのサーバーの Provider は、`app.container` でこのヘルパーを呼び出し、キャッシュを業務サービスに渡せます。

```ts
import { cachingToken } from '@nocobase/app-server/caching';
import type { ServiceResolver } from '@nocobase/service-provider';

export function orderSummaryCache(container: ServiceResolver) {
  return container.resolve(cachingToken).getCache({
    namespace: '@example/orders:summary',
    defaultTtl: '30s',
  });
}
```

読み取りには `cache.wrap(key, loader)` を使い、データの変更がコミットされたら影響を受けるキーを無効にします。アプリとプラグインは、ホストの Caching を自分で破棄してはいけません。後片付けを担うのは、単独のインスタンスを作成した場合のその作成者だけです。

## キャッシュの読み取り

この単独の例は、既定のメモリのドライバーを使います。

```ts
import { createCaching } from '@nocobase/caching';

const caching = createCaching();
const cache = caching.getCache({ namespace: 'orders:summary', defaultTtl: '30s' });
try {
  const summary = await cache.wrap('today', async () => ({ count: 3 }));
  console.log(summary.count);
  await cache.delete('today');
} finally {
  await caching.dispose();
}
```

アプリのプラグインは、リクエストごとにインスタンスを作成・破棄するのではなく、ホストの Caching を解決します。`get()` はキャッシュにない場合に `undefined` を返し、`set()` は書き込み、`delete()` は無効にし、`take()` は読み取って削除します。`wrap()` は、ないデータを読み込み、このプロセス内での同じキーへの並行した読み込みをまとめます。

TTL の数値はミリ秒で、設定では `30s` のような文字列も受け付けます。正確さが重要な読み取りでは、有効期限だけに頼らず、書き込み時に無効化または更新してください。

## 名前空間と認可

名前空間はモジュールを分けるもので、テナント、ユーザー、権限の範囲を自動で分けるものではありません。絞り込まれたデータでは、それらの次元をキーに含めるか、権限による違いのない公開のデータだけをキャッシュしてください。権限が変わったら、影響を受けるエントリーを無効にします。

Provider の初期化のオプションは最初の使用時に固定され、互換性のない設定は失敗します。組み込みの `memory` ドライバーはプロセス内に閉じています。独自のドライバーは `registerCachingDriver()` で登録します。文字列を `redis` に変えるだけでは、存在しないドライバーはインストールされません。

## そのほかの機能

`getCounter()` はアトミックなインクリメントに対応し、最初の作成時に TTL を適用します。`getBloomFilter()` は確率的な所属の確認に対応しています。ブルームフィルターの陽性の結果は誤りのことがあり、引き続き正式な検索が必要です。

`wrap()` によるまとめは分散ロックではなく、支払いや在庫の変更が一度だけ実行されることは保証できません。業務上の制約とトランザクションはデータベースに保ってください。終了時に Provider を破棄するのはホストで、単独の呼び出し側は `dispose()` を担います。

## インターフェースと実装

- [キャッシュのサービス](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/caching.ts)
- [キャッシュの取り決め](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/types.ts)
- [ドライバーの登録](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/drivers.ts)
- [ホストのサービスの取り決め](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/caching/token.ts)
