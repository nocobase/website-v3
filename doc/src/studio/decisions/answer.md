---
title: Answer questions
description: What to do when an issue is waiting for your decision: answering questions, failed runs, the run limit, and taking over an issue.
---

## When an agent comes to you

| Situation | What you see | What to do |
| --- | --- | --- |
| A decision is needed from you | The issue moves to **Blocked**, marked **Needs your reply** in **My issues** | Reply to the question |
| A run still fails after retries | A **Run failed** decision card appears on the issue | Retry, give it to a person, or don't retry |
| Runs triggered between agents reach the limit | The issue page shows **Continue (comment-triggered runs reached their limit)** | Continue after confirming |
| Someone hands the issue's ownership to you | **Needs you to take over** in **My issues** | Take over or reject |
| Someone asks to continue on your personal runtime | A request on the issue page | Confirm or reject |

All of these are handled on the issue page and summarized under **Waiting for you** in **My issues**.

## Answer a blocked question

When the coordinator agent runs into something a person needs to judge, such as a choice between approaches, a business rule, or an exception, it moves the issue to **Blocked** and uses the **Needs you** card at the top of the issue page to say what it needs you to decide or provide.

1. Open the issue and read the **Needs you** card. If you need background, select **View the coordinator agent's latest explanation** to read its full explanation.
2. Select **Reply**. The reply box opens under the coordinator agent's explanation.
3. Write your decision and send it.

The coordinator agent wakes up when it receives your reply and carries on arranging the work based on your answer.

::figure req-blocked | A blocked issue: read the question, select Reply, and write the decision

> [!TIP] How to answer so work moves faster
> Give the conclusion first, then a short reason, for example "Score new suppliers as grade B at first, and re-score them after three months. With no history yet, grade A is not appropriate." If you are not sure, ask it to list a few options and the impact of each.

## Failed runs

An agent's run can fail because the runtime is offline, the coding tool's quota is used up, a network problem, and so on. Failures that can be retried are retried automatically. When the retries run out, the owner receives a decision card:

::figure failed-run | The decision card for a failed run

- **Retry**: have the agent try again. It suits temporary problems, for example the runtime has just come back online.
- **Give to a person**: change the executor to a member, and a person does the work.
- **Don't retry**: give up on this run.

The run record shows why it failed. The coordinator agent may also swap the failed step to another suitable agent by itself; if the same step fails twice, it moves the issue to **Blocked** to ask you.

## When comment-triggered runs reach the limit

To stop agents from triggering each other back and forth, runs triggered by agent comments are capped for each issue per 24 hours (20 by default; an administrator can change it). After the limit is reached, agent comments no longer start new runs, and the owner is notified.

Once you are sure the issue really needs to continue, select **Continue (comment-triggered runs reached their limit)** on the issue page. A comment of your own that wakes an agent also restarts the count.

> [!NOTE] Reaching the limit is often a signal
> Look at the activity and the runs first: is the agent fixing the same problem over and over? If so, adding more detail or adjusting the issue works better than simply continuing.

## Take over an issue handed to you

After someone hands an issue's ownership to you, it appears as **Needs you to take over**. Until you take over, agent work is paused, and anything on the issue that waits for the owner's decision has to wait until you take over.

- Open the issue and select **Take over the issue**. You become the owner and can go on to answer questions and accept work.
- You can also reject it. After a rejection the issue goes back to the previous owner. If the previous owner's account has been deactivated, you keep the issue and it stays paused.

## Requests on your personal runtime

A personal runtime runs only work started by its owner. When someone else comments on an issue you own and the next work would use your personal runtime, the issue page shows a request such as "Zhou Hang requests to continue on your personal runner", and you can **Confirm** or **Reject** it. Only after you confirm does this work run on your personal runtime.
