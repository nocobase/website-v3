---
title: Deploy with PM2 (app-installer)
description: Build an application archive and upload it to the server and install it there with app-installer, using PM2 to run it and manage new releases.
---

`app-installer` installs a deployment archive on your server, runs the application under PM2, and manages version switches, backups and rollback. Source code stays on the development machine; runtime configuration and business data on the server are kept outside releases.

## Prerequisites


The direct IP and HTTP examples below are for deployment checks on a trusted network. Before administrator sign-in over a public or untrusted network, configure a domain, HTTPS and a reverse proxy.
The development machine needs Node.js 24 and pnpm 11. The server needs Node.js 24 and globally installed PM2 4.3 or later. Commands use Bash and demonstrate a single instance on Linux x64/glibc with SQLite. For another database, install its driver in the application sources before rebuilding and supply connection settings during installation.

Examples use application `my-app`, SSH destination `deploy@server`, installation directory `/srv/nocobase/my-app`, PM2 process `nocobase-my-app`, port `13000` and application path `/main`. Substitute your own targets. Give each application a separate directory, port and process name.

Commands use `@nocobase/app-installer@beta` with the server’s existing npm registry configuration and run on the server. The configured registry must provide access to the installer. For an existing deployment that needs a pinned installer version, replace `@beta` with that version. The development machine builds, packages and uploads the deployment archive.

## Use an agent

