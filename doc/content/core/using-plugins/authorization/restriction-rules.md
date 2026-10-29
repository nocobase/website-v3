---
title: "Restriction rules"
description: "Configure restriction rules while preserving operation permissions."
---

`@nocobase/app-plugin-authz-restriction-rules` provides this extension. Restriction rules narrow an existing record range for named subjects. Their selections describe records still allowed, rather than records to hide. Every matching restriction applies.

## Integration

Register its Client and Server entries alongside [Permission management](permissions.md), apply migrations, and add the factory to `server/config/authorization.ts`:

```ts
import { restrictionRules } from '@nocobase/app-plugin-authz-restriction-rules/server';

// Merge into the existing authorization configuration, retaining other extensions.
plugins: [restrictionRules()]
```

Runtime registration contributes locales and migrations. The configuration factory installs rule behavior and HTTP endpoints; installing the package alone does not enable them.

## Configure and use rules

Selections support all records, explicit IDs or registered `recordAccess`. Multiple restrictions intersect, so selecting all records in one rule does not cancel another. Removing a restriction can widen access and requires verification.

`/api/authorization/restrictionRules` provides listing, creation, updates, deletion and supporting selection endpoints. The application owns its management page. Operations require the corresponding `read`, `create`, `update` or `delete` action on `settings:authorization.restriction-rules`.

Save rules through protected endpoints. Trusted server code can use the authorization service's `restrictionRules` API; custom HTTP wrappers must retain authorization and input validation.

## Example

For interns who may read orders but must handle only non-confidential ones, select non-confidential orders in a read restriction. Sharing a confidential order cannot bypass that restriction.

Confirm the operation grant first, configure the range, then verify permitted records, excluded records and direct API calls. Business queries must apply authorization policies for rules to affect actual access.

## Boundaries

Rules grant no page, operation or field permission and do not automatically expose related records. Restrictions still narrow the combined default and shared ranges. Unrestricted identities bypass these rules, so test with ordinary users too.

Related: [Permission management](permissions.md), [Default data access](default-access.md), [Sharing rules](sharing-rules.md), [Restriction rules](restriction-rules.md).

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authz-restriction-rules).
