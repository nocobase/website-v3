---
title: Workflow
description: Define workflow states, actions, conditions and versions, integrate effects, external results, timeouts, recovery and administrator controls for running instances, and display progress and history.
---

A workflow uses a state machine to define the states of a business record, the allowed transitions and the conditions that trigger them. It suits long-running business processes that span multiple requests and involve human actions, automated processing or external systems. For example, an order can wait for a customer to pay, receive a payment callback and then wait for someone to confirm shipment. While waiting, only the current state needs to be stored; no task needs to keep running. `@nocobase/lifecycle` declares these rules in code, while the application supplies storage, APIs and pages.

The core integration below uses **Order payment** from the example project, while **Expense approval** and **Help desk** illustrate multi-version workflows and administrator controls for running instances. For multi-stage approvals, countersigning or added reviewers, see the [Approval plugin](../using-plugins/collaboration/approval.md).

## States and transitions

A **state** represents the record's current stage. A **transition** is a named change, such as starting payment, cancelling or shipping. The order's `status` is the workflow state, without a separate process-instance state. Transition history records the actor, time and state change; effect records preserve post-commit execution outcomes.

Use `defineLifecycle()` to declare the identity, initial state, allowed transitions and final states. This excerpt from `server/lifecycles/order.ts` omits parameter configuration and uses `orderTransitions` and `orderTriggers` to stand for its transitions and timeout rules. `OrderTypes` and `orderProblems` are the example's types and creation validator.

```ts
export const orderLifecycle = defineLifecycle<OrderTypes>({
  name: 'orders',
  key: 'orders',
  version: 1,
  definitionField: 'lifecycleDefinition',
  collection: LIFECYCLE_EXAMPLE_COLLECTIONS.orders,
  initial: 'draft',
  create: { validate: orderProblems },
  states: [
    'draft', 'creatingCheckout', 'awaitingPayment', 'paymentFailed',
    'paid', 'cancelled', 'refunding', 'refundNeedsAttention',
    { name: 'fulfilled', final: true },
    { name: 'refunded', final: true },
  ],
  parameters: { paymentWindowMinutes: 3 },
  transitions: orderTransitions,
  onEnter: { creatingCheckout: [createCheckout], refunding: [refund] },
  triggers: orderTriggers,
});
```

Starting payment moves an order from draft through opening checkout to awaiting payment. A payment callback marks it paid, after which it can be shipped or refunded. `fulfilled` (Shipped) and `refunded` are final states. `cancelled` is not final: a payment arriving after cancellation starts a refund.

Create records with `runtime.create('orders', values, { actor })`, letting the runtime write the initial state, definition binding and `$create` history entry. `actor` comes from the server's verified identity, and `values` contains only permitted business fields. Subsequent state changes go through transitions, not generic update endpoints.

## Actions, conditions and branches

Actions map to named transitions. `from` and `to` constrain their source and destination. `set` updates business fields in the same transaction, and `accept` saves allowed inputs. These two entries start payment and record successful checkout creation:

```ts
checkout: {
  from: ['draft', 'paymentFailed'],
  to: 'creatingCheckout',
  set: ({ record }) => ({
    paymentAttempt: record.paymentAttempt + 1,
    paymentSessionId: null,
    checkoutUrl: null,
    lastError: null,
  }),
},
checkoutCreated: {
  manual: false,
  from: 'creatingCheckout',
  to: 'awaitingPayment',
  accept: ['paymentSessionId', 'checkoutUrl'],
},
```

Clicking **Pay** fires `checkout`, increments the payment round and clears the previous checkout details. After the effect succeeds, `checkoutCreated` saves the session and URL. On creation, `create.validate` checks the customer, order name and positive amount. The general `guard`, transition `validate` and `route` APIs support conditions, input checks and destination selection; this example expresses branches through separate transitions for payment outcomes and current states.

A declined payment enters `paymentFailed`, where the user can start payment again. A successful payment enters `paid`, offering `ship` or `refundOrder`. Failed refunds enter `refundNeedsAttention`; `retryRefund` starts refunding again.

`cancel` allows cancellation from `draft`, `awaitingPayment` and `paymentFailed`, and schedules checkout closure. Payment callbacks and effect outcomes use transitions marked `manual: false`. Human action endpoints pass `manual: true` so users cannot directly select payment success. API authorization still checks roles and record scopes.

