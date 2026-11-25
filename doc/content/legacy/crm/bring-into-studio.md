---
title: Connect to Studio
metaDescription: Connect your existing CRM repository to Studio and prepare Agents, checks, and PR previews for continued development.
lesson: 15
---

Your CRM already manages customers, follow-ups, opportunities, and quotes. Use Studio to turn sales feedback into issues, let an Agent team implement changes, and accept the results yourself. Continue with the same repository, configuration, and business records.

The following exercises require [opportunities and quotes](../../guides/opportunities-and-quotes.md) and [customer access controls](../../guides/team-permissions.md). Complete those capabilities first if they are missing, and retain existing customers and quotes for regression checks. Studio projects and issues organize development; they are separate from the CRM's business records.

You can explore the interface in the [Studio demo](https://studio.demo.nocobase.com/main). Its **CRM System** illustrates collaboration but does not allow saved changes. Use your own Studio and CRM repository for the exercises; issue identifiers and version numbers in screenshots are examples.

## Prepare Studio and Agents

Follow the [installation overview](../../studio/setup/index.md), then configure your [Git connection](../../studio/setup/git.md) and [Agents](../../studio/setup/agents.md). If Studio is already available, verify access to your repository, an online runtime, and available coordinating and executing Agents.

The installation guide covers licensing and installation credentials. Account holders complete their own sign-in and Git authorization. The runtime also needs the dependencies and configuration required to install and test your CRM, including any external services it uses.

**Step check**: You can sign in, the runtime is online, Agents are available, and the Git connection can access your CRM repository.

## Connect the existing CRM repository

In your local CRM directory, ask a Coding Agent connected to Studio:

```prompt
I want to continue improving this CRM with my team in Studio, in a project named CRM. Keep the features and information we already have. Describe the project as managing customers, follow-ups, opportunities, and quotes, and give me the project URL when it is ready.
```

If the local tool is not connected yet, follow [Use Studio from your Agent](../../studio/join/local-agent.md). You can also use **Projects → New project** and select an existing repository. See [Project settings](../../studio/project/settings.md).

Open **Settings → Code repositories** in the project and check the repository and default branch. Retain the existing `AGENTS.md`, development Skills, and requirements documents so another Agent can read the business rules. Do not run new-application initialization over the existing CRM.

![The CRM repository settings show its branch, checks, branch rules, release lines, and previews.](/assets/guides/studio/repositories.png)

**Step check**: The project points to your CRM repository and intended default branch, with the existing code and data preserved.

## Configure checks and PR previews

Click **Edit** beside **Checks** and choose a source:

| Source | Setup |
| --- | --- |
| Agent self-check | The Agent runs project checks, reports results, and publishes previews |
| GitHub Actions | Add workflows and CI credentials to the repository |
| External CI | Have your existing pipeline report checks and publish previews |

Only the selected source counts. For GitHub Actions, choose **Pull request**, select a preview environment, and use `.` for **Directory** when the application is at the repository root. Use **Show prompt** to obtain the setup instructions for your local Agent. Network access, credentials, and manual configuration are covered in [Configure checks and previews](../../studio/setup/ci.md).

![The Checks panel offers three sources and settings for triggers, the application directory, and previews.](/assets/guides/studio/checks.png)

Create a PR for a small change. Verify that its checks refer to the latest commit and open the preview from **Code & previews**. Use separate preview data, not the production database. Check sign-in, customer and quote pages, and access for your test roles.

**Done when**: Studio is connected to your CRM repository and intended default branch, existing code and data are preserved, and the runtime and Agents are available. The PR has check results for its latest commit and an accessible preview, where the owner has verified customers, quotes, and test-role access.

For the general process, see [Connect an existing project to Studio](../../guides/open-crm-project.md).
