---
title: React Context and Providers
description: Define a display preference context in a plugin, connect it to the application's component tree through reactProviders, and verify the shared state and mounting scope.
---

This guide gives the announcements page a "compact display" preference, focusing on how `contexts.ts`, the Provider component and `react-providers/` connect. The state lives in the React tree and needs no database, HTTP API or ServiceProvider. For general use of React Context, see [UI components and interactions](../developing-apps/pages-and-interactions.md); for the mounting and ordering mechanism, see [React Provider registration and mounting](../framework/runtime/react-providers.md).

## Prerequisites and files

This guide continues with `@nocobase/app-plugin-announcements` from [Write your first plugin](write-your-first-plugin.md) and needs only the Client entry. File paths below are relative to the plugin root, and commands run in the App root. If files or declarations with the same names already exist, merge the changes and keep the pages, language resources and other contributions.

When creating a new plugin you can choose `client.react-providers`; for an existing plugin, add the files described below without recreating it. `react` uses the compatible peer dependency the plugin conventions specify, and tests reuse the scaffold's jsdom configuration.

## Use an Agent

```text
Add a compact-display preference shared through React Context in the announcements plugin.
Contribute its Provider through reactProviders and preserve existing routes and locales.
Do not persist this example's preference; refresh restores its default.
Verify updates across consumers by rendering the real Client plugin declaration,
not by directly calling a component function that uses Hooks.
```

## Define the context

Add or merge `client/contexts.ts`. Throw a clear error when the Provider is missing, rather than hiding a missed connection behind a default empty function:

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

Keep the state in `client/components/provider.tsx`. Consumers under the same Provider instance share one value; different application instances, or an extra nested Provider, each keep their own state.

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

This example has no external resources, so no empty Effect is needed. When you need to subscribe to browser events, return a cleanup function from the Effect and make it tolerate the repeated mounting checks of the development environment. This state is not shared across browsers, and it goes back to the default after a page refresh or when the Provider remounts.

## Declare and integrate the plugin contribution

`client/react-providers/index.ts` gathers the plugin's React Providers:

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

`name` is a stable contribution name; use a short name such as `announcements-display`, and never use a package path containing `@` or `/` as the name, since the runtime records the owning plugin separately. Declare an ordering relationship following the framework's rules only when the Provider really depends on another context.

Import this gathering file in `client/plugin.ts` and add `reactProviders` to the existing `defineClientPlugin()` declaration, keeping `packageName`, `routes`, `locales` and any existing service registrations. `client/index.ts` keeps exporting the plugin factory; once the App registers this factory in `client/plugins.ts`, the Provider mounts with the application's component tree.

Components read `compact` and `setCompact` through `useAnnouncementDisplay()`. The existing announcements page can pass `compact` to the list component and call `setCompact()` from an existing shadcn control, with text from the plugin's language resources. Do not wrap the page manually in another copy of the same Provider, or you will get a second, separate state.

If applications or other plugins should use this Hook, add a named export in `client/index.ts` while keeping the default export:

```ts
export { useAnnouncementDisplay } from './contexts.js';
```

Importing the Hook does not mount the Provider automatically; consumers still need to register the plugin. For the public entry conventions, see [Plugin declarations and public exports](plugin-declarations.md).

## Verify shared state and integration

Replace the scaffold's test that calls the Provider function directly: the Provider now contains a Hook and must be rendered through React. Save the following as `tests/client/react-provider.test.tsx`; the native button is only a test consumer, not an example of business UI:

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

Also check failure when registration is missing, the default value after remounting, and subscription cleanup for any Effect you add. `renderWithApp()` already provides the application and routing environment, so do not wrap another Router around it.

```bash
pnpm --filter @nocobase/app-plugin-announcements check
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --dry-run
pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install
pnpm build
```

Run the registration command only when you need to add or check the connection, and keep existing registration entries. The tests prove that the context is connected and the state changes; display density, navigation and theme effects on the real page still need to be checked separately.
