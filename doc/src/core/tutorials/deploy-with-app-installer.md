---
title: Deploy with app-installer
description: Install an archive on your server with pm2 supervision and persistent configuration and data.
---

This guide uses the task application as a worked example and also applies to your own NocoBase Core apps. Confirm the target environment with [Choose a deployment method](../deployment/choose-a-deployment-method.md). For your own project, replace example application names, paths, and business acceptance checks.

`@nocobase/app-installer` extracts a release archive, prepares configuration, applies migrations, starts pm2 and checks health. It also manages subsequent application updates.

Verify your application has passed its tests; see [Build your first app](build-your-first-feature.md) for the task example. This guide uses a single instance, SQLite, Linux x64/glibc, Node.js 24 and base path `/tasks`. Other database dialects require the appropriate driver in the source application and a new build.

## Prerequisites

Keep source and pnpm on the development machine. The server needs Node.js 24, globally available pm2 4.3 or later, `tar` and an empty writable installation directory owned by a fixed service account. Commands below use Bash.

```bash
node --version
node -p "process.platform + '-' + process.arch"
command -v pm2
command -v tar
```

If necessary, the server maintainer installs pm2 with `npm install -g pm2`. Use the same service account for later operations. This example uses `/srv/nocobase/tasks`; for a local rehearsal, use `$HOME/tasks` and adjust every directory argument.

The app listens on `127.0.0.1:13000`. A separately configured reverse proxy provides `https://tasks.example.com/tasks/`, preserving the base path and WebSocket upgrades. For a local rehearsal, use origin `http://127.0.0.1:13000`. Confirm the port is free. The machine running `npx` needs registry access; an offline target can receive the installer and artifact over SSH from the development machine.

## With an agent

```text
Please use app-installer to deploy the current task app to this server for the first time.

Server: <my SSH server alias>
Installation directory: /srv/nocobase/tasks, using a new directory and SQLite database
Server environment: Linux x64/glibc, Node.js 24
Application listens on: 127.0.0.1:13000
User-facing URL: https://tasks.example.com/tasks/

Follow the project's deployment guidance, check the target and prerequisites, then prepare and install the application.
Operate only on this tutorial app, without importing development data or adding sample tasks.
Set up administrator sign-in, read my supplied password securely, and keep passwords and secrets out of output and code.

Verify sign-in, task operations and read-only member permissions.
Restart this application and check that created tasks and permissions survive.
Report the URL, verification results and any environment setup I still need to handle.
```

Replace the placeholders with the actual authorized target. The server does not need an Agent, source tree or development dependencies.

## Without an agent

### 1. Build on the development machine

```bash
pnpm build --target linux-x64 --node-version 24 --tar
sha256sum storage/exports/dist.tar.gz
```

The archive includes production dependencies. Its platform, libc and Node major must match the server. Do not run `pnpm install` on the server for this archive installation.

### 2. Choose local installation or SSH deployment

**A. Run the installer on the server.** Copy the archive from the development machine:

```bash
scp storage/exports/dist.tar.gz deploy@server:/tmp/tasks.tar.gz
```

Then, as the service account on the server:

```bash
read -r -s -p 'Initial admin password: ' TASK_INITIAL_PASSWORD
export TASK_INITIAL_PASSWORD

npx --yes @nocobase/app-installer@beta install /srv/nocobase/tasks \
  --archive /tmp/tasks.tar.gz \
  --origin https://tasks.example.com \
  --base-path /tasks --host 127.0.0.1 --port 13000 \
  --name nocobase-tasks \
  --set app.sampleData=false \
  --set-from-env users.initialAdmin.password=TASK_INITIAL_PASSWORD \
  --json

unset TASK_INITIAL_PASSWORD
```

**B. Deploy over SSH from the development machine.** Configure key-based login and verify the host key through a trusted channel. Check the non-interactive account PATH:

```bash
ssh deploy@server 'node --version && command -v pm2 && command -v tar'
```

Then run locally:

```bash
read -r -s -p 'Initial admin password: ' TASK_INITIAL_PASSWORD
export TASK_INITIAL_PASSWORD

npx --yes @nocobase/app-installer@beta deploy \
  --ssh deploy@server --dir /srv/nocobase/tasks \
  --archive storage/exports/dist.tar.gz \
  --origin https://tasks.example.com \
  --base-path /tasks --host 127.0.0.1 --port 13000 \
  --name nocobase-tasks \
  --set app.sampleData=false \
  --set-from-env users.initialAdmin.password=TASK_INITIAL_PASSWORD \
  --json

unset TASK_INITIAL_PASSWORD
```

`--archive` is local to the development machine; `--dir` is an absolute server path. Use `--ssh-port`, `--ssh-identity` or `--ssh-config` when needed, including on subsequent commands. The tool transfers the installer and archive; the server still needs Node.js, pm2 and tar.

