---
title: Develop a business portal
metaDescription: Create a business portal, understand its generated files and registration, and extend pages, navigation, services and database resources.
---

Start with a configured [multi-portal app](create-app.md) that runs successfully, and keep your commercial registry login valid. A portal is a local package using the plugin runtime. It builds and deploys with the app; you do not need to publish your business portal to npm first.

## Create a business portal

Generate the portal with either an Agent or the command, then install and verify it.

### Create a portal with an Agent

Open the Agent at the existing multi-portal app root. Use the app's `AGENTS.md`, `.agents/rules/multi-portal.md`, and its application and plugin development Skills. The global `nocobase-create-app` Skill creates whole apps; this task belongs to the existing project.

```prompt
Add an Inventory management portal named inventory to this app, starting with a basic homepage I can open.
```

Project guidance directs the Agent to the portal generator and the required source, dependencies and Client/Server registration. Confirm that `packages/app-portal-inventory/` exists and that the portal appears in management after restarting the app. Generation does not install it. Sign in as an administrator and follow the installation steps below. Ordinary-user entry points and authorization require the work described in [Portal access and permissions](access.md).

If the Agent has generated the portal, skip the generation command below to avoid creating the same directory twice.

### Create a portal with the command

Run from the app root:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/portal@beta inventory \
  --title 'Inventory management' --title-zh '库存管理'
```

`inventory` is the portal ID. It must start with a lowercase letter, use lowercase letters and digits in segments separated by single hyphens, and be no longer than 40 characters, for example `inventory` or `quality-checks`. The generated package is `@nocobase/app-portal-inventory`.

| Option | Purpose |
| --- | --- |
| `--title` | Default display name, here `Inventory management` |
| `--title-zh` | Simplified Chinese display name, here `库存管理` |
| `--dry-run --json` | Inspect the generation plan without writing files |

Without `--title`, the display name is derived from the ID. Without `--title-zh`, Simplified Chinese uses the default display name.

The command creates `packages/app-portal-inventory/`, installs dependencies and registers the Client and Server. It generates a minimal portal, without inventory tables, sample records or CRUD pages. It neither starts the app nor changes the database.

The portal remains uninstalled. If dependency installation fails, keep the generated source and follow the recovery commands in the output; do not rerun generation over an existing target.

### Install and verify the portal

After generation, start or restart the development server to load the new registration. Sign in as an administrator:

1. Open **System settings → Portal management**.
2. Find Inventory management, initially uninstalled.
3. Select **Install** and wait for database tasks and portal startup.
4. Once installed, enter the portal directly or from the administrator's homepage workbench.

The minimal inventory homepage should now open and remain accessible after a refresh. It has no inventory business features yet; continue below to extend its pages, services and data. For installation failures, inspect the failed stage using [Manage portals](manage.md).

## Divide host and portal responsibilities

The app owns authentication, permissions, runtime configuration, database connections and deployment. It supplies the shared sidebar, account menu and header. Each portal owns its entry, layout, navigation, pages, locales, business services and data definitions.

The app supplies `PortalLayoutHost`. The portal passes navigation and content through `PortalLayout`. Add portal menu items in the portal layout; edit the app's `client/layouts/portal-shell.tsx` only when changing the shell shared by all portals.

## Locate the files to change

The main inventory portal files are:

```text
packages/app-portal-inventory/
├── portal.ts
├── client/
│   ├── plugin.ts
│   ├── routes.ts
│   ├── layout.tsx
│   ├── pages/overview.tsx
│   └── locales/
├── server/
│   ├── plugin.ts
│   └── providers/portal.ts
└── database/main/
    ├── migrations/
    └── seeds/portal_inventory_installation.ts
```

`portal.ts` declares the identity and entry. The generated inventory portal uses:

```ts
import type { PortalDescriptor } from '@nocobase/app-plugin-multi-portal/shared';

const portal: PortalDescriptor = {
  id: 'inventory',
  namespace: '@nocobase/app-portal-inventory',
  entry: '/portals/inventory',
  icon: 'LayoutGrid',
  tone: 1,
};

export default portal;
```

The display name comes from `title` in `client/locales/`, not the portal ID. Change translations to rename the display, preserving established IDs, package names and route identifiers that installation records or permissions may reference. Entries omit deployment base paths such as `/main`.

## Add pages and navigation

To continue development with an Agent, describe the business behavior:

```prompt
Add an inventory list to the Inventory management portal with product, warehouse and quantity fields. Let administrators add and edit entries and search by product name.
```

This involves pages, services and data. The Agent should follow existing app and portal conventions; the file descriptions below help you understand and review its changes. Verify actual operations using the checks at the end of this guide.

Edit `client/pages/overview.tsx` for the homepage. Add pages under `client/pages/` and register them in `client/routes.ts`. The generated homepage route is:

```ts
{
  name: 'inventoryOverview',
  path: '/portals/inventory',
  auth: 'required',
  authz: 'unrestricted',
  breadcrumb: { title: 'title' },
  componentLoader: () => import('./pages/overview.js'),
}
```

Keep new pages under `/portals/inventory/...` and add their entries to `navigation` in `client/layout.tsx`. Routes determine matching and access; navigation provides links. Maintain both. Pages default-export their component and use the portal Layout; put visible text in the portal's locales.

Use shadcn/ui, preferring existing package components and NocoBase UI Library. See [Pages and menus](../../extension-development/pages-and-menus.md) and [Localization](../../extension-development/localization.md). Generated pages allow administrators only; business users also need [Portal access and permissions](access.md).

## Add services and database resources

Keep domain logic in portal Server services and register HTTP endpoints through the plugin route mechanism. Every endpoint independently checks authentication, business authorization and portal installation. Hiding a page is not sufficient. See [Server APIs](../../extension-development/server-apis.md).

The generator declares the main connection in `server/plugin.ts`:

```ts
database: {
  connections: {
    main: {},
  },
},
```

Add schema migrations under `database/main/migrations/` and required initialization data under `database/main/seeds/`. Retain the generated installation seed; do not overwrite an administrator's installation choice on each startup.

Portals support multiple connections. Configure each connection and driver in the host app, then declare the same name in the portal, for example `analytics: {}` with resources under `database/analytics/migrations/` and `database/analytics/seeds/`. The app owns connection configuration. Installation coordinates required database tasks and activates the portal only after they all succeed.

These connections do not form a distributed atomic transaction. Failure on one connection does not automatically roll back migrations completed on another. Preserve execution history, fix the cause and retry. See [Database and migrations](../../extension-development/database-and-migrations.md) and [Database connections](../../framework/database/connections.md).

## Verify and deliver

From the app root, check the affected portal and build the app to verify integration:

```bash
pnpm --filter @nocobase/app-portal-inventory check
pnpm build
```

Verify the homepage, added pages and navigation. Test pages and APIs as an administrator, an authorized business user and an unauthorized user. The generated minimal package may contain no business tests; a passing check does not establish business coverage.

Local portals ship with the host app. Use `pnpm build --tar` for a deployment archive, then follow [Publish an app release](../../deployment/publish-app-release.md). See [Manage portals](manage.md) for installation, removal and upgrades.
