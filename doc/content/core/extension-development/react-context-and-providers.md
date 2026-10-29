---
title: React Context and Providers
description: Define plugin display preferences, contribute a React Provider and verify shared state and mounting scope.
---

This article gives announcement pages a compact-display preference, connecting `contexts.ts`, a Provider component and `react-providers/`. React owns the state; no database, API or ServiceProvider is needed. General Context usage belongs in [UI components and interactions](../developing-apps/pages-and-interactions.md); mounting and ordering belong in [React Provider registration](../framework/runtime/react-providers.md).

## Prerequisites and files

Use `@nocobase/app-plugin-announcements` from [Write your first plugin](write-your-first-plugin.md); only its Client entry is required. File paths are relative to the plugin root and commands run from the App root. Merge existing files and declarations, preserving pages, locales and other contributions.

A new plugin can select `client.react-providers`. An existing plugin can add these files without being recreated. Keep `react` as a compatible peer and use the scaffold's jsdom test configuration.

## Use an Agent

```prompt
Add a compact-display preference shared through React Context in the announcements plugin.
Contribute its Provider through reactProviders and preserve existing routes and locales.
Do not persist this example's preference; refresh restores its default.
Verify updates across consumers by rendering the real Client plugin declaration,
not by directly calling a component function that uses Hooks.
```

## Define the context

Add or merge `client/contexts.ts`. Report a missing Provider explicitly instead of hiding integration mistakes with no-op defaults:

```ts
import { createContext, useContext, type Context } from 'react';

export interface AnnouncementDisplay {
  readonly compact: boolean;
  readonly setCompact: (value: boolean) => void;
}
export const AnnouncementDisplayContext: Context<AnnouncementDisplay | undefined> =
  createContext<AnnouncementDisplay | undefined>(undefined);

export function useAnnouncementDisplay(): AnnouncementDisplay {
  const value = useContext(AnnouncementDisplayContext);
  if (!value) throw new Error('AnnouncementDisplayProvider is required.');
  return value;
}
```

## Implement the Provider

Maintain state in `client/components/provider.tsx`. Consumers of this Provider instance share its value. Separate Apps or additionally nested Providers own separate state.

```tsx
import { useMemo, useState, type PropsWithChildren, type ReactElement } from 'react';
import { AnnouncementDisplayContext, type AnnouncementDisplay } from '../contexts.js';

export function AnnouncementDisplayProvider({ children }: PropsWithChildren): ReactElement {
  const [compact, setCompact] = useState(false);
  const value = useMemo<AnnouncementDisplay>(
    () => ({ compact, setCompact }),
    [compact],
  );
  return (
    <AnnouncementDisplayContext.Provider value={value}>
      {children}
    </AnnouncementDisplayContext.Provider>
  );
}
```

This example owns no external resources and needs no empty Effect. If adding browser subscriptions, return cleanup from the Effect and support development mounting checks. State is not shared across browsers and resets on refresh or Provider remount.

## Declare and integrate the plugin contribution

Aggregate React Providers in `client/react-providers/index.ts`:

```ts
import {
  defineClientReactProviders,
  type AppClientReactProviderDefinition,
} from '@nocobase/app-client/plugins';
import { AnnouncementDisplayProvider } from '../components/provider.js';

const reactProviders: readonly AppClientReactProviderDefinition[] = defineClientReactProviders([
  {
    name: 'announcements-display',
    layer: 'extension',
    component: AnnouncementDisplayProvider,
  },
]);
export default reactProviders;
```

Use a stable contribution name such as `announcements-display`, not a package path containing `@` or `/`. The runtime tracks plugin ownership separately. Declare ordering only when the Provider actually depends on another context, following the framework rules.

Import this aggregate in `client/plugin.ts` and add `reactProviders` to its existing `defineClientPlugin()` declaration. Preserve `packageName`, `routes`, `locales` and existing services. Keep the factory export in `client/index.ts`. Registering that factory in the App's `client/plugins.ts` mounts the Provider with the application tree.

Components read `compact` and `setCompact` through `useAnnouncementDisplay()`. The announcement page can pass `compact` to its list and call `setCompact()` from existing shadcn controls, using plugin translations. Do not manually wrap the page in another copy of the Provider, which creates separate state.

To expose the Hook to Apps or other plugins, add this named export to `client/index.ts` while preserving its default export:

```ts
export { useAnnouncementDisplay } from './contexts.js';
```

Importing the Hook does not mount its Provider; the consumer must register the plugin. See [Plugin declarations and public exports](plugin-declarations.md).

## Verify shared state and integration

Replace any scaffold test that directly calls the Provider function: it now uses Hooks and must be rendered through React. Save this as `tests/client/react-provider.test.tsx`. Native buttons here are test consumers, not production UI examples:

```tsx
import { fireEvent, screen } from '@testing-library/react';
import { renderWithApp } from '@nocobase/app-testing/client';
import type { ReactElement } from 'react';
import { expect, it } from 'vitest';
import plugin from '../../client/index.js';
import { useAnnouncementDisplay } from '../../client/contexts.js';

function Consumer({ id }: { id: string }): ReactElement {
  const { compact, setCompact } = useAnnouncementDisplay();
  return <button onClick={() => setCompact(!compact)}>{id}:{String(compact)}</button>;
}

it('shares display state through the registered plugin Provider', async () => {
  const view = await renderWithApp(<><Consumer id="a" /><Consumer id="b" /></>, {
    plugins: [plugin()],
  });
  fireEvent.click(screen.getByText('a:false'));
  expect(screen.getByText('a:true')).toBeDefined();
  expect(screen.getByText('b:true')).toBeDefined();
  view.unmount();
});
```

Also verify missing-registration failures, defaults after remount and cleanup for any added subscriptions. `renderWithApp()` already provides application and router contexts; do not add another Router.

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

Run registration commands when adding or checking integration; preserve existing entries. Tests establish context integration and state updates. Verify density, navigation and theme behavior in the actual page as well.
