---
title: Configure checks and previews
description: Choose a repository check source and a PR preview build mode using GitHub as an example.
---

Each repository has a check source and a separate preview build mode. This example uses GitHub Actions for checks and the Agent to build PR previews.

## Choose a check source

Open **Project settings › Code repositories** and edit **Checks** on the repository. If GitHub Actions already runs checks, choose **GitHub Actions** and save. Studio reads the results from GitHub. For a repository without CI, keep the default **Agent self-check**.

![Select GitHub Actions as the repository check source](https://static-docs.nocobase.com/studio-guide-en-checks-20261127-a6340eebb255.webp)

## Choose a preview build mode

1. On the same repository card, edit **Previews**.
2. Choose **Agent build** and save. At delivery, the Agent builds the application with the project scripts and publishes the preview. Choose **No build** for a repository that does not need previews.
3. Open a task with a PR. **Code & previews** shows its check results and a link once the preview is published.

![Choose a build mode in the Previews drawer](https://static-docs.nocobase.com/studio-guide-en-preview-20261127-ad12d3e0f876.webp)

## Next steps

Next, [invite members](invite.md) to the project. For other repository settings, see [Configure repository checks and CI](../configure/checks.md) and [Configure PR previews](../configure/pr-previews.md).
