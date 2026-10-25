---
title: Record lifecycle
status: Body to be completed
description: A foundation library. A record's status is stored in its own field, transitions between statuses are declared in code, and follow-up steps run after commit and can be retried on failure. NocoBase 3 workflows and approvals are built on it.
---

> [!PENDING] Body to be written
> The profile comes from the NocoBase repository's `v3-develop` branch (2026-10-23). The NocoBase 2 workflow plugin was removed on 2026-10-10, and workflows are now built with the record lifecycle.

## Profile

| | |
| --- | --- |
| Package | `@nocobase/lifecycle` |
| Version | 0.1.0-beta.3 |
| Edition | <span class="tag">Open source</span> |
| Default template | Included |
| Type | Foundation library, used directly, no registration needed |
| Entry points | `@nocobase/lifecycle` (definitions, runtime, storage, flow diagram description), `/jobs` (running follow-up steps, time limit checks, recovery), `/react` (reading records, available actions, submitting), `/testing` |
| UI components | UI library `lifecycle-diagram` (the flow diagram), `workflow-management` (the **Workflow management** page), `flow-diagram` |
| Database tables | Status, status time, and version fields added to the app's own business tables; handling history and follow-up steps are created by the app's migrations |
| Skill | The three references "record lifecycle", "workflow parameters", and "workflow UI" in the app development skill |
| Building block | [Workflows and approvals](../capabilities/workflows.md) |

## Planned contents

- Why the status lives in the record's own field instead of a separate workflow instance
- What a workflow is made of: statuses, transitions, conditions, inputs, follow-up steps, time limits
- Workflow parameters: approvers and thresholds that administrators can adjust
- **Workflow management**: the workflow list, execution records, flow diagram, and parameter form
- Concurrency: two people handling the same record at once
- Not supported today: a drag-and-drop designer, nested statuses, general parallel branches
- Changing a workflow: change the code and deploy, and how existing records are handled
- How this maps to NocoBase 2 workflows
- Development reference
