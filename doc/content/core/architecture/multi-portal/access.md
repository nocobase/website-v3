---
title: Portal access and permissions
metaDescription: Configure portal page, operation and data access for different users, and distinguish administrator defaults from ordinary-user integration.
---

## Understand portal permission boundaries

### Share accounts and roles

Portals in one app use the app's authentication and authorization. Switching portals retains the current identity; users do not need a separate account for each portal.

Separate layouts and routes do not isolate permissions or data by themselves. One user can access several portals, while different users can have different entries, operations and data scopes.

### Separate installation, page access and data access

| Check | Question it answers |
| --- | --- |
| Installation state | Is this portal currently available? |
| Authentication and page permission | May this user open the page? |
| Operation permission | May the user query, create, update or delete? |
| Data scope | Which records and fields may this operation access? |

Installing a portal grants no user permissions. Opening a page does not grant all its operations or access to all data. Enforce permissions on both pages and server APIs.

## Understand default access rules

### Home, workbench and portal management

The current multi-portal template separates **Home** from **Workbench**. Signed-in users retain the app homepage; administrators use the workbench to enter installed portals. **System settings → Portal management** handles installation, entry and uninstallation.

| Entry | Default requirement |
| --- | --- |
| App homepage | Signed in; no business page grant required |
| Portal workbench | Signed in with `unrestricted` access |
| Portal management and catalog APIs | Signed in with `unrestricted` access |
| Generated portal pages | `auth: 'required'`, `authz: 'unrestricted'` |

![Installed portal entry on the administrator workbench](/assets/core/multi-portal/access/workbench.png)

For older templates without a separate workbench, inspect the app's actual routes. See [Manage portals](manage.md) for installation and removal.

### Default portal page and switcher

The default switcher lists installed portals and provides a return to the workbench. Both it and the default `PortalPage` read the administrator catalog, **not an ordinary user's authorized portal list**.

![Administrator opening the portal switcher](/assets/core/multi-portal/access/switcher.png)

Relaxing only a page's `authz` does not make these components work for ordinary users: their catalog requests still require administrator access. Adapt the page, data requests and entry presentation together.

## Open portals to users

The following target configuration lets User A access only Portal 1 and User B access both Portal 1 and Portal 2. It is an integration example, not a set of roles or an ordinary-user catalog already supplied by the template.

### Configure page access

Declare a stable permission resource for each page. For example, change Portal 1's Examples route to require page access:

```ts
{
  name: 'portal1Examples',
  path: '/portals/portal-1/examples',
  auth: 'required',
  authz: {
    resource: { type: 'page', id: 'portal1.examples' },
    action: 'access',
  },
  breadcrumb: { title: 'examples.title' },
  componentLoader: () => import('./pages/examples.js'),
},
```

Declare and register the corresponding page resource in the app's authorization system so administrators can grant it. The route states a requirement; it does not grant access to anyone. Apply suitable requirements to the portal homepage and other pages too; changing one route does not open the entire portal.

Configure role grants under **System settings → Permission management**, then assign roles to the intended accounts through user management. The screenshot shows the app's shared permission management, not separate portal role settings:

![Application permission management](/assets/core/multi-portal/access/permissions.png)

### Configure operations and data scope

Beyond page access, declare read, create and update operations and their permitted records and fields. Grant User A's role the capabilities needed for Portal 1; add Portal 2's capabilities to User B's role. Do not assign `root` or `unrestricted` to ordinary users as a substitute for business grants.

A user may receive grants from several roles or other sources. Check all effective permissions when validating. See [Permission management](../../using-plugins/authorization/permissions.md) and [Authentication, permissions and data scope](../../developing-apps/authentication-and-permissions.md) for declarations, assignments and data policies.

### Provide authorized entries and switching

The current template has no ready-made ordinary-user portal catalog. The app must supply an authenticated, business-authorized query returning only installed portals the user may access and the necessary metadata. Use it for homepage entries, switching and page availability.

User A should see only Portal 1; User B can see both. Generate results on the server from the current identity rather than returning the full administrator catalog and filtering only in the browser. Preserve administrator checks on management and catalog APIs instead of weakening them to reuse the default switcher.

## Enforce access on the server

### Check authentication, authorization and installation

Each business endpoint must independently authenticate, authorize its operation and check portal installation before performing permitted reads or writes. A page's `authz` does not automatically protect a similarly named API.

Inside an already authenticated and business-authorized handler, check availability through the portal service:

```ts
import { portalCenterServiceToken } from '@nocobase/app-plugin-multi-portal/server';

await app.container
  .resolve(portalCenterServiceToken)
  .requireInstalled('portal-1');
```

`requireInstalled()` checks installation only, not user permissions. Queries and writes must also apply the record and field policies returned by authorization. Checking a read capability and then running an unrestricted query loses the data-scope constraints.

### Preserve boundaries when sharing data

Portal 2 may consume Portal 1's service or data, but sharing does not grant unrestricted access. Define who owns the data and who may read or modify it, and enforce the caller's scope in the shared service or API.

Portal dependencies govern installation and removal order; they do not authorize users. Hidden buttons, filtered navigation and custom layouts cannot prevent direct API calls.

## Verify the configuration

### Test Portal 1 and Portal 2 with different accounts

Use ordinary test accounts rather than testing only as an administrator:

| Account | Entries and pages | Operations and data |
| --- | --- | --- |
| User A | Portal 1 only | Granted operations and permitted data only |
| User B | Portal 1 and Portal 2 | Each portal respects the configured scope |
| User without portal grants | No corresponding entry; direct access denied | Business APIs return no protected data |

### Open pages and call APIs directly

Test anonymous, signed-in-but-denied and authorized callers. In addition to menu navigation, open page URLs and call APIs directly. Verify queries, writes, fields and related data follow the same permissions. Business portal access must not grant portal administration.

### Check uninstallation and permission changes

In a test environment, uninstall a portal and call its business API again: installation checks should reject the request. After revoking a user's permission, new page and API requests should enforce the updated grants and entries should refresh. A retained browser menu is not authorization. Also check expired sessions, page refresh and mobile switching.
