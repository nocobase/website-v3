---
title: Plugin declarations and public exports
description: Declare a plugin's client, server and CLI capabilities, connect them to the application through public exports, and collaborate with other plugins.
---

A plugin's internal pages, APIs, services and commands are first gathered by the plugin's declarations, then connected by the application. Components, types and services that applications or other plugins may use directly must also be exported from the package's public entries.

[Plugin structure](plugin-structure.md) explains what each file does; this guide explains how entries, contribution declarations, public exports and calls connect. For a complete page and API walkthrough, see [Write your first plugin](write-your-first-plugin.md).

The examples below continue with the announcements plugin `@nocobase/app-plugin-announcements`, using client routes and language resources, server routes and a ServiceProvider, and an optional CLI entry. When creating it for the first time, you can choose these capabilities:

```bash
pnpm create @nocobase/plugin@beta announcements \
  --with client.routes --with client.locales \
  --with server.routes --with server.service-providers --with cli
```

If a plugin with the same name already exists, keep its implementation and add the modules this guide uses as needed; there is no need to recreate it. Below, plugin file paths are relative to `packages/app-plugin-announcements/`, while the application's registration files are in the application root.

## Runtime entries

One package can provide up to three runtime entries as needed, each connected by the application separately:

| Runtime | The plugin's public path | Default export | The application's registration file |
| --- | --- | --- | --- |
| Client | `@nocobase/app-plugin-announcements/client` | The factory function returned by `defineClientPlugin()` | `client/plugins.ts` |
| Server | `@nocobase/app-plugin-announcements/server` | The declaration object returned by `defineServerPlugin()` | `server/plugins.ts` |
| CLI | `@nocobase/app-plugin-announcements/cli` | The declaration object returned by `defineCliPlugin()` | `cli/plugins.ts` |

Registering the client calls the factory, for example `announcements()`, while the server and CLI register the imported objects directly. They go into the application's `defineClientPlugins()`, `defineServerPlugins()` and `defineCliPlugins()` respectively.

The client and server usually put their declarations in `plugin.ts`, re-exported by `index.ts` in the same directory:

```ts
export { default } from './plugin.js';
```

The CLI declaration is written directly in `cli/index.ts`, without a separate `cli/plugin.ts`.

Once the local plugin is a workspace dependency of the application and can be resolved, preview and run the registration in the application root:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
```

Check which of the three registration files the command changed, and keep the application's existing plugins. Installing dependencies makes the package importable, and runtime registration makes the application load the features it declares; you need both. For details, see [Manage plugins](../developing-apps/manage-plugins.md).

A plugin does not have to provide all three entries. A package that only exports components can be used through ordinary `import`; a package that only provides Skills can have no runtime entry at all. Database resources, however, must be declared through the server entry. Do not generate entries with no purpose just to fill out the directories.

## Contribution declarations

### Client

`client/plugin.ts` gathers the announcements page's routes and language resources:

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

`routes` comes from the plugin's own route declarations, and `locales` is a collection of language resource loaders. Page components and individual language files can be imported on demand inside their loaders. After adding a page, just add its route; the application does not need to register the plugin again for each page.

Depending on the feature, you can also declare `serviceProviders` and `reactProviders`: the former registers client services and the latter mounts React Providers, and their jobs differ. For implementing pages and components, see [Pages, routes and menus](pages-and-menus.md) and [Components and styles](frontend-components.md); for context and services, see [React Context and Providers](react-context-and-providers.md) and [Client services](client-services.md).

### Server

`server/plugin.ts` gathers the registration of APIs and services:

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

`serviceProviders` holds Provider constructors, and `routes` holds route declarations. Do not instantiate Providers, connect to databases or start jobs in the declaration file; that work is managed by the application's service container and lifecycle.

The server can also declare language and database resources. The two fields below are added to the definition once the plugin has the corresponding files:

| Field | How to declare it | Effect after connecting |
| --- | --- | --- |
| `locales` | Import the loader collection from `server/locales/index.ts` | Provides the plugin's language resources to the application |
| `database` | `{ migrations: './database/migrations', seeds: './database/seeds' }` | Provides the resource directories for migrations and Seeds |

Database directories are relative to the absolute path `baseDir`. The form above points to the plugin root in source and to the plugin's `dist/` after compilation, matching the compiled database resources. Keep the scaffold's build script and resource manifests. Adding a directory does not register it, and declaring and building resources does not mean migrations have run. For the steps, see [Database resources and migrations](database-and-migrations.md).

Background jobs register their executors through the corresponding ServiceProvider; putting a job file into `server/jobs/` and waiting for it to be discovered does not work. For implementing APIs, see [Routes and HTTP APIs](server-apis.md); for connecting services, see [Business services and ServiceProvider](server-services.md); for registering and shutting down job executors, see [Background jobs and executors](background-jobs.md).

### CLI

After choosing the `cli` capability, the scaffold provides `cli/info.ts` and declares it as a plugin command in `cli/index.ts`:

```ts
import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';
import PluginInfo from './info.ts';

const announcements: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-announcements',
  commands: { info: PluginInfo },
});

