---
title: FAQ
description: Common questions about apps, plugins, UI assets, configuration, commands, databases, upgrades and deployment.
---

## Should a feature live in the app or a plugin?

Code specific to the current business can live directly in application `client/`, `server/`, `database/` or `cli/` directories. Consider `packages/app-plugin-<name>/` when it needs independent maintenance, defined extension entries or integration into multiple apps. A local plugin builds with the app and does not require npm publication. See [When to write a plugin](../extension-development/when-to-write-a-plugin.md).

## Why does an installed plugin have no page or working feature?

Installed dependencies, registered runtime entries and integrated pages are distinct states. Check which Client, Server and CLI entries the plugin provides and their registration in the corresponding application `plugins.ts` files. Some plugins provide only services or Skills, and may expect the app to compose its pages. Database resources also require migrations. See [Using plugins overview](../using-plugins/overview.md) and the [Plugin index](plugins.md).

## Must app and plugin components follow a fixed structure?

Components can be written and organized freely, with shadcn primitives. Consult the [NocoBase UI Library](https://ui.nocobase.com/) first for modular components. Plugins can supply runtime components or just services, contracts and examples, according to business needs. See [Components and styles](../extension-development/frontend-components.md).

## Does component reuse require publishing a UI Registry?

No. Publish when components or blocks should be source assets that Agents can obtain, modify and combine on demand. Ordinary source organization, shared package dependencies and runtime plugins can also reuse code.

Maintain distributed source assets in a separate package such as `packages/announcements-ui/`, alongside the runtime plugin. Assets must not import the publisher's private plugin files or publisher-only aliases. Files distributed together can use relative imports if installation targets preserve them. See [Optionally distribute UI source assets](../extension-development/frontend-components.md#optionally-distribute-ui-source-assets).

## Do local UI assets need a Registry server?

No. Build the item JSON and pass its local path to `shadcn add`. Absolute paths are clearer when `pnpm --filter` runs in a subpackage. Static hosting is needed only for URL-based distribution across machines, and can reuse an existing site. See [Install and modify it in the target project](../extension-development/frontend-components.md#install-and-modify-it-in-the-target-project).

## Is ServiceProvider only for the server?

Both client and server runtimes use ServiceProviders for service registration and lifecycle hooks, with separate containers and instances. React Providers supply context in the React component tree and are distinct from service containers. See [ServiceProviders and service lifecycle](../extension-development/service-provider.md) and the [API reference](api.md).

## Why did a config.yml change have no effect?

Check for an environment override and whether `APP_CONFIG_FILE` selects another file. `${NAME}` in YAML does not interpolate environment values. Saved browser preferences can override new theme defaults. Some services read configuration at startup and need a restart or explicit reload handling. See the [Configuration reference](configuration.md).

## Why did changing the initial administrator password not update an account?

`users.initialAdmin` initializes an empty user database; it is not a password-reset entry for existing users. Use the application's account-management or recovery process instead of resetting its database.

## Why do commands differ from another tutorial?

Confirm the tutorial targets NocoBase 3, the working directory is the intended application, and the CLI comes from that app. Source uses `pnpm nocobase`; deployment output uses `node dist/cli/index.js`. Inspect `commands --json` and each command's `--help`. Production builds do not retain every development and plugin-registration command. See the [Command-line reference](cli.md).

## Which plugins does the app include by default?

Template dependencies identify included packages; registration files determine integrated runtime entries. Both can change by version. Inspect application `package.json`, its lockfile and Client/Server/CLI registration, then consult the [Plugin index](plugins.md) baseline. A package in `node_modules/` does not alone prove it is enabled.

## Does creating a table automatically expose an API?

Creating a Collection does not automatically expose it to clients. Apps or plugins must declare endpoints, validate input, establish identity and apply permissions. A remote Repository client likewise requires matching server endpoints. See [Routes and HTTP APIs](../developing-apps/apis-and-services.md).

## Why does a migration report a checksum mismatch?

An applied migration differs from current source. Check for edits to historical migrations, a wrong branch or a mismatched deployment. Normally add a migration for new changes. Consider `db repair` only after confirming edits do not alter deployed schema semantics; do not reset the database merely to silence the check. See [Create tables and initialize data](../developing-apps/data-models-and-migrations.md).

## Does changing a dialect transfer existing data?

No. It changes the connection, not data placement. Verify field types, indexes, constraints, queries, transactions and plugin behavior on the target database, then arrange data migration and validation. A tested database image is not a guarantee for every server version. See [Database support and version compatibility](compatibility.md).

## Should all @nocobase packages have the same version?

No. Runtimes, libraries, plugins and scaffold tools are versioned independently. Follow template dependencies and peer ranges, preserving the lockfile. Upgrades also require checking template changes, migrations and local plugins. See [Upgrade NocoBase Core](../developing-apps/upgrade-nocobase-core.md).

## Which directories can be regenerated?

`node_modules/` and `dist/` can be rebuilt from source and the lockfile; synchronized Skills also have maintained sources. Runtime-generated `storage/` may contain SQLite databases, uploaded files and logs, so do not treat it as disposable build cache. Plan persistence and backups around actual storage configuration. See [Directory and file conventions](project-conventions.md).

## How do development preview and production deployment differ?

Use development commands locally; see Studio documentation for Studio previews. Deploy independent production applications with Docker or PM2 plus app-installer, using build output and preserving runtime data. See [Choose a deployment method](../deployment/choose-a-deployment-method.md).

## What should a problem report include?

Provide minimal reproduction steps, actual and expected results, operating system and architecture, Node/pnpm versions, and relevant package versions. State whether it happens during source development, building or deployment. For database issues, include dialect and server version. Share redacted errors and commands rather than passwords, keys, sessions or complete configuration files.
