---
title: 缓存
---

`@nocobase/caching` 提供带命名空间的缓存、计数器和布隆过滤器。应用使用 `@nocobase/app-server/caching` 的 `cachingToken` 复用宿主实例；缓存用于加速读取，不能成为业务数据唯一来源。

## 在应用与插件中接入

缓存 Provider 根据应用配置创建共享服务。应用或插件的服务端 Provider 可以通过 `app.container` 调用以下函数，再把返回的缓存传给业务服务：

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

业务中使用 `cache.wrap(key, loader)` 读取，提交数据变更后使相应键失效。应用和插件都不应自行销毁宿主的 Caching；独立实例才由创建方负责释放。

## 缓存读取

下面使用库的默认内存驱动演示独立生命周期：

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

应用中的插件应从宿主取得 Caching，不要每个请求创建和销毁实例。`get()` 未命中返回 `undefined`；`set()` 写入，`delete()` 失效，`take()` 读取并删除。`wrap()` 在未命中时运行 loader，并合并当前进程内同一键的并发加载。

TTL 的数字单位为毫秒，配置也可使用 `30s` 等时长字符串。根据写入路径主动删除或更新缓存，不要只依赖过期时间保证重要业务读取的正确性。

## 命名空间与权限

命名空间分隔模块的键，但不会自动分隔租户、用户或权限范围。缓存包含权限过滤后的结果时，键必须覆盖这些维度，或只缓存无权限差异的公共数据。权限变化后同步失效相关缓存。

同一 Provider 的初始化参数首次使用后固定；冲突配置会报错。内置 `memory` 驱动只在当前进程有效，多实例不会共享缓存。自定义驱动通过 `registerCachingDriver()` 注册，不能仅把配置改成 `redis` 就获得未安装的驱动。

## 其他能力

`getCounter()` 提供计数和原子递增，首次创建时应用 TTL；`getBloomFilter()` 提供集合概率查询。布隆过滤器可能误判“存在”，命中后仍需查权威存储确认。

`wrap()` 的合并不是分布式锁，不能用它保障支付、库存等操作只执行一次。业务唯一约束与事务仍放在数据库。宿主关闭时释放 Provider，独立实例由调用方 `dispose()`。

## 接口与实现

- [Caching service](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/caching.ts)
- [Cache contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/types.ts)
- [Driver registration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/drivers.ts)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/caching/token.ts)
