---
title: Connect independent applications
description: Choose an independent integration type, configure entry and optional SSO, and verify access and disablement boundaries.
---

## Choose an integration type and define operational ownership

Independent applications keep their own deployment, databases, and backups. The platform registers an entry and optionally provides login, without creating hosted templates, Host instances, or deployment records.

| Type                               | Platform supplies                     | Application supplies                                                      |
| ---------------------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| Independent NocoBase 3 application | Entry, membership, and platform login | Commercial SSO integration with its own sessions and business permissions |
| Web link                           | An entry shown to authorized users    | Its own login and direct-access control                                   |
| Web OIDC application               | An OIDC client and platform admission | Its own OIDC client, identity validation, and sessions                    |

Main needs [multi-app management and the identity provider](overview.md). An application developed in `apps/sub/` can deploy independently; using the workspace development Skill does not require Host management. Hiding a Web link does not block direct access to the external server.

Current registration and configuration require an unrestricted administrator:

1. In **Application instances → Connect application**, enter the name, type, full address, and login method.
2. For Web OIDC, supply the external application's exact callback.
3. Obtain login parameters after saving and grant access explicitly to intended users.

A NocoBase entry is the application root including its mount prefix, without query parameters. Web links preserve their paths and queries. Addresses accept HTTP/HTTPS, not embedded credentials or fragments; unified login requires trusted HTTPS.

Address and type are currently immutable. Disable and re-register when changing them, planning identity-binding migration for existing users rather than creating duplicate accounts.

## Configure entry, SSO, and access grants

Use `skills/nocobase-multi-app-development/SKILL.md` for child development and the target's installed `nocobase-app-plugin-platform-sso` Skill for integration. Register server, client, and config factories, merge existing authentication, and securely supply the actual public origin, mount path, issuer, app/client IDs, and server-only secret.

**View integration instructions** masks secrets, whereas **Copy integration instructions** includes them. Deliver only through a secure channel to the trusted target developer or Agent, not repositories, logs, or public conversations. Regenerating instructions reuses the existing secret; it does not rotate, deploy, or complete integration.

The NocoBase child server needs access to platform discovery, token, JWKS, userinfo, and identity-check endpoints. Match its actual callback to registration. The current child's backend obtains application-switching entries with its own credentials, without cross-origin platform cookies or browser-specified subjects for other users.

Third-party OIDC applications must support authorization code flow, PKCE S256, `client_secret_basic`, and standard issuer/audience/signature validation. Configure the supplied issuer and credentials in their own client and register their actual callback. Do not append NocoBase login paths.

Third parties own user mapping, business roles, existing-account linking, and session revocation. The platform does not automatically synchronize organizations or translate business permissions. See [Application access](management.md) for settings and membership.

## Verify direct access and disablement

Registration, a platform account, or platform administration does not automatically grant membership. Test the workbench, real login, and business permissions with an explicitly admitted ordinary user, then direct denial without access. Reading discovery alone is not successful sign-in.

Disabling the entry hides it and denies new platform access without stopping the external server or deleting memberships. NocoBase children recheck subsequent sessions; third parties control whether existing sessions expire. Web links need direct-access enforcement in the target application itself.

Retain local recovery and test downgrade, revocation, and restart behavior. Upgrades, data restoration, and service failures remain the independent operator's responsibility; registration or disablement does not transfer that ownership.
