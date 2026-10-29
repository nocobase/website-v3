---
title: "Authentication"
description: "Configure the application's sign-in, sessions, registration and password recovery."
---

## Capabilities

`@nocobase/app-plugin-authentication` connects Better Auth to the application and provides sign-in identities, sessions, an authentication client and server authentication middleware. It answers "who is the current user"; what that user may do is decided by [Permission management](../authorization/permissions.md).

The division of work: the authentication plugin provides identity and session mechanisms, the application maintains the sign-in pages, and the authorization plugin decides permissions for business actions.

## Scenarios and examples

### Example: only invited members may join

1. Turn off self-registration in the application configuration, keeping the sign-in methods you need.
2. Keep the application's registration entry in sync with that configuration, rather than just hiding a button.
3. Send invitations through [User management](users.md), so new members create accounts through the invitation page.
4. Check page and API behavior for a guest, a signed-in member and a disabled user.

To use the built-in password recovery email, enable `auth.passwordReset.enabled`, configure the application's public address and a system mail channel that can deliver, then show the entry with `usePasswordResetCapability()`. Enabling email and password sign-in alone does not mean recovery email works. The application can also provide its own `sendResetPassword` implementation. Cross-origin deployments also need trusted origins configured correctly; never fix sign-in problems by bypassing the request origin check.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use Authentication to make this application invitation-only. Preserve existing
sign-in, session and extension configuration. Disable self-registration on the
server and align the UI. If recovery is enabled, check the public URL and email
channel before exposing it. Verify guest, invited, disabled and signed-out access.
```

**Done when**: direct self-registration requests are rejected, while invited users can still sign in and access the application with their existing permissions.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| `client/config/auth.ts`, `server/config/auth.ts` | Keep and combine matching authentication extensions; adjust registration and recovery settings | Sign-in methods match the available entries |
| The application's sign-in, registration and recovery pages | Reuse the template pages, showing actions according to actual capabilities | Unavailable registration or recovery entries no longer appear |
| Protected routes and APIs | Connect the sign-in check first, then business authorization | Guests are guided correctly, and direct API calls are protected too |

### Integration and configuration

The default template already registers the authentication plugin on both the Client and the Server, and combines the authentication configuration in `client/config/auth.ts` and `server/config/auth.ts`. When changing the existing configuration, keep the extensions the application needs, and do not overwrite the whole `plugins` array with an example.

| Setting or file | Purpose |
| --- | --- |
| `server/config/auth.ts` | Combines sign-in methods and server extensions with `defineAuthConfig` |
| `client/config/auth.ts` | Registers the client extensions that match the server |
| `auth.emailAndPassword.enabled` | Whether email and password sign-in is enabled |
| `auth.emailAndPassword.disableSignUp` | Whether self-registration is turned off |
| `secrets.keys` / `SECRETS_KEYS` | Persistent keys from which the authentication plugin derives signing and encryption keys |
| `auth.passwordReset` | Configures password recovery and its mail channel |

The tables authentication needs are maintained by the plugin's migrations. Sign-in, registration and password recovery pages are application source, and the plugin does not register another set of the same pages. When using the existing template pages, check their routes and the sign-in methods actually enabled first.

### Use it in pages and APIs

On the client, use `useAuthentication()` from `/client` to read the session and loading state, and `useAuthenticationClient()` to call the authentication client. Pages that require sign-in declare `auth: 'required'`, and guest pages follow the application's routing conventions.

On the server, get `authenticationToken` from `/server` and protect APIs with the authentication service's `required()` middleware; business permissions are checked after authentication. Hiding menus that appear after sign-in does not protect the API.

## AI development constraints and verification

### Development constraints for this plugin

- Change client and server extensions as a pair; keep persistent keys and trusted origins from the deployment configuration.
- After turning off registration, check direct registration requests; after enabling password recovery, check actual email delivery and the link, not just the button.
- Test session restoration, sign-out and disabled identities; business APIs must continue to authorize after authentication.

### Common issues

- **No sign-in page after installation**: the sign-in page belongs to the application; check the application's own routes and template pages.
- **Sessions misbehave after a restart**: check that every instance uses the same persistent authentication keys, and check the session storage configuration.
- **Signed in but still not allowed**: check business authorization; signing in does not grant administration permissions by itself.
- **Scripts need to call the API**: see [API keys](api-keys.md) instead of building another authentication mechanism modeled on browser sessions.

For the common installation and migration steps, see [Manage plugins](../../developing-apps/manage-plugins.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authentication).
