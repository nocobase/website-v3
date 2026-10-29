---
title: "Default data access"
description: "Configure default data access while preserving operation permissions."
---

`@nocobase/app-plugin-authz-default-access` provides this extension. Default data access adds a shared record baseline for identities that already hold an action. It combines with permission-set selections, rather than applying only when a grant has no selection.

## Integration

Register its Client and Server entries alongside [Permission management](permissions.md), apply migrations, and add the factory to `server/config/authorization.ts`:

```ts
import { defaultAccess } from '@nocobase/app-plugin-authz-default-access/server';

// Merge into the existing authorization configuration, retaining other extensions.
plugins: [defaultAccess()]
```

Runtime registration contributes locales and migrations. The configuration factory installs rule behavior and HTTP endpoints; installing the package alone does not enable them.

## Configure and use rules

A resource has at most one default-access rule, with selections for its actions. Selections support all records, explicit IDs or a registered `recordAccess`. Composite actions identify a data scope through `scopeKey`.

`/api/authorization/defaultAccess` provides listing, creation, updates, deletion and supporting selection endpoints. The application owns its management page. Operations require the corresponding `read`, `create`, `update` or `delete` action on `settings:authorization.default-access`.

Save rules through protected endpoints. Trusted server code can use the authorization service's `defaultAccess` API; custom HTTP wrappers must retain authorization and input validation.

## Example

For example, support staff may initially read only customers they own. Add a public-customer selection as the default for customer reads, allowing owned and public customers. People without the read action still cannot read customers.

Confirm the operation grant first, configure the range, then verify permitted records, excluded records and direct API calls. Business queries must apply authorization policies for rules to affect actual access.

## Boundaries

Rules grant no page, operation or field permission and do not automatically expose related records. Restrictions still narrow the combined default and shared ranges. Unrestricted identities bypass these rules, so test with ordinary users too.

Related: [Permission management](permissions.md), [Default data access](default-access.md), [Sharing rules](sharing-rules.md), [Restriction rules](restriction-rules.md).

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authz-default-access).
