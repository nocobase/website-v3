---
title: Workflows and approvals
description: Move business documents forward in stages: who can do what under which conditions, how waiting and timeouts are handled, and what happens when a follow-up step fails; multi-person approvals; scheduled jobs. Workflows live in code, and administrators view them and adjust their parameters in Workflow management.
---

A purchase order passes through several stages from submission to completion: the department manager approves it, large amounts also need finance approval, a buyer places the order, and a receiver registers the delivery. Only specific people can act at each step, a rejection needs a reason, the requester is notified once approval is done, and approvers get a daily reminder about the backlog. All of this belongs to this building block.

> [!NOTE] Different from NocoBase 2 workflows
> NocoBase 3 has no drag-and-drop workflow designer. A workflow's structure (its stages and how it moves between them) is written in the app's code by an agent, following your description. Administrators use **Workflow management** to view the flow diagram, check execution records, and adjust parameters such as approvers and amount thresholds. The NocoBase 2 workflow plugin was removed in October 2026.

## The four layers

| Layer | What it covers |
| --- | --- |
| **Ready out of the box** | Record lifecycle: the status is stored in the record's own field and changes only through declared transitions; conditions and inputs are checked before a transition; if two people act at once, the later submission gets a conflict instead of overwriting; follow-up steps after a transition (sending a notification, calling an external system) run after commit and can be retried on failure; a complete handling history. The **Workflow management** page and the flow diagram component. Scheduled jobs: run on time rules, with every run recorded. Approvals and the task center in the commercial edition |
| **Agents build in the app** | Each workflow's definition: stages, transitions, who can act, conditions, time limits, and follow-up steps; the action buttons, current stage, and handling history on document pages; the **Workflow management** page; approval pages; what each scheduled job does |
| **Administrators adjust after launch** | In **Workflow management**, view flow diagrams and execution records and adjust workflow parameters (approval department, approvers, amount thresholds); new documents follow the new values. On the scheduled jobs page, view run records and enable or disable jobs |
| **Configured at deployment** | Whether background jobs use memory or Redis (`jobs`): memory is fine for a single process, but multiple instances must use Redis; licenses for commercial plugins |

Changing a workflow's structure, such as adding a stage or changing a transition, is still a code change and a redeploy. When you write the request, say which values might need adjusting after launch, and the agent will make them workflow parameters.

## Provided by

| Package | What it does | Edition | Default template |
| --- | --- | --- | --- |
| [Record lifecycle](../plugins/lifecycle.md) (foundation library) | Workflow definition, running, handling history, and workflow parameters | <span class="tag">Open source</span> | Included |
| [Scheduled jobs](../plugins/scheduler.md) | Run on a schedule and record every run | <span class="tag">Open source</span> | <span class="tag ok">Enabled</span> |
| Background jobs (foundation library `@nocobase/jobs`) | Runs scheduled jobs and workflow time limits | <span class="tag">Open source</span> | Included |
| [Approvals](../plugins/approval.md) | Multi-level, all-sign, any-sign, vote-count, add a signer, transfer, send back | <span class="tag pro">Commercial</span> | — |
| [Task center](../plugins/task-center.md) | Gathers each person's to-dos; the Approvals plugin depends on it | <span class="tag pro">Commercial</span> | — |

The UI library components related to workflows are `workflow-management` (the **Workflow management** page), `lifecycle-diagram` (the flow diagram), `approval-ui` (approval progress, history, expected route, and action bar), and `task-center-ui`.

## What you see in the app

**System settings › Workflow management**: when the app has workflows, agents build this page by default. **Workflow definitions** lists every workflow in the app, and opening one shows its flow diagram and workflow parameters. **Execution records** lists how each document moved, and opening one shows its handling history and the follow-up steps that ran.

::figure core-workflow-mgmt | **Workflow management**: the workflow definitions and the purchase order's workflow parameters. The actual content depends on the workflows in your app

**On business documents**: the current stage, the actions available now, the handling history, and the flow diagram if you want it. Agents build this into the document detail page to fit your request, so it differs from app to app.

## How to write the request

