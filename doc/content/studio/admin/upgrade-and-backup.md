---
title: Upgrades and backups
description: Back up and restore Studio, then update the server, runners, and CLI.
---

## Back up

Keep the database, configuration, encryption keys, and files together. These examples use Compose and PostgreSQL from the [Deployment guide](../setup/install.md).

| Content | What to preserve |
| --- | --- |
| Database | PostgreSQL dump or managed database backup |
| Configuration | `config.yml`, Compose file, and `.env` |
| Keys | Encryption keys used by `SECRETS_KEYS` and the push private key |
| Files | `storage` and object-storage files, skills, and artifacts |

Run from the deployment directory:

```bash
mkdir -p backup
docker compose exec -T postgres pg_dump -U studio -Fc studio   > "backup/studio-$(date +%F).dump"
```

Adjust the database user and name to your configuration. Pause writes during backup or use a snapshot method that keeps database and files consistent. Back up business application databases separately.

## Restore

1. Stop Studio and preserve a copy of its current data.
2. Restore configuration, keys, files, and database from the same backup point.
3. Start the image version corresponding to that backup.
4. Check sign-in, project tasks, file downloads, and Git connectivity.

Restore into a prepared empty database, for example:

```bash
docker compose exec -T postgres pg_restore -U studio -d studio   < backup/studio-backup.dump
```

For a database with existing data, follow your team's replacement procedure rather than adding backup records to it. The installation example passes `STUDIO_SECRET_KEY` into `SECRETS_KEYS`; preserve the same key during recovery.

## Upgrade Studio

1. Complete the backup and obtain the target image version.
2. Update `STUDIO_IMAGE` in the deployment configuration.
3. Pull the image and recreate the Studio container.

```bash
docker compose pull studio
docker compose up -d studio
docker compose ps
docker compose logs --tail=100 studio
```

Migrations run at startup. Check service health, sign-in, tasks, and runtimes. Studio is a commercial product; [contact us](https://www.nocobase.com/contact/) for the image.

Before returning to an older image, check database compatibility. If migrations must be rolled back, restore the pre-upgrade database and files, then start the matching old version.

## Update runners and the CLI

Runners can update automatically. You can also run these commands on the machine:

```bash
nocobase-runner update
nb-studio update
```

`nb-studio update` also updates installed skills. The runtime page identifies incompatible versions that need an update.
