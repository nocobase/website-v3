---
title: Deploy with Docker
description: Build an image to deploy a production application independently, preserving configuration and data with Docker Compose.
---

This guide uses the product catalog application as a worked example and also applies to your own NocoBase Core apps. Confirm the target environment with [Choose a deployment method](../deployment/choose-a-deployment-method.md). For your own project, replace example application names, paths, and business acceptance checks.

Use the application's own `Dockerfile` to build an image and run it with Docker Compose on your production server, with separate persistent directories for configuration, SQLite and uploaded files. Verify your application has passed its tests; see [the product catalog example README](https://github.com/nocobase/docs-examples-v3/blob/b24857f529ae5bb80e97a881b846ea2fd1424242/apps/product-catalog/README.md) for the product catalog example. This guide uses Linux x64, a single SQLite instance and the template's Node.js 24 Debian runtime.

## Prerequisites

```bash
docker version
docker compose version
docker context show
```

Commands use Bash. The server needs a Compose plugin supporting `--wait`. Bind-mount source paths must exist on the Docker server, not merely on the machine issuing commands to a remote Docker context. Choose an independent project name, directory and unused host port for this tutorial.

The example uses default template `1.0.0-beta.85`; the pinned README above describes its source and setup. The configuration below disables optional samples: required roles are initialized, but the product catalog starts empty. Create a product in the verification steps.

## With an agent

From the application source directory, replace the server, directory and URL below with your actual target:

```text
Please deploy the current product catalog app with Docker for the first time.

Server: <my Docker server>
Server platform: linux/amd64
Deployment directory: <absolute server path>/catalog-docker
Database: a new SQLite database, without development data or sample products
Server-local listener: 127.0.0.1:13000
User-facing URL: https://shop.example.com/shop/

Follow the project's Docker deployment guidance and operate only on this tutorial app.
Keep configuration, passwords and business data separate from the image so they survive container recreation.
Set up administrator sign-in and retain application secrets without exposing them in code or reports.
If required configuration or storage is missing, explain the problem instead of silently starting with empty data.

Verify sign-in, product creation and publication and reader permissions, then recreate this app's container and confirm the original data and permissions survive.
Report the URL, verification results and unfinished setup such as the domain or HTTPS.
```

Configure DNS, HTTPS and the reverse proxy separately. For a local rehearsal, replace the origin with `http://127.0.0.1:13000`.

## Without an agent

### 1. Build the image on the development machine

```bash
pnpm build --target linux-x64 --node-version 24

docker build --platform linux/amd64 \
  --build-arg DIST=prebuilt \
  -t catalog-app:1 .
```

Docker reads `dist/`, not `dist.tar.gz`. Add `--tar` to the application build if you also need an archive for app-installer. `linux-x64` corresponds to Docker `linux/amd64`, using glibc. An ARM64 target needs both `linux-arm64` and `linux/arm64`. The Node major must match the Dockerfile.

Keep `Dockerfile.dockerignore`: it excludes local configuration, databases and development dependencies. The prebuilt stage verifies platform, Node major and relocatability. Fix mismatched build parameters rather than bypassing those checks.

Transfer the image through your registry, or export it:

```bash
# Development machine
docker save -o catalog-app-1.tar catalog-app:1
scp catalog-app-1.tar deploy@server:/tmp/catalog-app-1.tar
```

On the server:

```bash
docker load -i /tmp/catalog-app-1.tar
```

Compare `docker image inspect catalog-app:1 --format '{{.Id}}'` before and after transfer if needed. An image archive is not a data backup. The remaining commands run on the Docker server; a local rehearsal needs no transfer.

### 2. Prepare persistent storage and configuration

```bash
mkdir -p "$HOME/catalog-docker/config" "$HOME/catalog-docker/storage"
cd "$HOME/catalog-docker"
```

Use new directories for this installation. The template container runs as UID 1000 (`node`), which must be able to write the mounts. If necessary, an administrator adjusts ownership of only these directories, for example `sudo chown 1000:1000 config storage`.

Generate configuration through the image's CLI:

```bash
docker run --rm \
  --mount "type=bind,src=$PWD/config,dst=/config" \
  catalog-app:1 \
  node dist/cli/index.js config init --dialect sqlite --config /config/config.yml
```

Set your administrator password before first start:

```bash
read -r -s -p 'Initial admin password: ' CATALOG_INITIAL_PASSWORD
export CATALOG_INITIAL_PASSWORD

docker run --rm \
  -e CATALOG_INITIAL_PASSWORD \
  -e APP_CONFIG_FILE=/config/config.yml \
  --mount "type=bind,src=$PWD/config,dst=/config" \
  catalog-app:1 \
  node dist/cli/index.js config set \
  --from-env users.initialAdmin.password=CATALOG_INITIAL_PASSWORD

unset CATALOG_INITIAL_PASSWORD
```

Preserve the generated configuration and stable secrets with restricted backups. Do not regenerate it on restart. Initial administrator settings apply only when the user table is empty.

