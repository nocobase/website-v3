# Deployment documentation verification

The five guides share an Agent-led workflow in English, Simplified Chinese and Japanese. Local PM2 installation, updates and SQLite recovery were exercised against a fixed application baseline. Docker execution remains unverified in this environment because neither the Docker executable nor a daemon socket is available.

## Verified behavior

| Scenario | Observed result |
| --- | --- |
| Fresh archive installation | app-installer returned success and started the app under an isolated PM2 home, on loopback with a separate directory and port. |
| Native authentication and business operations | Administrator sign-in, product creation, publication, protected reads and public catalog rendering passed; anonymous management access returned 401. |
| Process restart | The same password, product ID, price and publication state remained usable after restarting only the test process. |
| Identical archive | upgrade returned `success-noop`. |
| Update preflight | Returned `CONFIRMATION_REQUIRED` without confirmation; the old app continued serving the original product. |
| Update with a migration | Confirmed upgrade applied one new migration; the new physical table existed and the original product and native login remained usable. |
| Explicit rollback | Preflight required confirmation. Confirmed rollback restored the old release and SQLite backup: the original product remained, the added table disappeared and a record written after the backup returned 404. |
| File recovery boundary | A synthetic file under `storage/files/` retained its post-backup contents after installer rollback. Uploaded files require a separate backup. |
| Offline storage restore | With the process stopped, a storage archive restored the changed synthetic file. Existing configuration and keys were retained; native login and the original product passed afterward. |
| Failed startup after migration | A test-only release deliberately threw during server startup. The installer returned `UPGRADE_ROLLED_BACK` (exit 3), reported database restoration, and returned to the old healthy release with no pending operation. |
| After failed-update recovery | Native login, the original product, anonymous rejection and catalog rendering passed; the added table was absent. |
| Authorization tests | The two existing real-application suites passed: 7 tests covering explicit grants, record scopes, revocation and assignment safety. This is separate from deployed-process recovery checks. |

The initial storage test used a synthetic file. The coordinated restore fixture below additionally covers actual native File Repository uploads and downloads over HTTP. No file contents, configuration, passwords, cookies or database backups are included in the delivery.

## Coordinated restore verification

The reusable [recovery fixture](fixtures/verify-coordinated-recovery.mjs) exercises a selected backup that differs from the installer's rollback snapshot. [Sanitized results](fixtures/coordinated-recovery-results.json) contain assertions, versions and artifact digests, without credentials, database contents or private deployment paths.

| Recovery point | Database, upload and configuration state |
| --- | --- |
| A: installer pre-update snapshot | Product A and uploaded file A; configuration marker A |
| B: selected complete backup after one migration | Products A/B, uploaded files A/B and configuration marker B |
| C: changes after that backup | A further product/upload and configuration marker C |

- Installer rollback restored SQLite to A and removed product B, while configuration remained at C. This reproduces why that operation cannot follow a restore to B.
- The original process was stopped before matching release B was unpacked into a separate directory. Both HTTP listeners remained unavailable at every restore/check checkpoint; no installer operation ran after the selected backup was restored.
- The complete B backup restored the database, native File Repository upload metadata and bytes, configuration and stable keys. Only directory paths and the loopback address changed for the isolated target.
- Offline checks passed before startup. Native login, product B, both uploaded downloads and configuration marker B passed afterward; product/upload C were absent and anonymous downloads returned 401.
- The recovered PM2 process retained the configuration marker and uploaded bytes after restart. This directory is a standalone recovery deployment, not an app-installer installation.

The fixture adds authenticated test-only file routes and two migrations to temporary copies of the fixed archive. The real File Repository handles multipart uploads, metadata and streamed downloads. The example checkout and all installed dependencies remain unchanged.

To repeat with Node 24 on Linux x64/glibc, prepare a private task-local tools prefix and a **new** working directory. Install the two pinned tools into that prefix with `npm install --prefix <tools-prefix> @nocobase/app-installer@0.1.0-beta.10 pm2@6.0.14`, then run from the website repository:

```bash
node doc/notes/fixtures/verify-coordinated-recovery.mjs \
  ../docs-examples-v3/apps/product-catalog/storage/exports/dist.tar.gz \
  <tools-prefix> <new-private-workdir>
```

