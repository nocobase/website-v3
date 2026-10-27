---
title: Connect Git
description: Connect GitHub, GitLab, or Gitee in Settings › Integrations › Git so Studio can create and read repositories and agents can open PRs.
---

Studio reaches your code host through a Git connection. It uses it to create repositories, read them, track PRs and check results, and merge from Studio. You can create projects without a Git connection, but you won't get PRs, checks, or previews.

## Connect GitHub

Studio creates a GitHub App for you on GitHub, with every permission it needs already filled in. You confirm it on GitHub, then install it on your account or organization.

1. Open **Settings › Integrations › Git**, click **Add connection**, and choose **GitHub**.
2. Under **Owner of the app**, choose **My account** or **An organization**. For a self-hosted GitHub Enterprise Server, choose it and enter the server address.
3. Set **Webhook**. See [Should you turn on webhooks](#should-you-turn-on-webhooks) below.
4. Click **Create on GitHub**. Name the App on GitHub and confirm.
5. Then install the App on your account or organization. Under **Repository access**, choose **All repositories** so Studio can reach the repositories it creates.
6. When the installation is done, go back to Studio, and the connection appears in **Settings › Integrations › Git**.

If you already have a GitHub App, click **Already have a GitHub App? Enter it manually**. One App can be installed on several accounts or organizations. Click **Add installation** in the connection.

> [!NOTE] Giving the App access to only some repositories
> If you chose **Only select repositories** during installation, the App can't reach the repositories Studio creates, and creating a project shows "The repository was created, but the App could not confirm access." Add the new repository in the App's installation settings on GitHub, then create the project again and choose **Existing repository**.

## Connect GitLab

1. On GitLab, create a group access token for the group you want to use, with the `api` scope and the Developer role.
2. In **Settings › Integrations › Git**, click **Add connection**, choose **GitLab**, and enter the instance address (gitlab.com by default) and the token.

When you save, Studio checks the token's scopes, expiry date, group, and role, and tells you right away if something is wrong. With a Developer token, agents can push branches, open merge requests, and view and rerun pipelines in every project in the group, but can't change project settings or protected branches. For Studio to create webhooks on projects automatically, the role needs to be Maintainer. With Developer, Studio polls on a schedule instead.

When the token expires, every run that uses this connection fails, so replace it before then.

## Connect Gitee

Studio supports gitee.com. Generate a personal access token on a personal account or a dedicated bot account, with the `user_info`, `projects`, `pull_requests`, and `hook` scopes. The account also needs access to the repositories and organizations involved. In **Settings › Integrations › Git**, click **Add connection**, choose **Gitee**, and enter the token.

When Studio merges a PR on Gitee, it always squashes.

## Should you turn on webhooks

| Your Studio | Webhook | What happens |
| --- | --- | --- |
| Has an HTTPS address reachable from the internet | On | The code host pushes PRs and check results to Studio as they happen |
| Is on an internal network only, or you're trying it out on `localhost` | Off | Studio creates no webhooks and checks PRs and check results once a minute |

If Studio is only on an internal network, you must turn webhooks off. GitHub refuses webhook addresses it can't reach, and creating the App with the webhook on fails with "Hook url is not supported because it isn't reachable over the public Internet". You can turn it on later once Studio has a public address.

## Members use their own accounts

Each member can connect their own code host account in **Account settings › Git**. Once they do, the PRs agents open for them and the merges they make in Studio are done under their own names. Until then, this Git connection is used. See [Connect your own Git account](../join/sign-in.md#connect-your-own-git-account).

- On GitHub, members can authorize in the browser or connect with a code. Connecting with a code needs "Enable Device Flow" turned on in the App's settings on GitHub.
- Each connection has a setting for whether members may use personal tokens, **Allow personal tokens**, which is on by default.

## Check the connection

The connection appears in **Settings › Integrations › Git** as **Connected**, with the number of repositories it can reach and its webhook status, such as "webhooks off, Studio polls".

> [!NOTE] Protect your default branch
> Studio doesn't protect branches for you. Turn on protection rules for the default branch on GitHub, GitLab, or Gitee, for example requiring checks to pass before merging.

Next, [connect a shared runtime](shared-runtimes.md).
