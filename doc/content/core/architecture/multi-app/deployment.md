---
title: Deployment and operations
description: Build and validate independent artifacts, configure HTTPS and persistence, and distinguish initialization, restart, and upgrades.
---

Main artifacts, Sub template artifacts, and instance data are different. Deploying Main does not publish Sub, and publishing a version does not upgrade instances.

## Use the deployment Skill to build and run independent artifacts

The workspace's `skills/nocobase-multi-app-deployment/SKILL.md` covers multi-app release and recovery. Each App's installed `nocobase-deployment` Skill covers standard Node.js/Docker deployment. Confirm commercial licensing, download access, compatible versions, and the destination OS, CPU, runtime, and native dependencies.

Build each App from the workspace root:

```bash
pnpm --dir=apps/sub build --tar
pnpm --dir=apps/main build --tar
```

Inspect the corresponding App's `build --help`, for example `pnpm --dir=apps/sub build --help`, for supported options. Build for the actual destination; do not execute a foreign-platform artifact locally.

Root `pnpm build` checks structure only. A complete build includes the `dist` production dependency installation. Workspace installation or emitted server/client files do not establish a complete archive. Production installation must also resolve and download commercial dependencies; temporary workspace overrides are not necessarily inherited. Stop release on missing packages or denied access, resolving authorized versions and build configuration rather than substituting fake plugins or another repository's dependencies.

Each App writes its own `storage/exports/dist.tar.gz`. Before release, extract outside source workspaces, run with the archive's own entry, dependencies, and configuration, and verify no module resolves through the original workspace. Check compiled migration manifests. Exclude runtime configuration, secrets, databases, uploads, and instance volumes. Keep commercial artifacts out of public CI artifacts/caches.

See [Application deployment](../../deployment/publish-app-release.md) for startup and process management. The source workspace's `apps/main/scripts/demo.mjs` is a helper, not an assumed requirement or file in the extracted artifact.

## Configure HTTPS, App Host, and persistence

Main uses `/main/`; managed instances have their own paths. The proxy must forward all application paths, preserve Host and HTTPS information, and support WebSocket upgrades. Public addresses do not configure DNS, certificates, or routing.

The template helper defaults Main to `127.0.0.1:13230` and the SSO-mode Host to private `127.0.0.1:13231`. Other deployments use effective settings. Do not expose internal control ports. Plugin registration alone does not enable the Host: configure Releases/Host explicitly, check the environment, and deploy a real instance.

| Setting                        | Verify                                                  |
| ------------------------------ | ------------------------------------------------------- |
| `APP_PUBLIC_ORIGIN`            | Current application's public origin without a path      |
| `APP_BASE_PATH`                | Current application's mount prefix                      |
| Environment public URL pattern | Actual instance entries; the example uses `{appId}`     |
| `PLATFORM_URL`                 | Navigation entry back to the platform                   |
| `PLATFORM_SSO_ISSUER`          | Identity issuer matching callbacks and account bindings |

Use Secure cookies and actual trusted origins over HTTPS. The helper's `sso` mode enables Secure cookies; HTTP local-account mode does not provide remote HTTP OIDC. Do not weaken TLS, callback, or CSRF checks.

These example paths are relative to Main's application root, `apps/main/`; effective deployment settings take precedence:

| Content                                      | Example path                                 |
| -------------------------------------------- | -------------------------------------------- |
| Main archive                                 | `storage/exports/dist.tar.gz`                |
| Uploaded artifacts                           | `storage/artifacts/`                         |
| Releases state                               | `storage/releases/`                          |
| Host instance code                           | `storage/host/revisions/<appId>/<checksum>/` |
| Host instance data and private configuration | `storage/host/volumes/<appId>/`              |

Persist Main's own database, files, configuration, and keys separately too. Instance volumes are not build caches. Include external databases/object stores in backups, preserve encryption keys and required signing configuration, and deliver client secrets through secret variables rather than browsers or logs.

## Distinguish initialization, ordinary restart, and selective upgrades

For first-time demonstration setup, use [Quickstart](quickstart.md)'s real Sub archive and explicit plan:

```bash
pnpm demo --initialize --plan "$PWD/demo-plan.json"
```

Supply the plan explicitly. Archive paths resolve relative to that file and versions must match the actual archives. One real version is enough; a second real version is needed only for upgrade testing. Initialization provisions missing instances while retaining existing selections, not resetting or upgrading them.

Later starts from the source workspace use `pnpm demo`. Ordinary install, dev, start, and demo do not perform this demonstration publication/provisioning. Production archives use their own entry, retaining configuration, keys, and data rather than reinitializing to restart.

Record source revision, artifact version/checksum, environment, and instance IDs for upgrades. Use [Template management](management.md) to select instances explicitly. Older artifacts may not support data after newer migrations; code rollback does not undo database changes.

## Back up, verify lifecycle behavior, and troubleshoot

Coordinate backups across Main/child databases, files, private configuration, keys, artifacts, and deployment state. Quiesce writers or use a database-consistent backup mechanism. Arbitrary copies of a live SQLite file are not complete backups. Restore matching code and data with one writer and the intended stopped/running states. Restoring archive status does not restore a database.

The Host included in final artifacts must support unregistering explicitly stopped instances. A source-check script cannot replace actual behavior checks:

- Verify assets, browser SSO, business reads/writes, attachments, and denied direct APIs through the real public entry.
- Compare two instances for isolation; upgrade only one and verify the other is unchanged.
- After explicit stop, requests must not wake the instance; explicit start must retain data.
- Requests after ordinary idle may wake according to Host policy, unlike explicit stop.
- After Main/Host restart, verify versions, membership, business data, and intended stopped states.

| Symptom                                         | Check first                                                                             |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| Commercial package missing during install/build | Registry, access, compatible version, and whether failure is in production installation |
| Provisioning accepted but instance unavailable  | Operation/deployment result, approval, environment checks, and Host logs                |
| Current and target versions differ              | Deployment/migration completion, not the target field alone                             |
| Asset or API 404                                | Proxy, mount prefix, and hard-coded instance paths                                      |
| Discovery or provider initialization failure    | Child-server network and trust chain to issuer; restart after repair                    |
| Denial after login or missing directory entry   | Membership, client, callback, runtime, and unfinished deployment                        |
| Immediate login after logout                    | Landing at `/login?signedOut=1` and waiting for user-initiated sign-in                  |
| Timeout with unknown result                     | Retain operation/deployment IDs and reconcile before retrying or clearing anything      |

Inspect Main, Host, and child logs separately. Record time and instance/operation IDs without secrets, cookies, or administrator passwords. See [Migration](migration.md) for identity changes. Independent applications retain their own failure and backup ownership.
