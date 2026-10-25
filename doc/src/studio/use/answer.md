---
title: Answer the agents’ questions
nav: Answer questions
description: When a decision needs a person, the coordinator agent spells out what you need to decide. You answer questions, deal with failed runs, and take over issues handed to you, all on the issue page.
---

When the agent team runs into something only a person can decide, it stops, goes to the issue owner, and says exactly what you need to decide or provide. Once you reply, it carries on.

## When agents come to you

| Situation | What you see | What you do |
| --- | --- | --- |
| A decision is needed from you | The issue moves to **Blocked** and is labeled **Needs your reply** in **My issues** | Reply to the question |
| A run still fails after retrying | A decision card for the failed run appears on the issue, labeled **Run failed** | Retry, give it to a person, or don't retry |
| Runs triggered between agents hit the limit | The issue page offers **Continue (comment-triggered runs reached their limit)** | Confirm to continue |
| Someone hands an issue over to you | It's labeled **Needs you to take over** in **My issues** | Take it over or decline |
| Someone asks to continue on your personal runtime | A request on the issue page | Confirm or reject |

You handle all of these on the issue page, and they're gathered under **Waiting for you** in **My issues**.

## Answer a question on a blocked issue

When the coordinator agent hits something that needs a person's judgment, it moves the issue to **Blocked** and spells out what you need to decide or provide in the **Needs you** card at the top of the issue page. Common cases:

- There are several possible approaches, each with pros and cons.
- The request doesn't cover a business rule, for example the plan turns out to conflict with an existing approval rule.
- A permission, secret, or document is missing.
- The project has no CI yet, so the PR has no check results, and it asks whether to set up CI first or go straight to acceptance.

1. Open the issue and read the **Needs you** card. For the background, click **View the coordinator agent’s latest explanation** to read it in full.
2. Click **Reply**. The reply box opens under the coordinator agent's explanation.
3. Write your decision and send it.

Your reply wakes the coordinator agent, which carries on based on your answer.

::figure req-blocked | A blocked issue: read the question, click Reply, and write your decision

> [!TIP] Answers that keep things moving
> Give the decision first, then one sentence of reasoning, for example: "Every order from a tier C supplier needs approval regardless of amount. Other suppliers keep the amount rule. Tier C suppliers are a delivery risk, so even small orders need a check." If you're not sure, ask it to lay out a few options and what each one means.

## Failed runs

An agent's run can fail because a runtime went offline, a coding tool ran out of quota, the network dropped, and so on. Failures that can be retried are retried automatically. Once the retries run out, the owner gets a **Run failed: what next?** card:

::figure failed-run | The decision card for a failed run

- **Retry**: have the agent try again. Good for temporary problems, such as a runtime that just came back online.
- **Give to a person**: make a member the executor so a person does the work.
- **Don't retry**: drop this run.

The runs record shows why it failed. The coordinator agent may also move a failed step to another suitable agent on its own. If the same step fails twice, it moves the issue to **Blocked** to ask you.

## Comment run limit reached

To keep agents from triggering each other back and forth, comments from agents can trigger only so many runs per issue in 24 hours, 20 by default, which admins can adjust. After that, agent comments no longer start new runs, and the owner is notified.

Once you're sure the issue really needs to continue, click **Continue (comment-triggered runs reached their limit)** on the issue page. Posting a comment of your own that wakes an agent also resets the count.

> [!NOTE] Hitting the limit is often a sign
> Look at the activity and the runs first. Is an agent fixing the same problem over and over? If so, clarifying the request or adjusting the issue works better than simply continuing.

## Take over an issue handed to you

When someone hands an issue's ownership over to you, it shows up under **Needs you to take over**. Until you take it over, the agents' work is paused, and anything waiting for the owner's decision waits for you too.

- Open the issue and click **Take over the issue**. You become the owner and can go on answering questions and accepting results.
- You can also decline. The issue goes back to its previous owner. If the previous owner's account has been deactivated, the issue stays with you and remains paused.

## Requests to use your personal runtime

A personal runtime runs only work its owner starts. When someone else comments on an issue you own and the next piece of work needs your personal runtime, the issue page shows "{name} requests to continue on your personal runner", and you can **Confirm** or **Reject**. The work runs on your personal runtime only after you confirm.
