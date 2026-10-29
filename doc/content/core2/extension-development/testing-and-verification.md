---
title: Testing and verification
description: Distinguish plugin tests, App integration and delivery checks, and verify the behavior that actually affects users.
---

Passing plugin checks, registering successfully in the App and users actually being able to use the feature are three different results. Verification should follow the boundaries of the change: check the plugin itself first, then the behavior after it is connected to the App, and, when publishing, the contents of the package.

## Use an Agent

```text
Add behavior tests for this plugin, covering success, invalid input and access boundaries.
Use production implementations and real plugin declarations.
Distinguish component, API and App checks, run plugin checks and the App build,
and report which user workflows were and were not verified.
```

## Test locations

The generator creates tests and Vitest configuration according to the capabilities. Keep the split between the Node and jsdom environments; do not switch every test to a browser environment just to make one test pass.

| Directory | Environment and tools | What it verifies |
| --- | --- | --- |
| `tests/server/` | Node, `@nocobase/app-testing/server` | APIs, services and server integration |
| `tests/database/` | Node, the same Server testing entry | Migrations, metadata, and reads and writes on a real database |
| `tests/client/` | jsdom, `@nocobase/app-testing/client` | Components, translations, interactions and request contracts |
| `tests/cli/` | Node, `@nocobase/app-testing/cli` | Arguments, output, errors and command behavior |
| The App's browser tests | The App's existing browser test configuration | Sign-in, navigation, refresh and interaction with the real API |

`@nocobase/app-testing` goes in `devDependencies`. Check the generated test dependencies and the current version's public entries; it has no `/database` or `/playwright` export.

## Exercise production implementations

The tests in [Routes and HTTP APIs](server-apis.md) call `createRouter()` from the real `apiRoutes` to verify the 200 response, the 400 for invalid input and the API documentation; [Database resources and migrations](database-and-migrations.md) applies, rolls back and reapplies migrations through the real Migrator; [Command-line extensions](extend-command-line.md) uses `bindAppCommand()` and `runAppCommand()` to verify the uniform output.

All of these examples use the plugin's own implementation. Do not write another set of routes, services or data models inside the tests and then make that code's tests pass.

A Provider that only uses the container can accept a complete narrow interface, `{ container: ServiceContainer }`. Tests can then provide a real container instead of forcibly asserting an incomplete object to be the whole App. When authentication, the database or the lifecycle is needed, use the App's test fixture and register the real plugins.

## Client test boundaries

`renderWithApp()` registers the real Client plugin and provides services, the API client, routing and the language environment; do not wrap another `MemoryRouter` around it. When verifying a route tree, still render the components that correspond to the real route declarations; see [Pages, routes and menus](pages-and-menus.md#5-test-navigation).

Network requests can have their responses replaced at the boundary with `answerApi()`, but the request method and API-relative path must match. Do not return success no matter what is requested, which hides problems such as misspelled paths or extra requests.

Below is the structure of a request test for an existing page; replace `Page` and the plugin entry with the actual modules under test:

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

`answerApi()` turns exceptions thrown in the handler into HTTP 500, so put assertions about the request outside the handler, where a failed assertion cannot be swallowed by the page's error handling. Wait for asynchronously displayed content with `findBy...` or `waitFor()`; do not put interactions inside a `waitFor()` that may run repeatedly. To test loading states, control when the response completes rather than relying on fixed-length sleeps.

## Access and cleanup

Protected APIs must be tested separately in three cases: anonymous, signed in without permission, and with permission. Multi-tenant or per-record authorization features also need tests across users and records. Hiding a button on the Client does not mean the Server has protected the write.

Databases, temporary directories, subscriptions and application instances a test creates must be cleaned up by fixtures, and resources created directly are cleaned up with `finally`. Do not let tests connect to the everyday development database by default, and do not turn off error checks for the sake of "stable tests".

## Run the relevant scope

Taking `notice-api` as the example, run these commands in the App root:

```bash
pnpm --filter @nocobase/app-plugin-notice-api exec vitest run tests/server/routes.test.ts
pnpm --filter @nocobase/app-plugin-notice-api check
pnpm build
```

Run the related tests first to locate problems, then the plugin's `check` and the affected App checks. If migrations changed, run the needed database tests sequentially to keep integration suites from competing for resources; a pure text change does not need the whole repository's tests rerun.

If the plugin was created with `--no-install`, run `pnpm install` first. Do not count a success under `--passWithNoTests` as existing test coverage; check which files and cases actually ran in the output.

## Before delivery

| Change | Also confirm |
| --- | --- |
| Client pages | They open after sign-in, and direct links, refresh and back and forward all work |
| Server APIs | The real prefix under the App, authentication and authorization, the error format and the API documentation |
| Data migrations | Installation on an empty database, upgrading old data, and checksums of the build output |
| CLI | The commands after App registration, and the commands in the deployment output |
| Public exports or publishing | They can be used from the public entries; the tarball contains dist, resources and Skills |

When reporting, state the exact commands and results and the boundaries not covered, for example "component and route unit tests passed and the App build passed; the browser flow after a real sign-in has not run". `plugin inspect` only checks static registration information and cannot replace tests of these behaviors.