## Application integration and access control

Prepare tables for orders, transition history and effect runs. Alongside business fields, orders store `status`, `statusChangedAt`, `lifecycleVersion` and `lifecycleDefinition` for state, waiting deadlines, concurrency checks and the bound definition name. The package does not run migrations automatically. Follow the version's [storage requirements][storage] for fields and indexes; see [Data models and migrations](data-models-and-migrations.md) for application integration.

A Provider assembles the shared runtime, store and executors; workflow rules stay in the definition. Here, `database` and `executors` come from the application's `databaseManagerToken` and `jobExecutorServiceToken`. `flowServices` implements the example's `FlowServices`, including the payment sandbox and simulated failures:

```ts
import {
  LifecycleRuntime,
  createRepositoryLifecycleStore,
} from '@nocobase/lifecycle';
import { createLifecycleJobs } from '@nocobase/lifecycle/jobs';

const jobs = createLifecycleJobs({
  jobs: executors.getJobExecutor('app/orders'),
  schedule: executors.getScheduleExecutor('app/orders'),
  jobName: 'app/orders/effect',
  sweepEveryMs: 5_000,
});

const runtime = new LifecycleRuntime({
  store: createRepositoryLifecycleStore(database),
  dispatcher: jobs,
});
runtime.register(orderLifecycle, { services: flowServices });
```

Register the runtime in the container through a service Token and append the Provider to `server/providers/index.ts`. Call `jobs.start(runtime)` in `start()` and `jobs.shutdown()` in `shutdown()`. Routes reuse that runtime. See [Server-side services](server-business-services.md) for registration and [Background jobs and scheduled execution](background-tasks.md) for backends and multiple instances.

A transition writes record changes, history and queued work in one transaction; external calls run after commit. If guards need other tables, obtain connections through a services factory bound to the current transaction. See [Transactions and data consistency](transactions-and-consistency.md).

The application provides creation, read and action endpoints. Authenticate, authorize and validate input, then resolve the record's bound definition before calling the runtime:

```ts
const actor = { id: String(signedInUserId) };
const definition = await runtime.boundLifecycle('orders', orderId);
const result = await runtime.fire(definition, orderId, body.transition, {
  actor,
  manual: true,
  input: body.input,
  requestId: body.requestId,
  expect: { version: body.expectVersion },
});

const view = await runtime.view(definition, orderId, actor);
return c.json({ data: { ...view, replayed: result.replayed === true } });
```

`body` is validated input and the user ID comes from a trusted session. Check record scopes, authorize reads, transitions and recovery separately, and verify that a run belongs to the order before operating on it. The store does not inherit request policies. See [Authentication, permissions and data scopes](authentication-and-permissions.md) and [Request validation and error handling](request-validation-and-errors.md).

Reuse `requestId` when resending the same action after a network problem; changed input or a new decision needs a new identifier. Replaying a successful action creates no additional transition. Pass the displayed concurrency version as `expectVersion`; stale actions receive `CONFLICT` and require a refresh and a new decision. Request identifiers deduplicate actions; concurrency versions prevent old decisions from overwriting newer progress.

## Effects, waiting and recovery

An **effect** is work performed after a transition commits. Entering `creatingCheckout` opens a checkout. Success fires `checkoutCreated` to await payment; exhausted retries fire `checkoutFailed` to enter `paymentFailed`.

```ts
import { defineEffect } from '@nocobase/lifecycle';

const createCheckout = defineEffect<OrderTypes>({
  name: 'orders.createCheckout',
  retry: { attempts: 3, backoffMs: 2_000, factor: 2, maxMs: 10_000 },
  timeoutMs: 10_000,
  onSuccess: 'checkoutCreated',
  onFailure: 'checkoutFailed',
  async run({ record, services }) {
    if (services.shouldFail(`order-checkout:${record.id}`, record.failCheckouts)) {
      throw new Error('The payment provider is unavailable (simulated).');
    }
    const session = await services.sandbox.createCheckout({
      idempotencyKey: `order-checkout:${record.id}:${record.paymentAttempt}`,
      orderId: String(record.id),
      amountCents: record.amountCents,
    });
    return { paymentSessionId: session.sessionId, checkoutUrl: session.url };
  },
});
```

