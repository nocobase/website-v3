---
title: Configuration reference
description: Look up Studio config.yml fields, upload limits, and environment variables.
---

Keep Studio settings in the deployment directory’s `config.yml`, mounted at `/app/config.yml` in the container. See [Deploy Studio](../setup/install.md) to extract the template from the supplied image.

## Use config.yml

Merge settings into existing sections without duplicate keys. Put passwords and keys in their corresponding fields and restrict file access. Recreate the Studio container after changes:

```bash
docker compose up -d --force-recreate studio
```

## Application address and interface

| Field | Meaning |
| --- | --- |
| `app.publicOrigin` | Public scheme, host, and port without a path, such as `https://studio.example.com`; used for callbacks, email links, and push |
| `app.sampleData` | Load sample data on first installation; use `false` for an empty deployment |
| `client.app.title` | Application name shown in the UI; values under `client` are public, so never put credentials there |
| `i18n.defaultLocale` | Default interface language; English when omitted |

Studio uses `/main` by default. Connect runtimes and the CLI with the full URL, such as `https://studio.example.com/main/`.

## Database

| Field | Meaning |
| --- | --- |
| `database.default` | Default connection name, normally `main` |
| `database.connections.main.dialect` | Database dialect; the template defaults to `sqlite`, while the deployment guide uses `postgres` |
| `database.connections.main` | Connection fields include `host`, `port`, `database`, `username`, `password`, and `ssl` for TLS |
| `database.connections.main.schemaManagement` | Use `managed` for the Studio database |
| `database.connections.main.migrations.autoRun` | Set to `true` to run migrations on startup |
| `database.connections.main.seeds.autoRun` | Set to `true` to run database seeds on startup |

See [Deploy Studio](../setup/install.md) for a complete PostgreSQL example. For an existing database, use its host, port, and credentials.

