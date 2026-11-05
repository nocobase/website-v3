---
title: Deploy with PM2
description: Have an Agent install the app with app-installer and verify PM2 supervision, access and data persistence.
---

## Prepare the app and server

<a id="prerequisites"></a>

Keep tested source, the lockfile and pnpm on the development machine. The server needs Node.js 24, PM2 4.3 or later on PATH, tar and a new directory writable by a fixed service account. Use that account for installation and later management.

Match OS, CPU and libc to the build target, with the database driver included in the app. Provide a free port, URL, database and file storage plan. Configure the reverse proxy and HTTPS in the server environment.

The machine running npx needs registry access. SSH deployment transfers the installer and archive; the target needs no source, Agent or online dependency installation.

## Tell the Agent what to deploy

<a id="with-an-agent"></a>

Provide the target in the application source directory:

```prompt
Use app-installer to deploy this app for the first time to <SSH server> in <new installation directory>, supervised by PM2 and accessible at <URL>. Use a new database with separate configuration and file storage. Explain the runtime configuration and deployment plan, and wait for my confirmation before installing.
```

Supply administrator and database credentials securely. For existing data, specify the backup and restore target.

## Confirm the installation directory and runtime configuration

Check the server, service account, new directory, unique PM2 name, port, Node version, artifact digest and data locations. `--origin` excludes the application path; `--base-path` sets it separately. Loopback is the default bind address, with the proxy providing public access.

SSH uses non-interactive login and strict host-key checking. Verify the host fingerprint and that the account's non-interactive PATH includes Node, PM2 and tar.

## Have the Agent deploy with app-installer

Have the Agent build a matching archive, compare its digest after transfer, then install in the new directory, initialize configuration and migrations, start PM2 and check health. This guide pins installer beta.10 and does not require upgrading the app template.

`config.yml`, `app.env`, `storage/`, logs and backups live outside versioned releases; `current` points to the active release. Later updates use this installation directory rather than starting another first installation.

## Verify access and process supervision

<a id="verification-scope"></a>

Expect installation `ok: true` and `result.started: true`. In status, check `result.health.ok`, `result.process.status`, `result.node.matches` and `result.pending`: expect `true`, `online`, `true` and `null`.

Sign in through the actual URL and check business reads, writes and permissions. Keep a record ID and file; see the [example instructions](https://github.com/nocobase/docs-examples-v3/blob/51658852e7290b0ed3c0735d2856681850560efb/apps/product-catalog/README.md#create-and-publish) for Product Catalog. Restart only this app's PM2 process, then verify the same record, file and permissions.

The installer saves the process list. For boot recovery, the service account still needs to follow `nextCommands`, run `pm2 startup` and its printed system command, then test a machine reboot when downtime is allowed. SSH `result.remote.publicHealth: false` requires checking the public address's DNS, proxy and network.

## Manual deployment reference

<a id="without-an-agent"></a>
<a id="1-build-on-the-development-machine"></a>
<a id="2-choose-local-installation-or-ssh-deployment"></a>
<a id="3-check-installation-and-access"></a>
<a id="4-verify-supervision-and-persistence"></a>
<a id="with-an-agent-1"></a>
<a id="without-an-agent-1"></a>

These examples use Bash, Linux x64/glibc, Node.js 24 and SQLite. On the server check `node --version`, `command -v pm2` and `command -v tar`; have the maintainer prepare PM2. Build in the app directory on the development machine:
```bash
pnpm build --target linux-x64 --node-version 24 --tar
sha256sum storage/exports/dist.tar.gz
```

The resulting `storage/exports/dist.tar.gz` includes runtime dependencies. Copy it to `/tmp/my-app.tar.gz` on the server. As the service account, install into a new directory; replace `/srv` with an account-owned writable location if necessary:
```bash
read -r -s -p 'Initial admin password: ' APP_INITIAL_PASSWORD
export APP_INITIAL_PASSWORD
npx --yes @nocobase/app-installer@0.1.0-beta.10 install /srv/nocobase/my-app \
  --archive /tmp/my-app.tar.gz --origin http://127.0.0.1:13000 \
  --base-path /shop --host 127.0.0.1 --port 13000 --name nocobase-my-app \
  --set app.sampleData=false \
  --set-from-env users.initialAdmin.password=APP_INITIAL_PASSWORD --json
unset APP_INITIAL_PASSWORD
```

Initial administrator settings apply only to an empty user table. Check the returned username; a custom password should make `result.initialAdmin.defaultPassword` false. Check status and restart:
```bash
npx --yes @nocobase/app-installer@0.1.0-beta.10 status --dir /srv/nocobase/my-app --json
curl --fail http://127.0.0.1:13000/shop/api/healthz
pm2 restart nocobase-my-app
```

For SSH installation from the development machine, replace `install /srv/nocobase/my-app` with `deploy --ssh deploy@server --dir /srv/nocobase/my-app`, and use the local archive path. First check `ssh deploy@server 'node --version && command -v pm2 && command -v tar'`. Use `--ssh-port`, `--ssh-identity` or `--ssh-config` for custom connections, including later status commands.

`--set-from-env` reads the variable on the initiating machine and transfers it over encrypted SSH. The leading `npx --yes` accepts tool download; the installer's own `--yes` confirms an update or rollback plan.

Continue with [Updates and recovery](publish-app-release.md) and [Maintenance and troubleshooting](maintenance-and-troubleshooting.md).

<a id="publish-a-new-release"></a>
<a id="failure-and-rollback"></a>

[Updates and recovery](publish-app-release.md)

> [!NOTE]
> The beta.85 example was checked locally with Node.js 24, PM2 6.0.14, installer beta.10 and SQLite: installation, native sign-in, business writes and restart persistence. SSH, public proxy/TLS and host reboot recovery remain unverified.
