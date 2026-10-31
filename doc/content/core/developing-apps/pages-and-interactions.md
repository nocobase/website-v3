---
title: UI components and interactions
description: Follow shadcn conventions and integrate NocoBase UI Library source components, business blocks, route dialogs and application context.
---

NocoBase applications follow shadcn conventions for UI. Component source lives in the application; pages connect it to data and actions, and the application maintains its own components and interaction patterns.

The product catalog example below demonstrates each usage. Products, people and review history are fixtures. Product edits last until a full reload; review notes reset when leaving the page. See [Example source and setup](#example-source-and-setup) at the end for the complete application and startup instructions.

## Component conventions

### Follow shadcn conventions throughout

Use the application's shadcn buttons, inputs, forms and confirmation dialogs to preserve shared themes, interactions and accessibility behavior. The [NocoBase UI Library](https://ui.nocobase.com/) distributes components and business blocks for NocoBase applications through a shadcn Registry, following the same conventions.

This example uses the Base UI components from template `1.0.0-beta.85`. Follow the composition API of the installed source: these components use `render`, for example, so do not mix in another implementation's `asChild` API. See the [shadcn documentation](https://ui.shadcn.com/docs) for general component usage.

### Reuse existing application components first

Check `client/components/` and existing pages first. The default template already provides `PageContainer`, `PageHeader`, `DataTable` and route overlays. Primitives live in `client/components/ui/`. Add missing components with the project's shadcn CLI.

The product catalog reuses `DataTable`, `Input` and the row action menu, with a shared `StockBadge` for inventory status. It does not need another table or button implementation:

```tsx
import { PageHeader } from '#components/page-header';
import { DataTable } from '#components/data-table';
import { Input } from '#components/ui/input';

// Composition inside CatalogPage; see the full source for filtering, columns and state.
<PageHeader title={t('catalog.title')} description={t('catalog.description')} />
<DataTable
  data={products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))}
  columns={columns}
  pagination={false}
  toolbar={() => (
    <Input
      aria-label={t('catalog.search')}
      placeholder={t('catalog.search')}
      value={query}
      onChange={(event) => setQuery(event.target.value)}
    />
  )}
/>
```

Open **Product catalog**, search for a product or choose **Edit** from a row menu. [View the catalog source](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/catalog.tsx).

![Product catalog composed from the existing header, table, search input and row menu](/assets/core/developing-apps/pages-and-interactions/catalog.png)

## Use the NocoBase UI Library

### Configure the Registry and add components

The default template already configures the NocoBase Registry in `components.json`. Add this entry to the existing configuration if your application lacks it:

```json
{
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  }
}
```

Run the project's installed CLI from the application root. For example, add a page header or the approval presentation block:

```bash
pnpm exec shadcn add @nocobase/page-header
pnpm exec shadcn add @nocobase/approval-ui
```

Use existing components directly. When the CLI asks to overwrite a file, keep the existing copy and inspect the differences first. Adding a block should not overwrite the application's primitives indiscriminately.

Installing `approval-ui` added 13 files to the example. The main source locations are:

```text
client/components/page-header.tsx
client/extensions/nocobase-approval-ui/
  index.ts
  types.ts
  approval-progress.tsx
  approval-timeline.tsx
  approval-action-bar.tsx
  approval-ui-provider.tsx
  locales/
  ...
```

[View Registry configuration](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/components.json) · [View the installed block](https://github.com/nocobase/docs-examples-v3/tree/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/extensions/nocobase-approval-ui).

### Use components and business blocks

Import from the application's source paths. Individual components usually live in `client/components/`; blocks contain several components, types and locale resources, usually under `client/extensions/nocobase-<name>/`.

The example's **Review block** page combines progress, history and an action bar:

```tsx
import {
  ApprovalProgress,
  ApprovalTimeline,
  ApprovalActionBar,
} from '#extensions/nocobase-approval-ui/index';

// Composition inside ReviewPage; the page supplies steps, lines and actions.
<ApprovalProgress steps={steps} />
<ApprovalTimeline lines={lines} />
<ApprovalActionBar actions={actions} />
```

Open **Review block** to see submitted product information and a content review in progress. [View the block composition](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/review.tsx).

![Progress, history and actions composed into a product review page](/assets/core/developing-apps/pages-and-interactions/review-block.png)

### Check dependencies and source locations

Registry installation adds source and declared dependencies; it does not complete business integration. Inspect the asset's instructions, generated files, `package.json` and lockfile to identify required data, callbacks, providers, locale resources and plugins.

For example, `approval-ui` is a presentation block. It requires no approval plugin and supplies no approval engine. The example passes fixture review data to its components and updates a local note through a callback. A real approval process requires its own business integration, and hiding a button does not replace server authorization.

The shadcn CLI may place new frontend dependencies in `dependencies`. Follow application conventions: client-only packages belong in `devDependencies`, while packages also used by the server stay in `dependencies`. Import aliases come from `package.json`'s `imports` and `components.json`; do not add competing Vite or TypeScript aliases for the same directories.

To distribute your own component source, see [Frontend extensions](../extension-development/frontend-components.md). For the general distribution mechanism, see [shadcn Registry](https://ui.shadcn.com/docs/registry).

## Connect application interactions

### Connect a block to data and actions

A block defines its inputs and interaction contract. The page maps business data to those inputs and decides what changes after an action. `ApprovalActionBar` uses `form` for input and validation, and `run` to execute the action. Returning `false` keeps the form open; other successful returns close it.

The example's **Add review note** action uses the following configuration. See the [action integration source](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/review.tsx) for input rendering and state declarations:

```tsx
{
  key: 'note',
  label: t('catalog.review.addNote'),
  primary: true,
  form: {
    initialValues: { note: '' },
    validate: (values) => noteText(values.note).trim() ? [] : ['note'],
    // render draws the form using the supplied values, setValues, invalid and busy.
  },
  run: async (values) => {
    setError('');
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (rejectNext) {
      setRejectNext(false);
      setError(t('catalog.review.refused'));
      return false;
    }
    setComment(noteText(values.note).trim());
  },
}
```

Click **Add review note**. An empty note cannot be submitted. Submitting text adds it to history and closes the action form. The delay makes the running state observable; a real application should call its business API and handle failure in this callback.

![Review note form and required-field validation](/assets/core/developing-apps/pages-and-interactions/review-note.png)

Click **Refuse the next note** before submitting to exercise `run` returning `false`: the page explains the failure and preserves the input. Submit again to succeed. Handle exceptions with visible feedback instead of leaving them to the block. See [Data requests and state](data-requests-and-state.md) for real requests and refresh behavior.

![A refused action keeps the note and its form open](/assets/core/developing-apps/pages-and-interactions/review-refused.png)

### Use route dialogs and close guards

Use a child route for a record editor or detail overlay. The parent renders `<Outlet />`, and the child page wraps its form in `RouteDialog`; the URL determines whether it is open. In the example, `catalog/edit/:productId` is a child of the catalog page:

```tsx
// The catalog route under /ui-components in client/routes.ts.
{
  name: 'uiCatalog',
  path: 'catalog',
  componentLoader: () => import('./pages/ui-components/catalog.js'),
  children: [{
    name: 'uiProductEdit',
    path: 'edit/:productId',
    componentLoader: () => import('./pages/ui-components/edit.js'),
  }],
}
```

Click **Arc desk lamp** to open the editor. The same URL also opens it directly. See [Pages, routes and navigation](pages-routes-and-navigation.md) for route declarations and nesting. [View the editor source](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/edit.tsx).

![The product child route opens an edit dialog](/assets/core/developing-apps/pages-and-interactions/edit-product.png)

Call `useRouteOverlay()` in a descendant of `RouteDialog`, such as a component passed to `footer`. Its `close()` calls `beforeClose` and, when allowed, returns to the parent route, preserving query parameters by default. Do not call this Hook in the page component that returns `RouteDialog` itself.

```tsx
function EditorFooter({ pending, disabled }: { pending: boolean; disabled: boolean }) {
  const { t } = useTranslation();
  const { close, isClosing } = useRouteOverlay();
  return <>
    <Button variant="outline" disabled={pending || isClosing}
      onClick={() => void close()}>{t('catalog.cancel')}</Button>
    <Button type="submit" form="product-edit"
      disabled={pending || isClosing || disabled}>{t('catalog.save')}</Button>
  </>;
}
```

The example's guard first prevents leaving during submission. With unsaved changes, it returns a Promise that waits for confirmation. **Keep editing** preserves the input; **Discard** allows navigation. Concurrent close requests share the pending Promise so they do not create multiple confirmations.

```tsx
// Core checks in useEditorLeave; see the source for the confirmation and Promise management.
function guard() {
  if (allowedRef.current) return true;
  if (flagsRef.current.pending) return false;
  if (!flagsRef.current.dirty) return true;
  if (!requestRef.current) {
    let resolve!: (allow: boolean) => void;
    const promise = new Promise<boolean>((done) => { resolve = done; });
    requestRef.current = { promise, resolve };
    setOpen(true);
  }
  return requestRef.current.promise;
}
useNavigationGuard(guard);

// The editor passes the same check to the overlay.
<RouteDialog beforeClose={leave.guard} footer={<EditorFooter pending={pending} disabled={!product} />}>
  {/* Form and confirmation dialog */}
</RouteDialog>
```

This excerpt shows the integration points; the [close guard source](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/use-editor-leave.tsx) contains the runnable implementation. Update state and refs together during submission. On success, release the guard before closing so stale submission state cannot block a completed save.

![An unsaved-change confirmation layered over the editor](/assets/core/developing-apps/pages-and-interactions/discard-changes.png)

Handle these three ways of leaving separately:

| How the user leaves | Mechanism used by the example |
| --- | --- |
| Close button, Esc, backdrop or `close()` | `beforeClose` |
| Browser history or application route navigation | `useNavigationGuard` |
| Browser refresh or closing the tab | `beforeunload`, which shows the browser's own prompt |

Check **Simulate save failure** and save: the editor remains open and retains the input. Uncheck it to retry. Saving in this example updates only the current page session, not a database.

![A failed save preserves the dialog and input](/assets/core/developing-apps/pages-and-interactions/save-failure.png)

### Supply application context for a block

A block may need application-specific names, avatars or date formatting. `ApprovalUiProvider` does not fetch users; the example supplies a person lookup and date formatter. Without `personName`, the block displays person IDs by default.

The main configuration in `CatalogApprovalProvider` is shown below. See the [provider source](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/approval-provider.tsx) for the avatar composition and full implementation:

```tsx
<ApprovalUiProvider
  personName={(id) => people[id] ?? id}
  formatDateTime={(iso) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
    }).format(new Date(iso)) + ' UTC'
  }
>
  {children}
</ApprovalUiProvider>
```

The example uses UTC for a consistent demonstration; use your application's timezone requirements in business code. When multiple pages need this context, register the provider at the `application` layer in `client/react-providers.ts`:

```tsx
// Add to the existing defineClientReactProviders([...]); retain other registrations.
{
  name: 'catalog-approval-ui',
  layer: 'application',
  component: CatalogApprovalProvider,
}
```

Also merge the block's locale resources into the matching application locale files, such as `...approvalUi` in `client/locales/en-US.ts`. This differs from service registration in `client/service-provider.ts`: React providers supply rendering context, while service providers own application services and startup. See [React Providers](../framework/runtime/react-providers.md).

After submitting a note in **Review block**, inspect the resolved names, avatars and UTC dates. [View application registration](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/react-providers.ts) · [View locale resources](https://github.com/nocobase/docs-examples-v3/tree/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/locales).

![Shared context supplies names, avatars and formatted dates to progress and updated history](/assets/core/developing-apps/pages-and-interactions/review-updated.png)

## Customize and maintain components

### Organize component source

Place source according to its reuse scope; page-specific logic does not all belong in global components:

| Location | Content in the product example |
| --- | --- |
| `client/pages/ui-components/` | Pages, local forms, fixture data and interaction Hooks |
| `client/components/stock-badge.tsx` | Stock badge shared by the table and cards |
| `client/components/ui/` | Primitives installed with the shadcn CLI |
| `client/extensions/nocobase-approval-ui/` | The complete Registry block |
| `client/react-providers.ts` | Application React provider registration |
| `client/locales/` | Application copy and block locale resources |

[View the source directory](https://github.com/nocobase/docs-examples-v3/tree/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client). See [Page layouts](page-layouts.md) for page containers and layout conventions.

### Adapt components to business needs

Prefer existing props, variants and composition to express business meaning. `StockBadge` owns the stock rule and reuses the installed `Badge`, keeping the table and cards consistent:

```tsx
export function StockBadge({ stock }: { stock: number }) {
  const { t } = useTranslation();
  const state = stock === 0 ? 'out' : stock < 5 ? 'low' : 'available';
  return (
    <Badge variant={state === 'out' ? 'outline' : state === 'low' ? 'secondary' : 'default'}>
      {t(`catalog.stock.${state}`)}
    </Badge>
  );
}
```

Open **Component variants**. Three cards show in-stock, low-stock and out-of-stock products; the catalog table uses the same component. [View StockBadge](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/components/stock-badge.tsx) · [View the card example](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/client/pages/ui-components/customize.tsx).

![The same stock badge component represents three business states](/assets/core/developing-apps/pages-and-interactions/stock-variants.png)

Use semantic tokens such as `bg-muted` and `text-muted-foreground`, and follow the application's `client/theme/` conventions for theme changes. When changing copied block source, keep business adaptations in outer components where possible and record modifications that must survive updates. Do not rewrite a primitive button for one page's needs.

### Update components without losing business changes

Copied source does not update automatically when npm packages change. Commit the current code, inspect Registry changes and merge the parts you need. For example, inspect `PageHeader`:

```bash
pnpm exec shadcn add @nocobase/page-header --diff client/components/page-header.tsx
```

When no differences exist, the command prints `No changes.`. When differences exist, also review dependencies, import paths and caller contracts; merge deliberately instead of overwriting the whole set. Recheck business variants, callbacks and overlay closing after an update.

Registry content can change. This article links to a fixed example commit; its [source provenance](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/docs/registry-sources.json) records the template version and block asset checksum for future comparison.

## Verify interactions

### Check each usage and its key states

After starting the example, try these operations:

| Entry | Action and expected result |
| --- | --- |
| **Product catalog** | Search filters products; an unmatched search shows an empty result |
| **Edit product** | An empty name cannot be saved; success updates the list; reload restores the fixtures |
| Editor closing | Cancel or Back after an edit asks for confirmation; keeping changes preserves the draft; a directly opened editor can return to the catalog |
| **Simulate save failure** | Closing is blocked during submission; failure retains input and allows retry |
| **Review block** | An empty note cannot submit; refusal retains the form; retry updates history |
| **Component variants** | Every stock state has text; controls remain readable and usable in dark mode and narrow windows |

Screenshots show states; closing and navigation still need behavioral checks. The [browser tests](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/tests/playwright/ui-components.test.ts) cover these flows, query preservation, the refresh prompt and mobile overlay geometry.

### Run tests and build

From the example application directory:

```bash
pnpm typecheck
pnpm exec vitest run tests/client/ui-components.test.tsx tests/client/client-routes.test.ts tests/client/page-permission-titles.test.ts tests/client/route-overlay.test.tsx tests/project/agents-md.test.ts
pnpm build
```

Start the application, then pass its actual entry URL, including the deployment prefix, to the browser tests:

```bash
pnpm exec playwright install chromium
APP_URL=http://<host>:<port>/main/ pnpm exec playwright test tests/playwright/ui-components.test.ts
```

Omitting `APP_URL` skips the browser tests. Business persistence, real approval execution and business-role authorization are outside this UI example's verification scope.

## Example source and setup

### Complete example application

[View the complete example](https://github.com/nocobase/docs-examples-v3/tree/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components) · [Read the README](https://github.com/nocobase/docs-examples-v3/blob/c8670ab1f784d76c4fef61936bdc3462fe1c1d89/apps/ui-components/README.MD).

This is a standalone application with no dependency on another chapter's example. Its README maps every usage to an entry, source file, screenshot and verification method.

### Prepare the environment and start

Use Node.js 24 and pnpm 11. The example is based on template `1.0.0-beta.85`, with `@nocobase/app-client@4.0.0-beta.5` in the lockfile. These commands use SQLite for the template's system data; UI fixtures remain in memory and require no external service.

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout c8670ab1f784d76c4fef61936bdc3462fe1c1d89
cd apps/ui-components
pnpm install --frozen-lockfile
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

Open the application entry printed in the startup log and append `ui-components/catalog` after its deployment prefix. For an entry ending in `/main/`, the catalog is at `/main/ui-components/catalog`. These three demo pages require no sign-in. Keep `config.yml` and the local database out of version control. See the example README for other database configurations, LAN access and screenshot generation.
