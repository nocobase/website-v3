---
title: Publish an application release
description: Rebuild after changing your code, then update the existing application using its original deployment method.
---

Publishing a new application release means rebuilding verified code and updating the existing production application with Docker or PM2 (app-installer). Keep the production database, runtime configuration and file storage. The application URL usually stays the same.

## With an agent

Tell the Agent where the application runs and how it is deployed. For example:

```text
Please deploy the current application's new version to the existing server using Docker.
The deployment directory is /srv/nocobase/tasks. Keep the existing data and configuration, back up before updating, and check the app afterward.
```

For PM2 (app-installer), provide the server and existing installation directory so app-installer can update the application.

## Without an agent

Finish your code changes and tests, confirm the commit or version to release, then rebuild and publish using the original deployment method. The two methods differ as follows:

| Deployment method | How to update |
| --- | --- |
| [Docker](../tutorials/deploy-with-docker.md#publish-a-new-release) | Build an image with a new tag, update the image reference in Compose, and recreate the container while keeping the original configuration and storage mounts. |
| [PM2 (app-installer)](../tutorials/deploy-with-app-installer.md#publish-a-new-release) | Build a new deployment archive and run app-installer's `upgrade` against the existing installation directory. For remote deployment from your development machine, continue using `deploy --ssh`. |

See “Publish a new release” in each deployment guide for commands.

If the database structure changes, include new migrations with the code and retain previously applied migrations. Back up the database and files and keep the previous archive or image before updating. Switching back to old code does not necessarily restore the database.

After updating, check that the app is accessible, existing data and permissions are preserved, and the new feature works. To upgrade framework dependencies, first follow [Upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md), then deploy using the same process.
