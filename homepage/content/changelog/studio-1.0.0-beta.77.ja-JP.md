---
type: "release"
product: "studio"
tag: "v1.0.0-beta.77"
channel: "beta"
version: "1.0.0-beta.77"
title: "NocoBase Studio · v1.0.0-beta.77"
date: "2026-11-11"
publishedAt: "2026-11-11T15:08:23Z"
---

### 🎉 新機能

- **[品質]** {{edition:enterprise}} Control viewing, running and configuring quality tests independently in EE roles and API keys while retaining permissions across upgrades and edition changes.
- **[ライセンス]** {{edition:professional}} The update dialog shows what is new in the latest version.
- **[ナレッジ]** In My sessions, an agent can suggest saving a file you sent to knowledge, and you save it to system or project knowledge, or decline, beside your message.

### 🚀 改善

- **[タスク]**
  - Configure task, comment and Agent conversation attachment limits per storage disk.
  - Open Backlog tasks on their Description tab and other tasks on Activity, decided again for each task you move to.
- **[品質]** {{edition:enterprise}}
  - Project quality tests start every dimension as soon as the scenario inventory is final, wake the coordinator as each dimension finishes, register slow tests as one optimization task per test, and show each test suite's duration and its slowest files and cases on the functional dimension.
  - Performance tests now measure selected pages with configurable login and report results against one shared standard.
  - Quality settings now edit test times in place without the browser's time panel, show a save bar while there are unsaved changes, and ask before leaving them.
  - Quality follow-ups now use the task page's list: grouped by status with unfinished tasks first, sortable by priority, last seen or count with the order kept in the address, and readable on phones.
- **[ナレッジ]** Roles no longer offer the unused Knowledge indexing permission, and Studio stops serving knowledge indexing settings.

### 🐛 不具合修正

- **[Agent]** Hide private-project task runs and conversations from people who cannot view the task.
- **[品質]** {{edition:enterprise}} Quality pages no longer show tests, scenarios or follow-ups to people who may view a project but not its tasks.
- **[マイセッション]** A message sent while an agent is still working is queued for it instead of failing as busy.
- **[メンバーとロール]** Preserve a role assigned by an administrator when a member first opens Studio.
