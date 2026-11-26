---
title: Release to production
metaDescription: Verify the CRM changes in staging, check release scope, upgrade your own production server, and record its actual version.
---

Merging code to the default branch does not mean it is ready for production. Suppose CRM has merged quote revision comparison and customer handover for a candidate release (substitute your own pending features)—this guide walks through staging verification, tagging with artifacts, backed-up production upgrade, and version recording.

Before starting, prepare a connected Studio project with merged changes, a configured staging environment in [Hosted environments](../../studio/admin/environments.md), your own production server, and release permissions.

Studio's **Releases** has four stages: **Preview** verifies PRs, **Staging** verifies merged code, **Release** tracks Git tags and artifacts, and **Production** records the team-confirmed production version. Studio hosts previews and staging; production runs on your own server.

![The CRM release page shows four delivery stages and where pending issues have reached (shown with a sample project).](/assets/guides/studio/releases.png)

## Deploy to staging and verify business flows

Open the CRM project's **Releases** tab, click **Deployment guide** on the **Staging** card, enter an app ID such as `crm-staging`, and choose your staging environment. Click **Copy prompt for your agent** and pass it to a Coding Agent in your local repo checkout to build and upload the artifact (or click **Connect CI** to update staging automatically on every merge; see [Checks and CI](../../studio/configure/checks.md)).

![The staging guide offers Agent upload, CI setup, and manual commands.](/assets/guides/studio/staging-guide.png)

Once deployed, verify the active commit SHA under **Staging environments** below the cards and open the staging app (fill in any missing required variables under the app's **Variables** tab and restart). Ask a business owner (such as sales manager Morgan) to walk through the new and core business flows with isolated test data.

**Step check**: Staging runs the candidate commit and both new and existing core flows pass.

## Check pending issues

In **Pending release** below the cards, inspect completed issues not yet delivered to production. **In staging** means a change has reached staging; **Not deployed yet** means it has not. Confirm every intended issue belongs to the candidate commit—**Done** alone is not enough. If anything is missing, update staging and verify again.

## Publish a version

Before your first release, open project **Settings › Code repositories**, click **Edit** on **Release lines**, and configure a tag pattern such as `v*` (see [Versions and releases](../../studio/release/versions.md)).

Then return to **Releases** and click **How to publish** on the **Release** card:

1. Select the CRM repository and release line plus the verified staging environment, and confirm **Target commit**.
2. Enter an unused tag, such as `v1.1.0`.
3. Review **Included issues** and **Omitted issues** to confirm scope.
4. Click **Copy commands**, run `git fetch` in your local CRM repo, then run the commands to create and push the tag.

![The publish panel identifies the commit, included and omitted issues, and tag commands (shown with a sample project).](/assets/guides/studio/publish.png)

Wait in the **Releases** tab below for Studio to detect the tag and confirm a deployable archive or image artifact is attached. **A tag is not an artifact**: tag-triggered CI builds and uploads it automatically; otherwise, set up tag-triggered CI or have a local Coding Agent check out the tag, run `pnpm build --tar`, and upload the artifact (see [Checks and CI](../../studio/configure/checks.md)).

**Step check**: The version points to the verified commit, includes the intended issues, and has an available artifact.

## Upgrade production and record its version

Click **Deployment guide** on the **Production** card, choose `v1.1.0`, and pick **Docker** or **Installer** for your server. Hand the prompt to a Coding Agent with server access and add:

```prompt
CRM is already running on this server, so treat this as an upgrade: back up the production database and persistent files first, preserve existing configuration and business data, and verify sign-in and page access after upgrading.
```

For manual steps, migrations, and rollback, see [Production delivery](../../studio/project/release.md). After upgrading, verify sign-in, historical records, new features, and role permissions in production.

Once verified, an authorized project lead clicks **Record deployment** on the **Production** card (or records it at the bottom of the guide) to log `v1.1.0`. The **Production** card updates to the new version, and the included completed issues move out of **Pending release** (recording does not trigger deployment).

**Done when**: Production and Studio's record agree, shipped issues leave **Pending release**, new features work, and existing business data stays intact.

## Summary and next steps

You have completed the full Studio collaboration cycle—from connecting an existing repository, involving business colleagues, capturing knowledge, and managing delivery quality to shipping a production release. Turn post-release feedback into new issues to start the next iteration.

Choose where to go next based on your goal:

- **Build more business features**: Explore [Topic tutorials](../core-capabilities/index.md) and pick the Core capabilities you need—such as data modeling, permissions, approvals, files, notifications, or email.
- **Refine release and operations workflows**: Read Studio's [Releases overview](../../studio/release/overview.md) for environment approvals and artifact pipelines, or Core's [Publish application releases](../../core/deployment/publish-app-release.md) for production upgrades, backups, and rollback details.
