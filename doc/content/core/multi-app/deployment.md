---
title: Deployment and operations
description: Deploy the platform and App Host, configure public entry points, and manage artifacts, persistence, upgrades, and recovery.
---

Platform artifacts, child template artifacts, and instance data are separate. Deploying the platform does not publish every child, and publishing a template does not upgrade instances.

## Deploy the platform and App Host

Prepare the [three commercial plugins](overview.md) and compatible dependencies, then determine the destination OS, CPU architecture, and Node.js runtime. Select a Releases environment that actually supports the artifact. Do not treat the example's single Host as a cluster scheduler.

Build the platform using the [application deployment](../deployment/publish-app-release.md) workflow. For Linux x64 and Node.js 24, run in the platform directory:

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

Before deployment, configure the database, persistent storage, private settings, and process manager. Explicitly enable and configure App Host through Releases. Plugin registration alone does not start it. Check the environment and deploy a real child to verify execution.

Production runs the built platform, not `pnpm demo` as a generic launcher. That command publishes example templates, provisions instances, and grants demo memberships. Children produce their own archives and are released through [template and instance management](management.md).

## Configure domains, HTTPS, and application paths

The example serves the platform at `/main/` and managed instances at `/<appId>/`. Configure the proxy for the actual deployment, preserving protocol, Host, cookies, and WebSocket upgrades. Restrict access to internal control ports.

| Setting | Check |
| --- | --- |
| `APP_PUBLIC_ORIGIN` | Public origin, without a path |
| `APP_BASE_PATH` | Current application's mount prefix |
| Environment public URL pattern | Actual instance address; the example uses `{appId}` |
| `PLATFORM_URL` | Navigation entry for returning to the platform |
| `PLATFORM_SSO_ISSUER` | Identity issuer tied to callbacks and account bindings |

URL patterns generate addresses; they do not configure DNS, TLS, or routing. Inspect persisted environment settings rather than source defaults alone.

Enable secure cookie policies for HTTPS and configure real trusted origins. Do not reuse the demonstration's non-Secure cookie policy or weaken TLS, callback, or CSRF checks to work around login failures.

Choose stable domains before provisioning and user sign-in. A domain change is coordinated maintenance across platform origin, environment URLs, callbacks, child variables, and existing identity bindings. See [Single sign-on](single-sign-on.md).

## Manage artifacts, persistent data, and keys

The example uses these storage locations; deployed paths depend on effective configuration:

| Content | Example path |
| --- | --- |
| Platform archive | `storage/exports/dist.tar.gz` |
| Uploaded artifacts | `storage/artifacts/` |
| Releases runtime state | `storage/releases/` |
| Host instance code | `storage/host/revisions/<appId>/<checksum>/` |
| Host instance data and private configuration | `storage/host/volumes/<appId>/` |

Instance volumes are not disposable build caches. Include external databases and object stores in backups when applications use them.

Keep encryption keys and required signing configuration stable and back them up securely. Deliver instance client secrets through secret variables, not source, archives, logs, or browser configuration. A database backup without the keys needed to decrypt saved secrets may not be recoverable.

## Release upgrades and restore backups

For every upgrade, record source revision, artifact version and checksum, destination environment, and instance ID. Check recoverability and migration compatibility, then upgrade only the explicitly selected instances.

Coordinate backups across the platform database, child databases, files, private settings, keys, required artifacts, and deployment state. Quiesce writers and jobs or use a suitable database-consistent backup method. Copying a live SQLite file while it is being written is not sufficient evidence of a complete backup.

Restore with matching code and configuration, one owner for writes, and the intended stopped/running states. Restoring an archive status does not restore historical database contents. Older artifacts may not support data after newer migrations.

After upgrade or restore, verify assets, sign-in, business reads/writes, attachments, and permissions through the real public entry. Restart to check persistence. For selective upgrades, also inspect an untouched instance.

## Troubleshoot deployment, login, and access

| Symptom | Check first |
| --- | --- |
| Provisioning request accepted but application unavailable | Operation and deployment status, pending approval, Host checks, and runtime logs |
| Current and target versions differ | Deployment completion and migration errors; target does not prove running version |
| Page opens but assets or APIs return 404 | Mount prefix, proxy rules, and hard-coded instance paths |
| `Discovery fetch failed` or `Provider skipped` | Issuer discovery reachability from the child server; restart after fixing it to reinitialize |
| Platform login still ends in denial | Explicit membership, client settings, callbacks, and instance state |
| Application absent from workbench or switcher | Membership, running state, unfinished deployments, or disabled external entry |
| Child immediately signs in again after logout | Whether logout lands at `/login?signedOut=1` without automatic SSO |
| Operation times out with unknown result | Retain operation/deployment IDs and reconcile the existing effect before retrying |

Platform, Host, and child logs cover different stages. Record failure time, instance ID, and operation ID without exposing secrets, cookies, or administrator passwords. See [Manage templates and instances](management.md) for operation recovery and [Migrate a single application](migration.md) for identity changes.

Independent service failures and restoration remain the external deployment owner's responsibility. Disabling a platform entry neither stops that service nor creates a backup.
