---
title: Deploy with PM2 (app-installer)
description: Install and update a production application with app-installer, with PM2 supervising the process and separate runtime configuration and data kept in place.
---

This guide uses the task application to walk through deployment, and it applies equally to your own NocoBase Core applications. First confirm the target environment with [Choose a deployment method](../deployment/choose-a-deployment-method.md); when deploying your own project, replace the example's application name, paths and business acceptance checks with your own.

The guide deploys the task application independently to your own production server, with PM2 supervising the application process. `@nocobase/app-installer` extracts the release archive, generates configuration, runs migrations, starts the PM2 process and checks health, and later application upgrades also go through it.

Before deploying, make sure the application has passed its tests; for the task example's test steps, see [Build your first app](build-your-first-app-agent-first.md). The rest of this guide uses a single instance, SQLite, Linux x64/glibc and Node.js 24, with the application path `/tasks`. For other databases, install the corresponding driver in the source project first and rebuild.

## Prerequisites

Keep the source, Node.js and the pnpm version the project requires on the development machine. The server needs Node.js 24, a globally installed pm2 (4.3 or later), tar, and a writable deployment directory. Commands in this guide use Bash.

Check on the server:

```bash
node --version
node -p "process.platform + '-' + process.arch"
command -v pm2
command -v tar
```

If pm2 is missing, have the server maintainer install it with `npm install -g pm2` first. The deployment belongs to one fixed service account, which is also used for later management. Have an administrator prepare a writable empty directory for that account in advance; without write access to `/srv`, a local rehearsal can use `$HOME/tasks` instead, replacing every later `--dir` accordingly.

The example directory in this guide is `/srv/nocobase/tasks`, and the listening address is `127.0.0.1:13000`. The production URL `https://tasks.example.com/tasks/` is served by a reverse proxy on the server; prepare the domain and HTTPS, and keep the forwarded path and WebSocket upgrade headers. For a rehearsal on your own machine only, change the origin to `http://127.0.0.1:13000`. First make sure no other application uses the port; when deploying several applications, give each its own directory, port and pm2 process name.

The machine running `npx` needs access to the npm registry. If the server has no internet access, use `deploy --ssh` on the development machine: the tool transfers the installer and the archive, and the server does not need npm access.

## With an Agent

In the application's source directory, give the Agent a clear target:

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

Replace the placeholders with the actual target. The Agent can run `deploy --ssh` on the development machine, and the server does not need an Agent, the source or the project's dependencies. The tool transfers the installer and the application archive over SSH, but the server still needs Node.js, pm2 and tar in advance.

## Without an Agent

### 1. Build on the development machine

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

This produces `storage/exports/dist.tar.gz`. You can run `sha256sum storage/exports/dist.tar.gz` to record the digest of this release archive. The target and the Node major version must both match the server; ARM or musl environments use the corresponding target. The archive already contains the production dependencies, so do not run `pnpm install` for it on the server.

### 2. Choose local installation or SSH deployment

Both options use the same archive; choose one.

**A. Work on the server**

First copy the archive from the development machine:

```bash
scp storage/exports/dist.tar.gz deploy@server:/tmp/tasks.tar.gz
```

Then sign in to the server as the deployment service account and install:

```bash
read -r -s -p 'Initial admin password: ' TASK_INITIAL_PASSWORD
export TASK_INITIAL_PASSWORD

npx --yes @nocobase/app-installer@beta install /srv/nocobase/tasks \
  --archive /tmp/tasks.tar.gz \
  --origin https://tasks.example.com \
  --base-path /tasks \
  --host 127.0.0.1 \
  --port 13000 \
  --name nocobase-tasks \
  --set app.sampleData=false \
  --set-from-env users.initialAdmin.password=TASK_INITIAL_PASSWORD \
  --json

unset TASK_INITIAL_PASSWORD
```

**B. Deploy over SSH from the development machine**

Set up SSH key-based sign-in in advance, and verify the server's host key fingerprint through a trusted channel. The installer uses non-interactive connections and checks host keys strictly; first confirm on the development machine that the following command runs directly:

```bash
ssh deploy@server 'node --version && command -v pm2 && command -v tar'
```

If these tools are only available in an interactive terminal, fix the account's PATH for non-interactive SSH first. When using a non-default port, key or configuration file, add `--ssh-port`, `--ssh-identity` or `--ssh-config`; later status and update commands need the same options.

Run the following command on the development machine. `--archive` points to a file on the development machine, and `--dir` is an absolute path on the server:

