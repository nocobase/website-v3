---
title: ID generation
description: Generate time-ordered integer IDs through the host's idGeneratorToken, and learn the requirements for workers and clocks and the business boundaries of Snowflake IDs.
---

`@nocobase/snowflake` generates time-ordered integer IDs that are safe in JavaScript. Applications share one generator through `idGeneratorToken` from `@nocobase/app-server/id-generator`.

## Using the host's generator

```ts
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import type { ServiceResolver } from '@nocobase/service-provider';

export function nextOrderId(container: ServiceResolver): string {
  return container.resolve(idGeneratorToken).generateString();
}
```

`generate()` returns a safe integer and `generateString()` returns its string form. Keep the types of the API and the database field consistent; do not force third-party integer IDs of arbitrary length into JavaScript numbers.

When running on its own, create `new SnowflakeIdGenerator({ workerId })`. Reuse the same generator within a process instead of creating a new instance on every call, or the sequence within the same second starts over.

Applications and plugins share the host's generator, passing in `app.container` through a business service or Provider. The worker configuration is provided centrally by the deployed application; plugins must not each create generators with the same worker. When the browser needs an ID for a new record, let the server generate it through a business API.

```yaml
snowflake:
  workerId: 1
```

This is a configuration example for the current instance; assign a different value to each instance. Business tests can inject a generator substitute that returns a fixed sequence; to verify the algorithm itself, use an independent generator and check the sequence within one second, clock rollback and boundary values.

## Workers and clocks

This implementation uses second-resolution time, a 5-bit worker and a 16-bit sequence. `workerId` ranges from 0 to 31 and is set through `snowflake.workerId` or `SNOWFLAKE_WORKER_ID`. Generators running concurrently in the same ID space must use different worker IDs; the configuration does not coordinate the allocation automatically.

When the sequence within one second is exhausted, the clock moves back before the last generation time, or a value exceeds the safe integer range, the generator throws an error rather than silently returning a duplicate ID. Deployments need a stable clock and explicit worker allocation; quickly restarting the same worker also carries the risk of reusing a sequence within the same second. Database unique constraints are still necessary.

## Business boundaries

Time ordering is not a strict global commit order, and IDs from different workers cannot prove the order of transactions. An ID contains time and worker information, so it is not an unguessable credential either.

Do not use Snowflake IDs for password reset links, session secrets or API Tokens. Database auto-increment keys, business numbers and random identifiers exposed externally can each use the mechanism that suits them; generating record IDs does not replace access control.

## Interfaces and implementation

- [Snowflake implementation](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/snowflake/src/snowflake.ts)
- [Host ID service](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/id-generator/provider.ts)
