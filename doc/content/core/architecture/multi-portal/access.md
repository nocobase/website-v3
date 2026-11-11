---
title: Portal access and permissions
metaDescription: Separate installation, page access, business permissions and the administrator catalog, and understand ordinary-user integration requirements.
---

Installing a portal makes it available to run in the app. It does not grant page, data or operation permissions. Portals use the host app's authentication and authorization rather than a separate user system.

## Understand the template defaults

| Entry or capability | Default behavior |
| --- | --- |
| Administrator homepage | Portal workbench |
| Ordinary-user homepage | Standard app homepage |
| Portal management and catalog APIs | Authenticated administrator with `unrestricted` access |
| Generated portal homepage | `auth: 'required'`, `authz: 'unrestricted'` |
| Default portal switcher and `PortalPage` | Read the administrator catalog, not a user-authorized portal list |

Administrators can enter installed portals from the workbench, switch portals from the sidebar, or return to the workbench. Installation does not give ordinary users the same workbench. Changing only the homepage route's `authz` does not make the default catalog request accessible.

## Open a portal to business users

For an inventory operator who should use only inventory management:

1. Declare page access requirements for the inventory homepage and business pages, retaining stable route identifiers and localized labels.
2. Declare inventory read, receipt and issue actions with appropriate data scopes, and enforce them on the server.
3. Configure a business role in permission management and assign it to explicitly selected users through user management.
4. Provide authorized entry points, portal switching and availability queries for ordinary users instead of reusing the administrator catalog API.

The current template has no ready-made ordinary-user portal catalog. To provide one, the app must expose an authenticated, business-authorized query returning only accessible portals and necessary information, and adapt the homepage, switcher and page availability checks. Do not grant everyone `unrestricted` or weaken management API checks to bypass this limitation.

See [Permissions](../../using-plugins/authorization/permissions.md) for role, page and data-scope configuration, and [Authentication and permissions](../../developing-apps/authentication-and-permissions.md) for application integration.

## Check availability on the server

In addition to authentication and business authorization, business APIs must check that the portal is installed. The portal service provides this check:

```ts
import { portalCenterServiceToken } from '@nocobase/app-plugin-multi-portal/server';

// Inside an authenticated and authorized request handler with access to app.
await app.container.resolve(portalCenterServiceToken).requireInstalled('inventory');
```

This checks installation only, not identity or business permission. Run it before reading or writing business data. Direct API calls must also stop when the portal is uninstalled or unavailable.

Hidden buttons, filtered menus and browser route guards cannot replace server checks.

## Verify access boundaries

| Scenario | Expected result |
| --- | --- |
| Anonymous business API call | Rejected |
| Signed-in user without inventory permission | Cannot access inventory through a direct URL or API |
| User with only the inventory role | Sees authorized entries, with the configured operations and data scope |
| Business user calls management APIs | Rejected; business access does not grant administration |
| Business API call after uninstall | Rejected by the installation check |

Test with ordinary accounts and inspect all effective grant sources so administrator or inherited roles cannot conceal mistakes. Also check mobile navigation, direct links and expired sessions after changing entry points.
