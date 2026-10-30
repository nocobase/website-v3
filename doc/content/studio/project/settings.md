---
title: Project settings
description: Manage project members, repositories, run variables, and default skills.
---

Project leads and administrators can change project settings. Open **Members** to manage access and **Settings** to configure development work.

## Members and visibility

Search for existing members and add them to the project. New members must [join Studio](../setup/invite.md); an invitation can also assign them to a project.

- **Everyone**: all workspace members can view the project.
- **Project members only**: access is limited to project members and administrators.
- **Project lead**: choose a project member. Assign a new lead before removing the current one.

Change status, priority, and dates in the project properties.

![Project members and lead](https://static-docs.nocobase.com/studio-en-guide-project-members-20261031.png)

## Configure the project

| Section | Settings |
| --- | --- |
| General | Name, description, and default commit attribution |
| Code repositories | Repositories, checks, branch rules, and previews |
| Agent run variables | Environment variables and secrets for development tasks |
| Default skills | Skills used by runs in the project or a repository |

![Configure checks, branch rules, and previews on each repository](https://static-docs.nocobase.com/studio-en-guide-project-repositories-20261031.png)

The first repository is the primary repository. Removing a link does not delete the repository on the Git platform. See [Checks and CI](../configure/checks.md) and [Skills](skills.md) for their configuration.

### Connect an existing repository

In **New project**, choose **Existing repository** and select a repository available through the Git connection. For an existing application, usually choose no initialization.

To add application scaffolding, choose **NocoBase application** or prompt-based initialization. The Agent preserves existing files and submits changes through a branch and PR for the owner to accept. You can also add a repository later. To start with an empty application, see [Create your first project](../setup/new-project.md).

### Commit attribution

Use the member's identity alone or include the Agent as a co-author. A member's personal preference takes priority over the project default.

### Agent run variables

Set variables for the whole project or a single repository. For the same name, repository values override project values; Agent values override both.

- Values are hidden after saving. Revealing a secret records who viewed it and when.
- For values supplied by a runtime, use `nocobase-runner env set NAME` on that runtime.
- Restrict a variable to shared runtimes when work using it must not run on personal runtimes.

Configure preview and test application variables in [Hosted environments](../admin/environments.md) or the application settings.

## Delete a project

Administrators can delete a project from its additional actions. Tasks remain but leave the project. Git repositories are unaffected.
