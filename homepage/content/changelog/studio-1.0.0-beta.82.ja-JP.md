---
type: "release"
product: "studio"
tag: "v1.0.0-beta.82"
channel: "beta"
version: "1.0.0-beta.82"
title: "NocoBase Studio · v1.0.0-beta.82"
date: "2026-11-18"
publishedAt: "2026-11-18T13:45:06Z"
---

### 🎉 新機能

- **[Studio]** Run NocoBase Studio CE without a License Key, Requester or Quality.

### 🚀 改善

- **[設定]** Log export shows live progress for server logs, collects runtime logs at the same time, names runtime folders after the runtime, and no longer filters by issue.
- **[品質]** {{edition:enterprise}}
  - The Permissions card and its overview now count interfaces: how many passed of all planned, with a bar of escalated, unverified, passed and untested interfaces and the affected areas.
  - Failed automated test cases are analysed by cause; only product defects register a defect task, and the functional card and report show failures by cause.
  - Code quality tests now measure duplication, cognitive complexity, unused code and dependency cycles with tools, judge only what is new, show the metrics with coverage on the card, the metrics page and a new Metrics tab, and keep one cleanup task per project.
  - Show each stage's time in every dimension report and in the delivery report, describe each dimension in the delivery the way its card does, and show the performance test's data scale.
- **[スキル]** Keep built-in working methods reusable across projects and let agents implement requested data changes without extra approval steps.
- **[タスク]** Links in tasks, agent replies, file previews and quality reports now all open in a new tab, except links to a heading on the same page.

### 🐛 不具合修正

- **[デプロイ環境]** Anonymous callers can no longer start a deployment, and the previews and pipelines lists no longer show or search the titles of pull requests and tasks the viewer cannot read.
- **[品質]** {{edition:enterprise}}
  - Dimension details open their report tabs once without a placeholder tab, never show another dimension's problems while loading, and load their report much faster.
  - Permission tests register defects only for privilege escalations; an allowed identity that is refused is shown as unverified, grouped by cause, instead of a defect.
  - Functional tests update outdated scenarios in whole-project runs and list them as unverified in selected-task runs without filing defects for stale expectations.
  - A quality test's duration now stops when its last dimension is submitted and no longer grows when its task is moved back and delivered again.
- **[Agent]** Agents in a conversation no longer repeat their whole reply after asking a question or creating an issue.
- **[リリース]** Edition release notes use the Quality and Issue Workflow labels for applicable changes.
