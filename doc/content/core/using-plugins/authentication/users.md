---
title: "User management"
description: "Integrate user administration, invitations, role assignments and preferences."
---

## Capabilities

`@nocobase/app-plugin-users` provides account administration, invitations and personal preferences. [Authentication](sign-in.md) owns identities, passwords and sessions; [Permission management](../authorization/permissions.md) and the application define roles and permitted operations.

The plugin provides invitation acceptance; the application integrates management pages and business role scopes.

## Scenarios and examples

### Example: invite a member

1. Enter an email and assignable roles in the application's user administration page.
2. Check each invitation result. An authorized inviter can copy the returned `inviteUrl`.
3. New users enter their name and password; existing users sign in with the invited email before accepting.
4. Verify the resulting roles and business access as that user.

Email delivery needs a configured mail channel. A delivery failure does not necessarily invalidate the invitation: check the response before sharing its link. Renewing an invitation invalidates its old token. Invitation emails use notification delivery and do not require a [personal mailbox](../notifications/mail.md).

**Development prompt** (for a Coding Agent working in the application directory):

```text
Use the Users plugin to add member management and invitations to the existing app.
Reuse UsersClient and existing authentication and authorization. Add a user list,
invitations and assignable-role selection, showing each invitation outcome.
Preserve existing accounts and grants. Verify management denial as an ordinary
member and invitation acceptance as the invited account.
```

**Done when**: An invitee joins with the intended roles, while ordinary members cannot call management APIs.

## Key principles and implementation

These are the integration areas and expected interface changes for this example. They describe development work; use the actual file layout of your application.

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Client routes and member pages | Integrate UsersClient, lists, invitations and role options | Administration UI uses the plugin invitation page for recipients |
| Server role-scope configuration | Integrate business role scopes and management authorization | Assignable roles reflect server rules |
| Locale resources and tests | Add outcome text and verification | Failures are visible and existing account behavior can be checked |

### Integration and entry points

Register the Client and Server plugins after Authentication and Authorization, and apply application migrations. See [Manage plugins](../../developing-apps/manage-plugins.md) for shared procedures.

The only page registered by the plugin is `/invite/:token`. The application builds its user management pages with `UsersClient` from `@nocobase/app-plugin-users/client/user-client`. All page and API paths in this guide are relative to the application mount: an app at `/main` serves invitations at `/main/invite/:token`.

### Manage accounts

| Task | Available capability |
| --- | --- |
| Find users | Paginated search by name, username, email, status and role |
| Edit accounts | Create, edit, enable and disable accounts |
| Manage access | Assign roles, reset passwords and revoke sessions |
| Invite people | Create, resend, revoke and accept invitations |
| Save preferences | Store application-defined values such as theme and language |

The `/api/users` APIs require sign-in and the corresponding `user` action. Creation requires both `create` and `assign-role`. Displaying a page grants no permission.

Read assignable role options through `UsersClient`. Server integrations use `userManagementServiceToken` and `userRoleScopeRegistryToken` from `/server/tokens`; the latter connects application-specific role scopes.

## AI development constraints and verification

### Plugin-specific development constraints

- Build role choices from assignable options; keep server checks for create and assign-role. Hiding options is insufficient.
- Keep per-address invitation outcomes and distinguish creation from email failure before retrying.
- Verify new and existing invitees, invalidated old links and disabled-account sessions. Deletion is not erasure of historical identity.

### Preferences and boundaries

`useUserPreference(key, { defaultValue })` from `/client/preferences` stores values such as `theme.mode`; the application implements their behavior.

Disabling, revoking sessions and deleting are distinct operations. Deletion needs explicit confirmation, retains a disabled identity for historical attribution, and keeps the email and username reserved. Application role scopes handle business cleanup. Verify denied management operations as an ordinary user, invitation acceptance and session behavior after disabling or revocation.

Related: [Authentication](sign-in.md), [API keys](api-keys.md), [Permission management](../authorization/permissions.md).

These are acceptance requirements for your integration, not claims of completed live verification. Ask the Agent to report actual changes, executed checks and unverified items. See [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md) for project guidance, Skills and shared checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-users).
