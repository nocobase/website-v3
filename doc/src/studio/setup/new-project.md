---
title: Create a project
description: A project keeps related issues and code together. When you create one, you choose its repository. A new repository is initialized from the NocoBase app template by default, which gives you an app built on Core, so agents build your business on one consistent architecture.
---

Any member of the team can create a project, and whoever creates it becomes the project lead by default.

## Create the project

1. Open **Development › Projects** and click **New project**.
2. Enter a name and description, such as "Supplier Management".
3. Choose a **Code location**:

   | Code location | Good for |
   | --- | --- |
   | New repository | A new business system. Studio creates the repository through a Git connection and initializes it |
   | Existing repository | A repository your team already has |
   | Add later | Creating the project now and adding a repository later in **Project settings › Code repositories**. Without a repository, agents can only work on issues that don't involve code |

4. For **New repository**, choose a Git connection and enter a repository name. Usually keep it a **Private repository**. The Git connection decides the owner, so to create it under another account or organization, use a different Git connection. For **Existing repository**, pick one of the repositories the Git connection can reach.
5. Choose how to initialize it, as described in the next section.
6. Click **Create project**.

## Choose how to initialize the repository

For a new repository:

| Initialization | Result |
| --- | --- |
| NocoBase app | The default. An agent creates the app from the NocoBase app template on a runtime and pushes it to the default branch as the first commit. All later development happens in this app |
| From a prompt | An agent makes the first commit by following the prompt you write, and pushes it to the default branch |
| Empty | Only the code host's initial commit, with no initialization |

For an existing repository, the default is **No initialization**, which uses the repository as it is. You can also choose:

- **NocoBase app**: an agent creates the app from the selected template, keeps the files already in the repository, and submits the changes through a branch and a PR.
- **From a prompt**: for example "Read the code and add an AGENTS.md". The changes also go through a branch and a PR.

Initializing with the NocoBase app needs an online runtime with Node.js 24 and pnpm. If no runtime is online yet, the project is created now, and initialization starts once a runtime comes online.

## The initialization issue

When the repository needs initializing, Studio creates an "Initialize project" issue and hands it to the coordinator agent. The coordinator agent gives the step to a suitable agent and says what to do and when it counts as done. Any issue created in the project afterwards waits until this one is done.

Initializing with the NocoBase app installs dependencies and usually takes ten to twenty minutes. Meanwhile, the issue page shows which agent is on it, for how long, and on which runtime.

- New repository: the first commit goes to the default branch, and once its checks pass (or if the repository has no checks), the issue completes on its own.
- Existing repository: the initialization changes come as a PR, and the issue is done once you accept and merge it.

**Done when**: the "Initialize project" issue is **Done** and the default branch has the app code. On the project overview, "Finish the initialization" disappears from **Next steps**.

## Afterwards

- To get a preview for every PR and automatic deployment after merging, [connect CI](ci.md). **Next steps** on the project overview reminds you.
- Adjust the project lead, members, repositories, variables and secrets, and default skills in the project settings. See [Project settings](../project/settings.md).

> [!NOTE] "The App could not confirm access" when creating a repository
> The GitHub App was installed with access to only some repositories, so it can't reach the repository Studio just created. Add the repository in the App's installation settings on GitHub, then create the project again and choose **Existing repository**. See [Connect Git](git.md).

Next, [connect CI](ci.md), or go straight to [your first request](first-request.md).
