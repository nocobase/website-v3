---
title: Provide an application CLI client
description: Give an application a standalone CLI using app-cli-client, connect to server business APIs, and test and package it for distribution.
---

An application can have a standalone CLI such as `nocobase-examples`. Users sign in from their own computers and perform server-side business operations without application source code or database configuration. Agents can use the same interface.

`@nocobase/app-cli-client` provides sign-in, command discovery and HTTP calls. The server's command manifest determines the business commands; their business logic executes on the server.

## When to provide one

| Scenario | Entry point |
| --- | --- |
| Export data or run maintenance in the application environment | [Application commands](application-commands.md), such as `pnpm nocobase app statuses export` |
| Use local maintenance or development commands from a plugin | [Plugin commands](plugin-commands.md), such as `pnpm nocobase notice-cli preview` |
| Let users, automation or agents access a running application over the network | A standalone CLI, such as `nocobase-examples user options` |

The standalone CLI derives commands from business API descriptions. Adding a file under `cli/commands/` does not expose it as a remote business command.

## Prepare the server

This guide uses the existing Examples template configuration and its `user options` command. You need a running Examples application with its database initialized, and an account allowed to read user-management options.

The server needs these integrations in addition to a name in `package.json`:

- **API documentation and a command manifest.** Public route declarations such as `describeRoute()` describe inputs, responses and identity requirements. The CLI reads the application's manifest, at `/api/cli/manifest` by default.
- **Caller identity.** Examples currently uses the Agents plugin to connect caller resolution to the CLI service, alongside authentication, users and authorization. A custom application needs the corresponding integration; do not assume the default template includes it all.
- **Browser sign-in.** Examples configures device authorization, bearer sessions and a `/device` confirmation page, allowing the `nocobase-cli` client ID. When changing the ID, update both the client and the server allowlist.

See [Examples authentication configuration](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/templates/app-template-examples/server/config/auth.ts) and [Agents CLI identity integration](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/plugins/app-plugin-agents/server/cli/surface.ts). Manifest visibility and endpoint authorization serve different purposes. Business APIs must still check permissions and data scopes for every request.

## Configure the client name

Examples already has this configuration in `package.json`. For your own application, merge `cli` into the existing `nocobase` object, preserve its other fields and add a compatible `@nocobase/app-cli-client` version to `devDependencies`.

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

`bin` is the command users type; `displayName` appears in help and messages. `auth.clientId` must be accepted by the server's device authorization. Choose your own application's name without taking the reserved `nocobase` or `nocobase-runner` names.

Options such as `envPrefix`, `stateDir` and `skills` are optional. See the [CLI configuration reference](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-cli/README.md#the-applications-own-cli-cli-build-and-cli-link) for all fields. Start by verifying connection and business calls.

## Link and use the client locally

From the Examples application root, run:

```bash
pnpm nocobase cli link
pnpm exec nocobase-examples --help
```

`cli link` creates an entry in the project's `node_modules/.bin` for local development. It does not start the server or configure server sign-in and the command manifest.

With the server running, replace the example URL below with its actual address, including any deployment base path:

```bash
pnpm exec nocobase-examples login --server https://your-app.example.com
pnpm exec nocobase-examples whoami
pnpm exec nocobase-examples docs
pnpm exec nocobase-examples user options --help
pnpm exec nocobase-examples user options --json
```

`login` shows an authorization code and opens browser confirmation, then saves the server's login profile. Use `whoami` to check the active identity, `docs` to discover business commands and command-specific `--help` to inspect arguments.

`user options` is an existing read-only users-plugin endpoint that returns the role scopes and roles assignable in user management. Available commands depend on the server version and caller's manifest. A command name alone does not grant access. Use `--profile` to separate environments; consult `login --help` for automation and other login options.

## Expose your own business commands

First implement, register and verify the HTTP API as described in [HTTP routes and APIs](apis-and-services.md). The CLI uses that same API description without a duplicate implementation under `cli/commands/`.

The users plugin spreads `cliRoute({ command: 'user options' })` into its `/options` route's `describeRoute()` metadata. Equivalently, obtain the metadata below and spread `...cliMetadata` into the existing declaration:

```ts
import { cliRoute } from '@nocobase/app-server/router';

// Merge into the existing describeRoute({ ... }) metadata.
const cliMetadata = cliRoute({ command: 'user options' });
```

This is metadata, not a complete endpoint. Keep validation, response declarations, authentication and business handling in the route. See the complete [users-plugin route](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/plugins/app-plugin-users/server/routes/index.ts).

`cliRoute()` can customize names, positional arguments, flags and examples. Without customization, names can be derived from the API description. `cliRoute(false)` excludes a route from the CLI manifest; it does not disable the HTTP endpoint. See the [CLI route contract](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-server/src/router/cli/types.ts) for all options.

After changing an API, verify its CLI help, arguments, result and failure behavior, and test server authorization with accounts having different permissions.

## Build and distribute

Once local calls work, build from the application root:

```bash
pnpm nocobase cli build --help
pnpm nocobase cli build --universal --json
```

`--universal` produces an archive without bundled Node.js; users need Node.js 24 or later. Without `--targets`, only that universal archive is built. For archives with a runtime, choose supported targets from `--help`.

Outputs default to the application's `storage/runners/dist/`, organized by channel, product and version, with archives and manifests. Read exact paths from the build result. `cli build` packages the client; it does not upload artifacts or deploy the application. Distribute through a download site or your existing release process.

Before delivery, unpack into a separate directory and use its `bin/nocobase-examples` to verify help, sign-in, `whoami` and an authorized business command against the target application. Verify the CLI archive separately from the application deployment produced by `pnpm build`.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `pnpm exec` cannot find the command | `nocobase.cli.bin`, installed dependencies and successful `cli link` |
| Sign-in cannot complete | Server address, device authorization, client ID and confirmation page |
| No command manifest after sign-in | `/api/cli/manifest` and caller-identity integration |
| A business command is missing | Server version, API documentation, CLI exclusion and identity filtering |
| A listed command is rejected | Account permissions, data scopes and endpoint validation |

See [CLI reference](../reference/cli.md) for the shared overview of these local and remote entry points.
