---
title: Configuration reference
description: File and environment precedence, common sections, browser-visible values, custom rules and validation commands.
---

Applications and integrated modules define configuration together. This page indexes common default-template fields; inspect an installed application's complete metadata with `pnpm nocobase config variables --json`. For the development workflow, see [Application configuration and system settings](../developing-apps/configuration-and-settings.md).

## Files and precedence

The default template merges values in this order, with later values taking precedence:

```text
Code defaults in server/config/
    → config.yml
    → explicitly mapped environment variables
```

Plain objects merge recursively; arrays and scalars are replaced. Environment variables require declared mappings and are not arbitrarily converted into paths. `${NAME}` in YAML is a literal string, not automatic interpolation.

| Location | Purpose |
| --- | --- |
| `server/config/` | Section defaults, environment mappings and validators |
| `config.example.yml` | Committable example used during initialization |
| `config.yml` | Environment-local configuration; may contain secrets and must stay out of Git |
| `APP_CONFIG_FILE` | Select another configuration file; relative paths resolve from the app root |
| `dist/variables.json` | Generated deployment configuration metadata, not a backup of secret values |

Run `pnpm nocobase config init --dialect sqlite` in an uninitialized app to generate local configuration and keys from the example. Preserve existing keys when upgrading; reinitialization is not an upgrade procedure.

## Common configuration fields

| Field / section | Meaning |
| --- | --- |
| `server.host` / `server.port` | Listen address and port; template code defaults to `127.0.0.1` / `13000` |
| `server.startLog` | Whether to print the startup address; development commands have their own banner |
| `app.publicOrigin` | Public scheme and host, used for absolute links and callbacks |
| `app.sampleData` | Whether to load sample data on initial setup |
| `database.default` | Default connection name; `main` in the template |
| `database.connections.<name>` | Dialect, connection options and schema-management mode |
| `api.bodyLimit` / `api.timeout` / `api.rateLimit` | HTTP body limits, timeouts and rate limiting; configure as needed |
| `secrets.keys` | Versioned master keys; protect sensitive data and must survive upgrades |
| `session` / `auth` | Session and authentication settings owned by their modules |
| `users.initialAdmin` | Username, email and password for initial setup of an empty user database; does not reset existing accounts |
| `i18n.defaultLocale` | Default locale; available languages also depend on loaded resources |
| `logging` | Log levels, outputs and file rotation |
| `client.app.title` | Application title shown in the browser |
| `client.app.defaultColorScheme` | `light`, `dark` or `system`; saved user preferences take precedence |
| `client.app.defaultTheme` | Application theme preset ID, which must exist in the theme source |
| `jobs` / `queue` / `caching` / `drive` | Adapters for background jobs, queues, caching and storage |
| `mail` / `notification` / `scheduler` / `knowledge` | Plugin/integration settings, depending on installed versions and registration |

This is an index of configuration locations, not a complete file to copy. Consult the current template and package declarations for defaults, supported fields and plugin sections.

For example, merge these values into an initialized local development app's existing configuration:

```yaml
server:
  host: 127.0.0.1
  port: 13000

client:
  app:
    title: My App
    defaultColorScheme: system
```

Preserve its database and key configuration. To allow LAN access, bind to `0.0.0.0` as appropriate and use the machine's actual IP in the browser; `0.0.0.0` is not the browser address. Development may use a separate frontend port; follow the URL printed by `pnpm dev`.

## Database configuration

Connections live at `database.connections.<name>`; `database.default` selects the default. SQLite uses `filename`. Other dialects commonly use `host`, `port`, `database`, `username` and `password`; see [Database support and version compatibility](compatibility.md) for dialect-specific fields.

`schemaManagement: managed` allows framework schema management. `external` restricts framework schema changes for an external database; it does not make business data automatically read-only. Account permissions and authorization policies still apply.

SQLite also accepts the template’s `database` filename spelling, which takes precedence when both it and `filename` are present. Use one spelling consistently when changing file locations, so an old `database` value does not override `DB_FILENAME`.

Default `DB_*` mappings target only `main`. Declare mappings for additional connections with `connectionEnvironment(name, prefix)` from `@nocobase/app-server/database`, retaining the default connection mappings. Changing a dialect or address does not migrate existing data.

## Environment variables

The following mappings come from the checked application's metadata. Authentication, mail and notification mappings depend on their modules; consult current command output for exact types, descriptions and sensitive-field markers.