```bash
read -r -s -p 'Initial admin password: ' TASK_INITIAL_PASSWORD
export TASK_INITIAL_PASSWORD

npx --yes @nocobase/app-installer@beta deploy \
  --ssh deploy@server \
  --dir /srv/nocobase/tasks \
  --archive storage/exports/dist.tar.gz \
  --origin https://tasks.example.com \
  --base-path /tasks \
  --host 127.0.0.1 \
  --port 13000 \
  --name nocobase-tasks \
  --set app.sampleData=false \
  --set-from-env users.initialAdmin.password=TASK_INITIAL_PASSWORD \
  --json

unset TASK_INITIAL_PASSWORD
```

Both first-install commands require the target directory to be new or empty. `--origin` does not include `/tasks`; the application path is set separately with `--base-path`. By default the application only listens on the loopback address; if you intend to access it directly through the server's IP and port, set `--host 0.0.0.0`, the matching origin and network access rules explicitly.

`--set-from-env` reads environment variables on the machine running the installer; with SSH, the value is passed over the encrypted connection, so you do not need to export it again on the server. The initial password only takes effect when the administrator is created in a new database, and cannot reset an existing account.

`npx --yes` only skips the prompt when downloading the tool; it does not mean you agree to later upgrades or rollbacks. Never put a password in `--set`.

### 3. Check the installation result

First confirm that the returned JSON has `ok: true` and `status: "success"`. `result.started: true` means the application has started and passed its health check, and `result.url` is the configured application entry. Sign in with `result.initialAdmin.username` and the password you just set; with a custom password, `result.initialAdmin.defaultPassword` should be `false`.

Check the status on the server:

```bash
npx --yes @nocobase/app-installer@beta status \
  --dir /srv/nocobase/tasks --json
```

To check a remote installation from the development machine, add `--ssh deploy@server` to the same command. Check `result.health.ok`, `result.process.status`, `result.node.matches` and `result.pending`; the expected values are `true`, `online`, `true` and `null`.

Verify the health check and external access separately. On the server, run:

```bash
curl --fail http://127.0.0.1:13000/tasks/api/healthz
```

After configuring the reverse proxy, run the following from the development machine or the network users actually access the application from:

```bash
curl --fail https://tasks.example.com/tasks/api/healthz
```

Both should return `ok: true` with the application base path `/tasks`. Finally, open `https://tasks.example.com/tasks/` in a browser and check sign-in, page refreshes and task operations; for a local rehearsal, open the matching loopback address. If the SSH route returns `result.remote.publicHealth: false`, the development machine cannot reach the configured public URL; check DNS, the proxy and the network, and confirm the application's state on the server with status first.

The deployment directory on the server looks roughly like this:

```text
/srv/nocobase/tasks/
├── installer.json
├── app.env
├── config.yml
├── storage/
├── logs/
├── backups/
├── current -> releases/<release>/app
└── releases/
    └── <release>/app/
        ├── config.example.yml
        └── dist/
```

Configuration and data live outside the release directories and are shared by every version. The current getting-started example initializes the task roles through required seeds; tasks, team users and role assignments from the development environment are not copied with the archive, and need to be configured after deployment or migrated separately. Do not overwrite `current` by hand or modify installed release files.

### 4. Verify supervision and persistence

1. On the task page, create a task, mark it complete and refresh, and confirm the state is kept.
2. Configure an ordinary read-only member following the permission notes in [Build your first app](build-your-first-app-agent-first.md), and verify that this member can view but not change tasks.
3. On the server, run `pm2 restart nocobase-tasks` as the same service account. If you set `--name` during installation, use the actual process name.
4. Open the application again and confirm that the task and its state are still there.
5. Configure recovery at boot following `nextCommands` in the installation result. The installer has already saved the pm2 process list; run `pm2 startup` as the same service account, then run the system command it prints. With SSH deployment, these commands also run on the server.

Restarting the application process and recovering after the server boots are two separate checks. Configuring pm2 also does not configure the domain, HTTPS or the reverse proxy for you.

## Publish a new release

After the business change has been made and verified, rebuild the archive on the development machine and publish it to the existing installation directory. For an overview of the update flow, see [Publish an application release](../deployment/publish-app-release.md).

### With an Agent

In the application's source directory, give a clear target:

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

### Without an Agent

**1. Keep the old archive and rebuild.** `pnpm build --tar` regenerates `storage/exports/dist.tar.gz`, so copy any old archive you want to keep somewhere else first. Then run the following in the source project:

```bash
pnpm build --target linux-x64 --node-version 24 --tar
sha256sum storage/exports/dist.tar.gz
```

**2. Review the update plan.** Use the same method as the original deployment.

To update on the server, first copy the new archive from the development machine:

```bash
scp storage/exports/dist.tar.gz deploy@server:/tmp/tasks-new.tar.gz
```

Then run the following on the server as the original deployment account:

```bash
npx --yes @nocobase/app-installer@beta status \
  --dir /srv/nocobase/tasks --json

npx --yes @nocobase/app-installer@beta upgrade \
  --dir /srv/nocobase/tasks --archive /tmp/tasks-new.tar.gz --json
```