Use the baseline archive digest recorded below. The fixture creates its own PM2 home, free loopback ports, generated native-login credentials and test files; it stops only its own PM2 daemon afterward. Private backups and stderr stay in the private work directory. Publish only `results.json`, never the backup archives or configuration.

## Documentation checks

| Check | Result |
| --- | --- |
| `pnpm doc:test` | 8 suites, 50 tests passed. |
| `pnpm doc:build` | Passed, including menu/language parity and generated-site link and anchor checks. |
| Independent `findDeadLinks('doc/dist')` | 0 dead internal links, assets or fragments. |
| Legacy fragments | All 84 previous heading anchors across the 12 existing pages retained. Moved update/troubleshooting anchors lead to links to their new guide. |
| Outline and languages | Five articles per language, with 4 / 6 / 6 / 7 / 6 second-level headings, in the approved order. Equivalent command blocks use the same pinned installer and example paths. |
| Preview HTTP | The local preview served the deployment overview successfully. |
| Browser preview | Unverified: Chromium could not launch because `libatk-1.0.so.0` is missing. No screenshot or visual pass is claimed. |
| Git whitespace | `git diff --check` passed. |

## Unverified environments

- Docker source/prebuilt image builds, Compose startup, container recreation, image update and Docker restore: no Docker CLI or daemon socket is present. These commands were checked against the pinned Dockerfile and prior source documentation; rehearse them on a Docker host before relying on this revision for a release.
- SSH transfer, remote account PATH, public DNS, HTTPS, reverse proxy and WebSocket forwarding: only loopback deployment was available. Public access still needs target-environment checks.
- External databases, object storage and coordinated point-in-time recovery: the runtime used SQLite and a local file fixture. The installer does not provide external backup/restore.
- Browser upload/download UI and permission-grant persistence through rollback: no deployed browser scenario was run. Native HTTP upload/download recovery is covered by the coordinated restore fixture; server authorization suites passed separately.
- ARM64, musl, multiple instances, host reboot recovery, key rotation, checksum-repair authorization and interruption of an installer operation were not exercised.
- The coordinated recovery directory uses manual PM2 supervision; returning it to app-installer management was not tested.
- Framework or template upgrades were not tested. Update fixtures retained the baseline dependencies and added a test migration; they are not evidence of cross-version compatibility.

## Chapter mapping

The canonical page URLs remain unchanged except for the added maintenance page. Each language has the same page paths and menu structure.

| Previous page or section | Current destination |
| --- | --- |
| `deployment/choose-a-deployment-method`: choosing, prerequisites, first install/update, verification | Deployment overview: prepare → choose with an Agent → identify target and data → verify |
| `tutorials/deploy-with-docker`: prerequisites and Agent request | Docker preparation, deployment request and plan confirmation |
| Docker manual build/configuration/Compose/start/persistence sections | Docker final manual reference; business-specific checks link to the fixed example README |
| `tutorials/deploy-with-app-installer`: prerequisites and Agent request | PM2 preparation, request, directory/configuration confirmation and Agent installation |
| PM2 manual build/local/SSH install/status/restart sections | PM2 final manual reference; process supervision and boot recovery remain explicit |
| `deployment/publish-app-release` and both deployment guides' update sections | Updates and recovery: target → changes/backup/downtime → update → verify |
| PM2 failure and rollback | Updates and recovery: failure assessment → code rollback/data recovery → manual reference |
| Troubleshooting, logs and configuration restarts in deployment guides | Maintenance and troubleshooting |
| Planned runtime configuration and secrets | Deployment prerequisites; maintenance configuration/restart section |
| Planned data directories and persistence | Overview data plan; Docker mounts; PM2 installation layout and persistence |
| Planned upgrade and rollback | Updates and recovery |
| Planned backup and restore | Updates and recovery; maintenance backup and restore rehearsal |
| Planned logs and troubleshooting | Maintenance diagnosis and command/log reference |
| Planned monitoring and health checks | Deployment acceptance; maintenance runtime checks |
| Core upgrade | Unchanged `developing-apps/upgrade-nocobase-core` URL, registered under Developing apps, linked from release guidance |
| Incoming tutorial and overview links | Updated in all three languages to current page titles and canonical manual/update targets |

