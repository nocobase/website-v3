---
type: "release"
product: "studio"
tag: "v1.0.0-beta.68"
channel: "beta"
version: "1.0.0-beta.68"
title: "NocoBase Studio · v1.0.0-beta.68"
date: "2026-10-29"
publishedAt: "2026-10-29T02:29:26Z"
---

### 🚀 改善

- **[スキル]** New installations receive the updated built-in working-method skills, while untouched original versions upgrade once.

### 🐛 不具合修正

- **[マイセッション]** Keep the My Agent sidebar aligned with Runner Agent, including shared fold and expand behavior.
- **[リリース]**
  - Fix version lists, pending release tasks and release progress failing on PostgreSQL.
  - Distinguish projects without release lines from those without versions, and open release-line setup directly from the publishing guide.
  - Default the production deployment guide to the latest tag and explain when its artifact has not been uploaded.
- **[品質]** {{edition:enterprise}} Create and resume quality plans for an explicitly chosen project even when the personal session has no matching default project.
