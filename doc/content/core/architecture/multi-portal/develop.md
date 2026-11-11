---
title: Develop a business portal
metaDescription: Create a portal in an existing multi-portal app, install and open it, then add pages, navigation and layouts and verify the result.
---

## Prepare a multi-portal app

Start with a configured [multi-portal app](create-app.md) that runs successfully. Keep your commercial registry login valid and use an administrator account with `unrestricted` permission for these steps.

This example creates **Portal 1** (`portal-1`), starting with an empty portal you can open, then adding a details page. A portal is a local package that builds and deploys with the app; publishing it to npm is not required. Follow shadcn/ui conventions for pages, reusing existing components and NocoBase UI Library where possible.

## Create your first portal

Work at the existing app root. Choose one of the following methods; do not generate the same portal twice.

### Create with an Agent

Open your coding Agent at the app root and ask:

```prompt
Add a portal called Portal 1 with the name portal-1 to this app. Start with a basic homepage I can open, without business data.
```

The Agent uses the project's `AGENTS.md`, `.agents/rules/multi-portal.md` and local development Skills to generate and register it. Confirm that `packages/app-portal-portal-1/` exists and that the portal is registered on both the app's Client and Server. You do not need to create another app.

### Create with the command

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/portal@beta portal-1
```

The command generates `packages/app-portal-portal-1/`, installs dependencies and registers the portal on Client and Server. It does not start the app, change the database or install the portal. It does not generate business tables or CRUD pages.

A portal ID starts with a lowercase letter and contains lowercase letters, numbers and single-hyphen-separated segments, up to 40 characters. Add `--dry-run --json` to inspect the plan without writing files.

The initial title is derived from the ID: `portal-1` becomes `Portal 1`. After generation, maintain localized names and descriptions in `packages/app-portal-portal-1/client/locales/`. Edit the fields in the existing files, keeping their imports, types and exports:

```ts
// Fields in messages in en-US.ts
title: 'Portal 1',
description: 'Your portal workspace.',
```

```ts
// Fields in messages in zh-CN.ts
title: '门户 1',
description: '你的门户工作台。',
```

The interface uses the current language's text. Renaming a portal does not require changing its ID, package name or route. Maintain other languages in their corresponding files.

To set the initial text from the command line, use repeatable `--set-locale` assignments. This requires a generator version whose `--help` lists `--set-locale`; with an older version, generate the portal first and edit the locale files above.

```bash
pnpm create @nocobase/portal@beta portal-1 \
  --set-locale 'en-US.title=Portal 1' \
  --set-locale 'en-US.description=Your portal workspace.' \
  --set-locale 'zh-CN.title=门户 1' \
  --set-locale 'zh-CN.description=你的门户工作台。'
```

Use `language.field=value`, with `title` or `description` as the field. Omitted fields keep their defaults. Values can contain `=`: only the first one is the separator. Unsupported locales or fields and duplicate assignments are rejected. Titles must be nonempty single-line text; descriptions can be empty. The supported locales are `en-US`, `zh-CN`, `zh-TW`, `ja-JP`, `de-DE`, `es-ES`, `fr-FR`, `pt-BR`, `vi-VN` and `id-ID`. These options initialize the same locale files; they do not introduce a separate configuration source.

If dependency installation fails, keep the generated source and follow the recovery steps printed by the command. Do not rerun the generator over the existing directory.

## Install and open the portal

Start or restart the app to load the newly registered portal:

```bash
pnpm dev
```

### Install in Portal management

As an administrator, open **System settings → Portal management** and find **Portal 1**. Its initial status is **Not installed**. Open the row's **…** menu and choose **Install**.

![Installing Portal 1 from its actions menu](/assets/core/multi-portal/develop/install.png)

Wait for **Installed**, then choose **Open** from the same menu. Installation runs the portal's database tasks and starts the portal. If it fails, use [Manage portals](manage.md) to identify the failed stage; do not delete migration history to start over.

### Open from the workbench

Administrators can also open installed portal cards from **Workbench**. **Home** provides the app's landing content, **Workbench** provides portal entry points, and **Portal management** handles installation and uninstallation.

![Portal 1 on the separate workbench](/assets/core/multi-portal/develop/workbench.png)

> [!NOTE]
> The separate workbench screenshots use a preview template. If your installed template does not yet have a separate Workbench menu, use the portal list on Home. Installation and opening through Portal management work the same way.

The portal should show its own **Overview** navigation and basic homepage. Refresh the page and confirm it still opens. This verifies the minimal portal; it has no business features yet.

![Portal 1 with its default navigation and homepage](/assets/core/multi-portal/develop/portal.png)

### Switch portals and return to the workbench

Click the portal name at the top left to open the switcher. Once other portals are installed and authorized, you can switch to them here. With only one portal, use **Back to workbench**.

![The portal switcher and Back to workbench entry](/assets/core/multi-portal/develop/switcher.png)

Generated portal pages initially allow administrators only. Configure ordinary-user entry points, portal lists and page authorization through [Portal access and permissions](access.md). Displaying a navigation item does not grant access.

## Add pages and navigation

### Find the portal code

The main files are under `packages/app-portal-portal-1/`:

| File | What to change |
| --- | --- |
| `portal.ts` | Portal ID, namespace, entry, icon and tone |
| `client/pages/overview.tsx` | Default homepage |
| `client/routes.ts` | Page routes and access requirements |
| `client/layout.tsx` | Portal layout and navigation |
| `client/locales/` | Names and interface text |
| `server/plugin.ts`, `server/providers/portal.ts` | Server registration and portal definition |
| `database/main/` | Migrations and seeds for the main connection |

The entry is `/portals/portal-1`, without the app's deployment base path such as `/main`. Change the locale resource's `title` to rename the display label. Avoid changing an existing ID or package name: installation records and permissions may reference them.

### Add a page and route

You can continue with an Agent:

```prompt
Add a Details page to Portal 1 with a navigation entry. For now, show a short introduction on the page and allow administrators to view it.
```

For a manual implementation, default-export a page component from `client/pages/details.tsx`, using the existing `Layout`:

```tsx
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import Layout from '../layout.js';

