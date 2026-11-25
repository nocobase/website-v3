---
title: "Lifecycle Coordination"
description: "Coordinate parent lifecycles waiting on independent child processes with conditional branches, thresholds or strategies, cooperative cancellation and durable recovery."
minimumEdition: professional
---

## Capabilities

`@nocobase/app-plugin-lifecycle-coordination` is a server-only plugin that adds parent-child orchestration, outcome aggregation, cooperative cancellation and durable recovery to [workflows](../../developing-apps/business-workflows.md) built on `@nocobase/lifecycle`. It exposes no public HTTP routes or frontend pages; the application owns business tables, APIs, authorization and UI. Confirm package access and licensing before installation; see [Manage plugins](../../developing-apps/manage-plugins.md).

| Capability | Provided by the plugin | Handled by the application |
| --- | --- | --- |
| Coordination ledger and migration | `lifecycleCoordinations` ledger table and migration on the default connection | Maintain lifecycle and definition-binding fields on business tables, plus a `coordination` JSON field on child tables |
| Conditional branching and aggregation | `LifecycleCoordinator`, `waitingState()` and `complete()`, supporting conditional branches, integer thresholds and versioned strategies | Declare parent/child definitions, branch conditions, terminal outcome hooks and protected conclusion transitions |
| Exit handling and cooperative cancellation | `retain` and `cancel` remaining-work policies, withdrawal isolation across rounds, and nested coordination up to 16 levels | Declare child cancellation transitions and business compensation (such as refunds or inventory release) |
| Transaction retry and durable recovery | `transaction()` conflict retries, `recover()` / `resume()` for pending settlements and cancellations, and `inspect()` diagnostics | Call `recover()` at startup and from periodic durable jobs (`onSweep`), and monitor returned errors |
| Process diagram metadata | Optional fourth argument on `waitingState()` for nested child definitions and conclusion edges | Render definition diagrams, execution diagrams and round-scoped child drill-downs in host pages |

[Approvals](approval.md) and Lifecycle Coordination are peer extensions with no mandatory dependency between them. A coordinated child lifecycle can include approval stages internally and report only its eventual business terminal outcome to the parent.

## Scenarios and examples

Lifecycle Coordination fits two main scenarios:

1. **Parallel branches**: A parent enters a waiting stage and conditionally starts multiple branches that run independently. At the join, the coordinator applies a configured policy (all succeeding, a success threshold or a versioned custom strategy) to decide the parent's next transition, and either retains or cooperatively cancels unfinished branches.
2. **Child processes**: A stage is modeled as a separate child process—even a single child with no parallel branches—so it keeps its own lifecycle, revisions, human approvals, external effects and retries, reporting back to the parent only when it reaches a business terminal state. Child processes can also nest further child processes.

Adjacent capabilities fit simpler structures better:

- Sequential transitions, conditional routing, guards and effects on one record: use [Workflows](../../developing-apps/business-workflows.md) directly.
- Multiple people voting or signing off on one record: use [Approvals](approval.md). Add Lifecycle Coordination only when branches are independent multi-step child processes.
- Standalone asynchronous work and retries: use [Background tasks](../../developing-apps/background-tasks.md).

The activated branch set is fixed for each round when the parent enters the waiting state. Dynamically adding or removing branches mid-round, cross-database distributed transactions, global pause/resume and forced termination of running code are outside this plugin's contract.

### Example: Parallel procurement reviews with conditional branches

When a purchase request is submitted, it enters a waiting stage that always starts a Legal review and conditionally starts a Finance review when financial assessment is required. Legal and Finance each have their own lifecycle with revisions, resubmission, approval and execution. Depending on the purchase policy, the request orders when all selected departments succeed, or when any one succeeds while requesting cooperative cancellation of the other. If a department approves but its follow-up execution fails, that branch counts as failed.

Prerequisite: purchase and department review collections, authentication and authorization, `@nocobase/lifecycle` with host Jobs, and the Lifecycle Coordination plugin installed and registered as described in [Manage plugins](../../developing-apps/manage-plugins.md).

**Development prompt** (for a Coding Agent working in the application directory):

```prompt
Add parallel department reviews to purchase requests: submitting a request always starts Legal review, and starts Finance review as well when financial assessment is checked. Legal and Finance should each support revisions, resubmission, approval and execution. Based on the purchase policy, move to ready-to-order either when all selected reviews succeed or as soon as one succeeds while cancelling the unfinished branch. If execution fails after approval, treat that branch as failed. Show the execution diagram and branch progress on the purchase detail view.
```

The plugin itself ships no UI. The screenshot below is from the companion example plugin mounted in a host application, showing a purchase request waiting in parallel review where Legal has succeeded and Finance is still in review.

![Procurement coordination execution diagram and branch progress in the example host UI](/assets/core/lifecycle-coordination/coordination-execution.png)

