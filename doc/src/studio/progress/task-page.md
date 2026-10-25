---
title: Following progress
description: Read the task page, talk to agents with comments, and watch the whole team's progress in the agent queue and the dashboard.
---

## The task page

Whether you open it from a list, the board, or a link, the task page looks the same.

::figure req-now | The task page summary: Now, Next, properties, and the linked PR

**Top row**: the task's position in the list, its number (select it to copy the link), and its project. On the right are the status, the follow star, **Ask agent**, and more actions.

**Summary**:

- **Now**: what the task is waiting for at this moment, written by the system from what is actually happening. For example, "Codex · GPT-5.5 is working, for 8 min, on Server 02", "Waiting for a runtime to pick it up", "Waiting for the checks of the PR", or "Waiting for Zhou Hang to accept". The system generates this line; it is not text written by anyone.
- **Next**: the coordinator agent's plan for the next step.
- **Needs you**: appears when the task is Blocked or In review and waiting for your decision. It says what you need to do, with the action buttons right beside it. See [Answer questions](../decisions/answer.md) and [Acceptance](../decisions/accept.md).
- **Delivery report**: submitted by the coordinator agent when it hands the task over for acceptance. It stays until the next delivery replaces it.

**Properties**: priority, owner, and executor, plus labels, project, start and due dates, and **Get notified** under **More properties**.

**Tabs**:

| Tab | Contents |
| --- | --- |
| **Activity** | Comments, hand-overs, and status changes. It defaults to **Conversation**; switch to **All** to see system records. |
| **Description** | The task description. |
| **Sub-tasks** | Sub-tasks and their statuses. |
| **Code & deploys** | Linked PRs, their check results, and the changes. |
| **Runs** | Every run an agent has made on this task. |

## Talk to agents with comments

Write a comment in the box at the bottom of the task. There are two kinds:

- **Comment**: visible to everyone. It wakes the agents you @ mention, the agent that wrote the comment you replied to, and the task's executor (usually the coordinator agent). When an agent is running, the comment goes straight to it.
- **Note**: a record for people only. It does not wake any agent.

::figure composer | A comment wakes agents; a note is only for people

Some common uses:

- Add to or change the requirements: write a comment, and the coordinator agent adjusts the plan accordingly.
- Ask one agent a specific question: @ mention it in a comment. It answers only what you asked and does not change the task's status.
- Reply to a comment: reply under that comment so the discussion stays in one thread.

## Ask agent

**Ask agent** at the top right of the task page opens the agent panel and starts a session that carries this task. It suits questions like "Where is this task stuck?" or "What does this PR change?". The agent in the session works with your identity and permissions and does only what you ask. See [My sessions](../team/sessions.md).

## Runs

The **Runs** tab lists every run on this task: which agent, on which runtime, which attempt, the result, and the usage.

::figure runs | Runs: view the process and the prompt, or stop a run in progress

- **View transcript**: the full process of the agent's run.
- **View full prompt**: everything the agent received for this run, which helps you judge why it did what it did.
- **Stop**: stop a run in progress. The changes already made are kept.
- **Retry**: queue a failed run again.

## Take over a task

To do the work yourself, change the executor to yourself. Agent work already queued is withdrawn, and work in progress is asked to stop. If you later want to give it back to an agent, select **Start** to hand it to the coordinator agent.

## Agent queue

At the top right of **Development › Tasks**, switch to **Agent queue** to see what the whole agent team is doing. Each agent has one lane:

| Section | Contents |
| --- | --- |
| **Now** | Work running on a runtime, how long it has been running, and what it did most recently. |
| **Up next** | Queued tasks and why they wait, for example "No runtime online", "Concurrency full", or "Blocked by PUR-12". |
| **Waiting for reply** | Things waiting on a person: failed runs, questions, and reviews, and whom they wait on. Items that are your turn are highlighted; select **Handle** to go straight to them. |
| **Assigned, idle** | Tasks assigned to the agent that show no activity now, with the reason, for example "In backlog; it does not start on its own". |

The top row summarizes how many are running, queued, and waiting for you, and how busy the runtimes are. Turn on **Only mine** to show only the tasks you own, created, or follow.

::figure agent-queue | Agent queue: one lane per agent, with the items that are your turn highlighted

## Dashboard

The **Dashboard** answers three questions: how is delivery going, how are the agents performing, and what is stuck. You can choose the time range, and every number is compared with the previous period.

- **Key figures**: tasks completed, median cycle time, the share completed by agents, cost per task, run success rate, rework rate, human intervention, median queue wait, and more. Hover over a number to see how it is calculated.
- **Agent performance**: how each agent worked in this period.
- **Needs attention**: items that are stuck or overdue now.
- **By project**: each project's progress and what it delivered in this period.

The dashboard counts only the projects and tasks you have permission to see.
