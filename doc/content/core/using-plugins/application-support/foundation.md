---
title: "Application foundation"
description: "Inspect integrated Core capabilities, usage evidence and business-module associations."
---

`@nocobase/app-plugin-foundation` shows which Core capabilities an application integrates, evidence of their use and associations with business modules.

## Integration and entry point

Register Client and Server after dependencies such as Authentication and Authorization. `foundation()` adds `/foundation` and navigation. The default template uses `foundation({ settingsGroup: true })`.

| Client option | Purpose |
| --- | --- |
| `path` | Change the page path |
| `navigation: false` | Keep the page without a menu entry |
| `routes: false` | Mount the public `FoundationPage` yourself |
| `settingsGroup: true` | Place the entry in settings |

The page and `GET /api/foundation/overview` require an unrestricted identity, such as a root permission-set holder. This is not an ordinary page permission assignable to any role.

## Inspect capabilities

Select capabilities such as accounts, permissions, files, notifications or AI to inspect configuration, identified usage and related packages. On request, the plugin reads configuration, registered services, the default connection and migration information. Results are briefly cached; Refresh collects again.

Installed, registered, configured and used are distinct evidence. A dependency alone does not prove business use. Unrecognized custom or commercial extensions can appear independently with usage still undetermined.

## Example: check Mail integration

1. Inspect the recognized Mail runtime and connected accounts.
2. Open the business module to confirm its [Email](../notifications/mail.md) account and workspace pages are integrated.
3. Perform a controlled send/receive check and inspect available usage evidence.

Foundation does not replace actual delivery, model calls or acceptance tests. Record counts run only on explicit request; failed collection is not zero.

## Modules and deployment

Modules come from navigation; associations come from recognized pages, APIs and backend dependencies. An empty matrix cell means unidentified, not unused.

Register the `/cli` contribution to preserve static associations in deployment builds. It generates `dist/server/foundation-modules.json`; existing applications must rebuild. Analysis does not execute scanned business source.

## Limits and verification

Verify administrator access, ordinary-user denial, refresh and collection-failure presentation. Other connections, opaque wiring and unsupported extensions may be outside coverage. Retained reliable observations show their original time.

Foundation does not install, enable or upgrade plugins and does not prove that migrations or business tests passed. Related: [Manage plugins](../../developing-apps/manage-plugins.md), [Database explorer](../data-and-files/database-explorer.md).

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-foundation).