`services.sandbox.createCheckout` is the example's payment sandbox API, not a real payment call. `failCheckouts` controls simulated failures. Retries within one payment round reuse an idempotency key; a user starting payment again increments `paymentAttempt` and opens a new session. `attempts: 3` includes the first attempt.

**Waiting for an external result** only requires stored state, not a continuously running job. Opening checkout does not mean an order is paid; the provider's callback confirms payment. This call advances an order that has not been cancelled, after the receiver verifies the callback:

```ts
import { SYSTEM_ACTOR } from '@nocobase/lifecycle';

// After verifying the payment callback, for an order still awaiting payment.
const definition = await runtime.boundLifecycle('orders', orderId);
await runtime.fire(definition, orderId, 'paymentSucceeded', {
  actor: SYSTEM_ACTOR,
  input: { paymentRef },
  requestId: `payments:${eventId}`,
});
```

`SYSTEM_ACTOR` does not verify the sender; the receiver first checks the signature and event format. Redeliveries use the same event identifier. `paymentSucceeded` accepts both `creatingCheckout` and `awaitingPayment`, handling payment that arrives before the checkout result is recorded. For a cancelled order, the receiver instead uses `paidAfterCancel` to start a refund. Database errors and conflicts still require redelivery.

**Waiting deadlines** use triggers. The example defaults to three minutes. This `orderTriggers` entry fires `expire` after an order has stayed in `awaitingPayment` or `paymentFailed` for the configured period, moving it to `cancelled`:

```ts
expireUnpaid: {
  transition: 'expire',
  when: ['awaitingPayment', 'paymentFailed'],
  after: ({ paymentWindowMinutes }) => paymentWindowMinutes * 60_000,
},
```

The sweep interval should be shorter than the waiting period; overdue records are discovered during a check. `expire` records the timeout reason and schedules checkout closure. If payment has already happened but its callback arrives late, `paidAfterCancel` starts a refund.

**Recovery** depends on whether external work has already completed:

| Situation | Handling |
| --- | --- |
| Transient checkout creation error | Retry by policy, reusing the payment round's idempotency key |
| Checkout retries exhausted | Enter `paymentFailed`; the user can click Pay again |
| Refund retries exhausted | Enter `refundNeedsAttention`; Retry refund starts another run, deduplicated by order and payment reference |
| Other executions eligible for retry | Authorize `runtime.retryRun(runId)`; do not force a retry by default after `RUN_SETTLED` |
| External processing succeeded but the next transition is blocked | Remove the blocker and call `runtime.continueRun(runId)` to apply the existing outcome without resending the request |
| Application restart or interrupted execution | The Jobs adapter and sweeps resume eligible work |

Persistent storage retains queued work and recorded results. Recovery may repeat an external call, so idempotency remains necessary. Keep lifecycle, effect and job names stable so new processes recognize existing work. Connect execution errors to logging and prune eligible records according to retention policy.

## Version management

When business rules change, existing records are often still in progress. `@nocobase/lifecycle` binds each record permanently to the concrete definition version that created it, allowing old and new versions to share one business table without interfering with each other.

### Version identity and record binding

Declare these identity properties on every lifecycle definition:

| Property | Meaning |
| --- | --- |
| `name` | Permanent identifier of one concrete definition. Records, transition logs, effect runs and parameter snapshots reference it; never rename it |
| `key` | Process identifier shared by all versions of the same process. Plugins use a namespaced key to avoid collisions |
| `version` | Positive integer unique within the `key`. The largest number is the latest definition, which does not decide which version new records start with |
| `collection` | Shared business table. Set it explicitly in new versions because it defaults to `name` |
| `definitionField` | Nullable string column storing the concrete definition's `name` (such as `lifecycleDefinition`). When one table carries multiple lifecycles, declare one column per lifecycle (such as `approvalDefinition` and `paymentDefinition`) |
| `versionField` | Per-record concurrency counter (`lifecycleVersion` by default), unrelated to the definition's `version` |

`runtime.create()` writes `definitionField` in the same transaction as the record. It is a lifecycle-owned field that cannot be written by `set`, `accept` or creation input. Every record operation (`view()`, `available()`, `can()`, `fire()`, effects and continuations) verifies the binding and rejects records bound to another version or unbound records with `DEFINITION_MISMATCH` (mapped to `400 FAILED_PRECONDITION` by `lifecycleErrorFields()`, with `metadata.bound` identifying the actual binding). Nothing falls back to the latest version, and each version's triggers sweep only records bound to that version.

