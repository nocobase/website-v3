---
title: "Application foundation"
description: "Inspect integrated Core capabilities, usage evidence and business-module associations."
---

## Capabilities

`@nocobase/app-plugin-foundation` shows which Core capabilities an application integrates, evidence of their use and associations with business modules.

Foundation observes existing integrations; it neither installs plugins nor replaces live acceptance.

### Inspect capabilities

Select capabilities such as accounts, permissions, files, notifications or AI to inspect configuration, identified usage and related packages. On request, the plugin reads configuration, registered services, the default connection and migration information. Results are briefly cached; Refresh collects again.

Installed, registered, configured and used are distinct evidence. A dependency alone does not prove business use. Unrecognized custom or commercial extensions can appear independently with usage still undetermined.

## Scenarios and examples

### Example: check Mail integration

1. Inspect the recognized Mail runtime and connected accounts.
2. Open the business module to confirm its [Email](../notifications/mail.md) account and workspace pages are integrated.
3. Perform a controlled send/receive check and inspect available usage evidence.

Foundation does not replace actual delivery, model calls or acceptance tests. Record counts run only on explicit request; failed collection is not zero.

**Development prompt** (for a Coding Agent working in the application directory):

```text
Use Foundation to expose Core capability evidence to administrators. Reuse an
existing page where present, retain unrestricted-only access, and place it in
settings. Add the CLI contribution if deployment needs module associations.
Distinguish installed, registered, configured and observed use. Do not render
collection failure as zero or unused. Verify denial for ordinary-user API calls
and run separate controlled acceptance for capabilities such as email.
```

**Done when**: Administrators see evidence, ordinary users are denied, and unidentified or failed observations are not presented as business conclusions.

## Key principles and implementation

These are the integration areas and expected interface changes for this example. They describe development work; use the actual file layout of your application.

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Client and Server plugin options | Configure page and navigation | Show capability overview in settings |
| Optional CLI contribution and build | Generate foundation-modules.json | Retain static module associations after deployment |
| Business verification records | Correlate observations with live acceptance | Dependency presence is not mistaken for working integration |

### Integration and entry point

Register Client and Server after dependencies such as Authentication and Authorization. `foundation()` adds `/foundation` and navigation. The default template uses `foundation({ settingsGroup: true })`.

| Client option | Purpose |
| --- | --- |
| `path` | Change the page path |
| `navigation: false` | Keep the page without a menu entry |
| `routes: false` | Mount the public `FoundationPage` yourself |
| `settingsGroup: true` | Place the entry in settings |

The page and `GET /api/foundation/overview` require an unrestricted identity, such as a root permission-set holder. This is not an ordinary page permission assignable to any role.

### Modules and deployment

Modules come from navigation; associations come from recognized pages, APIs and backend dependencies. An empty matrix cell means unidentified, not unused.

Register the `/cli` contribution to preserve static associations in deployment builds. It generates `dist/server/foundation-modules.json`; existing applications must rebuild. Analysis does not execute scanned business source.

## AI development constraints and verification

### Plugin-specific development constraints

- Retain unrestricted-only access on pages and APIs instead of widening it to any signed-in user.
- Do not interpret blank associations or failed collection as unused; retain observation timestamps.
- Check deployment artifacts and separately verify email, model or database behavior; overview counts do not replace business tests.

### Limits and verification

Verify administrator access, ordinary-user denial, refresh and collection-failure presentation. Other connections, opaque wiring and unsupported extensions may be outside coverage. Retained reliable observations show their original time.

Foundation does not install, enable or upgrade plugins and does not prove that migrations or business tests passed. Related: [Manage plugins](../../developing-apps/manage-plugins.md), [Database explorer](../data-and-files/database-explorer.md).

These are acceptance requirements for your integration, not claims of completed live verification. Ask the Agent to report actual changes, executed checks and unverified items. See [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md) for project guidance, Skills and shared checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-foundation).
