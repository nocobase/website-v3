---
type: "release"
product: "studio"
tag: "v1.0.0-beta.89"
channel: "beta"
version: "1.0.0-beta.89"
title: "NocoBase Studio · v1.0.0-beta.89"
date: "2026-11-23"
publishedAt: "2026-11-23T10:42:29Z"
---

### 🚀 改善

- **[デプロイ]** The one-command installer writes the `--lang` language into Studio's `config.yml` as its default language, so it can be changed there.

### 🐛 不具合修正

- **[品質]** {{edition:enterprise}}
  - Quality test briefs state the authorized test scope and preserve required defensive checks in assignments.
  - A security result without a ZAP report is no longer refused: its finished checks are shown, the passive and active scans are unverified for want of a ZAP report, and the dimension cannot pass.
- **[デプロイ]** Running the one-command installer again with `--mirror` keeps a paid Studio or Studio EE image instead of replacing it with Studio CE.