During registration, the runtime checks that all versions of a `key` share the same `collection`, `stateField`, `changedAtField`, `versionField`, `definitionField` (and `management.field` when management is enabled). A `key` with multiple versions requires `definitionField`; omitting `key`, `version` or `definitionField` for a single version emits a warning today and becomes required in the next minor release.

### Creating versions and switching entry points

Once a definition version is merged into the target main branch, its execution behavior is **frozen**. Changing states, transitions, guards, `route`, `validate`, `set`, `accept`, hooks, triggers, effects or parameter contracts requires adding a new version beside it while keeping the old version and its behavior intact. A version newly introduced on an unmerged branch can continue to be edited in place, and pure display metadata (titles, descriptions, translations) can be edited in place. Inspect shared guards, effects and helpers so edits do not alter frozen versions.

To create a new version, take the highest `version` for that `key` across current definitions and the target main branch's history (including deleted definitions) plus one, and pick an unused `name` never reserved by a merged definition. This excerpt from `server/lifecycles/expense-v2.ts` adds an `awaitingAudit` stage while sharing the v1 business table and reusing unchanged transitions:

```ts
export const expenseV2Lifecycle = defineLifecycle<ExpenseV2Types>({
  name: 'expenses-v2',
  key: 'expenses',
  version: 2,
  definitionField: expenseLifecycle.definitionField,
  collection: expenseLifecycle.collection,
  initial: 'draft',
  states: [
    'draft', 'awaitingManager', 'awaitingFinance', 'awaitingAudit',
    'needsInfo', 'approved',
    { name: 'rejected', final: true },
    { name: 'paid', final: true },
  ],
  parameterConfiguration: {
    groups: [expenseParameterGroup, expenseTimingGroup, expenseAuditGroup],
  },
  parameters: {
    autoApproveLimit: 5000,
    financeLimit: 50000,
    escalateAfterMinutes: 3,
    auditLimit: 20000,
  },
  transitions: {
    // ...new audit transition and updated approve route; unchanged transitions reuse v1
    escalate: expenseLifecycle.transitions.get('escalate')!.definition as never,
    paid: expenseLifecycle.transitions.get('paid')!.definition as never,
  },
  onEnter: {
    awaitingManager: [notifyApprover as never],
    awaitingFinance: [notifyApprover as never],
    awaitingAudit: [notifyApprover as never],
    approved: [notifyApplicant as never, requestPayment as never],
  },
  triggers: { /* ... */ },
});
```

Register both versions on the same `LifecycleRuntime` across every application process and worker. There is no implicit "latest version" default for `runtime.create()`: each creation entry point (API route, event subscriber, scheduled job, import, batch or parent process) explicitly names the definition it starts. Deploy the new definition to all processes and workers before switching entry points, and keep schema changes compatible with older versions. Rolling back simply points entry points back to the earlier definition while records already created by the new version keep running it.

### Multi-version queries, parameters and retirement

Record routes address a process by `key` rather than version. Call `runtime.boundLifecycle(key, recordId)` (or `runtime.recordLifecycle(key, record)` if the record is already loaded, ensuring policy read fields and projections include `definitionField`) and pass that concrete definition name to `view()` and `fire()`. Description routes accept an optional `?definition=<name>` and default to `runtime.group(key).latest`.

For list pages covering multiple versions on one table, call `runtime.groupStates(key)` to build state filters and labels from the union of all versions' states; `runtime.groups()` and `runtime.group(key)` aggregate the workflow catalog. A record's `view.lifecycle` and `view.definitionVersion` always reflect its own bound version, so actions, diagrams and history never drift to the latest definition.

**Parameter configuration belongs to each concrete definition version.** When `parameterConfiguration` is declared, each version maintains its own parameter contract and configuration revisions independently; administrators can explicitly copy compatible values from an earlier version as unsaved inputs and save them after validation. `runtime.create()` freezes the effective parameters into an immutable instance snapshot in the creation transaction (including for drafts). All later execution reads only that snapshot; subsequent configuration edits affect only newly created records of that version and never recalculate existing deadlines.

In **Workflow management**, versions of the same `key` appear as one row in the catalog (described by the latest version with execution counts across all versions). The definition detail header provides a version switch that updates the diagram, execution link and version-scoped parameter panel together, while clarifying that "latest" means the largest version number rather than the version new records necessarily start with.

