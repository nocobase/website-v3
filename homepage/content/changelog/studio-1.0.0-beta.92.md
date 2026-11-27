---
type: "release"
product: "studio"
tag: "v1.0.0-beta.92"
channel: "beta"
version: "1.0.0-beta.92"
title: "NocoBase Studio · v1.0.0-beta.92"
date: "2026-11-27"
publishedAt: "2026-11-27T02:03:35Z"
---

### 🎉 New Features

- **[Quality]** {{edition:enterprise}}
  - The quality overview shows the period's figures and trends for 7, 30 or 90 days: open, new and closed problems, tests, pass rate, problems found and closed, open problems by dimension, core scenario inventory changes, test duration and test runs.
  - Quality tests check desktop and mobile user experience against your project's UI standards and track Must violations by page.

### 🚀 Improvements

- **[Previews]**
  - Choose who builds pull request previews independently of where repository checks come from.
  - Build records now list a repository's published Apps without CI setup or key controls, and show one entry per App and build on phones.

### 🐛 Bug Fixes

- **[Issues]** Keep a task's open Workflow list on a phone screen when the requester appears in the property row after the list opens.
- **[Quality]** {{edition:enterprise}} Load quality overview trends faster when opening the page or changing its time range.
- **[Agents]** Fix slow task starts and spurious start timeouts when multiple tasks and runtimes are active concurrently.
- **[Git]** Linking a pull request that does not exist on the code host is now refused instead of leaving a broken record, and one missing pull request no longer stops the others in its repository from syncing.
