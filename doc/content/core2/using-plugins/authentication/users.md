---
title: "User management"
description: "Integrate user administration, member invitations, role assignment and personal preferences."
---

## Capabilities

`@nocobase/app-plugin-users` provides user queries, account administration, member invitations and personal preferences. Sign-in identities, passwords and sessions come from [Authentication](sign-in.md), and user management reuses that data; roles and action permissions are defined by [Permission management](../authorization/permissions.md) and the application's business.

The plugin provides the invitation acceptance page directly; the user list, administration forms and business role scopes must be connected by the application.

## Scenarios and examples

### Example: invite a member to the application

1. On the application's user administration page, choose **Invite** and enter an email and the roles that may be assigned.
2. After creating the invitation, check the result for each address; inviters with permission to obtain the link can copy the returned `inviteUrl`.
3. The recipient opens the invitation page: a new user enters a name and password, while an existing user signs in with the invited email and then accepts.
4. Check the account and its roles in the user list, then verify the business access scope as that user.

Invitation email depends on a working mail delivery configuration. A failed email does not mean the invitation failed to be created; use the response to decide whether you can forward the invitation link instead. Generating a new link invalidates the old one. System invitation emails use notification delivery and do not require connecting a personal mailbox from the [Email](../notifications/mail.md) plugin.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use the Users plugin to add member management and invitations to the existing app.
Reuse UsersClient and existing authentication and authorization. Add a user list,
invitations and assignable-role selection, showing each invitation outcome.
Preserve existing accounts and grants. Verify management denial as an ordinary
member and invitation acceptance as the invited account.
```

**Done when**: invited members can join the application with the specified roles, and ordinary members cannot call the administration APIs.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| Client routes and member pages | Connect `UsersClient`, and add the list, invitations and role options | Administrators see the action entries, and invitees use the plugin's invitation page |
| Server role scope configuration | Connect role scopes and administration authorization for the business | The assignable roles match the server-side rules |
| Language resources and tests | Add text and verification for invitation results, deactivation and so on | Failed results are visible, and existing account behavior can be regression-tested |

### Integration and entry points

Register the plugin on both the Client and the Server, ordering Authentication and Permission management before it, then run the application's database migrations. For the common steps, see [Manage plugins](../../developing-apps/manage-plugins.md).

The plugin itself only registers the invitation acceptance page `/invite/:token`. The user list and administration pages are connected by the application and can reuse `UsersClient`, exported from `@nocobase/app-plugin-users/client/user-client`. All page and API paths here and below are relative to the application's mount path; for an application at `/main`, for example, the invitation page is `/main/invite/:token`.

### Manage users

| What you need to do | Public capability |
| --- | --- |
| Find users | A paginated list filterable by name, username, email, status and role |
| Edit accounts | Create users; change names, usernames and emails; enable or disable accounts |
| Manage access | Assign roles, reset passwords and revoke sessions |
| Invite people | Create, resend, revoke and accept invitations |
| Save personal settings | Save application-defined values such as theme and language through the preferences API |

The administration API is at `/api/users`. Callers must be signed in and hold the permission for the corresponding action on the `user` resource; creating a user requires both `create` and `assign-role`. The plugin never grants access just because a page is shown.

The application should read role options from `UsersClient` and submit only assignable roles, rather than assuming every role can be changed. On the server, reuse the administration service through `userManagementServiceToken` from `/server/tokens`, and connect the business's own role scopes through `userRoleScopeRegistryToken`.

## AI development constraints and verification

### Development constraints for this plugin

- Build forms from the assignable role options, while the API still checks `create` and `assign-role`; hiding options is no substitute for authorization.
- Keep the per-address invitation results, and distinguish "invitation created" from "email delivery failed" to avoid blindly inviting again.
- Verify separately: a new account accepting, an existing account accepting, old links becoming invalid, and sessions after an account is disabled; deletion must not be understood as physically erasing a user's history.

### Personal preferences and limits

React pages can use `useUserPreference(key, { defaultValue })` from `/client/preferences`. For example, an application can store the user's theme choice under `theme.mode`; the plugin only saves the value and does not implement theme switching itself.

Disabling an account, revoking sessions and deleting an account each mean something different. Deletion requires explicit confirmation and keeps a disabled identity for historical attribution, so the original email and username remain taken; cleanup of business resources is handled by the application's role scope hooks. When verifying, check both that ordinary users' administration actions are rejected and the actual sign-in state after invitations, disabling and session revocation.

Related documentation: [Authentication](sign-in.md), [API keys](api-keys.md), [Permission management](../authorization/permissions.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-users).
