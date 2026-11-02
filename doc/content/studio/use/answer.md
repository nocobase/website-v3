---
title: Answer questions
description: Confirm business rules and handle failed runs, ownership handoffs, and personal runtime requests.
---

When a task needs a business decision or missing information, the Lead Agent explains the question. Open it from **My issues › Waiting for you**.

## Answer a blocking question

1. Read **Needs you**. For context, select **View the Lead Agent’s latest explanation**.
2. Select **Reply** and answer in the corresponding thread.
3. Send the reply for the Lead Agent to continue arranging work.

![A blocked task explains which decision its owner needs to make](https://static-docs.nocobase.com/studio-en-guide-answer-20261031.png)

```prompt
All tier C supplier orders need purchasing manager approval, regardless of value. Other suppliers should still follow the amount threshold.
```

If unsure, ask for options and their effects. Provide missing credentials through project variables or the relevant configuration page, not a comment.

## Run failures

Read the run record to identify the cause. Network failures, exhausted quotas, and offline runtimes need different remedies.

Once automatic retries are exhausted, the task's decision card offers retry, reassignment, or no further retry. Restore the required service before retrying. The Lead Agent may also try another suitable Agent.

## Comment run limit

By default, Agent comments can trigger up to 20 runs per task every 24 hours. Administrators can change the limit. Studio stops further automatic triggers at the limit and notifies the owner.

Check whether Agents are repeatedly trying to fix the same problem. If work should continue, use the task's continue action or provide a new instruction.

## Accept an ownership handoff

Agent work pauses while you decide whether to accept responsibility.

- **Accept**: become the owner and continue answering questions or accepting delivery.
- **Decline**: return ownership to the previous owner. If that account is disabled, you keep the paused task.

## Personal runtime requests

If another person requests work on your task that would use your personal runtime, Studio asks you to confirm. The work can use your runtime only after you accept. Declining prevents that request from running.

See [Connect a personal runtime](../join/personal-runtime.md).