### Example: Nested child processes and cooperative cancellation

A bulk customer order requires multi-level fulfillment: submitting the order starts Warehouse Preparation and Logistics Preparation in parallel, and each of those starts Quality Inspection and Document Verification sub-steps. Every level requires all children to succeed before reporting upward. If any step fails—or if the account manager withdraws the order before completion—unfinished sibling and descendant processes receive cooperative cancellation requests. Resubmitting the order opens a new round whose progress cannot be affected by late results from the old round.

**Development prompt** (for a Coding Agent working in the application directory):

```prompt
Model bulk order fulfillment as a nested parent-child workflow: submitting an order starts Warehouse Preparation and Logistics Preparation in parallel, and each starts Quality Inspection and Document Verification sub-steps. Every level must have all children succeed before advancing its parent; if any step fails or the order is withdrawn, cooperatively cancel unfinished child processes. Resubmitting a withdrawn order should start a fresh round isolated from any late results in the previous round.
```

Intermediate child lifecycles retain the `coordination` binding supplied by their parent while opening their own `waitingState()` for lower-level children; they report upward only after reaching their own business terminal state.

## Principles and implementation

These are typical integration areas and visible changes for the scenarios above; adapt filenames to your application layout.

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| `server/plugins.ts` and migrations | Register the Lifecycle Coordination Server plugin and apply migrations; add binding columns to business and child tables | Creates `lifecycleCoordinations` and binds business records to exact definition versions and parent runs |
| Lifecycle definitions and coordinator Provider | Construct `LifecycleCoordinator`, declare `waitingState()`, terminal `complete()` hooks and `protect()` | Forks selected children on entry and settles the parent once thresholds or strategies decide |
| Host Jobs and startup wiring | Call `coordinator.recover()` at startup and inside `onSweep` after registering definitions and strategies | Recovers pending settlements and cancellation deliveries across restarts and transient failures |
| Business APIs and detail pages | Wrap concurrent boundaries in `coordinator.transaction()` and expose authorized views from `inspect()` | Safely retries optimistic conflicts and displays round status and nested execution diagrams |

### Setup and definition binding

Register the default export from `@nocobase/app-plugin-lifecycle-coordination/server` in `server/plugins.ts` and apply database migrations (no Client or CLI plugin registration is needed). Construct one `LifecycleCoordinator(runtime, createRepositoryCoordinationStorage(database, store))` per `LifecycleRuntime` using the **same `LifecycleStore` and database connection**. Independently recovered runtimes must use separate ledger collections.

Every participating definition must declare a stable `key`, numeric `version` and `definitionField` (such as `lifecycleDefinition`):

- At creation, the runtime writes the exact definition name (for example `procurement.v1` or `procurement.legal.v1`) into `definitionField` and rejects operations through a different definition.
- Branch `lifecycle` values and `protect()` arguments must use exact registered definition names rather than process keys or `latest` lookups.
- Child collections also require a `coordination` JSON field written by the coordinator at creation; business routes must not modify it.
- When behavior changes, register a new definition or strategy version and keep old implementations registered while outstanding runs or cancellation deliveries still reference them.

### Define waiting states, aggregation and exit policies

The excerpt below shows how to configure a coordinator, declare a waiting state, protect conclusion transitions and report a child terminal outcome (business validation and route authorization omitted):

```ts
// server/services/procurement.ts (excerpt)
import {
  LifecycleCoordinator,
  createRepositoryCoordinationStorage,
} from '@nocobase/app-plugin-lifecycle-coordination/server';

const coordinator = new LifecycleCoordinator(
  runtime,
  createRepositoryCoordinationStorage(database, store),
);

// Inside the parent definition's states (for example procurement.v1):
coordinator.waitingState('waiting', 'reviews', ({ record }) => ({
  key: 'reviews',
  success: 'order',
  failure: 'reject',
  remaining: 'cancel',
  branches: (record.financeRequired ? ['legal', 'finance'] : ['legal']).map(
    (department) => ({
      key: department,
      lifecycle: `procurement.${department}.v1`,
      values: { department },
      outcomes: {
        succeeded: ['succeeded'],
        failed: ['failed'],
        cancelled: ['cancelled'],
      },
      cancelTransition: 'cancel',
    }),
  ),
}));

// After runtime.register(parent), before accepting work:
coordinator.protect('procurement.v1', ['order', 'reject']);

// Inside a child definition's terminal state:
{
  name: 'succeeded',
  final: true,
  onEnterState: (context) =>
    coordinator.complete(context, 'succeeded', { receipt: 'business-result' }),
}
```

Key mechanisms:

