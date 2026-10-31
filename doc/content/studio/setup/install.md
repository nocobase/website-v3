---
title: Deploy Studio
description: Deploy an empty Studio instance with Docker Compose, persist its data, and sign in as the administrator.
---

Studio is a commercial product. [Contact us](https://www.nocobase.com/contact/) for the image, available versions, and access authorization.

This guide deploys one Studio instance with PostgreSQL. You can use an existing database instead; see the [configuration reference](../reference/config.md).

## Prepare the environment

- A server with Docker and Docker Compose. The image supports Linux amd64 and arm64.
- The Studio image supplied to you. For an offline image archive, use `docker load -i <archive>`.
- A stable address. Use a domain and HTTPS for team access. For a local trial, `http://localhost:13000` is sufficient.

Coding tools run on a separate [runtime](shared-runtimes.md), connected later. A single instance does not require Redis. Before onboarding a team, prepare file and artifact storage, invitation email, and password reset email.

## Prepare configuration

Obtain the image following the delivery instructions. Set `STUDIO_IMAGE` to its complete name with an exact version:

```bash
export STUDIO_IMAGE='<supplied-image-name-and-version>'
mkdir studio
cd studio
mkdir storage
sudo chown 1000:1000 storage

docker run --rm --entrypoint cat "$STUDIO_IMAGE" \
  /app/config.example.yml > config.yml
```

The Studio container runs as UID 1000 and needs write access to `storage`.

Edit the matching sections in `config.yml` to disable self-registration. Keep the rest of the template and avoid duplicate YAML keys. The interface uses English by default.

```yaml
auth:
  passwordReset:
    enabled: false
  emailAndPassword:
    enabled: true
    autoSignIn: false
    disableSignUp: true
```

Generate `.env` with random encryption, administrator, and database secrets:

```bash
umask 077
cat > .env <<EOF
STUDIO_IMAGE=${STUDIO_IMAGE}
STUDIO_SECRET_KEY=$(openssl rand -hex 32)
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=$(openssl rand -hex 18)
DB_PASSWORD=$(openssl rand -hex 24)
APP_PUBLIC_ORIGIN=http://localhost:13000
EOF
```

Replace the administrator email with your own. `APP_PUBLIC_ORIGIN` contains the public scheme, host, and port, without `/main`.

> [!NOTE] Keep the encryption key
> `STUDIO_SECRET_KEY` encrypts credentials stored in Studio. Preserve it during restarts and upgrades, and back it up with the database. Stored credentials cannot be decrypted without it.

## File and artifact uploads

Local storage works without additional setup. The Compose file below persists `/app/storage`. To use object storage, merge the following into `config.yml`. This example uses Amazon S3:

```yaml
drive:
  default: s3
  disks:
    s3:
      driver: s3
      bucket: example-studio-files
      region: us-east-1
      supportsACL: false
      visibility: private
      credentials:
        accessKeyId: replace-with-access-key-id
        secretAccessKey: replace-with-access-key-secret

releases:
  artifact:
    disk: s3
    prefix: releases/artifacts
```

Replace the bucket, region, and credentials, and make the bucket private. `drive.default` stores uploaded attachments and other files. Configure `releases.artifact` separately for build artifacts uploaded by CI or Agents.

Keep the `storage` volume mount even when using object storage. For local files and S3-compatible services, see [File and artifact storage](../reference/storage.md).

## Invitation and password reset email

Configure both before onboarding your team. Invitations use a notification channel; password resets use the independent `auth.email` sender. This example uses the same SMTP account for both. Merge it into the matching sections of `config.yml`:

```yaml
users:
  invitations:
    emailChannel: system-email

notification:
  channels:
    inbox:
      type: in-app
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      secure: false
      auth:
        user: notifications@example.com
      from: "Studio <notifications@example.com>"

auth:
  passwordReset:
    enabled: true
  email:
    provider: smtp
    host: smtp.example.com
    port: 587
    secure: false
    auth:
      user: notifications@example.com
    from: "Studio <notifications@example.com>"
```

Keep existing settings such as `users.initialAdmin` and `auth.emailAndPassword`. Replace the SMTP host, port, account, and sender address with values authorized by your email provider.

Add the passwords to `.env`:

```dotenv
SMTP_PASSWORD=<invitation-email-smtp-password>
AUTH_EMAIL_PASSWORD=<password-reset-smtp-password>
```

Add these entries to `services.studio.environment` in the Compose file below:

```yaml
SMTP_PASSWORD: ${SMTP_PASSWORD:?set SMTP_PASSWORD in .env}
AUTH_EMAIL_PASSWORD: ${AUTH_EMAIL_PASSWORD:?set AUTH_EMAIL_PASSWORD in .env}
```

Compose must pass the variables into the container. Do not write `${SMTP_PASSWORD}` in `config.yml`; it will not expand. Both senders can use the same password, but require separate variables. Set `APP_PUBLIC_ORIGIN` to the address members can access; email links use this address.

For a local trial without email, keep `auth.passwordReset.enabled: false`. You can share invitation links manually. For Resend and migration from older settings, see [Notifications and push](../admin/notifications.md#migrate-older-configuration).

## Start the services

Create `docker-compose.yml` in the same directory:

```yaml
services:
  studio:
    image: ${STUDIO_IMAGE:?set STUDIO_IMAGE in .env}
    init: true
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "127.0.0.1:13000:13000"
    environment:
      APP_CONFIG_FILE: /app/config.yml
      APP_PUBLIC_ORIGIN: ${APP_PUBLIC_ORIGIN}
      APP_BASE_PATH: /main
      APP_SAMPLE_DATA: "false"
      SECRETS_KEYS: 1:${STUDIO_SECRET_KEY:?set STUDIO_SECRET_KEY in .env}
      INITIAL_ADMIN_USERNAME: ${INITIAL_ADMIN_USERNAME}
      INITIAL_ADMIN_EMAIL: ${INITIAL_ADMIN_EMAIL}
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
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U studio -d studio"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres-data:
```

This configuration exposes port 13000 only on the local host. For a remote server, configure HTTPS as described below or use SSH port forwarding for an initial check.

```bash
docker compose config --quiet
docker compose up -d
docker compose ps
curl -fsS http://localhost:13000/main/api/healthz
```

The first start creates database tables and the administrator. Wait for Studio to become `healthy` and the health endpoint to return `"ok": true`.

## Configure the public address

Skip this step for a local trial. For team use, point a domain to the server and configure an HTTPS reverse proxy with WebSocket support.

For example, with Caddy on the same server:

```text
studio.example.com {
    reverse_proxy 127.0.0.1:13000
}
```

Set `APP_PUBLIC_ORIGIN=https://studio.example.com` in `.env`, then recreate the container:

```bash
docker compose up -d
```

## Sign in

Open `https://studio.example.com/main/`, or `http://localhost:13000/main/` for a local trial. Use `INITIAL_ADMIN_USERNAME` and `INITIAL_ADMIN_PASSWORD` from `.env`.

![Sign in with the initial administrator account](https://static-docs.nocobase.com/studio-en-setup-login-20261030.png)

These administrator settings apply only on first installation. To change the password later, use **Account settings › Account and security**.

**Done when**: the administrator can sign in, the project list is empty, and the sign-in page has no registration link. Use the complete URL including `/main` when connecting runners and the CLI.

![An empty project list after the first sign-in](https://static-docs.nocobase.com/studio-en-setup-empty-projects-20261030.png)

Before onboarding your team, verify that you can:

- Upload a test file, refresh the page, and download it.
- Receive an invitation at a test mailbox you control and open its link.
- Reset an existing test account's password and sign in with the new password.

Verify artifact upload and preview startup after [configuring checks and previews](ci.md).

Next, [connect your code host](git.md).

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Image access denied | Check the supplied version and access authorization; contact us if needed |
| Image download times out | Check the Docker service's proxy and access to the supplied download addresses |
| Container keeps restarting | Run `docker compose logs --tail=100 studio` and check database and configuration errors |
| Configuration file cannot be read | Confirm `config.yml` is a file copied from the image, not a directory created by Docker |
| Storage is not writable | Confirm UID 1000 can write to `storage` |
| Page or sign-in callback fails | Check `/main/`, `APP_PUBLIC_ORIGIN`, and the reverse proxy |

For ongoing maintenance, see [Upgrade and backup](../admin/upgrade-and-backup.md).
