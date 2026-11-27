---
type: "release"
product: "studio"
tag: "v1.0.0-beta.70"
channel: "beta"
version: "1.0.0-beta.70"
title: "NocoBase Studio · v1.0.0-beta.70"
date: "2026-10-29"
publishedAt: "2026-10-29T14:38:49Z"
---

### 🎉 新機能

- **[Agent]** Choose and retain reasoning effort in Runner Agent conversations and see the effort for each turn.

### 🚀 改善

- **[タスク]** Load task cards with lightweight batches and refresh only the tasks affected by live updates.

### 🐛 不具合修正

- **[リリース]** Call uploaded app builds artifacts and reserve versions for Git tags.
- **[品質]** {{edition:enterprise}}
  - Keep Quality pages and report reading positions stable during refreshes and temporary read failures.
  - Show existing test coverage from complete, partial and missing assertion mappings while preserving historical report evidence.
  - Unify quality defect registration so findings stay linked to their plans and My Agent discussions.
  - Show each follow-up source plan once, with distinct discovery rounds and paged details.
- **[マイセッション]** Long hashes, URLs and words without spaces in My Agent messages now wrap inside the message bubble instead of cutting off the start of each line.
- **[プロジェクト]** Show a Git connection prerequisite instead of an inactive check source on unlinked repository cards.
- **[プレビュー]** In the demo, pull requests whose checks passed now have a ready preview instead of one waiting for checks.
- **[タスク]** Keep issue titles visible in a narrow issue table, and stop labels and agent status from overlapping the Status column.
