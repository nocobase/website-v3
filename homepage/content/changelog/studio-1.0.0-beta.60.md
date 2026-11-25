---
type: "release"
product: "studio"
tag: "v1.0.0-beta.60"
channel: "beta"
version: "1.0.0-beta.60"
title: "NocoBase Studio · v1.0.0-beta.60"
date: "2026-10-22"
publishedAt: "2026-10-22T15:56:03Z"
---

### 🎉 New Features

- **[Quality]** {{edition:enterprise}} Show project scenario coverage and full-regression results, and start quality plans from natural-language goals with clearer analysis and result reports.
- **[Project memory]** Agents now keep what they learn as project memory in each repository, reviewed with the pull request, and the new Project memory page shows it; the knowledge base keeps what people write and upload, and agents only read it.
- **[Knowledge]** Save original task attachments to knowledge after the uploader or task owner confirms, without notifications or interrupting work.

### 🚀 Improvements

- **[Agents]** Use one Agent panel with local and Runner Agent modes, inspect attached context, and start task creation in a conversation with an optional manual form.

### 🐛 Bug Fixes

- **[Git]**
  - GitLab servers served under a path, such as `https://host/gitlab`, now work for connections, merge request links, sign-in and agents' `glab`.
  - Fix project repository creation through GitHub Apps installed on personal accounts and explain permission or access failures.
- **[Agents]**
  - Explain missing project manager setup with authorized links and retain new projects with initialization tasks blocked until configuration is complete.
  - Keep manually stopped agent work blocked until a person gives new instructions.
