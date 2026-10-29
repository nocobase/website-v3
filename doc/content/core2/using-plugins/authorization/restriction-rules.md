---
title: "Restriction rules"
description: "Configure restriction rules, and keep the boundary between record scopes and action authorization clear."
---

## Capabilities

`@nocobase/app-plugin-authz-restriction-rules` narrows the record scope that named subjects have already been granted. The record selection in a rule means "the records still allowed", not the records to hide, and all matching restriction rules apply at the same time.

The rule management page is the application's responsibility; besides registering the plugin at runtime, the authorization factory must also be combined before rules take part in business access decisions.

## Scenarios and examples

### Business example

Suppose interns already have read permission on orders but may only handle non-confidential ones. Configure a read restriction for interns that selects "non-confidential orders". Then, even if a sharing rule adds a confidential order for them, that order cannot get past the restriction.

Confirm that the subject holds the target action first, then configure the scope; finally check permitted records, records outside the scope and direct API calls separately. Business queries must enforce the data policy returned by the authorization service for rules to actually affect query results.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use @nocobase/app-plugin-authz-restriction-rules. Restrict interns with order-read access to non-confidential orders, verifying that sharing cannot bypass the restriction.
Preserve authorization extensions and integrate rule management with its settings
permissions. Check the read action before configuring records. Do not add admin
grants to bypass restrictions. Verify allowed and excluded records through direct APIs.
```

**Done when**: interns see only non-confidential orders, and cannot read a confidential order even when someone shares it with them.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| Plugin arrays and `server/config/authorization.ts` | Register the runtime parts and combine `restrictionRules()` | The rule API and the decision extension both take effect |
| The application's rule management page | Connect options, record selection and the protected save API | Administrators can maintain the target rules |
| Business queries and tests | Keep the data policy returned by authorization, and add cases for different subjects | Rules actually affect data results |

### Integration and configuration

On top of [Permission management](permissions.md), register this plugin's Client and Server entries and run the migrations; in addition, add the factory to the application's `server/config/authorization.ts`:

```ts
import { restrictionRules } from '@nocobase/app-plugin-authz-restriction-rules/server';

// Merge into the existing authorization configuration, retaining other extensions.
plugins: [restrictionRules()]
```

Runtime registration handles language resources and database migrations, while the configuration factory is what installs the rule capability and HTTP API. Without the factory, rules do not take effect even though the package is installed.

### Configure and use rules

The record selection supports all records, specific record IDs, or a registered `recordAccess`. Multiple restriction rules are intersected, so even a rule that selects all records does not cancel the other restrictions. Deleting a restriction rule may widen access, so verify the affected subjects again.

The rule management API is at `/api/authorization/restrictionRules`, providing list, create, update and delete, plus the endpoints needed for options and subject or record selection. The management page belongs to the application, and the plugin does not register one automatically. Accessing these APIs requires the corresponding `read`, `create`, `update` or `delete` permission on `settings:authorization.restriction-rules`.

The application saves rules through the protected API. Trusted server code can also use the `restrictionRules` API on the authorization service directly; when wrapping your own HTTP API, keep the permission checks and input validation.

## AI development constraints and verification

### Development constraints for this plugin

- The record selection means the records still allowed, and multiple restrictions are intersected; deleting a rule may widen access, so check again.
- Rules change record scopes and grant no page, action or field permissions; check that server-side queries really apply the policy.
- Verify stacking, revoking and direct access with identities that are not unrestricted; do not test only with a super administrator.

### Limits of use

Rules grant no page, action or field permissions and do not open related records automatically. After the default scope and sharing scopes are merged, restriction rules still apply. Unrestricted identities skip these scope rules, so the results ordinary users see cannot be verified with a super administrator alone.

Related documentation: [Permission management](permissions.md), [Default data access](default-access.md), [Sharing rules](sharing-rules.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authz-restriction-rules).
