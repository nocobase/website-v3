---
title: Application configuration (config.yml)
description: Change existing settings through config.yml, understand client and server code configuration, add your own configuration section, and verify overrides, validation and public fields.
---

`config.yml` holds the configuration of the current application environment, such as the application title, database connections, default language and logging level. `client/config/` and `server/config/` define the defaults in code, along with configuration that has to be constructed in code.

This guide first changes an existing setting, then adds `reports.pageSize` to walk through declaring, overriding, reading in business code and using configuration on the client. The examples follow the Examples template and do not depend on the projects-and-tasks tutorial. Administration pages, and business settings that administrators maintain day to day, belong to their business modules and are outside the scope of this guide.

## Where configuration lives

| Location | Responsibility |
| --- | --- |
| `config.example.yml` | A configuration example you can commit, showing a new environment which values to fill in |
| `config.yml` | The actual overrides for the current environment; the local file may contain credentials, so do not commit it to Git |
| `client/config/` | Client defaults and code configuration such as authentication client plugins |
| `server/config/` | Defaults, environment variable mappings, validation and public fields for each server configuration section |
| `config/index.ts` on each side | Collects that side's configuration with `defaultAppConfigs()` and hands it to the runtime |
| `server/config.ts` | Creates the configuration service and selects and loads the configuration file |

Note the difference: `server/config.ts` is the loading entry, while `server/config/` is the directory that holds the configuration sections. The template's `server/runtime.ts` and `client/runtime.ts` already connect their configuration entries, so you usually only maintain the sections and their `index.ts`.

`config.example.yml` only shows some common settings, not every available field. Configuration declarations come from the application and the modules it integrates; for the complete fields, see [Configuration reference](../reference/configuration.md) and each module's documentation. When creating an application for the first time, initialize the local configuration and secrets with `pnpm nocobase config init --dialect sqlite`; for an existing application, change its current configuration as needed. See [Create an app](../getting-started/create-app.md).

## Change existing settings

In an initialized application, merge the values below into `config.yml`, keeping the existing database, secrets and other settings. If a section with the same name already exists, change its fields instead of declaring the top-level key twice:

```yaml
client:
  app:
    title: My Reports

i18n:
  defaultLocale: zh-CN

logging:
  level: info
```

In Examples, `client/config/app.ts` sets the default title to `NocoBase`, and the configuration file originally overrides it to `NocoBase Examples`. After changing it to `My Reports` here, the template's client ServiceProvider uses it at startup as the browser tab title. The application name and version in the sidebar come from separate public information, so do not expect changing one title to replace the text everywhere.

`i18n.defaultLocale` sets the default language, while the selectable languages are still decided by the language resources; a user's existing choice or browser preference may take precedence over the default. See [Localization](localization.md). `logging.level` sets the logging level; for the full logging behavior, see [Logging](../framework/support/logging.md).

### Override order

Server configuration takes precedence from low to high: code defaults, the configuration file, then environment variables with declared mappings. The client's own defaults are overridden by the `client` configuration sent to the browser; values managed by the host, such as the application base path and the API address, are also computed separately by the runtime.

Plain objects are merged recursively, while arrays and scalars are replaced entirely by the later value. Environment variables must have a mapping declared in the corresponding configuration section and are converted by their declared types; an arbitrary variable name has no effect. `${NAME}` in YAML is not expanded; use a declared environment variable, or add a mapping for your own field.

For example, `APP_SERVER_PORT` maps to `server.port`. As long as that environment variable is set, it still overrides any `server.port` you change in the file. When checking final values, check the application's startup environment as well.

## Client configuration

`client/config/` in Examples contains three sections:

| File | Contents |
| --- | --- |
| `app.ts` | Client defaults such as the application title |
| `api.ts` | The API Client's default address, generated from the application base path |
| `auth.ts` | Authentication client plugins such as username sign-in, API keys and device authorization |

For example, the code default for the application title can be written like this:

