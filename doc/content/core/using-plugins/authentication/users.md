---
title: "User management"
description: "Integrate user administration, invitations, role assignments and preferences."
---

`@nocobase/app-plugin-users` provides account administration, invitations and personal preferences. [Authentication](sign-in.md) owns identities, passwords and sessions; [Permission management](../authorization/permissions.md) and the application define roles and permitted operations.

## Integration and entry points

Register the Client and Server plugins after Authentication and Authorization, and apply application migrations. See [Manage plugins](../../developing-apps/manage-plugins.md) for shared procedures.

The only page registered by the plugin is `/invite/:token`. The application builds its user management pages with `UsersClient` from `@nocobase/app-plugin-users/client/user-client`. All page and API paths in this guide are relative to the application mount: an app at `/main` serves invitations at `/main/invite/:token`.

## Manage accounts

| Task | Available capability |
| --- | --- |
| Find users | Paginated search by name, username, email, status and role |
| Edit accounts | Create, edit, enable and disable accounts |
| Manage access | Assign roles, reset passwords and revoke sessions |
| Invite people | Create, resend, revoke and accept invitations |
| Save preferences | Store application-defined values such as theme and language |

The `/api/users` APIs require sign-in and the corresponding `user` action. Creation requires both `create` and `assign-role`. Displaying a page grants no permission.

Read assignable role options through `UsersClient`. Server integrations use `userManagementServiceToken` and `userRoleScopeRegistryToken` from `/server/tokens`; the latter connects application-specific role scopes.

## Example: invite a member

1. Enter an email and assignable roles in the application's user administration page.
2. Check each invitation result. An authorized inviter can copy the returned `inviteUrl`.
3. New users enter their name and password; existing users sign in with the invited email before accepting.
4. Verify the resulting roles and business access as that user.

Email delivery needs a configured mail channel. A delivery failure does not necessarily invalidate the invitation: check the response before sharing its link. Renewing an invitation invalidates its old token. Invitation emails use notification delivery and do not require a [personal mailbox](../notifications/mail.md).

## Preferences and boundaries

`useUserPreference(key, { defaultValue })` from `/client/preferences` stores values such as `theme.mode`; the application implements their behavior.

Disabling, revoking sessions and deleting are distinct operations. Deletion needs explicit confirmation, retains a disabled identity for historical attribution, and keeps the email and username reserved. Application role scopes handle business cleanup. Verify denied management operations as an ordinary user, invitation acceptance and session behavior after disabling or revocation.

Related: [Authentication](sign-in.md), [API keys](api-keys.md), [Permission management](../authorization/permissions.md).

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-users).
