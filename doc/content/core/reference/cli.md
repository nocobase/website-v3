---
title: Command-line reference
description: Application command entry points, source/deployment differences, configuration, databases, plugins and JSON output.
---

This page covers the application's `nocobase` command. Separate tools create apps and plugins or install production releases: see [Create an app](../getting-started/create-app.md), [Create a plugin](../extension-development/create-plugin.md) and [Deploy with PM2](../tutorials/deploy-with-app-installer.md).

## Entry points

Run the local dependency's command from the application source root:

```bash
pnpm nocobase commands
pnpm nocobase config check --no-connect
pnpm nocobase plugin register --help
```

Deployment output contains its own CLI. From the deployed application root:

```bash
node dist/cli/index.js commands
node dist/cli/index.js config check --no-connect
```

Deployment includes runtime commands retained during the build, rather than development commands such as `dev`, source plugin integration or builds. For app-installer installations, use the entry under the release directory described in the deployment guide.

## Command index

“Source” means the development workspace; “Both” means source and deployment runtimes. Plugins contribute additional commands, so inspect the current application's `commands` output.

| Command | Environment | Purpose and common options |
| --- | --- | --- |
| `dev` / `build` / `start` | Source | Develop, build and start build output; flags are handled by each command |
| `info` / `commands` | Both | Inspect app information / command tree; `commands --json` reports arguments and execution capabilities |
| `config init` | Both | Initialize local configuration; `--dialect`, `--config`; does not install database drivers |
| `config set` | Both | Write `key=value`; `--from-env` reads values from environment variables |
| `config check` | Both | Check configuration; `--no-connect` for offline checks; `--strict` treats warnings as failures |
| `config env` / `config variables` | Both | List environment mappings / deployment metadata; `variables --out` writes the manifest |
| `db apply` | Both | Apply pending migrations and seeds; supports `--dry-run` |
| `db rollback` / `db redo` | Both | Roll back the latest migration batch / roll back and reapply; changes the database |
| `db reset` | Both | Reset managed tables; deletes data |
| `db repair` | Both | Repair migration checksums; not a substitute for schema migrations |
| `db unlock` | Both | Handle a stale migration lock; first confirm no migration process is active |
| `db sample` | Development only | Load sample data; deployment execution is refused even if listed in its catalog |
| `collections generate` | Both | Generate Collection artifacts; `--check` compares without writing |
| `collections doctor` | Both | Diagnose Collection/database differences; `--fix` applies changes |
| `locales check` | Both | Check locale resources |
| `secrets status` / `secrets rotate` | Both | Inspect / rotate encrypted data; `rotate --dry-run` previews, `--batch-size` controls batches |
| `plugin inspect` | Source | Inspect plugin entries and integration information |
| `plugin register` | Source | Install or register a plugin; preview with `--dry-run` |
| `plugin unregister` | Source | Unregister a plugin; does not remove its business data |
| `plugin update` | Source | Upgrade a named plugin, or all registered plugins when omitted, then synchronize Skills |
| `package remove` | Source | Remove a dependency and related integration; supports `--dry-run` |
| `skills sync` | Source | Synchronize dependency Skills; supports package/plugin selectors and `--dry-run` |
| `dist check` / `dist retarget` | Source | Check / retarget deployment output |
| `cli build` / `cli link` | Source | Build a distributable business CLI / install local command links |

## Development and builds

Default application scripts provide common shortcuts:

```bash
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

Your application's `package.json` determines its scripts. Build a target-specific deployment archive with:

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

`--target` selects a platform such as `linux-x64` or `linux-arm64-musl`; match the actual server. `--node-version` selects the target Node major. `--tar` writes `storage/exports/dist.tar.gz`. Native database dependencies cannot simply be copied between operating systems.

## Configuration commands

```bash
pnpm nocobase config init --dialect sqlite
pnpm nocobase config set server.port=13000 client.app.title="My App"
pnpm nocobase config env
pnpm nocobase config variables --json
pnpm nocobase config check --no-connect --strict
```

`config init` normally preserves an existing configuration; replacement requires explicit `--force`. `config set` accepts dotted paths and YAML scalars; edit the file directly for complex objects and arrays. Unknown sections are rejected, and environment overrides affect effective values.

`config check` attempts non-SQLite connections by default. `--no-connect` checks configuration only; `--connect` also checks SQLite. Connection checks do not apply migrations. See the [Configuration reference](configuration.md) for fields and secret input.

## Database commands

Commands supporting connection selection accept `--connection <name>` or mutually exclusive `--all`. Omitting both selects the default connection. These are not universal command options.

Inspect the plan before applying migrations:

```bash
pnpm nocobase db apply --connection main --dry-run
pnpm nocobase db apply --connection main
```

Consult each command's `--help` for preview and confirmation options on `rollback`, `redo`, `reset` and `repair`. `--force` explicitly confirms an operation; it is not a routine remedy for failures. Investigate changed checksums in applied migrations first, and consider repair only when edits do not change deployed schema semantics. See [Database migrations](../framework/database/migrations.md).

## Plugins and Skills

In an app with `packages/app-plugin-announcements/` already created, preview registration changes:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-announcements --dry-run
pnpm nocobase skills sync --dry-run
```

The plugin's `package.json` determines its name. Use options such as `--no-install` or `--no-skills` only on commands that support them. Inspect the resulting Client, Server and CLI registration files to establish which runtime entries were integrated. See [Manage plugins](../developing-apps/manage-plugins.md).

Synchronized guidance in `.agents/skills/` can be regenerated. Maintain a plugin's distributed Skill in its source `skills/` directory.

## Application and plugin business commands

An application file at `cli/commands/orders/sync.ts` corresponds to:

```bash
pnpm nocobase app orders sync --help
```

Plugins declare commands through their CLI entries. The namespace normally strips the package scope and `app-plugin-` prefix; collisions fail. A deployment invokes packaged business commands rather than scanning newly added source files.

See [Write application commands](../developing-apps/application-commands.md) for authoring and verification, [Integrate plugin commands](../developing-apps/plugin-commands.md) for application registration, and [Extend the CLI](../extension-development/extend-command-line.md) for plugin implementation.

`cli link` enables local development of a standalone client; `cli build` packages it for remote business calls. It uses a running application’s HTTP APIs. See [Provide an application CLI client](../developing-apps/cli-client.md) for integration.

## JSON and automation

```bash
pnpm nocobase commands --json
pnpm nocobase config check --no-connect --json
```

The main success-envelope fields are shown below; each command defines its own `result`:

```json
{
  "schemaVersion": 1,
  "ok": true,
  "command": "config check",
  "status": "success",
  "result": {},
  "warnings": []
}
```

This illustrates envelope fields rather than a complete configuration-check result. Automation should inspect the exit code, `ok` and `status`, then read `result`. Failures normally exit nonzero. `success-noop` means no change was needed; `partial-success` means work remains, so inspect `warnings` and reported issues. `commands --json` reports JSON, dry-run and force capabilities. Passthrough commands such as `dev`, `build` and `start` do not uniformly support JSON. `NOCOBASE_CONTENT_TYPE=json` likewise applies only where supported.

## Verification scope

Checked on 2026-10-27 with default template beta.83, `@nocobase/app-cli` 1.0.0-beta.29, Node 24.21.0 and pnpm 11.7.0: source/deployment command catalogs, offline configuration validation, variable metadata, option help and registration preview for the local announcements plugin. Stateful operations such as resets, rollbacks and key rotation were not executed for this page. See the [app-cli source](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli).
