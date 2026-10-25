---
title: Make a request
description: Hand something to the agent team. Explain what you want in a session and an agent creates the task, or fill in a form yourself.
---

## Create a task

Click **New task** in **My Tasks**, in **Development › Tasks**, or on a project page. You can also press <kbd>C</kbd> on a list page.

Studio opens the agent panel and starts a new session, carrying the "create a task" intent and the current project:

::figure new-task-chat | Creating a task starts a session. Click Fill in manually when you want a form

1. Describe what you want to do in the input box. You can say several things at once, and you can paste screenshots.
2. When the request is clear, the agent creates the task directly. Where it is unclear, the agent asks you first, or reads the existing code before creating the task.
3. The created tasks are listed in the session. Select **Start** to hand them to the agent team, or select **Not now** to leave a task in **Backlog** for later.

At the top right of the panel you can switch between **My agent** and **Agent team**. When you have connected your own computer, **My agent** is the default, and it can read the code on your computer directly. When you have not, the agent team replies. For how the two differ, see [My sessions](sessions.md).

## Fill in manually

When you would rather fill in a form, click **Fill in manually** in the new session:

::figure manual-form | The manual form

1. Enter a title and a description. The description supports Markdown.
2. Confirm the project and the owner. The owner is you by default.
3. Choose **When to start**:
   - **Start now**: the task moves to **In progress**, and the coordinator agent starts arranging the work right away.
   - **Later**: the task goes to **Backlog**, and you select **Start** on the task page later.
4. Click **Create and start** (or **Create**).

> [!NOTE] A task in Backlog does not start by itself
> Agents leave tasks in **Backlog** alone. When you are ready, select **Start** on the task page.

## How to state a request clearly

The agent team understands a task from what you write, and the clearer you are, the less rework there is. Try to include:

- **The goal**: what problem to solve, and for whom.
- **Business rules**: how data is calculated, how the process runs, and who can see what.
- **Acceptance scenarios**: how you will check the work when it is done, for example "after a buyer signs in, they can see each supplier's tier in the supplier list".
- **Scope**: what is not part of this task.
- **Materials**: related spreadsheets, screenshots, and policy documents. For anything already in the knowledge base, just give the document name.

When you are unsure, say so directly: "not sure, please propose a plan first". The coordinator agent first has an agent write a plan, and comes back to you when a decision is needed.

## Subtasks and dependencies

- On the task page, click **New subtask**. It also starts a session, carrying the parent task. When all the subtasks are done, the parent task is woken.
- Add a **Prerequisite** in the task properties: the task does not start until the task it depends on is done.
- Priority affects queueing: runtimes pick up the work of urgent tasks first.

## Hand it to a person

A task's executor can also be a member. Such a task does not trigger agents. If you want to hand it to an agent later, select **Hand to the coordinator agent and start** on the task page.
