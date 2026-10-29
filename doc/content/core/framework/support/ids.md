---
title: ID generation
---

`@nocobase/snowflake` produces time-ordered JavaScript-safe integer IDs. Applications share a generator through `idGeneratorToken` from `@nocobase/app-server/id-generator`.

## Host generator

```ts
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import type { ServiceResolver } from '@nocobase/service-provider';

export function nextOrderId(container: ServiceResolver): string {
  return container.resolve(idGeneratorToken).generateString();
}
```

`generate()` returns a safe integer and `generateString()` its string representation. Keep API and database field types consistent; do not coerce arbitrarily large third-party IDs to JavaScript numbers.

Standalone callers can create `new SnowflakeIdGenerator({ workerId })`. Reuse one instance rather than recreating it for every call, which restarts the sequence within the same second.

Applications and plugins share the host generator, passing `app.container` through a service or Provider. Deployment configuration assigns the worker; plugins must not each create generators using the same worker. Browser code requests new record IDs through a business API that generates them on the server.

```yaml
snowflake:
  workerId: 1
```

This example configures one instance; assign different values across instances. Business tests can inject a fixed-sequence generator substitute. Algorithm tests use independent generators to check same-second sequences, clock rollback and boundary values.

## Workers and clocks

This implementation uses second-resolution time, five worker bits and a 16-bit sequence. Configure worker IDs from 0–31 through `snowflake.workerId` or `SNOWFLAKE_WORKER_ID`. Concurrent generators in the same ID space require distinct worker IDs; configuration does not allocate them automatically.

Exhausting a second's sequence, moving the clock behind the last generated time or exceeding the safe-integer range throws instead of silently producing duplicates. Deploy with stable clocks and worker allocation. Rapidly restarting a worker also requires accounting for same-second sequence reuse. Keep database uniqueness constraints.

## Business boundaries

Time ordering is not a strict global commit order. IDs from different workers do not prove transaction order. They reveal time and worker information and are not unpredictable credentials.

Do not use Snowflakes for password-reset links, session secrets or API tokens. Database keys, business numbers and external random identifiers may use different mechanisms. Generating an ID does not replace authorization.

## Interfaces and implementation

- [Snowflake implementation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/snowflake/src/snowflake.ts)
- [Host ID service](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/id-generator/provider.ts)
