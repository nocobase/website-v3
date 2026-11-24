---
type: "release"
product: "studio"
tag: "v1.0.0-beta.78"
channel: "beta"
version: "1.0.0-beta.78"
title: "NocoBase Studio · v1.0.0-beta.78"
date: "2026-11-13"
publishedAt: "2026-11-13T15:03:53Z"
---

### 🎉 新機能

- **[品質]** {{edition:enterprise}} Performance tests now measure every page and the interfaces they call, show page sizes, requests, SQL per request and latency as metrics with trends, and register pages and interfaces over budget as tasks.

### 🚀 改善

- **[品質]** {{edition:enterprise}}
  - The quality follow-ups list now loads 50 tasks at a time with "Load more", like the task list, instead of pages of 20.
  - Clicking a dimension's metric or trend point on the quality metrics page opens that dimension's details in a drawer, the same as on the overview.
  - Dimension reports group results with the same cause, drop the scenario table, list only the dimension's own attachments, use the language's punctuation, and preview attachments on the page.
  - Quality tests check the Runner's browser and environment before testing, and environment problems are re-dispatched instead of being registered as follow-ups.
  - Performance tests now prepare missing test data, track seed follow-ups and use generated entity manifests to resolve pages and APIs.
  - Security tests now check secrets and authenticated interfaces with reusable test data, and critical or high production dependency vulnerabilities correctly fail the result.
  - Dimension reports are now one short, layered report: what to handle, what was not tested grouped by what is missing, and the scope, with details folded.
- **[タスク]**
  - Show the runtime each run ran on beside its model in a task's run history.
  - Load grouped project tasks faster while preserving visible parent context, progress updates and pagination.
- **[リマインダー]**
  - Reduce the time needed to refresh task reminders and navigation counts while preserving all waiting items.
  - Task reminders now reach only the people a change concerns, and are no longer missed when Studio restarts.
- **[ナレッジ]** Load the knowledge directory faster across many projects while preserving visible spaces and document counts.
- **[Git]** New repositories default to Agent self-check while existing repositories keep their check source.
- **[リリース]** Load environment App lists one page at a time while preserving filters, totals and access restrictions.

### 🐛 不具合修正

- **[品質]** {{edition:enterprise}}
  - Keep quality Skills in English while writing performance reports in the test's selected language.
  - Count only marked permission scenarios, separate review findings and authorization scan metrics, and show defect dimensions in scenario details.
  - Show measured elapsed test-suite time and identify cumulative fallback durations in quality metrics.
  - Show the correct message when a quality test has no business tasks.
  - Quality tests can resume submitted scenario batches after interruption and start performance checks without waiting for functional completion.
  - Preserve ZAP alerts and authentication results when scan result collection fails.
  - Quality reports now clearly label each count group, include development dependency advisories, and use consistent verdicts in summaries and dimension headings.
- **[サインイン]** After registering, people are taken to the sign-in page with a message telling them to sign in.
- **[マイセッション]**
  - Display generated files with runner replies using the shared file preview and download controls.
  - Runner conversations no longer flash a waiting notice when a free runtime is about to take the message; a neutral notice appears only if no runtime takes it within 30 seconds.
  - Runner conversations now open at their latest message when you switch between them, task cards appear with the earlier messages they belong to, and replies stream smoothly in conversations with many tasks.
- **[Git]** Agents using a GitHub App connection can open pull requests in every repository of their task, not only the first.
- **[リリース]** Preview Hosts now admit deployments at an 85% heap threshold with a 320 MiB startup reserve and 70% rotation.
