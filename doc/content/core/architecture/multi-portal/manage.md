---
title: Manage portals
metaDescription: Install and uninstall portals, handle dependencies and failed operations, and understand upgrades with the host app.
---

Sign in as an administrator with `unrestricted` access and open **System settings → Portal management**. The page lists registered portals, with search, installation filters, and actions to install, enter or uninstall.

Management operates code already included in the app; it is not a store that downloads packages from npm. Adding source requires Client/Server registration and a development restart, or a rebuild and deployment in production.

## Install a portal

1. Find an uninstalled portal and select **Install**.
2. Wait for dependency checks, migrations and seeds on required connections, and resource startup.
3. Confirm the installed state before entering.

Generated portals start uninstalled. Configure required connections and drivers, and install declared portal dependencies first. Generating source or registering the package alone does not activate it.

A portal is unavailable during installation. Incomplete database tasks or startup failure do not produce an installed portal.

## Uninstall and reinstall

Uninstallation closes entry points and stops registered resources while retaining business data, configuration records and migration history. It does not remove source, npm dependencies or business databases.

Resolve installed dependent portals first; the system blocks unsafe uninstallation. Check whether other business processes still use the portal before confirming.

Reinstallation uses execution history to apply outstanding database tasks and retains existing data. Do not delete historical migrations or edit executed migrations to force a fresh start.

## Interpret states and recover from failure

| State | Meaning and action |
| --- | --- |
| Uninstalled | Registered code is not yet available for use |
| Installing / upgrading | Dependency checks, database tasks or startup are in progress; wait |
| Installed | Activated and accessible according to permissions |
| Uninstalling | Resource cleanup is in progress; wait |
| Failed | Inspect the failed stage and server logs, fix the cause and retry |

Failures can occur during dependency checks, database initialization, startup or shutdown. For database failures, check connection settings, database permissions and migration/seed execution. For startup or shutdown failures, inspect services and cleanup. Resources acquired in `start(onStop)` should register cleanup functions.

Multi-connection installation may complete only some tasks. Retry follows each connection's history rather than guaranteeing rollback across all successful connections. Restart also attempts recovery of admitted unfinished operations. Do not manually change installation state or delete history to skip failures.

If another administrator changes the portal, refresh to get the latest state before deciding what to do; do not repeatedly submit stale state.

## Upgrade with the app

Portals do not select independent runtime versions. Their code builds, releases and upgrades with the host app. Installed portals participate in pending database upgrades at app startup or `pnpm nocobase db apply`; uninstalled portals are not automatically installed.

For startup execution, enable the relevant migration and seed `autoRun` settings on each connection. If executing an explicit database plan, include the complete set of tasks the portal requires. A failed upgrade leaves the portal unavailable until the cause is resolved.

Retain historical migration and seed sources even for uninstalled portals, for validation and reinstallation. Verify upgrade paths and back up business data before release. Follow [Publish an app release](../../deployment/publish-app-release.md) and [Upgrade NocoBase](../../developing-apps/upgrade-nocobase-core.md) for app and template updates.
