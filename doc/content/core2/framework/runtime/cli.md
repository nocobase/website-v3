---
title: Command-line runtime
description: Learn how the command-line runtime locates the application, organizes framework, application and plugin commands, and starts only the services a command needs.
---

`@nocobase/app-cli` organizes framework commands, the application's business commands and plugin commands into one command tree. It uses the application manifest to tell a source workspace from deployment output, and loads the matching entry.

## Locating the application

When run from source, the CLI searches upward from the working directory for the application's `package.json`. `nocobase.templateKind` marks a source application, and `nocobase.buildTarget` in build output marks deployment output. You can also select the target application with `NOCOBASE_APP_ROOT`; this does not change the current working directory.

The deployment's `dist/cli/index.js` passes its own location, so it needs neither a globally installed CLI nor pnpm. Use the entry from the actual build output, so that commands of a different version from another project do not take part in resolution.

```bash
pnpm nocobase commands --json
node dist/cli/index.js commands --json
```

## Business command namespaces

| Source | Where it is declared | Example |
| --- | --- | --- |
| Application | `cli/commands/orders/sync.ts` | `nocobase app orders sync` |
| Plugin | CLI contributions registered in `cli/plugins.ts` | `nocobase orders info` |
| Development tooling | A plugin's `devCommands` and development hooks | Kept only in source environments |

A plugin's command topic usually comes from its package name with the scope and the `app-plugin-` prefix removed. Two packages that produce the same topic conflict; registration order does not let one override the other.

## Starting only the services you need

Commands that extend `AppCommand` can use `withApp()` to create, use and clean up the application. Reading configuration or running database migrations usually does not need every background consumer; call `app.start()` only when the business logic depends on the complete lifecycle.

Importing a module should only declare commands. Do not connect to the database at the top level of a module, or even showing help or listing commands would have side effects. Development build hooks are collected through the registered CLI runtime; do not bypass the entry to call internal build scripts directly.

## Output and delivery

Data meant for programs is returned from the command and becomes the `result` of the unified JSON output; progress goes to stderr. Callers should also check the exit code, `ok`, `status` and warnings. After adding a command in source, rebuild so that it is included in the deployment output.

For implementing and connecting commands in an application, see [Write application commands](../../developing-apps/application-commands.md) and [Integrate plugin commands](../../developing-apps/plugin-commands.md). For declaring plugin commands, see [Command-line extensions](../../extension-development/extend-command-line.md); for all built-in options, see the [Command-line reference](../../reference/cli.md). For a standalone entry that calls business APIs over HTTP, see [Provide an application CLI client](../../developing-apps/cli-client.md).

## Interfaces and implementation

- [CLI runtime](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli/README.md)
