---
title: "Default data access"
description: "Configure default data access, and keep the boundary between record scopes and action authorization clear."
---

## Capabilities

`@nocobase/app-plugin-authz-default-access` adds a shared record scope for subjects that already hold a given action permission. This default scope is merged with the permission set's own scope; it is not a fallback that applies only when no scope is set.

The rule management page is the application's responsibility; besides registering the plugin at runtime, the authorization factory must also be combined before rules take part in business access decisions.

## Scenarios and examples

### Business example

Suppose support staff can initially view only the customers they own. The application can define "public customers" as a record selection and configure it as the default scope for the "read customers" action; support staff can then read their own customers and the public ones. People without the "read customers" permission still cannot read any.

Confirm that the subject holds the target action first, then configure the scope; finally check permitted records, records outside the scope and direct API calls separately. Business queries must enforce the data policy returned by the authorization service for rules to actually affect query results.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use @nocobase/app-plugin-authz-default-access. Add public customers to the default range for support staff who already have customer-read access, retaining their existing range.
Preserve authorization extensions and integrate rule management with its settings
permissions. Check the read action before configuring records. Do not add admin
grants to bypass restrictions. Verify allowed and excluded records through direct APIs.
```

**Done when**: support staff can read the customers they own and the public customers, while users without the read action are still rejected.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| Plugin arrays and `server/config/authorization.ts` | Register the runtime parts and combine `defaultAccess()` | The rule API and the decision extension both take effect |
| The application's rule management page | Connect options, record selection and the protected save API | Administrators can maintain the target rules |
| Business queries and tests | Keep the data policy returned by authorization, and add cases for different subjects | Rules actually affect data results |

### Integration and configuration

On top of [Permission management](permissions.md), register this plugin's Client and Server entries and run the migrations; in addition, add the factory to the application's `server/config/authorization.ts`:

```ts
import { defaultAccess } from '@nocobase/app-plugin-authz-default-access/server';

// Merge into the existing authorization configuration, retaining other extensions.
plugins: [defaultAccess()]
```

Runtime registration handles language resources and database migrations, while the configuration factory is what installs the rule capability and HTTP API. Without the factory, rules do not take effect even though the package is installed.

### Configure and use rules

Each resource has at most one default scope rule, in which scopes can be configured per action. The available scopes are all records, specific record IDs, or a `recordAccess` the application has registered. For composite business actions, use `scopeKey` to name the data scope the action uses.

The rule management API is at `/api/authorization/defaultAccess`, providing list, create, update and delete, plus the endpoints needed for options and subject or record selection. The management page belongs to the application, and the plugin does not register one automatically. Accessing these APIs requires the corresponding `read`, `create`, `update` or `delete` permission on `settings:authorization.default-access`.

The application saves rules through the protected API. Trusted server code can also use the `defaultAccess` API on the authorization service directly; when wrapping your own HTTP API, keep the permission checks and input validation.

## AI development constraints and verification

### Development constraints for this plugin

- Maintain only one default rule per resource; a default scope is an additional scope, not a fallback that applies only when no scope exists.
- Rules change record scopes and grant no page, action or field permissions; check that server-side queries really apply the policy.
- Verify stacking, revoking and direct access with identities that are not unrestricted; do not test only with a super administrator.

### Limits of use

Rules grant no page, action or field permissions and do not open related records automatically. After the default scope and sharing scopes are merged, restriction rules still apply. Unrestricted identities skip these scope rules, so the results ordinary users see cannot be verified with a super administrator alone.

Related documentation: [Permission management](permissions.md), [Sharing rules](sharing-rules.md), [Restriction rules](restriction-rules.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authz-default-access).
