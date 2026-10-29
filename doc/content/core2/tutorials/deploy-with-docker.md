---
title: Deploy with Docker
description: Build an image with the application's own Dockerfile, deploy the application independently to production, and persist configuration and application data with Compose.
---

This guide uses the task application to walk through deployment, and it applies equally to your own NocoBase Core applications. First confirm the target environment with [Choose a deployment method](../deployment/choose-a-deployment-method.md); when deploying your own project, replace the example's application name, paths and business acceptance checks with your own.

The guide builds an image of the task application with the application's own `Dockerfile`, then starts it with Docker Compose on your own production server. The image holds the code and production dependencies, while separate directories on the server hold configuration, the database and uploaded files.

Before deploying, make sure the application has passed its tests; for the task example's test steps, see [Build your first app](build-your-first-app.md). The rest of this guide uses Linux x64 with a single SQLite instance and the template's Node.js 24 Debian image. The server needs Docker and the Compose plugin.

## Prerequisites

On both the development machine that builds the image and the server that runs the container, confirm that Docker works; the server's Docker Compose plugin must also support the `--wait` option used below:

```bash
docker version
docker compose version
docker context show
```

The shell commands in this guide use Bash. The directories mounted later must exist on the server where the Docker service actually runs; when using a remote Docker context, do not mistake local directories on the development machine for directories on the server.

Prepare a new directory and an unused port for this application, and use a separate Compose project name. The examples below use `tasks-app` throughout; when deploying several applications on one server, change the project name, directory and host port for each.

## With an Agent

In the application's source directory, give the Agent the following request, replacing the server, directory and access URL with your actual values:

```text
Please deploy the current task app with Docker for the first time.

Server: <my Docker server>
Server platform: linux/amd64
Deployment directory: <absolute server path>/tasks-docker
Database: a new SQLite database, without development data or sample tasks
Server-local listener: 127.0.0.1:13000
User-facing URL: https://tasks.example.com/tasks/

Follow the project's Docker deployment guidance and operate only on this tutorial app.
Keep configuration, passwords and business data separate from the image so they survive container recreation.
Set up administrator sign-in and retain application secrets without exposing them in code or reports.
If required configuration or storage is missing, explain the problem instead of silently starting with empty data.

Verify sign-in, task operations and reader permissions, then recreate this app's container and confirm the original data and permissions survive.
Report the URL, verification results and unfinished setup such as the domain or HTTPS.
```

The Agent should first check the target server, directory and any existing data before acting. Domains, HTTPS and the reverse proxy are configured in the target environment; for a rehearsal on your own machine, change the origin to `http://127.0.0.1:13000`.

## Without an Agent

### 1. Build the image on the development machine

This guide builds `dist` first and then puts it into the image. Run the following in the application root:

```bash
pnpm build --target linux-x64 --node-version 24

docker build --platform linux/amd64 \
  --build-arg DIST=prebuilt \
  -t tasks-app:1 .
```

Docker uses the project's `dist/` directory and does not read `dist.tar.gz`. If you also need a deployment archive for app-installer, add `--tar` to the build command above.

`linux-x64` here corresponds to the image platform `linux/amd64`, and both use glibc; an ARM64 server needs both changed, to `linux-arm64` and `linux/arm64`. The Node major version must also match the Dockerfile.

Keep the project's own `Dockerfile.dockerignore`, so that local configuration, databases and development dependencies stay out of the build context. The prebuilt stage checks the platform, Node major version and relocatability marker of `dist`; when they do not match the target, fix the build parameters rather than bypassing the checks.

If the image is built on a different machine from the one that runs the container, transfer it through your own registry, or export it and copy it to the server:

```bash
# Development machine
docker save -o tasks-app-1.tar tasks-app:1
scp tasks-app-1.tar deploy@server:/tmp/tasks-app-1.tar
```

On the server, load the copied image:

```bash
docker load -i /tmp/tasks-app-1.tar
```

You can run `docker image inspect tasks-app:1 --format '{{.Id}}'` before exporting and after loading to check that the image identifiers match. `docker save` exports an image; it is not a backup of application data.

The remaining commands all run on the Docker server. For a rehearsal on your own machine, skip the export and load.

### 2. Prepare persistent storage and configuration

```bash
mkdir -p "$HOME/tasks-docker/config" "$HOME/tasks-docker/storage"
cd "$HOME/tasks-docker"
```

Make sure these are directories newly created for this application. The template's container runs as the `node` user with UID `1000`, and the mounted directories must let it write. On Linux, if the directories belong to another user, an administrator adjusts the ownership of only these two new directories, for example `sudo chown 1000:1000 config storage`.

Generate the configuration with the CLI in the image:

```bash
docker run --rm \
  --mount "type=bind,src=$PWD/config,dst=/config" \
  tasks-app:1 \
  node dist/cli/index.js config init --dialect sqlite --config /config/config.yml
```

Set the administrator password before the first start:

```bash
read -r -s -p 'Initial admin password: ' TASK_INITIAL_PASSWORD
export TASK_INITIAL_PASSWORD

docker run --rm \
  -e TASK_INITIAL_PASSWORD \
  -e APP_CONFIG_FILE=/config/config.yml \
  --mount "type=bind,src=$PWD/config,dst=/config" \
  tasks-app:1 \
  node dist/cli/index.js config set \
  --from-env users.initialAdmin.password=TASK_INITIAL_PASSWORD

unset TASK_INITIAL_PASSWORD
```

Keep the generated `config/config.yml` safe. Its secrets must be backed up together with the database, and access to the backups should be restricted. Do not regenerate the configuration on every restart. The initial administrator settings only take effect at first initialization, while the user table is empty.

