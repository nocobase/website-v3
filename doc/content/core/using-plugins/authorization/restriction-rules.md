---
title: "Restriction rules"
description: "Configure restriction rules while preserving operation permissions."
---

## Capabilities

`@nocobase/app-plugin-authz-restriction-rules` provides this extension. Restriction rules narrow an existing record range for named subjects. Their selections describe records still allowed, rather than records to hide. Every matching restriction applies.

The application owns rule management. Authorization factories are required in addition to runtime registration.

## Scenarios and examples

### Example

For interns who may read orders but must handle only non-confidential ones, select non-confidential orders in a read restriction. Sharing a confidential order cannot bypass that restriction.

Confirm the operation grant first, configure the range, then verify permitted records, excluded records and direct API calls. Business queries must apply authorization policies for rules to affect actual access.

**Development prompt** (for a Coding Agent working in the application directory):

```prompt
Restrict interns' existing order access to non-confidential orders.
Keep other roles unchanged. Sharing a confidential order with an intern must not bypass the restriction.
Authorized managers may maintain the rule; ordinary members may not change it.
Use an intern account to check ordinary and confidential orders and direct API requests. Explain how removing the rule affects visibility.
```

**Done when**: Interns see only non-confidential orders, even when a confidential order is shared.

## Key principles and implementation

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Plugin arrays and server/config/authorization.ts | Register runtimes and compose restrictionRules() | Enable endpoints and rule evaluation |
| Application rule-management page | Integrate options, selections and protected writes | Administrators maintain the intended rules |
| Business queries and tests | Apply policies and test different subjects | Rules affect returned data |

### Integration

Register its Client and Server entries alongside [Permission management](permissions.md), apply migrations, and add the factory to `server/config/authorization.ts`:

```ts
import { restrictionRules } from '@nocobase/app-plugin-authz-restriction-rules/server';

// Merge into the existing authorization configuration, retaining other extensions.
plugins: [restrictionRules()]
```

Runtime registration contributes locales and migrations. The configuration factory installs rule behavior and HTTP endpoints; installing the package alone does not enable them.

### Configure and use rules

Selections support all records, explicit IDs or registered `recordAccess`. Multiple restrictions intersect, so selecting all records in one rule does not cancel another. Removing a restriction can widen access and requires verification.

`/api/authorization/restrictionRules` provides listing, creation, updates, deletion and supporting selection endpoints. The application owns its management page. Operations require the corresponding `read`, `create`, `update` or `delete` action on `settings:authorization.restriction-rules`.

Save rules through protected endpoints. Trusted server code can use the authorization service's `restrictionRules` API; custom HTTP wrappers must retain authorization and input validation.

## AI development constraints and verification

### Plugin-specific development constraints

- Selections mean records still allowed; matching restrictions intersect. Removing a rule can widen access and needs rechecking.
- Rules change records, not page, operation or field grants. Verify server queries apply their policies.
- Use non-unrestricted identities to check combined rules, removal and direct access, not only a root account.

### Boundaries

Rules grant no page, operation or field permission and do not automatically expose related records. Restrictions still narrow the combined default and shared ranges. Unrestricted identities bypass these rules, so test with ordinary users too.

Related: [Permission management](permissions.md), [Default data access](default-access.md), [Sharing rules](sharing-rules.md), [Restriction rules](restriction-rules.md).

These are checks to run after integration. See [Example versions and verification scope](../overview.md#example-versions-and-verification-scope) for the documented baseline and executed checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authz-restriction-rules).
