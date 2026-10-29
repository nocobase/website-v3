---
title: Integrate plugin commands
description: Register existing plugin commands through cli/plugins.ts and verify namespaces, development commands, build hooks and deployment behavior.
---

Plugins expose commands through their `./cli` entry. The application chooses contributions in `cli/plugins.ts`. This guide covers application-side registration and use; see [Extend the CLI](../extension-development/extend-command-line.md) for implementing and exporting plugin commands.

## Check what the plugin provides

Read its documentation, `package.json` exports and `cli/index.ts`. Confirm the `./cli` entry and any services or configuration the commands require. A client or server plugin does not necessarily provide commands.

The default template registers Foundation and Scheduler in `cli/plugins.ts`. Examples also registers CLI Example, Agents and other contributions. Preserve the application's existing entries and connect the runtime parts required by each plugin.

CLI, server and client registration serve different purposes. Registering a CLI contribution does not automatically register a service that its commands need: check `server/plugins.ts` too. See [Manage plugins](manage-plugins.md) for installation and registration.

## Register with the application

This example uses the local `@nocobase/app-plugin-notice-cli` created in [Extend the CLI](../extension-development/extend-command-line.md). Complete that guide first and install workspace dependencies so the package resolves. This is a tutorial package, not a claim that the name is available on npm.

Preview registration, then apply it:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install
```

`--no-install` skips dependency installation; install the workspace first and keep `package.json` and the lockfile maintained. Inspect the generated `cli/plugins.ts`. Extending the default template produces a list like this; preserve any additional entries in your application.

```ts
// cli/plugins.ts
import { defineCliPlugins, type AppCliPlugins } from '@nocobase/app-cli';
import foundation from '@nocobase/app-plugin-foundation/cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';
import noticeCli from '@nocobase/app-plugin-notice-cli/cli';

const cliPlugins: AppCliPlugins = defineCliPlugins([
  scheduler,
  foundation,
  noticeCli,
]);

export default cliPlugins;
```

`defineCliPlugins()` combines contributions in array order. Do not add an entry again after automatic registration. When editing manually, maintain both its import and array entry.

## Find and run commands

The topic of `@nocobase/app-plugin-notice-cli` is `notice-cli`. Its declared `preview` command is invoked as:

```bash
pnpm nocobase notice-cli preview --help
pnpm nocobase notice-cli preview --text " Hello " --json
pnpm nocobase notice-cli preview --text " " --json
```

The second command returns `result: { text: "Hello", length: 5 }`. The third returns `INVALID_TEXT` with exit code `2`. Use `pnpm nocobase commands --json` to discover commands and a command's `--help` for its arguments. See [Write application commands](application-commands.md) for the shared output and error contract.

Examples already includes another runnable command:

```bash
pnpm nocobase cli-example greet world --json
```

It comes from `@nocobase/app-plugin-cli-example` and returns a greeting and target name. The default template does not register this example plugin, so do not assume the command exists there.

A topic normally comes from the package name without its npm scope and `app-plugin-` prefix. Duplicate topics conflict; registration order cannot override them. Resolve the plugin naming conflict instead of removing unrelated application commands.

## Development commands and build hooks

| Contribution | Application use | In a deployment |
| --- | --- | --- |
| `commands` | Runtime diagnostics and maintenance | Included |
| `devCommands` | Source inspection and generation | Not registered |
| `buildHooks` | Tasks during application builds | Build-time execution, not deployment commands |
| `devHooks` | Tasks before development startup | Development-time execution |

Build stages are `beforeBuild`, `afterClientBuild`, `afterServerBuild` and `afterBuild`; the development stage is `beforeDev`. The application CLI collects registered hooks. Use the project's `pnpm build` and `pnpm dev`; do not copy every hook into application scripts.

A hook's `command` is an executable and argument array, not a shell expression. See [Extend the CLI](../extension-development/extend-command-line.md#development-commands-and-hooks) for authoring details. The `preview-acceptance.ts` helper in Examples supports that application's acceptance checks; it is not required for general plugin registration.

## Verify and remove

Confirm that help includes the topic, valid input returns the expected result and invalid input returns a stable error code. After building, verify the deployment entry:

```bash
pnpm build
node dist/cli/index.js notice-cli preview --text Hello --json
node dist/cli/index.js commands --json
```

The deployment command set should include `commands` and exclude `devCommands`. For commands that use services or a database, also verify real service access with isolated configuration. A text preview verifies only registration and output.

To stop exposing just the CLI contribution, remove its import and array entry from `cli/plugins.ts`, then rebuild. Before uninstalling the entire plugin, check other runtimes, dependencies and database resources as described in [Manage plugins](manage-plugins.md).

Sources: [Examples CLI registration](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/cli/plugins.ts) and [CLI Example declaration](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/examples/app-plugin-cli-example/cli/index.ts).
