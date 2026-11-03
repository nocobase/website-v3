---
title: Deploy with Docker
description: Create an application, build and transfer its Docker image, and deploy it and subsequent versions with persistent storage using Docker Compose.
---

## Prerequisites

The direct IP and HTTP examples below are for deployment checks on a trusted network. Before administrator sign-in over a public or untrusted network, configure a domain, HTTPS and a reverse proxy.

The development machine needs Node.js 24 or later, pnpm 11 and Docker. The server needs Docker and a Docker Compose plugin supporting `--wait`. Commands use Bash and demonstrate a single-instance deployment on Linux x64 with SQLite. For another database, install its driver in the application before building the image, then configure the connection on the server.

Check Docker on both machines, and Compose on the server:

```bash
docker version
docker context show
docker compose version
```

The examples use `my-app` as the application and Compose project name and `13000` as the server port. Give each application its own project name, deployment directory and port. Bind-mount directories must exist on the machine running the Docker daemon.

## Use an agent

Use a development agent from the application source directory. If you do not have an application yet, [create it and enter its directory](#create-the-application-and-enter-its-directory). Agent deployment and manual commands are alternative workflows; choose one.

Give the agent access to the target server and permission to operate Docker. If using an image registry, configure registry sign-in first. Supply passwords and credentials securely rather than putting them in the prompt. The application's `AGENTS.md` and `nocobase-deployment` Skill provide deployment guidance for its version.

### First deployment

Replace the server, directory and URL with your environment. Use a new SQLite database or specify the connection requirements for your external database. Choose a registry or file transfer for the image.

```text
Please deploy the current application to my server with Docker. This is its first deployment.

Server: <SSH user and address>
Deployment directory: <absolute path on the server>
Application URL: <full URL including the application path>
Database: a new SQLite database, without development or sample data
Image transfer: export the image to a file and transfer it over SSH

Set up administrator sign-in and keep configuration and business data on the server so they survive container recreation.
After deployment, check sign-in and a main business operation, then recreate the container to confirm the data survives. Give me the URL and the check results.
```

For a registry, replace the transfer requirement with “Push and pull the image through `<registry address>`.” For a domain and HTTPS, describe the existing proxy configuration or the setup still needed. The agent can check server architecture, available ports and the Docker environment.

Review the results using the [access and persistence checks](#verify-access-and-data-persistence). An agent without server access can prepare configuration and commands, but deployment still needs to be performed on the server.

### Deploy a new version

Use this prompt from the application source directory after updating and testing the code. Specify when downtime is allowed. Checks, backup and the version switch use the existing deployment environment.

```text
Please deploy the current project version to my server, replacing the version already running.

Server: <SSH user and address>
Existing deployment directory: <absolute path on the server>
Compose project name: <existing project name>
New image tag: <for example, my-app:2>
Allowed downtime: <maintenance window>

Keep the existing image transfer method, URL, configuration, secrets and business data. Do not initialize them again.
Review the version changes and complete a backup before deploying the new version. Afterwards, check existing data, user permissions and new features, and give me the results. If deployment fails, explain whether recovery is possible and how it would affect the data.
```

Confirm the agent completed the [version review and backup](#review-version-changes-and-back-up), then review the [new-version checks](#start-and-verify-the-new-version). A rollback still requires checking database compatibility; switching to an old image does not restore data.

## Manual deployment

### Create the application and enter its directory

On the development machine:

```bash
pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
```

For an existing application, enter its source directory instead. Before building, ensure the application passes its tests and retain its `Dockerfile`, `Dockerfile.dockerignore`, `config.example.yml` and lockfile. If an older project lacks the Docker files, obtain them from a compatible application template version.

### Build the Docker image

From the application root:

```bash
docker build --platform linux/amd64 -t my-app:1 .
```

The Dockerfile installs dependencies and builds the application; you do not need to run `pnpm build` first. For an ARM64 server, use `linux/arm64`.

The image contains code and production dependencies, not development configuration, databases or uploads. Keep `Dockerfile.dockerignore` beside the Dockerfile: it excludes local configuration and data. Prepare runtime configuration separately on the server.

### Transfer the image through a registry or file

Choose one method. Skip this step when building and running on the same Docker server.

**Through an image registry**

Replace `registry.example.com/team` with your registry location. On the development machine:

```bash
docker tag my-app:1 registry.example.com/team/my-app:1
docker login registry.example.com
docker push registry.example.com/team/my-app:1
```

On the server:

```bash
docker login registry.example.com
docker pull registry.example.com/team/my-app:1
docker tag registry.example.com/team/my-app:1 my-app:1
```

The last command adds a local tag so the remaining commands can use `my-app:1`. Alternatively, use the full registry name in subsequent commands and in Compose.

**Through an image file**

On the development machine, replace `deploy@server` with the server's SSH user and address:

```bash
docker save -o my-app-1.tar my-app:1
scp my-app-1.tar deploy@server:/tmp/my-app-1.tar
```

On the server:

```bash
docker load -i /tmp/my-app-1.tar
```

`docker save` exports the image, not a backup of business data.

### Create the server deployment directory

Run all remaining commands on the server. Use a new directory for the first deployment:

```bash
mkdir -p "$HOME/my-app-deploy/storage"
cd "$HOME/my-app-deploy"
sudo chown 1000:1000 . storage
```

The template container runs as the `node` user, UID `1000`. It needs to write to the deployment directory to initialize configuration and to `storage/` during operation. This changes ownership only of the new deployment directory and storage directory, without recursively changing other files.

### Initialize configuration and set the administrator password

Use the CLI inside the image to generate `config.yml` in the current directory:

```bash
docker run --rm \
  --mount "type=bind,src=$PWD,dst=/config" \
  my-app:1 \
  node dist/cli/index.js config init \
  --dialect sqlite \
  --config /config/config.yml
```

Set the initial administrator password:

```bash
read -r -s -p 'Initial admin password: ' MY_APP_ADMIN_PASSWORD
export MY_APP_ADMIN_PASSWORD

docker run --rm \
  -e MY_APP_ADMIN_PASSWORD \
  -e APP_CONFIG_FILE=/config/config.yml \
  --mount "type=bind,src=$PWD,dst=/config" \
  my-app:1 \
  node dist/cli/index.js config set \
  --from-env users.initialAdmin.password=MY_APP_ADMIN_PASSWORD

unset MY_APP_ADMIN_PASSWORD
```

The template's default administrator username is `nocobase`. Initial administrator settings apply only when the user table is empty; they do not reset an existing account's password.

Keep the generated `config.yml`. Back up its application secrets together with the database and restrict access to the backups. Do not initialize configuration again on restart or when deploying a new version. The runtime image has no pnpm; run management commands with `node dist/cli/index.js`.

### Create the Docker Compose file

Create `docker-compose.yml` in the deployment directory. Since the directory is now owned by the container user, use `sudo tee` to write it:

```bash
sudo tee docker-compose.yml > /dev/null <<'YAML'
services:
  app:
    image: my-app:1
    init: true
    restart: unless-stopped
    ports:
      - '13000:13000'
    environment:
      APP_BASE_PATH: /main
      APP_PUBLIC_ORIGIN: http://YOUR_SERVER_IP:13000
      APP_SAMPLE_DATA: 'false'
    volumes:
      - type: bind
        source: ./config.yml
        target: /app/config.yml
        read_only: true
        bind:
          create_host_path: false
      - type: bind
        source: ./storage
        target: /app/storage
        bind:
          create_host_path: false
YAML
```

Run `sudo vi docker-compose.yml` and replace `YOUR_SERVER_IP` with the actual server IP. The directory now contains:

```text
my-app-deploy/
├── docker-compose.yml
├── config.yml
└── storage/
```

Configuration is mounted read-only; the database and uploads live in writable `storage/`. `create_host_path: false` fails on a missing configuration file or storage directory instead of creating an unexpected empty directory. `APP_SAMPLE_DATA: 'false'` disables optional sample data during initial installation.

`APP_PUBLIC_ORIGIN` is the external scheme, host and port without the application path; `APP_BASE_PATH` sets the path. This example exposes server port `13000` directly, so allow it through the firewall or security group.

For a domain with HTTPS, set the actual origin, such as `https://apps.example.com`, and configure a reverse proxy to forward `/main/`, preserve Host and protocol headers, forward cookies and support WebSocket. When the proxy runs on the same host, you can restrict the port mapping to `127.0.0.1:13000:13000` for local proxy access only.

### Check configuration and start the application

From the deployment directory:

```bash
docker compose -p my-app config --quiet

docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p my-app up -d --wait --wait-timeout 180
```

The first two commands check Compose configuration, application configuration and database connectivity; they do not run migrations. By default, application startup runs migrations and initial seeds. If the application disables automatic migrations or seeds, run them separately first according to its deployment rules.

Inspect status and logs:

```bash
docker compose -p my-app ps
docker compose -p my-app logs --tail=100 app
```

`--wait` waits for the image's health check to pass. On a timeout or unhealthy status, inspect logs for database connection, permission and migration errors.

### Verify access and data persistence

Replace the server IP and check the health endpoint:

```bash
curl --fail http://YOUR_SERVER_IP:13000/main/api/healthz
```

Confirm `ok: true`, then open `http://YOUR_SERVER_IP:13000/main/` and sign in as `nocobase` with the password you set. When using a reverse proxy, verify access through the real domain.

Check page refreshes, administrator and ordinary-user permissions, and one business operation such as creating and retrieving a record. If the application uses file storage, verify uploads and downloads. Then recreate the container:

```bash
docker compose -p my-app up -d \
  --force-recreate \
  --wait \
  --wait-timeout 180
```

Sign in again and confirm the same record, files and permissions remain. If the application uses scheduled jobs, confirm they continue running. A passing health check does not replace these business checks.

## Deploy a new version manually

### Build and transfer the new image

After updating and verifying the application code on the development machine, build a new image tag from the source directory:

```bash
docker build --platform linux/amd64 -t my-app:2 .
```

Follow the [image transfer steps](#transfer-the-image-through-a-registry-or-file), replacing tag `1` with `2` and filename `my-app-1.tar` with `my-app-2.tar`. For registry transfers, also add the local tag `my-app:2`.

### Review version changes and back up

Read the new version's migration, configuration and upgrade notes first. Keep the existing deployment directory, configuration, secrets and data; do not run `config init`.

The stopped-service backup below applies to SQLite deployments with both the database and local files in `storage/`. External databases and object storage need their own backup procedures, coordinated with configuration and files to the same recovery point.

On the server:

```bash
cd "$HOME/my-app-deploy"
docker compose -p my-app stop

mkdir -p "$HOME/my-app-backups"
chmod 700 "$HOME/my-app-backups"

sudo tar -czf \
  "$HOME/my-app-backups/my-app-$(date +%Y%m%d-%H%M%S).tar.gz" \
  config.yml storage docker-compose.yml
```

Confirm the backup succeeded and inspect the archive for the configuration, storage and Compose file before continuing. Keep the old image and confirm how to restore the backup.

### Update the image tag and check migrations

Run `sudo vi docker-compose.yml` and change `image: my-app:1` to `image: my-app:2`, keeping the existing mount paths. If the new version requires additional configuration, update the existing `config.yml` and keep it readable by the container user.

Check with the new image:

```bash
docker compose -p my-app config --quiet

docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js db apply --dry-run --json

docker compose -p my-app run --rm --no-deps app \
  node dist/cli/index.js db repair --dry-run --json
```

The database commands check the default connection; applications with multiple databases must also check other affected connections. Review pending migrations and seeds. If historical migration checksums have changed, follow the target version's upgrade notes instead of simply removing `--dry-run` to run repairs.

### Start and verify the new version

```bash
docker compose -p my-app up -d --wait --wait-timeout 180

docker compose -p my-app ps
docker compose -p my-app logs --tail=100 app
```

The default configuration applies new migrations at startup. Sign in at the existing URL and check old records, files, permissions, new features and background jobs. Keep the backup and old image until the new version is confirmed usable.

### Handle data when rolling back

Changing the image tag back replaces code only; it does not undo migrations or business writes made after deploying the new version. Check whether the old version is compatible with the current database before deciding to switch only the image.

If a restore is needed, stop the application first, then restore the matching previous database, files, configuration and image version. Restoring a backup taken before deployment loses business writes made after that backup; it is not a lossless rollback.

## Stop and start the application

From the original deployment directory:

```bash
cd "$HOME/my-app-deploy"

# Stop and remove the containers; keep host configuration and data.
docker compose -p my-app down

# Start again with the same configuration and data.
docker compose -p my-app up -d --wait --wait-timeout 180
```

After changing configuration files or Compose environment variables, recreate the container to reload its configuration and mounts:

```bash
docker compose -p my-app up -d --force-recreate --wait --wait-timeout 180
```

`docker restart` alone does not apply new container environment variables. When configuration tools replace a file, an existing container's single-file mount may also still point to the old file.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Configuration file or mount directory is missing | Check the deployment directory on the server; generate `config.yml` and create `storage/`. |
| `permission denied` / `EACCES` | UID 1000 must read configuration and write storage; configuration initialization also needs a writable deployment directory. |
| Host port is occupied | Change the host port on the left of `ports`; update `APP_PUBLIC_ORIGIN` when accessing that port directly. |
| Unhealthy container or timeout | Check `ps` and `logs`, database connectivity, migrations, file permissions and the application path. |
| Healthy container cannot be reached from another computer | Check server IP, port mappings, firewall and security group; for domain access, check the proxy, DNS and HTTPS. |
| Incorrect redirect after sign-in | Match `APP_PUBLIC_ORIGIN` and `APP_BASE_PATH` to the actual URL, then recreate the container. |
