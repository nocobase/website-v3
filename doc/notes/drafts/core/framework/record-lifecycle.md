---
title: Record states and transitions
---

`@nocobase/lifecycle` defines a business record's states, transitions, conditions and effects together, such as submitting and closing an order. It is separate from the application's [Provider lifecycle](runtime/lifecycle.md).

## Define states

```ts
import { defineLifecycle, type LifecycleRecord } from '@nocobase/lifecycle';

interface Order extends LifecycleRecord {
  status: 'draft' | 'submitted' | 'closed';
  ownerId: string;
}
interface OrderLifecycle {
  record: Order;
  state: Order['status'];
}

export const orderLifecycle = defineLifecycle<OrderLifecycle>({
  name: 'orders',
  initial: 'draft',
  states: ['draft', 'submitted', { name: 'closed', final: true }],
  transitions: {
    submit: {
      from: 'draft',
      to: 'submitted',
      guard: ({ record, actor }) => record.ownerId === actor.id,
    },
    close: {
      from: 'submitted',
      to: 'closed',
      guard: ({ record, actor }) => record.ownerId === actor.id,
    },
  },
});
```

`from` and `to` describe transitions, and `guard` decides whether the actor may perform them. Use `validate` for input validation and `accept` for fields copied from accepted input. `onEnter` defines entry effects; `triggers` defines time-based transitions.

## Persistence and runtime

A definition creates neither database tables nor HTTP endpoints. The application or plugin must:

1. Migrate business state, state-change time and concurrency-version fields, plus transition-log and effect-run tables.
2. Connect `createRepositoryLifecycleStore()` to DatabaseManager, create a `LifecycleRuntime` and register definitions.
3. Create records through `runtime.create()` and transition through `runtime.fire()`.
4. Authenticate and authorize in application routes, then invoke the runtime and map refusals to standard API errors.
5. Connect `createLifecycleJobs()` for task execution and periodic recovery, with shutdown cleanup.

The library ships no migrations. Follow its storage contract; a `status` column alone is insufficient for the persistent runtime.

## Concurrency, retries and UI

Transition requests can carry a `requestId` and expected version. Replay recognition and conflict detection protect state changes; external effects still require idempotency keys. Without a dispatcher effects run in process. Connect Jobs when durable recovery is required.

`view()` reports available actions and blockers. `createLifecycleHook()` from `@nocobase/lifecycle/react` connects to routes supplied by the application. Client availability is a preview; server `fire()` checks again when executing.

Do not update state fields through an ordinary Repository: that bypasses guards, versions, history and effects. Use `@nocobase/lifecycle/testing` to exercise actors, invalid states, repeated requests and timed triggers. Business plugins such as approvals can build their domain rules on this mechanism.

## Interfaces and implementation

- [Lifecycle integration guide](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/lifecycle/docs/guide.md)
- [Lifecycle types](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/lifecycle/src/types.ts)
