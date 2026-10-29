---
title: Publish an application release
description: Rebuild after changing your code, then update the existing application with its original deployment method.
---

Publishing a new application release means rebuilding verified code and then updating the existing production application with Docker or PM2 (app-installer). The production database, runtime configuration and file storage stay in place, and the application's URL usually does not change.

## With an Agent

Tell the Agent where the existing application is deployed and which deployment method it uses, for example:

```text
Please deploy the current application's new version to the existing server using Docker.
The deployment directory is /srv/nocobase/tasks. Keep the existing data and configuration, back up before updating, and check the app afterward.
```

With PM2 (app-installer), provide the server and the existing installation directory, and let app-installer update the application.

## Without an Agent

First finish the code changes and tests and confirm the commit or version to release, then rebuild and publish with the original deployment method. The two methods differ mainly as follows:

| Deployment method | How to update |
| --- | --- |
| [Docker](../tutorials/deploy-with-docker.md#publish-a-new-release) | Build an image with a new tag, update the image version in Compose and recreate the container, keeping the original configuration and storage mounts. |
| [PM2 (app-installer)](../tutorials/deploy-with-app-installer.md#publish-a-new-release) | Build a new deployment archive and update the existing installation directory with app-installer's `upgrade`; when publishing remotely from a development machine, keep using `deploy --ssh`. |

For the specific commands, see "Publish a new release" in each deployment guide.

If the change touches the database structure, release the new migrations together with the code and keep the migrations that have already run. Before updating, back up the database and files and keep the previous deployment archive or image; switching back to old code does not necessarily restore the database.

After updating, check that the application is reachable, that existing data and permissions are preserved, and that the new feature works. To upgrade framework dependencies, first complete the upgrade and verification in [Upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md), then deploy with the same process.
