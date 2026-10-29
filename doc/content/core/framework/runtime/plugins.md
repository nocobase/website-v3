---
title: Plugin loading and extensions
---

Plugins declare contributions through public entries and are explicitly assembled by the target application. Dependency installation, runtime registration and business integration are separate steps.

## Independent runtime registration

| Runtime | Plugin entry | App entry |
| --- | --- | --- |
| Client | `package/client` | `client/plugins.ts` |
| Server | `package/server` | `server/plugins.ts` |
| CLI | `package/cli` | `cli/plugins.ts` |

Entries are optional. A Skills-only package may have none. Client registration does not enable a server entry, and server registration does not install page components.

## Resolving declarations

`defineClientPlugin()`, `defineServerPlugin()` and `defineCliPlugin()` describe contributions. The application imports factories and adds their results to each runtime's declarations. Runtime resolution then registers services, constructs routes, loads resources or mounts React Providers at the appropriate stage.

Imports should not query business data, start tasks or open connections. Plugin options describe stable assembly settings. Deployment credentials belong in server configuration, never client plugin options.

## Dependencies and extension boundaries

Export service interfaces and tokens for other plugins to consume through public entries. Missing dependencies should fail clearly during composition or startup rather than require relative imports into another package's private files.

Client route component overrides replace page loaders while retaining plugin-owned paths and identity/access metadata. Independently distributed Registry assets provide editable UI source; they do not register runtime plugins.

## Verifying integration

Check actual runtime registration, database resource execution, route access and the built application's behavior. `plugin inspect` reads static declarations and does not establish business functionality. Registration snapshots identify declared plugins, not every capability actually used.

See [Manage plugins](../../developing-apps/manage-plugins.md) and [Publish UI source assets](../../extension-development/frontend-components.md#optionally-distribute-ui-source-assets).

## Interfaces and implementation

- [Client plugin composition](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-client/README.md)
- [Server plugin contracts](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-server/src/plugins/index.ts)
- [CLI contributions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/app/app-cli/README.md)
