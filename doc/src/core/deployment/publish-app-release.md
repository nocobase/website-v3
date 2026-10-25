---
title: Publish an application release
description: Rebuild after changing your code, then update the existing application using its original deployment method.
---

Publishing a new application release means rebuilding your updated code and deploying it to the existing application. Keep the database, runtime configuration and file storage. The application URL usually stays the same.

## With an agent

Tell the Agent where the application runs and how it is deployed. For example:

```text
Please deploy the current application's new version to the existing server using Docker.
The deployment directory is /srv/nocobase/tasks. Keep the existing data and configuration, back up before updating, and check the app afterward.
```

For app-installer, provide the server and installation directory. For Studio, identify the application and target environment.

## Without an agent

Finish your code changes and tests, then rebuild and publish using the original deployment method. The main differences are:

| Deployment method | How to update |
| --- | --- |
| [Docker](../tutorials/deploy-with-docker.md#publish-a-new-release) | Build an image with a new tag, update the image reference in Compose, and recreate the container while keeping the original configuration and storage mounts. |
| [app-installer](../tutorials/deploy-with-app-installer.md#publish-a-new-release) | Build a new deployment archive and run `upgrade` against the existing installation directory. For remote deployment from your development machine, continue using `deploy --ssh`. |
| [Studio](../tutorials/deploy-to-studio.md#publish-a-new-release) | Upload or build a new release in the same application, then deploy it to the existing environment. |

See “Publish a new release” in each deployment guide for commands.

If the database structure changes, include new migrations with the code and retain previously applied migrations. Back up the database and files and keep the previous archive or image before updating. Switching back to old code does not necessarily restore the database.

After updating, check that the app is accessible, existing data and permissions are preserved, and the new feature works. To upgrade framework dependencies, first follow [Upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md), then deploy using the same process.
