---
title: Choose a deployment method
description: Deploy a production application independently with Docker or PM2 (app-installer), with separate runtime configuration, persistent data, and subsequent updates.
---

After developing and testing your application, deploy it independently to production on your own server with Docker or PM2. Docker runs the application in a container. PM2 supervises the Node.js process, while app-installer handles installation and updates.

This section applies to your own NocoBase Core applications. Both guides use the task application from [Build your first app](../tutorials/build-your-first-feature.md) as a worked example and provide **With an agent** and **Without an agent** paths.

## Choose a method

| Method | Suitable when | Guide |
| --- | --- | --- |
| Docker | You run containers and manage images and persistent mounts | [Deploy with Docker](../tutorials/deploy-with-docker.md) |
| PM2 (app-installer) | You run Node.js processes on a Linux server and use app-installer to install archives, manage configuration, and update the application | [Deploy with PM2 (app-installer)](../tutorials/deploy-with-app-installer.md) |

Choose Docker if you already operate containers, or PM2 (app-installer) to supervise a Node.js process directly on the server. Both methods use separate production configuration, a database, and file storage. Establish the target platform, database, and storage plan before building; each guide describes its prerequisites.

## Prepare for deployment

- **Buildable source**: tests pass, dependencies and the lockfile are established, and the build target matches the runtime environment.
- **An identified environment**: confirm the server, application directory, ports, access URL, and permissions. Configure domains, HTTPS, and reverse proxies for that environment.
- **Separate runtime configuration**: prepare database, administrator, and service settings. Retain generated secrets and keep secret-bearing configuration out of the repository.
- **Persistent data**: identify database and file storage locations and establish backup and recovery procedures.

Build output includes pages, APIs, migrations, and runtime dependencies. It does not automatically include the development database, uploaded files, or runtime secrets. A new database runs migrations and required seeds. The current getting-started example initializes its task roles but does not copy development tasks, team users, or role assignments. Other roles and grants created through administration pages also require a separate data migration if they must be retained.

Running `node dist/server/standalone.js` can check a build artifact. A deployment also needs process supervision, configuration management, and persistent data storage.

## Initial deployment and subsequent releases

| Initial deployment | Subsequent release |
| --- | --- |
| Prepare the deployment directory and production runtime configuration | Reuse the application and deployment directory, preserving stable secrets |
| Run migrations and required initialization on a new database, or migrate existing data according to a plan | Back up existing data, review and apply new migrations |
| Verify sign-in, business behavior, permissions, and persistence | Verify new behavior, retained data, and existing permissions together |

For subsequent business releases, change source, test, rebuild, and update through the original deployment method. Each guide includes a “Publish a new release” section. [Publish an application release](publish-app-release.md) summarizes the differences between the two update methods.

To update the framework and related dependencies, first follow [Upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md), verify compatibility, then deploy.

## Verify and recover

After deployment, check the actual application URL, sign-in, core business reads and writes, ordinary-user permissions, and persistence after restart. A successful build, upload, or health check alone does not prove these behaviors.

Before publishing, retain the previous build, matching configuration, and restorable database and file backups. Rolling back program code does not automatically undo migrations or business writes. If the previous runtime cannot use the new schema, restore compatible data and account for writes made since the backup. Follow the chosen method's guide for update and recovery operations.