Both first-install routes require a new or empty directory. The origin excludes `/tasks`; the base path is separate. `--set-from-env` reads the password on the machine executing the installer and transfers it over encrypted SSH when applicable. Initial credentials only affect an empty user table. The leading `npx --yes` accepts tool download, not future update or rollback plans.

### 3. Check installation and access

Expect JSON `ok: true`, `status: "success"`, and `result.started: true`. Use the returned application URL, initial username and your configured password. A custom password should produce `result.initialAdmin.defaultPassword: false`.

```bash
npx --yes @nocobase/app-installer@beta status \
  --dir /srv/nocobase/tasks --json
curl --fail http://127.0.0.1:13000/tasks/api/healthz
```

For remote status, add `--ssh deploy@server`. Check health is true, process status is `online`, Node matches, and no operation is pending. Once the proxy is ready, also test `https://tasks.example.com/tasks/api/healthz` and sign in through the real public URL. Server-local health does not verify DNS, TLS or the proxy. `result.remote.publicHealth: false` means the initiating machine could not reach the configured public endpoint.

The installer keeps `installer.json`, `app.env`, `config.yml`, `storage/`, logs and backups outside versioned `releases/`. `current` points to the active release. Do not manually overwrite the installed release or symlink. The current getting-started example initializes task roles through required seeds. Development tasks, team users, and role assignments are not copied with the archive; configure or migrate them separately.

### 4. Verify supervision and persistence

Create and complete a task, refresh, and test a read-only user. Restart only this app with `pm2 restart nocobase-tasks`, using the same service account, then verify the same record and state survive. Follow the installation result's `nextCommands` to configure boot recovery with `pm2 startup` and its printed system command. Process restart and machine reboot recovery are separate checks.

## Publish a new release

See [Publish an application release](../deployment/publish-app-release.md) for an overview of the update process. Keep old artifacts and source revisions. Build a new archive, then inspect status and the update plan.

### With an agent

```text
Please publish the verified new task application to the existing tutorial environment.

Server: <my SSH server alias>
Existing installation directory: /srv/nocobase/tasks
Continue using app-installer and preserve the database, configuration, sign-in secrets and uploaded files.

Before updating, inspect the current version and tasks, prepare a backup and retain the previous version.
Explain data changes, expected downtime and recovery if the update fails.
If previously applied data changes have been rewritten, investigate before attempting repairs or skipping checks.
Do not treat the update as a fresh installation or clear existing data.

Verify that old assignees, completion states and reader permissions survive, and that the new feature works.
Restart and check again. Operate only on this tutorial application and report the actual results.
```

### Without an agent

Build and copy the new archive as above. On the server, inspect the plan without the installer's confirmation flag:

```bash
npx --yes @nocobase/app-installer@beta upgrade \
  --dir /srv/nocobase/tasks --archive /tmp/tasks-new.tar.gz --json
```

From the development machine, use `deploy --ssh` with the existing directory and new local archive. Do not repeat first-install options such as origin, port or `--set`. The installer recognizes an existing `installer.json`; an identical artifact returns `success-noop`.

A pending update returns `CONFIRMATION_REQUIRED` with downtime, backup and migration details while the old app remains running. Review these before adding the installer's own `--yes`:

```bash
npx --yes @nocobase/app-installer@beta upgrade \
  --dir /srv/nocobase/tasks --archive /tmp/tasks-new.tar.gz --yes --json
```

The rehearsed installer, `0.1.0-beta.9`, reported one new due-date migration and zero checksum repairs. Unexpected migration/checksum changes require investigation, not a database reset. The installer stops the app, backs up SQLite and configuration, migrates, switches the release and verifies health. Uploads and external databases require separate backups; `--backup-done` acknowledges a backup rather than creating one.

Check status and both old and new data afterward. Old dates remain unset; new dates persist through refresh and completion changes. Reader permissions and restart persistence must survive. Record the source commit and artifact digest; an application version alone does not identify a rebuild.

### Failure and rollback

Preserve errors and inspect status, logs, current release and pending operations before retrying. Inspect a rollback plan with:

```bash
npx --yes @nocobase/app-installer@beta rollback --dir /srv/nocobase/tasks --json
```

Only confirm after reviewing data loss and recovery. In the rehearsed SQLite migration case, rollback restores the pre-update database backup and can discard later writes. External databases and uploads have separate recovery procedures.

## Verification scope

The original template `.77` rehearsal used installer `0.1.0-beta.9`: local installation, real transfer through an isolated local SSH endpoint, custom-password login, default-password rejection, task permissions, restart persistence, port conflicts, repeat deployment and a due-date update preserving existing data/configuration. Cross-host networking, public TLS/proxy setup, machine boot recovery and rollback were not exercised. The current `.81` npm example has not been redeployed through these routes in this documentation review.
