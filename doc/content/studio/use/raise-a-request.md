---
title: Make a request
description: Talk a request through with an agent in a session and let it turn the request into issues for the agent team, or fill in an issue yourself.
---

What you raise is a request: the problem to solve, the business rules, and how you'll check the result. In Studio a request becomes one or more issues, and once they're started, the agent team moves them forward.

## Raise it in a session

1. Click **New issue** in **My issues**, **Development › Issues**, or a project page. On list pages you can also press <kbd>C</kbd>. Studio opens a session with an agent, carrying "New issue" and the current project along.
2. Describe the request in business terms. You can cover several things at once and paste screenshots.
3. When the request is clear, the agent turns it into issues right away. Where something is unclear, it asks you first, or looks at the existing code before creating anything.
4. The new issues are listed in the session. Click **Start** to hand them to the agent team, or **Not now** to leave them in **Backlog** for later.

::figure new-task-chat | A new issue starts a session. To fill in a form instead, click Fill in manually

To see which agents you can talk to in a session, read [My sessions](sessions.md).

## Fill it in yourself

To fill in a form instead, click **Fill in manually** in the session:

1. Enter a title and a description. The description supports Markdown.
2. Check the project and the owner. The owner is the person responsible for the issue, which is you by default.
3. Under **When to start**, choose one:
   - **Start now**: the issue moves to **In progress**, and the coordinator agent starts arranging the work right away.
   - **Later**: the issue goes to **Backlog**, and you click **Start** on the issue page when you're ready.
4. Click **Create and start** or **Create**.

::figure manual-form | The manual form

> [!NOTE] Backlog issues don't start on their own
> Agents leave issues in **Backlog** alone. When you're ready, click **Start** on the issue page.

## How to make a request clear

The agent team understands the request from what you write. The clearer it is, the less rework there is and the fewer questions come back to you midway. It helps to include:

- **Goal**: the problem to solve, and who it's for.
- **Business rules**: how figures are calculated, how the process flows, who can see what. When you raise it in a session, settle the rules the agent asks about on the spot.
- **Acceptance scenarios**: how you'll check it when it's done, for example "After signing in, a buyer sees each supplier's tier in the supplier list."
- **Scope**: what this request leaves out.
- **Materials**: related spreadsheets, screenshots, and policy documents. For anything already in the knowledge base, just give the document's name.

If you're not sure how it should be done, say so: "Not sure, please propose an approach first." The coordinator agent has an agent write up an approach first and comes back to you when there's a decision to make.

## When the request is big

However big the request, just describe it clearly. You don't need to split it up yourself. The coordinator agent breaks it into steps and hands each to a suitable agent.

If you want to accept some parts separately, click **New sub-issue** on the issue page:

- It also starts a session, carrying the parent issue along. You can have the agent read the parent issue and draft the sub-issues, then check and adjust them before creating them.
- Sub-issues can be staged: sub-issues in a later stage start only when every earlier stage is done. Once all sub-issues are done, the parent issue carries on.
- Add a **Blocker** in the issue's properties: the issue won't start until the issue it depends on is done or cancelled.

An issue's priority affects the queue, and runtimes pick up work for urgent issues first.

## Do it yourself

A member can also be an issue's executor, and such issues aren't given to agents. To hand one to the agent team later, click **Hand over to the coordinator agent to start** on the issue page.
