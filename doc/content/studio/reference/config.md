---
title: Configuration options
description: "Studio's config.yml and environment variables: the public address, encryption key, first administrator, database, language and sign-in, email and push, multiple instances, release management, and logging."
---

Studio's configuration lives in `config.yml` in the deployment directory, mounted at `/app/config.yml` in the container. Copy the template out of the image:

```bash
export STUDIO_IMAGE='<supplied-image-name-and-version>'
docker run --rm --entrypoint cat "$STUDIO_IMAGE" /app/config.example.yml > config.yml
```

Merge these settings into the template from your image without duplicating top-level nodes. Replace placeholder credentials and restrict access to configuration files.

Environment variables override only fields explicitly supported by the application. Pass Compose `.env` entries through `environment` or `env_file`; `config.yml` does not expand `${NAME}`. Run `docker compose up -d --force-recreate studio` after changes so mounted-file updates are read too.

## File uploads and release artifacts

| Content | Configuration | Default location |
| --- | --- | --- |
| Uploaded attachments and other files | `drive.default` selects a disk in `drive.disks` | `/app/storage` |
| Release artifacts uploaded by CI or Agents | `releases.artifact` | `/app/storage/releases/artifacts` |

Local storage works without additional setup, but persist `/app/storage`. Changing the default file disk does not change artifact storage.

File storage supports `fs` and `s3`. For driver settings, release artifacts, and migration, see [File and artifact storage](storage.md).

## Invitation and password reset email

| Purpose | Sender configuration | Password variable |
| --- | --- | --- |
| Invitations | `notification.channels.system-email`, with `type: smtp` | `SMTP_PASSWORD` |
| Password resets | `auth.email`, with `provider: smtp` | `AUTH_EMAIL_PASSWORD` |

`auth.passwordReset.emailChannel` is a legacy compatibility field. New configurations use `auth.email`; invitations continue to use notification channels.

Both can use the same SMTP account, but must be configured separately. Password recovery also requires `auth.passwordReset.enabled: true` and a correct `APP_PUBLIC_ORIGIN`.

See [Invitation email](../admin/notifications.md#invitation-email) for complete examples, passing variables through Compose, and migration. Verify both invitation delivery and password recovery before onboarding the team.

## Environment variables

| Variable | What it sets |
| --- | --- |
| `APP_PUBLIC_ORIGIN` | The address browsers use to reach Studio, without a path, such as `https://studio.example.com`. Code host callbacks, links in emails, and push all use it |
| `SECRETS_KEYS` | The encryption key, in the form `1:<key>`. Generate one with `openssl rand -hex 32`. Encrypted credentials and API keys depend on it, and sign-in sessions are derived from it |
| `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` | The first administrator, created only on first start when there are no accounts yet. Changing them later doesn't change the existing account |
| `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SSL` | The database connection |
| `WEB_PUSH_PRIVATE_KEY` | The push private key. See [Notifications and push](../admin/notifications.md) |
| `SMTP_PASSWORD`, `RESEND_API_KEY` | Credentials for the `system-email` notification channel, used by invitations |
| `AUTH_EMAIL_PASSWORD`, `AUTH_EMAIL_API_KEY` | Credentials for the independent password-reset sender |
| `AUTH_EMAIL_PROVIDER`, `AUTH_EMAIL_HOST`, `AUTH_EMAIL_PORT`, `AUTH_EMAIL_SECURE`, `AUTH_EMAIL_USER`, `AUTH_EMAIL_FROM`, `AUTH_EMAIL_REPLY_TO` | Override the corresponding `auth.email` sender settings |
| `API_BODY_LIMIT`, `API_TIMEOUT` | The maximum request body size and the processing timeout for API requests |

Studio is served under `/main`, as in `https://studio.example.com/main/`. When you add runtimes or sign in to `nb-studio`, use this full address with `/main`.

> [!WARNING] The encryption key
> Don't change `SECRETS_KEYS` after deployment. If you change it, everyone is signed out, and if you lose it, saved credentials can't be decrypted. To replace the key, put the new key first with a higher version number (`2:<new key>,1:<old key>`), re-encrypt, and only then remove the old one.

## Main config.yml settings

| Setting | What it sets |
| --- | --- |
| `i18n.defaultLocale` | The interface language. Set it to your team's language, such as `en-US`. Without it, the interface is in English |
| `auth.emailAndPassword.disableSignUp` | Set to `true` to turn off self sign-up, so members join only by invitation. The template doesn't include it, so add it yourself |
| `auth.passwordReset.enabled` | Enable built-in recovery with a valid `auth.email` and public origin |
| `auth.email` | Independent password-reset sender using `provider: smtp` or `provider: resend` |
| `users.invitations.emailChannel` | Invitation notification channel; defaults to `system-email` |
| `notification.channels` | Reminder channels: in-app (`inbox`), email (`system-email`, through SMTP or Resend), and others. See [Notifications and push](../admin/notifications.md) |
| `push` | Push notifications: `privateKey` and `contact` |
| `database` | The database connection, overridden by environment variables |
| `users.initialAdmin` | The first administrator, overridden by environment variables |
| `secrets.keys` | The encryption key, overridden by the `SECRETS_KEYS` environment variable |
| `logging` | Log level, and how many days and how much log data to keep |
| `studio.git.apiBaseUrls` | API addresses for self-hosted GitHub Enterprise or GitLab, when they aren't in the default location |
| `studio.agents.queuedExpiryHours` | How many hours queued work waits for a runtime before it fails, 24 by default. Set to 0 to wait forever |
| `agents.runs.retentionDays` | How many days finished runs keep their transcripts and prompts, 14 by default |
| `drive` | File storage, the local `storage` directory by default. Also supports S3-compatible object storage |
| `releases.artifact` | Release artifact storage; configure separately from the default file disk |
| `studio.testing.enabled` | Show the quality management menu; also available as `STUDIO_TESTING_ENABLED=true` |

## Run multiple instances

A single Studio instance doesn't need Redis. With multiple instances, switch both `realtime` (live messages) and `jobs` (scheduled jobs) to Redis, with all instances sharing one namespace. Turn on persistence in Redis and set `maxmemory-policy noeviction`, or scheduled jobs may be lost.

## Release management

| Setting | What it sets |
| --- | --- |
| `releases.docker` | Turns on Docker mode: `enabled: true`, plus the entry address and ports for Docker apps. See [Deploy environments](../admin/environments.md) |
| `releases.host.launchPrefix` | Runs previews as a different system user that can't read Studio's configuration |
| `studio.releases.previewPublicUrl` | A separate domain for previews, such as `https://studio-preview.example.com/{appId}/`, instead of sharing Studio's address |
| `studio.releases.previewEnvironment` | Set to `false` to skip creating the preview environment on installation |

For real use, give previews their own domain and run them as a different system user. Previews run code that hasn't been merged yet and shouldn't be able to read Studio's configuration and secrets.
