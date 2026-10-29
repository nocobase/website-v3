---
title: Integrate plugin commands
description: Connect commands provided by existing plugins through cli/plugins.ts, and understand namespaces, development commands, build hooks and deployment verification.
---

Plugins provide commands through their `./cli` entry, and the application chooses which contributions to connect in `cli/plugins.ts`. This guide covers installation, registration and use on the application side; for implementing commands and the plugin publishing contract, see [Command-line extensions](../extension-development/extend-command-line.md).

## First check what the plugin provides

Read the plugin's usage guide, the exports in its `package.json` and its `cli/index.ts` to confirm whether it provides a `./cli` entry and which services and configuration its commands need. A plugin that only provides client or server capabilities does not necessarily come with a CLI.

The default template's `cli/plugins.ts` already registers Foundation and Scheduler; the Examples template also registers CLI Example, Agents and other contributions. Keep the application's existing entries, then connect the runtime parts each plugin needs according to its guide.

CLI, server and client registration each serve their own purpose. For example, when a command needs a plugin's service, connecting only the CLI does not register that service automatically; check `server/plugins.ts` as well. For the full installation and registration process, see [Manage plugins](manage-plugins.md).

## Register with the application

The steps below use the local plugin `@nocobase/app-plugin-notice-cli` created in [Command-line extensions](../extension-development/extend-command-line.md). First finish creating that plugin and implementing its command, and make sure the workspace dependencies are installed and the package resolves. The package name is just a local tutorial example and does not mean a package with that name can be installed from npm.

Preview the registration first, then run it:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-notice-cli --no-install
```

`--no-install` skips dependency installation, so the workspace must be installed beforehand; it also does not relieve you of maintaining `package.json` and the lockfile. After registering, check the generated `cli/plugins.ts`; the result should look like the example below, which extends the default template. If the application already has other plugins, keep them, and do not overwrite the existing list with this whole snippet.

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

`defineCliPlugins()` combines the plugin contributions, and the array order is the registration order. Entries added by automatic registration do not need to be added again by hand; when maintaining the list manually, keep both the import and the array entry.

## Find and run commands

The topic of the plugin package `@nocobase/app-plugin-notice-cli` is `notice-cli`, so the `preview` command it declares is run as:

```bash
pnpm nocobase notice-cli preview --help
pnpm nocobase notice-cli preview --text " Hello " --json
pnpm nocobase notice-cli preview --text " " --json
```

The second command returns `result: { text: "Hello", length: 5 }`; the third returns `INVALID_TEXT` with exit code `2`. You can run `pnpm nocobase commands --json` first to find commands, then check a specific command's `--help`. For the shared output and error handling, see [Write application commands](application-commands.md).

If you are running the Examples application, it comes with another working example:

```bash
pnpm nocobase cli-example greet world --json
```

This command is provided by `@nocobase/app-plugin-cli-example` and returns a greeting and the target name. The ordinary default template does not register this example plugin, so do not assume the command exists there.

A topic is usually the package name without its npm scope and `app-plugin-` prefix. Topics with the same name conflict, and registration order cannot override one with another. When a conflict occurs, adjust the plugins' naming rather than deleting unrelated existing commands from the application.

## Development commands and build hooks

| Plugin contribution | Use in the application | After deployment |
| --- | --- | --- |
| `commands` | Runtime commands such as diagnostics and maintenance | Kept |
| `devCommands` | Development tasks such as reading source and generating files | Not registered |
| `buildHooks` | Plugin tasks run during the application build | Run during the build; not deployment commands |
| `devHooks` | Tasks run before the application starts in development | Run during development |

Build hook stages are `beforeBuild`, `afterClientBuild`, `afterServerBuild` and `afterBuild`, and the development hook stage is `beforeDev`. The application CLI collects the hooks plugins declare, so the project's `pnpm build` and `pnpm dev` run them in the matching flow; there is no need to copy each hook into the application's scripts.

The `command` in a hook declaration is an array of an executable and its arguments and does not go through a shell. For writing hooks, see [Command-line extensions](../extension-development/extend-command-line.md#development-commands-and-hooks). The `preview-acceptance.ts` in Examples is acceptance-helper logic specific to that example application, not a file that plugin registration generally needs.

## Verify and remove

After connecting a plugin, confirm that the help output shows the expected topic, that valid input returns a result, and that invalid input returns a stable error code. After building, verify again through the deployment entry:

```bash
pnpm build
node dist/cli/index.js notice-cli preview --text Hello --json
node dist/cli/index.js commands --json
```

The deployed command set should include `commands` and exclude `devCommands`. If a command needs business services or a database, also check real service calls with a separate verification configuration; a plain text preview only verifies CLI registration and output.

To stop exposing a plugin's CLI only, remove its import and array entry from `cli/plugins.ts` and rebuild. Before uninstalling the whole plugin, also check its other runtime parts, dependencies and data resources, following [Manage plugins](manage-plugins.md).

References: [Examples CLI registration](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/cli/plugins.ts), [CLI Example declaration](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/examples/app-plugin-cli-example/cli/index.ts).
