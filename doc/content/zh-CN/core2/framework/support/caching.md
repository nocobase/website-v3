---
title: 缓存
description: 通过宿主的 cachingToken 复用缓存实例，了解缓存的读取与失效、命名空间与权限，以及计数器和布隆过滤器。
---

`@nocobase/caching` 提供带命名空间的缓存、计数器和布隆过滤器。应用通过 `@nocobase/app-server/caching` 中的 `cachingToken` 复用宿主的实例。缓存用于加速读取，不能成为业务数据的唯一来源。

## 在应用与插件中接入

缓存 Provider 根据应用配置创建共享的服务。应用或插件的服务端 Provider 可以通过 `app.container` 调用下面的函数，再把返回的缓存传给业务服务：

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

业务中使用 `cache.wrap(key, loader)` 读取数据，在数据变更提交之后，让相应的键失效。应用和插件都不应自行销毁宿主的 Caching；只有独立创建的实例，才由创建方负责释放。

## 读取缓存

下面使用库默认的内存驱动，演示独立实例的生命周期：

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

应用中的插件应从宿主取得 Caching，不要在每个请求中创建和销毁实例。`get()` 未命中时返回 `undefined`；`set()` 写入，`delete()` 使缓存失效，`take()` 读取后删除。`wrap()` 在未命中时运行 loader，并合并当前进程内针对同一个键的并发加载。

TTL 用数字表示时单位是毫秒，配置中也可以使用 `30s` 这样的时长字符串。请在写入路径上主动删除或更新缓存，不要只依靠过期时间来保证重要业务读取的正确性。

## 命名空间与权限

命名空间用来分隔不同模块的键，但不会自动区分租户、用户或权限范围。缓存中包含经过权限过滤的结果时，缓存键必须覆盖这些维度；否则就只缓存没有权限差异的公共数据。权限变化之后，要同步让相关的缓存失效。

同一个 Provider 的初始化参数在首次使用后就固定下来，传入冲突的配置会报错。内置的 `memory` 驱动只在当前进程内有效，多个实例之间不会共享缓存。自定义驱动通过 `registerCachingDriver()` 注册；仅仅把配置改成 `redis`，并不能得到一个没有安装的驱动。

## 其他能力

`getCounter()` 提供计数和原子递增，在首次创建时应用 TTL；`getBloomFilter()` 提供集合的概率查询。布隆过滤器可能把不存在的值误判为“存在”，命中之后仍要查询权威的存储确认。

`wrap()` 的合并不是分布式锁，不能用它来保证支付、库存等操作只执行一次。业务上的唯一约束和事务仍然放在数据库中。宿主关闭时会释放 Provider，独立的实例则由调用方执行 `dispose()`。

## 接口与实现

- [Caching service](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/caching.ts)
- [Cache contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/types.ts)
- [Driver registration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/drivers.ts)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/caching/token.ts)
