---
type: "release"
product: "studio"
tag: "v1.0.0-beta.73"
channel: "beta"
version: "1.0.0-beta.73"
title: "NocoBase Studio · v1.0.0-beta.73"
date: "2026-11-04"
publishedAt: "2026-11-04T04:58:59Z"
---

### 🎉 新機能

- **[デプロイ]** Use one mailer configuration for password recovery, invitations, and email notifications.
- **[メンバーとロール]** Choose an optional username when accepting an invitation and use it to sign in.
- **[Agent]** Runners can use DeepSeek Harness as a coding tool.

### 🚀 改善

- **[品質]** {{edition:enterprise}}
  - A quality plan's Follow-ups tab now shows its follow-ups in the task list, grouped by status, with search, filters, sorting and each follow-up's type beside its title.
  - Test standards are now one searchable list like the member page, where project standards can be created, edited and deleted in dialogs.
  - Show quality follow-ups in the same task list as a project's tasks, grouped by status, with each follow-up's type and source plan.
  - Rename Quality follow-ups to Quality issues and Acceptance standards to Test standards, and hide internal template text in the quality issue drawer.
  - Quality plans and reports now apply default checking dimensions and suggest test directories for NocoBase 3 projects.
  - Remove the test standards module; quality plans use their confirmed goals and built-in checking dimensions.
  - Open quality follow-ups directly as native tasks and hide tasks that are deleted or inaccessible.
  - Use native Agent drafts for quality discussions, with messages sent only when the user sends them.
  - Clarify test plan task links as “View progress”.
  - Read quality plans in one fully expanded card with empty optional sections omitted.
  - Quality report checkpoints now reflect their testing task's phase and use consistent status colors.
  - Preview quality reports using their original Markdown attachments and download them directly.
  - Open Quality directly under Development and follow old quality issue links to their plans or native tasks.
  - Support quality plans without a project using native task permissions and execution.
  - Show quality report overview blocks in pass rate, coverage, reuse and follow-up order.
  - Show total testing rounds and the latest testing task owner in quality plan headers.
  - Hide the project column in quality plan follow-ups to give task titles more room.
  - Hide the missing full-report hint and show View full report when a quality report is available.
- **[マイセッション]**
  - Conversations share consistent headers and details across pages and Agent panels, opening the list first while keeping task entry direct.
  - Explain why a Runner conversation is waiting, keep it queued while choosing another Agent, and unify composer notices.
  - My sessions and the side Agent panel now look and work the same, adapting their layout to the available space.
- **[タスク]** Show which prerequisite tasks are holding a task in its detail and task lists.

### 🐛 不具合修正

- **[品質]** {{edition:enterprise}}
  - Defect and product-question tasks created by quality testing no longer show internal markers at the top of their description.
  - Quality plan lists render formatting, built-in test standards follow the interface language, and people without permission get a clear notice instead of a form that fails on save.
  - Preserve test standard titles longer than the recommended 200 characters when typing or pasting.
  - Return HTTP 409 for concurrent quality plan and acceptance standard edits so clients can identify revision conflicts consistently.
  - Prevent deleted quality plans from starting, retesting or accepting edits, and mark their details as deleted.
  - Prevent another test round from starting while the current quality plan round is still in progress.
  - Show saved quality plans as Not started, with actions to start testing or restore deleted plans.
  - Hide empty evidence, description and source-plan sections in quality issue details.
  - Keep quality plans clearly formatted with distinct section meanings while omitting empty optional sections.
- **[タスク]**
  - Close task deletion confirmations after success and refresh the task list, counts and selected detail.
  - Move tasks to their current groups immediately after actions and realtime updates while keeping the selected detail open.
  - Keep focus in the My issues search field after opening New issue.
- **[マイセッション]**
  - Show exhausted Agent quota and reset times, allow switching to an available Agent, and provide a visible runtime recovery action.
  - On phones, press Enter for a new line in Runner and My Agent conversations, and use the send button to send messages.
- **[リリース]** Show the full project name on hover in the release list.
- **[Agent]**
  - Show when agent comments are limited and resume only the latest held work, discarding old instructions after a person continues.
  - Let agent runs use commands under their executing person's permissions while keeping personal decisions and current-run comment ownership protected.
- **[チームチャット]** Show activity during quiet Runner work and keep queued messages unique when stopping and continuing a conversation.
- **[Git]** Prevent duplicate pull request links caused by repository name casing and display the code host's repository spelling.
