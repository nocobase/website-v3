---
title: Plugin declarations and public exports
description: Declare a plugin's Client, Server and CLI contributions, expose public entries, and integrate with applications and other plugins.
---

A plugin's pages, APIs, services and commands enter the application through its contribution declarations. Components, types and services intended for direct use by applications or other plugins also need public package exports.

[Plugin structure](plugin-structure.md) explains file responsibilities. This article connects runtime entries, contribution declarations, public exports and consumers. For a complete page and API walkthrough, see [Write your first plugin](write-your-first-plugin.md).

The examples use the `@nocobase/app-plugin-announcements` plugin, with client routes and locales, server routes and a ServiceProvider, and an optional CLI entry. When creating it for the first time, select:

```bash
pnpm create @nocobase/plugin@beta announcements \
  --with client.routes --with client.locales \
  --with server.routes --with server.service-providers --with cli
```

If the plugin already exists, preserve its implementation and add the required modules as needed; do not recreate it. Plugin file paths below are relative to `packages/app-plugin-announcements/`. Application registration files belong to the application root.

## Runtime entries

One package can provide up to three runtime entries, registered separately by the application:

| Runtime | Public plugin path | Default export | Application registration file |
| --- | --- | --- | --- |
| Client | `@nocobase/app-plugin-announcements/client` | Factory returned by `defineClientPlugin()` | `client/plugins.ts` |
| Server | `@nocobase/app-plugin-announcements/server` | Declaration object returned by `defineServerPlugin()` | `server/plugins.ts` |
| CLI | `@nocobase/app-plugin-announcements/cli` | Declaration object returned by `defineCliPlugin()` | `cli/plugins.ts` |

Call the client factory when registering it, such as `announcements()`. Register the imported Server and CLI objects directly. These entries go into the application's `defineClientPlugins()`, `defineServerPlugins()` and `defineCliPlugins()` respectively.

Client and Server declarations usually live in `plugin.ts`, re-exported by the adjacent `index.ts`:

```ts
export { default } from './plugin.js';
```

The CLI declaration lives directly in `cli/index.ts`; it does not need a separate `cli/plugin.ts`.

Once the local plugin is a resolvable workspace dependency of the application, preview and apply registration from the application root:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
```

Inspect the three runtime registration files changed by the command and preserve the application's existing plugins. Dependency installation makes the package importable; runtime registration loads its declared features. Both steps are required. See [Manage plugins](../developing-apps/manage-plugins.md) for the operational workflow.

A plugin does not have to provide all three entries. A component-only package can be consumed through ordinary imports, and a Skills-only package can have no runtime entry. Database resources require a Server entry to declare them. Add entries only for the features the package provides.

## Contribution declarations

### Client

`client/plugin.ts` combines the announcement page routes and locale resources:

```ts
import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';
import locales from './locales/index.js';
import routes from './routes.js';

const announcements: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/app-plugin-announcements',
  routes,
  locales,
});

export default announcements;
```

`routes` comes from the plugin's route declarations, and `locales` is its collection of language loaders. Page components and individual language files can remain lazy inside their loaders. Add a new page to the route declarations without registering the plugin again for that page.

A client plugin can also declare `serviceProviders` and `reactProviders`. The former registers client services; the latter mounts React Providers. For page and component implementations, see [Pages, routes and menus](pages-and-menus.md) and [Components and styles](frontend-components.md).

### Server

`server/plugin.ts` combines API and service contributions:

```ts
import path from 'node:path';
import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';
import serviceProviders from './providers/index.js';
import routes from './routes/index.js';

const announcements: AppServerPlugin = defineServerPlugin({
  packageName: '@nocobase/app-plugin-announcements',
  baseDir: path.resolve(import.meta.dirname, '..'),
  serviceProviders,
  routes,
});

export default announcements;
```

`serviceProviders` contains Provider constructors and `routes` contains route declarations. Do not instantiate Providers, connect databases or start jobs in this module; the application's container and lifecycle manage that work.

Server plugins can also declare locale and database resources. Add these fields after providing the corresponding files:

| Field | Declaration | Integration |
| --- | --- | --- |
| `locales` | Import the loader collection from `server/locales/index.ts` | Supply plugin language resources to the application |
| `database` | `{ migrations: './database/migrations', seeds: './database/seeds' }` | Supply migration and Seed resource directories |

Database paths resolve relative to the absolute `baseDir`. The expression above points to the plugin root in source and the plugin's `dist/` directory after compilation, where the compiled database resources belong. Preserve the scaffold's build scripts and resource manifests. Creating a directory does not register it, and declaring or building resources does not execute migrations. See [Database resources and migrations](database-and-migrations.md).

Register background job executors through their ServiceProvider; putting a file in `server/jobs/` does not discover it automatically. See [Routes and HTTP APIs](server-apis.md) for route implementations and [ServiceProvider and service lifecycle](service-provider.md) for service registration and startup.

### CLI

Selecting the `cli` capability generates `cli/info.ts`. `cli/index.ts` declares it as a plugin command:

```ts
import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';
import PluginInfo from './info.ts';

const announcements: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-announcements',
  commands: { info: PluginInfo },
});

