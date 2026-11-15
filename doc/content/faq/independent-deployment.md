---
title: "Can developed applications be deployed and run independently?"
---

Yes. A business application built on Core can run on your own servers after deployment. Everyday business requests do not pass through Studio. Using Studio for development does not require running the production application inside Studio.

## Docker and PM2 deployment

Build a Docker image from your application's source, or install a deployment archive with app-installer and manage the Node.js process with PM2. Choose according to your team's container or server operations practices; see [Choose a deployment method](../core/deployment/choose-a-deployment-method.md).

Both paths cover initial deployment and updates: [Deploy with Docker](../core/tutorials/deploy-with-docker.md) and [Deploy with PM2](../core/tutorials/deploy-with-app-installer.md). Build and runtime environments must meet the application's version, operating system, and CPU architecture requirements.

## Production configuration and persistent data

Prepare separate production configuration, a database, stable keys, and file storage. Build artifacts do not automatically carry the development database, uploaded files, or runtime secrets. Transfer any data you need separately. Business data in persistent storage should remain usable after recreating a container or replacing the application.

External services also need production configuration. Business AI, for example, needs an available model service and access credentials. Independent operation does not mean every feature is free of external dependencies.

## Updates and maintenance

After changing and testing the source, rebuild and update using the original deployment method. Back up data before release, then verify existing data, user permissions, and key business operations. See [Release a new application version](../core/deployment/publish-app-release.md).

Rolling back the application does not automatically undo database changes. See [Backup, recovery, and data migration](backup-and-migration.md) for backup scope and recovery requirements.
