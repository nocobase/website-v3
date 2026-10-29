---
title: Application configuration (config.yml)
description: Modify config.yml, understand client and server code configuration, and add a configuration section with overrides, validation and public fields.
---

`config.yml` contains configuration for the current application environment, such as the application title, database connections, default locale and logging level. `client/config/` and `server/config/` define code defaults and configuration that must be constructed in code.

This guide first changes an existing setting, then adds `reports.pageSize` to connect declarations, overrides, business consumers and client access. Examples follow the Examples template and do not require the project-and-task tutorial. Administration pages and business settings managed by administrators belong to their business modules.

## Where configuration lives

| Location | Responsibility |
| --- | --- |
| `config.example.yml` | A committed example that helps new environments identify values to supply |
| `config.yml` | Overrides for the current environment; may contain credentials and is not committed |
| `client/config/` | Client defaults and code configuration such as authentication client plugins |
| `server/config/` | Server section defaults, environment mappings, validation and published fields |
| Each side's `config/index.ts` | Combines its sections with `defaultAppConfigs()` for the runtime |
| `server/config.ts` | Creates the configuration service and selects and loads its file |

`server/config.ts` is the loader; `server/config/` contains section definitions. The template's `server/runtime.ts` and `client/runtime.ts` already connect their configuration entries. Usually, maintain the sections and their `index.ts` rather than changing the runtime.

`config.example.yml` shows selected common settings, not every available field. The application and integrated modules define configuration together. Consult [Configuration reference](../reference/configuration.md) and module documentation for complete options. For a new application, `pnpm nocobase config init --dialect sqlite` initializes local configuration and keys. For an existing application, edit its current configuration as needed; see [Create an app](../getting-started/create-app.md).

## Change existing configuration

In an initialized application, merge these values into `config.yml`, retaining database, key and other settings. Update existing sections rather than duplicating top-level keys:

```yaml
client:
  app:
    title: My Reports

i18n:
  defaultLocale: zh-CN

logging:
  level: info
```

Examples defaults the title to `NocoBase` in `client/config/app.ts`, then overrides it to `NocoBase Examples` in the configuration file. Changing it to `My Reports` makes the template's client ServiceProvider set that browser-tab title at startup. The sidebar's application name and version come from separate public information; changing one title does not replace all application wording.

`i18n.defaultLocale` selects the default language; available languages still depend on locale resources. Existing user or browser preferences may take precedence; see [Localization](localization.md). `logging.level` selects the logging level; see [Logging](../framework/support/logging.md) for complete behavior.

### Override precedence

Server precedence, from lowest to highest, is code defaults, configuration files, then explicitly mapped environment variables. The client configuration sent to the browser overrides client code defaults. Host-managed values such as the application base path and API URL are also computed by the runtime.

Plain objects merge recursively; arrays and scalars are replaced. Environment variables need declared mappings and are parsed according to them. Arbitrary variable names do not become configuration paths. `${NAME}` in YAML is not interpolated: use a declared variable or add a mapping for your field.

For example, `APP_SERVER_PORT` maps to `server.port`. When set, it overrides that value in the file. Inspect the application's startup environment when checking effective values.

## Client configuration

Examples has three sections under `client/config/`:

| File | Contents |
| --- | --- |
| `app.ts` | Client defaults such as the application title |
| `api.ts` | The API Client's default URL, resolved with the application base path |
| `auth.ts` | Authentication client plugins for usernames, API keys and device authorization |

The application title default can be declared as:

```ts
// client/config/app.ts
import { defineAppConfig, type AppConfigFactory } from '@nocobase/app-client';

const app: AppConfigFactory<{ title: string }> = defineAppConfig(() => ({
  title: 'NocoBase',
}));

export default app;
```

`client/config/index.ts` already passes `app`, `api` and `auth` to `defaultAppConfigs({ ... })`. Import and register additional sections there, also updating an explicitly declared return type when present.

Client `defineAppConfig()` takes a factory function. Keep constructed plugin instances and callbacks in TypeScript. Serializable values that may vary by environment can be overridden through the `client` section of `config.yml`.

