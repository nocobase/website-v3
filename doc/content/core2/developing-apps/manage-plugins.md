---
title: Manage plugins
description: See which plugins an application actually registers, use existing capabilities, and manage plugin registration, updates, removal and extension.
---

The default template already includes several plugins. When developing an application, you usually use the authentication, users, permissions, files and other capabilities they provide directly; add a plugin only after confirming the application lacks a capability it needs. Application-specific business code, such as tasks and projects, still lives in the application directory and does not need to be split into plugins first.

This guide explains how an application manages plugins. It is neither a plugin development tutorial nor a product catalog of every available plugin. The commands follow the CLI installed in the example application; before running them, use `--help` to confirm which options your version supports.

To develop your own plugin, first read [When to write a plugin](../extension-development/when-to-write-a-plugin.md), then generate a scaffold in the current App as described in [Create a plugin](../extension-development/create-plugin.md); for a complete walkthrough, see [Write your first plugin](../extension-development/write-your-first-plugin.md).

To use plugins published by your team, configure the private registry and read access first, then install and register them; see [Build and publish](../extension-development/publish-plugin.md).

## With an Agent

```text
Please inspect the plugin capabilities available in this application and identify which existing business features use them.

Read installed dependencies, actual registrations and relevant guidance first. Do not infer capabilities from names or rebuild something already available.
Do not add, upgrade or remove plugins in this review.

Explain which plugins each feature depends on, which public entries it uses, and any missing administration pages or required configuration.
If a dependency change is necessary, explain the reason, compatible version and affected features, then prepare a reviewable change proposal.
Preserve user permissions and business data.
```

When you really want to change plugins, state the goal clearly, for example "update the application's scheduled tasks plugin to a version confirmed compatible, and verify the existing job definitions and execution". Whether to register, update or remove is decided by that task itself; do not let a capability check change the application's dependencies along the way.

## Without an Agent

### Check installation and registration

First look at the `@nocobase/app-plugin-*` dependencies in `package.json` and the versions actually resolved in the lockfile. Then check the three composition entries:

| File | What it registers |
| --- | --- |
| `client/plugins.ts` | Plugin contributions in the browser |
| `server/plugins.ts` | Server contributions such as Providers and routes |
| `cli/plugins.ts` | Command-line contributions |

A package appearing in the dependencies does not mean it is registered with the runtime, and the three entries do not need to match; a plugin that only provides commands, for example, only needs the CLI entry. The order of each array affects the order of contributions, so do not rearrange it just to look tidy.

A Skill in `.agents/skills/` does not prove a plugin is enabled either, because Skills may be synchronized from direct dependencies. Actual registration is decided by the composition entries. Plugin packages usually go in the application's `dependencies` so they reach the deployment build; do not assume client plugins can only go in `devDependencies`.

### Use existing capabilities

First read the installed plugin's Skill to confirm which service Tokens, client Hooks, components, routes and management capabilities it makes public. Business features should call these capabilities through public exports; do not write to a plugin's internal tables or import implementations from its internal source paths.

For example, the project feature uses the authorization plugin to declare actions such as "view, create, change task project" and reuses user and role management; there is no need to install another permission package, nor to implement a second role store. The application still has to connect the capabilities it uses to real pages and business APIs; installing dependencies alone does not complete a business feature.

### Register a plugin that is really missing

