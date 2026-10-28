---
title: Authorization, permission sets and data scopes
---

`@nocobase/authorization` decides whether an identity may act on a resource. Applications normally resolve `authorizationToken` from `@nocobase/app-plugin-authorization/server`. That plugin supplies persistence, database enforcement, management APIs and UI; the library defines the authorization model.

## Model

| Concept | Purpose |
| --- | --- |
| Identity | An authenticated `principal` and verified memberships in `subjects` |
| Resource reference | `{ type, id }`, such as `report/orders` |
| Resource type | Actions, catalog or dynamic records, and authorization behavior |
| Permission Set | Stored grants assigned to users or other subjects |
| Composite resource | A business action expanded into underlying grants |
| Data scope | A named slot on a composite action, filled by a record selection |
| Record access | A code-defined selector, such as records owned by the actor |

Create a permission-set definition:

```ts
import { definePermissionSet } from '@nocobase/authorization/permission-sets';

export const ordersReader = definePermissionSet('orders-reader')
  .title('Orders reader')
  .grant({
    resource: { type: 'report', id: 'orders' },
    actions: [{ action: 'view' }],
  })
  .build();
```

This only builds a value. Integration also registers the `report` type and `orders` item, saves the permission set and assigns it to subjects. The foundation library ships no storage or HTTP handlers.

## Request decisions

Build an `authz.for(identity)` context from a verified identity. It shares permission reads within a request; never cache it globally across users or trust membership or user IDs supplied in the request body.

- `authorize(request)` returns `permit`, `deny`, or `conditional` with conditions.
- `can(request)` is true only for an unconditional permit.
- `require(request)` throws unless access is unconditionally permitted.
- `snapshot()` supports client visibility and does not replace server enforcement.

An adapter must turn a conditional decision into data constraints. Treating every result except `deny` as access to all records bypasses those constraints. Unknown resources and uninterpretable conditions must be denied.

## Enforcing data scopes

Default access, sharing and restriction rules can contribute record selections. Application plugins integrate these constraints with database operations. Installing the library or hiding a button does not automatically constrain Repository queries.

Custom APIs must enforce operations, visible fields and accessible records. Use the authorization plugin's data integration, or explicitly provide policies to the Repository when implementing your own integration; see [Data operations](../database/repositories.md). Test denied access, partial visibility and unauthorized writes.

Plugin installation and configuration belong to [Using plugins](../../using-plugins/overview.md); resource types, composite resources and condition interpreters are framework extension topics.

## Interfaces and implementation

- [Authorization model and decisions](https://github.com/nocobase/nocobase/blob/015404ecd0dbed33cc46831f73907329c577d375/packages/libs/authorization/README.md)
