---
title: Updates and recovery
description: Agree on updates, backups and downtime with an Agent, verify existing data, and recover code and data within their supported boundaries.
---

## Provide the update target and existing deployment

<a id="with-an-agent"></a>

Provide the target commit, existing server, Compose project and directory or app-installer installation directory, current version, database and file locations.

```prompt
Release <target commit> to <existing server and deployment directory>, continuing with <Docker or app-installer>. Preserve data, configuration and keys. First inspect changes, backup needs and downtime, then show me the update and recovery plan. Wait for my confirmation before proceeding.
```

An application release is separate from a framework upgrade. For dependency changes, first [upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md) and verify compatibility in development.

## Confirm changes, backups and downtime

Review code, configuration, migration and required seed changes. Retain old artifacts and digests. Applied migrations are history: investigate checksum differences before repair, without rewriting history or clearing the database.

Agree on the write freeze, acceptable recovery point, backup location and recovery owner. Database, files, configuration and stable keys must form a recoverable set. Use the database's own tools for external databases and separately back up files and object storage.

During updates, app-installer stops the app and backs up configuration-declared SQLite databases and related journal files, `config.yml` and `app.env`. It does not back up uploads or external databases. `--backup-done` only acknowledges that external backups are complete.

## Have the Agent perform the update

Have the Agent validate configuration, migration dry runs and historical checksums before following the agreed downtime plan. Docker uses a new image tag with existing mounts; app-installer uses upgrade against the original directory, or deploy over SSH.

Installer preflight returns `CONFIRMATION_REQUIRED` for an update while the old app keeps running. Add the installer's `--yes` only after reviewing the plan. Identical archives return `success-noop`. Do not regenerate configuration or keys or treat an update as a new installation.

## Verify new features and existing data

Check the running version and health, then sign in at the original URL. Use previously recorded IDs to check existing data, files and permissions, and exercise the new feature. For schema changes, check old records and new fields.

Repeat after a restart or container recreation in rehearsal. Ask the Agent for source revision, archive or image digest, migration results and actual business checks.

## Assess recovery after an update fails

Stop new business writes and preserve the error, logs and current state. Identify the running release, committed migrations, installer pending operations and available backups.

The installer attempts to return to the old release after failure; this can also fail. Investigate pending state or unhealthy service before retrying. Depending on old-code compatibility with current data, choose to fix the new release, roll back code only, or restore coordinated backups. Agree on what happens to writes made after the backup.

## Roll back the app and restore data

Switching Docker images does not undo migrations or business writes. For an **installer snapshot rollback**, inspect the returned plan: app-installer may restore its pre-update SQLite snapshot, then switches the release and starts the app. Files, configuration and external databases are not restored together. Even `--no-restore` starts the app; it is not an offline release selector.

For a **coordinated backup restore**, block external access and stop the app and other writers. First unpack the archive matching the selected recovery point into a separate recovery directory. Keep both services stopped while restoring the database, uploads, configuration and stable keys as one set. Adjust directory-specific paths, check configuration and migration plans offline, then start only the recovered app. Do not run installer rollback after restoring your chosen database: it can overwrite that recovery point and start the app too early.

Verify sign-in, selected records, permissions, uploaded bytes, configuration and writes before reopening access. Rehearse on an isolated copy and agree on discarded later writes. Coordinate external database and object-storage recovery points too.

## Manual update and recovery reference

<a id="without-an-agent"></a>

Retain the old archive, then rebuild from source:
```bash
pnpm build --target linux-x64 --node-version 24 --tar
sha256sum storage/exports/dist.tar.gz
```

**Docker**: build and transfer a new image tag. After backing up, change `image` in the original Compose directory. Run the first three checks below and review the changes before the final startup command:
```bash
docker compose -p my-app run --rm --no-deps app node dist/cli/index.js config check --connect
docker compose -p my-app run --rm --no-deps app node dist/cli/index.js db apply --dry-run --json
docker compose -p my-app run --rm --no-deps app node dist/cli/index.js db repair --dry-run --json
docker compose -p my-app up -d --wait --wait-timeout 180
```