export default announcements;
```

Once the application connects this entry, you can run `pnpm nocobase announcements info`. Command modules export command classes, and business operations happen when the command executes; capabilities are started only when application services are needed. For development commands, build hooks and command tests, see [Command-line extensions](extend-command-line.md).

## Plugin configuration

The plugin provides the configuration contract, and the application chooses the values and connects them to the runtime. When you need reusable server configuration, export a configuration factory and its types from the plugin's public entry; the application calls it in `server/config/<module>.ts` and adds it to `defaultAppConfigs()` in `server/config/index.ts`. The factory maintains defaults, environment variable mappings, validation and the fields allowed to be public, while the application overrides values for each environment through means such as `config.yml`.

For example, the authentication plugin exposes `defineAuthConfig()`, and the application uses it to create its own `auth` configuration section. New plugins can follow the same approach and explain the section's name and connection steps in their README. The runtime contribution declarations in `defineServerPlugin()` cannot replace registering an application configuration section; nor should you invent a `config` field and expect it to be loaded automatically.

A client factory can accept options the plugin declares itself; factory options, server configuration and values visible in the browser need to be explained separately. Keep sensitive values on the server, and never pass them to the browser through component Props or client configuration. For defining and overriding configuration in full, see [Application configuration (config.yml)](../developing-apps/configuration-and-settings.md).

## Public exports

### Map entries to package paths

`index.ts` decides which symbols are exported, and `exports` in `package.json` decides which package paths consumers may use. Below is an excerpt of the fields for the three entries; merge it into the existing manifest, keeping the other exports, dependencies and build configuration:

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

During development, workspace plugins are used through source entries; published packages, and local packages collected by the application build, use the corresponding build output mappings. When adding an export, make sure the related source is compiled and the declared `.js` and `.d.ts` files really exist.

The client entry exports only what works in the browser, while the server entry may use Node.js capabilities. Data types shared by client and server can go into a separate shared module with an additional public subpath as needed; do not bring server dependencies into the browser through a mixed root entry.

### Provide a service to others

The examples continue with the announcement preview service from [Business services and ServiceProvider](server-services.md). First define `AnnouncementPreviewService`, `AnnouncementPreview`, the original Token and the Provider as described there, and add the Provider to the Server declaration. The preview service returns `{ text, length }`; this section only covers the public entries consumers use, without repeating the service's implementation.

In `server/index.ts`, keep the plugin's default export and add the service's public exports:

```ts
export { default } from './plugin.js';
export { announcementPreviewToken } from './tokens.js';
export type { AnnouncementPreview, AnnouncementPreviewService } from './tokens.js';
```

Outsiders import the Token and types from `@nocobase/app-plugin-announcements/server`. The default export is for the application's registration, and the named exports are for calling the service; the Provider and the implementation can stay internal details. Exporting a Token does not register an implementation; the application still needs to connect the Server plugin.

[Client services](client-services.md) likewise connect through their own Tokens, Providers and public entries, and the containers on the two sides are independent. For exposing components and their styling prerequisites, see [Components and styles](frontend-components.md#expose-components); for distributing editable source, see [Optionally distribute UI source assets](frontend-components.md#optionally-distribute-ui-source-assets).

## Collaboration between plugins

### Declare dependencies and finish connecting

Suppose a reports plugin needs to call the announcement preview service; it should first declare a dependency on the announcements plugin. For plugins the application provides centrally and whose service identity must be shared, use a compatible peer dependency. In a local workspace it can be declared like this; below is only an excerpt of the related fields in the consumer's `package.json`:

```json
{
  "peerDependencies": {
    "@nocobase/app-plugin-announcements": "workspace:^"
  }
}
```

`workspace:^` is for packages in the same workspace; when installing independently or publishing, use the actual version range the package tooling converts it to. Keep the scaffold's peer declarations for shared runtimes such as `@nocobase/service-provider`, and declare ordinary runtime dependencies and development tools according to their own purposes.

The application must install compatible versions and register, on the server, the announcements plugin as well as the runtime entries the consumer actually needs. An npm dependency does not update the application's `server/plugins.ts`, and cannot replace service registration. If the consumer only exports a function that the application calls explicitly, there is no need to create an extra runtime entry.

### Call through the public service

In the consumer's `server/services/announcement-preview.ts`, use the service through its public Token:

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

The application or the consumer's route passes the current application's `app.container` to this function. The announcements plugin can change its preview implementation freely; as long as the public path, the original Token and the interface semantics stay the same, callers do not need to know where the implementation files are.

The call must happen after the service is registered. The consumer's Provider first registers its own factory in `register()`, leaving dependency resolution to the factory or a later lifecycle phase; dependencies that need asynchronous initialization must also follow the corresponding lifecycle and the declaration order in the application. Package dependencies do not determine Provider startup order automatically; see [Application startup and lifecycle](../framework/runtime/lifecycle.md) for the mechanism.

Callers must get the original Token from the public entry; never create a Token again from the same string, and never import another plugin's internal implementation across packages by relative path. For the identity rules of service interfaces and Tokens, see [Service contracts and tokens](../framework/services/tokens.md).

### Verify the public entries

In the plugin's tests, import from the public entries, and verify that the service can be called once registered and fails clearly when registration is missing. Then check the pages, APIs and actual commands in the target application, and finally verify the plugin's and the application's builds:

```bash
pnpm --filter @nocobase/app-plugin-announcements typecheck
pnpm --filter @nocobase/app-plugin-announcements test
pnpm --filter @nocobase/app-plugin-announcements build
pnpm nocobase announcements info --json
pnpm build
```

Besides the source being importable, check that the public paths, type declarations and resources in the build output are complete. A successful registration, or the `info` command succeeding, only proves that the corresponding entry is available; it cannot replace tests of business features. For verifying plugins, see [Testing and verification](testing-and-verification.md); for checks before delivery, see [Build and publish](publish-plugin.md).
