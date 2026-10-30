---
title: "API keys"
description: "Issue and revoke API keys and constrain integration permissions."
---

## Capabilities

`@nocobase/app-plugin-api-keys` authenticates scripts and integrations through `x-api-key`. Requests act as the key owner; scoped keys are additionally constrained by their scope.

The plugin supplies authentication and key APIs; the application owns personal management UI and business scope enforcement.

## Scenarios and examples

### Example: a read-only reporting script

1. The application declares reporting permission groups and record scopes.
2. A signed-in user selects available read permissions and an expiry, then saves the returned secret.
3. The script sends it through `x-api-key`.
4. Verify permitted reads, denied writes and out-of-scope records, and rejection after revocation.

Effective permissions are the intersection of the owner's current permissions and the key's scope. Scoped keys require endpoints to opt in through authentication and enforce authorization or the relevant scope checks. Unintegrated endpoints reject them.

**Development prompt** (for a Coding Agent working in the application directory):

```text
Use API Keys to give a reporting script an expiring read-only key. Preserve auth
configuration, declare reporting actions and record scopes, and integrate personal
creation, rotation and revocation. Show the secret only when issued or rotated;
never store it in source or logs. Test allowed reads, out-of-scope reads, writes,
old secrets and revoked keys.
```

**Done when**: The script reads only allowed report records; writes and invalidated-key requests are denied.

## Key principles and implementation

These are the integration areas and expected interface changes for this example. They describe development work; use the actual file layout of your application.

| Integration area | Code or configuration change | UI and behavior change |
| --- | --- | --- |
| Auth configuration and plugin arrays | Compose apiKey(), apiKeyClient() and migrations | Enable key authentication and management endpoints |
| Personal settings page | Integrate scope, expiry, rotation and revocation | Users manage their own keys and see secrets only on issuance |
| Reporting APIs | Opt into scoped keys and apply data policies | Script access is the intersection of user grants and key scope |

### Integration

Register both runtimes and apply migrations. Also add `apiKey()` from `/server` to server authentication configuration and `apiKeyClient()` from `/client` to client authentication configuration. Check the default template's existing setup first.

Server registration alone creates the table but does not enable Better Auth key endpoints; `apiKey()` without migrations has no table to use. The application owns its key management page, using the authentication client or `/api/apiKeys`.

### Issue and use keys

A signed-in session is required to manage personal keys. A key cannot manage other keys.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/apiKeys/scopeOptions` | Available groups, presets and expiry settings |
| `POST /api/apiKeys` | Create a key and return its secret once |
| `GET /api/apiKeys` | List owned keys and scopes without secrets |
| `POST /api/apiKeys/:keyId/rotate` | Rotate the secret and immediately invalidate the old one |
| `DELETE /api/apiKeys/:keyId` | Revoke a key |

For an application mounted at `/main`:

```bash
curl -H 'x-api-key: <your-key>' https://app.example.com/main/api/swagger
```

Replace the key and application address. Access to the API document does not grant access to every endpoint it describes.

## AI development constraints and verification

### Plugin-specific development constraints

- Use a signed-in session for key management; keys cannot manage other keys.
- Unscoped keys are not read-only. Reporting endpoints must enforce actions and records, beyond validating the key.
- Verify immediate old-secret invalidation after rotation and calls after owner permission loss, expiry and revocation.

### Boundaries

Unscoped keys inherit owner permissions; they are not read-only by default. Losing permissions or disabling the owner affects their keys. `apiKeys.maxScopedKeyDays` limits scoped-key lifetime. Update integration secrets after rotation.

Related: [Authentication](sign-in.md), [Permission management](../authorization/permissions.md), [Manage plugins](../../developing-apps/manage-plugins.md).

These are acceptance requirements for your integration, not claims of completed live verification. Ask the Agent to report actual changes, executed checks and unverified items. See [Develop with an Agent](../../getting-started/develop-with-an-agent.md) and [Testing and acceptance](../../developing-apps/testing-and-acceptance.md) for project guidance, Skills and shared checks.

Source: [public plugin entries and implementation](https://github.com/nocobase/nocobase/tree/015404ecd0dbed33cc46831f73907329c577d375/packages/plugins/app-plugin-api-keys).
