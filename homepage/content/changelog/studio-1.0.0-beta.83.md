---
type: "release"
product: "studio"
tag: "v1.0.0-beta.83"
channel: "beta"
version: "1.0.0-beta.83"
title: "NocoBase Studio · v1.0.0-beta.83"
date: "2026-11-19"
publishedAt: "2026-11-19T05:22:09Z"
---

### 🚀 Improvements

- **[Knowledge]** Knowledge file entries keep their actions in the page header, preview Markdown with the knowledge body styles, show extracted text with line numbers and open previews full screen.
- **[Issues]** Studio retires operation plans and intake commands while preserving historical task activity and private runs.
- **[Quality]** {{edition:enterprise}} Code quality follow-up tasks registered by a quality test now start with a "[Code optimization]" prefix, and the code quality and permission texts of quality tests are available in all supported languages.
- **[License]** {{edition:professional}} The update dialog shows the release notes of every version between the current one and the update, including the stable release for people on a beta.

### 🐛 Bug Fixes

- **[Quality]** {{edition:enterprise}}
  - Security quality tests now require the ZAP active scan to actually run, show HTTPS-only checks as not applicable with their reason, and the security card counts runtime checks as "Unverified".
  - Quality settings run time fields now match the other fields in the light theme instead of looking disabled.
  - Hide a project's Quality tab from members who may not view quality tests, and open Overview instead of an empty page from its link.
  - When the functional dimension has submitted no JUnit report, its card, the metrics page and the dimension details now say there are no automated test results yet.
