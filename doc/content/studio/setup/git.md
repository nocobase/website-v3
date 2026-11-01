---
title: Connect a Git platform
description: Connect a Git platform, using GitHub as the example, so Studio can create repositories and submit code.
---

Connect a Git platform so Studio can create repositories and Agents can submit code and open PRs.

This guide uses GitHub as the example. For GitLab and other options, see [Code platform configuration](../configure/git.md).

## Connect GitHub

1. Open **Settings › Integrations › Git**, select **Add connection**, and choose **GitHub**.
2. Choose your account or organization. For an organization, enter its name.
3. We recommend enabling **Webhook** to receive PR and check updates promptly. For local trials or private-network deployments where the Git platform cannot reach Studio, turn it off. Studio will poll for updates instead.
4. Select **Create on GitHub**, name the App, and confirm.
5. Install the App on the target account or organization. Select **All repositories** under **Repository access** so it can access the repository you create next.
6. Return to Studio.

![Local trial example: connect a GitHub organization with Webhook disabled](https://static-docs.nocobase.com/studio-en-setup-github-connection-20261030.png)

**All repositories** covers existing and future repositories. Review the permissions GitHub displays. Creating an App and installing it in an organization require the corresponding permissions.

## Check the connection

The connection card should show **Connected** and the number of accessible repositories.

![The GitHub App is connected to the organization](https://static-docs.nocobase.com/studio-en-setup-github-connected-20261030.png)

Next, [connect a runtime](shared-runtimes.md).

See [Code platforms](../configure/git.md) for existing Apps, selected repository access, webhooks, and other Git platforms.
