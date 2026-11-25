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

### 🚀 Improvements

- **[Skills]** New installations receive the updated built-in working-method skills, while untouched original versions upgrade once.

### 🐛 Bug Fixes

- **[My sessions]** Keep the My Agent sidebar aligned with Runner Agent, including shared fold and expand behavior.
- **[Releases]**
  - Fix version lists, pending release tasks and release progress failing on PostgreSQL.
  - Distinguish projects without release lines from those without versions, and open release-line setup directly from the publishing guide.
  - Default the production deployment guide to the latest tag and explain when its artifact has not been uploaded.
- **[Quality]** {{edition:enterprise}} Create and resume quality plans for an explicitly chosen project even when the personal session has no matching default project.