The commands below use the scheduled tasks plugin as an example. If the application already registers it, skip this step; before substituting another plugin, confirm its availability, version requirements and the configuration it needs:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-scheduler --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-scheduler
```

The command installs the dependency, connects the composition entries the plugin exports, and synchronizes Skills. Afterwards, check `package.json`, the lockfile and the actual changes to Client, Server and CLI registration. To pin a compatible version, use `--version`; do not assume a new package's default version is compatible with the current application.

Running `pnpm add` on its own only installs the package and cannot replace runtime registration. `--no-install` requires the dependency to already resolve; `--disabled` installs without connecting the runtime contributions, which does not mean the feature is usable. Check the command output to see which entries were actually handled.

### Update plugins

Preview the update plan for a single plugin first, then update:

```bash
pnpm nocobase plugin update @nocobase/app-plugin-scheduler --dry-run
pnpm nocobase plugin update @nocobase/app-plugin-scheduler
```

The package name is a positional argument, not `--plugin`. Without a package name, every registered plugin is updated, so name the package when you only want to update one capability.

pnpm updates follow the version range the project declares; with a pinned range, a higher version is not guaranteed. To upgrade beyond the range, first settle on a compatible target version, adjust the dependency range, synchronize the lockfile and Skills, then check the changes. Updating a plugin is not the same as merging a newer template, and it cannot replace the overall process in [Upgrade NocoBase Core](upgrade-nocobase-core.md).

After updating, check the migrations, configuration and public API changes the plugin may bring, verify the features that use it, and rebuild the application. Builds that are already deployed do not change just because the dependencies in the development directory were updated.

### Tell disabling a feature apart from removing a plugin

When you just want to stop showing a feature for a while, first decide whether to hide the entry only or to forbid its use. Hiding a menu does not stop direct page visits or API calls; a disabling strategy must cover every real entry point, and keep the code and data needed to restore it later.

Before removing a plugin completely, find its imports in the application, its Client, Server and CLI registrations, routes, configuration, services and tests, and any other capabilities that depend on it. Only after those references are migrated or removed should you uninstall it.

`<name>` below is a placeholder; replace it with a plugin confirmed to be no longer used. Do not run this against a plugin that still serves business features:

```bash
pnpm nocobase plugin unregister '@nocobase/app-plugin-<name>' --dry-run
pnpm nocobase plugin unregister '@nocobase/app-plugin-<name>'
```

You can also remove a direct NocoBase dependency with `pnpm nocobase package remove <full package name>`; if it is a plugin package, it is handed to the plugin unregistration process. Do not just delete a line in `package.json` by hand, or registrations and synchronized files may be left behind.

The unregister command does not decide what happens to historical business data, and it is not a database rollback plan. When data needs to be kept, migrated or deleted, design that separately; do not delete the plugin's directories or tables along the way to "clean up".

### Extend the interfaces plugins provide

| Need | Prefer |
| --- | --- |
| The plugin already has a configuration option | Pass public options at registration |
| The plugin exposes composable components | Import them from public exports and compose them in the application |
| You need to change the interface source freely | Install components or blocks from the [NocoBase UI Library](https://ui.nocobase.com/), with the application maintaining its copy |
| Replace how one of the plugin's pages is rendered | The supported `client/route-overrides.ts`, or the override mechanism the plugin provides |
| A business page that belongs entirely to the application | Register your own page in `client/routes.ts` |

When overriding a page, keep the original route's identity, path and access conditions, and replace the lazily loaded component according to the contract; do not declare the same path again to create a conflict, and do not stack several override sources on one route. In the current template, pages such as sign-in and registration are application source; using the authentication plugin does not make them routes owned by the plugin.

Do not edit package contents in `node_modules/` or `.agents/skills/`. Put application-specific conventions in `.agents/rules/`, and fix problems in a shared plugin itself in its source repository.

## Verify results

Check the dependencies and lockfile, the three composition entries, the synchronized Skills and the actual consumers. Run type checks, tests and builds for the affected parts; for migrations, verify old data after the upgrade; for APIs, check the application's API documentation. In the browser, verify both normal access and ordinary users' permission boundaries.

If you changed dependencies by hand, or an interrupted operation left Skills inconsistent, synchronize again:

```bash
pnpm nocobase skills sync
```

Synchronizing only repairs the guidance copies; it does not register plugins or fix application code. For more, read [Application development overview](overview.md) and [Testing and acceptance](testing-and-acceptance.md).