Use a development agent from the application source directory. If needed, [create the application first](#create-the-application-and-enter-its-directory). Prepare server access and supply passwords and credentials securely, not in the prompt. The application's own deployment Skill provides guidance for its version.

### First deployment

Replace the target details:

```text
Please build, package and upload the current application from the development machine, then run app-installer on the server for its first installation, with PM2 managing the process.

Server: <SSH user and address>
Installation directory: <absolute server path>
Application URL: <full URL including the application path>
Database: a new SQLite database, without development or sample data

Set up administrator sign-in and keep configuration and business data separate from releases.
Check sign-in and a main business operation, then restart the application to confirm the data survives.
Give me the URL, check results, and whether startup after a server reboot is configured.
```

### Deploy a new version

Use this from the application source directory after updating and testing the code:

```text
Please build, package and upload the new project version from the development machine, then run app-installer on the existing server to update it.

Server: <SSH user and address>
Existing installation directory: <absolute server path>
Allowed downtime: <maintenance window>

Keep the existing URL, configuration, secrets, database and uploads. Do not initialize them again.
Review version changes and backup coverage before deploying.
Check existing data, user permissions and new features afterwards. If deployment fails, explain the recovery outcome and any effect on data.
```

The agent follows the same division: build, package and upload on the development machine, then connect to the server and run app-installer and PM2 there. Choose either agent execution or manual commands. Both require the access and persistence checks below.

## Manual deployment

The **development-machine terminal** builds, packages and uploads the archive. The **server terminal** installs, deploys new versions, checks status, rolls back and manages PM2. Keep both terminals open; run every `@nocobase/app-installer` command in the server terminal.

Each command block identifies its execution location. Set the password variable, run the installation and unset the variable in the same terminal. Absolute paths do not require changing to the installation directory. The relative path `storage/exports/dist.tar.gz` must be used from the application source directory on the development machine.

### Create the application and enter its directory

```bash title="Development machine · parent directory of the application"
pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
```

For an existing application, enter its source directory and confirm its tests pass before building.

### Build the deployment archive

```bash title="Development machine · application source directory my-app/"
pnpm build --target linux-x64 --node-version 24 --tar
```

The output, `storage/exports/dist.tar.gz`, contains `dist/`, production dependencies and a configuration template, not development databases, secrets or uploads. The server does not need to run `pnpm install` for this archive.

Match the target architecture, libc and Node major to the server. Use `linux-arm64` for ARM64/glibc and the appropriate musl target for systems such as Alpine.

### Prepare the server

Sign in as the service account that will run the application:

```bash title="Development machine · any directory"
ssh deploy@server
```

Check the runtime environment:

```bash title="Server · original service account, any directory"
node --version
node -p "process.platform + '-' + process.arch"
command -v pm2
```

If PM2 is missing, install it globally on the server:

```bash title="Server · original service account, any directory"
npm install -g pm2
```

Have an administrator prepare a new, empty directory for this service account:

```bash title="Server · original service account, any directory"
sudo mkdir -p /srv/nocobase/my-app
sudo chown "$(id -u):$(id -g)" /srv/nocobase/my-app
```

Use the same service account for installation, status queries and PM2 management. The target must be new or empty; do not empty an existing deployment to install again.

### Install on the server

Upload the archive from the development machine, then switch to the server terminal to install:

```bash title="Development machine · application source directory my-app/"
scp storage/exports/dist.tar.gz deploy@server:/tmp/my-app.tar.gz
```

On the server, set the password variable and install. Replace `YOUR_SERVER_IP` with the actual server IP:

```bash title="Server · original service account, any directory"
read -r -s -p 'Initial admin password: ' MY_APP_ADMIN_PASSWORD
export MY_APP_ADMIN_PASSWORD
```

```bash title="Server · original service account, any directory"
npx --yes @nocobase/app-installer@beta install /srv/nocobase/my-app \
  --archive /tmp/my-app.tar.gz \
  --origin http://YOUR_SERVER_IP:13000 \
  --base-path /main \
  --host 0.0.0.0 \
  --port 13000 \
  --name nocobase-my-app \
  --dialect sqlite \
  --set app.sampleData=false \
  --set-from-env users.initialAdmin.password=MY_APP_ADMIN_PASSWORD \
  --json
```

```bash title="Server · original service account, any directory"
unset MY_APP_ADMIN_PASSWORD
```

The installer extracts the archive, initializes configuration, applies migrations and seeds, registers the PM2 process and starts the application. The initial administrator password applies only to an empty user table; it does not reset existing accounts.

`--set-from-env` reads the password variable from the current server terminal. Do not put passwords directly in `--set`.

### Configure the access URL

These examples listen directly on server port `13000`; allow it through the firewall or security group. `--origin` excludes the path, while `--base-path` sets it. The resulting URL is `http://YOUR_SERVER_IP:13000/main/`.

For a domain, HTTPS and a reverse proxy on the same server, replace the corresponding first-install flags with:

```text
--origin https://apps.example.com
--base-path /main
--host 127.0.0.1
--port 13000
```

The proxy must forward `/main/`, preserve Host and protocol headers, forward cookies and support WebSocket. The installer does not configure DNS or HTTPS.

### Check the installation

In the JSON result, `ok: true` means success, `result.started: true` means startup health passed, and `result.url` is the application entry. Sign in with `result.initialAdmin.username` and the password you set.

```bash title="Server · original service account, any directory"
npx --yes @nocobase/app-installer@beta status \
  --dir /srv/nocobase/my-app --json
```

Confirm `result.health.ok` is `true`, `result.process.status` is `online`, `result.node.matches` is `true`, and `result.pending` is `null`. Check the health endpoint on the server:

```bash title="Server · original service account, any directory"
curl --fail http://127.0.0.1:13000/main/api/healthz
```

After receiving `ok: true`, sign in through the browser and check page refreshes and user permissions. Use the real domain when configured. If access fails, query status on the server, then check DNS, proxy and network access.

### Configure startup and verify persistence

```bash title="Server · original service account, any directory"
pm2 startup
```

Run the system configuration command it prints, then save the process list:

```bash title="Server · original service account, any directory"
pm2 save
```

The installation directory contains:

```text
/srv/nocobase/my-app/
├── installer.json
├── app.env
├── config.yml
├── storage/
├── logs/
├── backups/
├── current -> releases/<release>/app
└── releases/
```

Configuration and data live outside releases. Create a business record and, if supported, upload a file. Then restart on the server:

```bash title="Server · original service account, any directory"
pm2 restart nocobase-my-app
```

Sign in again and confirm records, files and permissions survive and scheduled jobs continue. Application restart and recovery after a server reboot are separate checks; verify reboot recovery during a suitable maintenance window.

## Deploy a new version manually

### Build the new archive

```bash title="Development machine · application source directory my-app/"
pnpm build --target linux-x64 --node-version 24 --tar
```

The build replaces `storage/exports/dist.tar.gz`; save any old archive you need first. Read the target version’s migration and configuration change notes.

### Review status and the deployment plan

First upload the new archive from the development machine:

```bash title="Development machine · application source directory my-app/"
scp storage/exports/dist.tar.gz deploy@server:/tmp/my-app-new.tar.gz
```

Then run on the server:

```bash title="Server · original service account, any directory"
npx --yes @nocobase/app-installer@beta status \
  --dir /srv/nocobase/my-app --json
```

```bash title="Server · original service account, any directory"
npx --yes @nocobase/app-installer@beta upgrade \
  --dir /srv/nocobase/my-app \
  --archive /tmp/my-app-new.tar.gz --json
```

Deploy new versions with `upgrade` on the server. Omit first-install flags such as `--origin`, `--host`, `--port`, `--name` and `--set`; existing configuration persists.

When an update is needed, preflight returns `CONFIRMATION_REQUIRED` describing downtime, backup and migration effects. The old version is still running at this point. Repeating the same archive can return `success-noop`; a rebuilt archive with the same application version can still be a new release.

### Confirm backup coverage

After stopping the application, the installer backs up identifiable SQLite databases in the configuration, `config.yml` and `app.env`. Back up uploads, external databases and object storage separately. `--backup-done` only confirms an external database backup is complete; it does not perform a backup or restore.

This installer version checks configuration, pending migrations, and historical migration and seed checksums. For `CHECKSUM_REPAIR_REQUIRED`, review each change against version notes. Ordinary `--yes` does not authorize repair. Only after review, add `--repair-checksums <token>` matching the returned plan to the same command. The tool backs up before approved repairs and migrations; do not manually repair first to bypass preflight.

### Confirm and deploy

After reviewing the plan, backups and downtime, run on the server:

```bash title="Server · original service account, any directory"
npx --yes @nocobase/app-installer@beta upgrade \
  --dir /srv/nocobase/my-app \
  --archive /tmp/my-app-new.tar.gz --yes --json
```

The installer stops the application, backs up, applies migrations, switches releases, and starts and checks the application. Configuration, secrets and data persist; do not rerun `install` or `config init`.

The leading `npx --yes` only confirms obtaining the installer. The command’s trailing `--yes` authorizes this update. For external databases, complete their backups first, then add `--backup-done` to the selected command.

### Verify the new version

Run `status` for the same target again to confirm the new release and health, then sign in at the existing URL. Check old records, uploads, user permissions, new features and background jobs.

Record the source revision and archive checksum; retain old archives and backups. The installer keeps three releases by default, adjustable with `--keep`. A pruned release is no longer directly available for rollback.

## Deployment failures and rollback

Keep the error and logs, and run `status` for the same target to inspect the running release and `pending`. The installer may already have restored the old release: exit code `3` means the update failed and was rolled back; `4` means rollback also failed and the application is down. Read the JSON error and recovery suggestions rather than initializing again.

Preview rollback on the server:

```bash title="Server · original service account, any directory"
npx --yes @nocobase/app-installer@beta rollback \
  --dir /srv/nocobase/my-app --json
```

After reviewing the data impact:

```bash title="Server · original service account, any directory"
npx --yes @nocobase/app-installer@beta rollback \
  --dir /srv/nocobase/my-app --yes --json
```

Run the command without the trailing `--yes` first; execute the second only after reviewing it. If an update ran migrations or checksum repairs, rollback may restore the original SQLite backup and discard later business writes. External databases and uploads need separate recovery procedures. Consider `--no-restore` only after establishing compatibility between the old release and current database.

After an interruption, query `status` on the server and inspect the process and `pending`. Establish the state and follow the returned recovery guidance before attempting another deployment.

## Routine management

Run on the server as the original service account:

```bash title="Server · original service account, any directory"
# Process status
pm2 status nocobase-my-app

# Logs; press Ctrl+C to stop following
pm2 logs nocobase-my-app --lines 100

# Restart
pm2 restart nocobase-my-app

# Stop
pm2 stop nocobase-my-app

# Resume
pm2 restart nocobase-my-app
```

To change the public origin, listener or port, edit `app.env` in the installation directory, check port availability and update the proxy as needed. Restart the process, query status and verify the actual URL. Do not overwrite `current` or edit built files in an installed release.

## Troubleshooting

| Symptom | Next step |
| --- | --- |
| `PORT_IN_USE` | Choose a free port for this application and update the origin; do not stop unrelated processes. |
| `DRIVER_MISSING` | Add the target database driver in the application sources and rebuild the archive. |
| `START_FAILED` | Read the returned log path and installation `logs/`; check configuration, database and startup errors. |
| Healthy status but inaccessible application | Check listener, port, firewall, DNS and proxy; use the entry URL including the application path. |

Keep JSON `error.code`, `error.message` and `error.suggestions` for diagnosis. Do not print configuration files containing secrets.
