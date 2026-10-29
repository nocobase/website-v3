---
title: Caching
description: Reuse the host's cache instance through cachingToken, and learn about cache reads and invalidation, namespaces and permissions, counters and Bloom filters.
---

`@nocobase/caching` provides namespaced caches, counters and Bloom filters. Applications reuse the host's instance through `cachingToken` from `@nocobase/app-server/caching`. Caches speed up reads and must never be the only source of business data.

## Integrating with applications and plugins

The caching Provider creates a shared service from the application configuration. An application or plugin server Provider can call the following function with `app.container` and then pass the returned cache to a business service:

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

In business code, read data through `cache.wrap(key, loader)` and invalidate the affected keys after a data change commits. Neither applications nor plugins should dispose of the host's Caching themselves; only instances created independently are released by their creator.

## Reading from the cache

The following example uses the library's default memory driver to show the lifecycle of a standalone instance:

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

Plugins in an application should get Caching from the host instead of creating and disposing an instance in every request. `get()` returns `undefined` on a miss; `set()` writes, `delete()` invalidates, and `take()` reads and then deletes. On a miss, `wrap()` runs the loader and merges concurrent loads of the same key within the current process.

Numeric TTLs are in milliseconds, and configuration also accepts duration strings such as `30s`. Delete or update cache entries actively on the write path; do not rely only on expiration to keep important business reads correct.

## Namespaces and permissions

Namespaces separate the keys of different modules, but do not automatically separate tenants, users or permission scopes. When a cache holds results filtered by permissions, the cache key must cover those dimensions; otherwise, cache only public data that does not vary by permission. When permissions change, invalidate the related cache entries as well.

A Provider's initialization options are fixed after first use, and conflicting configuration throws. The built-in `memory` driver only works within the current process, so instances do not share a cache. Custom drivers are registered with `registerCachingDriver()`; changing the configuration to `redis` does not give you a driver that is not installed.

## Other capabilities

`getCounter()` provides counting and atomic increments, applying the TTL when it is first created; `getBloomFilter()` provides probabilistic set membership queries. A Bloom filter can wrongly report a value as present, so a hit still needs confirmation from the authoritative storage.

The merging done by `wrap()` is not a distributed lock and cannot guarantee that operations such as payments or inventory changes run only once. Business unique constraints and transactions stay in the database. The host releases Providers on shutdown, while standalone instances are released by their caller through `dispose()`.

## Interfaces and implementation

- [Caching service](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/caching.ts)
- [Cache contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/types.ts)
- [Driver registration](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/caching/src/drivers.ts)
- [Host service contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/caching/token.ts)
