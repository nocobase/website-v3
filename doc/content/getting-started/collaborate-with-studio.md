---
title: Install and use Studio
metaDescription: "Install the free Studio Community Edition and a first project on your computer with one command, then submit a request and walk through Agent handoffs, reviews, and acceptance."
---

Install the free Studio Community Edition and a starter project on your own computer with one command, then walk through submitting a request, Agent-driven development, checks and review, and acceptance from start to finish.

## Prerequisites

- macOS, Linux, or WSL on Windows with Docker Desktop
- Docker with Compose v2, running
- Node.js 24, Git, and curl
- At least one Coding Agent installed and signed in: Claude Code, Codex, OpenCode, Pi, or similar

## Install and sign in with one command

Run in your terminal:

```bash
curl -fsSL https://get.nocobase.com/studio | sh
```

For options such as interface language or mirror registries, see [Installer options](../studio/setup/install.md#installer-options).

The installer sets up on your computer:

- Studio Community Edition, with data stored in `~/.nocobase-studio/`
- A local Git server (Gitea) for project repositories
- This computer connected as a [personal runtime](../studio/join/personal-runtime.md), where your Coding Agents run tasks
- **My first project**, containing a Core-based NocoBase 3 app already deployed to a test environment

When finished, the terminal prints Studio's URL and login credentials. Open `http://127.0.0.1:13000/main`, sign in with those credentials (change your password under **Account settings › Account & security**), and enter the starter project conversation.

The conversation includes an initial plan prepared by the Agent and a suggested task card with a **Start** button. You can click **Start** right away, or follow the steps below to submit your own requirement.

## Open the app in the test environment

The Agent's first message in the conversation starts with the test app's URL and credentials—by default `http://127.0.0.1:13000/my-first-project-staging/`.

Open it and sign in with the credentials from that message to view the initialized NocoBase 3 application. The test environment sleeps after 10 minutes of inactivity and starts automatically on the next visit; you can also view it under [Managed environments](../studio/admin/environments.md).

## Submit a request and confirm the plan

On the project page, click **New issue** and describe your business goal and how you want to verify it. For example:

```prompt
Add a suppliers page with name, contact person, phone number, and status. Buyers can create, edit, and view suppliers.

When done, I should be able to add a supplier, set its status to paused, and filter the list by status.
```

The Agent asks clarifying questions about unclear rules, then organizes the requirement into a task. Review it and click **Start** (or switch to manual entry to create the task directly).

![Clarifying goals and business rules in conversation when creating a new issue](https://static-docs.nocobase.com/studio-en-new-task-20261111-normal-2x.webp)

Once started, the task moves to **In progress**, and the Lead Agent schedules design, development, testing, and review. If you have existing policies or field definitions, attach them to the task or add them to the [Knowledge base](../studio/project/knowledge-base.md).

## Follow development, checks, and review

The top of the task shows the active Agent, runtime, and next step. **Activity** records handoffs, replies, and review feedback, while **Runs** keeps detailed execution logs.

![Task details showing the current step and upcoming actions](https://static-docs.nocobase.com/studio-en-req-now-20261111-normal-2x.webp)

Execution Agents make changes on a dedicated branch and open a PR; checks and review results stay linked to the same task. If checks fail or review raises issues, the Lead Agent schedules fixes and re-runs verification before handing the work to you. See [Checks and review](../studio/project/checks-and-review.md).

## Answer questions and accept the result

When a business decision is needed, the task pauses as **Blocked** and surfaces under **My issues › Waiting for you**. Reply in the **Needs you** card and the Lead Agent resumes execution.

Once the task reaches **Ready for acceptance**:

1. Read the delivery report to verify changes, check results, and any unverified items.
2. Click **View changes** to inspect the PR, and test against your scenarios in the preview or test environment.
3. Click **Merge** when satisfied, confirming the target branch and merge method.
4. Click **Request changes** if adjustments are needed, stating what failed and what you expect.

![Confirming task results with the delivery report and acceptance criteria](https://static-docs.nocobase.com/studio-en-req-accept-20261111-normal-2x.webp)

When the task is **Done** and the changes are on the default branch, development delivery is complete.

## Release changes and retain project knowledge

Merging code does not automatically deploy to production. Projects with CI update the test environment after merge; once the owner confirms which tasks belong in a release and deploys to production, they record the production version in Studio. See [Release management](../studio/release/overview.md).

Agreed business rules and design conventions can be saved to [Project memory](../studio/project/project-memory.md), while source documents stay in the knowledge base so future requests and teammates reuse the same context.

## Connect an existing Core app

If you already built an app locally in [Build your first app with Core](develop-your-first-app.md) and pushed it to a Git repository, you do not need to re-initialize a project. Because the one-command installer also installs `nb-studio`, open your Coding Agent in the app directory and say:

```prompt
Use nb-studio to create a project in Studio linked to the current repository, without initializing it. Tell me the project URL when done.
```

For full steps and PR preview setup, see [Bring the project into Studio](../guides/bring-into-studio.md).

## Next steps

- Upgrade, stop, or uninstall local Studio: [Upgrade, stop and uninstall](../studio/setup/install.md#upgrade-stop-and-uninstall)
- Deploy Studio for a team on a server: [Installation overview](../studio/setup/index.md)
- Handle ongoing decisions and acceptance: [My issues](../studio/use/my-tasks.md)
- Follow a complete project from Core development into Studio collaboration: [Build reliable enterprise apps with NocoBase 3](../guides/build-reliable-enterprise-apps.md)