We recommend disabling JIT on the PostgreSQL server. See [Start the services](../setup/install.md#start-the-services) for configuration steps.

## Administrator and sign-in

| Field | Meaning |
| --- | --- |
| `users.initialAdmin` | Initial administrator `username`, `email`, and `password`; created only when the user table is empty. Later changes do not reset existing accounts |
| `auth.emailAndPassword.enabled` | Enable password sign-in |
| `auth.emailAndPassword.disableSignUp` | Set to `true` to disable self-registration for a team deployment |
| `auth.emailAndPassword.autoSignIn` | Sign in automatically after registration; `false` in the deployment example |
| `auth.passwordReset.enabled` | Enable password recovery; requires a mailer and the correct `app.publicOrigin` |
| `auth.session.storeSessionInDatabase` | The template uses `true` to store sign-in sessions in the database |

## Encryption keys

| Field | Meaning |
| --- | --- |
| `secrets.keys` | Ordered list of `version` and `key` entries; the first encrypts new data, and the others decrypt existing data |

Generate a key with `openssl rand -hex 32`. Back up the entire `secrets.keys` list; losing keys prevents decryption of stored credentials. Changing the current key invalidates sign-in sessions. Keep old keys until their data has been re-encrypted.

## File storage and upload limits

| Field | Meaning |
| --- | --- |
| `drive.default` | Default file disk, `local` by default |
| `drive.disks.<name>` | Disk driver, location, and credentials; supports `fs` and `s3` |
| `drive.disks.<name>.maxFileSizeMb` | Single-file upload limit for the disk, in MiB; defaults to `20` and must be a positive integer |

`maxFileSizeMb` applies to task, comment, and Agent conversation attachments on their destination disk. Restart Studio and reload the page after changes. Increase the reverse proxy limit with room for the multipart form; a configured `api.bodyLimit` must also accommodate the request. See [File and artifact storage](storage.md) for driver examples.

## API request limits

| Field | Meaning |
| --- | --- |
| `api.bodyLimit` | API request body limit, such as `60mb`; the global limit is off by default, but routes may impose their own limits |
| `api.timeout` | Handler timeout, such as `30s`; off by default, and does not cut off a streaming response that has started |
| `api.rateLimit` | Optional `max` and `window`, such as `600` requests per `1m`; counted per process and client connection address |

Behind a reverse proxy, requests may share the proxy’s address and rate-limit budget. Account for this when setting `api.rateLimit`.

## Email and notifications

| Field | Meaning |
| --- | --- |
| `mailers.default` | Default mailer name, such as `system` |
| `mailers.<name>` | SMTP: `provider: smtp`, `host`, `port`, `secure`, `auth.user`, `auth.pass`, and `from`. Resend: `provider: resend`, `apiKey`, and `from` |
| `users.invitations.mailer` | Invitation mailer; falls back to `mailers.default` |
| `auth.passwordReset.mailer` | Password reset mailer; falls back to `mailers.default` |
| `notification.channels` | Use `type: in-app` for inbox channels and `type: email` for email channels, optionally selecting a `mailer`. Mailer configuration does not create notification channels |
| `push.privateKey`, `push.contact` | Push private key and contact address; requires HTTPS |

Invitations and password resets share the default mailer. Password recovery also needs `auth.passwordReset.enabled`. See [Notifications and push](../admin/notifications.md) for SMTP, Resend, and delivery checks.

## Agents and run records

| Field | Meaning |
| --- | --- |
| `studio.agents.queuedExpiryHours` | Queued work expiry, `24` hours by default; `0` waits indefinitely |
| `studio.agents.managerIdleMinutes` | Lead Agent idle recovery threshold, `15` minutes by default; `0` disables recovery |
| `studio.agents.managerIdleSweepMinutes` | Idle check interval, `5` minutes by default; must be positive |
| `agents.runs.retentionDays` | Retention for completed run events and prompt snapshots, `14` days by default; `0` keeps them |
| `agents.conversations.archivedRetentionDays` | Archived conversation retention, `30` days by default; `0` keeps them |
| `agents.skills.disk` | Disk for skill contents; defaults to `drive.default` |

## Git platforms

| Field | Meaning |
| --- | --- |
| `studio.git.apiBaseUrls` | Override self-hosted code platform API URLs by hostname; omit when the default URL works |

Configure Git connections and authorization in the UI. See [Code hosts](../configure/git.md).

## Previews and release artifacts

| Field | Meaning |
| --- | --- |
| `releases.artifact` | Artifact storage; defaults to `/app/storage/releases/artifacts`, independently of `drive.default` |
| `releases.maxArtifactSizeMB` | Release artifact size limit, `256` MiB by default; separate from attachment `maxFileSizeMb` |
| `releases.host.memoryBudget` | `targetRatio` defaults to `0.7`, `appMemoryMb` to `320`, and `reserveMb` to `0`; size for application peaks and server resources |
| `releases.host.maxActiveApps` | Optional active application limit; memory checks still apply |
| `releases.host.launchPrefix` | Command prefix for preview processes; can switch to a system user that cannot read Studio configuration |
| `releases.docker` | Set `enabled: true` for Docker runtimes; configure a fixed ingress port and reverse proxy |
| `studio.releases.previewPublicUrl` | Separate preview origin, such as `https://studio-preview.example.com/{appId}/` |
| `studio.releases.previewEnvironment` | Set to `false` to skip automatic preview environment creation |

Use a separate origin for previews and a system user that cannot read Studio configuration. See [Hosted environments](../admin/environments.md) for runtime options. Your team manages production deployments.

## Logging

| Field | Meaning |
| --- | --- |
| `logging.level` | Log level, `info` in the template |
| `logging.file` | File logging `enabled` flag; template limits: `retentionDays: 7`, `maxFileSizeMB: 10`, `maxTotalSizeMB: 500` |
| `logging.loggers.request.file.name` | Request log filename, `request` in the template |
| `logging.console` | Console `enabled` and `pretty` options; the template disables pretty output |

## Environment variables

Deployment platforms can inject the environment variables explicitly supported by Studio. These override their corresponding `config.yml` fields. Keep fields without a mapping in the file.

Compose uses `.env` for variable substitution in its own configuration; it does not automatically pass those values to Studio. Declare them in `services.studio.environment` or `env_file`. `${NAME}` is not expanded inside `config.yml`.

| Environment variable | config.yml field or purpose |
| --- | --- |
| `APP_PUBLIC_ORIGIN` | `app.publicOrigin` |
| `APP_SAMPLE_DATA` | `app.sampleData` |
| `INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | `users.initialAdmin.username` / `email` / `password` |
| `SECRETS_KEYS` | `secrets.keys` — `2:<new-key>,1:<old-key>` |
| `DB_DIALECT` / `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` / `DB_SSL` / `DB_FILENAME` | `database.connections.main.dialect` / `host` / `port` / `database` / `username` / `password` / `ssl` / `filename` |
| `MAILERS_DEFAULT` | `mailers.default` |
| `MAILERS_SYSTEM_PROVIDER` / `MAILERS_SYSTEM_HOST` / `MAILERS_SYSTEM_PORT` / `MAILERS_SYSTEM_SECURE` | `mailers.system.provider` / `host` / `port` / `secure` |
| `MAILERS_SYSTEM_USER` / `MAILERS_SYSTEM_PASSWORD` | `mailers.system.auth.user` / `auth.pass` |
| `MAILERS_SYSTEM_API_KEY` | `mailers.system.apiKey` |
| `MAILERS_SYSTEM_FROM` / `MAILERS_SYSTEM_REPLY_TO` / `MAILERS_SYSTEM_ENABLED` | `mailers.system.from` / `replyTo` / `enabled` |
| `WEB_PUSH_PRIVATE_KEY` | `push.privateKey` |
| `API_BODY_LIMIT` / `API_TIMEOUT` | `api.bodyLimit` / `api.timeout` |
| `STUDIO_MANAGER_IDLE_MINUTES` / `STUDIO_MANAGER_IDLE_SWEEP_MINUTES` | `studio.agents.managerIdleMinutes` / `managerIdleSweepMinutes` |
| `RELEASES_HOST_ENABLED` | `releases.host.enabled` |
| `APP_CONFIG_FILE` | Configuration path read at startup; `/app/config.yml` in the supplied image |
| `APP_BASE_PATH` | Mount path set at startup; `/main` in the supplied image |
| `APP_SERVER_HOST` / `APP_SERVER_PORT` | Listener address and port; `0.0.0.0` / `13000` in the supplied image |
