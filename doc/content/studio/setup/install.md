---
title: Deploy Studio
description: Install Studio on your computer with one command to try it, or deploy it manually with Docker Compose for team use.
---

## Install with one command

The one-command install sets up Studio on your own computer:

- Studio Community Edition and PostgreSQL, run by Docker Compose in `~/.nocobase-studio/`
- Gitea, a local Git server
- Your computer as a [personal runtime](../join/personal-runtime.md), with the runner and the `nb-studio` command line
- **My first project**, whose repository holds a NocoBase 3 application
- A conversation with an Agent and a suggested first task

### Before you begin

- macOS, Linux, or WSL on Windows with Docker Desktop
- Docker with Compose v2, running
- Node.js 24, Git and curl
- At least one coding tool installed and signed in: Claude Code, Codex, OpenCode or Pi

### Run the installer

```bash
curl -fsSL https://get.nocobase.com/studio | sh
```

When it finishes, it prints the address to open and the sign-in.

### Open Studio

Open the printed address and sign in with `admin@nocobase.com` and `admin123`. Then change the password under **Account settings › Account and security**.

Gitea accepts the same email and initial password.

**Done when**: the first conversation shows the Agent's plan and a suggested task with **Start**.

### Change the configuration

| File in `~/.nocobase-studio/` | Holds | After editing, run |
| --- | --- | --- |
| `config/config.yml` | Studio's configuration, such as the database, [email](#invitation-and-password-reset-email) and [file storage](#file-and-artifact-uploads) | `docker compose -f ~/.nocobase-studio/compose.yml restart studio` |
| `.env` | Images, ports, language, the initial administrator, `SECRETS_KEYS` and `POSTGRES_PASSWORD` | `docker compose -f ~/.nocobase-studio/compose.yml up -d` |

Running the installer again keeps your edits. Settings in `.env` override the same settings in `config.yml`. Keep `SECRETS_KEYS`: without it, Studio cannot decrypt stored credentials.

### Installer options

```bash
curl -fsSL https://get.nocobase.com/studio | sh -s -- --lang zh-CN --mirror registry.cn-shanghai.aliyuncs.com --npm-registry https://registry.npmmirror.com/
```

| Option | Effect |
| --- | --- |
| `--lang <locale>` | Language of the installer and of Studio: `en-US` (default), `zh-CN`, `zh-TW`, `ja-JP`, `ko-KR`, `es-ES`, `fr-FR`, `de-DE`, `pt-BR`, `ru-RU`, `id-ID` or `vi-VN` |
| `--mirror <registry>` | Pulls the images from this registry instead of Docker Hub, such as `registry.cn-shanghai.aliyuncs.com` in mainland China |
| `--npm-registry <url>` | Installs the first project's npm packages from this registry, such as `https://registry.npmmirror.com/` |
| `--dry-run` | Shows what would be done without changing anything |
| `--uninstall` | Removes the containers, the runner and `nb-studio`, and keeps the data |
| `--purge` | With `--uninstall`, also deletes `~/.nocobase-studio/` |
| `-h`, `--help` | Shows the usage |

### Upgrade, stop and uninstall

To upgrade, run the install command again. It keeps your settings and, when an image changes, first backs up `data/` to `backups/`.

Stop and start:

```bash
docker compose -f ~/.nocobase-studio/compose.yml down
docker compose -f ~/.nocobase-studio/compose.yml up -d
```

Uninstall and keep the data:

```bash
curl -fsSL https://get.nocobase.com/studio | sh -s -- --uninstall
```

Add `--purge` to delete the data too.

## Deploy manually