## Source evidence

| Source | What was checked |
| --- | --- |
| [Product Catalog at the fixed example commit](https://github.com/nocobase/docs-examples-v3/tree/51658852e7290b0ed3c0735d2856681850560efb/apps/product-catalog) | Template metadata, lockfile, app instructions, native authentication, business checks and compiled application |
| [Dockerfile at that commit](https://github.com/nocobase/docs-examples-v3/blob/51658852e7290b0ed3c0735d2856681850560efb/apps/product-catalog/Dockerfile) | Source/prebuilt paths, target/Node/glibc/relocatable checks, node UID, config/storage paths, health check |
| `@nocobase/app-skills@0.1.0-beta.55`, synchronized `nocobase-deployment/SKILL.md` | Authorized target, data plan, artifact/configuration requirements, business and persistence verification. Skill requirements are distinct from executed tests. |
| `@nocobase/app-installer@0.1.0-beta.10`, `dist/commands/{install,upgrade,rollback,status}.js` | Actual lifecycle, confirmation, no-op, release switching, failure handling and result contract |
| Same installer, `dist/lib/{backup,errors,service}.js` | SQLite inventory and journals, configuration snapshots, uploads/external exclusions, exit 3 versus failed rollback exit 4, PM2 integration |

## Details

- Date: 2026-11-01 UTC. Website baseline: `da3472a82e946cb7acd0e285b2ecc100af336d4a`; examples baseline: `51658852e7290b0ed3c0735d2856681850560efb`.
- Runtime: Linux x64/glibc, Node `24.22.2` (ABI 137), pnpm `11.7.0`, SQLite via `better-sqlite3@13.0.3`, locally installed PM2 `6.0.14`, app-installer `0.1.0-beta.10`.
- Application template `1.0.0-beta.85`; CLI `1.0.0-beta.30`; server `3.0.0-beta.5`; client `4.0.0-beta.5`; db `1.0.0-beta.24`; authentication `2.0.0-beta.16`; authorization `1.0.0-beta.33`; Skills `0.1.0-beta.55`. Source and deployed runtime versions were compared; no dependency upgrade was performed.
- Preparation: `pnpm install` in website-v3; `pnpm install --frozen-lockfile` in Product Catalog, including Skills synchronization; `pnpm build --target linux-x64 --node-version 24 --tar` in that application.
- Original application archive SHA-256: `e6e5faef86eaa26649aafaaa3cc21385cab36807360d7499c58e44e05338e5eb`.
- Tests used a task-local tools prefix, independent `PM2_HOME`, private temporary installation roots, loopback ports and generated test-only credentials supplied through environment variables. No production or management application was deployed or accessed through HTTP.
- Two temporary artifact variants retained the original package versions: one added a `recoveryProbe` collection migration (physical table `recovery_probe`) with valid source/artifact manifest hashes; another also threw at the standalone server entry. These were test fixtures, not product changes or published artifacts.
- Final successful fixture archive SHA-256 values: migration `7c33901e1f45a9c0048b13da6c5be70c90a553f8eaba447b18906584a0d286c1`; failing-startup `013e920c25b019779a86499a37f3d161ad87b6cfa81a7c3f8b44e4b5518365c2`.
- Runtime sequence: `install`, `status`, native sign-in and product create/publish/read, `pm2 restart`, identical-archive `upgrade`, new-archive preflight and confirmed `upgrade`, preflight and confirmed `rollback`, stopped storage backup/restore, then confirmed failed-startup `upgrade` and post-recovery checks.
- Permission checks: `pnpm exec vitest run tests/server/catalog.test.ts tests/server/authorization-assignment-safety.test.ts`.
- The initial update test fixture lacked a migration manifest entry; the normal preflight refused it. The fixture was corrected without bypassing checks. Harness assertions were corrected to use physical snake_case table names and the documented rolled-back exit code 3. HTTP connections were explicitly closed to avoid reusing a stale connection across synchronous child processes.
