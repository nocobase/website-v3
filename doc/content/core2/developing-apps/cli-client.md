---
title: Provide an application CLI client
description: Use app-cli-client to give an application its own command-line entry, connect it to server business APIs, and debug it locally and package it for distribution.
---

An application can have its own CLI, such as `nocobase-examples`. Users sign in to the application from their own computers and then perform server-side business operations through commands, with no need for the application's source code or database configuration. The same CLI can also serve as the entry through which Agents call business features.

`@nocobase/app-cli-client` handles sign-in, command discovery and HTTP calls, while the server's command manifest decides which business commands exist. When a command runs, the business logic is still carried out on the server.

## When you need one

| Scenario | Entry |
| --- | --- |
| Export data or run maintenance tasks inside the application environment | [Application commands](application-commands.md), such as `pnpm nocobase app statuses export` |
| Use local maintenance or development commands provided by a plugin | [Plugin commands](plugin-commands.md), such as `pnpm nocobase notice-cli preview` |
| Users, automation or Agents use an already running application over the network | A standalone CLI, such as `nocobase-examples user options` |

The standalone CLI generates its commands from the business API descriptions. Putting a file into `cli/commands/` does not turn it into a remote business command.

## Prepare the server first

This guide reuses the Examples template's existing configuration and its `user options` command. You need a working Examples application with its database initialized, and a sign-in account allowed to read the user management options.

The server needs the following integrations; adding a name to `package.json` is not enough:

- **API documentation and a command manifest.** Routes describe their parameters, responses and identity requirements through public mechanisms such as `describeRoute()`, and the CLI reads them from the application's command manifest, by default at `/api/cli/manifest`.
- **Caller identity.** The current Examples connects caller resolution to the CLI service through the Agents plugin, working with the authentication, users and authorization plugins to handle identity and permissions. Your own application must provide the equivalent integration; the default template is not guaranteed to include all of it out of the box.
- **Browser sign-in.** The Examples authentication configuration includes device authorization, bearer sessions and a `/device` confirmation page, and allows the client ID `nocobase-cli`. If you use your own ID, adjust the allowlists on the client and the server together.

See the [Examples authentication configuration](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/server/config/auth.ts) and the [Agents CLI identity integration](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/plugins/app-plugin-agents/server/cli/surface.ts). Whether a command is visible in the manifest and how the API actually authorizes it are two different layers; business APIs must still verify permissions and data scope on every request.

## Configure the client name

The Examples `package.json` already contains the configuration below. For your own application, merge `cli` into the existing `nocobase` object, keep the other fields, and add a version of `@nocobase/app-cli-client` that matches the application to `devDependencies`.

```json
{
  "nocobase": {
    "cli": {
      "bin": "nocobase-examples",
      "displayName": "NocoBase Examples",
      "auth": {
        "clientId": "nocobase-cli"
      }
    }
  }
}
```

`bin` is the command name users type, `displayName` is used in help and messages, and `auth.clientId` corresponds to a device sign-in client the server allows. A new application can use its own names, but must not take the framework's `nocobase` or the Runner's `nocobase-runner`.

Options such as `envPrefix`, `stateDir` and `skills` are used as needed; for all fields, see the [CLI configuration reference](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-cli/README.md#the-applications-own-cli-cli-build-and-cli-link). Here, the goal is just to get connection and business calls working.

## Connect and call locally

In the root of the Examples application, run:

```bash
pnpm nocobase cli link
pnpm exec nocobase-examples --help
```

`cli link` creates a command entry in the project's `node_modules/.bin` for local debugging. It neither starts the server nor configures the server's sign-in and command manifest.

Make sure the application server is running, and replace the example address below with the real one; if the application is deployed under a subpath, include that path as well:

```bash
pnpm exec nocobase-examples login --server https://your-app.example.com
pnpm exec nocobase-examples whoami
pnpm exec nocobase-examples docs
pnpm exec nocobase-examples user options --help
pnpm exec nocobase-examples user options --json
```

`login` shows an authorization code and guides you to confirm in the browser; on success it saves the sign-in profile for the current server. `whoami` checks the current identity, `docs` lists the available business commands, and a specific command's `--help` shows its parameters.

`user options` is an existing read-only API of the users plugin that returns the role scopes and role options that can be assigned in user management. Which commands are actually available depends on the server version and the manifest for the current identity; a command name alone does not tell you whether you have access. Use `--profile` to keep configurations for different environments apart; for automated sign-in and other parameters, check `login --help` first.

## Provide your own business commands

First write, register and verify the business HTTP API, as described in [Routes and HTTP APIs](apis-and-services.md). The CLI uses the same API description, so there is no need to write a duplicate implementation in `cli/commands/`.

The users plugin's `/options` API spreads `cliRoute({ command: 'user options' })` into its `describeRoute()` metadata. You can obtain equivalent CLI metadata as below and merge it into an existing declaration with `...cliMetadata`:

```ts
import { cliRoute } from '@nocobase/app-server/router';

// Merge into the existing describeRoute({ ... }) metadata.
const cliMetadata = cliRoute({ command: 'user options' });
```

This is only a fragment of route metadata, not a complete endpoint; parameter validation, response declarations, authentication and business handling stay in the original route. For the full example, see the [users plugin routes](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/plugins/app-plugin-users/server/routes/index.ts).

`cliRoute()` can set the command name, positional arguments, options and examples; without customization, the command name can be derived from the API description. To exclude an API, use `cliRoute(false)`, which only affects the CLI manifest and does not disable the HTTP endpoint. For all options, see the [CLI route contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/router/cli/types.ts).

When an API changes, check the CLI's help, parameters, results and failure semantics again, and verify server-side authorization with accounts that have different permissions.

## Build and distribute

Once local calls are verified, build the standalone CLI in the application root:

```bash
pnpm nocobase cli build --help
pnpm nocobase cli build --universal --json
```

`--universal` produces an archive without a bundled Node.js, so users need Node.js 24 or later; without `--targets` as well, only this universal archive is built. When you need to bundle a runtime, choose supported target platforms as described by `--help`.

By default the output goes under the application's `storage/runners/dist/`, organized by channel, product and version, and contains the archives and a manifest; the exact paths are reported by the build. `cli build` only packages; it does not upload archives or deploy the application. Distribute them through a download site or an existing release process, as your product needs.

Before delivery, unpack the archive in a separate directory and use its `bin/nocobase-examples` to verify help, sign-in, `whoami` and one business command you are allowed to run, to confirm the client can connect to the target application. The client archive and the application deployment directory produced by `pnpm build` serve different purposes and must be verified separately.

## Troubleshoot common problems

| Symptom | What to check |
| --- | --- |
| `pnpm exec` cannot find the command | Whether `nocobase.cli.bin` is right, and whether dependency installation and `cli link` succeeded |
| Sign-in cannot complete | The real server address, device sign-in configuration, client ID and confirmation page |
| The command manifest is unavailable after sign-in | Whether `/api/cli/manifest` and the caller identity integration work |
| A business command is missing | The current server version, whether the route made it into the API documentation, CLI exclusions and identity-based filtering |
| The command exists but the request is rejected | The current account's action permissions, data scope and the API's validation |

For the shared overview of these local and remote entries, see [Command-line reference](../reference/cli.md).
