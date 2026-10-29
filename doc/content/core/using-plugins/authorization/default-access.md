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

```prompt
Support staff currently see only customers assigned to them. Let staff who already have customer read permission also view public customers.
Preserve their existing record scope and editing permissions. Users without customer read permission must still be denied.
Let authorized managers maintain this rule.
Use an ordinary support account to check assigned, public and other customers, including direct API requests; do not test only as an administrator.
```

**Done when**: Staff can read owned and public customers; users without the read action remain denied.

## Key principles and implementation

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

These are checks to run after integration. See [Example versions and verification scope](../overview.md#example-versions-and-verification-scope) for the documented baseline and executed checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authz-default-access).
