---
title: "Approvals (commercial)"
description: "Bring human approval into the lifecycle of business records, and configure participants, approval policies and outcomes."
---

## Capabilities

`@nocobase/app-plugin-approval` brings human approval into the lifecycle of business records, managing approval participants, tasks, action records and content snapshots. It suits business that needs human confirmation, such as leave, purchasing and contracts. It is a commercial plugin; before installing, confirm you have the corresponding package access and license.

The plugin provides approval orchestration and read models; business pages, APIs, authorization and scheduled execution are composed by the application.

## Scenarios and examples

### Example: purchase requests

The applicant fills in the purchase in a draft, and submitting it sends it to the manager for approval. The manager can approve, reject or return it to draft. When approved, the approval decision and the purchase record's status advance in the same transaction; after being returned, the applicant edits it through an entry the business allows and submits again.

The handling page should show progress and available actions with public read models such as `runViewsFor`, `upcomingStagesFor` and `previewRoute`. The application can install the source of the `approval-ui` component from the UI Library to map the read models into a progress bar, timeline, preview and action bar.

The API must recheck the current user, record permissions, task eligibility and content version; showing an "Approve" button in the browser is never enough to allow the submission. After the approval content changes, an earlier approval may need to be reviewed again.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use the licensed Approval plugin for manager review of purchase requests. Keep
the business record lifecycle and define draft, review, return and final states
with eligible reviewers. Use public read models and approval UI for progress and
actions; recheck eligibility and content versions in APIs. Commit final decisions
and business state together, and integrate host Jobs sweeps. Test empty assignments,
duplicates, returns, conflicts and transaction failure.
```

**Done when**: purchase requests can be submitted, approved or returned; ineligible actions are rejected, and a failed transaction leaves no inconsistent final state.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| Business lifecycle, approval configuration and transactional storage | Combine approval stages, participants and the mapping of decisions | The purchase record's status stays consistent with the approval result |
| Business APIs and the details page | Connect read models, progress and authorized actions | Applicants and approvers each see the actions they may perform |
| Jobs and follow-up business processing | Connect sweep, prune and the status of external execution | Scheduled work and business failures both have clear handling |

### Prepare before integrating

The plugin's Server entry provides migrations for approval data and the public orchestration API, and the Client entry provides language resources and read model tools; the plugin does not generate an approval center, business APIs or a workflow designer.

The application needs to provide:

- Business Collections, record lifecycles and their transactional storage.
- Authentication, business permissions, and queries of organizations and people.
- Approval configuration, action APIs and business pages.
- Scheduled checks, and integrations such as notifications and business execution after submission.

Declare the approval flow with `defineApproval`, `stagesFor`, `approvalState` and similar exports from `/server`, then hand the lifecycle to the host's LifecycleRuntime and the approval configuration to `ApprovalService`. One business record corresponds to one flow; do not create a separate "flow status" for approval that is detached from the business status.

### Configure approvals

First settle the draft, in-approval, returned-for-changes and final states, then set the participants, decision rules and allowed actions for each approval stage. The public policies cover single approver, all must approve, any one approves, sequential, threshold-based and custom aggregation; transfers and added approvers also need a configured range of recipients to choose from.

| Business question | What to configure |
| --- | --- |
| Who approves | How participants are resolved, whether people are valid, and what to do with no approver |
| When it counts as approved | The stage's decision rule, and how approval results map to business status |
| Whether it can be returned or transferred | Explicitly declared actions, return targets and recipient range |
| Whether data can change during approval | Frozen fields, a content hash and version checks |
| What happens after approval | The business lifecycle's next status and side effects |

## AI development constraints and verification

### Development constraints for this plugin

- Reuse the business record as the flow's identifier; never maintain a second status detached from the business status.
- A visible button does not mean permission to approve; the server must check the user, record, task eligibility and content version together.
- Verify repeated actions, concurrent actions and a failed final transaction on isolated data; when external execution fails, use a business retry status rather than having people approve again.

### Scheduled work and verification

The plugin runs no timers of its own. The application connects the host's Jobs through `createLifecycleJobs` and calls `ApprovalService.sweep()` and `runtime.prune()` in the sweep callback to handle task timing and lifecycle triggers.

Verify cases such as no approver, different decision rules, repeated actions, returning for changes, content conflicts and a failed final transaction. Later failures of external execution should be carried by failure and retry statuses visible on the business record, so people do not have to approve again.

Related documentation: [Permission management](../authorization/permissions.md), [Background jobs and executors](../../framework/background/jobs.md), [Transactions](../../framework/database/transactions.md), [Manage plugins](../../developing-apps/manage-plugins.md).

This guide was checked against the commercial plugin's public exports and example; obtaining and using the package depend on your license.

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).
