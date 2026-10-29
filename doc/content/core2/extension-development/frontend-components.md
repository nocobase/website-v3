---
title: Components and styles
description: Organize plugin components, integrate with the host's styles and themes, expose components, and optionally distribute source assets through a UI Registry.
---

When developing applications and plugins, you can write and organize frontend components freely; the only constraint is that **primitives use shadcn**. When building modular interfaces, first consult the components and blocks in the [NocoBase UI Library](https://ui.nocobase.com/).

The NocoBase UI Library is NocoBase's library of UI source assets. It distributes components and blocks through shadcn UI Registry for Agents to take, change and combine as needed; its website shows component examples and installation instructions.

When frontend components or blocks you build later need to be **published as source assets for Agents to take, change and combine as needed**, distribute them through shadcn UI Registry as well. Whether to publish depends on how the source assets must be delivered: reusing components inside a plugin, or exporting components through the plugin's public entries, requires no Registry.

This guide continues with the announcements board from [Write your first plugin](write-your-first-plugin.md): first write a list component and connect it to the page, then, as needed, turn it into a standalone source asset and install it into other applications or plugins through a local path. Use an existing static site only when distribution across machines is needed.

## Use an Agent

With the announcements plugin in place, describe the request like this:

```prompt
Extract the announcements plugin's list into a standalone component.
Use shadcn primitives and first consult the NocoBase UI Library's components and blocks at https://ui.nocobase.com/.
Pass announcement data and empty-state text to the list. Keep data loading
and error handling in the page. Preserve routes, navigation and translations,
and verify populated and empty lists and the plugin build.
```

The steps below show the manual implementation. **Unless noted otherwise, commands run in the App root. File paths in the component development part are relative to `packages/app-plugin-announcements/`; the source asset part states the paths of the separate Registry package.**

## Organize components

You need a working announcements plugin; its page, API, language resources and registration are described in [Write your first plugin](write-your-first-plugin.md). This guide adds `client/components/announcement-list.tsx`:

```tree
packages/app-plugin-announcements/
├── client/
│   ├── components/
│   │   ├── ui/                      # shadcn primitives
│   │   └── announcement-list.tsx    # Announcement list
│   ├── pages/
│   │   └── announcements.tsx        # Load data and compose components
│   ├── locales/                     # Page translations
│   └── styles.css                   # shadcn stylesheet configuration
├── components.json                 # shadcn configuration
└── package.json                     # Dependencies, aliases and public entries
```

This is only an example organization. You can add directories, extract Hooks or change how finely components are split according to the business, as long as import paths and build configuration stay consistent.

## Use shadcn and the NocoBase UI Library

Install the shadcn Card used in this example:

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add card
```

The generator has already created `components.json`, a style entry and in-package aliases for plugins with client code. The command runs in the selected plugin, so the component is written into the plugin's own `client/components/ui/`. If the component already exists, review the differences first and keep your business changes.

When you need a page container, a heading or other business components, check the [NocoBase UI Library](https://ui.nocobase.com/) first. For example, the first plugin tutorial already installed:

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add \
  @nocobase/page-container @nocobase/page-header
```

If these files already exist, there is no need to install them again. `@nocobase` in `components.json` points to the NocoBase UI Library's source distribution address; when an older plugin lacks it, merge the following configuration into the existing `registries`:

```json
{
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  }
}
```

After installing, check `package.json`: client runtime dependencies should be declared as `peerDependencies` according to the plugin's conventions, with suitable version ranges kept, then run `pnpm install`. Do not move dependencies the server still uses directly along with them. For in-package aliases and publishing mappings, see [Plugin structure](plugin-structure.md#ui-components-and-source-ownership).

## Write and use components

### Implement the announcement list

Add `client/components/announcement-list.tsx`:

```tsx
import type { ReactElement } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#components/ui/card';

export interface AnnouncementListItem {
  readonly id: string;
  readonly title: string;
  readonly content: string;
}

export interface AnnouncementListProps {
  readonly items: readonly AnnouncementListItem[];
  readonly emptyMessage: string;
}

export function AnnouncementList({
  items,
  emptyMessage,
}: AnnouncementListProps): ReactElement {
  if (items.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <ul className='grid gap-4'>
      {items.map((item) => (
        <li key={item.id}>
          <Card>
            <CardHeader>
              <CardTitle><h2>{item.title}</h2></CardTitle>
            </CardHeader>
            <CardContent>
              <p className='whitespace-pre-wrap text-muted-foreground'>
                {item.content}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
```

This component only receives data and text, which makes it easy for pages to compose and easy to install separately as a source asset later. It declares the data shape it needs itself instead of depending on the plugin's private `shared/` file; the page can still pass in the existing `Announcement[]`.

The plugin build must generate type declarations, so the example declares Props and the return type explicitly. After installing Card, also check `client/components/ui/card.tsx`: add `: React.ReactElement` to the `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent` and `CardFooter` functions that lack a return type, keeping their parameters and implementation; otherwise the plugin's `isolatedDeclarations` check reports `TS9007`. Other newly installed primitives must meet the plugin's declaration generation requirements too.

### Connect the page

Add the following to `client/pages/announcements.tsx`:

```tsx
import { AnnouncementList } from '#components/announcement-list';
```

Keep the page's existing `useApiClient()`, `useTranslation()` and request logic, and replace the page's `return` with:

```tsx
return (
  <PageContainer>
    <PageHeader title={t('title')} />
    {failed ? (
      <p role='alert'>{t('error')}</p>
    ) : items === null ? (
      <p role='status'>{t('loading')}</p>
    ) : (
      <AnnouncementList items={items} emptyMessage={t('empty')} />
    )}
  </PageContainer>
);
```

In this example, the page handles requests, state and translation, and the list handles presentation. Other components can also use client services or Hooks directly as the business needs; for connecting plugin services, see [Client services](client-services.md), and for the shared container mechanism, see [ServiceProviders and service lifecycle](service-provider.md).

## Styles and theme integration

### Separate generation configuration from runtime styles

`tailwind.css` in `components.json` points to the plugin's `client/styles.css`. In the scaffold, this file is for shadcn to generate components; it imports Tailwind, animations and shadcn styles and notes that theme variables come from the host application. The generated `client/index.ts` only exports the plugin factory and does not import this CSS file automatically.

The default application imports its own `client/styles.css` in `client/index.tsx`, which loads the theme and generates utility classes. Plugin components use semantic classes such as `bg-card` and `text-muted-foreground`, and the final styles are produced by the application's client build. The plugin's TypeScript build only handles JavaScript and type declarations, and does not generate a complete set of application CSS on its own.

So adding rules to the plugin's generation-only `styles.css` does not mean the page has loaded them. Nor should you import the whole generated stylesheet, Tailwind entry included, into the application a second time just to make one rule take effect.

### Include plugin components in the host build scan

The default template references its scan configuration through `@config "../tailwind.config.mjs"` in the application's styles. The Core baseline `7fb8311` checked for this guide resolves the real paths of `@nocobase/app-plugin-*` packages and scans both source `client/` and published `dist/client/` directories, accommodating pnpm symlinks and compiled plugins.

If a plugin uses a custom scope (such as `@my-company`), the target application's scan configuration must include the corresponding packages explicitly, keeping the existing scan entries and covering the compiled directories of both local source and installed packages. Do not assume that, after renaming the package, it is still covered by the default `@nocobase` scan rule, and do not judge that scanning works from one wildcard path that crosses a symlink.

Write utility classes in components as complete static strings; for different states, use a mapping that contains complete class names, avoiding concatenated values such as `bg-${color}` that the builder cannot discover. Once it looks right in the source development environment, also check an application build that installs the published package.

### Use host theme tokens and scope custom rules

Keep using semantic classes such as `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground` and `border-border`, so colors, corner radii and fonts come from the host theme. The announcement list already uses `text-muted-foreground` and needs no color scheme of its own. Theme presets and color modes are managed by the application; for the conventions, see [Themes and styles](../developing-apps/themes-and-styles.md).

When you need custom CSS, scope it to the component with a plugin-specific class name or attribute, and do not write overrides for global `body`, every `button` or `:root`. Portal content such as dialogs may not be under the page's root node, so set the scoping class on the actual content node. Do not change the host's appearance by reinitializing shadcn or adding a second theme Provider.

Custom runtime styles should be maintained as a separate resource, with a clear decision on whether the plugin's client module or the application's style entry imports it. For external distribution, handle copying the CSS resource, public exports, the package's file list and how build tools load it, all together; `tsc` does not copy CSS automatically. The integration notes must state what consumers need to import, so that the files are not found in the source environment yet missing from the published package. If you only use this guide's announcement list example, no such resource is needed.

## Expose components

When a component is used only inside the plugin, no package export is needed. When the App should import it through the package, add a public entry for the component and keep the source exports and the build mappings in `publishConfig.exports` in sync; see [Plugin declarations and public exports](plugin-declarations.md#public-exports). Importing a component alone does not register the plugin's routes, language resources or services automatically.

In the component's usage notes, list its Props, public types, required styles and runtime environment. If the component depends on the plugin's services or language resources, state which entry consumers must register; translations of exposed components should be bound explicitly to the plugin's namespace, as described in [Client localization](localization.md). For an example of connecting context in a plugin, see [React Context and Providers](react-context-and-providers.md); for the mounting mechanism, see [React Provider registration and mounting](../framework/runtime/react-providers.md).

## Optionally distribute UI source assets

If you want Agents to take this list into a target project to adjust the layout, add actions or combine it with other blocks, distribute it through shadcn UI Registry. A plugin package and Registry assets can be offered side by side: the former maintains public runtime capabilities, and the latter delivers editable source.

**A Registry asset is a standalone source module.** This example adds `announcements-ui/` under the App's `packages/`, next to `app-plugin-announcements/`, with its own manifest and build configuration. The build output can be added directly through a local path; when distribution by URL is needed, deploy it to a static site. Applications and plugins get the source by installing the asset and connect it in their own projects. One Registry package can provide assets used by several plugins or business scenarios.

### Prepare source assets with an Agent

```prompt
Prepare the announcement list as a source asset distributed through shadcn UI Registry.
Maintain it in an independent packages/announcements-ui/ package alongside the plugin package.
Do not import plugin source through relative paths or private aliases; use public entries or supplied inputs.
Declare its files and dependencies. Explain how to supply data, change the layout
and connect the announcements API. Add the local build by file path in another
App or plugin and verify it. No Registry website is required; publish to an
existing static site only when URL distribution is needed.
```

### Organize asset source

In the App root, create the Registry package's source directory:

```bash
mkdir -p packages/announcements-ui/registry/components
```

Save the [announcement list implementation](#implement-the-announcement-list) above as `packages/announcements-ui/registry/components/announcement-list.tsx`. It only receives data and text, so it is already ready for standalone distribution. The related directories are:

```tree
my-app/
├── packages/
│   ├── app-plugin-announcements/    # Plugin package
│   │   ├── client/                 # Plugin's own frontend implementation
│   │   ├── server/                 # Plugin backend capabilities
│   │   └── package.json
│   └── announcements-ui/           # Independent UI Registry package
│       ├── registry/
│       │   └── components/
│       │       └── announcement-list.tsx
│       ├── registry.json           # Distribution manifest
│       ├── package.json            # Independent build tools and scripts
│       └── public/
│           └── r/                  # Generated Registry JSON
└── pnpm-workspace.yaml             # Workspace package configuration
```

Confirm that `pnpm-workspace.yaml` in the App root includes `packages/*`, keeping the existing configuration. The two packages share one workspace, but the Registry asset still must not import the internal files of the plugin package next to it by relative path.

Add `packages/announcements-ui/package.json`:

```json
{
  "name": "announcements-ui",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "shadcn build registry.json --output public/r",
    "check": "pnpm build"
  },
  "devDependencies": {
    "shadcn": "4.18.0"
  }
}
```

This example pins the verified version of the build tool. `check` verifies the manifest and source files by building, and also makes this package take part in the App's workspace checks; the component's types and rendering still need verifying on the consumer side. This `package.json` manages the Registry package's own tools; the npm packages and other Registry items needed when installing the asset are declared separately in the asset manifest below. The Registry package does not need to be registered in the App's Client, Server or CLI plugin lists.

The source to be published is maintained in this standalone package. The plugin's own component in `client/`, and copies installed into other projects, can each be changed independently; to adopt an update of the asset, compare and merge the changes, or reinstall after reviewing the differences.

### Declare the asset and its dependencies

Add `packages/announcements-ui/registry.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "announcements-ui",
  "homepage": "https://example.com",
  "items": [
    {
      "name": "announcement-list",
      "type": "registry:component",
      "title": "Announcement List",
      "description": "An editable announcement list with data and empty-state text supplied by its page.",
      "registryDependencies": ["card"],
      "files": [
        {
          "path": "registry/components/announcement-list.tsx",
          "type": "registry:component",
          "target": "client/components/announcement-list.tsx"
        }
      ],
      "docs": "Render AnnouncementList with items and emptyMessage. Keep data loading in the consuming page. This item does not register routes or install the announcements backend."
    }
  ]
}
```

`homepage` in this example is a placeholder project homepage and can be replaced with an existing project homepage or repository address. The current build tool requires this metadata in the root manifest, but it does not decide where the asset is installed from, and you do not need to run a Registry service at that address; local installation reads the built JSON directly. For the field, see the [shadcn Registry manifest](https://ui.shadcn.com/docs/registry/registry-json#homepage). The two file paths in the manifest mean:

- `path`: the publisher's asset source file, relative to the Registry package root. This example reads `packages/announcements-ui/registry/components/announcement-list.tsx`.
- `target`: where the file goes once installed into the target App or plugin. This example writes it to `client/components/announcement-list.tsx` in the target project.

So the publisher's `registry/` structure and the consumer's `client/` structure can differ. `target` describes the installation location; it does not mean the asset source belongs to some plugin's `client/` module.

`registryDependencies` declares other Registry items to install, such as `card` here; npm packages the component imports directly go into `dependencies` with compatible versions. Apart from React, which the target NocoBase App already has, this example uses no other npm packages directly. Multi-file blocks can use `registry:block` and list every file with its target location. For the fields, see the [shadcn Registry Item](https://ui.shadcn.com/docs/registry/registry-item-json).

### Define module dependency boundaries

Once installed, the asset lives in another App or plugin, so every import in it must hold on the consumer side:

- **Never access the plugin's internal files by relative path**, and never get around this boundary with private aliases that exist only on the publisher's side; this applies to components, Hooks, services, types and language resources alike.
- To use plugin capabilities, import through the public package entries the plugin declares, and declare compatible dependencies and registration prerequisites in the asset; alternatively, the consumer's page can pass them in through Props, callbacks or adapters.
- To use shadcn primitives, declare them through `registryDependencies` and use component aliases the recipient can resolve, such as `#components/ui/card` in this example.
- Files distributed together within one asset may use relative imports between them, but all of them must be listed in the manifest, and their relative positions must still be valid after installation.

This example receives data and text through Props and imports no internal files of the announcements plugin. Installing this list asset does not need the announcements backend; a page that connects the real announcements API still needs the corresponding server plugin.

### Build the source asset

In the **App root**, install the workspace dependencies and build the Registry package on its own:

```bash
pnpm install
pnpm --filter announcements-ui build
```

The filter selects the `announcements-ui` package by the name in its `package.json` and runs the build script in that package, writing the component source into `packages/announcements-ui/public/r/announcement-list.json`. It can be built and published independently, without building the plugin. For build options, see the [shadcn CLI](https://ui.shadcn.com/docs/cli#build).

During local development, hand the built JSON file directly to `shadcn add`; no static server is needed. What gets installed is a single asset file containing `files[].content`, not the source directory and not the `registry.json` used for building.

### Install and modify it in the target project

In the current **App root**, you can install the asset from the same workspace into the App directly:

```bash
pnpm exec shadcn add ./packages/announcements-ui/public/r/announcement-list.json
```

To install into **another App on the same machine**, run in the target App's root with a path relative to that directory. For example, with the two App directories side by side and the publisher's directory named `my-app`:

```bash
pnpm exec shadcn add ../my-app/packages/announcements-ui/public/r/announcement-list.json
```

To put the source into a plugin of the target App, use the plugin filter and give the **absolute path** of the asset file, so the relative path does not break when the filter changes the working directory. Replace with the actual package name and path:

```bash
pnpm --filter @my-company/app-plugin-dashboard exec shadcn add \
  /absolute/path/to/my-app/packages/announcements-ui/public/r/announcement-list.json
```

Choose the installation location by who owns the source. Installation by path still processes `registryDependencies`; missing primitives and npm dependencies may need network access. When an existing component is found, review the differences first and keep the project's customizations. After installing, check the actual files, dependencies and type declarations, then import `AnnouncementList` in the target page, passing data and the empty-state text. For the command's support for local paths, see the [shadcn CLI](https://ui.shadcn.com/docs/cli#add).

Agents can change the list source in the target project directly, for example turning the single column into a responsive grid or adding business actions. Source installed into the App is maintained by the App, and source installed into a plugin is maintained by that plugin. Upgrading the plugin package does not update this source automatically; when adopting a new version from the Registry, compare the differences and keep the project's customizations.

### Publish through an existing site when needed

When other machines need to get the asset by URL, deploy the contents of the generated `packages/announcements-ui/public/r/` under the `/r/` path of an existing static site, or reuse an existing service's static hosting. There is no need to develop a separate service for the Registry; just confirm that the asset URL returns JSON containing `files[].content`. See [Getting started with shadcn Registry](https://ui.shadcn.com/docs/registry/getting-started).

This step is optional. If a reachable asset URL already exists, the target App can use that URL instead of the local file path, for example:

```bash
pnpm exec shadcn add https://example.com/r/announcement-list.json
```

### Write Agent usage instructions

Write how to connect the asset into the Skill the plugin maintains; for its location and synchronization, see [Plugin Skills](write-plugin-skills.md). The instructions should cover how to build the asset locally and obtain its path, or the published URL, plus the scenarios it fits, its inputs, connection prerequisites, where it may be changed, and how to verify it. No website needs to be published first; for example, add the following local installation notes to the announcements Skill:

```markdown
## Compose an announcement list

Use the announcement-list source asset when the App needs an editable
announcement list. In the source App root, run
`pnpm --filter announcements-ui build`.

Locate packages/announcements-ui/public/r/announcement-list.json and resolve
its absolute path. From the receiving App root, run
`pnpm exec shadcn add /absolute/path/to/my-app/packages/announcements-ui/public/r/announcement-list.json`.
To install into a plugin, run the same add command with
`pnpm --filter <plugin-package> exec shadcn add <absolute-item-path>`.
No Registry server is needed. If the asset is already published, its URL
can be used instead of the local file path.

Render AnnouncementList with items containing id, title and content,
and pass translated emptyMessage text. The component does not fetch data.
Keep loading and error handling in the page. To use the announcements API,
first install and register the backend plugin that provides it.

Edit the installed source to change the layout or add business interactions.
Verify populated and empty lists, loading and request failures, translations,
and the receiving project's type checks and build.
```

The Skill should describe local or published assets that can actually be obtained, and APIs that are actually implemented. The Registry `docs` field suits short installation hints; the complete business integration process and combination examples belong in the Skill or the documents it references.

## Test and verify

First verify the component in the original plugin: announcement titles and content are correct, and the empty list uses the text passed in; the page still handles loading, failures and language switching. Reuse the existing tests and adjust where they live according to how the components are split; see [Testing and verification](testing-and-verification.md).

In the real application, check light and dark modes, different themes, narrow screens, keyboard focus and Portal content, and confirm the plugin did not change styles on other pages. When using a custom scope or an installed package, check the host's scan configuration and the built CSS; component tests and type checks cannot prove the styles are loaded.

Run the plugin's checks and the application's build in the App root:

```bash
pnpm --filter @nocobase/app-plugin-announcements typecheck
pnpm --filter @nocobase/app-plugin-announcements test
pnpm --filter @nocobase/app-plugin-announcements build
pnpm build
```

If you distributed source assets, also install, render and build them in a target project for real: confirm nothing references the publisher's private files, that the required components, dependencies and styles are all present, and that an Agent can make changes following the instructions. For assets meant to be installable into plugins, also verify the plugin's type declaration build; a successfully generated Registry JSON only shows that the distribution file exists.

For publishing the plugin package, see [Build and publish](publish-plugin.md). Source assets can be distributed on their own schedule or released alongside plugin versions, with their compatibility recorded in the notes.
