---
title: Production delivery
description: Deploy on your own infrastructure and record the version running in production.
---

Select a project in **Releases** and open **Deployment guide** from the production card. Project leads can choose a version and get deployment commands or a prompt for a Coding Agent.

![Get production deployment instructions and record the delivered version](https://static-docs.nocobase.com/studio-en-guide-production-guide-20261031.png)

## Prepare and deploy

Confirm that the version has an available artifact. The guide provides initial installation or upgrade steps based on the recorded version.

| Method | Target prerequisites | Deployment |
| --- | --- | --- |
| Docker | Docker and Compose | Build an image from the artifact or pull a registered image, then start the application |
| Installer | Node.js 24 and PM2 | Install or upgrade with `@nocobase/app-installer` |

Build and deploy production images on your own infrastructure. Your team maintains production configuration, databases, and secrets. Back up the database before upgrades, then verify sign-in and key business flows.

For automation, give the guide to a Coding Agent with access to the target server. Studio does not execute production deployment.

## Record the production version

After verifying deployment, record the version at the bottom of the guide or use the version's production-recording action. Studio calculates which completed tasks are now in production.

Recording confirms the team's deployment result; it does not trigger deployment.

## Roll back

Restore the previous image or use the installer rollback on your production infrastructure. If an upgrade migrated the database, restore the corresponding backup as needed. Verify the application, then record the restored version in Studio.
