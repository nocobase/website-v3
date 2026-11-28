---
title: PR checks and code review
description: Follow check results, Agent reviews, and merge conditions.
---

Before delivery, the Lead Agent arranges verification and code review according to the project's skills. The task owner reads the delivery report and decides whether to merge.

## Follow checks

Open **Code & previews** on the task to see each PR's check source, results, and log links. The repository selects the source: code-host CI, external CI, or Agent self-check. See [Configure repository checks](../configure/checks.md).

![PR check results on a task](https://static-docs.nocobase.com/studio-en-req-preview-20261111-normal-2x.webp)

If a required check fails, open its log. The Lead Agent arranges a fix when automatic follow-up is enabled. Otherwise, ask it to investigate in a task comment. Advisory checks do not block a normal merge in Studio.

## Arrange review

The Standard workflow prefers a suitable, available reviewer from another vendor. It can use a model from the same vendor when no suitable alternative is available. Skills such as `studio-review` define review criteria and finding severity. See [Skills](skills.md).

The Lead Agent returns blocking findings to the implementer. Unrelated problems should be recorded with their impact and evidence, then scheduled separately.

## Decide whether to merge

| PR condition | Action |
| --- | --- |
| Required checks pass and the PR is mergeable | The owner accepts and merges |
| Required checks fail or results are missing | A person with force-merge permission can explicitly proceed; the action is recorded |
| Checks are pending, or the PR is conflicted or a draft | Wait or resolve the blocker |
| The code host rejects the merge | Meet the platform's requirements |

Agents cannot merge PRs. See [Accept a task](../use/accept.md) for the steps. When the requester and owner are different people, the [requester must accept delivery](../use/multi-role-workflow.md#requester) before the owner can merge.
