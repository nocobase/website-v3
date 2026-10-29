---
title: Components and styles
description: Organize plugin components, integrate host styles and themes, expose components and optionally distribute UI source assets.
---

When developing applications and plugins, organize frontend components around the interface you need. **Use shadcn for UI primitives**, and follow the host application’s conventions for styles and themes. When composing modular interfaces, first consult the components and blocks in the [NocoBase UI Library](https://ui.nocobase.com/).

The NocoBase UI Library is NocoBase's UI source asset library. It uses shadcn UI Registry to distribute components and blocks for Agents to obtain, modify and compose. Its website provides component examples and installation instructions.

For additional components or blocks that you want to **publish as source assets for Agents to obtain, modify and compose**, distribute them through shadcn UI Registry. Publication depends on how you want to deliver the source. Reusing a component inside a plugin, or exposing it through a public package entry, does not require a Registry.

This article continues the announcements example from [Write your first plugin](write-your-first-plugin.md). Build a list component and connect it to the page, then optionally package it as an independent source asset and install it in another app or plugin by local path. Use existing static hosting when distribution across machines is needed.

## Use an Agent

For an existing announcements plugin, describe the task like this:

```prompt
Extract the announcements plugin's list into a standalone component.
Use shadcn primitives and first consult the NocoBase UI Library's components and blocks at https://ui.nocobase.com/.
Pass announcement data and empty-state text to the list. Keep data loading
and error handling in the page. Preserve routes, navigation and translations,
and verify populated and empty lists and the plugin build.
```

The manual steps follow. **Unless noted otherwise, run commands from the App root. Paths in the component development sections are relative to `packages/app-plugin-announcements/`; the source distribution section specifies paths in the independent Registry package.**

## Organize components

Start with a working announcements plugin. Its page, API, translations and registration are covered in [Write your first plugin](write-your-first-plugin.md). Add `client/components/announcement-list.tsx`:

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

This is one possible organization. Add domain directories, extract Hooks or change component boundaries as needed, keeping imports and build configuration aligned.

## Use shadcn and the NocoBase UI Library

Install the shadcn Card used in this example:

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add card
```

The creation tool generates `components.json`, a stylesheet entry and package-local aliases for plugins with Client code. The command runs in the selected plugin, so it writes to that plugin's `client/components/ui/`. Review differences when files already exist and preserve your changes.

For page containers, headers and other business components, first consult the [NocoBase UI Library](https://ui.nocobase.com/). For example, the first-plugin tutorial installs:

```bash
pnpm --filter @nocobase/app-plugin-announcements exec shadcn add \
  @nocobase/page-container @nocobase/page-header
```

Do not repeat this installation if the files already exist. The `@nocobase` entry in `components.json` points to the NocoBase UI Library's source distribution endpoint. For an older plugin missing the entry, merge this into its existing `registries` configuration:

```json
{
  "registries": {
    "@nocobase": "https://ui.nocobase.com/r/{name}.json"
  }
}
```

Review `package.json` after installation: declare client runtime dependencies as `peerDependencies`, following plugin conventions, preserve suitable version ranges, and run `pnpm install`. Keep dependencies the server still imports directly in their appropriate section. Package aliases and published mappings are covered in [Plugin structure](plugin-structure.md#ui-components-and-source-ownership).

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

The component accepts data and text, making it easy to compose in a page or install independently as a source asset. Its data interface describes only what it needs, avoiding a dependency on the plugin's private `shared/` files. The page can still pass its existing `Announcement[]`.

Plugin builds emit type declarations, so the example explicitly types its Props and return value. After installing Card, also check `client/components/ui/card.tsx`: add `: React.ReactElement` to any missing return types on `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent` and `CardFooter`, preserving their parameters and implementations. Without these annotations, the plugin's `isolatedDeclarations` check reports `TS9007`. Other newly installed primitives must also satisfy the plugin's declaration-generation requirements.

### Connect the page

Add this import to `client/pages/announcements.tsx`:

```tsx
import { AnnouncementList } from '#components/announcement-list';
```

Keep the page's `useApiClient()`, `useTranslation()` and request logic. Replace its `return` with:

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

Here the page handles requests, state and translations while the list handles presentation. Other components can use client services or Hooks directly when appropriate. See [Client services](client-services.md) for plugin integration and [ServiceProvider](service-provider.md) for shared container mechanisms.

## Styles and theme integration

### Separate generation configuration from runtime styles

The plugin's `components.json` points `tailwind.css` at `client/styles.css`. The scaffold uses this file for shadcn component generation. It imports Tailwind, animation and shadcn styles and explicitly leaves theme tokens to the host App. The generated `client/index.ts` only exports the plugin factory; it does not import this CSS file.

The default App imports its own `client/styles.css` from `client/index.tsx`. That stylesheet loads themes and generates utilities. Plugin components use semantic classes such as `bg-card` and `text-muted-foreground`, with the final CSS produced by the App's client build. The plugin's TypeScript build emits JavaScript and declarations, not a complete application stylesheet.

Adding a rule to the plugin's generation stylesheet therefore does not make it appear in the page. Do not import the entire generation stylesheet, including its Tailwind entry, into the App again just to load one rule.

### Include plugin components in the host build scan

The default template loads its scan configuration through `@config "../tailwind.config.mjs"` in the App stylesheet. At the Core baseline checked for this article, `7fb8311`, that configuration resolves real paths for `@nocobase/app-plugin-*` packages and scans directories including source `client/` and published `dist/client/`, accounting for pnpm symlinks and compiled plugins.

For a custom scope such as `@my-company`, explicitly include the package in the receiving App's scan configuration, preserve existing entries and cover both local source and installed compiled directories. A renamed package is not automatically covered by the default `@nocobase` rule; wildcard paths across symlinks alone do not prove that scanning works.

Write complete static utility strings. For variants, use mappings containing full class names rather than assembling values such as `bg-${color}` that the build cannot discover directly. After checking workspace development, also verify an App built with the published package installed.

### Use host theme tokens and scope custom rules

Use semantic classes such as `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground` and `border-border`; colors, radii and fonts come from the host theme. The announcement list already uses `text-muted-foreground` and needs no separate palette. The App owns theme presets and color-scheme selection; see [Themes and styles](../developing-apps/themes-and-styles.md).

Scope custom CSS with plugin-specific classes or attributes instead of overriding global `body`, every `button` or `:root`. Portal content may render outside the page root, so apply the scope class to the actual overlay content when needed. Do not reinitialize shadcn or mount a second theme Provider to change the host appearance.

Maintain custom runtime CSS as a separate resource and document whether a plugin client module or the App stylesheet imports it. Distribution must account for resource copying, public exports, package file inclusion and the consuming bundler's loader; `tsc` does not automatically copy CSS. Explain any required consumer import so workspace-only files do not disappear from the published package. The announcement-list example in this article needs no additional CSS resource.

## Expose components

Internal components need no new package export. To let Apps import a component from the package, add a public entry and keep source exports and compiled `publishConfig.exports` mappings aligned; see [Plugin declarations and public exports](plugin-declarations.md#public-exports). Importing a component does not automatically register plugin routes, translations or services.

Document Props, public types, required styles and runtime prerequisites. If a component depends on plugin services or translations, identify which entry the consumer must register. Exported components should explicitly bind their plugin translation namespace; see [Client localization](localization.md). See [React Context and Providers](react-context-and-providers.md) for plugin integration and [React Providers and the component tree](../framework/runtime/react-providers.md) for mounting mechanisms.

## Optionally distribute UI source assets

To let Agents bring the list into a target project, reshape its layout, add actions or combine it with other blocks, distribute it through shadcn UI Registry. A plugin can provide both a package with maintained public runtime capabilities and Registry assets with editable source.

**A Registry asset is an independent source module.** This example adds `announcements-ui/` under the App's `packages/`, alongside `app-plugin-announcements/`, with its own manifests and build configuration. Add its output directly by local path; deploy it to a static site only when URL distribution is needed. Apps and plugins install the assets and integrate the source in their own projects. One Registry package can provide assets for several plugins or business scenarios.

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

Create the Registry package's source directory from the App root:

```bash
mkdir -p packages/announcements-ui/registry/components
```

Save the [announcement list implementation above](#implement-the-announcement-list) as `packages/announcements-ui/registry/components/announcement-list.tsx`. It accepts data and text, so it can be distributed independently. The relevant directories are:

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

Confirm the App's `pnpm-workspace.yaml` includes `packages/*`, preserving its existing configuration. The packages share a workspace, but Registry assets must still avoid relative imports into the neighboring plugin's internals.

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

This example pins the verified build tool version. The `check` script validates the manifest and source files through a build and lets this package participate in App workspace checks; component types and rendering still need validation in a consumer. This `package.json` manages Registry package tooling. Declare npm packages and other Registry items needed by consumers separately in the asset manifest below. The Registry package needs no registration in the App's Client, Server or CLI plugin lists.

Maintain source intended for publication in this independent package. The original plugin's `client/` component and installed copies in other projects can be customized independently. To adopt asset updates, compare and merge changes, or review the differences before reinstalling.

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

The example `homepage` is a placeholder for a project homepage; use an existing project or repository URL. The current build tool requires this root-manifest metadata, but it does not determine the installation address or require a Registry service at that URL. Local Add reads the built JSON file directly. See the [shadcn Registry manifest](https://ui.shadcn.com/docs/registry/registry-json#homepage) for the field. The two file paths have different roles:

- `path` identifies the publisher's asset source, relative to the Registry package root. This example reads `packages/announcements-ui/registry/components/announcement-list.tsx`.
- `target` identifies where to write the file in the receiving App or plugin. This example installs it at `client/components/announcement-list.tsx` in that project.

The publisher's `registry/` layout can therefore differ from the consumer's `client/` layout. The `target` describes the installation destination; it does not make the asset source part of a plugin's `client/` module.

`registryDependencies` declares other Registry items to install, such as `card`. Put directly imported npm packages in `dependencies` with compatible version ranges. This component directly imports only React, which is already present in the target NocoBase App. A multi-file block can use `registry:block` and list every file and target. See [shadcn Registry Item](https://ui.shadcn.com/docs/registry/registry-item-json) for the fields.

### Define module dependency boundaries

An asset will be installed in another App or plugin, so every import must work in the receiving project:

- **Do not import plugin internals through relative paths**, or bypass this boundary with private aliases available only to the publisher. This applies to components, Hooks, services, types and translations.
- Access plugin capabilities through declared public package entries, specifying compatible dependencies and registration prerequisites. Alternatively, let the consuming page supply Props, callbacks or adapters.
- Declare shadcn primitives in `registryDependencies` and use aliases the receiving project can resolve, such as `#components/ui/card` in this example.
- Files distributed together within one asset may use relative imports, provided every file is listed in the manifest and their relative positions remain valid after installation.

This list receives data and text through Props and imports no announcements plugin internals. Installing the asset does not require the announcements backend; a page fetching actual announcements still needs the corresponding Server plugin.

### Build the source asset

From the **App root**, install workspace dependencies and build only the Registry package:

```bash
pnpm install
pnpm --filter announcements-ui build
```

The filter selects `announcements-ui` by its `package.json` name and runs the build script in that package, embedding component source in `packages/announcements-ui/public/r/announcement-list.json`. It builds and publishes independently, without running a plugin build. See [shadcn CLI](https://ui.shadcn.com/docs/cli#build) for build options.

For local development, pass the generated JSON file directly to `shadcn add`, with no static server to start. Install the individual asset file containing `files[].content`, rather than the source directory or the `registry.json` build manifest.

### Install and modify it in the target project

From the current **App root**, install the asset from the same workspace into the App:

```bash
pnpm exec shadcn add ./packages/announcements-ui/public/r/announcement-list.json
```

To install into **another App on the same machine**, run from the receiving App root with a path relative to that directory. For example, with sibling App directories and a publisher named `my-app`:

```bash
pnpm exec shadcn add ../my-app/packages/announcements-ui/public/r/announcement-list.json
```

To place the source in a plugin of the target App, use its package filter and an **absolute path** to the asset. This avoids changing the meaning of a relative path when the filter changes the working directory. Replace the package name and path:

```bash
pnpm --filter @my-company/app-plugin-dashboard exec shadcn add \
  /absolute/path/to/my-app/packages/announcements-ui/public/r/announcement-list.json
```

Choose the installation location according to source ownership. Local-path installation still processes `registryDependencies`; missing primitives and npm dependencies may require network access. Review differences and preserve project customizations when files already exist. Inspect installed files, dependencies and declaration types, then import `AnnouncementList` in the target page and pass data and empty-state text. See [shadcn CLI](https://ui.shadcn.com/docs/cli#add) for local-path support.

An Agent can modify the installed source directly, for example changing a single column to a responsive grid or adding business actions. The App maintains source installed into the App; the plugin maintains source installed into the plugin. Upgrading a plugin package does not update this copy. When adopting a newer Registry asset, compare changes and preserve the project's customizations.

### Publish through an existing site when needed

When other machines need to fetch the asset by URL, deploy the generated `packages/announcements-ui/public/r/` contents under `/r/` on an existing static site, or reuse an existing service's static-file hosting. A Registry does not need a dedicated service: confirm that the asset URL returns JSON containing `files[].content`. See [shadcn Registry getting started](https://ui.shadcn.com/docs/registry/getting-started).

This step is optional. If an asset URL is already available, the receiving App can use it in place of the local file path, for example:

```bash
pnpm exec shadcn add https://example.com/r/announcement-list.json
```

### Write Agent usage instructions

Describe asset integration in the plugin's maintained Skill; see [Plugin Skills](write-plugin-skills.md) for its location and synchronization. Explain how to build and locate the local asset, or provide its published URL, along with use cases, inputs, prerequisites, customization points and verification. Publishing a website is not a prerequisite. For example, add these local-installation instructions to the announcements Skill:

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

Skills describe locally available or published assets and APIs that exist. The Registry's `docs` field is suitable for brief installation notes. Put full business integration steps and composition examples in the Skill or its referenced documentation.

## Test and verify

First verify the component in the original plugin: titles and content render correctly and an empty list uses the supplied text. The page must still handle loading, failures and language switching. Keep existing tests and adjust their locations for the extracted component; see [Testing and verification](testing-and-verification.md).

Check light and dark modes, theme presets, narrow screens, keyboard focus and Portal content in the actual App. Verify the plugin does not change other pages. For custom scopes and installed packages, inspect host scanning and built CSS; component tests and type checks do not prove styles loaded.

Run the plugin checks and App build from the App root:

```bash
pnpm --filter @nocobase/app-plugin-announcements typecheck
pnpm --filter @nocobase/app-plugin-announcements test
pnpm --filter @nocobase/app-plugin-announcements build
pnpm build
```

If you distribute a source asset, also install, render and build it in a target project. Confirm it imports no private publisher files, has all required components, dependencies and styles, and lets an Agent complete the documented customization. Assets intended for plugins must also pass a plugin declaration build. Generating Registry JSON only verifies that distribution files were produced.

For package publication, see [Build and publish](publish-plugin.md). Source asset releases can be independent or accompany plugin versions; document the compatibility between them.
