---
title: Connect an existing project
metaDescription: Connect an existing NocoBase Core repository to Studio, preserve existing conventions and data, configure checks with isolated PR previews, and run a small change through your first PR.
---

If you already have a NocoBase Core repository and want to coordinate requests, Agent execution, and continuous delivery in Studio, you can connect it directly without starting over.

This guide uses an existing CRM repository as an example (to practice safely, fork [`nocobase/doc-demo-crm`](https://github.com/nocobase/doc-demo-crm) into a Git account authorized by your Studio Git connection). Before starting, make sure you have a working Studio workspace you can sign in to.

## Connect the existing repository

Studio connects only to your Git repository; it does not connect to or modify your production servers or production database.

In your local CRM repository directory, tell a local Coding Agent connected to Studio (setup in [Use Studio from a local Coding Agent](../../studio/join/local-agent.md)):

```prompt
Connect this CRM repository to Studio as a new project named CRM. Keep the existing code and do not initialize it. Send me the project URL when done.
```

You can also create it in the Studio web UI: open **Development › Projects**, click **New project**, choose **Existing repository** and **Do not initialize**, then click **Create** (it opens the project directly without running initialization; see [Project settings](../../studio/project/settings.md#connect-an-existing-repository)).

Open **Settings › Code repositories** at the top of the project (not the workspace **Settings** at the bottom left) and confirm the repository URL and **Default branch**. Leave existing `AGENTS.md`, custom Skills, and requirement docs in the repo so Agents read them automatically. Put build/test secrets under project **Settings › Agent run variables**, and keep preview/staging app runtime settings (such as test database connections) in [Hosted environments](../../studio/admin/environments.md).

![The CRM repository settings show its default branch, checks, branch rules, release lines, and previews.](/assets/guides/studio/repositories.png)

**Step check**: The project is linked to the target repository and default branch, and existing code and convention files remain untouched.

## Configure checks and isolated previews

### Choose and configure a check source

Newly connected repositories use **Agent self-check** by default and work out of the box. To switch to an independent pipeline, open project **Settings › Code repositories** and click **Edit** on the **Checks** row:

| Check source | Best fit | How it works |
| --- | --- | --- |
| **Agent self-check** (default) | Start collaborating fast without maintaining CI | Enabled by default; the executing Agent runs project scripts and publishes PR previews |
| **Code-host CI** (e.g., GitHub Actions) | Unified verification independent of the Agent | Pick the host and trigger, hand the generated prompt to a local Agent, and merge the CI PR |
| **External CI** (e.g., Jenkins) | Reuse an existing external CI system | Generate a repository CI key and report check results and previews from your pipeline |

For **GitHub Actions**: select **GitHub Actions**, set **Trigger** to **Pull request**, **Environment** to **Preview**, and **Directory** to `.` (repo root). Click **Show prompt** to copy the setup instructions, then click **Save**. Hand the prompt to a local Coding Agent to create the workflow and `NB_STUDIO_API_KEY` secret PR—once merged, subsequent PRs trigger the pipeline automatically. See [Configure checks and previews](../../studio/setup/ci.md) and [Configure repository checks and CI](../../studio/configure/checks.md) for more options.

![The Checks panel offers three sources and settings for triggers, the application directory, and previews.](/assets/guides/studio/checks.png)

Each repository accepts results only from its currently selected source; once configured, the issue's **Code & previews** tab shows check status, logs, and the PR preview link.

### Confirm preview isolation and runtime dependencies

- **Isolated preview data**: PR previews load sample data on first deploy and contain no production data (see [PR previews](../../studio/release/previews.md)). Never enter production database credentials in [Hosted environments](../../studio/admin/environments.md); if the app needs an external test database or mandatory variables, supply test credentials in the preview environment or app **Variables**.
- **Runtime dependencies**: Make sure the online runtime can install the repository's dependencies and run its test scripts.

**Step check**: The check source is saved (with CI workflows merged to the default branch if used) and preview data stays isolated from production.

## Run a small change through your first PR

### Submit a task and wait for review

Verify the end-to-end loop with a small, low-risk change. Click **New issue** in the top right of the project page and submit a simple request (adapt the page and copy for your own app):

```prompt
Add a short note at the top of the customer list explaining that salespeople can only see customers assigned to them or shared with them. Keep the existing page layout, filters, and permission rules unchanged so the note is clearly visible at the top of the customer list when done.
```

Review the task card drafted by the Agent and click **Start execution** (or switch to manual entry; see [Raise a request](../../studio/use/raise-a-request.md)). The issue moves to **In progress** while the Lead Agent coordinates development, checks, and review; if clarification is needed mid-run, reply under **My issues › Waiting for you**. Wait until the issue reaches **In review** with a **Handover report**.

### Verify deliverables and merge the PR

Open the issue in **In review**, read the **Handover report**, and check three things:

1. **Conventions respected**: Click **View changes** to inspect the PR diff and confirm the Agent followed `AGENTS.md` and repo conventions.
2. **Checks match latest commit**: In **Code & previews**, confirm results belong to the latest commit (troubleshooting in [PR checks and code review](../../studio/project/checks-and-review.md)).
3. **Preview isolated with no regression**: Open the PR preview (initial admin credentials appear on the issue page) and verify with test accounts that the new note appears and core flows and permissions behave normally.

If anything is off, click **Send back** with actual versus expected behavior; once verified, click **Merge** and confirm the target branch (see [Accept a task](../../studio/use/accept.md) for multi-role acceptance). Merging the linked PR moves the issue to **Done** and cleans up the PR preview.

**Done when**: Your repository is connected with checks and isolated previews working, your first small PR is merged, and existing conventions and production remain untouched.

## Summary and next steps

With the existing repository connected and the first PR merged, subsequent changes can move cleanly through isolated branches, automated checks, review, and preview acceptance before entering the default branch.

Next, continue with [Involve business colleagues](business-colleagues.md) to bring business requests, rule decisions, and preview acceptance into the same Studio project.
