---
title: Follow progress
description: Read the active step, handoffs, and run history, and add requirements through comments.
---

Task details bring together active execution, next steps, and delivery results. Add a comment when requirements need clarification or changes.

## Task details

![The summary shows who is working and what comes next](https://static-docs.nocobase.com/studio-en-guide-task-progress-20261031.png)

| Area | Content |
| --- | --- |
| Now | Actual execution state: the active Agent and runtime, or a waiting reason |
| Next | The Lead Agent's next step |
| Needs you | A question or acceptance request with actions |
| Delivery report | Changes, verification, and acceptance criteria |
| Properties | Owner, executor, priority, labels, and dates |

**Activity** keeps comments and status changes. It shows conversations by default; select **All** for system records. **Description** holds requirements, **Code & previews** groups PRs and checks, and **Runs** records Agent executions. Subtasks appear when present.

## Communicate through comments

- **Comment**: add requirements, answer questions, or `@` an Agent. This wakes the relevant Agent and the task executor.
- **Note**: record information without waking an Agent.
- **Reply**: continue a discussion under its original comment.

```prompt
After a supplier is suspended, existing orders must remain readable and allow receiving goods. Only new orders should be blocked. Please update the behavior accordingly.
```

Changed requirements affect later work. Say explicitly when you want discussion without changes.

## Ask an Agent

**Ask agent** opens a private conversation with the task context. Use it to investigate blockers or understand changes. Write conclusions back to a task comment to share them with project members.

## Run history

![Inspect the Agent, status, duration, and transcript of each execution](https://static-docs.nocobase.com/studio-en-guide-runs-20261031.png)

| Action | Purpose |
| --- | --- |
| View transcript | Read the execution process and result |
| View full prompt | Check the context the Agent received |
| Stop | Request that active work stop; existing changes are not undone |
| Retry | Queue a failed run again |

After stopping, inspect completed work before explaining how to continue. See [Run failures](answer.md#run-failures).

## Project-wide progress

See [Project progress](../project/progress.md) for tasks and blockers across the project. See [Workload and model usage](../project/usage.md) for capacity and usage.
