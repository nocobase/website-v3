---
title: Deploy with Docker
description: Have an Agent build and deploy a Docker app with persistent configuration and data, then verify container recreation.
---

## Prepare the app, server and access URL

<a id="prerequisites"></a>

Prepare tested source and the target commit. The build machine needs Docker; the runtime server needs Docker and a Compose plugin supporting `--wait`. Check which machine the Docker context uses: mounts must exist on the daemon's server.

Provide the deployment directory, CPU architecture, free port and public URL. The reverse proxy must forward the application path, cookies and WebSocket upgrades, preserving Host and protocol headers. Keep configuration and `storage` outside the image; the template container's UID 1000 needs read access to configuration and write access to data.

## Tell the Agent what to deploy

<a id="with-an-agent"></a>

In the application source directory, replace the placeholders:

```prompt
Deploy this app with Docker to <server>, using <new deployment directory>, accessible at <URL>. Start with a new database without development data. Keep configuration and data separately so they survive container recreation. Show me the deployment plan and wait for my confirmation before proceeding.
```

If you need existing data, replace the new-database requirement and provide the backup and restore target.

## Confirm the deployment plan

Check the source commit, image tag, target architecture, Node major, directory, port, database and mounts. Agree on administrator configuration, secret storage, and who configures the domain, HTTPS and proxy.

`APP_PUBLIC_ORIGIN` contains the scheme and host only; `APP_BASE_PATH` sets the application path. Confirm all selected storage is persistent before allowing startup.

## Have the Agent build and deploy

Have the Agent use the app's `Dockerfile` and `Dockerfile.dockerignore` to build from source or package a matching `dist/`. Prebuilt mode checks Linux/glibc, architecture, Node major and the relocatable marker.

Generate configuration and set the administrator password on the first installation; retain configuration and stable keys afterward. Validate Compose, configuration and database connectivity before starting and waiting for health. If transferring an image, compare image IDs before and after transfer. An image export contains no business data.

## Verify access and persistent data

Sign in through the real URL, create an identifiable record and keep its ID. Check ordinary users' read/write permissions. Upload and download a file when applicable. For Product Catalog operations, see the [example instructions](https://github.com/nocobase/docs-examples-v3/blob/51658852e7290b0ed3c0735d2856681850560efb/apps/product-catalog/README.md#create-and-publish).

Have the Agent recreate the container in the same Compose project. Sign in again and retrieve the same record and files. Check mounts and keys are unchanged, and refresh, APIs and realtime connections work through the proxy. Use [Updates and recovery](publish-app-release.md) for subsequent changes.

## Manual deployment reference

<a id="without-an-agent"></a>
<a id="1-build-the-image-on-the-development-machine"></a>
<a id="2-prepare-persistent-storage-and-configuration"></a>
<a id="3-create-composeyml"></a>
<a id="4-validate-and-start"></a>
<a id="5-verify-persistence-after-recreation"></a>

These Bash examples use Linux x64/glibc, Node.js 24, SQLite and a local `/shop` URL. Adapt the address and installed driver for your environment. First check `docker version`, `docker compose version` and `docker context show`.

Build in the application source directory:
```bash
pnpm build --target linux-x64 --node-version 24
docker build --platform linux/amd64 --build-arg DIST=prebuilt -t my-app:1 .
```

Alternatively, build from source with `docker build --platform linux/amd64 -t my-app:1 .`. For ARM64, use both `linux-arm64` and `linux/arm64`. Transfer through a registry, or run `docker save -o my-app-1.tar my-app:1`, copy it and run `docker load -i my-app-1.tar` on the server.

Generate configuration in a new deployment directory on the server. Have its administrator make `config` and `storage` writable by UID 1000, changing only this app's directories:
```bash
mkdir -p config storage
# Run in the new deployment directory on the Docker server.
docker run --rm --mount "type=bind,src=$PWD/config,dst=/config" my-app:1 \
  node dist/cli/index.js config init --dialect sqlite --config /config/config.yml
read -r -s -p 'Initial admin password: ' APP_INITIAL_PASSWORD
export APP_INITIAL_PASSWORD
docker run --rm -e APP_INITIAL_PASSWORD -e APP_CONFIG_FILE=/config/config.yml \
  --mount "type=bind,src=$PWD/config,dst=/config" my-app:1 \
  node dist/cli/index.js config set --from-env users.initialAdmin.password=APP_INITIAL_PASSWORD
unset APP_INITIAL_PASSWORD
```

Save as `compose.yml`:
```yaml
services:
  app:
    image: my-app:1
    init: true
    restart: unless-stopped
    ports:
      - '127.0.0.1:13000:13000'
    environment:
      APP_BASE_PATH: /shop
      APP_PUBLIC_ORIGIN: http://127.0.0.1:13000
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

For a public URL such as `https://apps.example.com/shop/`, change origin to `https://apps.example.com` and configure the proxy separately. The long mount syntax refuses missing source paths to avoid silently using an empty directory.

Validate, start and recreate from this deployment directory:
```bash
docker compose -p my-app config --quiet
docker compose -p my-app run --rm --no-deps app node dist/cli/index.js config check --connect
docker compose -p my-app up -d --wait --wait-timeout 180
curl --fail http://127.0.0.1:13000/shop/api/healthz
docker compose -p my-app up -d --force-recreate --wait --wait-timeout 180
```

The health endpoint should return `ok: true` and the correct base path. The default initial username is `nocobase`; use your configured password. Check data before and after recreation as described above. End a rehearsal with `docker compose -p my-app down`, keeping configuration and data directories.

See [Maintenance and troubleshooting](maintenance-and-troubleshooting.md) for configuration changes, backups, logs and failures.

<a id="publish-a-new-release"></a>

[Updates and recovery](publish-app-release.md)

<a id="troubleshooting-and-verification-scope"></a>

[Maintenance and troubleshooting](maintenance-and-troubleshooting.md)

> [!NOTE]
> Runtime verification for these Docker commands is pending. Rehearse image builds, container recreation and recovery on a Docker host before release.
