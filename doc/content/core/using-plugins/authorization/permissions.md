---
title: "Permission management"
description: "Configure permission sets, page and business access, and server-side data policies."
---

## Capabilities

`@nocobase/app-plugin-authorization` provides permission sets, page and settings access, business actions, and database field, record and relation policies.

The application declares resources and management UI; the plugin supplies authorization decisions and data policies.

### Configure access

| Object | Controls |
| --- | --- |
| Permission set | Grants assigned to users or other subjects |
| `page` | Opening a page |
| `settings` | Reading or changing an administration surface |
| `composite` | A business action and its underlying data operations |
| `database.collection` | Policies for a Collection registered with authorization |

Resources and actions must be declared. A table's existence does not register its Collection with the permission model.

The configured `root` permission set is unrestricted and should be distinct from ordinary business roles. Current account creation assigns Member explicitly; it is not an unavoidable implicit permission for every signed-in user.

## Scenarios and examples

### Example: viewing and editing orders

1. Declare view and edit capabilities, including fields and record selections.
2. Grant support staff view access and responsible users the required edit access.
3. Use route `authz` and `useCan` for navigation and buttons; check the operation again in the API.
4. Apply record and field policies through public methods such as `authz.database.policyFor(...)` or `authorizeRepository(...)`.
5. Verify lists, details, relations and direct API calls with different roles.

An operation check followed by an unrestricted query loses record and field restrictions. Hiding navigation is not server authorization.

**Development prompt** (for a Coding Agent working in the application directory):

```text
Use Authorization to add order view and edit access. Declare pages and business
actions, reuse existing roles, and do not add root or unrestricted grants.
Control UI actions and enforce server-side operation, record and field policies.
Test lists, details, relations and direct API calls as read-only, editing and denied users.
```

**Done when**: Read-only users can read allowed orders but cannot edit; other records and restricted fields stay inaccessible.

## Key principles and implementation

These are the integration areas and expected interface changes for this example. They describe development work; use the actual file layout of your application.

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Authorization config and resource declarations | Register Collections, actions and field dependencies | Management choices reflect business capabilities |
| Business services and Repository queries | Apply returned authorization policies | Lists, details and writes enforce the same boundaries |
| Page routes and controls | Use authz and useCan, retaining API enforcement | UI access reflects the role |

### Integration and entry points

Register Client and Server plugins after Authentication, then apply migrations and seeds. Compose configuration in `server/config/authorization.ts`; resolve `authorizationToken` from `/server` for trusted server integration.

The plugin exposes `/api/authorization`, `AuthorizationClient` and hooks such as `useCan`. The application builds its permission management pages and declares grantable business capabilities.

### Record-access extensions

- [Default data access](default-access.md) adds a shared record baseline to an already granted action.
- [Sharing rules](sharing-rules.md) adds selected records for named subjects.
- [Restriction rules](restriction-rules.md) narrows the records those subjects may still access.

None grants an action. Management UI grouping also has no authorization effect. See [Manage plugins](../../developing-apps/manage-plugins.md) for installation.

## AI development constraints and verification

### Plugin-specific development constraints

- Declare capabilities before granting them; database queries outside the permission model are not protected by those grants.
- Check pages, actions, fields, records and relations, not just a boolean can result followed by unrestricted queries.
- Use ordinary roles and direct API requests; review role seed changes for unintended expansion of existing access.

These are acceptance requirements for your integration, not claims of completed live verification. Ask the Agent to report actual changes, executed checks and unverified items. See [Develop with an Agent](../../getting-started/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md) for project guidance, Skills and shared checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authorization).
