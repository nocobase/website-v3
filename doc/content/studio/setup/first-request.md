---
title: Walk through your first request
description: Submit a small request, follow Agent development, answer questions, and accept the result.
---

After accepting your invitation, open the project your administrator prepared. Start with a small request and follow it through to merge.

## Before you start

- The project's **Initialize project** task is complete.
- The Lead Agent is configured and at least one runtime is online.
- The repository has a [check source](ci.md). Prepare a preview or test environment if you need to try the application.

## 1. Submit a request

Select **New issue** in the project and describe the goal and how you will check it. For example:

```prompt
Add a supplier page with name, contact person, phone, and partnership status. Buyers should be able to add, edit, and view suppliers.

I want to add a supplier, change its status to suspended, and filter the list by status.
```

The Agent clarifies missing rules and creates a task. Review it and select **Start**. You can also choose **Fill in manually** to create the task directly.

![Use a conversation to define the goal and business rules](https://static-docs.nocobase.com/studio-en-guide-new-task-20261031.png)

The task moves to **In progress**. The Lead Agent arranges design, development, and review.

## 2. Follow development

The task header shows the active Agent, runtime, and next step. **Activity** keeps handoffs, replies, and review results. **Runs** provides execution details.

![Task details show the current step and what comes next](https://static-docs.nocobase.com/studio-en-guide-task-progress-20261031.png)

## 3. Answer questions

When a business decision is needed, the task becomes **Blocked** and appears under **Waiting for you** in **My issues**. Reply to the **Needs you** card with the rule or missing information. The Lead Agent continues from your answer.

For missing checks or previews, ask an administrator to follow [Checks and CI](../configure/checks.md).

## 4. Accept the result

When the task is **In review**:

1. Read the delivery report, including changes, verification, and remaining issues.
2. Select **View changes** to inspect the PR. Try the acceptance scenarios in a preview when available.
3. Select **Merge** when the result meets the requirements. Confirm the target branch and merge method.
4. Otherwise, select **Send back** and describe the problem and expected result.

![Check the delivery report against the acceptance criteria](https://static-docs.nocobase.com/studio-en-guide-accept-20261031.png)

Development is complete when the task is **Done** and its changes are on the default branch. Follow testing and release progress in [Releases](../release/overview.md).

## Common problems

| Situation | Action |
| --- | --- |
| Work has not started | Read the waiting reason in the task header; check runtime connectivity and capacity |
| Waiting for initialization | Resolve the Initialize project task first |
| The Agent cannot verify the UI | Check the runtime's browser installation and dependencies |

Continue with everyday work in [My issues](../use/my-tasks.md).
