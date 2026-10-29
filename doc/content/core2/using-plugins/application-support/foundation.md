---
title: "Application foundation"
description: "Inspect the Core capabilities the application has connected, the evidence of their use, and how business modules relate to them."
---

## Capabilities

`@nocobase/app-plugin-foundation` provides an overview of the application's capabilities, helping administrators see which Core capabilities the application has connected, what evidence of use exists, and how each business module relates to those capabilities.

The application foundation is for observing existing integration; it does not install plugins and cannot replace actual business acceptance.

### View application capabilities

After opening the application foundation, choose a capability such as accounts, permissions, files, notifications or AI to see its current configuration, the usage that can be detected and the related packages. On each request, the plugin reads the application configuration, registered services, the default database connection and migration information; results are cached briefly, and a refresh collects them again.

"Installed", "registered", "configured" and "used" are different levels of evidence. A package appearing in the dependencies does not prove the business uses it. Custom or commercial extensions that cannot be recognized may appear as a separate item, whose usage may still need confirming.

## Scenarios and examples

### Example: confirm whether the email capability is connected

1. In the application foundation, check whether the email capability detects the runtime and connected mailboxes.
2. Open the relevant business module and confirm the [Email](../notifications/mail.md) accounts page and workspace are really connected.
3. Do one controlled send-and-receive check, then check usage against the statistics in the foundation.

The foundation shows the evidence it reads; it cannot replace actually sending and receiving mail, calling models or business acceptance. Record totals are queried only when statistics are explicitly chosen, and a collection failure should not be read as a count of zero.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use Foundation to expose Core capability evidence to administrators. Reuse an
existing page where present, retain unrestricted-only access, and place it in
settings. Add the CLI contribution if deployment needs module associations.
Distinguish installed, registered, configured and observed use. Do not render
collection failure as zero or unused. Verify denial for ordinary-user API calls
and run separate controlled acceptance for capabilities such as email.
```

**Done when**: administrators can see the capabilities and their evidence, ordinary users are refused, and unrecognized or failed collection states are never reported as business conclusions.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| Client and Server plugin configuration | Configure the page path and navigation options | The capability overview appears in system settings |
| Optional CLI contribution and build | Generate `foundation-modules.json` | Static module associations can be read after deployment |
| Business verification records | Match the foundation's observations with actual business acceptance | "The dependency exists" is never mistaken for "the business works" |

### Integration and entry points

Register the Client and Server plugins after their dependencies such as Authentication and Permission management. `foundation()` provides a `/foundation` page and menu by default; the default template uses `foundation({ settingsGroup: true })` to put it in the system settings group.

| Client option | Purpose |
| --- | --- |
| `path` | Change the page path |
| `navigation: false` | Keep the page without showing a menu entry automatically |
| `routes: false` | Let the application mount the public `FoundationPage` itself |
| `settingsGroup: true` | Put the entry in the settings group |

The page and the `GET /api/foundation/overview` API only allow unrestricted identities, such as administrators holding the root permission set. This is not a page permission that can be assigned freely to ordinary roles.

### Business modules and deployment

Business modules are taken from the current navigation tree, and associations come from pages, APIs and backend dependencies that can be recognized. A blank in the matrix means nothing was recognized; it cannot be taken to mean the module definitely does not use that capability.

To keep static module associations in the deployment build, register the contribution exported from `/cli`. The application build then generates `dist/server/foundation-modules.json`; existing applications need to be rebuilt to get this information. The plugin never executes the scanned business source to determine associations.

## AI development constraints and verification

### Development constraints for this plugin

- Keep the unrestricted requirement on the page and API; do not relax it to "any signed-in user" just to make the entry appear.
- Do not interpret blank associations or collection failures as "not used"; when showing retained evidence, show its original check time with it.
- Check the build output when deploying; specific mail, model or database operations still need their own acceptance, and the foundation's statistics cannot replace business tests.

### Verification and limits

Check administrator access, refusal for ordinary users, refreshing, and how failures to read information are shown. Data outside the default connection, service combinations that cannot be recognized statically, and extensions not yet supported may fall outside the statistics; historically reliable data is labeled with its original check time.

This plugin does not install, enable or upgrade other plugins, and cannot prove that upgrade checks, migration validation or business tests have passed. Related documentation: [Manage plugins](../../developing-apps/manage-plugins.md), [Database explorer](../data-and-files/database-explorer.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-foundation).
