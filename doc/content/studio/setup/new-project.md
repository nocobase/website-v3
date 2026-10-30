---
title: Create your first project
description: Create a private repository and initialize a NocoBase application, ready for business tasks.
---

First [connect a Git platform](git.md) and [configure Agents](agents.md). At least one runtime must be online with Node.js 24 and pnpm 11 installed.

Team members can create projects and become their project lead. Confirm that the GitHub App has access to **All repositories**; see [Connect GitHub](git.md#connect-github).

## Enter project details

1. Open **Development › Projects** and select **New project**.
2. Enter a name and description. For example, **Supplier Management** and **Manage supplier records, scoring, and purchase approvals**.
3. Select **New repository** for the code location.
4. Choose the connected Git account or organization and enter an unused repository name. Keep the repository private.
5. Select **NocoBase app** and keep the default application template.
6. Select **Create**.

![Create a private repository and initialize it with the default NocoBase template](https://static-docs.nocobase.com/studio-en-setup-create-nocobase-app-20261030.png)

Studio creates the repository under the selected account or organization. The repository name must not already be in use.

## Wait for initialization

Studio creates an **Initialize project** task. The Lead Agent assigns the work. An execution Agent creates the Core application on a runtime, installs dependencies, and commits the code.

Open the task to follow progress, Agent replies, and check results. Other project tasks wait for initialization to finish.

![The project lists its initialization task](https://static-docs.nocobase.com/studio-en-setup-initializing-20261030.png)

The first commit is pushed to the default branch. The initialization task completes automatically when checks pass, or when the repository has no checks configured.

Initialization downloads the template and dependencies, so timing depends on the network, runtime, and model. If work stays queued, check that a runtime is online and the Lead Agent is available.

## Start adding tasks

Confirm that:

- **Initialize project** is **Done**.
- The repository's default branch contains the application code.
- The overview no longer asks you to complete initialization.

The application is ready. Prepare checks and previews, then invite members.

![Initialization is complete and the project is ready for business tasks](https://static-docs.nocobase.com/studio-en-setup-project-ready-20261030.png)

## Next steps

[Configure checks and previews](ci.md) using Agent self-checks, GitHub Actions, or external CI. Then [invite members](invite.md).

Manage project documents, members, and default skills in [Project settings](../project/settings.md). Adjust models in [Agent configuration](../configure/agents.md) and execution resources in [Runtimes](../configure/runtimes.md).