To update over SSH from the development machine, use the local archive and the remote installation directory:

```bash
npx --yes @nocobase/app-installer@beta status \
  --ssh deploy@server --dir /srv/nocobase/tasks --json

npx --yes @nocobase/app-installer@beta deploy \
  --ssh deploy@server \
  --dir /srv/nocobase/tasks \
  --archive storage/exports/dist.tar.gz \
  --json
```

`deploy` decides between first installation and update based on whether the directory contains `installer.json`. For an existing installation, do not pass first-install options such as `--origin`, `--base-path`, `--host`, `--port`, `--name` or `--set` again. Deploying the same archive again returns `success-noop`.

When there is an update, the non-interactive preflight returns `CONFIRMATION_REQUIRED` together with notes on downtime, backup and migrations, while the old version keeps running. The leading `npx --yes` only confirms fetching the installer; it does not confirm the update.

This example was verified with installer `0.1.0-beta.9`, which checks the configuration, pending migrations and historical checksums through the new CLI. For the due-date example, the result was **1 new migration and 0 checksum repairs**. If you see unexpected migrations or checksum changes, check the source and release notes first; do not bypass the check by resetting the database or repairing blindly.

**3. Confirm and apply.** After reviewing the update plan, backups and downtime, append the installer's own `--yes` to the `upgrade` or `deploy` command you chose. For example, on the server:

```bash
npx --yes @nocobase/app-installer@beta upgrade \
  --dir /srv/nocobase/tasks \
  --archive /tmp/tasks-new.tar.gz --yes --json
```

The installer stops the application, backs up SQLite, `config.yml` and `app.env`, runs migrations and switches the release, then starts the application and checks health. The existing configuration, secrets and `storage/` keep being used; do not rerun `install` or `config init`.

The automatic backup does not include uploaded files and does not cover external databases; back those up separately when you use them. The `--backup-done` flag required for external databases only confirms that you have made a backup; it neither makes nor restores one for you.

**4. Verify old and new data.** Run `status` again against the same target to confirm the new release and its health, then sign in at the original URL. For the due-date example:

- Old tasks keep their IDs, titles, assignees and completion states, and their due date shows as "not set".
- New tasks can have a date that survives refreshes and completing or reopening; tasks can still be created without a date.
- The existing read-only member can see the new dates but cannot create or complete tasks.
- After restarting the same application in the rehearsal environment, all of the above data and permissions remain.

This rehearsal kept the application version number and distinguished releases by build time; the installer supports updating to a rebuild of the same version. For real releases, record the corresponding source commit and archive digest, or increment your own application's version number.

### Update failure and rollback

First keep the error result and logs, and use `status` to check the current release, its health and any unfinished operation; do not reinitialize or redeploy right away.

When you need to roll back, review the rollback plan first:

```bash
npx --yes @nocobase/app-installer@beta rollback \
  --dir /srv/nocobase/tasks --json
```

This example ran a database migration, so the default rollback restores the SQLite backup from before the upgrade and can lose tasks and other writes made after the upgrade. Add `--yes` and run it only after confirming that this impact is acceptable and saving any data you need to keep. Switching the code version does not undo migrations; external databases and uploaded files still need their own recovery procedures.

## Troubleshooting

| Symptom | Next step |
| --- | --- |
| `PORT_IN_USE` | Find out which process owns the port, choose a free port for this application and update the origin as well; do not stop unrelated applications. |
| SSH sign-in fails, or Node / pm2 cannot be found | First verify the non-interactive SSH command above, the host fingerprint and PATH, then retry. |
| `START_FAILED` | Read the log path in the error result and `logs/` in the deployment directory, and check configuration, database and startup errors. |
| `REMOTE_STATE_UNKNOWN` | The remote operation may still be running; run status against the same target first, and do not redeploy right away. |

Read `error.code`, `error.message` and `error.suggestions` in the JSON instead of guessing from the exit code alone, and never paste secrets from configuration files into troubleshooting logs.

The original template `.77` rehearsal used `@nocobase/app-installer@0.1.0-beta.9` for a local installation into a new directory, and for real transfer, installation and status checks through an isolated local SSH endpoint. Both routes verified that the custom password works, the default password is rejected, the task and permission tests pass, and the same record survives a restart; port conflicts and repeated deployment were verified as well. The due-date example also verified a new migration on an existing SQLite database, preservation of old tasks and roles, unchanged configuration, and a restart after the update. Cross-host networking, a production domain behind a proxy, recovery at server boot, failure recovery and release rollback were not exercised in this rehearsal.

The deployment records and screenshots in this guide come from that earlier rehearsal; they do not mean the current `1.0.0-beta.81` npm example has been deployed and verified again.