For code rollback, restore the old image tag and start only if it supports the current database. For data recovery, first run `docker compose -p my-app stop app`, restore the coordinated backup to the original mounts with correct permissions, then use the matching image with `up -d --wait`.

**PM2**: copy the new archive to `/tmp/my-app-new.tar.gz` on the server. Use the same service account for preflight, then proceed after backups and downtime are approved:
```bash
npx --yes @nocobase/app-installer@0.1.0-beta.10 upgrade \
  --dir /srv/nocobase/my-app --archive /tmp/my-app-new.tar.gz --json
# After reviewing the plan and completing backups:
npx --yes @nocobase/app-installer@0.1.0-beta.10 upgrade \
  --dir /srv/nocobase/my-app --archive /tmp/my-app-new.tar.gz --yes --json
```

For SSH, use `deploy --ssh deploy@server --dir /srv/nocobase/my-app --archive <local-new-archive>` without repeating first-install origin, port, name or `--set` options.

**Installer snapshot rollback**: use this only when its recovery point is the one you intend and current files and configuration remain compatible with it. Otherwise use a coordinated backup restore. Block public access first. Inspect the release, SQLite restore and loss of later writes before proceeding; the confirmed command starts the app:
```bash
npx --yes @nocobase/app-installer@0.1.0-beta.10 rollback --dir /srv/nocobase/my-app --json
# After accepting the recovery point and any loss of later writes:
npx --yes @nocobase/app-installer@0.1.0-beta.10 rollback --dir /srv/nocobase/my-app --yes --json
```

**Coordinated backup restore**: beta.10 has no offline rollback flag. Use a separate directory with the matching archive; do not switch a managed installation after restoring selected data.

1. Block public access and run `pm2 stop nocobase-my-app`. Stop other writers, including workers using the same database or storage.
2. Create a new recovery directory owned by the service account. Unpack the matching archive first, then restore the selected backup's `config.yml`, `app.env` and complete `storage/`. Restore any external stores to the same recovery point. Keep both apps stopped throughout.
3. In the recovered `app.env`, point `APP_CONFIG_FILE` and `APP_STORAGE_DIR` at the recovery directory. Review other absolute paths and environment overrides, retaining the backed-up keys and business settings. Use a separate loopback port for rehearsal.
4. From the recovery directory, validate configuration and inspect both database dry runs below. Resolve unexpected migrations or checksum changes before starting; do not apply them to make an incompatible backup load. Only then run the PM2 start command.

The matching release archive and selected backup are separate files. With the original service stopped, prepare the new directory as the service account:
```bash
mkdir /srv/nocobase/my-app-recovery
tar -xzf /tmp/my-app-matching.tar.gz -C /srv/nocobase/my-app-recovery
tar -xzf /safe/backup/my-app-selected.tar.gz -C /srv/nocobase/my-app-recovery
```

After adjusting the restored `app.env` paths and environment overrides, enter the recovery directory and check before starting:
```bash
cd /srv/nocobase/my-app-recovery
node --env-file=./app.env dist/cli/index.js config check --connect
node --env-file=./app.env dist/cli/index.js db apply --dry-run --json
node --env-file=./app.env dist/cli/index.js db repair --dry-run --json
pm2 start node --name nocobase-my-app-recovery --interpreter none \
  --cwd /srv/nocobase/my-app-recovery --kill-timeout 60000 -- \
  --env-file=/srv/nocobase/my-app-recovery/app.env ./dist/server/standalone.js
```

This recovery directory is a standalone deployment, not an app-installer installation. Check health, native sign-in, records, upload metadata and downloaded bytes, configuration and permissions, then reopen access. Plan any later return to installer management separately. Do not alter the old `current` link or pending state. See [Maintenance and troubleshooting](maintenance-and-troubleshooting.md) for backups.

> [!NOTE]
> Local SQLite checks covered a new test migration, installer rollback, failed-startup recovery, and a coordinated restore of records, native uploads and configuration. Framework upgrades, external databases and object storage still require their own recovery rehearsal.
