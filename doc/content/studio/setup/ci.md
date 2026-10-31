---
title: Configure checks and previews
description: Choose Agent self-checks, GitHub Actions, or external CI to verify changes and provide previews.
---

After initializing the project, choose how to check changes and provide PR previews. Agent self-checks work without a CI pipeline.

## Choose a check source

Open **Project settings › Code repositories** and select the repository's **Checks**.

| Source | Use it when | Setup |
| --- | --- | --- |
| Agent self-checks | You want Agents to verify changes without a CI pipeline | Select and save; Agents run project checks, report results, and publish previews |
| GitHub Actions | You want GitHub workflows to run checks and builds | Add a workflow file and CI secret |
| External CI | You already use another CI service | Report check results and publish previews from your pipeline |

Each repository accepts results only from its selected source. After switching sources, reports from the previous source are no longer accepted.

![Select a check source, trigger, and preview environment](https://static-docs.nocobase.com/studio-en-setup-ci-options-20261030.png)

## Use GitHub Actions

1. Select **GitHub Actions**, the **Pull request** trigger, and the **Preview** environment.
2. Use `.` for an application at the repository root. Keep the generated application ID.
3. Copy the prompt for your local Coding Agent. It adds the workflow, stores the CI secret, and opens a PR.
4. Wait for the workflow to finish. Find check results and open the preview in the task's **Code & previews** tab.

GitHub Actions must be able to reach Studio. For localhost or private networks, use a self-hosted runner that can reach it, or configure a reachable HTTPS address.

See [Checks and CI](../configure/checks.md) for manual setup, external CI, branch and tag triggers, and key maintenance.

## Next steps

[Invite members](invite.md) to the project. See [Checks and CI](../configure/checks.md) whenever you need external CI, other triggers, or key maintenance.
