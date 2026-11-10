---
title: Connect independent applications
description: Register independently deployed NocoBase, Web link, and OIDC applications with platform entry points and access management.
---

Independent applications retain their own deployments, databases, and operations. The platform registers an entry and optionally provides shared sign-in. It does not create a template, Host instance, or deployment record.

## Choose NocoBase, Web link, or OIDC integration

| Type | Platform responsibility | Application responsibility |
| --- | --- | --- |
| Independent NocoBase 3 | Shared entry, membership, and platform sign-in | Integrate the commercial `@nocobase/app-plugin-platform-sso` plugin; retain local sessions and business permissions |
| Web link | Display an entry to authorized users | Handle its own login and access control |
| Web OIDC | Client enrollment and platform access checks | Use its own OIDC client, verify tokens, and manage sessions |

The platform requires the commercial management and identity-provider plugins; see [plugin responsibilities](overview.md). Hiding a Web link does not prevent bookmarked access to the external site.

## Register an application and its entry point

Registration, configuration, and disabling currently require an unrestricted administrator.

1. Create an entry under **Application instances → Connected applications**.
2. Enter its name, type, complete URL, and login mode.
3. For Web OIDC, provide the external application's exact callback.
4. Save and obtain the integration parameters from login configuration.
5. Explicitly grant access to the users who need it.

A NocoBase URL must be the application root including its deployment prefix, without query parameters. Web links retain their original paths and queries. URLs accept only HTTP/HTTPS, without embedded credentials or fragments. Use HTTPS for production SSO.

Registered URLs and types cannot currently be changed in place. To move an application or change its integration mode, disable the old entry and register a new one. Plan existing identity transitions rather than creating duplicate users.

Login configuration offers **View setup instructions** and **Copy setup instructions**. The preview masks secrets, but copied instructions include the full secret. Share them only with a trusted target-application developer or Coding Agent, never a public conversation or source repository. Regenerating instructions reuses the secret; it does not rotate it, deploy the target, or complete integration.

## Connect an independently deployed NocoBase application

Complete the [child plugin integration](development.md) in the target application, including server, client, configuration factories, and native authentication. Variables alone are insufficient.

Use the platform's application ID, issuer, and client credentials with the target's own public origin and base path. After restarting, verify:

- The child server can reach platform discovery, token, JWKS, userinfo, and identity-check endpoints.
- Actual OAuth callbacks match the registered URL.
- Ordinary members can sign in and unauthorized users are denied.
- Target-owned business roles work and local recovery login remains available.

The switcher requests the directory from the current child's backend. That backend uses its own client credentials to retrieve a membership-filtered directory. Do not rely on cross-origin platform cookies or allow the browser to choose another user's subject.

## Connect a third-party OIDC application

Confirm support for Authorization Code, PKCE S256, `client_secret_basic`, and standard issuer, audience, and signature validation. An entry URL alone cannot enable SSO for an incompatible client.

Configure the external client's OIDC settings with the supplied issuer, client ID, and secret. Register its exact callback on the platform. The external application initiates login; do not append a NocoBase login path to it.

Verify actual identity, sessions, and permissions after sign-in, not only discovery availability. User mapping, business roles, account linking, and session revocation belong to the external application. The platform does not automatically synchronize organizations or translate business permissions.

## Grant access and disable connections

Creating an entry, having a platform account, or being a platform administrator does not automatically grant application access. Assign named users, then check both the workbench and actual login as those users.

**Disable connection** hides the entry and denies new platform access. It does not stop the external server or delete memberships. NocoBase children revalidate admission during subsequent session checks; third-party session invalidation depends on their implementation.

Upgrades, backups, and service recovery remain the external deployment owner's responsibility. Successful registration does not transfer those duties. See the example's [independent application guide](https://github.com/nocobase/app-example-multi-app/blob/2e2df1793ec51372ca9b3890b37e9d4748732689/docs/external-apps.md).
