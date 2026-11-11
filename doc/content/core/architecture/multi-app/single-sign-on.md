---
title: Single sign-on and access
description: Configure trusted HTTPS and platform login, retain independent child identities, and verify membership, business permissions, and revocation.
---

## Platform identity, child accounts, and local recovery

The platform identity provider and child SSO client use the [commercial plugins](overview.md). With a valid platform session and admission, the authentication redirect needs no repeated platform password. The child then establishes its own session.

Account binding uses issuer and subject, not shared platform user tables or cookies, and does not automatically merge accounts by email. Plan [identity retention](migration.md) before integrating existing users.

Retain a child recovery administrator through the application-relative `/login?auth=local` route. It does not depend on platform session rechecks, nor gain platform directory access. Child logout ends only that application's session, not platform or other sessions. It lands at `/login?signedOut=1`; subsequent SSO should be user-initiated.

## Configure HTTPS, the identity provider, and child login

Main registers the identity provider and continuation page and merges native authentication. Sub registers SSO server/client/config factories and integrates login and switching; see [Application development](development.md). Environment variables do not replace source integration.

Fix trusted HTTPS entries before provisioning and first sign-in. Register a separate client and exact callback for each application. Use authorization code flow, PKCE S256, and client authentication, without browser dynamic registration or weakened TLS, callback, or token validation.

| Child setting                     | Meaning                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `PLATFORM_SSO_ISSUER`             | Platform identity issuer, not the workbench home                                                    |
| `PLATFORM_SSO_APP_ID`             | Application ID registered by the platform                                                           |
| `PLATFORM_SSO_CLIENT_ID`          | This application's client ID                                                                        |
| `PLATFORM_SSO_CLIENT_SECRET`      | Server-only client secret                                                                           |
| `PLATFORM_URL`                    | Navigation entry including the platform mount path                                                  |
| `APP_PUBLIC_ORIGIN`               | Child public origin without a path                                                                  |
| `APP_BASE_PATH`                   | Child mount prefix                                                                                  |
| `PLATFORM_SSO_IDENTITY_NAMESPACE` | Configured same-platform identity namespace; preserve and verify existing bindings during migration |

Hosted instances receive settings through enrollment and secret-variable delivery. Independent operators configure their own runtime securely. Secrets do not belong in browsers, source, or archives. Arbitrary YAML fields do not necessarily supply runtime SSO credentials. The identity namespace is not an HTTP OIDC bypass.

Without an issuer, local authentication remains. An issuer with incomplete credentials fails configuration. Restart or redeploy after changing startup settings or fixing discovery initialization.

For an existing instance, enroll SSO before deploying a real SSO-capable version. Re-enrollment must check the actual callback and client. Issuer changes also require existing binding review, not just URL replacement.

## Separate membership from business permissions and verify revocation

Grant admission to named users through **Access authorization**. Current membership administration requires an unrestricted administrator; platform administrators themselves still need explicit membership to enter through SSO.

The workbench shows applications the user may enter. Hosted instances must also be running and not blocked by unfinished deployment. Check membership, instance, and deployment state before broadening permissions to recover a missing entry.

Platform `reader` and `editor` are access roles, not universal business permission sets. Children map them to minimum business rights: inventory editing should not imply user administration. A read-only role does not cancel write grants from other roles; inspect every source and remove obsolete SSO-derived grants.

NocoBase children recheck membership during subsequent platform session checks. Revocation or user disablement should deny the next checked access, without retroactively cancelling in-flight requests. Platform-identity access fails closed during an identity service outage while local recovery remains available.

Use real browsers and ordinary users to check:

- An unauthenticated deep link returns to its original page after login, and admitted users can enter.
- Users without membership cannot enter directly; admitted users' business APIs still enforce child permissions.
- Downgrade, revocation, and user disablement affect subsequent checks, not just button visibility.
- Child logout does not immediately sign in again, and local recovery works during a platform outage.

Third-party OIDC applications own existing-session and revocation behavior; the child plugin's recheck guarantees do not automatically apply. Global coordinated logout and organization synchronization are not currently provided.