### 3. Create compose.yml

```yaml
services:
  app:
    image: catalog-app:1
    init: true
    restart: unless-stopped
    ports:
      - '127.0.0.1:13000:13000'
    environment:
      APP_BASE_PATH: /shop
      APP_PUBLIC_ORIGIN: https://shop.example.com
      APP_SAMPLE_DATA: 'false'
    volumes:
      - type: bind
        source: ./config/config.yml
        target: /app/config.yml
        read_only: true
        bind:
          create_host_path: false
      - type: bind
        source: ./storage
        target: /app/storage
        bind:
          create_host_path: false
```

The origin excludes the base path. The container listens on `0.0.0.0:13000`, while the host publishes only on loopback. The reverse proxy handles public HTTPS, path forwarding and WebSocket upgrades. For a loopback rehearsal, set the matching HTTP origin and open `http://127.0.0.1:13000/shop/`.

`create_host_path: false` fails on a missing mount source instead of silently creating an incorrect empty directory. Configuration is read-only in the running container; SQLite, uploads and other persistent content use writable storage.

### 4. Validate and start

```bash
docker compose -p catalog-app config --quiet

docker compose -p catalog-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p catalog-app up -d --wait --wait-timeout 180

docker compose -p catalog-app ps
docker compose -p catalog-app logs --tail=80 app
curl --fail http://127.0.0.1:13000/shop/api/healthz
```

`--wait` waits for image health checks. On timeout, inspect status and logs rather than repeatedly creating containers. Configuration checks precede startup; actual migrations and required initialization happen when the app starts.

Verify `ok: true`, the expected base path and no migration/database errors. Sign in with the default username `nocobase` and your newly configured password. The product catalog example application initializes **Catalog viewer** and **Catalog editor** roles through required seeds; development users, role assignments, and products are not copied with the image. Test the actual public URL as well: container health does not validate your domain, HTTPS or proxy.

### 5. Verify persistence after recreation

Sign in as administrator and open `/shop/api/swagger/docs`. Under **Products**, create `Deployment Notebook` with `priceCents: 1200`, record its ID, then call the publish endpoint. Use a new `Idempotency-Key` for each operation; see [Create and publish](https://github.com/nocobase/docs-examples-v3/blob/b24857f529ae5bb80e97a881b846ea2fd1424242/apps/product-catalog/README.md#create-and-publish). Confirm it appears at `/shop/catalog`. That public catalog displays published products; creation happens through the API documentation. Recreate only this project:

```bash
docker compose -p catalog-app up -d --force-recreate --wait --wait-timeout 180
```

Sign in again and query the same product ID to check its name, price and publication state, then refresh `/shop/catalog`. Explicitly assign **Catalog viewer** to an ordinary user without administrator or **Catalog editor** access. Verify product reads and CSV downloads succeed while create and publish requests return `403`.

To stop the rehearsal, run `docker compose -p catalog-app down` from this directory, keeping host configuration and storage. Start again with `up`; do not rerun configuration initialization.

## Publish a new release

Build a new image tag, such as `catalog-app:2`, and transfer it to the server. See [Publish an application release](../deployment/publish-app-release.md) for an overview. Back up database, files and configuration, then change only the image reference while retaining mounts and secrets.

Check the new image against the existing installation:

```bash
docker compose -p catalog-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p catalog-app run --rm --no-deps app \
  node dist/cli/index.js db apply --dry-run --json

docker compose -p catalog-app run --rm --no-deps app \
  node dist/cli/index.js db repair --dry-run --json
```

These checks do not start another application service. Review pending migrations and historical checksums, confirm the backup and then run `docker compose -p catalog-app up -d --wait --wait-timeout 180`. Startup applies new migrations. Verify old records, roles and the new feature. Switching back to an old image changes code but does not undo database migrations or writes.

With an Agent, supply the existing directory, Compose project name and new tag, requiring the same review and preservation checks. Do not initialize new configuration.

Recreate containers after configuration changes as well. A tool may replace the configuration file atomically, leaving an old single-file mount pointing at the previous inode. Container recreation remounts it. Changing Compose environment variables also requires recreation; `docker restart` cannot apply a new environment.

## Troubleshooting and verification scope

| Symptom | Check |
| --- | --- |
| Missing bind source | Correct server directory; configuration generated and storage present |
| `EACCES` | UID 1000 can read configuration and write storage |
| Host port in use | Choose another host port and update a directly accessed origin |
| Unhealthy or timeout | Project logs, database, migrations and base path |

The product catalog example was checked on Linux x64, Node.js 24 and SQLite: prebuilt image, configuration initialization, custom password, Compose health waiting, native login, product creation/publication, CSV download, anonymous management-request denial, and container recreation preserving the same product and password. Real application tests separately cover role-based read/write restrictions. Cross-server transfer, public HTTPS/proxy setup, cross-version deployment and rollback were not exercised.
