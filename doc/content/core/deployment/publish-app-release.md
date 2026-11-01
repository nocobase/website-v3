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

Switching Docker images does not undo migrations or business writes. App-installer rollback can select an old release. By default, recorded SQLite backups are restored only under conditions such as the corresponding update having applied migration/seed tasks or checksum repairs; inspect the returned plan.

For data recovery, stop the service, prepare code matching the backup and restore the database, files, configuration and stable keys before starting. Configuration snapshots exist, but rollback does not automatically restore all configuration, files or external databases. Coordinate recovery points for external databases and object storage.

Verify sign-in, old records, permissions, files and writes afterward. Rehearse on an isolated copy and agree on discarded later writes before recovering the real environment.

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

Inspect the rollback plan and confirm the release, SQLite restore and loss of later writes before proceeding:
```bash
npx --yes @nocobase/app-installer@0.1.0-beta.10 rollback --dir /srv/nocobase/my-app --json
# After accepting the recovery point and any loss of later writes:
npx --yes @nocobase/app-installer@0.1.0-beta.10 rollback --dir /srv/nocobase/my-app --yes --json
```

External database restoration uses that database's tools. For coordinated recovery, first `pm2 stop nocobase-my-app`, restore the matching database, files and configuration, and use the installer to select a matching release. Check status before reopening access. Do not manually alter `current` or delete pending state. See [Maintenance and troubleshooting](maintenance-and-troubleshooting.md) for backups.

> [!NOTE]
> Local SQLite checks covered a new test migration, explicit rollback, failed-startup recovery and offline storage restore. Framework upgrades, external databases and object storage still require their own recovery rehearsal.
