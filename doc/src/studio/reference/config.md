---
title: Configuration options
description: Studio's config.yml and environment variables: the public address, encryption key, first administrator, database, language and sign-in, email and push, multiple instances, release management, and logging.
---

Studio's configuration lives in `config.yml` in the deployment directory, mounted at `/app/config.yml` in the container. Copy the template out of the image:

```bash
docker run --rm --entrypoint cat pkg-v3.nocobase.com/nocobase/studio:<version> /app/config.example.yml > config.yml
```

Some settings can also come from environment variables, which take precedence. Keep passwords and keys in environment variables, in an `.env` file with permissions 600, rather than in `config.yml`. Restart Studio after changing the configuration: `docker compose up -d`.

## Environment variables

| Variable | What it sets |
| --- | --- |
| `APP_PUBLIC_ORIGIN` | The address browsers use to reach Studio, without a path, such as `https://studio.example.com`. Code host callbacks, links in emails, and push all use it |
| `SECRETS_KEYS` | The encryption key, in the form `1:<key>`. Generate one with `openssl rand -hex 32`. Encrypted credentials and API keys depend on it, and sign-in sessions are derived from it |
| `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` | The first administrator, created only on first start when there are no accounts yet. Changing them later doesn't change the existing account |
| `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SSL` | The database connection |
| `WEB_PUSH_PRIVATE_KEY` | The push private key. See [Notifications and push](../admin/notifications.md) |
| `SMTP_PASSWORD` | The SMTP password for the email channel |
| `API_BODY_LIMIT`, `API_TIMEOUT` | The maximum request body size and the processing timeout for API requests |

Studio is served under `/main`, as in `https://studio.example.com/main/`. When you add runtimes or sign in to `nb-studio`, use this full address with `/main`.

> [!WARNING] The encryption key
> Don't change `SECRETS_KEYS` after deployment. If you change it, everyone is signed out, and if you lose it, saved credentials can't be decrypted. To replace the key, put the new key first with a higher version number (`2:<new key>,1:<old key>`), re-encrypt, and only then remove the old one.

## Main config.yml settings

| Setting | What it sets |
| --- | --- |
| `i18n.defaultLocale` | The interface language. Set it to your team's language, such as `zh-CN`. Without it, the interface is in English |
| `auth.emailAndPassword.disableSignUp` | Set to `true` to turn off self sign-up, so members join only by invitation. The template doesn't include it, so add it yourself |
| `auth.passwordReset` | Password resets. Needs an email channel, with `emailChannel` pointing at it |
| `notification.channels` | Reminder channels: in-app (`inbox`), email (`system-email`, through SMTP or Resend), and others. See [Notifications and push](../admin/notifications.md) |
| `push` | Push notifications: `privateKey` and `contact` |
| `database` | The database connection, overridden by environment variables |
| `users.initialAdmin` | The first administrator, overridden by environment variables |
| `secrets.keys` | The encryption key, overridden by the `SECRETS_KEYS` environment variable |
| `logging` | Log level, and how many days and how much log data to keep |
| `studio.git.apiBaseUrls` | API addresses for self-hosted GitHub Enterprise or GitLab, when they aren't in the default location |
| `studio.agents.queuedExpiryHours` | How many hours queued work waits for a runtime before it fails, 24 by default. Set to 0 to wait forever |
| `agents.runs.retentionDays` | How many days finished runs keep their transcripts and prompts, 14 by default |
| `drive` | File storage, the local `storage` directory by default. You can switch to S3-compatible object storage |

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