```ts
// client/config/app.ts
import { defineAppConfig, type AppConfigFactory } from '@nocobase/app-client';

const app: AppConfigFactory<{ title: string }> = defineAppConfig(() => ({
  title: 'NocoBase',
}));

export default app;
```

`client/config/index.ts` already passes `app`, `api` and `auth` to `defaultAppConfigs({ ... })`. When adding client configuration, import it here and add its section; if the aggregation entry declares its return type explicitly, update the type too.

The client `defineAppConfig()` takes a configuration factory function. Things that must be constructed in code, such as authentication plugin instances and callbacks, stay in TypeScript; values that can be serialized and may vary by environment can be overridden through the `client` section of `config.yml`.

Read the title in a client ServiceProvider:

```ts
// Inside a client ServiceProvider:
const title = this.app.config.get<string>('app.title', 'NocoBase');
```

Pages or Hooks can get the same configuration service through `useClientApplication().config`. The path to read is `app.title`, without the `client.` prefix used in the file. The API address is governed by the host's mount path, so do not treat `client.api.baseURL` as an external service address you can override freely; organize separate access configuration for independent external APIs.

## Server configuration

`server/config/` organizes both framework and plugin configuration. For example, `server.ts`, `api.ts`, `database.ts` and `logging.ts` handle basic runtime capabilities, while `auth.ts`, `users.ts`, `notification.ts`, `knowledge.ts` and others configure the integrated modules. Each module's options are covered by its own documentation; this guide focuses on the common way to integrate them.

When a module provides a dedicated factory, prefer it, for example `defineApiConfig()`, `defineAppDatabaseConfig()` or `defineAuthConfig()`; these factories keep the module's own defaults, mappings and validation rules. Application-owned sections use `defineAppConfig()` from `@nocobase/app-server/config`.

The server `defineAppConfig()` supports these declarations:

| Field | Purpose |
| --- | --- |
| `defaults` | A default value object, or a function that generates defaults from runtime information such as paths |
| `env` | Mappings from environment variables to fields in the section, with types and descriptions |
| `validate` | Validates the final merged value, reporting field problems through `context.error()` |
| `public` | Leaf field paths that may be sent to the browser |

The client and server factories share a name but have different interfaces; do not apply the server's object form with `env`, `validate` and `public` to the client.

After adding a section, register it through `server/config/index.ts`, then read it on the server with `app.config.get()`. The key in the registration object decides the section name; creating a file alone does not connect it, and adding a key to YAML does not create business features out of thin air. For built-in options, see [Configuration reference](../reference/configuration.md).

## Expose configuration to the client

The browser can read two kinds of configuration, through different entries:

| Source | How the client reads it |
| --- | --- |
| Client code defaults and the `client` section of `config.yml` | `config.get('app.title')` and similar |
| Fields the server declares through `public`, and public information published by the runtime | `config.public.get(...)` |

The runtime publishes the default language and the application package's display name and version. For example, once the client has a `config` object:

```ts
// config is the client application's configuration service.
const title = config.get<string>('app.title', 'NocoBase');
const defaultLocale = config.public.get('i18n.defaultLocale');
```

Application-owned server sections declare the leaf fields that may be public with `public`, as needed. In the example below, `public: ['pageSize']` exposes only `reports.pageSize`, not the whole `reports` object. Public configuration keeps its server path and cannot be read through `config.get()` instead.

Both the `client` section and public fields are sent to the browser, so database passwords, session secrets and mail credentials belong in server configuration. Type declarations only help TypeScript check paths; they do not make fields public.

## Add your own configuration

The following adds a default page size for reports, with values from `1–100`. It is a standalone example of integrating configuration; business behavior changes only once the value is used in an existing report's pagination logic.

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

Make three changes in the existing `server/config/index.ts`, keeping the other sections:

1. Import it: `import reports from './reports.js';`.
2. Add `reports: ReturnType<typeof reports>` to the explicitly declared return type.
3. Add `reports` to the argument object of `defaultAppConfigs({ ... })`.

