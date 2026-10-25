---
title: Application configuration and system settings
description: Declare, validate and read configuration, distinguish runtime parameters from business settings, and deliver working administration pages.
---

Application configuration describes how an instance runs. Business settings describe rules administrators can adjust. They may affect the same feature, but have different storage, owners and update behavior. Not every configuration value needs a form, and everyday business settings should not be fixed in deployment files.

This guide uses the example application's configuration entries and prepared settings pages. For server deployment procedures, see [Choose a deployment method](../deployment/choose-a-deployment-method.md).

## Decide who owns the value

| Kind | Examples | Appropriate location |
| --- | --- | --- |
| Runtime parameters | Listening port, database connection, public origin | `config.yml` or declared environment variables |
| Code defaults | Default list page size | Configuration factory, optionally overridden at deployment |
| Business settings | Reporting time zone, work calendar, numbering rules | Application or plugin data, changed through authorized APIs |
| Personal preferences | Language, color mode, theme | Existing preference mechanisms |
| Business master data | Projects, customers, products | Business modules, usually outside system settings |

Decide who can change a value, when it takes effect and whether it affects old records. A reporting time zone might change presentation or aggregation boundaries; pages and background jobs should not invent separate interpretations.

## With an agent

```text
Please review this application's configuration and administration entries so operators and business administrators can manage what they need.

List the configuration actually used by existing features, its owner, storage and when changes take effect.
Keep database connections and server secrets in deployment configuration, outside ordinary pages and browser configuration.
Reuse user and role administration without duplicate entries or automatic permission expansion.

Where administrators need to change business rules, use real read and save APIs and ensure subsequent operations consume saved values.
Read-only administrators may view settings; only authorized administrators may save. Reject invalid values and preserve input on failure.
Do not add empty settings pages for unused capabilities.
Report the scope of each setting and results after refresh, sign-in or restart as appropriate.
```

## Without an agent

### Locate configuration entries

Server defaults live in `server/config/`, assembled through `defaultAppConfigs()` in `server/config/index.ts`. Client defaults live in `client/config/`. Startup loads configuration files and declared environment variables, then exposes resolved configuration to services.

For server sections with environment mappings, precedence is code defaults, then `config.yml`, then environment variables. A plausible variable name does nothing without a mapping. `${NAME}` in `config.yml` is not expanded.

### Declare and validate configuration

For a default project page size that operators may override, create `server/config/project-defaults.ts`:

```ts
import {
  defineAppConfig,
  envInteger,
  type AppConfigFactory,
} from '@nocobase/app-server/config';

export interface ProjectDefaults {
  pageSize: number;
}

const projectDefaults: AppConfigFactory<ProjectDefaults> = defineAppConfig({
  defaults: { pageSize: 20 },
  env: {
    PROJECT_PAGE_SIZE: envInteger('pageSize', {
      description: 'The default project page size, from 1 to 100.',
    }),
  },
  public: ['pageSize'],
  validate(value, ctx) {
    const size = value.pageSize;
    if (
      typeof size !== 'number' ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > 100
    ) {
      ctx.error('pageSize', 'Must be an integer from 1 to 100.');
    }
  },
});

export default projectDefaults;
```

Import it in `server/config/index.ts` and add `projectDefaults` to the existing `defaultAppConfigs({ ... })`. If that file declares the result type explicitly, also add `projectDefaults: ReturnType<typeof projectDefaults>`. Preserve existing sections rather than replacing the entire file with this excerpt.

Describe the deployment option in `config.example.yml`; an instance overrides it in `config.yml`:

```yaml
projectDefaults:
  pageSize: 20
```

Validation receives the final merged value at startup, reload and configuration checking. Report invalid values without writing to databases, sending requests or changing external state. `public: ['pageSize']` exposes only that leaf field; a page needing configuration is not a reason to publish other server values.

### Read and consume values

Server code reads through the configuration service:

```ts
const defaults = app.config.get<ProjectDefaults>('projectDefaults');
```

Import `ProjectDefaults` from the file above. Use `defaults.pageSize` when supplying the missing pagination input; explicit values still require the `1–100` limit. **Declaring configuration does not change the list automatically.** The current example endpoint and frontend have their own defaults, so update both consumers when adopting this example.

The browser reads published values through `config.public.get('projectDefaults.pageSize')` on its configuration service. Declare the client type:

```ts
declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    projectDefaults: { pageSize?: number };
  }
}

export {};
```

Place the declaration in a `.d.ts` file included by the client TypeScript project. Prefer a plugin's configuration factory and hooks for plugin-owned sections so their validation remains active. Runtime configuration under `client` is sent to the browser and must not contain secrets.

### Check configuration and update behavior

```bash
pnpm nocobase config env
pnpm nocobase config variables
pnpm nocobase config check
```

The first two commands show environment mappings and descriptions; the last checks the current instance. Do not publish local configuration or environment details as documentation examples.

Configuration reload support does not mean every existing service is reinitialized. Services that read once at startup need a restart; services supporting dynamic updates should subscribe according to their contract. Refresh after changing client defaults, and verify a new session without saved preferences rather than observing only an existing browser choice.

### Connect existing system settings

The default template includes reusable user and permission administration pages. As business features are developed, add `systemSettingsRoutes` from `./pages/settings/routes.js` once to the existing contribution array in `client/routes.ts`. The task example already registers it; do not duplicate it.

A navigation group organizes pages but grants no access. Preserve existing permission declarations, real APIs and role assignment behavior. Check administration needed by actual business features rather than adding empty pages because a dependency is installed.

### Add application-owned business settings

“Administrators can change the reporting time zone” should be a real business feature, not a web Save button over `config.yml`:

1. Choose persistence and initial values. Prefer the owning plugin's public settings service; use a migration for application-owned storage.
2. Declare server settings resources and actions such as `read` and `update`, with authenticated, authorized and validated read/write APIs.
3. Add the management page to the existing settings group. Gate entry on the settings read permission and saving on update permission.
4. Let read-only users inspect values, preserve drafts on failure and display actual saved values after success. Authorize every server write independently.
5. Make reports and background jobs consume the setting, with explicit cache, reload and historical-record behavior.

Settings pages normally check a `settings` resource rather than ordinary `page/access`. Register the resource ID and actions on the server, not only in frontend declarations. Follow the installed authorization plugin's Skill for exact declarations.

This describes how to implement application-owned settings; it does not imply that the template includes reporting-time-zone tables or APIs. Database connections, storage credentials, backups and similar operations remain with deployment tooling. A page may show authorized status and existing operations links, but should not offer a Save control that cannot take effect.

## Verify results

Check defaults, file overrides, environment overrides and invalid-value rejection. Published configuration must contain only browser-safe fields. For business settings, verify persistence after restart, read versus update permissions and actual consumer behavior after a change.

Continue with [Pages, routes and navigation](pages-routes-and-navigation.md), [Localization and themes](localization-and-themes.md) and [Testing and acceptance](testing-and-acceptance.md).