These steps use the Community Edition (CE) image, which requires no license key. For other images, see [Choose an edition](index.md#choose-an-edition).

They deploy one Studio instance with PostgreSQL. You can use an existing database instead; see the [configuration reference](../reference/config.md).

### Prepare the environment

- A server with Docker and Docker Compose. The image supports Linux amd64 and arm64.
- Access to the image registry from the deployment server. For offline installation, import the image archive with `docker load -i <archive>`.
- A stable address. Use a domain and HTTPS for team access. For a local trial, `http://localhost:13000` is sufficient.

Coding tools run on a separate [runtime](shared-runtimes.md), connected later. A single instance does not require Redis. Before onboarding a team, prepare file and artifact storage, invitation email, and password reset email.

### Prepare configuration

Extract the configuration template from the [official CE image on Docker Hub](https://hub.docker.com/r/nocobase/studio-ce).

```bash
mkdir studio
cd studio
mkdir storage

docker run --rm --entrypoint cat nocobase/studio-ce:latest \
  /app/config.example.yml > config.yml
```

Generate an encryption key:

```bash
openssl rand -hex 32
```

Edit `config.yml` and merge these values into the matching template sections. Enter your administrator credentials, the generated encryption key, and your database connection details. Keep the other template settings and avoid duplicate keys.

This example uses PostgreSQL. For an existing database, enter its host, port, database name, username, and password. The host must be reachable from the Studio container.

With the [Compose configuration below](#start-the-services), Studio connects to PostgreSQL over the container network. `host: postgres` refers to the Compose service name, and `port: 5432` is the port PostgreSQL listens on inside that container. Choose your own database name, username, and password.

```yaml
app:
  publicOrigin: http://localhost:13000
  sampleData: false

users:
  initialAdmin:
    username: admin
    email: admin@example.com
    password: replace-with-admin-password

secrets:
  keys:
    - version: 1
      key: replace-with-generated-key

auth:
  passwordReset:
    enabled: false
  emailAndPassword:
    enabled: true
    autoSignIn: false
    disableSignUp: true

database:
  default: main
  connections:
    main:
      dialect: postgres
      host: postgres
      port: 5432
      database: replace-with-database-name
      username: replace-with-database-user
      password: replace-with-database-password
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true
```

Set `app.publicOrigin` to the scheme, host, and port browsers use, without `/main`. The initial administrator is created only when starting with an empty user database.

> [!NOTE] Preserve the encryption key
> `secrets.keys` encrypts credentials stored in Studio. Preserve it during restarts and upgrades, and back it up with the database. Stored credentials cannot be decrypted without it.

### File and artifact uploads

Local storage works without extra setup. The Compose file below persists `/app/storage`. Individual task, comment, and Agent conversation attachments default to a 20 MiB limit. To increase it, configure the destination disk in `config.yml`, for example to 50 MiB:

```yaml
drive:
  disks:
    local:
      maxFileSizeMb: 50
```

`maxFileSizeMb` must be a positive integer. For object storage, set it on the corresponding disk. Increase the reverse proxy request size limit too, allowing extra space for the upload form.

For object storage, merge this example into `config.yml`. It uses Amazon S3:

```yaml
drive:
  default: s3
  disks:
    s3:
      driver: s3
      maxFileSizeMb: 50
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

### Invitation and password reset email

Configure email before onboarding your team. Invitations and password resets share one SMTP configuration. Merge the following into the matching sections of `config.yml`:

```yaml
mailers:
  default: system
  system:
    provider: smtp
    host: smtp.example.com
    port: 587
    secure: false
    auth:
      user: notifications@example.com
      pass: replace-with-smtp-password
    from: "Studio <notifications@example.com>"

auth:
  passwordReset:
    enabled: true
```

Keep settings such as `users.initialAdmin` and `auth.emailAndPassword`. Replace the SMTP host, port, account, and sender address with values authorized by your email provider.

Set the password in `mailers.system.auth.pass`. Set `app.publicOrigin` to the address members can access; email links use it.

For a local trial without email, keep `auth.passwordReset.enabled: false`. You can share invitation links manually. For Resend and delivery checks, see [Notifications and push](../admin/notifications.md#invitation-email).

### Start the services

Create `docker-compose.yml` in the same directory. Set `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` to match the database name, username, and password in `config.yml`.

```yaml
services:
  studio:
    image: nocobase/studio-ce:latest
    init: true
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "127.0.0.1:13000:13000"
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./storage:/app/storage

  postgres:
    image: postgres:16
    command: ["postgres", "-c", "jit=off"]
    restart: unless-stopped
    environment:
      POSTGRES_DB: replace-with-database-name
      POSTGRES_USER: replace-with-database-user
      POSTGRES_PASSWORD: replace-with-database-password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres-data:
```

We recommend disabling JIT (just-in-time compilation) for the PostgreSQL database used by Studio. [JIT mainly benefits long-running, CPU-bound queries](https://www.postgresql.org/docs/16/jit-decision.html). Routine Studio operations mainly use short queries; when JIT is triggered, compilation overhead can outweigh the savings and increase response time.

The `command` above sets `jit=off`. For an existing database, run the following SQL as its owner or a database administrator, replacing the database name:

```sql
ALTER DATABASE "your_studio_database" SET jit = off;
```

The setting applies to new connections. If Studio is already running, restart it to reconnect. Open a new connection with Studio’s database account and run `SHOW jit;`; the result should be `off`.

For an existing database, remove the `postgres` service, `studio.depends_on`, and the `postgres-data` volume configuration from Compose.

The Studio image reads `/app/config.yml` and uses `/main` by default. The environment variables above initialize the PostgreSQL container; Studio settings stay in `config.yml`.

The Studio container runs as UID 1000. Before starting it, grant access to the configuration and storage directory, and restrict configuration file reads:

```bash
sudo chown 1000:1000 config.yml storage
sudo chmod 600 config.yml
```

This configuration exposes port 13000 only on the local host. For a remote server, configure HTTPS as described below or use SSH port forwarding for an initial check.

```bash
docker compose config --quiet
docker compose up -d
docker compose ps
curl -fsS http://localhost:13000/main/api/healthz
```

The first start creates database tables and the administrator. Wait for Studio to become `healthy` and the health endpoint to return `"ok": true`.

### Configure the public address

Skip this step for a local trial. For team use, point a domain to the server and configure an HTTPS reverse proxy with WebSocket support.

For example, with Caddy on the same server:

```text
studio.example.com {
    reverse_proxy 127.0.0.1:13000
}
```

Set `app.publicOrigin` in `config.yml` to the actual public address:

```yaml
app:
  publicOrigin: https://studio.example.com
```

Recreate the Studio container to apply the configuration:

```bash
docker compose up -d --force-recreate studio
```

### Sign in

Open `https://studio.example.com/main/`, or `http://localhost:13000/main/` for a local trial. Sign in with the username and password in `users.initialAdmin` in `config.yml`.

![Sign in with the initial administrator account](https://static-docs.nocobase.com/studio-en-login-20261111-normal-2x.webp)

These administrator settings apply only on first installation. To change the password later, use **Account settings › Account and security**.

For Professional or Enterprise, enter the license key supplied with your image. Administrators can check license status and available updates in **Settings › License**. If your application uses commercial dependencies, configure the supplied package access credential there.

**Done when**: the administrator can sign in, the project list is empty, and the sign-in page has no registration link. Use the complete URL including `/main` when connecting runners and the CLI.

![An empty project list after the first sign-in](https://static-docs.nocobase.com/studio-en-ce-empty-projects-20261119-7bcc68297d.webp)

Before onboarding your team, verify that you can:

- Upload a test file, refresh the page, and download it.
- Receive an invitation at a test mailbox you control and open its link.
- Reset an existing test account's password and sign in with the new password.

Verify artifact upload and preview startup after [configuring checks and previews](ci.md).

Next, [connect your code host](git.md).

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| The installer stops and names a missing tool | Install it with the printed command and run the installer again |
| The installer says the runtime does not see a coding tool as signed in | Sign in to the tool. For Claude Code, move `ANTHROPIC_*` variables from your shell profile to `env` in `~/.claude/settings.json`. Check the tool again under **Agent management › Runtimes** and run the installer again |
| Image access denied | Check the repository name and version tag. For Professional or Enterprise, check access to the registry supplied with your image |
| Image download times out | Check the Docker proxy settings and connectivity from the server to the selected registry. With the one-command install, use `--mirror` |
| Container keeps restarting | Run `docker compose logs --tail=100 studio` and check database and configuration errors. For the one-command install, add `-f ~/.nocobase-studio/compose.yml` |
| Configuration file cannot be read | Confirm `config.yml` is a file copied from the image, not a directory created by Docker |
| Storage is not writable | Confirm UID 1000 can write to `storage` |
| Page or sign-in callback fails | Check `/main/`, `app.publicOrigin`, and the reverse proxy |

For ongoing maintenance, see [Upgrade and backup](../admin/upgrade-and-backup.md).
