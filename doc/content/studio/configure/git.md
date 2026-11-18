---
title: Git platforms
description: Connect team repositories and configure access and status updates.
---

Administrators manage team connections under **Settings › Git**. Projects use them to access repositories, create PRs, and read check results. For a member's personal Git authorization, see [Sign in and preferences](../join/sign-in.md).

![Manage team Git connections](https://static-docs.nocobase.com/studio-en-git-20261111-normal-2x.webp)

## Connect and verify a repository

1. Add the connection in **Settings › Git**. Check the organization or group on the saved connection.
2. Open the project's repository settings and select a repository from that connection. If several groups share a Git server, expand the repository count on each connection to check which one the project uses.
3. Open the initialization task or the next development task. Check that the runtime can clone the repository and that the linked pull or merge request opens the expected project. If you use code-host CI, open a pipeline and its job log.

## GitHub

Connect GitHub or GitHub Enterprise Server with a GitHub App. See [Connect a Git platform](../setup/git.md) for creation and installation steps.

| Repository access | Use it when |
| --- | --- |
| All repositories | Studio needs to create new repositories |
| Only select repositories | You only need selected existing repositories |

You can enter an existing GitHub App's configuration manually. Use **Add installation** for another installation of the same App. If a new repository is missing, check the installation account and repository access.

## GitLab

For a repository at `https://git.example.com/gitlab/inventory-team/warehouse.git`, use these values:

| Studio field | Example |
| --- | --- |
| Host | `https://git.example.com/gitlab`, including the GitLab installation path |
| Group | `inventory-team`, the group path in the repository URL. Include parent groups for a subgroup, such as `inventory-team/apps` |
| Connection name | A recognizable label, such as Inventory team |

Creating a group token requires the Owner role in that group. On GitLab.com, group tokens require Premium or Ultimate. [GitLab group access tokens](https://docs.gitlab.com/user/group/settings/group_access_tokens/)

1. Open the target group in GitLab. Go to **Settings › Access tokens** and select **Add new token**. Give the token a descriptive name.

   ![Add a token in the target group’s access token settings](/assets/studio/group-token-settings.webp)

2. Select the `api` scope. The Developer role can push development branches, open merge requests, and read pipelines. Choose Maintainer if Studio will create repository webhooks.

   ![Select Maintainer for automatic webhooks and enable the api scope](/assets/studio/group-token-permissions.webp)

3. Add a GitLab connection in Studio. Enter the instance URL, group path, and token. Save, check the group and expiration date, then link the repository in your project.

   ![Enter the GitLab host and full group path in Studio](/assets/studio/studio-gitlab-en.webp)

Members can connect their own Git account in account settings. That account needs access to the repository for the operations it performs.

## Gitea

Add a Gitea connection with the instance URL and a dedicated account's personal access token. Include any deployment path, but omit `/api/v1`.

The token needs `write:user`, `write:organization`, `write:repository`, and `write:issue`. The account also needs access to the target repositories. Creating webhooks requires repository administrator access. Enable squash merging on the repository.

Members can enter their own token in **Account settings › Git**. For browser authorization, create a Gitea OAuth2 application and configure the callback URL shown by Studio, client ID, and secret. Install the official `gt` CLI on the runtime.

## Webhooks and polling

Enable webhooks when the code host can reach Studio over HTTPS. For a private network or local address, disable webhooks. Studio polls PRs and check results once per minute.

Connection cards show connectivity, repository counts, and webhook status. Update credentials before they expire. To connect existing code, see [Project settings](../project/settings.md#connect-an-existing-repository).