### 3. Create compose.yml

In the deployment directory, create `compose.yml`:

```yaml
services:
  app:
    image: tasks-app:1
    init: true
    restart: unless-stopped
    ports:
      - '127.0.0.1:13000:13000'
    environment:
      APP_BASE_PATH: /tasks
      APP_PUBLIC_ORIGIN: https://tasks.example.com
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

`APP_PUBLIC_ORIGIN` does not include the application path, which is set by `APP_BASE_PATH`. Inside the container the application listens on `0.0.0.0:13000`, while the host publishes the port only on the loopback address; the reverse proxy on the server handles the domain, HTTPS, path forwarding and WebSocket upgrades. When the first rehearsal uses a local origin, open `http://127.0.0.1:13000/tasks/` directly.

The long mount syntax with `create_host_path: false` makes a missing configuration or data directory fail immediately, instead of silently creating a wrong empty directory. `config.yml` is read-only in the running container; SQLite, uploaded files and other persistent content live in the writable `storage` mount.

### 4. Validate and start

```bash
docker compose -p tasks-app config --quiet

docker compose -p tasks-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p tasks-app up -d --wait --wait-timeout 180

docker compose -p tasks-app ps
docker compose -p tasks-app logs --tail=80 app
curl --fail http://127.0.0.1:13000/tasks/api/healthz
```

`--wait` waits for the image's health check to pass, so you do not access the container right after it starts. If it times out or reports unhealthy, check the output of `ps` and `logs` first instead of creating containers repeatedly. `config check --connect` checks the configuration and database connection before startup; the actual application migrations and initialization of base data run when the application starts.

Confirm that the health endpoint returns `ok: true` with base path `/tasks`, and that the logs show no migration or database connection failures, then sign in through the actual access URL. Use the initial administrator username (`nocobase` by default in the template) and the password you just set. The current getting-started example initializes the task roles through required seeds; team users, role assignments and tasks from the development environment are not copied with the image.

After configuring the reverse proxy, also open `https://tasks.example.com/tasks/` from the network users actually access it from, and verify sign-in, page refreshes and task operations. A healthy container only proves the application inside it works; it does not verify the domain, HTTPS or proxy configuration for you.

### 5. Verify that data survives container recreation

First create a task, mark it complete and refresh the page. Then recreate the containers of this Compose project:

```bash
docker compose -p tasks-app up -d --force-recreate --wait --wait-timeout 180
```

Once the command succeeds, reopen the task page and confirm that the same task and its completed state are still there, and that the administrator can still sign in with the original password. Then configure an ordinary read-only user following the permission notes in [Build your first app](build-your-first-app.md), and confirm that this user can view tasks but cannot create or complete them.

To stop the rehearsal environment, run `docker compose -p tasks-app down` in the same deployment directory, keeping the `config` and `storage` directories on the host. Running the `up` command above again continues with the existing data; do not run `config init` again.

## Publish a new release

After the business change has been made and verified, build a new image following the build steps above, give it a new tag such as `tasks-app:2`, and transfer it to the target server. For an overview of the update flow, see [Publish an application release](../deployment/publish-app-release.md).

In the existing deployment directory, back up the database, files and configuration, then change `image` in Compose while keeping the original mount paths and secrets. Use the new image to check the configuration, migrations and historical checksums:

```bash
docker compose -p tasks-app run --rm --no-deps app \
  node dist/cli/index.js config check --connect

docker compose -p tasks-app run --rm --no-deps app \
  node dist/cli/index.js db apply --dry-run --json

docker compose -p tasks-app run --rm --no-deps app \
  node dist/cli/index.js db repair --dry-run --json
```

These commands only check; they do not start a second application service. Once you have confirmed that no checksum repair is needed, that the migrations suit the existing data, and that the backup is complete, run `docker compose -p tasks-app up -d --wait --wait-timeout 180`. New migrations run at startup; afterwards, check the old tasks, the roles and the new feature. Switching back to the old image only changes the code; it does not undo database migrations or business writes.

When doing this with an Agent, provide the existing Compose directory, the project name and the new image tag, and require it to keep the existing configuration and data, review the update plan first, and replace containers only within the authorized scope; do not initialize the configuration again.

After changing the runtime configuration, also recreate the container in the same deployment directory:

```bash
docker compose -p tasks-app up -d --force-recreate --wait --wait-timeout 180
```

A configuration tool may save content by replacing the file, and an old container using a single-file bind mount may still point at the previous file; recreating the container mounts the configuration again. Changing Compose environment variables also requires recreating the container; `docker restart` alone does not apply a new container environment.

## Troubleshooting

| Symptom | Next step |
| --- | --- |
| `bind source path does not exist` | Check the current deployment directory, generate the configuration file and create storage first, and confirm they are on the Docker server. |
| `permission denied` / `EACCES` | Check the owner and permissions of the mounted directories and configuration file, so that UID 1000 in the container can read the configuration and write to storage. |
| Host port already in use | Change the host port on the left of Compose `ports`; if you access that port directly, update the origin as well. |
| Container unhealthy or wait timed out | Read this Compose project's logs, check database, migration and startup errors, then check the base path. |

The original `.77` rehearsal verified the prebuilt image, `save/load` on the same machine, configuration initialization, a custom administrator password, Compose health waiting, task and permission tests, and that the same task and configuration survive container recreation; a missing mount source fails immediately. The rehearsal used the local loopback address and did not exercise cross-server transfer, a production domain with HTTPS, cross-version upgrades or rollback.

The deployment records and screenshots in this guide come from that earlier rehearsal; they do not mean the current `1.0.0-beta.81` npm example has been deployed and verified again.
