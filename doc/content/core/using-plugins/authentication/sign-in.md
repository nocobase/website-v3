---
title: "Authentication"
description: "Configure application sign-in, sessions, registration and password recovery."
---

## Capabilities

`@nocobase/app-plugin-authentication` integrates Better Auth with the application: identities, sessions, a browser client and server middleware. It establishes who is calling; [Permission management](../authorization/permissions.md) determines what that caller may do.

Authentication supplies identity and sessions. The application owns sign-in UI; Authorization determines business access.

## Scenarios and examples

### Example: invitation-only membership

1. Disable self-registration while retaining the required sign-in methods.
2. Keep the application registration UI consistent with that setting.
3. Invite members through [User management](users.md).
4. Verify pages and APIs as a guest, a member and a disabled user.

For built-in recovery email, enable `auth.passwordReset.enabled`, configure the public application address and an available system email channel, and use `usePasswordResetCapability()` for its entry point. Email/password sign-in alone does not enable recovery. Applications can instead supply `sendResetPassword`. Configure trusted origins for cross-origin deployments rather than bypassing origin checks.

**Development prompt** (for a Coding Agent working in the application directory):

```text
Use Authentication to make this application invitation-only. Preserve existing
sign-in, session and extension configuration. Disable self-registration on the
server and align the UI. If recovery is enabled, check the public URL and email
channel before exposing it. Verify guest, invited, disabled and signed-out access.
```

**Done when**: Direct self-registration is denied; invited users can still sign in with their intended access.

## Key principles and implementation

These are the integration areas and expected interface changes for this example. They describe development work; use the actual file layout of your application.

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| client/config/auth.ts and server/config/auth.ts | Preserve matching extensions and configure registration/recovery | Enabled methods match visible entry points |
| Application auth pages | Reuse template pages and capability-aware controls | Unavailable registration or recovery actions are not offered |
| Protected routes and APIs | Authenticate, then authorize business operations | Guests are handled correctly, including direct API calls |

### Integration and configuration

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

### Use authentication

From `/client`, `useAuthentication()` provides session and loading state, and `useAuthenticationClient()` provides the authentication client. Protected routes declare `auth: 'required'`.

On the server, resolve `authenticationToken` from `/server` and protect APIs with the service's `required()` middleware. Check business permissions afterward. Hiding navigation does not protect an API.

## AI development constraints and verification

### Plugin-specific development constraints

- Change client and server extensions together and preserve persistent keys and trusted origins.
- Test direct registration requests when disabling sign-up and actual email/link behavior for recovery.
- Check session restoration, sign-out and disabled identities; keep authorization after authentication.

### Common issues

- **No sign-in page:** inspect the application's routes and template pages.
- **Sessions fail after a restart:** check persistent keys across instances and session storage.
- **Sign-in works but access is denied:** inspect business permissions.
- **Scripts need API access:** use [API keys](api-keys.md).

For installation and migrations, see [Manage plugins](../../developing-apps/manage-plugins.md).

These are acceptance requirements for your integration, not claims of completed live verification. Ask the Agent to report actual changes, executed checks and unverified items. See [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md) for project guidance, Skills and shared checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-authentication).