The key registered here is `reports`, so the configuration path is `reports.pageSize` and the matching environment variable is `REPORTS_PAGE_SIZE`. Validation runs against the final value, checking both the file and environment overrides; the validation function must not write data or make network requests.

Document this section and its default `20` in `config.example.yml`. The current environment can override it in `config.yml` as:

```yaml
reports:
  pageSize: 30
```

### Read it in business code

Add the helper below: an explicitly requested page size wins, and the application configuration is used when none is given:

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

In the report's business service, obtain the query's `limit` with `resolveReportPageSize(app.config, requestedPageSize)`. An ordinary error thrown by the function means there is a problem with the input or the integration; the HTTP boundary must still validate request parameters and convert them into the project's agreed response, as described in [Request validation and error handling](request-validation-and-errors.md). Configuration validation only guarantees that the default is valid and cannot replace request validation.

### Use the public value on the client

Extend the public configuration type in a declaration file included by the client TypeScript project:

```ts
// client/types/public-config.d.ts
import '@nocobase/app-client';

declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    reports: { pageSize?: number };
  }
}
```

A page can get the published default through a Hook:

```ts
// client/hooks/use-report-page-size.ts
import { useClientApplication } from '@nocobase/app-client';

export function useReportPageSize(): number | undefined {
  return useClientApplication().config.public.get('reports.pageSize');
}
```

Use this value to initialize the pagination state; any page size the user chooses later is still managed by page state. If it returns `undefined`, check that the server section is registered, that `public` is declared and that the current page has been refreshed, instead of creating a second server setting with the same name under `client`.

## Check configuration and how changes take effect

After making changes, first check the current application's declarations and final configuration:

```bash
pnpm nocobase config env
pnpm nocobase config variables --json
pnpm nocobase config check --no-connect
```

`config env` lists the environment variable mappings, `config variables` outputs environment variable metadata such as types and descriptions, and `config check --no-connect` checks the configuration offline. A plain `config check` also tries to connect to non-SQLite databases by default; passing configuration validation does not mean the database or external services have been verified as available.

Once `reports` is registered and the application's existing configuration is valid, you can verify overrides and rejections in a development environment. The temporary environment variable syntax below is for POSIX shells:

```bash
pnpm nocobase config set reports.pageSize=30
REPORTS_PAGE_SIZE=40 pnpm nocobase config check --no-connect --json
REPORTS_PAGE_SIZE=0 pnpm nocobase config check --no-connect --json
```

The first command writes `30` to the file; the second should pass validation, with an effective value of `40` for that process while the file stays at `30`; the third should exit with a nonzero status and report that `reports.pageSize` is out of range. `config set` only edits the configuration file and does not reload a running application process.

Verification should also cover: `20` when there is no override; the client receiving the same public value as the server; fields that are not public never reaching the browser; and explicitly requested page sizes still going through business validation. You can verify these behaviors first with isolated configuration tests, then check the actual pages and query results in the development application.

How a configuration change takes effect depends on what uses it:

- **Changing `config.yml` or the startup environment:** after the check passes, restart the application and refresh client pages. Whether an existing instance supports partial reloading follows the convention of the relevant module.
- **Changing TypeScript in `client/config/` or `server/config/`:** reload through the project's development workflow during development; in production, rebuild and release the code.
- **Configuration read only at initialization:** for example `users.initialAdmin`, used only when initializing an empty user table; changing it does not reset existing accounts.
- **Defaults that users can override with preferences:** for example the default theme, where a user's existing choice may take precedence; verify with a session that has no such saved preference.

Runtime support for configuration reloading does not mean existing database connections, consumers and all services are rebuilt automatically. For the related operations and full parameters, see [Command-line reference](../reference/cli.md) and [Configuration reference](../reference/configuration.md).

Template sources checked for this guide: [configuration example](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/config.example.yml), [client configuration entry](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/client/config/index.ts), [server configuration entry](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/server/config/index.ts).
