---
title: Release to production
metaDescription: Verify the CRM changes in staging, check release scope, upgrade your own production server, and record its actual version.
lesson: 19
---

Quote revision comparison and customer handover are merged. Verify their combined behavior in staging, then release them to your production environment, retaining the same CRM repository and business records.

Studio's **Releases** has four stages: **Preview** verifies PRs, **Staging** verifies merged application code, **Release** tracks Git tags and artifacts, and **Production** records the version confirmed by your team. Studio can host previews and staging applications; production deployment runs on your infrastructure.

![The CRM release page shows four delivery stages and where pending issues have reached.](/assets/guides/studio/releases.png)

## Deploy to staging and verify business flows

Open **Releases** in the CRM project and click **Deployment guide** on **Staging**. Use a separate app ID such as `crm-staging` and select an existing staging environment.

Copy the prompt for a local Agent to build and upload the artifact, or use **Connect CI** to update staging after every merge. See [Hosted environments](../studio/admin/environments.md) for environment preparation and [Checks and CI](../studio/configure/checks.md) for builds and reporting.

![The staging guide offers Agent upload, CI setup, and manual commands.](/assets/guides/studio/staging-guide.png)

Check the commit actually running in staging. Ask Morgan to use separate test data to inspect existing customers and historical quotes, create and compare a new revision, and transfer a customer while checking both owners' permissions. Preserve earlier functionality. If the application already uses approvals, notifications, or email, check those integrations too.

**Step check**: Staging runs the candidate commit, new and existing flows pass, and failures are fixed or explicitly excluded from the release scope.

## Check pending issues

**Pending release** shows completed issues not yet delivered to production. **In staging** means a change has reached staging; **Not deployed yet** means it has not. Verify that quote comparison and customer handover belong to the candidate commit. An issue being **Done** is not enough.

Check dependent changes together. If a required issue is missing, update staging and verify again rather than release an untested latest commit from the default branch.

## Configure a release line

Under **Settings → Code repositories → Release lines**, configure the release tag pattern, such as `v*`. Retain an existing team convention where applicable; patterns for multiple release lines must not overlap. See [Versions and releases](../studio/release/versions.md).

A tutorial source tag such as `lesson-N` identifies a learning stage. A production tag such as `v1.1.0` identifies an application release. Changing course tags does not upgrade production.

## Publish a version

Click **How to publish** on the **Release** card:

1. Select the CRM repository and release line.
2. Select the verified staging environment and check **Target commit**.
3. Enter an unused tag, such as `v1.1.0`.
4. Review **Included issues** and **Omitted issues**.
5. Copy the generated commands and create and push the tag from your CRM repository.

![The publish panel identifies the commit, included and omitted issues, and tag commands.](/assets/guides/studio/publish.png)

Wait for Studio to detect the tag and verify that a deployable archive or image is available. A tag is not an artifact: your pipeline or Agent must build and upload one. Publishing a version is also not production deployment; update the production record afterward.

**Step check**: The version points to the verified commit, includes the intended issues, and has an available deployment artifact.

## Upgrade production and record its version

Open **Production → Deployment guide**, select the intended version, and choose **Docker** or **Installer** to match the existing environment. When handing the instructions to a Coding Agent with server access, explain that CRM is already installed and requires an upgrade preserving configuration and business data.

Back up the database and persistent files, and confirm migration and recovery procedures before upgrading. Afterward, test sign-in, existing customers and quote history, revision comparison, and handover permissions. See [Production delivery](../studio/project/release.md). If rollback is necessary, handle application code and database recovery according to that version's compatibility requirements.

After verification, an authorized project lead records the version actually deployed. Recording does not deploy anything or replace runtime checks.

**Done when**: Production and Studio's record agree, Morgan can use the new features, and existing records are intact. Turn subsequent feedback into another CRM issue for the next iteration.
