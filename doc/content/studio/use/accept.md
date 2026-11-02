---
title: Accept a result
description: Check the delivery report and working result, then merge or request changes.
---

When a task is **In review**, its owner checks the delivery. Agents provide the report, verification records, and relevant screenshots. People decide whether to accept it.

## Read the delivery report

Open the task from **My issues › Waiting for you**. Read **Needs you**, then check the report.

![Acceptance actions appear above the delivery report](https://static-docs.nocobase.com/studio-en-guide-accept-20261031.png)

| Content | What to check |
| --- | --- |
| Before and agreed approach | Does it match the request and confirmed rules? |
| Changes | What is included in this delivery? |
| Verification | Tests, check environments, and independent review results |
| Remaining issues | Unfinished work and its impact |
| Acceptance criteria | Observable results and supporting evidence |

Open attached screenshots to inspect them. Ask for missing evidence before making a decision.

## Inspect changes and previews

**View changes** opens the PR on the code host. **Code & previews** brings together linked PRs, checks, and preview access.

If the project has PR previews configured, try the acceptance scenarios there. The selected check source must build and publish it first. See [PR previews](../release/previews.md).

Idle previews may sleep and restart when opened. They are removed after the PR merges or closes.

## Accept

For tasks with a PR, select **Merge**. Check the target branch, method, and commit title before confirming. A new commit during confirmation requires a fresh confirmation. The task completes once all linked PRs are merged.

For work without a PR, such as research or document organization, select **Accept**. The Lead Agent and execution Agents cannot merge or accept on a person's behalf.

Merges use your connected personal Git identity first, otherwise the workspace connection. Code-host permissions and protected-branch rules still apply.

## When checks do not pass

Conflicts, pending checks, draft PRs, or code-host rules may prevent merging.

For failed or missing checks, Studio may offer **Merge anyway**. You can provide a reason; Studio records the override on the PR and task. This does not bypass code-host protection, and Agents cannot perform the override.

## Request changes

1. Select **Send back**.
2. Describe the actual and expected behavior.
3. Send the task back to **In progress**.

```prompt
Suspended suppliers can still receive new orders. Block new orders while keeping existing orders readable and allowing goods to be received.
```

The Lead Agent arranges a fix and submits the result again.

## Already merged on the code host

Studio reads merges through webhooks or polling. Use **Mark as merged** when a manual record is necessary. Follow later delivery in [Release overview](../release/overview.md).
