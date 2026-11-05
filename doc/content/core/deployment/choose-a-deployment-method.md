---
title: Deployment overview
description: Prepare a deployment, choose Docker or PM2 with an Agent, agree on data retention and verify the result.
---

## What to prepare before deployment

<a id="prepare-for-deployment"></a>

Prepare tested application source, its lockfile and the commit to release. The Agent needs the application's `AGENTS.md` and synchronized `nocobase-deployment` Skill. Installing dependencies in the app synchronizes Skills; run `pnpm nocobase skills sync` if they are missing.

Provide server access, OS and CPU details, a writable directory, free port and user-facing URL. Arrange the domain, HTTPS, reverse proxy, database and file storage accounts. Supply passwords through secure input or environment variables, outside prompts and source control.

The command examples use the beta.85 template's [Product Catalog](https://github.com/nocobase/docs-examples-v3/blob/51658852e7290b0ed3c0735d2856681850560efb/apps/product-catalog/README.md) on Linux x64/glibc, Node.js 24 and single-instance SQLite. Build your own app for its actual platform and installed database driver.

## Ask an Agent to choose a deployment method

<a id="choose-a-method"></a>

In the application source directory, describe your environment and operations preferences:

```prompt
Deploy this app to my server. It runs <OS and CPU>, users will access <URL>, and we currently manage applications with <containers or a process manager>. Compare Docker and PM2 maintenance requirements and recommend a method, including anything we need to prepare first.
```

| Method | What you manage | Guide |
| --- | --- | --- |
| Docker | Images, Compose, configuration and data mounts | [Deploy with Docker](deploy-with-docker.md) |
| PM2 | Node.js, service account and processes; app-installer manages installation and updates | [Deploy with PM2](deploy-with-pm2.md) |

## Agree on the target and data retention

<a id="initial-deployment-and-subsequent-releases"></a>

Identify whether this is a first install, update or migration, with one explicit server, application directory and target version. Starting with an empty database and moving existing data are separate operations.

Builds contain code, dependencies, migrations and required initialization logic. They do not contain development databases, uploads, user-configured roles or runtime secrets. Agree on database and file locations, data to migrate, backup time and acceptable data loss. Updates retain existing data and stable keys without reinitializing them.

## What to confirm after deployment

<a id="verify-and-recover"></a>

Use the actual URL to check sign-in, page refresh, static assets and representative business reads and writes. Verify ordinary users' permissions. Exercise file operations and WebSocket features when used.

Restart the process or recreate the container, then check the same record, files and permissions. Ask the Agent for the version and artifact digest, data locations, verification results and unfinished work. These checks are still needed after health checks pass.

Continue with [Updates and recovery](publish-app-release.md) or [Maintenance and troubleshooting](maintenance-and-troubleshooting.md). For framework dependency changes, first [upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md) in development, then release the application.
