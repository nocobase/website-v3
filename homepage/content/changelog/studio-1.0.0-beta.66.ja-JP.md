---
type: "release"
product: "studio"
tag: "v1.0.0-beta.66"
channel: "beta"
version: "1.0.0-beta.66"
title: "NocoBase Studio · v1.0.0-beta.66"
date: "2026-10-28"
publishedAt: "2026-10-28T14:16:54Z"
---

### 🎉 新機能

- **[マイセッション]** Manage Runner Agent conversations and linked tasks in My sessions, and switch agents from the composer while preserving history
- **[リリース]** Connect existing CI systems and follow project previews, test environments and production releases from one release hub with deployment guides

### 🚀 改善

- **[タスク]** Show the project name instead of the executor in task tables.
- **[Agent]** Rename Project manager to Lead Agent across the interface while preserving custom names on upgrade.
- **[Studio]**
  - Keep demo visitors' language and theme choices separate and consistently block unsupported demo actions.
  - Improve demo projects with realistic bilingual tasks, concise labels, focused conversations and built-in team roles.

### 🐛 不具合修正

- **[リリース]**
  - Fixed release pipelines failing to load and preview titles overlapping other columns
  - Long project names in the Releases list now truncate cleanly, and first releases are clearly marked.
- **[マイセッション]**
  - Keep runner reply reminders in My sessions without duplicating them in the inbox.
  - Show Runner work with a breathing reply indicator and a prominent, stable send and stop button.
  - Keep My sessions on a new conversation after deleting an open current or archived conversation.
  - Clear a conversation's pending task question when that task resumes, keeping session badges consistent.
  - Avoid repeated waiting cards for delegated tasks while preserving new pull request notifications.
  - Show one recovery status inside the current Runner reply, with clear reconnect and refresh actions that fit narrow screens.
- **[Agent]**
  - Confirm conversation Agent changes only when sending a message, with one notice for the final selection.
  - Let agents in runner conversations follow and unfollow issues for their owners.
- **[ファイル]** Markdown attachment previews use a comfortable centered reading width and larger body text.
- **[タスク]**
  - Show all completed tasks in grouped task lists and load older tasks through pagination.
  - Reduce repeated Lead Agent comments and fold internal coordination in task conversations while keeping human requests and delivery reports visible.
