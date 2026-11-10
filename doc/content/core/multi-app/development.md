---
title: Application development
description: Required multi-app plugins, child application considerations, and when to customize the platform.
---

In most cases, use the platform's existing application management and identity capabilities and develop only your business child applications. Both the platform and its children are NocoBase 3 applications. For pages, APIs, and databases, see [Developing apps](../developing-apps/overview.md).

## Required plugins and installation locations

Application management, unified sign-in, and application switching use three commercial plugins:

| Plugin | Install in | Purpose |
| --- | --- | --- |
| `@nocobase/app-plugin-multi-app` | Platform | Manage templates, versions, hosted instances, and independent application entries |
| `@nocobase/app-plugin-identity-provider` | Platform | Provide platform identity, register application clients, and grant access |
| `@nocobase/app-plugin-platform-sso` | NocoBase children that need platform sign-in | Integrate platform sign-in, recheck access, and switch applications |

The example platform already includes the platform-side integration; you normally do not need to rebuild it. Hosted instances also require Releases and a configured App Host environment. Independently deployed children do not need App Host hosting.

To integrate SSO into your child, follow the plugin's bundled Skill to register its server, client, and configuration factories, merge authentication configuration, and integrate login and application-switching components. Environment variables alone do not complete integration. Preserve existing authentication methods and custom user fields. See [SSO and access](single-sign-on.md) for configuration and authorization, and the example's [child authentication configuration](https://github.com/nocobase/app-example-multi-app/blob/2e2df1793ec51372ca9b3890b37e9d4748732689/app-templates/app-template-reagents/server/config/auth.ts) for the integration location.

## Child application considerations

- **Separate entry access from business permissions.** The platform decides who can enter; the child decides what they can do. Map platform `reader` and `editor` roles to your business roles. On downgrade, remove previous SSO-derived grants while retaining independently assigned legitimate roles. Do not make platform members child administrators.
- **Do not hard-code instance paths.** Declare application-relative paths such as `/inventory`, not `/store-a/inventory`. Use runtime URL helpers for pages, APIs, and assets, and check refresh and deep links under a non-root mount path.
- **Keep development separate from instance data.** Use separate development databases, configuration, and storage, not a running instance's volumes. Supply instance credentials through deployment configuration, never source code or template archives. Retain local recovery sign-in.
- **Separate builds from instance upgrades.** Keep the template package name stable, publish a new version when content changes, and match artifacts to the runtime environment. Building or publishing does not update instances automatically; select the instances to upgrade in [Template and instance management](management.md).

Before release, check platform sign-in, ordinary-user permissions, downgrades and revocation, isolation between two instances, and data retention after upgrading one instance. Independently deployed children use their own release process; see [Connect independent applications](external-apps.md).

## When to customize the platform

Customize the platform only when you need to change its workbench or add business rules such as store eligibility or provisioning limits. Inventory, orders, and other child business features still belong in the children.

Provisioning rules can use `multiAppProvisioningPolicyToken` to validate the actual operator and their business permissions; a supplied `ownerRef` is not proof of authorization. See the example's [provisioning policy](https://github.com/nocobase/app-example-multi-app/blob/2e2df1793ec51372ca9b3890b37e9d4748732689/server/providers/template-policy.ts) for the integration location. Its name and language settings do not implement business eligibility checks.

Preserve existing identity integration, membership authorization, and management API protection. Hiding menus does not replace server-side permission checks, and demo initialization is not a production provisioning process.
