---
title: Make a request
description: Create tasks through a conversation or form, with clear rules, scope, and acceptance criteria.
---

Describe the problem, business rules, and how you will check the result. Studio records the request as a task. The Lead Agent arranges execution once it starts.

## Start with a conversation

1. Select **New issue** in My issues, the issue list, or a project. You can also press <kbd>C</kbd> in a list.
2. Describe the request and attach relevant images or documents.
3. Answer questions and review the tasks the Agent creates.
4. Select **Start** to hand work to the Agent team, or **Not now** to keep it in Backlog.

![A new-task conversation includes the current project context](https://static-docs.nocobase.com/studio-en-guide-new-task-20261031.png)

```prompt
Show each supplier’s score and tier in the supplier list. Buyers should be able to filter by tier. Suspended suppliers must not receive new orders.
```

You can also create tasks from an existing discussion. See [My sessions](sessions.md).

## Fill in a task directly

Select **Fill in manually** in the new-task conversation:

1. Enter a title and description. Check the project and owner.
2. Choose to start now or later.
3. Select **Create and start** or **Create**.

![Enter the task’s title, requirements, and start option](https://static-docs.nocobase.com/studio-en-guide-manual-task-20261031.png)

The owner confirms business rules and accepts results. Backlog tasks do not run automatically; select **Start** when ready.

## Write a clear request

| Include | Example |
| --- | --- |
| Goal | Help buyers identify high-risk suppliers |
| Business rule | All tier C orders need approval, regardless of value |
| Acceptance scenario | A small tier C order must enter approval |
| Scope | Apply to new orders; do not reapprove historical orders |
| References | Use the Supplier scoring sheet in the knowledge base |

When the approach is unclear, ask the Agent to compare options and their effects first.

## Larger requests

The Lead Agent arranges design, development, and review steps. Split independently accepted work into subtasks.

- Create subtasks from the task page, or ask an Agent to draft them from the parent request.
- Subtasks in later stages wait for earlier stages to finish.
- Add predecessors in task properties to wait until dependencies are done or canceled.

Priority affects which queued work runs first. Add requirements later in [task details](follow-progress.md).
