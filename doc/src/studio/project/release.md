---
title: Approve releases and roll back
description: Approving a release is one of the key decisions people make. After a merge, CI deploys the code to staging, and every deployment to a protected environment such as production needs an approver's sign-off. If something goes wrong, you can roll back to the previous version.
---

Admins set up the deploy environments and decide who approves in [Deploy environments](../admin/environments.md). To connect CI, see [Connect CI](../setup/ci.md).

## How a release goes

Take the Supplier Management project, with CI connected:

1. Once an issue is accepted and its PR merged, CI deploys the default branch to staging, and the issue shows "Staging ✓ b64c3bd".
2. Create a version tag such as `v1.4.0`, and CI builds that version and deploys it to production.
3. Production is protected, so the deployment becomes a deployment request in the approver's inbox.
4. Once the approver approves it, it goes to production, and the issue shows "Production ✓ 1.4.0".

**Releases** on the project overview shows which version runs in each environment, the commit it came from, who deployed it and who approved it, and any requests still waiting for approval.

## What the approver does

The deployment request appears under **To decide** in the approver's inbox, with:

- The app and the environment.
- The version to deploy and the commit it came from.
- The tag or branch CI built it from, and the CI log.
- Who started it: a person, an agent, or CI.

Open the request and check it. To approve, type the app ID once more to confirm, and the deployment starts right away. It deploys exactly the version in the request, and a newer version that turns up later won't replace it. If you don't agree, reject the request.

Nobody can approve a request they started themselves. Agents can't approve deployments or deploy straight to a protected environment.

> [!WARNING] Back up before you deploy
> Studio doesn't back up the app's database before deploying. Back up your production database regularly yourself, for example by running `pg_dump` on a schedule or using your database service's own backups.

## Roll back

If you find a problem after deploying, open the app in **Releases › Apps**, pick an earlier successful deployment from its history, and roll back to that version. On a protected environment, a rollback also becomes a deployment request for the approver.

After a rollback, Studio checks whether each issue's changes are still live:

- Issues whose changes are no longer in the deployed version have their deployment marks withdrawn, for example "Withdrawn with 1.3.0".
- For issues that were done but whose changes were rolled back, the person who rolled back gets a suggestion to reopen them, which they can take or ignore.

Issue statuses don't change on their own. A person decides whether to reopen them.

## Merged, not released

**Merged, not released** on the project overview lists issues that are done but whose changes haven't reached production yet. The project lead is notified each time one of these issues is completed. When you're getting ready to release a new version, look here to see what this release will include.