![Version switcher and version-scoped parameter settings in Workflow management](/assets/core/developing-apps/business-workflows/workflow-version-detail.png)

When **retiring or deleting** a version:

- Keep old definitions and their dependencies registered for as long as bound records, history views, recovery or pending work require them.
- Before deleting a merged version's code, confirm across all relevant deployment environments that it is no longer used and no instances, historical records or pending/continuation tasks need to be retained, processed, viewed or recovered. Remove its registration and creation entry points, while preserving merged migrations and historical data.
- A merged version's `name` and `key` + `version` stay permanently reserved even after deletion; never reuse them for a new definition, and never assign a removed process's `key` to a different process.

## Administrator controls for running instances

When an in-flight record is blocked, needs a temporary pause or must return to an earlier stage, `@nocobase/lifecycle` provides opt-in administrator controls for suspending, resuming, resetting and restarting instances. Commands are disabled by default and record transactional `$manage` audit entries when enabled. For approval-specific actions such as reassignment or adding reviewers, use the [Approval plugin](../using-plugins/collaboration/approval.md) and its domain adapter.

### Policy declaration and storage migration

Enable the commands a process needs via the `management` policy on `defineLifecycle()`. This excerpt from `server/lifecycles/ticket.ts` configures administrator controls for support tickets:

```ts
export const ticketLifecycle = defineLifecycle<TicketTypes>({
  name: 'tickets',
  key: 'tickets',
  version: 1,
  definitionField: 'lifecycleDefinition',
  collection: LIFECYCLE_EXAMPLE_COLLECTIONS.tickets,
  initial: 'new',
  management: {
    field: 'lifecycleManagement',
    suspend: true,
    reset: true,
    resetWhileActive: true,
    restartAt: ['new', 'open', 'awaitingCustomer', 'closed'],
    restartWhileActive: true,
    canEnter: ({ previous, to }) =>
      to === 'new' || to === 'closed' || Boolean(previous.assigneeId),
    set: ({ to }) => ({
      closedReason: to === 'closed' ? 'administrative' : null,
      ...(to === 'new' ? { assigneeId: null } : {}),
    }),
  },
  // ...states, parameters, transitions, triggers
});
```

With the Repository store, enabling `management` requires a migration (see `202611190001_lifecycle_example_ticket_management.ts` in the example):

1. Add the nullable JSON field `management.field` (such as `lifecycleManagement`) and its nullable integer companion `<field>Revision` (`lifecycleManagementRevision`) to the business collection. Existing records with null management state are treated as active in round 1.
2. Add a nullable JSON `management` field and a non-null integer `journalRevision` field (default `0`) to the transition log collection (`lifecycleTransitions`).
3. Replace the transition log's unique constraint on `(lifecycle, recordId, version)` with `(lifecycle, recordId, version, journalRevision)`, keeping `(lifecycle, recordId, requestKey)`. The separate `journalRevision` lets `suspend` and `resume` share the same business version while writing distinct audit entries.

> [!NOTE]
> `management` is part of definition execution behavior and follows the version rules. Adding a `management` policy in v2 and migrating storage enables those commands only for records bound to v2; existing v1 records keep their v1 binding and do not gain v2's controls.

### Management commands and in-flight protection

The four commands have distinct preconditions and runtime effects:

| Command | Preconditions | Effect |
| --- | --- | --- |
| `suspend` | Active and `management.suspend: true` | Preserves the business version and current stay; blocks business transitions (`SUSPENDED`) and pauses trigger waits, effect dispatch and continuations |
| `resume` | Suspended | Continues the same stay, adds pause duration to `pausedMs` and shifts `dueAtField`; runs `management.onResume` in the transaction; dispatches queued runs and due continuations after commit |
| `reset` | `management.reset: true`, suspended or `resetWhileActive: true`, and `canEnter` allows entry | Clears suspension, increments business version and `round`, and starts a new round in `lifecycle.initial` |
| `restartAt` | Target listed in `management.restartAt`, suspended or `restartWhileActive: true`, and `canEnter` allows entry | Clears suspension, increments business version and `round`, and starts a new round in the target state (including the same state when configured) |