| Variable | Field |
| --- | --- |
| `APP_SERVER_HOST` / `APP_SERVER_PORT` / `APP_SERVER_START_LOG` | `server.host` / `server.port` / `server.startLog` |
| `APP_PUBLIC_ORIGIN` / `APP_SAMPLE_DATA` | `app.publicOrigin` / `app.sampleData` |
| `DB_DIALECT` / `DB_HOST` / `DB_PORT` | `database.connections.main.dialect` / `.host` / `.port` |
| `DB_DATABASE` / `DB_FILENAME` | `database.connections.main.database` / `.filename` |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_SSL` | `database.connections.main.username` / `.password` / `.ssl` |
| `API_BODY_LIMIT` / `API_TIMEOUT` | `api.bodyLimit` / `api.timeout` |
| `SECRETS_KEYS` | `secrets.keys` |
| `AUTH_SECRET` / `SESSION_SECRET` | `auth.secret` / `session.secret` |
| `INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` | `users.initialAdmin.username` / `.email` / `.password` |
| `APP_DEFAULT_LOCALE` | `i18n.defaultLocale` |
| `SNOWFLAKE_WORKER_ID` | `snowflake.workerId` |
| `APP_VITE_DEV_URL` | `spa.viteDevUrl` |
| `MAIL_JOBS` / `MAIL_SYNC_BATCH_SIZE` / `MAIL_AUTOMATIC_SYNC_INTERVAL_MS` | `mail.jobs` / `.syncBatchSize` / `.automaticSyncIntervalMs` |
| `MAIL_OAUTH_CALLBACK_URL` / `MAIL_OAUTH_RETURN_URL` | `mail.oauthCallbackUrl` / `.oauthReturnUrl` |
| `MAIL_PUSH_WEBHOOK_URL` / `MAIL_PUSH_WEBHOOK_SECRET` | `mail.pushWebhookUrl` / `.pushWebhookSecret` |
| `RESEND_API_KEY` / `SMTP_PASSWORD` | `notification.channels.system-email.apiKey` / `.auth.pass` |
| `SCHEDULER_JOBS` | `scheduler.jobs` |

Three additional variables are read by the runtime:

| Variable | Purpose |
| --- | --- |
| `APP_BASE_PATH` | Application mount base path |
| `APP_CONFIG_FILE` | Configuration file location |
| `NOCOBASE_STRICT_STARTUP` | Exit strictly on startup failure for process-manager detection |

`SECRETS_KEYS` contains comma-separated `version:key` entries, with the current key first. Keep entries still needed to decrypt older data and follow the rotation process. Key changes can also invalidate existing sessions. Each module chooses explicit or derived keys according to its own rules. For example, sessions prefer an explicit `session.secret` and try Secrets derivation when it is absent. Check the module before changing configuration; see [Sessions](../framework/security/sessions.md) and [Secrets](../framework/security/secrets.md).

## Browser-visible configuration

The `client` section is embedded in application pages and readable by browsers. Other server sections expose only leaf paths explicitly listed in `defineAppConfig()`'s `public` option. Keep database passwords, signing keys and mail credentials out of `client` and public paths.

For an announcements section, add `server/config/announcements.ts`:

```ts
import { defineAppConfig, envInteger } from '@nocobase/app-server/config';

export default defineAppConfig({
  defaults: { pageSize: 20 },
  env: {
    ANNOUNCEMENTS_PAGE_SIZE: envInteger('pageSize', {
      description: 'Default number of announcements per page.',
    }),
  },
  public: ['pageSize'],
  validate(value, context) {
    if (!Number.isInteger(value.pageSize) || value.pageSize < 1 || value.pageSize > 100) {
      context.error('pageSize', 'Expected an integer between 1 and 100.');
    }
  },
});
```

Import and add `announcements` to the existing `defaultAppConfigs({ ... })` in `server/config/index.ts`, and update its explicitly listed return type. Its file key is `announcements.pageSize`, with environment override `ANNOUNCEMENTS_PAGE_SIZE`. `public: ['pageSize']` publishes only that field.

Validators run at startup, reload and `config check`. Validate actual values and avoid network requests or writes. Reloading configuration does not guarantee that existing services automatically adopt new behavior; services must handle updates themselves.

## Editing and checking

```bash
pnpm nocobase config set server.port=13000
pnpm nocobase config env
pnpm nocobase config variables --json
pnpm nocobase config check --no-connect
```

Read a sensitive value from an existing environment variable into local configuration:

```bash
pnpm nocobase config set --from-env database.connections.main.password=MAIN_DB_PASSWORD
```

Set `MAIN_DB_PASSWORD` through your environment-management mechanism first. This writes its current value, not a dynamic variable reference. If `DB_PASSWORD` is also set, it overrides the file value.

`config check` normally validates configuration and attempts non-SQLite connections. Use `--no-connect` offline and `--strict` to treat warnings as failures. When reporting a problem, supply field names, redacted errors and package versions rather than an entire configuration file. See the [Command-line reference](cli.md).

## Verification scope

Definitions were checked against [Core `015404ecd0db` configuration sources](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/config). Variable metadata and offline checks used default template beta.83, `@nocobase/app-cli` 1.0.0-beta.29 and `@nocobase/config` 0.1.0-beta.3. Additional plugins may introduce more sections and mappings.