- **Protected conclusions**: `success` and `failure` transitions must leave the waiting state with `manual: false` and be registered with `coordinator.protect()`. A scoped server permit guards settlement so external callers cannot force conclusions.
- **Thresholds and versioned strategies**: Omitting `required` requires all selected branches to succeed (zero selected branches succeed after entry commits). Use `required: 1` for any-one success or `required: K` for at least `K` successes. Both failure and cancellation reduce remaining attainable successes; once the threshold is unreachable, failure is selected immediately. For branch-identity rules (such as mandatory Finance success), register a pure `CoordinationStrategy` with `coordinator.registerStrategy({ name, version, decide })` and retain its version while runs remain recoverable.
- **Exits and cooperative cancellation**: `waitingState()` installs both entry and exit hooks so withdrawal or any exit invalidates the previous round. `remaining: 'retain'` leaves unfinished children running; `remaining: 'cancel'` durably delivers the declared `cancelTransition`. `cancellation: 'delivered'` only confirms the transition committed; `outcome: 'cancelled'` is recorded only when the child reaches its declared terminal state. External compensation such as refunds belongs to child states and effects.
- **Management reentry and nesting**: If a parent definition enables administrative reset or restart, wire the waiting state's `onReenter` callback into `management.onReenter`. Nested coordination uses the same binding up to a depth limit of 16 levels.

### Transaction boundaries, recovery and diagrams

Child completion and its reported outcome commit in the **child's own transaction**, while parent settlement runs in a **separate transaction after commit**. This intentional boundary ensures a parent guard failure or next-stage allocation failure preserves the child's committed work and leaves the run pending with a visible error for recovery rather than repeating external effects.

At server operation boundaries that may concurrently complete children or exit parents, wrap pure database work in `coordinator.transaction(tx => ...)`. It retries the entire transaction up to five times on optimistic conflicts, serialization errors or deadlocks; keep external calls inside durable lifecycle effects.

The plugin starts no independent timer. After registering all definitions, conclusion guards and strategy versions, call `coordinator.recover()` on startup and inside the host's durable lifecycle jobs `onSweep`, inspecting and alerting on returned errors. Use `resume(id)` to retry a single run and `inspect(id)` to read rounds, branch states, cancellation delivery status and errors.

To display nested process diagrams in host UI, pass graph metadata as the fourth argument to `waitingState()` (`{ nested: true, conclusions: ['order', 'reject'], branches: [...] }`). At runtime, host pages can open the waiting node by round and child record ID to highlight visited states and traversed transitions from persisted lifecycle history.

## AI development constraints and verification

### Plugin-specific development constraints

- Read the `nocobase-app-plugin-lifecycle-coordination` Skill and `docs/coordination.md` from the installed package to confirm signatures and storage contracts.
- All APIs are server-only integration primitives. Authorize business actions in host routes; never expose raw `complete()`, arbitrary transitions or direct writes to `lifecycleCoordinations` or child `coordination` / `definitionField` columns.
- Never call `complete()` synchronously inside a child's creation hooks, before its record identity is bound.
- When a child uses Approvals, partial votes or an approval that still requires external execution must not report a child success outcome; report only from the eventual business terminal hook.
- Do not prune runs with outstanding children or pending cancellation deliveries, and retain old definition and strategy versions until in-flight runs finish.

### Recovery and acceptance checks

- **Branching and thresholds**: Verify only matching conditional branches are created. For three branches with `required: 2`, test three runs: one success keeps waiting, two successes settle immediately, and one failure plus one cancellation fails immediately—each advancing the parent once.
- **Nesting and withdrawal isolation**: Verify bottom-level completions advance intermediate lifecycles before the top parent, and verify late results from a withdrawn round cannot advance a resubmitted round.
- **Cancellation and idempotency**: Verify `retain` lets unfinished branches continue while `cancel` delivers cooperative cancellation and distinguishes `delivered` from a terminal `cancelled` outcome; confirm repeated requests and deliveries create no duplicate children or conclusions.
- **Concurrency and recovery**: Verify concurrent child completions settle once; test dropped post-commit wakeups, application restarts, parent settlement failures and missing strategy versions to confirm `recover()` settles repaired runs and surfaces errors.

Related: [Workflows](../../developing-apps/business-workflows.md), [Approvals](approval.md), [Background tasks](../../developing-apps/background-tasks.md), [Transactions and data consistency](../../developing-apps/transactions-and-consistency.md), [Manage plugins](../../developing-apps/manage-plugins.md).

This guide follows the commercial plugin's public exports, bundled Skill and example plugin; the screenshot was captured from a local example run. Package access and use depend on your license.

These are acceptance requirements for your integration, not claims of completed business verification. Ask the Agent to report actual changes, executed checks and unverified items. See [Refine and continue developing](../../../getting-started/develop-your-first-app.md#refine-and-continue-developing) and [Testing](../../developing-apps/testing-and-acceptance.md) for project guidance, Skills and shared checks.
