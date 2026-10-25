---
title: My issues
description: Start every day in My issues. The issues that involve you across all projects form one list, with the ones waiting for you at the top. To follow work by session, see My sessions.
---

## Which issues appear here

**My issues** lists the issues you own and the issues you execute yourself, each shown once. Issues you follow also appear here, whoever owns them.

The number next to **My issues** in the sidebar is how many items are waiting for you right now.

::figure my-tasks-list | My issues groups issues by whose turn it is, and every row says what you need to do

## Grouped by whose turn it is

From top to bottom:

| Group | What is in it |
| --- | --- |
| **Following** | Issues you follow, at the very top, with a count of new updates from others. |
| **Waiting for you** | Issues that need a decision from you now, the longest wait first. |
| **In progress** | Issues an agent or someone else is moving forward. |
| **Waiting for others** | Issues in review or blocked, but waiting on someone else; each row says on whom, for example "Waiting for Li Na to accept". |
| **Backlog** | Issues that have not started. |
| **Done** | Issues finished in the last seven days, collapsed by default. |

Cancelled issues are hidden; use the status filter to find them.

## What counts as waiting for you

| Label | When it appears | Where to handle it |
| --- | --- | --- |
| **Needs your acceptance** | An issue you own moves to In review | [Acceptance](../decisions/accept.md) |
| **Needs your reply** | An issue you own moves to Blocked because of a question | [Answer questions](../decisions/answer.md#answer-a-blocked-question) |
| **Run failed** | An agent's run still fails after retries, and it is waiting for you to decide what to do | [Answer questions](../decisions/answer.md#failed-runs) |
| **Needs plan approval** | A draft plan for this issue is waiting for your confirmation | The issue page |
| **Needs you to take over** | Someone handed the issue's ownership to you | [Answer questions](../decisions/answer.md#take-over-an-issue-handed-to-you) |

Every row says what you need to do. After you handle an issue, it stays where it was until you switch to another one. A prompt appears at the bottom of the page, where you can undo the status change you just made or jump straight to the next issue waiting for you.

## Views

Switch between four views at the top right:

- **Split**: the list on the left and the details on the right. **My issues** uses it by default, and it suits handling issues one by one.
- **Table**: expands along the issue tree, which suits looking at sub-issues.
- **Board**: one column per status; drag a card to change its status.
- **Agent queue**: one lane per agent, showing what it is doing, what is next, and whom it is waiting on. See [Following progress](task-page.md#agent-queue).

Studio remembers the view you chose last.

## Keyboard shortcuts

In the list, when the cursor is not in an input box:

| Key | Action |
| --- | --- |
| <kbd>J</kbd> / <kbd>K</kbd> or arrow keys | Next / previous issue |
| <kbd>S</kbd> | Follow or unfollow |
| <kbd>Enter</kbd> | Open the issue page |
| <kbd>/</kbd> | Search |
| <kbd>Esc</kbd> | Back to the list |

## Follow an issue

Select the star at the top right of an issue to follow it. Followed issues are listed first, with a count of new comments or changes from others. You can follow an issue you do not own and keep up with it here. You can follow up to 100 issues at a time.

## How to use it every day

1. Open **My issues** and handle **Waiting for you** first: accept work, answer questions, and deal with failed runs.
2. Take a look at the new activity under **Following**.
3. When you have a new idea, [make a request](../team/hand-over.md) and hand it to the agent team.

For everything else, the agent team keeps going on the runtimes. When it needs you, the issue returns to **Waiting for you**.
