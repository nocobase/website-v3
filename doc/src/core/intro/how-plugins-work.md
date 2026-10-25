---
title: How plugins work
description: Most NocoBase 3 plugins have no settings page. This page explains what a plugin brings to an app, how it gets in, where the interface and admin entry points are, and how to tell which plugins an app uses.
---

In NocoBase 2, you enable a plugin in the plugin manager, configure it on its settings page, and the plugin's features show up in the interface.

A NocoBase 3 app is a body of code, and plugins work differently as a result. A plugin is an npm package the app depends on, registered in the plugin lists. It provides capabilities, agents read its skill and use those capabilities in your pages and workflows, and administrators manage it in the app's **System settings**. The sections below take each in turn.

## What a plugin brings to an app

<figure class="map" aria-label="The five things a plugin may bring">
<div class="row"><div class="box brand"><b>Plugin · an npm package</b><span>Registered in <code>server/plugins.ts</code>, <code>client/plugins.ts</code>, and <code>cli/plugins.ts</code></span></div></div>
<div class="down">May bring</div>
<div class="row c3"><div class="box"><b>Server-side capabilities</b><span>Services, APIs, tables, and permission checks, running on the app's server</span></div><div class="box"><b>Its own pages</b><span>A few plugins have them, and they appear in the app once registered</span></div><div class="box"><b>UI components</b><span>Copied from the UI library into the app's source, and placed into your pages by agents</span></div></div>
<div class="row c2"><div class="box agent"><b>Skills</b><span>Tell agents how to use the plugin, synced to <code>.agents/skills/</code></span></div><div class="box"><b>Commands</b><span>Commands added to <code>pnpm nocobase</code></span></div></div>
</figure>

What plugins bring varies a lot. A few examples (checked against the `v3-develop` branch):

| Plugin | Server-side capabilities | Own pages | UI components | Skill | Commands |
| --- | --- | --- | --- | --- | --- |
| [Files](../plugins/file.md) | Upload, file repository, stable file addresses; the file table is declared by the app | — | Upload, list, thumbnail, preview | Yes | — |
| [Authorization](../plugins/authorization.md) | Permission model, checks, permission sets | — | Permission editor, role list | Yes | — |
| [Scheduled jobs](../plugins/scheduler.md) | Schedules, execution records | — | — | Yes | `scheduler sync` |
| [App foundation](../plugins/foundation.md) | Collects the capabilities the app uses | **App foundation** | — | Yes | Generates the module mapping at build time |
| [Database explorer](../plugins/database-explorer.md) | Read-only APIs: connections, tables, fields | — | — | Yes | — |
| [Task center](../plugins/task-center.md) <span class="tag pro">Commercial</span> | To-do index and APIs | **Task center** | Task center interface | Yes | — |
| [Template printing](../plugins/template-print.md) | — | — | — | Yes | — |

The last example says the most: the template printing plugin has **only a skill** and not a line of runtime code. Once it is installed, the agent learns how to implement "generate a purchase order from a Word template and convert it to PDF" in your app, and the code is written in the app.

## How a plugin gets into the app

Usually you don't need to do any of this yourself. You state what you need, and when the agent finds it needs a plugin, it handles it, or first asks your approval (for example, for the approval plugin, which needs a commercial license). Knowing the process helps you understand what it did:

1. **Register.** `pnpm nocobase plugin register @nocobase/app-plugin-xxx` adds the package to the dependencies in `package.json` and adds a line to each of the plugin lists that the plugin has a part for.
2. **Sync skills.** The plugin's skill is copied into the app's `.agents/skills/`.
3. **Create tables.** When the plugin has its own tables, `pnpm nocobase db apply` runs its migrations.
4. **Put it to use.** The agent reads the skill and implements your request through the plugin's public interfaces: calling its services on the server, using its components in pages, and adding its admin pages to **System settings**.

After registration, you can see one more line in the plugin lists in the code repository:

```ts
// client/plugins.ts (excerpt)
const clientPlugins = defineClientPlugins([
  authentication(),
  authorization(),
  file(),
  approval(), // newly registered approval plugin
]);
```

> [!NOTE] Registered does not mean the feature is built
> Registering a plugin only makes its capabilities available. Most plugins bring no pages, so nothing new appears in the app right after registration. That waits until the agent puts the plugin to use for your request.

## Where the interface comes from

An app's interface has three sources, sharing one style:

| Source | Examples | How to change it |
| --- | --- | --- |
| Pages a plugin ships | **App foundation**, the task center | Adjust through the plugin's registration options or page replacement, without changing plugin code |
| Components from the UI library | The **Workflow management** page, the inbox, approval progress, the permission editor | Owned by the app once copied in, so you can change them directly |
| Pages an agent writes for your business | Supplier list, purchase order details | Tell the agent, and change them like any code |

