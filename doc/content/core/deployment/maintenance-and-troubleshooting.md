---
title: Maintenance and troubleshooting
description: Check runtime health, change configuration, back up data and use evidence to diagnose and verify fixes with an Agent.
---

## Have the Agent check application health

Provide the server, deployment method, application directory and process or Compose project name. Ask the Agent to inspect health, process restarts, resources, disk space, migrations and errors. Initial diagnosis can be read-only.

```prompt
Check why the app at <server and deployment directory> is slow, without changing anything yet. It started at <time> and affects <page or operation>. Use runtime state and logs to explain the cause and recommend a fix.
```

Check both from the server and the real access network to distinguish application failures from proxy, DNS, certificate or network problems.

## Change configuration and restart

State the setting, target environment and allowed restart time. Save the previous configuration and check environment overrides first. Origin excludes the base path. Key changes affect sign-in and encrypted data; follow the [configuration reference](../reference/configuration.md).

Recreate Docker containers after replacing a configuration file or changing environment variables. Restart alone does not apply a new container environment, and a single-file bind mount can still reference the previous file. PM2 installations keep `app.env` and `config.yml` in the installation root. Restart only this app under the same account and check for stale PM2 environment overrides. Verify public access and business operations afterward.

## Back up data and check restore capability

Choose backup frequency from acceptable data loss and downtime. Cover databases, uploads or object storage, configuration and stable keys. Images and archives alone are insufficient. Record version, recovery point, scope and digest, keeping backups in a separate restricted location.

For an offline SQLite backup, stop this app and other writers and retain the database and WAL/SHM files. Do not copy actively written database files. Use consistent backup tools for external databases and coordinate associated files to the same recovery point.

Have the Agent restore into an isolated directory and port, verify sign-in, records, permissions and files, and record recovery time. Installer update snapshots do not replace scheduled backups. See [Updates and recovery](publish-app-release.md) for boundaries.

## Describe the failure and provide clues

Supply the time and timezone, URL, failing operation, error or request identifier, affected users and recent release or configuration changes. Share redacted logs from that period, excluding passwords, cookies, keys and complete configuration.

```prompt
Since <time and timezone>, <operation> at <URL> returns <error>, affecting <users>. The latest change was <change>. Use these logs to diagnose it and propose a fix first. Do not reset data or reinstall.
```

## Confirm the fix and verify the result

Before execution, agree on the evidence for the cause, scope, downtime, data impact and recovery method. For a port conflict, identify its owner without stopping unrelated apps. Do not bypass migration errors by resetting data.

Repeat the original failing operation, then check sign-in, permissions, existing data and related features. If restarting, check persistence. Record the fix, actual results and any cause still unconfirmed.

## Common commands and log locations

Run in the original deployment directory, replacing project or process names:
```bash
docker compose -p my-app ps
docker compose -p my-app logs --tail=100 app
pm2 describe nocobase-my-app
pm2 logs nocobase-my-app --lines 100 --nostream
npx --yes @nocobase/app-installer@0.1.0-beta.10 status --dir /srv/nocobase/my-app --json
```

| Location or symptom | Check |
| --- | --- |
| Docker output | Compose logs; host configuration is `config/config.yml`, persistent data is `storage/` |
| PM2 installation root | `app.env`, `config.yml`, `logs/`, `storage/`, `backups/`; describe shows PM2 output paths |
| Health endpoint | `curl --fail http://127.0.0.1:13000/shop/api/healthz` should return `ok: true`; check the public URL too |
| Missing bind source / EACCES | Confirm paths are on the Docker server and UID 1000 has appropriate access |
| START_FAILED / unhealthy | Inspect startup, database and migration errors before repeatedly starting |
| REMOTE_STATE_UNKNOWN | Run status with the same SSH arguments to establish whether remote work is still running |

After Docker configuration changes, use `docker compose -p my-app up -d --force-recreate --wait --wait-timeout 180`. For PM2, use `pm2 restart nocobase-my-app`.

This offline backup covers default local configuration and storage only. Prepare restricted `/safe/backup` first and back up external storage separately. Run in the original Docker deployment directory:
```bash
docker compose -p my-app stop app
tar -czf /safe/backup/my-app-before-update.tar.gz config storage compose.yml
docker compose -p my-app start app
```

For PM2, first `pm2 stop nocobase-my-app`, then run `tar -czf /safe/backup/my-app-before-update.tar.gz config.yml app.env storage` in the installation root, and `pm2 restart nocobase-my-app` afterward. Include custom database and file directories too. Backups contain private information; keep them out of commits and public reports.