export default function DetailsPage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-portal-portal-1');
  return (
    <Layout>
      <section className='p-6'>
        <h1 className='text-2xl font-semibold'>{t('detailsTitle')}</h1>
        <p className='mt-2 text-muted-foreground'>{t('detailsDescription')}</p>
      </section>
    </Layout>
  );
}
```

Add `detailsTitle: 'Details'` and `detailsDescription: 'A page inside Portal 1.'` to the portal's `client/locales/en-US.ts`, and translations to the corresponding locale files. Then append this entry to the route array in `client/routes.ts`:

```ts
{
  name: 'portal1Details',
  path: '/portals/portal-1/details',
  auth: 'required',
  authz: 'unrestricted',
  breadcrumb: { title: 'detailsTitle' },
  componentLoader: () => import('./pages/details.js'),
}
```

### Add a navigation entry

Read the portal's translations in `client/layout.tsx`:

```ts
const { t: tPortal } = useTranslation('@nocobase/app-portal-portal-1');
```

Keep the existing Overview item and append the following to `navigation`. The generated layout already imports `ChartNoAxesCombined`; you can choose another supported icon.

```ts
{
  path: `${portal.entry}/details`,
  title: tPortal('detailsTitle'),
  icon: ChartNoAxesCombined,
}
```

Clicking **Details** should display the introduction. Opening `/main/portals/portal-1/details` directly and refreshing should work too; substitute your actual app base path if it is not `/main`. Routes determine page matching and access; navigation provides entry points. Maintain both.

## Adjust the portal layout

### App shell and portal layout

The app owns sign-in, user permissions, runtime configuration, connections and deployment. The portal owns its pages, navigation, business services and data definitions.

Generated portals use `PortalLayout`, which delegates the sidebar, header and account menu to the app's `PortalLayoutHost`. The portal layout is in `client/layout.tsx`; the shared shell is in the app's `client/layouts/portal-shell.tsx`.

### Customize the portal's page structure

For changes to one portal's menus, page arrangement or content area, start with that portal's layout and pages. You can implement a portal-specific layout for top navigation or another page structure. Retain the account, sign-out and portal-switching entry points you need, and use the app's authentication and authorization mechanisms.

Changing the app's shared shell affects other portals that use it. Do not change the global shell just to accommodate one portal's special layout. See [Pages and menus](../../extension-development/pages-and-menus.md) and [Localization](../../extension-development/localization.md) for the underlying APIs.

## Add services and data

To persist business records, implement business logic and HTTP endpoints in the portal's Server. Each endpoint must check authentication, business permissions and portal installation status independently. Hiding a menu does not protect data. See [Server APIs](../../extension-development/server-apis.md).

The generator declares `database.connections.main` in `server/plugin.ts`. Put schema migrations in `database/main/migrations/` and required initial data in `database/main/seeds/`. Keep the generated installation seed; do not overwrite the administrator's installation choice at every startup.

Additional connections and drivers are configured by the app. The portal declares matching connection names and their migrations and seeds. Installation waits for every required connection's database tasks to succeed. These connections do not form a cross-database atomic transaction: preserve execution history, fix failures and retry. See [Database connections](../../framework/database/connections.md) and [Database and migrations](../../extension-development/database-and-migrations.md).

## Verify and deliver

At the app root, run:

```bash
pnpm --filter @nocobase/app-portal-portal-1 check
pnpm build
```

Then check actual behavior:

- After installation, open the portal from management and the portal list, and refresh it.
- Verify navigation and direct access to the new page, switching portals and the return entry.
- After configuring ordinary-user permissions, check pages and endpoints with an administrator, an authorized user and an unauthorized user.

The minimal generated package may have no business tests. Passing checks does not mean business behavior is covered. Local portals ship with the app. Run `pnpm build --tar` when you need a deployment archive, then follow [Publish an app release](../../deployment/publish-app-release.md).
