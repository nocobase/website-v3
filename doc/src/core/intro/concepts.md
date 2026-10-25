---
title: Core concepts
description: One diagram and ten concepts that explain how a NocoBase 3 app is put together: where the code lives, how Core gets into the app, how agents learn to use it, and who adjusts what after launch.
---

## The picture in one diagram

<figure class="map" aria-label="How a NocoBase 3 app is put together">
<div class="row c2"><div class="box human"><b>People</b><span>Make requests and accept the results; after launch, manage in <b>System settings</b></span></div><div class="box agent"><b>Agents</b><span>Read skills and build in the app's code repository</span></div></div>
<div class="down">Both work in the same app</div>
<div class="row"><div class="box brand"><b>App · your code repository</b><span>Created from a template. Pages, APIs, tables, migrations, workflows, and the admin pages in <b>System settings</b> are all here, and you own them</span></div></div>
<div class="down">Depends on Core packages</div>
<div class="row c3"><div class="box"><b>Plugins</b><span>Registered in the plugin lists, bringing server-side capabilities, pages, components, skills, or commands</span></div><div class="box"><b>Foundation libraries</b><span>Used directly: database, record lifecycle, background jobs, storage</span></div><div class="box"><b>UI library</b><span>Copied into the app's source, owned by the app from then on</span></div></div>
<div class="row c3"><div class="box"><b>Skills</b><span>Shipped with packages and synced to <code>.agents/skills/</code>, teaching agents how to use them</span></div><div class="box"><b>Command line</b><span><code>pnpm nocobase</code>: configuration, database, plugins, skills</span></div><div class="box"><b>Runtime</b><span>The app's server-side and browser-side framework</span></div></div>
<div class="down">Runs once deployed</div>
<div class="row"><div class="box"><b>The running app</b><span>Reads <code>config.yml</code> on the server; <b>App foundation</b> shows the Core capabilities it uses</span></div></div>
</figure>

The sections below go through this diagram one piece at a time.

## App

An app is a code repository, created from a NocoBase template. Once deployed, it is a business system. Its main directories:

| Directory | What goes in it |
| --- | --- |
| `client/` | Browser side: routes, pages, components, localization strings; `client/plugins.ts` registers browser-side plugins |
| `server/` | Server side: APIs and services; `server/plugins.ts` registers server-side plugins |
| `database/` | Migrations and seed data |
| `cli/` | The app's own commands; `cli/plugins.ts` registers plugins that bring commands |
| `tests/` | Tests |
| `AGENTS.md`, `.agents/` | Rules and skills for agents |
| `config.example.yml` | Documents the configuration options; the real `config.yml` holds secrets and stays out of the repository |

**Who owns what.** The app owns its pages, components, APIs, tables, migrations, services, translations, tests, navigation, themes, and business logic. A plugin owns its own routes, components, services, and internal tables. The app uses them only through the interfaces the plugin makes public, and never changes plugin code or writes to a plugin's tables directly.

## Template

A template is the starting point for creating an app. An app generated from the default template already has:

- Sign-in, sign-up, and password reset pages, plus the device approval page used when signing in from the command line;
- A home page that explains how to build with agents and lists the built-in capabilities and prompts;
- An inbox, for in-app messages;
- Admin pages that are prepared but not yet enabled: **User management**, **Roles and permissions**, and **Default data scopes**, which an agent enables when the app starts to take on business features;
- **System settings › App foundation**, visible only to administrators with full permissions;
- 16 registered plugins, plus two plugins that are installed but not registered: Agents and knowledge base.

::figure core-app-home | The new app's home page: it explains how to build with agents, and each item under **Built-in capabilities** comes with prompts you can copy

There is also an examples template, with runnable examples: article management, background jobs and queues, scheduled tasks, record lifecycle and the office workflows built on it, real-time updates, the command line, business agents, and more, for people and agents to learn from. When you upgrade NocoBase, the app merges the changes against the new version of the template. See [Upgrade NocoBase](../develop/upgrade.md).

## Plugins

A plugin is a package named `@nocobase/app-plugin-*`, registered in the app's three plugin lists: `server/plugins.ts`, `client/plugins.ts`, and `cli/plugins.ts`. A plugin is enabled when it appears in the lists and disabled when removed.

A plugin can bring up to five things to an app: server-side capabilities, its own pages, UI components, skills, and commands. Most plugins bring no pages, which is one of the biggest differences between NocoBase 3 and 2. For details, see [How plugins work](how-plugins-work.md).

## Foundation libraries

Some capabilities need no registration. The app uses them just by importing them, and they are called foundation libraries. For example:

