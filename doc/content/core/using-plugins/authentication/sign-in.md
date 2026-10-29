---
title: "Authentication"
description: "Configure application sign-in, sessions, registration and password recovery."
---

`@nocobase/app-plugin-authentication` integrates Better Auth with the application: identities, sessions, a browser client and server middleware. It establishes who is calling; [Permission management](../authorization/permissions.md) determines what that caller may do.

## Integration and configuration

The default template registers both runtimes and composes authentication in `client/config/auth.ts` and `server/config/auth.ts`. Preserve existing extensions when editing configuration instead of replacing the whole `plugins` array with an example.

| Setting or file | Purpose |
| --- | --- |
| `server/config/auth.ts` | Compose sign-in methods and extensions with `defineAuthConfig` |
| `client/config/auth.ts` | Register matching client extensions |
| `auth.emailAndPassword.enabled` | Enable email/password sign-in |
| `auth.emailAndPassword.disableSignUp` | Disable self-registration |
| `secrets.keys` / `SECRETS_KEYS` | Persistent keys from which authentication keys are derived |
| `auth.passwordReset` | Configure password recovery and its email channel |

Plugin migrations maintain authentication tables. Sign-in, sign-up and recovery pages belong to the application. Check its routes and enabled methods before adding another page.

## Use authentication

From `/client`, `useAuthentication()` provides session and loading state, and `useAuthenticationClient()` provides the authentication client. Protected routes declare `auth: 'required'`.

On the server, resolve `authenticationToken` from `/server` and protect APIs with the service's `required()` middleware. Check business permissions afterward. Hiding navigation does not protect an API.

## Example: invitation-only membership

1. Disable self-registration while retaining the required sign-in methods.
2. Keep the application registration UI consistent with that setting.
3. Invite members through [User management](users.md).
4. Verify pages and APIs as a guest, a member and a disabled user.

For built-in recovery email, enable `auth.passwordReset.enabled`, configure the public application address and an available system email channel, and use `usePasswordResetCapability()` for its entry point. Email/password sign-in alone does not enable recovery. Applications can instead supply `sendResetPassword`. Configure trusted origins for cross-origin deployments rather than bypassing origin checks.

## Common issues

- **No sign-in page:** inspect the application's routes and template pages.
- **Sessions fail after a restart:** check persistent keys across instances and session storage.
- **Sign-in works but access is denied:** inspect business permissions.
- **Scripts need API access:** use [API keys](api-keys.md).

For installation and migrations, see [Manage plugins](../../developing-apps/manage-plugins.md).

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authentication).
