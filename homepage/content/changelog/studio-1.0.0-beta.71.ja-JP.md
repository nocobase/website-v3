---
type: "release"
product: "studio"
tag: "v1.0.0-beta.71"
channel: "beta"
version: "1.0.0-beta.71"
title: "NocoBase Studio · v1.0.0-beta.71"
date: "2026-10-31"
publishedAt: "2026-10-31T14:48:27Z"
---

### 🎉 新機能

- **[品質]** {{edition:enterprise}} Keep bug reproduction screenshots and show precisely associated images directly in the quality follow-up drawer.
- **[Agent]** Choose project code for Runner conversations, keep local work across Agent changes, and use tool defaults with clear feedback when reasoning settings cannot be applied.

### 🚀 改善

- **[タスク]**
  - Load issue progress and preview status with fewer repeated database and runtime reads.
  - Open task details and grouped children with fewer queries while keeping related snapshots and continuation hints current.
  - Use issue terminology throughout the English interface.
- **[Studio]** In the demo, every account's My tasks shows a task an agent is working on, and My sessions includes Runner Agent conversations.
- **[デプロイ]** Redis Jobs now require the commercial `@nocobase/app-plugin-jobs-redis` plugin and an explicit `adapter: redis`, and any active `agents.vectors` setting must be removed, or the application will not start.
- **[マイセッション]** Reduce network requests while runner conversations update, and load archived sessions when opened.
- **[Agent]** Runner conversations now notify only when tasks need input or review, or delegated runs fail permanently.
- **[実行環境]** Show the demo site's runtimes as online, so its agents read as available.
- **[品質]** {{edition:enterprise}}
  - Quality plan pages start with the plan title, without the plan list's heading and project picker.
  - Move a quality plan's settings from the header button into a Settings tab of the plan, laid out like project settings.
  - Open a quality plan by clicking anywhere on its row; the separate View column is gone.

### 🐛 不具合修正

- **[Agent]**
  - Browse runtime runs with pagination, accurate totals and conversation names, and consistent status and quota badges.
  - Keep automatic conversation attachments in sync with page titles.
  - Show code preparation only when a runner prepares a project workspace, and Agent startup when it reuses the workspace.
- **[マイセッション]**
  - Use matching expandable lists and full-screen task details in phone conversations, with left-aligned navigation, right-aligned task actions and a direct return to the original draft.
  - Clear outdated conversation questions when their linked tasks are completed or cancelled.
  - Keep Runner conversation controls together and stop the Agent and project pickers from overlapping other buttons on phones.
  - Show the session list before the details on narrower windows, the same way for Runner Agent and My Agent.
- **[タスク]**
  - Reduce repeated task, release and conversation requests while keeping open discussions read and task switching stable.
  - Keep long runner errors within task details on narrow screens.
- **[品質]** {{edition:enterprise}} Create and discuss quality plans with Runner Agent, with available-Agent fallback between Runner Agent and My Agent.
- **[Studio]** Preserve project choices, restored task statuses, expanded conversations, task tab clicks, the Send button after a Runner reply, the composer's project list and comment-link recovery during asynchronous updates, and stop deleted tasks from holding up agent work, while keeping startup bounded.