- **Record lifecycle** (`@nocobase/lifecycle`): the purchase order's path from draft to done is written with it;
- **Database** (`@nocobase/db`): tables, queries, migrations, and dialects for SQLite, PostgreSQL, MySQL, and more;
- **Background jobs and queues** (`@nocobase/jobs`, `@nocobase/queue`): scheduled and background execution;
- **Storage** (`@nocobase/drive`): local storage, S3-compatible storage, and Alibaba Cloud OSS.

## UI library

The UI library ([ui.nocobase.com](https://ui.nocobase.com)) publishes NocoBase's business components, such as the data table, dashboards, rich text editor, flow chart, the **Workflow management** page, the inbox, and approval progress. When an agent installs a component, its source is copied into the app (`client/components/` or `client/extensions/`) and belongs to the app from then on: you can change it, and it is never updated automatically.

So an app's interface has three sources: pages that plugins ship, components from the UI library, and pages that agents write for your business. All three share one style and look like a whole.

## Skills

A skill is a set of instructions (`SKILL.md`) that teaches an agent how to do something. NocoBase packages ship with their own skills, for example the app development skill `nocobase-app-development` and the authorization plugin's `nocobase-app-plugin-authorization`. After dependencies are installed, the template automatically runs `pnpm nocobase skills sync` to sync the skills to the app's `.agents/skills/`, where coding tools such as Claude Code read them in new sessions.

- `.agents/skills/` is generated, and the next sync replaces it entirely, so don't edit it.
- The app's own conventions go in `.agents/rules/`, indexed by `AGENTS.md` and committed to the code repository.
- The two skills used before the app is created (`nocobase-create-app` and `nocobase-app-installer`) must be installed globally first. See the [Quick start](../quickstart.md).

Skills are for agents, and documentation is for people. To find out why an agent did something a certain way, read the matching skill.

## Command line

The app comes with a command line, `pnpm nocobase`, used by both agents and people:

| To do this | Command |
| --- | --- |
| Generate and check configuration | `pnpm nocobase config init`, `config set`, `config check` |
| Run migrations | `pnpm nocobase db apply` |
| Register, update, and remove plugins | `pnpm nocobase plugin register`, `plugin update`, `plugin unregister` |
| Sync skills | `pnpm nocobase skills sync` |

For the full list, see the [command line reference](../reference/cli.md).

## Configuration

Deployment-related settings live in `config.yml` in the app directory: the public address, database connection, secrets, storage, mail provider, whether background jobs use memory or Redis, and so on. It holds secrets, so it stays out of the code repository, and `config.example.yml` explains what each option does. Generate and check it with the `pnpm nocobase config` commands, and read sensitive values from environment variables.

## System settings

**System settings** is the admin entry point in the app. When an agent delivers a complete app, it builds the admin pages here by default, and you don't need to ask separately:

- **User management** and **Permission management** (**Roles and permissions** and **Default data scopes**);
- **Workflow management** when workflows are used: the workflow list, execution records, flow charts, and workflow parameters;
- The matching job lists, execution records, and delivery records when scheduled tasks and notifications are used;
- **App foundation**.

::figure core-settings | The purchasing app's sidebar: business pages on top, and the admin pages under **System settings**. Which ones appear depends on the capabilities the app uses

A new app with only a home page doesn't show these pages. An agent enables them as needed once the app starts to take on business features.

## App foundation

**System settings › App foundation** lists the Core capabilities the app actually uses, lit up in 13 categories: in use, ready but needs setup, and not used yet. Open one to see what it does in this system, which business modules it is tied to, and which packages provide it. Below that is a table mapping business modules to foundation capabilities.

::figure core-foundation | **App foundation**: 9 of the 13 categories are in use. With Workflows & approvals selected, you can see that it supports the purchase order workflow and the daily reminder

The judgment is based on how the app is actually wired up: a package that is only installed doesn't count as in use, and a capability counts only if it is configured and used by a page or API. Only administrators with full permissions can open this page.

## Four layers of responsibility

A capability lands in the app in four layers. Think in these four layers when reading capability pages, writing requirements, and doing acceptance:

| Layer | Who is responsible | Example in the purchasing app |
| --- | --- | --- |
| Ready out of the box | Core | Permission checks, the workflow runtime, file storage, notification delivery |
| Implemented in the app | Agent | The purchase order workflow, "buyers see only their own orders", the attachments area in the order details |
| Adjusted after launch | App administrator, in **System settings** | Assigning roles to people, adjusting data scopes, changing approval amount thresholds, pausing a scheduled task |
| Configured at deployment | Operations, in `config.yml` | Database, object storage, mail provider, Redis for background jobs |

Changes in the second layer mean changing code and redeploying. Changes in the third layer take effect once saved in the app. Which values belong in the third layer is part of the requirements: if something may need adjusting after launch, say so when you make the request, and the agent will make it a parameter that administrators can adjust.
