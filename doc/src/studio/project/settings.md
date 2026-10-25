---
title: Project settings
description: A project's visibility, members, and lead, its repositories, the variables and secrets agents get when they run, commit attribution, and default skills.
---

The project lead manages a project's settings. Whoever creates a project is its lead by default, and admins can manage every project.

A project page has six sections at the top: **Overview**, **Issues**, **Knowledge**, **Members**, **Releases**, and **Settings**. For the knowledge base, see [Knowledge base](knowledge-base.md). For releases, see [Approve releases and roll back](release.md). For the overview, see [Project progress](progress.md).

## Visibility, lead, and members

- **Visibility**: with **Everyone**, every member of the workspace can see the project. With **Members only**, only project members and admins can see the project and its issues.
- **Lead**: in **Members**, click **Set as lead** for a member. The project lead must be a project member. To remove the current lead, choose a new lead first.
- **Members**: in **Members**, search by name to add people, or remove them. To invite colleagues who haven't joined Studio yet, see [Invite members](../setup/invite.md). You can pick this project right in the invitation.
- **Status, priority, and dates**: set them in the project's properties. The project list sorts and filters by them. A project's status is Planned, In progress, Paused, Completed, or Cancelled.

## Settings

**Settings** has six sections:

| Section | What it does |
| --- | --- |
| General | The project's name and description, and how agents' commits are attributed |
| Code repositories | The repositories the project uses. The first is the primary repository, where work starts. You can add, reorder, and remove them |
| Deployment | How the repository's CI builds previews and deploys to Studio. See [Connect CI](../setup/ci.md) |
| Branch rules | Which branch agents work on, which PRs are linked to issues, and when check results wake the coordinator agent. See [Checks and review](checks-and-review.md) |
| Agent run variables | The variables and secrets agents get when they work in this project. See below |
| Default skills | The skills every run brings along by default, for the project or for one repository. See [Skills](skills.md) |

### Code repositories

A project can have several repositories, for example an app and its plugins kept apart. The first is the primary repository, where issues start by default. Removing a repository only means issues stop working in it. The repository itself isn't touched.

In a project without a repository, agents can only work on issues that don't involve code. **Next steps** on the project overview reminds you to **Add a code repository**.

### Commit attribution

Agents commit code as the person who started the work. Each person can choose in **Account settings › Preferences** whether their commits also credit the agent as a co-author. The setting here is the default for anyone who hasn't chosen.

### Agent run variables

Set the environment variables agents need when they run here, such as a test API address or a key for a third-party service:

- Set them for the whole project or for one repository only. A repository's variable overrides the project's variable with the same name, and the agent's own variable overrides both.
- Once saved, values aren't shown again, and they're masked in run records. If you really need to see one, click **Reveal values**. Each reveal is recorded in the access log with your name and the time.
- **From the runtime**: the value isn't stored here. Instead, the runtime that takes the work provides it from its own machine, where it's set with `nocobase-runner env set NAME`. On a runtime that doesn't provide the variable, the run fails before it starts.
- For high-risk secrets, check **Shared runtimes only**. Runs that use the variable are then carried out only by shared runtimes and never sent to members' personal runtimes.

Variables that deployed apps read, including previews, aren't set here. Set them per environment or per app in release management.

## Delete a project

You can delete a project from **More project actions**, which needs admin permissions. The project, its members, and its repository links are deleted. The project's issues are kept and no longer belong to any project. Repositories on the code host aren't affected.
