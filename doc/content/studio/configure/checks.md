---
title: Checks and CI
description: Build applications with your repository's CI and deliver PR previews and test environments to Studio.
---

Choose how each repository verifies changes and publishes previews. Studio supports code platform CI, external CI, and Agent self-checks.

## Check sources

Each repository accepts results only from the source selected in **Project settings › Code repositories › Checks**.

| Source | How it works |
| --- | --- |
| Code platform CI | GitHub Actions or GitLab CI runs the checks; use the generated configuration below |
| External CI | Your existing pipeline uses the repository CI key to report checks and publish previews |
| Agent self-checks | Agents determine checks from project scripts, README, and AGENTS.md, report each result with `nb-studio check report`, and build and publish the PR preview |

Agent self-checks require no CI file. For external CI, select that source and use the commands shown in Studio. Store its key in your pipeline's secret store. After switching sources, Studio no longer accepts reports from the previous source.

The following steps cover code platform CI.

## Prerequisites

- **CI can reach Studio.** Cloud CI cannot reach localhost or a private network. Use a reachable HTTPS address or a self-hosted runner with access to Studio.
- **The target environment exists.** Studio provides a preview environment. An administrator can add test environments in [Hosted environments](../admin/environments.md).
- **You can manage the project.** This permission is required to generate its CI key.

Preview and test applications run as Studio subprocesses. Build and deploy production images separately; Studio does not host production deployments. See [Production deployment](../project/release.md).

## Generate the configuration

1. Open the project's overview and select the preview CI setup item. You can also open **Settings › Code repositories** and select the repository's **Checks**.
2. Choose your code platform's CI as the check source, such as **GitHub Actions**. Select a trigger and environment.

   | Trigger | Purpose |
   | --- | --- |
   | Pull request | Create a preview for each PR; remove it when the PR is merged or closed |
   | Push to a branch | Deliver changes from the selected branch to a test environment |
   | Tag | Deliver matching tags to the selected test environment; the default pattern is `v*` |

3. Enter the application directory and ID. Use `.` for an application at the repository root.
4. Copy the prompt for your local Coding Agent. It adds the CI file, stores the secret, and opens a PR.
5. For manual setup, expand the manual configuration section. Generate the CI key, save it in your code platform, and add the supplied CI file to the repository.

Each configuration covers one trigger. Configure PR previews and branch deployments separately.

GitHub uses a workflow under `.github/workflows/` and the Actions secret `NB_STUDIO_API_KEY`. GitLab uses a file under `.gitlab/`, included from `.gitlab-ci.yml`. Studio does not commit these files automatically.

## Verify CI

Open a PR and wait for CI to finish:

1. Find the build under **Settings › Code repositories › Build records**.
2. Open the task's **Code and preview** tab to check the results and preview link.
3. Open the preview and confirm that you can sign in and use the application.

A configuration waiting for its first report has not yet been verified.

## Maintain the CI key

The CI key belongs to the organization. Store it in the code platform's CI secrets, never in the repository. It is displayed only when generated.

Keys expire after 90 days. Studio reminds the project lead and administrators 14 days before expiry, three days before expiry, and on the expiry date. Replace the saved CI secret when prompted. Disabling or deleting the key prevents CI from deploying to Studio.

## Use previews

PR previews use sample data. Members who can edit the task can view its initial administrator credentials.

For a task that does not need a preview, enable **No preview needed** in its properties. The Agent adds the `no-preview` label, which the CI template respects. See [PR previews](../release/previews.md) for capacity and sleep settings.