Read the title inside a client ServiceProvider:

```ts
// Inside a client ServiceProvider:
const title = this.app.config.get<string>('app.title', 'NocoBase');
```

Pages and Hooks obtain the same service through `useClientApplication().config`. The lookup path is `app.title`, without the file's `client.` prefix. The host controls the API URL for its mount path; do not treat `client.api.baseURL` as an arbitrary external-service override. Configure independent external API access separately.

## Server configuration

`server/config/` organizes both framework and plugin configuration. For example, `server.ts`, `api.ts`, `database.ts` and `logging.ts` configure runtime facilities, while `auth.ts`, `users.ts`, `notification.ts` and `knowledge.ts` configure integrated modules. Their individual options belong in module documentation; this guide covers common integration.

Prefer a module's dedicated factory when available, such as `defineApiConfig()`, `defineAppDatabaseConfig()` or `defineAuthConfig()`, to preserve its defaults, mappings and validators. Use `defineAppConfig()` from `@nocobase/app-server/config` for application-owned sections.

Server `defineAppConfig()` supports these declarations:

| Field | Purpose |
| --- | --- |
| `defaults` | Default values, or a function that computes them from runtime information such as paths |
| `env` | Environment mappings to section-relative fields, with types and descriptions |
| `validate` | Validation of final merged values, reporting field errors through `context.error()` |
| `public` | Leaf paths that may be sent to the browser |

The client and server factories share a name but have different interfaces. The server's `env`, `validate` and `public` object form does not apply to the client factory.

Register new sections in `server/config/index.ts` and read them with `app.config.get()`. Registration keys determine section names. Adding a file does not register it, and adding a YAML key does not implement business behavior. See [Configuration reference](../reference/configuration.md) for built-in options.

## Publish configuration to the client

The browser reads two separate kinds of configuration:

| Source | Client accessor |
| --- | --- |
| Client code defaults and the file's `client` section | `config.get('app.title')` and similar paths |
| Fields published by server `public` declarations, plus runtime-published information | `config.public.get(...)` |

The runtime publishes the default locale and the application package's display name and version. With the client's `config` object:

```ts
// config is the client application's configuration service.
const title = config.get<string>('app.title', 'NocoBase');
const defaultLocale = config.public.get('i18n.defaultLocale');
```

Application-owned server sections declare public leaf paths explicitly. In the example below, `public: ['pageSize']` publishes only `reports.pageSize`, not the entire `reports` object. Published configuration keeps its server path and is not read through `config.get()`.

Both the `client` section and published fields reach the browser. Keep database passwords, session secrets and mail credentials in server-only configuration. Type declarations check paths in TypeScript; they do not publish fields.

## Add your own configuration

Add a default report page size between `1` and `100`. This is an independent configuration example; business behavior changes only after an existing report uses the value for pagination.

### Define and register

Add `server/config/reports.ts`:

```ts
// server/config/reports.ts
import {
  defineAppConfig,
  envInteger,
  type AppConfigFactory,
} from '@nocobase/app-server/config';

export interface ReportsConfig {
  pageSize: number;
}

const reports: AppConfigFactory<ReportsConfig> = defineAppConfig({
  defaults: { pageSize: 20 },
  env: {
    REPORTS_PAGE_SIZE: envInteger('pageSize', {
      description: 'Default report page size, from 1 to 100.',
    }),
  },
  public: ['pageSize'],
  validate(value, context) {
    const size = value.pageSize;
    if (
      typeof size !== 'number' ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > 100
    ) {
      context.error('pageSize', 'Must be an integer from 1 to 100.');
    }
  },
});

export default reports;
```

Make three changes to the existing `server/config/index.ts`, retaining every other section:

1. Import `import reports from './reports.js';`.
2. Add `reports: ReturnType<typeof reports>` to its explicit return type.
3. Add `reports` to the object passed to `defaultAppConfigs({ ... })`.