Beyond the [points that apply to every request](index.md#what-to-state-in-every-request), a workflow needs these to be clear:

- **Stages**: where it starts, which stages it passes through, and which are end states;
- **Who can do what at each step**: who can submit, approve, reject, or send back, and which step a rejection or send-back returns to;
- **Conditions and required inputs**: for example, a rejection must include a reason, and a delivery must include an uploaded receipt;
- **Waiting and time limits**: how long without action before a reminder or escalation;
- **Follow-up steps**: whom to notify, which external system to call, and what to do when that fails;
- **Approvals**: who approves at each approval stage, whether one approver is enough or all must approve, and whether a signer can be added or the task transferred;
- **Values to adjust after launch**: approvers, approval department, amount thresholds.

Example:

```text
Add a workflow to purchase orders: Draft → Pending approval → Pending purchase → Delivered → Completed.
After the requester submits, the department manager approves; amounts over 50,000 also need finance approval, and an administrator can change that amount later.
Approvers can approve or reject; a rejection must include a reason, and the order goes back to the requester to edit and resubmit.
After a buyer places the order, it moves to Pending purchase; once a receiver confirms delivery and uploads the receipt, it moves to Delivered; the requester confirms to complete it.
The order detail page only offers actions available at the current stage, and ordinary editing cannot change the stage directly. When several people act at once, do not overwrite results someone else has already submitted.
After each approval ends, notify the requester with an in-app message; a failed notification must not affect the approval result and must be retryable.
In Workflow management I can see this workflow, its execution records, and the amount threshold.
```

The approval part needs the Approvals plugin. If the app does not have it yet, the agent tells you a commercial license is required and registers the plugin once you confirm. If a single person just confirms or rejects, use the workflow's own actions; the Approvals plugin is not needed.

## How to check the result

- [ ] Walk the full workflow with different accounts, and each stage shows only the actions the current user can take.
- [ ] Ordinary editing cannot change the stage, and a direct API call that changes the stage is rejected too.
- [ ] A rejection cannot be submitted without a reason, and a delivery cannot be submitted without the receipt.
- [ ] Two people act on the same document at once: the later submission gets a notice, and the earlier result is not overwritten.
- [ ] The handling history records each step's actor, time, action, stages before and after, and reason, and steps run automatically are marked as run by the system.
- [ ] **Workflow management** shows the workflow, its flow diagram, and its execution records; after you change the amount threshold, newly submitted documents follow the new value.
- [ ] Make a notification fail once and confirm the approval result is unaffected and the notification can be retried.
- [ ] A scheduled reminder runs at the set time with its result in the run records, and stops running once disabled.

## Limits and common questions

**Not supported today**: a drag-and-drop designer, nested stages, and general parallel branches. For work that needs parallel handling, split it into child documents that advance separately and let their completion move the main document forward.

**If an approval passes, is the follow-up work always done?** Not necessarily. An approval is a decision; payment, reserving resources, and updating official data are follow-up steps that can fail. When you check the result, you should be able to see how those steps ended, and failures need a retry or manual handling.

**After a multi-instance deployment, a scheduled job ran twice or not at all?** Check the `jobs` configuration: multiple instances must use Redis, and Redis must have persistence on. With memory only, every instance runs its own copy.

**What happens to documents already in flight when the workflow code changes?** Ask the agent to explain which stage each existing document maps to in the new workflow, and adjust with a migration if needed; verify in an environment that has data before launch.

## How this maps to NocoBase 2

| NocoBase 2 | NocoBase 3 |
| --- | --- |
| Configure workflows on a canvas | Workflows are written in code; view the flow diagram in **Workflow management** |
| Collection events, after-action triggers | Record transitions and the follow-up steps that run after them |
| Schedule trigger | The Scheduled jobs plugin |
| Approval plugin | The Approvals plugin <span class="tag pro">Commercial</span>, attached to the record's lifecycle |
| Edit node settings in the UI | Administrators adjust workflow parameters; structural changes are code changes |
| Execution history | **Workflow management › Execution records** and the document's handling history |

## Pages in this group

The scenario pages below will be rewritten from the existing Workflows, Approvals, and Scheduled jobs pages:

| Page | Source |
| --- | --- |
| Workflow stages and action control | Workflows › Workflow definition and action control |
| Waiting, timeouts, and reliable execution | Workflows › Waiting, timeouts, and reliable execution |
| Handling history and execution records | Workflows › Workflow progress and handling records |
| Workflow parameters | New |
| Multi-level and conditional approval | Approvals › Multi-level and conditional approval |
| All-sign, any-sign, and pass rules | Approvals › All-sign, any-sign, and pass rules |
| Adding a signer and transfer | Approvals › Adding a signer and transfer |
| Handling requests and progress | Approvals › Handling requests and progress |
| Scheduled jobs | Scheduled jobs › Usage |
| Task center | New |
