---
type: "release"
product: "studio"
tag: "v1.0.0-beta.85"
channel: "beta"
version: "1.0.0-beta.85"
title: "NocoBase Studio · v1.0.0-beta.85"
date: "2026-11-20"
publishedAt: "2026-11-20T00:41:47Z"
---

### 🎉 New Features

- **[Quality]** {{edition:enterprise}} Quality tests prepare their own PostgreSQL and browser, upload evidence as one package per stage, continue on another Runner from those packages, and show the database and stage packages under Test conditions.
- **[Skills]** Choose the skills each issue runs with: projects get issue default skills (new projects default to a simple one-step workflow), project skills stay locked, and run records show the skills used.

### 🚀 Improvements

- **[Issues]** Open a task's preview account from the pull request line at the top of the task and copy its username and password.
- **[Quality]** {{edition:enterprise}} The security group of the quality metrics page shows leaked secrets and API scan alerts with their trends, and names the code review's problems code security issues.
- **[My sessions]** A new conversation's composer shows your runtime by name when it is the only one that can run the Agent, instead of "No runtime yet".

### 🐛 Bug Fixes

- **[Projects]** Initializing a NocoBase application now uses the runner's `NOCOBASE_REGISTRY` for every `@nocobase` package and accepts pnpm 11 or later.
