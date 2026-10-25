---
title: Install Studio
description: Studio runs on your own servers. Use Docker Compose to deploy Studio and its PostgreSQL database on a Linux server, then sign in as the first administrator.
---

## What you need

| What | Requirements |
| --- | --- |
| A server | Linux with Docker and Docker Compose. The image supports amd64 and arm64 |
| A NocoBase Pro token | For signing in to the private registry `pkg-v3.nocobase.com` |
| A domain and HTTPS | For real use, put Studio behind a reverse proxy such as Caddy or Nginx on your own domain. Code host callbacks, browser push, and links in emails all need HTTPS and a stable address |
| Network access | The server can reach `pkg-v3.nocobase.com` and the image layer download address you receive with your token, and can pull the PostgreSQL image |
| Optional | An SMTP mailbox for invitations, password resets, and email notifications; object storage; Redis, needed only when you run more than one instance |

## Sign in to the registry

Use `nocobase` as the username and your token as the password. Pass the token through standard input so it stays out of your command history:

```bash
echo "<YOUR_TOKEN>" | docker login pkg-v3.nocobase.com -u nocobase --password-stdin
```

`Login Succeeded` means you're in.

The available versions are listed on the [image versions page](https://pkg-v3.nocobase.com/-/images/nocobase/studio), which doesn't need a sign-in. In production, pin an exact version such as `1.0.0-beta.61` so deployments are stable and repeatable. The `latest` and `beta` tags move with each new release. The steps below use `<version>` in its place.

## Deploy

1. Create a deployment directory and copy the configuration template out of the image. Studio needs this file to start and exits right away without it.

   ```bash
   mkdir studio && cd studio
   mkdir storage && sudo chown 1000:1000 storage   # the container runs as UID 1000 and must be able to write here
   docker run --rm --entrypoint cat pkg-v3.nocobase.com/nocobase/studio:<version> /app/config.example.yml > config.yml
   ```

2. Edit `config.yml` in two places. The interface is in English unless you set another language. If your team works in another language, set it at the top of the file, for example `zh-CN` for Chinese:

   ```yaml
   i18n:
     defaultLocale: zh-CN
   ```

   Under `auth`, add `disableSignUp: true` to `emailAndPassword`. This turns off self sign-up, so members join only when an admin invites them:

   ```yaml
   auth:
     emailAndPassword:
       enabled: true
       autoSignIn: false
       disableSignUp: true
   ```

   If you leave sign-up on, anyone who reaches the sign-in page can create an account.

3. Create `.env`, which holds the encryption key, the first administrator's password, and the database password. Replace the address with your domain:

   ```bash
   cat > .env <<EOF
   STUDIO_SECRET_KEY=$(openssl rand -hex 32)
   INITIAL_ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=')
   DB_PASSWORD=$(openssl rand -hex 16)
   APP_PUBLIC_ORIGIN=https://studio.example.com
   EOF
   chmod 600 .env
   ```

4. Create `docker-compose.yml`:

   ```yaml
   services:
     studio:
       image: pkg-v3.nocobase.com/nocobase/studio:<version>
       restart: unless-stopped
       depends_on:
         postgres:
           condition: service_healthy
       ports:
         - "13000:13000"
       environment:
         # The public address, used for sign-in callbacks and links in emails
         APP_PUBLIC_ORIGIN: ${APP_PUBLIC_ORIGIN:-http://localhost:13000}
         # The encryption key. Never change it after deployment
         SECRETS_KEYS: 1:${STUDIO_SECRET_KEY:?set STUDIO_SECRET_KEY in .env}
         # The administrator created on first start
         INITIAL_ADMIN_USERNAME: nocobase
         INITIAL_ADMIN_EMAIL: ${INITIAL_ADMIN_EMAIL:-admin@nocobase.com}
         INITIAL_ADMIN_PASSWORD: ${INITIAL_ADMIN_PASSWORD:?set INITIAL_ADMIN_PASSWORD in .env}
         DB_DIALECT: postgres
         DB_HOST: postgres
         DB_PORT: 5432
         DB_DATABASE: studio
         DB_USERNAME: studio
         DB_PASSWORD: ${DB_PASSWORD:?set DB_PASSWORD in .env}
       volumes:
         - ./config.yml:/app/config.yml:ro
         - ./storage:/app/storage

     postgres:
       image: postgres:16
       restart: unless-stopped
       environment:
         POSTGRES_DB: studio
         POSTGRES_USER: studio
         POSTGRES_PASSWORD: ${DB_PASSWORD:?set DB_PASSWORD in .env}
       volumes:
         - ./postgres:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U studio -d studio"]
         interval: 5s
         timeout: 5s
         retries: 10
   ```

5. Start it:

   ```bash
   docker compose up -d
   docker compose ps
   ```

   Studio is up when `studio` shows `healthy`, usually within a minute. On first start it creates its tables and initial data automatically.

> [!WARNING] Keep the encryption key safe
> `STUDIO_SECRET_KEY` in `.env` encrypts saved Git credentials, API keys, and other secrets. Never change it after deployment: if you change it, everyone is signed out, and if you lose it, those credentials can't be decrypted again. Back up `.env` with your data and store it the way you store passwords.

## Sign in

Open `https://studio.example.com/main/`. If you haven't set up a domain yet, open `http://<server address>:13000/main/`.

- Username: `nocobase`
- Password: `INITIAL_ADMIN_PASSWORD` in `.env`. Run `grep INITIAL_ADMIN_PASSWORD .env` to see it

Once you're in, open **Account settings › Account and security** from the account menu at the top right and change the password.

Don't drop `/main` from the address. When you add runtimes or sign in to `nb-studio` later, the Studio address you use is this full address with `/main`.

**Done when**: you can sign in as the first administrator, the interface is in your team's language, and the sign-in page has no **Sign up** link. Next, [connect Git](git.md).

## Set up HTTPS

Point a reverse proxy at Studio's port 13000, and forward WebSockets too. With Caddy, add this to your `Caddyfile`:

```text
studio.example.com {
    reverse_proxy 127.0.0.1:13000
}
```

If the reverse proxy runs on the same server as Studio, change the port in `docker-compose.yml` to `"127.0.0.1:13000:13000"` so only the proxy can reach it. Make sure `APP_PUBLIC_ORIGIN` in `.env` is the public HTTPS address, then run `docker compose up -d` again.

## Let an agent deploy it

You can also give the prompt below to Claude Code or Codex and let it sign in to the server and deploy. Replace the server address, domain, and version, and give it the token separately:

```prompt
Sign in to <server address> over SSH and use Docker Compose to deploy NocoBase Studio and PostgreSQL at https://studio.example.com/main/.

- Image: pkg-v3.nocobase.com/nocobase/studio:<version>. First sign in to the registry with the NocoBase Pro token I give you, username nocobase, passing the token through standard input.
- Copy the configuration file from /app/config.example.yml in the image and mount it at /app/config.yml. If the team works in a language other than English, set i18n.defaultLocale to <interface language, such as zh-CN>. Set disableSignUp: true under auth.emailAndPassword.
- Mount the data directory /app/storage on the host, owned by UID 1000.
- Generate the encryption key, the first administrator's password, and the database password at random, and write them to an .env file with permissions 600. Keep them out of the command history and the logs.
- Check the existing containers, Docker networks, and reverse proxies on the server first, and don't affect other services. If there is already a reverse proxy, use it. If not, use Caddy for HTTPS, and forward WebSockets too.

When you're done, confirm that the studio container is healthy, https://studio.example.com/main/ opens, you can sign in as nocobase, the interface language is right, the sign-in page has no sign-up link, and the data survives a container restart. Tell me where the deployment directory is and where the administrator password and encryption key are stored.
```

## Upgrade and back up

To upgrade, back up first, change the version in `docker-compose.yml` to the new one, and run:

```bash
docker compose pull
docker compose up -d
```

Database migrations run automatically on start. To roll back, restore the database backup from before the upgrade first, then change the version back. Upgrade Studio first, and runners upgrade themselves when they're idle.

Back up the PostgreSQL database (for example with `pg_dump -Fc`, or by copying the `postgres` directory while Studio is stopped), `config.yml`, `.env`, and the `storage` directory. See [Upgrade and backup](../admin/upgrade-and-backup.md).

## Troubleshooting

**`docker login` or `docker pull` says unauthorized.** The token is wrong, or it isn't licensed for this image. Make sure you copied the whole token with no extra spaces, and sign in again.

**`docker pull` returns 403 and says the version was released after your license's update period.** Use a version from within the period, or renew and pull again.

**Pulling `postgres:16` times out.** The server can't reach Docker Hub. Set up a registry mirror for Docker, or use an existing PostgreSQL: remove the `postgres` service and `depends_on` from `docker-compose.yml`, and point `DB_HOST` and the other settings at your database.

**Downloading image layers hangs or times out.** The firewall or proxy is blocking the image layer download address you received with your token. If Docker needs a proxy, configure it for the Docker service itself. Setting `HTTP_PROXY` in your terminal has no effect on `docker pull`.

**The address doesn't show the sign-in page.** Include `/main/` in the address.

**The container won't start or keeps restarting.** Run `docker compose logs studio` to see why. Common causes: `config.yml` wasn't copied out first, so Docker created a directory with that name (delete it and redo step 1), or the `storage` directory isn't owned by UID 1000.
