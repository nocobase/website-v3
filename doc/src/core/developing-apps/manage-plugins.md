---
title: Manage plugins
description: Inspect registered plugins, use existing capabilities, and manage registration, updates, removal and extension points.
---

The default template already includes several plugins. Application development normally uses their authentication, user, authorization and file capabilities directly. Add a plugin only after confirming the needed capability is missing. Application-specific tasks and projects belong in application code without first becoming plugins.

This guide covers plugin management in an application, not plugin development or a complete product catalog. Commands were checked against the example application's installed CLI; use `--help` to confirm options in your version.

## With an agent

```text
Please inspect the plugin capabilities available in this application and identify which existing business features use them.

Read installed dependencies, actual registrations and relevant guidance first. Do not infer capabilities from names or rebuild something already available.
Do not add, upgrade or remove plugins in this review.

Explain which plugins each feature depends on, which public entries it uses, and any missing administration pages or required configuration.
If a dependency change is necessary, explain the reason, compatible version and affected features, then prepare a reviewable change proposal.
Preserve user permissions and business data.
```

For an actual change, identify the target, such as updating the scheduling plugin to a confirmed compatible version and verifying existing definitions and execution. Registration, updates and removal should match the task rather than happen incidentally during an inventory.

## Without an agent

### Inspect installation and registration

Check `@nocobase/app-plugin-*` dependencies in `package.json` and resolved versions in the lockfile. Then inspect the three composition roots:

| File                | Contributions                                      |
| ------------------- | -------------------------------------------------- |
| `client/plugins.ts` | Browser plugins                                    |
| `server/plugins.ts` | Server Providers, routes and related contributions |
| `cli/plugins.ts`    | Commands                                           |

An installed package is not necessarily registered. The three lists need not match: a command-only plugin needs its CLI entry. Array order affects contribution order; do not rearrange it merely for alphabetical presentation.

A Skill under `.agents/skills/` also does not prove a plugin is active, because direct dependencies can supply Skills. Composition roots are authoritative. Application plugin packages normally belong in `dependencies` so deployment includes them; a client plugin is not automatically a development-only dependency.

### Use existing capabilities

Read the installed plugin's Skill for public service tokens, client hooks, components, routes and management capabilities. Use public exports rather than writing internal plugin tables or importing internal source paths.

For example, the project feature declares viewing, creation and assignment through the authorization plugin and reuses user and role management. It does not need another permission package or role store. The application must still connect capabilities to real pages and APIs; installation alone does not implement a business feature.

### Register a missing plugin

These commands use Scheduler as an example. Skip registration if it is already registered. Before substituting another plugin, confirm its availability, version requirements and configuration:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-scheduler --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-scheduler
```

The command installs the dependency, connects exported contributions and synchronizes Skills. Inspect `package.json`, the lockfile and actual Client, Server and CLI registrations. Use `--version` for a confirmed compatible version; a new package's default version is not automatically compatible with every application.

`pnpm add` installs a package but does not replace runtime registration. `--no-install` requires a resolvable installed dependency. `--disabled` installs without enabling runtime contributions and does not make a capability usable. Check the output for the roots actually handled.

### Update plugins

Preview and apply an update for one plugin:

```bash
pnpm nocobase plugin update @nocobase/app-plugin-scheduler --dry-run
pnpm nocobase plugin update @nocobase/app-plugin-scheduler
```

The name is positional, not `--plugin`. Omitting it updates every registered plugin, so name the package when changing one capability.

pnpm respects declared version ranges; a pinned range may produce no newer version. For a change outside that range, establish a compatible target, update the declaration and lockfile, synchronize Skills and inspect the result. Plugin updates do not merge template changes or replace [Upgrade NocoBase Core](upgrade-nocobase-core.md).

Check migration, configuration and public API changes, verify affected features and rebuild. Updating development dependencies does not change an already deployed artifact.

### Distinguish disabling a feature from removing a plugin

For temporary removal from the interface, decide whether the requirement is to hide an entry or prevent use. Hiding a menu does not block direct URLs or API requests. Enforce disabled behavior at actual entry points while preserving code and data needed for restoration.

Before uninstalling, search imports, Client/Server/CLI registrations, routes, configuration, services, tests and dependent capabilities. Migrate or remove those references before removing the package.

`<name>` below is a placeholder for a plugin confirmed to be unused. Do not execute it for a plugin still serving business features:

```bash
pnpm nocobase plugin unregister '@nocobase/app-plugin-<name>' --dry-run
pnpm nocobase plugin unregister '@nocobase/app-plugin-<name>'
```

`pnpm nocobase package remove <full-package-name>` also removes direct NocoBase dependencies, delegating plugin packages to unregistration. Deleting only a manifest line can leave registrations and synchronized files behind.

Unregistration does not decide how to handle historical business data and is not a database rollback plan. Design retention, migration or deletion separately rather than deleting plugin directories or tables as incidental cleanup.

### Extend plugin interfaces

| Need | Prefer |
| --- | --- |
| Existing plugin configuration | Public registration options |
| Composable components or source extension points | Components or documented `client/extensions/` contributions |
| Replace a plugin page's presentation | Supported `client/route-overrides.ts` or plugin-provided overrides |
| Application-owned business pages | New entries in `client/routes.ts` |

Page overrides retain route identity, path and access conditions while replacing a lazy component according to the contract. Do not redeclare the same path or combine multiple overrides for one route. Current sign-in and registration pages are application-owned even though they use the authentication plugin.

Do not edit package content in `node_modules/` or `.agents/skills/`. Put application rules in `.agents/rules/`; fix shared plugin defects in their source repository.

## Verify results

Inspect dependencies, lockfile, all three roots, synchronized Skills and actual consumers. Run affected type checks, tests and builds. Verify existing data after migrations and API documentation after endpoint changes. Check successful access and ordinary-user permission boundaries in the browser.

If manual changes or interruptions leave Skills inconsistent, resynchronize:

```bash
pnpm nocobase skills sync
```

Synchronization repairs guidance copies, not plugin registration or application code. Continue with [Application development overview](overview.md) and [Testing and acceptance](testing-and-acceptance.md).