export default announcements;
```

After the application registers this entry, run `pnpm nocobase announcements info`. Command modules export command classes and perform business operations during execution, starting application capabilities only when needed. Development commands, build hooks and command tests are covered in [Command-line extensions](extend-command-line.md).

## Plugin configuration

Plugins provide configuration contracts; Apps choose values and integrate them into the runtime. For reusable Server configuration, export a configuration factory and its types from a public plugin entry. The App calls it in `server/config/<module>.ts` and adds the result to `defaultAppConfigs()` in `server/config/index.ts`. The factory owns defaults, environment mappings, validation and public fields; the App overrides environment-specific values through `config.yml` and other supported sources.

For example, the authentication plugin exports `defineAuthConfig()` and the App uses it to create its `auth` section. A new plugin can follow the same arrangement and document its section name and integration steps. Runtime contributions in `defineServerPlugin()` do not replace configuration-section registration; do not invent a `config` field and expect automatic loading.

A Client factory can accept options defined by that plugin. Document factory options separately from Server configuration and browser-visible public values. Keep secrets on the Server instead of passing them through component Props or Client configuration. See [Application configuration](../developing-apps/configuration-and-settings.md) for definitions and overrides.

## Public exports

### Map entries to package paths

`index.ts` selects exported symbols; `package.json`'s `exports` selects the package paths consumers can import. The following manifest excerpt maps the three runtime entries. Merge it into the existing manifest, preserving other exports, dependencies and build settings:

```json
{
  "exports": {
    "./client": { "types": "./client/index.ts", "import": "./client/index.ts" },
    "./server": { "types": "./server/index.ts", "import": "./server/index.ts" },
    "./cli": { "types": "./cli/index.ts", "import": "./cli/index.ts" }
  },
  "publishConfig": {
    "exports": {
      "./client": { "types": "./dist/client/index.d.ts", "import": "./dist/client/index.js" },
      "./server": { "types": "./dist/server/index.d.ts", "import": "./dist/server/index.js" },
      "./cli": { "types": "./dist/cli/index.d.ts", "import": "./dist/cli/index.js" }
    }
  }
}
```

Development uses source entries from workspace packages. Published packages and local packages collected by the application build use the corresponding compiled export mappings. When adding an export, include its source in compilation and verify that the declared `.js` and `.d.ts` files exist.

Client entries export browser-compatible code; Server entries can use Node.js capabilities. Put data types shared by both ends in a separate shared module and expose a subpath when needed. Avoid a mixed root entry that brings server dependencies into the browser.

### Expose a service

Use the announcement preview service from [Business services and ServiceProvider](server-services.md). First define `AnnouncementPreviewService`, `AnnouncementPreview`, the original Token and Provider as described there, and include the Provider in the Server declaration. Preview returns `{ text, length }`. This section focuses on the consumer-facing entry rather than repeating the implementation.

Preserve the default plugin export in `server/index.ts` and add:

```ts
export { default } from './plugin.js';
export { announcementPreviewToken } from './tokens.js';
export type { AnnouncementPreview, AnnouncementPreviewService } from './tokens.js';
```

Consumers import the Token and types from `@nocobase/app-plugin-announcements/server`. The default export registers the plugin; named exports enable calls. The Provider and implementation can stay private. Exporting a Token does not register its implementation: the App still registers the Server plugin.

[Client services](client-services.md) likewise use their own Tokens, Providers and public entries; the two containers remain independent. See [Components and styles](frontend-components.md#expose-components) for component exports and styling prerequisites, and [UI source assets](frontend-components.md#optionally-distribute-ui-source-assets) for editable source distribution.

## Collaboration between plugins

### Declare dependencies and complete registration

Suppose a reporting plugin needs the announcement preview service. First declare its dependency on the announcement plugin. Use a compatible peer dependency for a plugin supplied by the application whose service identity must be shared. In a local workspace, the consumer's manifest can include:

```json
{
  "peerDependencies": {
    "@nocobase/app-plugin-announcements": "workspace:^"
  }
}
```

`workspace:^` refers to a package in the same workspace. Outside that workspace or when publishing, use the actual version range produced by the package tooling. Preserve shared runtime peers such as `@nocobase/service-provider` from the scaffold; ordinary runtime dependencies and development tools retain their respective classifications.

The application must install compatible versions and register the announcement Server plugin and any runtime entry the consumer requires. An npm dependency does not update the application's `server/plugins.ts` or register the service. If the consumer only exports a function called explicitly by the application, it does not need an additional runtime entry.

### Call the public service

In the consumer's `server/services/announcement-preview.ts`, resolve the service using its public Token:

```ts
import { announcementPreviewToken, type AnnouncementPreview } from '@nocobase/app-plugin-announcements/server';
import type { ServiceContainer } from '@nocobase/service-provider';

export function previewAnnouncement(
  container: ServiceContainer,
  text: string,
): AnnouncementPreview {
  return container.resolve(announcementPreviewToken).preview(text);
}
```

The application or a consumer route passes its current `app.container` to this function. The announcement plugin can change the preview implementation internally while preserving the public path, original Token and interface semantics. Consumers do not need to know the implementation's file location.

Call the service after registration completes. A consumer Provider should register its own factory in `register()`, resolving dependencies inside that factory or a later lifecycle stage. Dependencies that need asynchronous initialization also require the appropriate lifecycle phase and application declaration order. Package dependencies do not automatically determine Provider startup order; see [Application startup and lifecycle](../framework/runtime/lifecycle.md).

Import the original Token from the public entry. Do not create another Token using the same string or use cross-package relative imports into another plugin's private implementation. See [Service contracts and Tokens](../framework/services/tokens.md) for identity rules.

### Verify public entries

Import public entries in plugin tests and verify that the registered service works and a missing registration fails clearly. Then check actual pages, APIs and commands in the target application, followed by plugin and application builds:

```bash
pnpm --filter @nocobase/app-plugin-announcements typecheck
pnpm --filter @nocobase/app-plugin-announcements test
pnpm --filter @nocobase/app-plugin-announcements build
pnpm nocobase announcements info --json
pnpm build
```

Check public paths, declarations and resources in compiled artifacts as well as source imports. Successful registration or an `info` result proves only that particular entry works; it does not replace business feature tests. See [Testing and verification](testing-and-verification.md) and [Build and publish](publish-plugin.md) for verification and delivery checks.
