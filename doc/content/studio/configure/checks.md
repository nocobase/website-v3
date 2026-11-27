---
title: Configure repository checks and CI
description: Select a check source and configure verification, PR previews, and test delivery.
---

On the repository card in **Project settings › Code repositories**, edit **Checks** and **Previews** separately. For example, GitHub Actions can provide checks while an Agent publishes the preview for the same PR.

![Select GitHub Actions as the repository check source](https://static-docs.nocobase.com/studio-guide-en-checks-20261127-a6340eebb255.webp)

## Agent self-check

New repositories default to Agent self-checks. The Agent runs the project checks and reports each result with `nb-studio check report`. To have the Agent publish a preview as well, select **Agent build** in **Previews**.

## Code-host CI

If you use GitHub Actions, GitLab CI, or Gitea Actions, select the code host in **Checks** and save. Studio reads existing checks on the linked PR or MR.

To publish previews through CI as well:

1. Select **CI build** in **Previews**.
2. Store the repository CI key as the pipeline secret `NB_STUDIO_API_KEY`. Set `NB_STUDIO_URL` to a Studio URL reachable from the runner. External CI can use the same repository key to report checks and publish previews.
3. Use the configuration shown in the drawer to add a PR build job. For an existing pipeline, follow the build and publish commands in the drawer. Save and verify with a PR.

For the code host’s own CI, select the trigger, target environment, and application directory (use `.` for the repository root). Use a PR trigger for previews, or a branch push or tag to deploy to a [test environment](../admin/environments.md). Generate a configuration for each trigger. The CI runner needs network access to Studio.

![Repository key settings and workflow options under CI build](https://static-docs.nocobase.com/studio-guide-en-ci-build-20261127-a2f2cc4abfa1.webp)

## External CI

Select **External CI** in **Checks** and store the repository CI key as a pipeline secret. Use the generated script to report each check’s status and log URL. To publish previews from the pipeline, also select **CI build** in **Previews**.

The key appears only when generated. Keep it out of the repository. Repository CI keys expire after 90 days by default. When you receive an expiry reminder, replace the key and update the pipeline variable.

## Configure branch rules

Under **Project settings › Code repositories › Branch rules**, configure:

- Whether failed required checks wake the Lead Agent.
- Whether passing checks trigger the next step.
- Whether PR conflicts trigger repair work.
- Which checks are advisory and do not block normal merging in Studio.

Checks not listed as advisory are required. The code host's branch protection still applies. When automatic wake-up is disabled, comment on the task to ask the Lead Agent to continue.

## Verify the connection

After opening a PR, check its results in the task’s **Code & previews** tab. Once a preview is published, open **Build records** from the repository’s **Previews** row to see the published app and its publisher.

**Not reported yet** means the selected source has not reported results. If required variables are missing, set them on the environment or application as indicated. Tasks that do not need previews can use the **No preview needed** property; generated CI templates respect the `no-preview` label.

See [PR checks and code review](../project/checks-and-review.md) for how results affect task progress.
