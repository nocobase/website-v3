---
title: Command-line runtime
---

`@nocobase/app-cli` combines framework commands, application business commands and plugin commands into one tree. Application metadata determines whether it loads source or deployment entries.

## Locating the application

The source entry searches upward from the working directory for application `package.json`. `nocobase.templateKind` identifies source; `nocobase.buildTarget` identifies deployment output. `NOCOBASE_APP_ROOT` selects an application without changing the working directory.

A deployment's `dist/cli/index.js` supplies its own location and needs neither a global CLI nor pnpm. Use the entry from the actual release to avoid resolving another project's command version.

```bash
pnpm nocobase commands --json
node dist/cli/index.js commands --json
```

## Business command namespaces

| Source | Declaration | Example |
| --- | --- | --- |
| Application | `cli/commands/orders/sync.ts` | `nocobase app orders sync` |
| Plugin | CLI contributions in `cli/plugins.ts` | `nocobase orders info` |
| Development tooling | Plugin `devCommands` and hooks | Retained only in source environments |

A plugin topic normally strips the scope and `app-plugin-` prefix. Packages producing the same topic conflict; registration order is not an override mechanism.

## Starting only needed services

Commands extending `AppCommand` can use `withApp()` to create, use and dispose an application. Configuration reads and migrations usually do not need all background consumers. Call `app.start()` only when business behavior requires the complete lifecycle.

Importing a module should only declare commands. Top-level database connections would make help and discovery commands perform work. Development hooks are collected through the registered CLI; do not invoke internal build scripts around it.

## Output and delivery

Returned command data becomes the JSON envelope's `result`; progress belongs on stderr. Callers check exit codes, `ok`, `status` and warnings. Rebuild after adding commands to include them in deployment output.

For application-side authoring and registration, see [Write application commands](../../developing-apps/application-commands.md) and [Integrate plugin commands](../../developing-apps/plugin-commands.md). Plugin declarations are covered in [Extend the CLI](../../extension-development/extend-command-line.md), and built-in options in [CLI reference](../../reference/cli.md). For a standalone HTTP client, see [Provide an application CLI client](../../developing-apps/cli-client.md).

## Interfaces and implementation

- [CLI runtime](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli/README.md)
