---
title: Developer tools
status: Body to be completed
description: Creating apps and plugins, the command line, testing, deployment installers, templates, and global skills.
---

> [!PENDING] Body to be written
> The table below comes from the NocoBase repository's `v3-develop` branch (2026-10-23).

| Tool | What it does | Who uses it |
| --- | --- | --- |
| `@nocobase/create-app` | `pnpm create @nocobase/app`: creates an app from a template | Developers, agents |
| `@nocobase/app-template-default` | The default template, with the standard product building blocks | Creating apps |
| `@nocobase/app-template-examples` | The examples template, with runnable examples | Learning, reference |
| `@nocobase/app-cli` | The app's command line `pnpm nocobase`: configuration, database, plugins, skills, build | Developers, agents, operators |
| `@nocobase/app-cli-client` | The app's own command line: sign in and run the business commands the app publishes | Business users, business agents |
| `@nocobase/app-skills` | Three skills for app development, upgrade, and deployment | Agents |
| `@nocobase/app-testing` | Testing tools: isolated test databases, commands, page rendering | Developers, agents |
| `@nocobase/app-installer` | Installs, upgrades, and rolls back deployment packages on a server | Operators, agents |
| `@nocobase/app-host`, `@nocobase/app-host-docker` | A host that runs one or more apps on its own; the Docker version runs one container per app | Operators |
| `@nocobase/agent-runner` | Runs agents on a machine: registers with the app, claims runs, and drives Claude Code, Codex, OpenCode, and others | Operators, Studio |
| `@nocobase/create-plugin` | Creates a plugin | Plugin developers |
| `@nocobase/dev-config` | Shared TypeScript, ESLint, Vitest, and Vite configuration | Developers |

## Global skills

Before creating an app, an agent needs to install the skills globally:

```bash
npx skills@latest add nocobase/skills-v3 --skill '*' -g
```

| Skill | What it does |
| --- | --- |
| `nocobase-create-app` | Creates, configures, and starts an app |
| `nocobase-app-installer` | Installs, upgrades, and rolls back deployment packages, locally or on a server over SSH |
| `nocobase-app-plugin-development` | Develops NocoBase 3 plugins |
