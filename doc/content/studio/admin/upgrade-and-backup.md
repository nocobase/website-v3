---
title: Upgrade and backup
description: Back up Studio's database, configuration, and files, upgrade to a new version and roll back if something goes wrong, and see how runtimes and the CLI get updated.
---

## Back up

All of Studio's data is in its deployment directory. Back up four things:

| What | Notes |
| --- | --- |
| The database | The PostgreSQL data. Export it with `pg_dump -Fc`, or copy the `postgres` directory while Studio is stopped |
| `.env` | The encryption key `STUDIO_SECRET_KEY` and other values. Lose it, and saved Git credentials and API keys can't be decrypted |
| `config.yml` | Studio's configuration, including the push private key if it's stored there |
| The `storage` directory | Uploaded files, logs, skill files, and more |

For example, to export the database every day:

```bash
cd studio
docker compose exec -T postgres pg_dump -U studio -Fc studio > backup/studio-$(date +%F).dump
```

Backups contain the encryption key, so store them the way you store passwords.

The databases of the business apps you deploy need their own backups. See [Deploy environments](environments.md).

## Restore from a backup

1. Stop Studio: `docker compose stop studio`.
2. Put back `.env`, `config.yml`, and the `storage` directory.
3. Restore the database, for example:

   ```bash
   docker compose exec -T postgres pg_restore -U studio -d studio --clean --if-exists < backup/studio-2026-10-25.dump
   ```

4. Start Studio with `docker compose start studio`, and check that you can sign in and your projects and issues are all there.

The encryption key in `.env` must be the same as when the backup was made. Otherwise saved credentials can't be decrypted and everyone has to sign in again.

## Upgrade

1. Back up first.
2. Change the image version in `docker-compose.yml` to the new one.
3. Pull and restart:

   ```bash
   docker compose pull
   docker compose up -d
   ```

4. Wait until `docker compose ps` shows `healthy`, then sign in to check.

Database migrations run automatically on start. The available versions are listed on the [image versions page](https://pkg-v3.nocobase.com/-/images/nocobase/studio).

> [!WARNING] Roll back together with the database
> The new version upgrades the database when it starts, so the old version may not be able to read it if you only change the image version back. To roll back, restore the database backup from before the upgrade first, then start the old version.

## Updating runtimes and the CLI

Upgrade Studio first, and runtimes and the CLI follow:

- **Runners** update themselves to the version Studio serves whenever no agent is running. To update right away, run `nocobase-runner update` on the machine. Runners too old to speak the current protocol are marked as needing an upgrade in **Agent management › Runtimes**.
- **nb-studio**: run `nb-studio update` to update to the version Studio serves, along with its installed skills. `nb-studio` also tells you when Studio has a newer version.
