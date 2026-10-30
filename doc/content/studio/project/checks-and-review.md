---
title: Checks and review
description: Follow check results, Agent reviews, and merge conditions.
---

Before delivery, the Lead Agent arranges verification and code review according to the project's skills. The task owner reads the delivery report and decides whether to merge.

## Follow checks

Open **Code & previews** on the task to see each PR's check source, results, and log links. The repository selects the source: code-host CI, external CI, or Agent self-check. See [Checks and CI](../configure/checks.md).

![PR check results on a task](https://static-docs.nocobase.com/studio-en-guide-checks-20261031.png)

Under **Project settings › Code repositories › Branch rules**, configure:

- Whether failed required checks wake the Lead Agent.
- Whether passing checks trigger the next step.
- Whether PR conflicts trigger repair work.
- Which checks are advisory and do not block normal merging in Studio.

Checks not listed as advisory are required. The code host's branch protection still applies. When automatic wake-up is disabled, comment on the task to ask the Lead Agent to continue.

## Arrange review

The default workflow prefers a suitable, available reviewer from another vendor. It can use a model from the same vendor when no suitable alternative is available. Skills such as `studio-review` define review criteria and finding severity. See [Skills](skills.md).

The Lead Agent returns blocking findings to the implementer. Unrelated problems should be recorded with their impact and evidence, then scheduled separately.

## Decide whether to merge

| PR condition | Action |
| --- | --- |
| Required checks pass and the PR is mergeable | The owner accepts and merges |
| Required checks fail or results are missing | A person with force-merge permission can explicitly proceed; the action is recorded |
| Checks are pending, or the PR is conflicted or a draft | Wait or resolve the blocker |
| The code host rejects the merge | Meet the platform's requirements |

Agents cannot merge PRs. See [Accept a task](../use/accept.md) for the steps.
