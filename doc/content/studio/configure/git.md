---
title: Git platforms
description: Connect team repositories and configure access and status updates.
---

Administrators manage team connections under **Settings › Git**. Projects use them to access repositories, create PRs, and read check results. For a member's personal Git authorization, see [Sign in and preferences](../join/sign-in.md).

![Manage team Git connections](https://static-docs.nocobase.com/studio-en-git-20261111-normal-2x.webp)

## GitHub

Connect GitHub or GitHub Enterprise Server with a GitHub App. See [Connect a Git platform](../setup/git.md) for creation and installation steps.

| Repository access | Use it when |
| --- | --- |
| All repositories | Studio needs to create new repositories |
| Only select repositories | You only need selected existing repositories |

You can enter an existing GitHub App's configuration manually. Use **Add installation** for another installation of the same App. If a new repository is missing, check the installation account and repository access.

## GitLab

1. Create a group access token with the `api` scope and Developer role.
2. Add a GitLab connection in Studio with the server address and credential.
3. Check the group, permissions, and expiry after saving.

Developer access supports branch pushes, merge requests, and pipeline reads. Automatically creating webhooks requires Maintainer access; otherwise use polling.

## Gitea

Add a Gitea connection with the instance URL and a dedicated account's personal access token. Include any deployment path, but omit `/api/v1`.

The token needs `write:user`, `write:organization`, `write:repository`, and `write:issue`. The account also needs access to the target repositories. Creating webhooks requires repository administrator access. Enable squash merging on the repository.

Members can enter their own token in **Account settings › Git**. For browser authorization, create a Gitea OAuth2 application and configure the callback URL shown by Studio, client ID, and secret. Install the official `gt` CLI on the runtime.

## Webhooks and polling

Enable webhooks when the code host can reach Studio over HTTPS. For a private network or local address, disable webhooks. Studio polls PRs and check results once per minute.

Connection cards show connectivity, repository counts, and webhook status. Update credentials before they expire. To connect existing code, see [Project settings](../project/settings.md#connect-an-existing-repository).
