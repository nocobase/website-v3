---
title: "API keys"
description: "Issue and revoke API keys, and restrict the permission scope of external calls."
---

## Capabilities

`@nocobase/app-plugin-api-keys` provides API key authentication for scripts and external systems. Requests carry the key in `x-api-key` and run as the user who owns the key; scoped keys are additionally limited by their own scope.

The plugin provides key authentication and the management APIs; the personal key management page, and connecting business APIs to key scopes, are implemented by the application.

## Scenarios and examples

### Example: give a reporting script read-only access

1. The application declares the key permission groups and record scopes for the reporting business.
2. After signing in, a user opens the key management page, chooses read-only capabilities they already hold and an expiry, and saves the secret returned on creation.
3. The script calls the reporting API with `x-api-key`.
4. Verify that permitted queries succeed, while writes, access to records outside the scope and requests after revocation are rejected.

A scoped key's effective permission is the intersection of the user's current permissions and the key's scope; a key scope never grants permissions the user does not have. Business APIs that use `auth.required()` must explicitly allow scoped keys and perform operations through the authorization system or the corresponding scope checks; APIs that have not been connected reject such keys.

**Development prompt** (for a coding Agent in the current application directory):

```prompt
Use API Keys to give a reporting script an expiring read-only key. Preserve auth
configuration, declare reporting actions and record scopes, and integrate personal
creation, rotation and revocation. Show the secret only when issued or rotated;
never store it in source or logs. Test allowed reads, out-of-scope reads, writes,
old secrets and revoked keys.
```

**Done when**: the script can only read the permitted report records, and both writes and requests with invalidated keys are rejected.

## Key principles and implementation

The table lists where this example connects and how the interface is expected to change. These are development notes; specific file names follow your application's current structure.

| Integration point | Code or configuration change | Interface and behavior change |
| --- | --- | --- |
| Authentication configuration and plugin arrays | Combine `apiKey()` and `apiKeyClient()`, and run the migrations | Key authentication and management endpoints are available |
| Personal settings page | Connect key scope, expiry, rotation and revocation | Users manage their own keys, and the secret is shown only once when returned |
| Reporting APIs | Explicitly support scoped keys and apply data policies | The script can only access the intersection of user permissions and key scope |

### Integration and configuration

Besides registering the plugin on the Client and the Server and running the database migrations, add `apiKey()` exported from `/server` to the server authentication configuration, and `apiKeyClient()` exported from `/client` to the client authentication configuration. The default template already combines these, so check first and add only what is missing.

Registering only the server plugin creates the key tables but does not enable Better Auth's key endpoints; adding only `apiKey()` without running the plugin migrations leaves the tables missing. The plugin does not register a key management page; the application can build a personal key management page with the authentication client or `/api/apiKeys`.

### Create and use keys

Users must manage their own keys through a session from an interactive sign-in; a key itself cannot create, change or delete other keys. Scoped keys are managed through these APIs:

| API | Purpose |
| --- | --- |
| `GET /api/apiKeys/scopeOptions` | Gets the available permission groups, presets and expiry information |
| `POST /api/apiKeys` | Creates a key and returns its plain-text secret once |
| `GET /api/apiKeys` | Lists your own keys and their scopes, without secrets |
| `POST /api/apiKeys/:keyId/rotate` | Rotates the secret; the old value stops working immediately |
| `DELETE /api/apiKeys/:keyId` | Revokes a key |

For example, with the application mounted at `/main`, a key can read its API documentation:

```bash
curl -H 'x-api-key: <your-key>' https://app.example.com/main/api/swagger
```

Replace `<your-key>` with the actual key and adjust the address to where the application is deployed. Being able to read the API documentation does not mean you are allowed to call every API in it.

## AI development constraints and verification

### Development constraints for this plugin

- Key management must use a signed-in session; never let one API key manage other keys.
- A key without a scope is not read-only; reporting APIs must enforce action and record scopes rather than just checking that the key is valid.
- Test that the old secret stops working immediately after rotation, and calls after the user loses permissions, the key expires and the key is revoked.

### Limits of use

A key without a scope inherits all of its owner's permissions, so do not describe it as read-only by default. When the user loses permissions or is disabled, their keys are affected too. `apiKeys.maxScopedKeyDays` limits the maximum lifetime of scoped keys; after rotation, update the secret stored by the caller.

Related documentation: [Authentication](sign-in.md), [Permission management](../authorization/permissions.md), [Manage plugins](../../developing-apps/manage-plugins.md).

The checks above are acceptance requirements after integration; they do not mean this guide has completed runtime verification. Ask the Agent to report the actual changes, the checks it ran and what remains unverified; for project guidance, Skills and the general checking process, see [Develop with an Agent](../../developing-apps/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md).

Source: [the plugin's public entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-api-keys).