`reset` and `restartAt` perform a **managed reentry**: within one transaction they apply `management.set`, invoke `management.onReenter` for domain changes (such as closing old tasks and opening new ones), cancel queued effect runs and fence late continuations (external calls already sent may still complete), and queue only the reentry effects explicitly listed under `management.onEnter`, passing the journaled `management` event in their context.

`management.onResume` runs only for `resume` and receives `previous`, `record`, `suspendedAt`, `now`, `pausedForMs`, `actor`, `event`, `entry`, `services` and `tx`. Perform domain updates (such as shifting task deadlines) through `tx.handle` or transaction-bound `services`. The hook cannot modify lifecycle-owned fields on the resumed instance or call `tx.fire()` on it; any error or prohibited write rolls back the resume, journal entry, request ID reservation and domain writes together so the caller can retry with the same `requestId`.

For domain writes that leave the current stay open — such as recording a vote that does not yet conclude an approval stage — resolve the bound definition and call `tx.requireActive()` inside `runtime.transaction()` to lock the instance and check its binding and suspension before writing through `tx.handle`:

```ts
const definition = await runtime.boundLifecycle(key, recordId);
await runtime.transaction(async (tx) => {
  const record = await tx.requireActive(definition, recordId);
  await assertCurrentStay(tx.handle, record, expectedStayId);
  await writeDomainChange(tx.handle, payload);
});
```

If a domain adapter must acquire its own lock before the instance lock, acquire it in the same order inside `management.prepare`. To check whether a stay has already ended (including through `reset` or `restartAt`), use `findStayExit()` exported by `@nocobase/lifecycle`.

### Management endpoints and UI integration

Load record-scoped controls with `runtime.managementDetails(key, recordId, actor, authorize)`, where `actor` comes from the authenticated session and `authorize` checks the command, bound definition and record scope on the server. It returns `undefined` when the bound definition has no `management` policy or `authorize` denies all commands; otherwise it returns the current state, `suspended` flag, `round`, opaque `version`, allowed `actions`, eligible `targets`, in-flight `work` (`queued`, `running`, `continuation`) and `$manage` audit `history`. When computing available actions and targets, `managementDetails` calls `canEnter` read-only with an empty `reason`.

Expose an authenticated, authorized POST endpoint that dispatches to `runtime.suspend()`, `runtime.resume()`, `runtime.reset()` or `runtime.restartAt()`. This excerpt is from `server/routes/ticket-management.ts`:

```ts
const actor = { id: signedInUser(context) };
const authorize: ManagementAuthorization = (request) =>
  request.actor.id === actor.id && request.lifecycle === 'tickets';
const options = { ...body, actor, authorize };
const data =
  body.command === 'restartAt'
    ? await runtime.restartAt('tickets', recordId, body.target, options)
    : await runtime[body.command]('tickets', recordId, options);
return context.json({ data });
```

Every command requires a nonblank `reason`, the opaque `expectedVersion` from `managementDetails` and an idempotent `requestId`; pass `expectCurrent` when a second-layer stay (such as an approval run) must also match under the instance lock. The runtime always runs `authorize` before idempotent replay:

- Unauthorized requests fail with `MANAGEMENT_FORBIDDEN` (`403` via `lifecycleErrorFields()`).
- Repeating the same `requestId` with matching command, actor ID, `expectedVersion`, trimmed `reason` (and `target` for `restartAt`) returns the original result without re-running `expectCurrent` or hooks; any mismatch returns `CONFLICT` (`409`).
- A stale `expectedVersion` or failed `expectCurrent` check returns `CONFLICT`; refresh the detail and review the current state before submitting a new intent with a new `requestId`.

Render available actions and target states in the UI from `managementDetails`, require a reason and display the target state and consequences before reset or restart. Refresh the record, business actions and management history after success. When showing current-round progress in a diagram, filter transitions with `RecordView.roundStartedVersion` while keeping the full history available for inspection.

![Manage lifecycle dialog on a support ticket detail page](/assets/core/developing-apps/business-workflows/workflow-management-dialog.png)

![Suspended ticket displaying pause notice and management history](/assets/core/developing-apps/business-workflows/workflow-management-suspended.png)

## Progress and history

Reuse the application's shadcn components. The endpoint backed by `runtime.view()` supplies the record, version, candidate actions and history. On the client:

