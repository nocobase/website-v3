---
type: "release"
product: "studio"
tag: "v1.0.0-beta.93"
channel: "beta"
version: "1.0.0-beta.93"
title: "NocoBase Studio · v1.0.0-beta.93"
date: "2026-11-27"
publishedAt: "2026-11-27T16:30:29Z"
---

### 🚀 Improvements

- **[Projects]** Show and change a project's default owner on the owner steps of its Workflow tab, visible to every member, instead of in Settings.
- **[Issues]** The task stage bar now shows the owner taking over or starting the task and, when a requester accepts it, the owner's merge, matching the project's Workflow tab; a task cannot be sent for review before its requester confirms the requirement.
- **[Quality]** {{edition:enterprise}}
  - When the quality overview's run records leave tests out, a line below them says how many and links to all of them in Testing tasks.
  - Task-scoped quality tests run only changed test files, and dimension notes explain the largest measured time costs.
  - The "New" tag in the core scenario list now follows the scenario title, and "This test" shows only the result.

### 🐛 Bug Fixes

- **[Releases]** Load outstanding sample data on later deployments and apply changes to the sample data setting when redeploying.
- **[Quality]** {{edition:enterprise}} Keep the latest test's number on one line with its full date in the quality overview's metrics test picker.
- **[Agents]** OpenCode now completes startup and model detection reliably in offline or intranet environments, recognizes API keys configured in `opencode.json` / `opencode.jsonc`, and the Runtimes page shows a warning with the failure reason beside a tool's status when model detection fails.
