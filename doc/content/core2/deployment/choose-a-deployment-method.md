---
title: Choose a deployment method
description: Choose Docker or PM2 (app-installer) to deploy a production application independently, and prepare runtime configuration, persistent data and later updates.
---

Once your application is developed and tested, you can deploy it independently to production on your own server with Docker or PM2. Docker runs the application in a container; PM2 supervises the Node.js process, while app-installer handles installation and updates.

This section applies to your own NocoBase Core applications. Both guides use the task application from [Build your first app](../tutorials/build-your-first-app.md) as the example, and each provides a **With an Agent** path and a **Without an Agent** path.

## How to choose

| Method | Suitable when | Guide |
| --- | --- | --- |
| Docker | You run the application in containers and manage deployment through images and persistent mounts | [Deploy with Docker](../tutorials/deploy-with-docker.md) |
| PM2 (app-installer) | You run the Node.js process directly on a Linux server and use app-installer to install deployment archives, manage configuration and update | [Deploy with PM2 (app-installer)](../tutorials/deploy-with-app-installer.md) |

Choose Docker if you already have a container operations workflow; choose PM2 (app-installer) if you want to supervise the Node.js process directly on the server. Both methods use separate production configuration, a database and file storage. Decide the target platform, database and storage plan before building; each guide describes its preparation steps.

## What to prepare before deploying

- **Buildable source**: the application passes its tests, dependencies and the lockfile are settled, and the build platform matches the runtime environment.
- **A defined runtime environment**: decide the server, application directory, ports, access URL and required permissions; configure domains, HTTPS and reverse proxies for the actual environment.
- **Separate runtime configuration**: prepare the configuration for the database, the administrator and the services the application needs, keep the generated secrets safe, and never commit configuration containing secrets to the repository.
- **Persistent data**: confirm where the database and file storage live, and set up backup and recovery.

Build output includes pages, APIs, migrations and runtime dependencies, but does not automatically carry the development database, uploaded files or runtime secrets. When a new database is used for the first time, migrations and required seeds run. The current getting-started example initializes its task roles, but does not copy tasks, team users or role assignments from the development environment, and other roles and grants created through administration pages are not migrated automatically either. If you need to keep that data, arrange a separate data migration.

Running `node dist/server/standalone.js` directly checks whether the build output works; a production deployment also needs process supervision, configuration management and data persistence.

## Initial deployment and new releases

| Initial deployment | New release |
| --- | --- |
| Prepare the deployment directory and production runtime configuration | Reuse the existing application and deployment directory, keeping stable secrets |
| Run migrations and required initialization on a new database, or migrate existing data according to a plan | Back up existing data, review and run new migrations |
| Verify sign-in, business features, permissions and data persistence | Verify new features, existing data and existing permissions together |

For later business releases, change the source, pass the tests, rebuild, and update through the original deployment method. Each deployment guide has a "Publish a new release" section, and [Publish an application release](publish-app-release.md) summarizes how the two methods differ when updating.

To update the framework and related dependencies, first complete [Upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md) and verify compatibility, then deploy.

## Checks and recovery after a release

After deploying, check the actual access URL, sign-in, reads and writes in the main business flows, ordinary users' permissions, and whether data survives a restart. A successful build, a successful upload or a passing health check cannot replace business verification on its own.

Before releasing, keep the previous build, its matching configuration, and restorable backups of the database and files. Rolling back the program does not automatically undo database migrations or business writes; if the old program cannot use the new schema, restore matching data and deal with writes made after the backup. Follow the guide for your chosen method for the specific update and recovery steps.
