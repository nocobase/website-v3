---
title: My Tasks
description: Start every day in My Tasks. The tasks that involve you across all projects form one list, with the ones waiting for you at the top. To follow work by session, see My sessions.
---

## Which tasks appear here

**My Tasks** lists the tasks you own and the tasks you execute yourself, each shown once. Tasks you follow also appear here, whoever owns them.

The number next to **My Tasks** in the sidebar is how many items are waiting for you right now.

::figure my-tasks-list | My Tasks groups tasks by whose turn it is, and every row says what you need to do

## Grouped by whose turn it is

From top to bottom:

| Group | What is in it |
| --- | --- |
| **Following** | Tasks you follow, at the very top, with a count of new updates from others. |
| **Waiting for you** | Tasks that need a decision from you now, the longest wait first. |
| **In progress** | Tasks an agent or someone else is moving forward. |
| **Waiting for others** | Tasks in review or blocked, but waiting on someone else; each row says on whom, for example "Waiting for Li Na to accept". |
| **Backlog** | Tasks that have not started. |
| **Done** | Tasks finished in the last seven days, collapsed by default. |

Cancelled tasks are hidden; use the status filter to find them.

## What counts as waiting for you

| Label | When it appears | Where to handle it |
| --- | --- | --- |
| **Needs your acceptance** | A task you own moves to In review | [Acceptance](../decisions/accept.md) |
| **Needs your reply** | A task you own moves to Blocked because of a question | [Answer questions](../decisions/answer.md#answer-a-blocked-question) |
| **Run failed** | An agent's run still fails after retries, and it is waiting for you to decide what to do | [Answer questions](../decisions/answer.md#failed-runs) |
| **Needs plan approval** | A draft plan for this task is waiting for your confirmation | The task page |
| **Needs you to take over** | Someone handed the task's ownership to you | [Answer questions](../decisions/answer.md#take-over-a-task-handed-to-you) |

Every row says what you need to do. After you handle a task, it stays where it was until you switch to another one. A prompt appears at the bottom of the page, where you can undo the status change you just made or jump straight to the next task waiting for you.

## Views

Switch between four views at the top right:

- **Split**: the list on the left and the details on the right. **My Tasks** uses it by default, and it suits handling tasks one by one.
- **Table**: expands along the task tree, which suits looking at sub-tasks.
- **Board**: one column per status; drag a card to change its status.
- **Agent queue**: one lane per agent, showing what it is doing, what is next, and whom it is waiting on. See [Following progress](task-page.md#agent-queue).

Studio remembers the view you chose last.

## Keyboard shortcuts

In the list, when the cursor is not in an input box:

| Key | Action |
| --- | --- |
| <kbd>J</kbd> / <kbd>K</kbd> or arrow keys | Next / previous task |
| <kbd>S</kbd> | Follow or unfollow |
| <kbd>Enter</kbd> | Open the task page |
| <kbd>/</kbd> | Search |
| <kbd>Esc</kbd> | Back to the list |

## Follow a task

Select the star at the top right of a task to follow it. Followed tasks are listed first, with a count of new comments or changes from others. You can follow a task you do not own and keep up with it here. You can follow up to 100 tasks at a time.

## How to use it every day

1. Open **My Tasks** and handle **Waiting for you** first: accept work, answer questions, and deal with failed runs.
2. Take a look at the new activity under **Following**.
3. When you have a new idea, [make a request](../team/hand-over.md) and hand it to the agent team.

For everything else, the agent team keeps going on the runtimes. When it needs you, the task returns to **Waiting for you**.
