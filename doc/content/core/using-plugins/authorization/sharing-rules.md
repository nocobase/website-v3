---
title: "Sharing rules"
description: "Configure sharing rules while preserving operation permissions."
---

## Capabilities

`@nocobase/app-plugin-authz-sharing-rules` provides this extension. Sharing rules add records for named subjects such as users or teams. Use them for handovers and cross-team collaboration; recipients still need the relevant operation permission.

The application owns rule management. Authorization factories are required in addition to runtime registration.

## Scenarios and examples

### Example

To share customer A with another salesperson, first grant that person customer read access, then add a sharing rule selecting A for the read action. This does not grant editing or unrestricted access to related records.

Confirm the operation grant first, configure the range, then verify permitted records, excluded records and direct API calls. Business queries must apply authorization policies for rules to affect actual access.

**Development prompt** (for a Coding Agent working in the application directory):

```prompt
Allow customer A to be shared read-only from salesperson A to salesperson B, who already has customer read permission.
The recipient may view that customer, but must not gain edit access or access to other unauthorized customers or related data.
Preserve existing permissions and restrict rule management to authorized managers.
Check access before sharing, after sharing and after revocation, including direct API requests.
```

**Done when**: B can read customer A without gaining edit access or other unauthorized customers.

## Key principles and implementation

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Plugin arrays and server/config/authorization.ts | Register runtimes and compose sharingRules() | Enable endpoints and rule evaluation |
| Application rule-management page | Integrate options, selections and protected writes | Administrators maintain the intended rules |
| Business queries and tests | Apply policies and test different subjects | Rules affect returned data |

### Integration

Register its Client and Server entries alongside [Permission management](permissions.md), apply migrations, and add the factory to `server/config/authorization.ts`:

```ts
import { sharingRules } from '@nocobase/app-plugin-authz-sharing-rules/server';

// Merge into the existing authorization configuration, retaining other extensions.
plugins: [sharingRules()]
```

Runtime registration contributes locales and migrations. The configuration factory installs rule behavior and HTTP endpoints; installing the package alone does not enable them.

### Configure and use rules

Specify subjects, a resource, actions and record selections. Selections allow explicit IDs or registered `recordAccess`, but reject `all`. Use default data access for a shared baseline available to everyone who already holds an action.

`/api/authorization/sharingRules` provides listing, creation, updates, deletion and supporting selection endpoints. The application owns its management page. Operations require the corresponding `read`, `create`, `update` or `delete` action on `settings:authorization.sharing-rules`.

Save rules through protected endpoints. Trusted server code can use the authorization service's `sharingRules` API; custom HTTP wrappers must retain authorization and input validation.

## AI development constraints and verification

### Plugin-specific development constraints

- Save sharing for explicit subjects and record selections. Do not use all or expose every related record.
- Rules change records, not page, operation or field grants. Verify server queries apply their policies.
- Use non-unrestricted identities to check combined rules, removal and direct access, not only a root account.

### Boundaries

Rules grant no page, operation or field permission and do not automatically expose related records. Restrictions still narrow the combined default and shared ranges. Unrestricted identities bypass these rules, so test with ordinary users too.

Related: [Permission management](permissions.md), [Default data access](default-access.md), [Sharing rules](sharing-rules.md), [Restriction rules](restriction-rules.md).

These are checks to run after integration. See [Example versions and verification scope](../overview.md#example-versions-and-verification-scope) for the documented baseline and executed checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authz-sharing-rules).
