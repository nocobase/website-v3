---
title: Caching
---

`@nocobase/caching` provides namespaced caches, counters and Bloom filters. Applications share the host instance through `cachingToken` from `@nocobase/app-server/caching`. Caches accelerate reads and are not authoritative business storage.

## Application and plugin integration

The caching Provider creates a shared service from application configuration. An application or plugin server Provider can call this helper with `app.container`, then pass the cache to a business service:

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

Read through `cache.wrap(key, loader)` and invalidate affected keys after data changes commit. Applications and plugins must not dispose of host Caching themselves; creators own cleanup only for standalone instances.

## Cache reads

This standalone example uses the default memory driver:

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

Application plugins resolve host Caching instead of creating and disposing an instance per request. `get()` returns `undefined` on a miss; `set()` writes, `delete()` invalidates, and `take()` reads and removes. `wrap()` loads missing data and coalesces concurrent loads for a key within this process.

Numeric TTL values are milliseconds; configuration also accepts strings such as `30s`. Invalidate or update on writes rather than relying solely on expiration for correctness-sensitive reads.

## Namespaces and authorization

Namespaces separate modules, not tenants, users or permission scopes automatically. Include those dimensions in keys for filtered data, or cache only public data with no permission variation. Invalidate affected entries when permissions change.

Provider initialization options are fixed on first use; incompatible settings fail. The built-in `memory` driver is process-local. Register custom drivers with `registerCachingDriver()`; changing a string to `redis` cannot install a missing driver.

## Other capabilities

`getCounter()` supports atomic increments and applies TTL when first created. `getBloomFilter()` supports probabilistic membership checks. A positive Bloom result can be false and still requires authoritative lookup.

`wrap()` coalescing is not a distributed lock and cannot guarantee a payment or stock mutation runs once. Keep business constraints and transactions in the database. Hosts dispose Providers on shutdown; standalone callers own `dispose()`.

## Interfaces and implementation

- [Caching service](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/caching.ts)
- [Cache contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/types.ts)
- [Driver registration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/drivers.ts)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/caching/token.ts)
