---
title: "Approvals (commercial)"
description: "Connect human approval to record lifecycles, participants, policies and outcomes."
---

## Capabilities

`@nocobase/app-plugin-approval` integrates human decisions with record lifecycles, maintaining participants, tasks, evidence and content snapshots. Use it for leave, purchasing or contracts. It is commercial; confirm package access and licensing before installation.

The plugin supplies approval orchestration and read models; the application composes pages, APIs, authorization and timers.

## Scenarios and examples

### Example: purchasing request

A draft moves to manager review on submission. The manager approves, rejects or returns it to draft. Final decisions and business transitions share a transaction. Returned content is edited through guarded business operations before resubmission.

Use `runViewsFor`, `upcomingStagesFor` and `previewRoute` for progress and eligible actions. The UI Library's `approval-ui` source can render mapped progress, timelines, previews and action controls.

The API rechecks identity, business access, task eligibility and content version. A visible button is insufficient authorization; changed content can require renewed review.

**Development prompt** (for a Coding Agent working in the application directory):

```text
Use the licensed Approval plugin for manager review of purchase requests. Keep
the business record lifecycle and define draft, review, return and final states
with eligible reviewers. Use public read models and approval UI for progress and
actions; recheck eligibility and content versions in APIs. Commit final decisions
and business state together, and integrate host Jobs sweeps. Test empty assignments,
duplicates, returns, conflicts and transaction failure.
```

**Done when**: Purchases can be submitted, approved or returned; ineligible actions are denied and transaction failures leave no inconsistent final state.

## Key principles and implementation

These are the integration areas and expected interface changes for this example. They describe development work; use the actual file layout of your application.

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Business lifecycle, approval config and transactional storage | Compose stages, reviewers and outcomes | Keep purchase state consistent with decisions |
| Business APIs and detail page | Integrate read models, progress and guarded actions | Applicants and reviewers see appropriate operations |
| Jobs and follow-up execution | Integrate sweeps, pruning and execution states | Handle scheduled work and business failures explicitly |

### Prerequisites

The Server entry provides migrations and orchestration APIs. Client provides locales and read-model helpers. It does not generate an approval center, business endpoints or a workflow designer.

The application supplies:

- Business Collections, lifecycles and transactional storage.
- Authentication, business permissions and a people directory.
- Approval definitions, APIs and pages.
- Scheduled checks, notifications and business side effects.

Define stages through public APIs such as `defineApproval`, `stagesFor` and `approvalState`. Register the lifecycle with the host LifecycleRuntime and its approval configuration with `ApprovalService`. One business record identifies the process.

### Configure decisions

Define draft, review, correction and final states, then participants, decision policies and allowed actions. Policies include single, all, any, sequential, threshold and custom aggregation. Transfers and added signers require eligible recipient scopes.

| Question | Configuration |
| --- | --- |
| Who reviews? | Participant resolution, qualification and empty-stage behavior |
| When does it pass? | Decision policy and outcome transitions |
| Can it return or transfer? | Explicit actions, return targets and recipient scopes |
| Can content change? | Frozen fields, content hashes and version checks |
| What follows approval? | Business states and side effects |

## AI development constraints and verification

### Plugin-specific development constraints

- Use the business record as process identity instead of a disconnected second state.
- A visible action does not authorize approval; recheck user, record, task eligibility and content version.
- Test duplicates, concurrency and final transaction failure with isolated data. Recover external execution through business retry states, not repeated human decisions.

### Scheduled work and verification

The plugin starts no timer. Integrate host Jobs through `createLifecycleJobs`, calling `ApprovalService.sweep()` and `runtime.prune()` from its sweep callback.

Verify empty assignments, decision rules, duplicate actions, returns, content conflicts and transaction failure. Model external execution failures and retries in business state so recovery does not repeat human approval.

Related: [Permission management](../authorization/permissions.md), [Background jobs](../../framework/background/jobs.md), [Transactions](../../framework/database/transactions.md), [Manage plugins](../../developing-apps/manage-plugins.md).

This guide follows the commercial plugin’s public exports and example. Package access and use depend on your license.

These are acceptance requirements for your integration, not claims of completed live verification. Ask the Agent to report actual changes, executed checks and unverified items. See [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md) for project guidance, Skills and shared checks.
