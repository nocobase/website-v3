---
type: "release"
product: "studio"
tag: "v1.0.0-beta.67"
channel: "beta"
version: "1.0.0-beta.67"
title: "NocoBase Studio · v1.0.0-beta.67"
date: "2026-10-29"
publishedAt: "2026-10-29T00:05:45Z"
---

### 🎉 新機能

- **[リリース]** Track published tasks from repository tags and configure release lines in repository settings.

### 🚀 改善

- **[タスク]**
  - Load completed task history in database pages while preserving accurate groups and counts.
  - Reduce repeated task and notification requests across browser tabs.
- **[品質]** {{edition:enterprise}} Organize conversational quality plans, round reports, follow-up work and schedules with paged lists and isolated test execution guidance.
- **[リリース]** Collapse projects without a release by default, remember expansion, and compact the project list with inline version and pending task details.

### 🐛 不具合修正

- **[プレビュー]** Show initial administrator credentials directly in preview cards and keep generated passwords available until dismissed or the app is removed.
- **[タスク]** Keep agent conclusions and execution records visible in Conversation only, while collapsing Lead Agent handoffs independently.
- **[リリース]**
  - Base project releases on the primary repository and show a loading state while versions are being fetched.
  - Compare forked release tags with an editable default branch, and publish from an editable branch-head target without a staging environment.
  - Place the deployment guide in the Staging stage and shorten the empty state.
