---
type: "release"
product: "studio"
tag: "v1.0.0-beta.87"
channel: "beta"
version: "1.0.0-beta.87"
title: "NocoBase Studio · v1.0.0-beta.87"
date: "2026-11-21"
publishedAt: "2026-11-21T14:26:15Z"
---

### 🎉 New Features

- **[Quality]** {{edition:enterprise}} Project test reports show how the core scenario inventory changed since the previous test (added, changed, removed scenarios and permission markers) with the scenario PR.

### 🚀 Improvements

- **[Agents]** Studio enables missing GPT-6.2 Astra and Sol agents when runners report them, and its bundled skills tell agents to name referenced items and keep pull requests ready for review.

### 🐛 Bug Fixes

- **[Agents]**
  - Keep individual self-checks visible while the Lead Agent reviews successful results when the delegated implementation ends.
  - The project manager waits for running required PR checks and resumes idle recovery after 60 minutes of waiting.