So the accurate version of "plugins have no interface" is that plugins rarely decide the interface for you. The interface is built around your business, and plugins provide the parts and the capabilities behind it.

## Where configuration lives

NocoBase 2's plugin settings pages are split into three places in 3:

| Where | What goes there | Examples | Who changes it |
| --- | --- | --- | --- |
| `config.yml` | Deployment-related configuration, including secrets | Database, object storage, mail provider accounts, Redis for background jobs | Operations |
| Code | Business rules and structure | The purchase order workflow, who can see which orders, what time the daily reminder goes out | The agent, then redeploy |
| **System settings** | What administrators adjust day to day | Users and roles, data scopes, sharing rules, approvers, amount thresholds, pausing a scheduled task | App administrator, effective once saved |

Which rules go into **System settings** is part of the requirements. For values that may need adjusting after launch, say so when you make the request, and the agent will make them settings that administrators can adjust.

## Where the admin entry points are

Not in one unified plugin settings page, but in the app's **System settings**, appearing according to the capabilities the app uses. The app development skill requires agents to build these pages by default when they deliver an app, so you don't need to ask separately:

- **User management** and **Permission management** (roles and permissions, default data scopes): prepared by the template and enabled when business features are built;
- **Workflow management**: when the app has workflows;
- Scheduled jobs, notifications, and so on: the matching job lists, execution records, and delivery records;
- **App foundation**: to see which capabilities the app uses.

During acceptance you can check that administrators see these entries and the pages show real data, and that ordinary users don't see the entries and are also refused when they visit the address or call the API directly.

## How to tell which plugins an app uses

Open **System settings › App foundation**. It lists the parts the app actually uses, in 13 categories of capabilities, and you can open one to see the packages that provide it, what it does in this system, and which business modules it is tied to. A package that is only installed and not used doesn't count as in use.

::figure core-foundation | **App foundation** shows the capabilities the app uses and the packages that provide them

Developers can also:

- Look at `server/plugins.ts`, `client/plugins.ts`, and `cli/plugins.ts` to see which plugins are registered;
- Look at `package.json` to see which NocoBase packages and versions are installed;
- Run `pnpm nocobase plugin inspect <plugin name> --json` to inspect how a plugin is registered.

## Adding, updating, and removing plugins

| To do this | Command |
| --- | --- |
| Add | `pnpm nocobase plugin register <package name>` |
| Update | `pnpm nocobase plugin update <package name>`; without a name, it updates all |
| Remove | `pnpm nocobase plugin unregister <package name>` or `pnpm nocobase package remove <package name>` |

These commands maintain the dependencies, lock file, plugin lists, and skills together, so don't hand-edit just one of them. Before removing a plugin, confirm the app no longer uses it: the commands update only dependencies and registrations, and don't change the app's code or configuration. For details, see [Manage plugins](../develop/plugins.md).

## Plugins compared with NocoBase 2

| | NocoBase 2 | NocoBase 3 |
| --- | --- | --- |
| What it is | A feature package installed at runtime | An npm package the app depends on |
| Enabling | Click enable in the plugin manager | Register in the plugin lists (`plugin register`), built and deployed with the app |
| Configuration | The plugin's settings page | Three places: `config.yml`, code, and **System settings** |
| Interface | The plugin provides configuration screens and blocks | A few plugins ship pages; most provide UI components that agents build into your pages |
| Who uses it | People configure it in the interface | Agents write code after reading the skill; administrators manage it in **System settings** |
| Upgrading | Upgrade in the plugin manager | `plugin update`, or together with the NocoBase version |
| Seeing what is installed | The plugin manager | **App foundation** and the plugin lists |

## FAQ

### I registered a plugin. Why are there no new pages in the app?

Most plugins bring no pages. Tell the agent what you need, and it will use the plugin's capabilities to build pages and admin entry points.

### Can I change a plugin's code directly?

No. Plugins upgrade with versions, and your changes would be lost at the next update. To customize a plugin's own pages, use its registration options, an extension in `client/extensions/`, or a page replacement in `client/route-overrides.ts`. Components copied in from the UI library belong to the app and can be changed directly.

### The agent didn't use the plugin and wrote its own permissions (or notifications, or scheduled tasks). What do I do?

Have it switch to the plugin. The app development skill lists "rewriting what an existing plugin already does" as the costliest mistake, and requires agents to check the installed plugins first. During acceptance, you can confirm in **App foundation** that the matching capability is lit.

### Where is a plugin's data?

In the app's database. The tables are created by the plugin's own migrations and have a fixed prefix in their names, for example the scheduled tasks plugin's tables start with `schedule`. The app doesn't read or write these tables directly, and uses them through the plugin's interfaces.

### How do I install a commercial plugin?

You need the matching license and a compatible version. The agent tells you when it's needed, for example for approvals: after you confirm the license and how to get the package, register it with the same `plugin register`.
