---
title: Follow progress
description: Read the issue page to see who is working on it now and what comes next, add requirements with comments, and take the issue over when you need to.
---

While the agent team works on an issue, you don't have to stand by or keep asking. Open the issue page to see where it stands and what comes next, and when you have something to add, say it right on the issue.

## The issue page

The issue page looks the same whether you open it from a list, a board, or a link.

::figure req-now | The issue summary: Now, Up next, properties, and linked PRs

**The top line** shows the issue's position in the list, its key (click to copy the link), and its project. On the right are the status, the follow star, **Ask agent**, and more actions.

**The summary**:

- **Now**: Studio writes what the issue is actually waiting on, for example "Codex · GPT-6.1 Sol working · 8 min · server-01", "Waiting for a runtime", "Waiting for the PR's checks", or "Waiting for Zhou Hang to accept". Studio generates this line from the facts, not from anything a person or agent wrote.
- **Up next**: the next step the coordinator agent has planned.
- **Needs you**: appears when the issue is blocked or in review and waiting for your decision. It says what you need to do, with the buttons to do it right there. See [Answer the agents’ questions](answer.md) and [Accept the result](accept.md).
- **Delivery report**: submitted by the coordinator agent when it delivers the work for acceptance, and kept until the next delivery replaces it.

**Properties**: priority, owner, and executor, plus labels, project, start and due dates, notifications, and more under **More properties**.

**Tabs**:

| Tab | What's in it |
| --- | --- |
| Activity | Comments, handoffs, and status changes. It shows **Conversation only** by default. Switch to **All** to see the system records too. |
| Description | The issue description. |
| Sub-issues | Sub-issues and their statuses. |
| Code and deployments | Linked PRs, check results, and changes. |
| Runs | Every run agents have made on this issue. |

## Talk to agents with comments

Write in the box at the bottom of the issue. There are two kinds of entries:

- **Comment**: visible to everyone. It wakes the agents you mention, the agent whose comment you reply to, and the issue's executor, usually the coordinator agent. If an agent is running at the time, the comment goes straight to it.
- **Note**: a record for people only. It wakes no agent.

::figure composer | Comments wake agents, notes are for people only

A few common uses:

- Add to or change the requirements: just write a comment, and the coordinator agent adjusts the plan.
- Ask a specific agent a specific question: mention it in a comment. It answers only what you asked and doesn't change the issue's status.
- Reply to a comment: reply under that comment so the discussion stays in one thread.

## Ask agent

**Ask agent** at the top right of the issue page opens the agent panel and starts a session about this issue. It's good for questions such as "Where is this issue stuck?" or "What does this PR change?" The agent in the session works with your identity and permissions and does only what you ask. See [My sessions](sessions.md).

## Runs

The **Runs** tab lists every run on the issue: which agent, on which runtime, which attempt, the result, and the usage.

::figure runs | Runs: view the transcript and prompt, or stop a run in progress

- **View transcript**: the full record of what the agent did in this run.
- **View full prompt**: everything the agent received this time, which helps you see why it did what it did.
- **Stop**: stops a run in progress and keeps the changes already made. The issue moves to **Blocked**, and the agents' work pauses until you say in a comment how to continue.
- **Retry**: queues a failed run again.

## Take the issue over

To do the work yourself, make yourself the executor. Queued agent work is withdrawn, and runs in progress are asked to stop. To give it back to the agent team later, click **Hand over to the coordinator agent to start**.

## See the whole project

To see how a project is going overall, what's stuck, and what it costs, read [Project progress](../project/progress.md) and [Agent workload and model usage](../project/usage.md).
