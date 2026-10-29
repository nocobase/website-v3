---
title: "Permission management"
description: "Configure permission sets, page and business action permissions, and enforce data access on the server."
---

## Capabilities

`@nocobase/app-plugin-authorization` provides the application's authorization service, permission sets, page and settings permissions, and access policies for database fields, records and relations. It suits controlling "who can open a page, perform a business action and access which data".

The division of work: the application declares business resources and the management interface, while the plugin provides authorization decisions and data policies that can be enforced in queries.

### What can be configured

| Object | What it controls |
| --- | --- |
| Permission set | Assigns a group of grants to subjects such as users |
| `page` | Page access, such as opening the orders page |
| `settings` | Administration actions such as reading, creating and changing settings |
| `composite` | A business action and the data, fields and operations it depends on |
| `database.collection` | Collections connected to the permission model, and their data policies |

Resources and actions must be declared by the application or a plugin before they can be authorized correctly. Business Collections must be registered through the authorization service; merely existing in the database does not connect them to the permission model.

The `root` permission set in the default configuration has unrestricted permissions and should be kept separate from ordinary business roles. The current implementation assigns Member explicitly to newly created ordinary accounts; do not read it as a permission every signed-in user always holds implicitly.

## Scenarios and examples

### Example: viewing and changing orders

1. The application declares two business capabilities, "view orders" and "change orders", stating the fields and record scope each needs.
2. Grant the view capability to the support role, and the matching change capability to order owners.
3. Pages present entries and buttons through the route's `authz` and `useCan`; the API checks the action permission again on the server.
4. Queries enforce record and field policies through public APIs such as `authz.database.policyFor(...)` or `authorizeRepository(...)`.
5. Check lists, details, related data and direct API requests with different roles.

If you only check "has permission to view orders" and then run an unrestricted database query, the record and field restrictions are lost. Hiding menus or disabling buttons cannot replace server-side authorization either.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use Authorization to add order view and edit access. Declare pages and business
actions, reuse existing roles, and do not add root or unrestricted grants.
Control UI actions and enforce server-side operation, record and field policies.
Test lists, details, relations and direct API calls as read-only, editing and denied users.
```

**Done when**: read-only users can read the permitted orders but cannot change them, and no other records or restricted fields leak through the API.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| `server/config/authorization.ts` and resource declarations | Register business Collections, actions and field dependencies | The management page can choose real business capabilities |
| Business services and Repository queries | Apply the data policy returned by authorization | Lists, details and writes follow the same scope |
| Page routes and action buttons | Use `authz` and `useCan`, while keeping API checks | Page entries and action visibility match the role |

### Integration and entry points

Register the Client and Server plugins after Authentication, then run the migrations and seed data. The application combines the configuration in `server/config/authorization.ts` and uses the authorization service through `authorizationToken` exported from `/server`.

The plugin provides the `/api/authorization` API and client capabilities such as `AuthorizationClient` and `useCan`, but does not register a permission management page itself. The application connects its own management page and declares the business capabilities that can be assigned.

### Extend data scopes

When record scopes need to be unified or refined, configure them separately as the business requires:

- [Default data access](default-access.md): adds a shared record scope for subjects that already have an action permission.
- [Sharing rules](sharing-rules.md): adds specific record scopes for named subjects.
- [Restriction rules](restriction-rules.md): narrows the records named subjects can still access.

None of these rules creates action permissions. Grouping in the management interface is only presentation and does not change authorization results either. For installation, see [Manage plugins](../../developing-apps/manage-plugins.md).

## AI development constraints and verification

### Development constraints for this plugin

- Declare business capabilities first, then authorize; database queries that are not connected to the permission model must not be treated as protected.
- Check page, action, field, record and relation access, and avoid running an unrestricted query after a single boolean `can` check.
- Accept the work with ordinary roles and direct API requests; when role Seeds are involved, check whether existing users' permissions were widened by accident.

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authorization).
