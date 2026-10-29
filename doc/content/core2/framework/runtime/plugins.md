---
title: Plugin loading and extensions
description: Learn how plugins register separately with the client, server and CLI runtimes, how their declarations reach the application, and where dependency and extension boundaries lie.
---

Plugins declare their contributions through public entries, and the target application assembles them explicitly. Installing the dependency, registering it with each runtime and connecting it to the business are three steps to confirm separately.

## Each runtime registers separately

| Runtime | Plugin entry | Application entry |
| --- | --- | --- |
| Client | `package/client` | `client/plugins.ts` |
| Server | `package/server` | `server/plugins.ts` |
| CLI | `package/cli` | `cli/plugins.ts` |

A plugin provides only the entries it needs; a package that only distributes Skills may have no runtime entry at all. Registering on the client does not enable the server part, and registering on the server does not install components on pages.

## How declarations reach the application

`defineClientPlugin()`, `defineServerPlugin()` and `defineCliPlugin()` describe a plugin's contributions. The target application imports the plugin factories and adds the results to each runtime's aggregated declarations. The runtime resolves these contributions and, at the appropriate stage, registers services, constructs routes, loads resources or mounts React Providers.

Importing a declaration should not read business data, start tasks or open connections. Declaration options carry stable assembly parameters; deployment credentials belong in server configuration, never in client plugin options.

## Dependencies and extension boundaries

A plugin exposes service interfaces and Tokens to other plugins, which consume them from public exports. A missing dependency should produce a clear error during assembly or startup, rather than being worked around with deep relative imports of another package's private files.

You can replace a page by overriding a client route component: replace the page loader while keeping the path, identity and permission metadata the plugin defined. UI assets meant for free composition at the source level are distributed through a separate Registry, which does not register runtime plugins.

## Verifying integration

Check what is actually registered with each runtime, whether the database resources ran, whether routes are reachable, and how the built application behaves. `plugin inspect` reads the static integration surface and cannot prove that the business works; a registration snapshot likewise only shows which plugins are declared, not that all of their capabilities are used.

For the workflow, see [Manage plugins](../../developing-apps/manage-plugins.md); for source assets, see [Optionally distribute UI source assets](../../extension-development/frontend-components.md#optionally-distribute-ui-source-assets).

## Interfaces and implementation

- [Client plugin composition](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [Server plugin contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/plugins/index.ts)
- [CLI contributions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli/README.md)
