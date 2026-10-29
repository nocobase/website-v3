---
title: Testing and verification
description: Separate plugin tests, App integration and delivery checks around observable behavior.
---

Plugin checks, App registration and a working user flow are different results. Verify the boundaries affected by the change: the plugin first, then behavior in the App, and package contents when publishing.

## Use an Agent

```text
Add behavior tests for this plugin, covering success, invalid input and access boundaries.
Use production implementations and real plugin declarations.
Distinguish component, API and App checks, run plugin checks and the App build,
and report which user workflows were and were not verified.
```

## Test locations

The generator supplies tests and Vitest configuration for the selected capabilities. Preserve Node and jsdom boundaries instead of moving every test to a browser environment to fix one case.

| Directory | Environment and tools | Coverage |
| --- | --- | --- |
| `tests/server/` | Node, `@nocobase/app-testing/server` | APIs, services and Server integration |
| `tests/database/` | Node, the same Server testing entry | Migrations, metadata and real database operations |
| `tests/client/` | jsdom, `@nocobase/app-testing/client` | Components, translations, interactions and request contracts |
| `tests/cli/` | Node, `@nocobase/app-testing/cli` | Arguments, output, errors and command behavior |
| App browser tests | The App’s existing browser configuration | Sign-in, navigation, reloads and real API interaction |

Declare `@nocobase/app-testing` in `devDependencies`. Check the generated dependencies and installed public exports: it has no `/database` or `/playwright` entry.

## Exercise production implementations

[Routes and HTTP APIs](server-apis.md) calls the real contribution’s `createRouter()` to check success, invalid input and API documentation. [Database resources and migrations](database-and-migrations.md) uses the real Migrator to apply, roll back and reapply. [Command-line extensions](extend-command-line.md) uses `bindAppCommand()` and `runAppCommand()` to verify command output.

Do not reimplement routes, services or models inside tests and then test that duplicate implementation.

A Provider using only a container can accept a complete narrow interface `{ container: ServiceContainer }`, allowing a real container fixture without casting an incomplete object to the whole App. For authentication, databases or lifecycle, use an App fixture and register the production plugins.

## Client test boundaries

`renderWithApp()` registers real Client plugins and supplies services, the API client, routing and localization. Do not add another `MemoryRouter`. To exercise a route tree, still render the components from its actual declarations; see [Pages, routes and menus](pages-and-menus.md#5-test-navigation).

Use `answerApi()` to replace responses at the network boundary. Match both method and API-relative path; returning success for every request hides misspelled paths and unexpected calls.

This is a test pattern for an existing page; replace `Page` and the plugin factory with the actual modules:

```tsx
const calls: { method: string; path: string }[] = [];
await renderWithApp(<Page />, {
  plugins: [plugin()],
  locale: 'zh-CN',
  fetch: answerApi((call) => {
    calls.push({ method: call.method, path: call.path });
    if (call.method === 'GET' && call.path === 'announcements') {
      return { data: [], meta: { total: 0 } };
    }
    return new Response(null, { status: 404 });
  }),
});
expect(await screen.findByText('暂无公告。')).toBeInTheDocument();
expect(calls).toEqual([{ method: 'GET', path: 'announcements' }]);
```

`answerApi()` turns handler exceptions into HTTP 500 responses. Keep assertions outside the handler so the page’s error UI cannot swallow an assertion failure. Wait for asynchronous UI with `findBy...` or `waitFor()`, but keep interactions outside retrying `waitFor()` callbacks. Control response completion to test loading instead of using fixed sleeps.

## Access and cleanup

Test anonymous, signed-in but denied, and authorized callers separately. Tenant- or record-scoped features also need cross-user and cross-record cases. Hiding a Client button does not protect a Server write.

Fixtures should clean up owned databases, temporary directories, subscriptions and App instances. Use `finally` for directly created resources. Do not point tests at the ordinary development database or disable error checks to make a suite pass.

## Run the relevant scope

For `notice-api`, run from the App root:

```bash
pnpm --filter @nocobase/app-plugin-notice-api exec vitest run tests/server/routes.test.ts
pnpm --filter @nocobase/app-plugin-notice-api check
pnpm build
```

Run focused tests first, then the plugin’s `check` and affected App checks. Run database integration suites sequentially when migrations change. A copy-only edit does not need the whole repository’s test suite.

If creation used `--no-install`, install first. A successful `--passWithNoTests` run is not coverage: inspect the actual files and cases executed.

## Before delivery

| Change | Additional verification |
| --- | --- |
| Client pages | Signed-in access, direct URLs, reload and browser history |
| Server APIs | App mount prefixes, authentication, authorization, errors and API docs |
| Migrations | Fresh installs, old-data upgrades and compiled checksums |
| CLI | Registered App commands and deployment commands |
| Public exports or publication | Consumption through public entries; dist, resources and Skills in the tarball |

Report exact commands and outcomes, including remaining boundaries. For example: component and router tests passed and the App built, but the signed-in browser workflow has not run. `plugin inspect` checks static registration only and cannot replace behavioral verification.
