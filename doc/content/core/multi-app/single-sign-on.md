---
title: Single sign-on and access
description: Configure shared sign-in, distinguish membership from business authorization, and handle revocation and recovery login.
---

## Platform identity and child accounts

The platform uses the commercial `@nocobase/app-plugin-identity-provider` plugin for OIDC identity. NocoBase children connect through the commercial `@nocobase/app-plugin-platform-sso` plugin. The commercial `@nocobase/app-plugin-multi-app` plugin connects application management with client enrollment.

Opening an authorized child involves an authentication redirect. A valid platform session avoids another credential prompt, after which the child creates its own session.

Children bind local accounts by issuer (identity provider identifier) and subject (user identifier within that provider). They neither copy the platform user table nor automatically link accounts by email. Plan [identity retention](migration.md) before connecting existing users.

## Configure the provider and child login

The platform registers identity, merges native authentication, and supplies a continuation page. The child registers SSO and merges its login configuration. See [Application development](development.md) for integration considerations.

Establish stable HTTPS entry points before provisioning. Register a separate client and exact callback for each application, using Authorization Code, PKCE S256, and client authentication. Do not enable browser-facing dynamic client registration.

| Setting | Meaning |
| --- | --- |
| `PLATFORM_SSO_ISSUER` | Platform identity issuer, not the workbench home page |
| `PLATFORM_SSO_APP_ID` | Registered application ID |
| `PLATFORM_SSO_CLIENT_ID` | This application's client ID |
| `PLATFORM_SSO_CLIENT_SECRET` | Server-only client secret |
| `PLATFORM_URL` | Platform navigation entry, including its base path |
| `APP_PUBLIC_ORIGIN` | Child's own public origin without a path |
| `APP_BASE_PATH` | Child's runtime mount prefix |

Managed instances receive configuration through platform enrollment and deployment variables. Independent applications receive it from their authorized operators. SSO credentials are read from runtime environment variables; arbitrary YAML fields are not equivalent.

Without an issuer, local authentication remains available. An issuer with incomplete credentials fails configuration rather than enabling partial SSO. Restart or redeploy after changing startup configuration.

For an existing managed instance, enroll it through its details and deploy a template version that supports SSO. Variables alone do not add login support to an older template. Re-enrollment can update callbacks from the actual address while preserving credentials. An issuer change also affects existing account bindings, not just URLs.

## Grant application access

Select named platform users in the application's access interface and grant the appropriate membership. Membership administration currently requires an unrestricted administrator. Even platform administrators need explicit membership to enter a child through SSO.

The workbench only shows applications the user may enter. Managed applications must also be running and free of unfinished deployments that prevent entry. If an entry is absent, check membership and instance state before expanding business permissions.

Test an ordinary member entering from the workbench, then an unauthorized user opening the direct URL. The former should establish a child session; the latter must be rejected. Hiding an entry does not replace server-side denial.

## Separate membership from business permissions

The platform controls admission. The child's Permission Sets and other business authorization determine readable data and allowed operations. Current integration roles are `reader` and `editor`, not universal permission-set names.

The child maps these values to least-privilege roles through `applyRole`. An inventory editor may record receipts and issues without receiving user-management or unrestricted administrative access.

On downgrade, remove old SSO-derived write grants. A read-only role does not cancel write access granted by another role, so inspect all effective sources. See [Application development](development.md) for mapping guidance.

## Revoke access, sign out, and recover locally

When checking a platform user's session, the NocoBase child revalidates membership. Revocation or disabling the platform user causes subsequent checks to deny access. Requests already in progress are not retroactively revoked. Identity-service outages fail closed rather than allowing platform sessions to continue offline.

Signing out of a child ends only that application's session, not other children or the platform. Land on `/login?signedOut=1` and wait for the user to choose to enter again before initiating SSO, avoiding an immediate sign-in loop.

Retain a local child administrator with recovery access through `/login?auth=local`. That account does not depend on platform session checks and must not thereby gain access to the platform directory.

Check at least:

- An unauthenticated business deep link returns to its original page after login.
- Downgrade or revocation blocks subsequent writes or access.
- Child sign-out does not immediately sign the user back in.
- Local recovery login remains available during a platform identity outage.

Third-party OIDC applications implement their own existing-session revocation; do not assume the NocoBase child's revalidation behavior. Global logout and organization synchronization are not currently provided. The example's [SSO guide](https://github.com/nocobase/app-example-multi-app/blob/2e2df1793ec51372ca9b3890b37e9d4748732689/docs/sso.md) provides the complete interaction context.