```ts
import { useApiClient } from '@nocobase/app-client';
import { createLifecycleHook } from '@nocobase/lifecycle/react';

export const useOrderLifecycle = createLifecycleHook({
  useTransport: useApiClient,
  basePath: 'lifecycleExample',
});

// Inside the order detail component:
const { view, busy, fire } = useOrderLifecycle('orders', orderId);
```

This configuration requires `GET /lifecycleExample/orders/lifecycle`, `GET /lifecycleExample/orders/:id` and `POST /lifecycleExample/orders/:id/fire` beneath the application's API prefix, with results wrapped in `{ data }`. The Hook does not generate endpoints.

The server filters or annotates `view.available` using the user's permissions. The page uses `allowed` and `blockers` for buttons and explanations, and `busy` during submission. **Pay** calls `fire('checkout')`; **Retry refund** calls `fire('retryRefund')`. Show field errors beside inputs and prompt a refresh after version conflicts. The endpoint still authorizes the actual action.

Show the current stage, transition timeline and effect outcomes separately, including attempts, errors and pending continuations. The Hook polls by default to pick up external results. **Workflow management** in system settings consolidates grouped definition versions, execution lists and execution details while restricting retries, continuations and administrator controls.

Reuse `LifecycleDiagram` from the template or UI Library with the definition, current state and actual history. The diagram is for inspection, not visual workflow design. Clicking it cannot bypass action endpoints to advance a record.

![Order payment workflow](https://static-docs.nocobase.com/20261108090920.png)

## Example and verification

Open **Order payment** in the example project. Create an order and click **Pay**, then simulate payment or decline in **Payment provider (sandbox)**. **Demo options** controls intentional checkout and refund failures. **Hold the webhook** pauses delivery; **Deliver** sends the event and **Deliver again** redelivers it.

| Action | Expected result |
| --- | --- |
| Start payment, pay in the sandbox, then click Ship | Awaiting payment → Paid → Shipped |
| Set checkout failures to 2, then start payment | The third attempt succeeds and the order awaits payment |
| Leave the order unpaid past its deadline | The order closes and becomes Cancelled |
| Hold the payment callback, cancel the order, then deliver it | Cancelled → Refunding → Refunded |
| Set refund failures to 3, pay, then request a refund | Refund needs attention; Retry refund can complete it |
| Redeliver the same payment callback | Replayed, without advancing the order again |

To verify version management and administrator controls, try **Workflow management** (`expenses` / `expenses-v2`) and **Help desk** (`tickets`) in the example project:

- Open **Expense approval** in **Workflow management** and switch between Version 1 and Version 2 to verify independent diagrams and parameter settings; create a new expense report and verify that execution records bind to their version while earlier records continue running v1.
- Open a ticket as an administrator in **Help desk**, click **Manage lifecycle**, run **Suspend** with a reason, and confirm the `Suspended` badge, paused business actions and management history entry; then verify **Resume** restores the stay and wait, and **Reset** / **Restart at** starts a new round in the selected state.

Payments, refunds and callbacks use the example sandbox, with no real funds involved. In the help desk example, administrator authorization covers the entire demo desk; adapt it to record-level business scopes in real applications. Authorization boundaries, `tx.requireActive()` concurrency guards, idempotent replays, transaction rollback and restart recovery still require application integration tests. See [Testing](testing-and-acceptance.md).

Implementation references: [order definitions and effects][order-source], [multi-version expense definition][expense-v2-source], [ticket management endpoint][ticket-management-source], [callback receiver][webhook-source], [versioning design][version-design], [instance management design][management-design], [recovery tests][recovery-tests] and [management tests][management-tests].

[storage]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/docs/design.md#storage
[version-design]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/docs/design.md#versions-of-a-process
[management-design]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/docs/design.md#managing-a-running-instance
[order-source]: https://github.com/nocobase/nocobase/tree/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/examples/app-plugin-lifecycle-example/server/lifecycles
[expense-v2-source]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/examples/app-plugin-lifecycle-example/server/lifecycles/expense-v2.ts
[ticket-management-source]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/examples/app-plugin-lifecycle-example/server/routes/ticket-management.ts
[webhook-source]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/examples/app-plugin-lifecycle-example/server/webhooks/receiver.ts
[recovery-tests]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/tests/pending-continuation.test.ts
[management-tests]: https://github.com/nocobase/nocobase/blob/e6f2e330f552d67b9865d29e9b1ac02466ad42a3/packages/libs/lifecycle/tests/management.test.ts
