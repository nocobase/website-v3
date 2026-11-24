---
type: "release"
product: "studio"
tag: "v1.0.0-beta.62"
channel: "beta"
version: "1.0.0-beta.62"
title: "NocoBase Studio · v1.0.0-beta.62"
date: "2026-10-26"
publishedAt: "2026-10-26T02:07:52Z"
---

### 🎉 New Features

- **[Git]**
  - Connect gitee.com accounts and repositories, follow pull requests and CI checks, and merge from Studio.
  - Read CI checks for commits without a pull request using the existing project repository connection.
- **[Studio]** Add a dedicated Studio demo with account switching, protected browsing, detailed Agent histories, and repeatable sample-data resets.

### 🚀 Improvements

- **[Agents]**
  - Clarify shared runtime setup with complete WSL installation guidance, PATH recovery, and a default of three concurrent runs.
  - Stream runner conversation replies and show reasoning summaries while they are generated.
- **[My sessions]** Rename the personal agent entry to My sessions and distinguish chat conversations from Agent sessions in Chinese.
- **[Projects]**
  - Create projects in one dialog with a new repository, an existing repository or Add later, and manage project code as repositories while keeping existing runner directories usable.
  - Unify repository initialization choices and automatically complete new repositories after successful first-commit checks or confirmed absence of checks, while existing repositories finish after PR merge; clients must replace the removed initAgentId and existingRepo.initPrompt parameters.
- **[Quality]** {{edition:enterprise}} Review quality findings across plans and follow existing native repairs from Backlog to review.

### 🐛 Bug Fixes

- **[Issues]** Show undo and next-task actions below the single-line handled-task title.
- **[Studio]** Fix task creation, agent drafts and copying over plain HTTP, with manual-copy guidance when the browser refuses copying.
- **[Quality]** {{edition:enterprise}} Honor explicit owner decisions to finish quality plans, and save accepted results without rescanning unrelated project work.
- **[Agents]** Show runner agents as enabled or disabled and keep available models consistent with the Agent list.
- **[Inbox]** Keep inbox notifications, task waits and conversation waits separately counted, and replace knowledge proposals with authorized direct editing.
