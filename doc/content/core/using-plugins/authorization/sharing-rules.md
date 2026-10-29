---
title: "Sharing rules"
description: "Configure sharing rules while preserving operation permissions."
---

`@nocobase/app-plugin-authz-sharing-rules` provides this extension. Sharing rules add records for named subjects such as users or teams. Use them for handovers and cross-team collaboration; recipients still need the relevant operation permission.

## Integration

Register its Client and Server entries alongside [Permission management](permissions.md), apply migrations, and add the factory to `server/config/authorization.ts`:

```ts
import { sharingRules } from '@nocobase/app-plugin-authz-sharing-rules/server';

// Merge into the existing authorization configuration, retaining other extensions.
plugins: [sharingRules()]
```

Runtime registration contributes locales and migrations. The configuration factory installs rule behavior and HTTP endpoints; installing the package alone does not enable them.

## Configure and use rules

Specify subjects, a resource, actions and record selections. Selections allow explicit IDs or registered `recordAccess`, but reject `all`. Use default data access for a shared baseline available to everyone who already holds an action.

`/api/authorization/sharingRules` provides listing, creation, updates, deletion and supporting selection endpoints. The application owns its management page. Operations require the corresponding `read`, `create`, `update` or `delete` action on `settings:authorization.sharing-rules`.

Save rules through protected endpoints. Trusted server code can use the authorization service's `sharingRules` API; custom HTTP wrappers must retain authorization and input validation.

## Example

To share customer A with another salesperson, first grant that person customer read access, then add a sharing rule selecting A for the read action. This does not grant editing or unrestricted access to related records.

Confirm the operation grant first, configure the range, then verify permitted records, excluded records and direct API calls. Business queries must apply authorization policies for rules to affect actual access.

## Boundaries

Rules grant no page, operation or field permission and do not automatically expose related records. Restrictions still narrow the combined default and shared ranges. Unrestricted identities bypass these rules, so test with ordinary users too.

Related: [Permission management](permissions.md), [Default data access](default-access.md), [Sharing rules](sharing-rules.md), [Restriction rules](restriction-rules.md).

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authz-sharing-rules).