The registration key is `reports`, so the configuration key is `reports.pageSize` and the environment variable is `REPORTS_PAGE_SIZE`. Validation checks the final value from either source. Validators must not write data or make network requests.

Document the section and default `20` in `config.example.yml`. The current environment can override it in `config.yml`:

```yaml
reports:
  pageSize: 30
```

### Connect a business consumer

Add this helper to prefer an explicitly requested page size and otherwise read the application default:

```ts
// server/services/report-options.ts
import type { AppConfigAccessor } from '@nocobase/app-server/config';

export function resolveReportPageSize(
  config: AppConfigAccessor,
  requested?: number,
): number {
  const size = requested ?? config.get<number>('reports.pageSize');
  if (
    typeof size !== 'number' ||
    !Number.isInteger(size) ||
    size < 1 ||
    size > 100
  ) {
    throw new Error('Report page size must be an integer from 1 to 100.');
  }
  return size;
}
```

In the report's business service, use `resolveReportPageSize(app.config, requestedPageSize)` to obtain the query `limit`. The helper's ordinary error reports invalid input or integration. The HTTP boundary still validates request parameters and converts failures to the project's response contract; see [Request validation and error handling](request-validation-and-errors.md). Configuration validation cannot replace request validation.

### Read the published value on the client

Augment public configuration in a declaration file included by the client TypeScript project:

```ts
// client/types/public-config.d.ts
import '@nocobase/app-client';

declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    reports: { pageSize?: number };
  }
}
```

Pages can obtain the published default through a Hook:

```ts
// client/hooks/use-report-page-size.ts
import { useClientApplication } from '@nocobase/app-client';

export function useReportPageSize(): number | undefined {
  return useClientApplication().config.public.get('reports.pageSize');
}
```

Use this value to initialize pagination state; later user choices belong to page state. If it returns `undefined`, check server section registration, its `public` declaration and whether the current page has been refreshed. Do not duplicate that server setting under `client`.

## Check configuration and apply changes

Inspect declarations and check the current application configuration after editing:

```bash
pnpm nocobase config env
pnpm nocobase config variables --json
pnpm nocobase config check --no-connect
```

`config env` lists environment mappings, `config variables` reports environment-variable types, descriptions and other metadata and `config check --no-connect` validates offline. Plain `config check` also attempts non-SQLite database connections by default. Passing configuration validation does not verify database or external-service availability.

After registering `reports` and ensuring the application's existing configuration is valid, verify overrides and rejection in development. The temporary environment syntax below is for POSIX shells:

```bash
pnpm nocobase config set reports.pageSize=30
REPORTS_PAGE_SIZE=40 pnpm nocobase config check --no-connect --json
REPORTS_PAGE_SIZE=0 pnpm nocobase config check --no-connect --json
```

The first command writes `30` to the file. The second should pass with effective value `40` for that process, leaving the file at `30`. The third should exit nonzero and identify the invalid `reports.pageSize`. `config set` edits the file; it does not reload a separate running application process.

Also verify default `20` without overrides, matching published values on the client, exclusion of unpublished fields and validation of explicit request page sizes. Check these with isolated configuration tests before verifying actual pages and queries in the development application.

How a change takes effect depends on its consumer:

- **Editing `config.yml` or the startup environment:** check the configuration, restart the application and refresh client pages. Use partial reloads only as supported by the module.
- **Editing TypeScript in `client/config/` or `server/config/`:** reload through the project's development workflow; rebuild and release code in production.
- **Initialization-only values:** `users.initialAdmin`, for example, is read when initializing an empty user table. Changing it does not reset an existing account.
- **Defaults with saved user preferences:** a saved theme choice may take precedence. Verify with a session that has no saved preference.

Runtime reload support does not automatically recreate database connections, consumers or every service. See [CLI reference](../reference/cli.md) and [Configuration reference](../reference/configuration.md) for operations and complete options.

Template sources checked for this guide: [configuration example](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/config.example.yml), [client configuration entry](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/client/config/index.ts) and [server configuration entry](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/server/config/index.ts).
