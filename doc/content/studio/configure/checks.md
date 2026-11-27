---
title: Configure repository checks and CI
description: Choose where PR check results come from, set branch rules, and verify results on a task.
---

## Choose a check source

Open **Project settings › Code repositories**. On the repository card, edit **Checks**, choose a source, and save.

| Check source | When to use it | How Studio gets results |
| --- | --- | --- |
| Agent self-check (default) | The development Agent runs the project checks | The Agent runs the project scripts and reports results with `nb-studio check report` |
| Code-host CI | The repository already runs checks in GitHub Actions, GitLab CI, or another supported host | Studio reads the checks on the linked PR or MR |
| External CI | A separate pipeline such as Jenkins runs the checks | The pipeline sends results and log links to Studio |

![Select GitHub Actions as the repository check source](https://static-docs.nocobase.com/studio-guide-en-checks-20261127-a6340eebb255.webp)

## Connect external CI

1. Select **External CI** under **Checks** and generate a repository CI key.
2. Store the key as the pipeline secret `NB_STUDIO_API_KEY`. Set `NB_STUDIO_URL` to a Studio address the CI runner can reach.
3. Add the reporting script from the panel to your pipeline. It sends the status and log link for each check.

The key is shown once and expires after 90 days by default. When you replace it, update the pipeline secret.

## Configure branch rules

Under **Project settings › Code repositories › Branch rules**, configure:

- Whether failed required checks wake the Lead Agent.
- Whether passing checks trigger the next step.
- Whether PR conflicts trigger repair work.
- Which checks are advisory and do not block normal merging in Studio.

Checks not listed as advisory are required. The code host's branch protection still applies. When automatic wake-up is disabled, comment on the task to ask the Lead Agent to continue.

## Verify checks on a task

Open the task linked to the PR and select **Code & previews** to see the status and logs for each check. **Not reported yet** means the selected source has not sent a result. See [PR checks and code review](../project/checks-and-review.md) for handling failures.
