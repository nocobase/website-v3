---
title: Configure PR previews for a repository
description: Choose who builds PR previews for a repository and connect a CI pipeline if needed.
---

Open **Project settings › Code repositories** and edit **Previews** on the repository card. Choose the build mode independently of the [check source](checks.md). For example, GitHub Actions can run checks while the development Agent builds previews.

## Choose a build mode

- **Agent build** lets the Agent build the archive with the project scripts and publish the preview at delivery.
- **CI build** lets a pipeline build the archive and publish the preview with the repository CI key.
- **No build** skips previews for this repository.

Select **Save** to apply the choice.

![Choose a build mode in the Previews drawer](https://static-docs.nocobase.com/studio-guide-en-preview-20261127-ad12d3e0f876.webp)

## Publish previews from CI

1. Select **CI build**. Reuse the repository CI key if the pipeline already has it. Otherwise, generate one in the panel and store it as the pipeline secret `NB_STUDIO_API_KEY`. Set `NB_STUDIO_URL` to a Studio address the CI runner can reach.
2. For the code host’s CI, choose the pull request trigger, a hosted environment for previews, and the application directory (use `.` for the repository root). Add the generated configuration to the repository. For other CI systems, add the build and publish commands from the panel to your pipeline.
3. Open a PR. Once the pipeline publishes the preview, verify the app and commit in the repository’s **Build records**, then open the [PR preview](../release/previews.md) from the task.

![Repository key settings and workflow options under CI build](https://static-docs.nocobase.com/studio-guide-en-ci-build-20261127-a2f2cc4abfa1.webp)
