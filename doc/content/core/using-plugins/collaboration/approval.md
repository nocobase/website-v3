---
title: "Approvals (commercial)"
description: "Connect human approval to record lifecycles, participants, policies and outcomes."
---

`@nocobase/app-plugin-approval` integrates human decisions with record lifecycles, maintaining participants, tasks, evidence and content snapshots. Use it for leave, purchasing or contracts. It is commercial; confirm package access and licensing before installation.

## Prerequisites

The Server entry provides migrations and orchestration APIs. Client provides locales and read-model helpers. It does not generate an approval center, business endpoints or a workflow designer.

The application supplies:

- Business Collections, lifecycles and transactional storage.
- Authentication, business permissions and a people directory.
- Approval definitions, APIs and pages.
- Scheduled checks, notifications and business side effects.

Define stages through public APIs such as `defineApproval`, `stagesFor` and `approvalState`. Register the lifecycle with the host LifecycleRuntime and its approval configuration with `ApprovalService`. One business record identifies the process.

## Configure decisions

Define draft, review, correction and final states, then participants, decision policies and allowed actions. Policies include single, all, any, sequential, threshold and custom aggregation. Transfers and added signers require eligible recipient scopes.

| Question | Configuration |
| --- | --- |
| Who reviews? | Participant resolution, qualification and empty-stage behavior |
| When does it pass? | Decision policy and outcome transitions |
| Can it return or transfer? | Explicit actions, return targets and recipient scopes |
| Can content change? | Frozen fields, content hashes and version checks |
| What follows approval? | Business states and side effects |

## Example: purchasing request

A draft moves to manager review on submission. The manager approves, rejects or returns it to draft. Final decisions and business transitions share a transaction. Returned content is edited through guarded business operations before resubmission.

Use `runViewsFor`, `upcomingStagesFor` and `previewRoute` for progress and eligible actions. The UI Library's `approval-ui` source can render mapped progress, timelines, previews and action controls.

The API rechecks identity, business access, task eligibility and content version. A visible button is insufficient authorization; changed content can require renewed review.

## Scheduled work and verification

The plugin starts no timer. Integrate host Jobs through `createLifecycleJobs`, calling `ApprovalService.sweep()` and `runtime.prune()` from its sweep callback.

Verify empty assignments, decision rules, duplicate actions, returns, content conflicts and transaction failure. Model external execution failures and retries in business state so recovery does not repeat human approval.

Related: [Permission management](../authorization/permissions.md), [Background jobs](../../framework/background/jobs.md), [Transactions](../../framework/database/transactions.md), [Manage plugins](../../developing-apps/manage-plugins.md).

This guide follows the commercial plugin’s public exports and example. Package access and use depend on your license.
