---
title: Install Studio
description: Deploy Studio on a Linux server with Docker Compose.
---

## Prerequisites

- A Linux server with Docker and Docker Compose that can reach the image registry, npm, and your Git hosting platform.
- A domain name that resolves to the server. The steps below use `studio.example.com`.
- An account for the image registry provided by NocoBase.

If you want Claude Code or Codex to deploy it for you, skip to [Let an agent deploy it](#let-an-agent-deploy-it).

## Deploy

1. Log in to the image registry and create the deployment directory:

   ```bash
   docker login pkg-v3.nocobase.com
   sudo mkdir -p /opt/studio/storage && cd /opt/studio
   sudo chown 1000:1000 storage   # the container runs as UID 1000 and must be able to write to this directory
   ```

2. Copy the configuration template out of the image and save it as `config.yml`. You do not need to edit it: the environment variables in the next step override its secret key, admin account, public address, and language.

   ```bash
   docker run --rm pkg-v3.nocobase.com/nocobase/studio:latest cat /app/config.example.yml > config.yml
   ```

3. Generate `.env`, replacing the domain with your own:

   ```bash
   cat > .env <<EOF
   APP_PUBLIC_ORIGIN=https://studio.example.com
   APP_DEFAULT_LOCALE=en-US
   SECRETS_KEYS=1:$(openssl rand -hex 32)
   INITIAL_ADMIN_USERNAME=admin
   INITIAL_ADMIN_EMAIL=admin@example.com
   INITIAL_ADMIN_PASSWORD=$(openssl rand -hex 12)
   EOF
   chmod 600 .env
   ```

4. Create `compose.yaml`:

   ```yaml
   services:
     studio:
       image: pkg-v3.nocobase.com/nocobase/studio:latest
       restart: unless-stopped
       env_file: .env
       ports:
         - "127.0.0.1:13000:13000"
       volumes:
         - ./config.yml:/app/config.yml
         - ./storage:/app/storage
   ```

5. Start it and wait until the `STATUS` column shows `healthy`:

   ```bash
   docker compose up -d
   docker compose ps
   ```

6. Set up HTTPS: use a reverse proxy to forward the domain to `127.0.0.1:13000`, and forward WebSocket too. With Caddy, add this to your `Caddyfile`:

   ```text
   studio.example.com {
       reverse_proxy 127.0.0.1:13000
   }
   ```

   With Nginx, add the `Upgrade` and `Connection` request headers for `/main/ws`.

> [!WARNING] Keep SECRETS_KEYS safe
> Saved Git credentials and API keys are encrypted with it. If you lose it, those credentials can no longer be decrypted. If you replace it, everyone is signed out. Back up `.env` together with the data.

## Check the installation

Open `https://studio.example.com/main/` and sign in with the admin account from `.env`.

The `/main` in the address is required. The Studio address you enter later when adding a runtime or signing in to `nb-studio` is this full address, including `/main`.

After you sign in, follow the [Quickstart](quickstart.md) to add a runtime and agents.

## Let an agent deploy it

Give the prompt below to Claude Code or Codex, replacing the server address and the domain.

```prompt
Please SSH into <server address> and deploy NocoBase Studio with Docker Compose. It will be served at https://studio.example.com/main/.

- Image: pkg-v3.nocobase.com/nocobase/studio:latest. I will provide the image registry account separately.
- The container listens on port 13000. Mount the configuration file at /app/config.yml, copied from /app/config.example.yml in the image. Mount the data directory /app/storage from the host, owned by UID 1000.
- Environment variables: APP_PUBLIC_ORIGIN=https://studio.example.com, APP_DEFAULT_LOCALE=en-US, SECRETS_KEYS=1:<generate with openssl rand -hex 32>, plus INITIAL_ADMIN_USERNAME, INITIAL_ADMIN_EMAIL, and a randomly generated INITIAL_ADMIN_PASSWORD. Put them in a .env file with permissions 600, and keep them out of the command history and logs.
- First check the containers, Docker networks, and reverse proxy already on the server, and do not affect other services. If a reverse proxy already exists, plug into it. If not, use Caddy to provide HTTPS. Forward WebSocket as well.

When finished, confirm that the container status is healthy, that https://studio.example.com/main/ opens and I can sign in with the admin account, and that the data is still there after restarting the container. Tell me where the deployment directory is, and where the admin password and SECRETS_KEYS are stored.
```

## Environment variables

| Variable | Description |
| --- | --- |
| `APP_PUBLIC_ORIGIN` | The address browsers use to reach Studio, without a path. Callbacks from Git hosting platforms and all generated links use it. |
| `SECRETS_KEYS` | The master key, in the format `1:<key>`. If it is not set, the placeholder key in the `config.yml` template is rejected and Studio will not start. |
| `APP_DEFAULT_LOCALE` | The default language. Set it to `en-US` for an English interface and preset labels. |
| `INITIAL_ADMIN_USERNAME`<br>`INITIAL_ADMIN_EMAIL`<br>`INITIAL_ADMIN_PASSWORD` | The first administrator. It is created only on the first start, when there are no users yet. Changing these later does not change existing accounts. |
| `APP_BASE_PATH` | The access path. Defaults to `/main`. |

## Data and backups

All of Studio's data is in `/opt/studio/storage`, including the database file `database.sqlite`. Together with `config.yml` and `.env`, the whole of `/opt/studio` is everything you need to back up:

```bash
cd /opt/studio
docker compose stop
sudo tar czf /backup/studio-$(date +%F).tar.gz .
docker compose start
```

The backup contains `.env` and therefore the master key, so store it the way you store passwords.

## Use PostgreSQL

Studio uses SQLite by default. To use PostgreSQL instead, add the connection details to `.env` before the first start:

```bash
DB_DIALECT=postgres
DB_HOST=db.internal
DB_PORT=5432
DB_DATABASE=studio
DB_USERNAME=studio
DB_PASSWORD=<database password>
```

If you switch after Studio has started, existing data is not migrated. With PostgreSQL, back up the database separately.

## Upgrade

Back up first, then pull the new image and restart. Database migrations run automatically at startup.

```bash
cd /opt/studio
docker compose pull
docker compose up -d
```

## FAQ

**The domain opens but there is no sign-in page.** The address must include `/main/`, for example `https://studio.example.com/main/`.

**The container will not start or keeps restarting.** Run `docker compose logs studio` to see why. Common causes: `SECRETS_KEYS` is missing from `.env` or is not in the format `1:<key>`; the `storage` directory is not owned by UID 1000; or `config.yml` was not copied out before starting, so Docker created a directory with that name. Delete it and redo step 2.
