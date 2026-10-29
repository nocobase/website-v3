---
title: "Default data access"
description: "Configure default data access while preserving operation permissions."
---

## Capabilities

`@nocobase/app-plugin-authz-default-access` provides this extension. Default data access adds a shared record baseline for identities that already hold an action. It combines with permission-set selections, rather than applying only when a grant has no selection.

The application owns rule management. Authorization factories are required in addition to runtime registration.

## Scenarios and examples

### Example

For example, support staff may initially read only customers they own. Add a public-customer selection as the default for customer reads, allowing owned and public customers. People without the read action still cannot read customers.

Confirm the operation grant first, configure the range, then verify permitted records, excluded records and direct API calls. Business queries must apply authorization policies for rules to affect actual access.

**Development prompt** (for a Coding Agent working in the application directory):

```text
Use @nocobase/app-plugin-authz-default-access. Add public customers to the default range for support staff who already have customer-read access, retaining their existing range.
Preserve authorization extensions and integrate rule management with its settings
permissions. Check the read action before configuring records. Do not add admin
grants to bypass restrictions. Verify allowed and excluded records through direct APIs.
```

**Done when**: Staff can read owned and public customers; users without the read action remain denied.

## Key principles and implementation

These are the integration areas and expected interface changes for this example. They describe development work; use the actual file layout of your application.

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Plugin arrays and server/config/authorization.ts | Register runtimes and compose defaultAccess() | Enable endpoints and rule evaluation |
| Application rule-management page | Integrate options, selections and protected writes | Administrators maintain the intended rules |
| Business queries and tests | Apply policies and test different subjects | Rules affect returned data |

### Integration

Register its Client and Server entries alongside [Permission management](permissions.md), apply migrations, and add the factory to `server/config/authorization.ts`:

```ts
import { defaultAccess } from '@nocobase/app-plugin-authz-default-access/server';

// Merge into the existing authorization configuration, retaining other extensions.
plugins: [defaultAccess()]
```

Runtime registration contributes locales and migrations. The configuration factory installs rule behavior and HTTP endpoints; installing the package alone does not enable them.

### Configure and use rules

A resource has at most one default-access rule, with selections for its actions. Selections support all records, explicit IDs or a registered `recordAccess`. Composite actions identify a data scope through `scopeKey`.

`/api/authorization/defaultAccess` provides listing, creation, updates, deletion and supporting selection endpoints. The application owns its management page. Operations require the corresponding `read`, `create`, `update` or `delete` action on `settings:authorization.default-access`.

Save rules through protected endpoints. Trusted server code can use the authorization service's `defaultAccess` API; custom HTTP wrappers must retain authorization and input validation.

## AI development constraints and verification

### Plugin-specific development constraints

- Maintain one default rule per resource. Its selection adds records, rather than applying only when another range is absent.
- Rules change records, not page, operation or field grants. Verify server queries apply their policies.
- Use non-unrestricted identities to check combined rules, removal and direct access, not only a root account.

### Boundaries

Rules grant no page, operation or field permission and do not automatically expose related records. Restrictions still narrow the combined default and shared ranges. Unrestricted identities bypass these rules, so test with ordinary users too.

Related: [Permission management](permissions.md), [Default data access](default-access.md), [Sharing rules](sharing-rules.md), [Restriction rules](restriction-rules.md).

These are acceptance requirements for your integration, not claims of completed live verification. Ask the Agent to report actual changes, executed checks and unverified items. See [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md) for project guidance, Skills and shared checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authz-default-access).
