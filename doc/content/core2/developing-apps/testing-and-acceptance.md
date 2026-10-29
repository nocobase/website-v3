---
title: Testing and acceptance
description: Organize client, server, database, CLI and browser tests by application directory, then complete build checks and functional acceptance.
---

An application's tests are organized around the change you actually make: component tests verify interactions, server tests verify APIs and permissions, database tests verify schemas and records, command tests verify CLI behavior, and browser tests verify complete user flows. First choose the test layer that can cover the problem, then add the application integration tests and manual acceptance checks that are needed.

This guide is based on the default application template's test configuration. Existing projects should keep their own configuration, aliases and setup files; the business files used by the examples must first be created as described in the linked guides.

## Test directories and commands

Tests live together in `tests/` at the application root, mirroring the responsibilities of the source code. Create directories as needed, and name test files `*.test.ts` or `*.test.tsx`:

```tree
my-app/
├── tests/
│   ├── client/          # Pages, components, Hooks and client services
│   ├── server/          # HTTP APIs, business services and permissions
│   ├── database/        # Migrations, Seeds, queries and transactions
│   ├── cli/             # Application commands
│   ├── project/         # Project configuration and build artifacts
│   ├── fixtures/        # Test data and fixture applications
│   ├── helpers/         # Shared test helpers
│   ├── setup/           # Test environment setup
│   └── playwright/      # Browser tests (optional)
├── vitest.config.ts
└── playwright.config.ts
```

The default template's Vitest configuration has two projects: `client`, which uses a jsdom-based application environment and discovers tests under `tests/client/`; and `node`, which discovers tests under `tests/server/`, `tests/database/`, `tests/cli/` and `tests/project/`. Browser tests run separately with Playwright.

In the application root, run:

```bash
pnpm test
pnpm test --project client
pnpm test --project node tests/database/app-statuses.test.ts
pnpm test:watch
pnpm test:coverage
```

The third command runs the database test created later in this guide. Other files can be selected by their actual paths too, so there is no need for a separate configuration for each kind of test.

`@nocobase/app-testing` provides these public entries:

| Entry | Main tools | Purpose |
| --- | --- | --- |
| `/client` | `renderWithApp()`, `answerApi()` | Render components that depend on application services, and control HTTP responses |
| `/server` | `createAppTest()`, `createTestApp()` | Start the application on an isolated database to verify real APIs and plugin integration |
| `/server` | `createDatabaseTest()`, `describeMigration()` | Verify database behavior and migrations without starting the full application |
| `/cli` | `bindAppCommand()`, `runAppCommand()`, `createTestAppConfig()`, `bindTestAppCommand()` | Run commands, capture their output, and provide isolated application configuration when needed |

There is no `/database` or `/playwright` entry; browser tests use `@playwright/test` directly.

> [!NOTE]
> The default template lets Vitest exit normally when it finds no tests, and `test:e2e` also passes `--pass-with-no-tests`. So a successful exit does not mean the feature has passed acceptance: check the file names, test counts and skipped cases in the test report. CI that must actually run tests can turn these options off.

## Client tests

Tests go in `tests/client/` and import the real page, component, Hook or service. When the component under test depends on application services, use `renderWithApp()` to provide the client runtime, routing, API Client and localization, and `answerApi()` to control API responses.

Prepare assertions based on how the page actually behaves:

| Scenario | What to verify |
| --- | --- |
| Loading and empty data | The loading state is visible; empty data shows a clear message and not the previous result |
| Successful submission | The request method, path and data are correct; the success feedback and list update are correct |
| Failed request and retry | The error message is understandable; retrying clears the old error, and interaction recovers after success |
| Submission still pending | The button is disabled or repeated requests are prevented; success is not shown too early |
| Routes and filters | URL parameters, pagination and going back stay consistent |
| Permissions and sessions | Entries are handled correctly without permission; an expired session prompts the user to sign in again |
| Localization | Real language resources are used, checking at least the main languages the application supports |

Keep the real `useApiClient()`, translation and routing logic, and supply responses only at the HTTP boundary. `answerApi()` receives the path after `/api/`, such as `tasks`; return a `Response` when you need a specific status code. Make unknown requests fail explicitly, so that a wrong path is not hidden by every request succeeding.

Call `renderWithApp()` inside the test; it shuts down the client application when the test ends. Keep the template's React test environment and DOM cleanup, do not wrap another Router around it, and do not turn off strict translation checks to get around missing text. Put actions such as clicks outside `waitFor()`, and use `waitFor()` only for assertions.

For client business services, first construct an instance directly to verify its methods, then check registration, subscriptions and resource release with a real container. To verify a React Provider, import the actual component; that is a different layer of integration from a ServiceProvider in the service container. See [Client business services](client-business-services.md) and [UI components and interactions](pages-and-interactions.md).

For a complete example of requests, retries and preventing duplicate submissions, see the [client testing example](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/client/page.md). The default template's `tests/client/page-harness.test.tsx` also demonstrates permissions, date formatting and routed dialogs. Component tests with controlled responses do not prove that server-side authorization or database persistence are correct; keep verifying those with the real application tests below.

## Server tests

Calculations and branches in service methods can be tested directly; when plugin registration, sign-in, permissions, migrations or API middleware are involved, start the real application with `createAppTest()`.

The example below demonstrates the test fixture with the users API that ships with the default template. It assumes the application keeps the authentication, authorization and users plugins and the default administrator policy. Create `tests/server/users.test.ts`:

```ts
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createAppTest } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
  },
});

test('rejects an anonymous request', async ({ request }) => {
  expect((await request('/users')).status).toBe(401);
});

test('reads the administrator after sign-in', async ({ testApp }) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch(
    `/users?q=${encodeURIComponent(admin.user.email)}`,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    data: expect.arrayContaining([
      expect.objectContaining({ id: admin.user.id }),
    ]),
  });
});
```

```bash
pnpm test --project node tests/server/users.test.ts
```

The secret and the administrator in the test configuration are only for isolated tests. The fixture installs the migrations and Seeds of the application and its plugins, provides temporary storage, and shuts the application down automatically afterwards. Requests run in process without listening on an HTTP port; `request('/users')` is handed to the application's API routes.

By default, `createAppTest()` shares one application and database within a file. To install separately for each test, set `scope: 'test'`; in shared mode, each test should use its own records and not depend on execution order. When the application owns several connections, list them all in `connections`, such as `['main', 'analytics']`; connections that are not listed keep the application's configuration.

These two tests only demonstrate the sign-in boundary. When testing your own business APIs, switch to the real routes and cover:

- Three identities: not signed in, signed in but not authorized, and authorized; public APIs are judged by their own access policy.
- Branches such as invalid parameters, missing objects and disallowed states, and the error structure actually returned.
- Reading again after a write to confirm the record and related data were saved; after a failure, checking that nothing was partially written.
- Lists, details and statistics all respecting the data scope; ordinary users cannot access other users' data.

Hiding a page entry cannot replace permission verification on the API. When changing default roles or authorization Seeds, also run the template's `tests/server/authorization-assignment-safety.test.ts`. For complete identity and permission examples, see the [server testing example](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/server/routes.md).

## Database and CLI tests

### Database

Database tests go in `tests/database/`. Use `describeMigration()` to check migrations, and `createDatabaseTest()` to check queries, constraints, Seed results and transactions; both are imported from `@nocobase/app-testing/server`.

For example, after completing the `appStatuses` example in [Create tables and initialize data](data-models-and-migrations.md), create `tests/database/app-statuses.test.ts`:

```ts
import { fileURLToPath } from 'node:url';
import {
  createDatabaseTest,
  describeMigration,
} from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import packageMetadata from '../../package.json' with { type: 'json' };

const migrations = [{
  packageName: packageMetadata.name,
  directory: fileURLToPath(
    new URL('../../database/main/migrations/', import.meta.url),
  ),
}];
const seeds = [{
  packageName: packageMetadata.name,
  directory: fileURLToPath(
    new URL('../../database/main/seeds/', import.meta.url),
  ),
}];

describeMigration('202611040001_create_app_statuses', {
  sources: migrations,
  up: async ({ expectCollection }) => {
    await expectCollection('appStatuses').toHaveField('code', {
      type: 'string',
      nullable: false,
    });
    await expectCollection('appStatuses').toHaveField('title', {
      type: 'string',
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('appStatuses').not.toExist();
  },
});

const test = createDatabaseTest({ migrations, seeds });

test('installs the default statuses', async ({ connection }) => {
  const statuses = connection.repository('appStatuses');
  for (const record of [
    { code: 'draft', title: 'Draft' },
    { code: 'published', title: 'Published' },
  ]) {
    await expect(
      statuses.findOne({ filter: { code: record.code } }),
    ).resolves.toMatchObject(record);
  }
});
```

`describeMigration()` applies the migration on a real database, rolls it back and applies it again, so the `up` assertions run twice. By default, `createDatabaseTest()` resets the schema for each test, reruns the migrations and Seeds passed to it, and cleans up the database afterwards. It does not load the application's plugins automatically; if the resources depend on plugin tables, add the required resource sources or use the full application fixture.

The example above verifies table creation, rollback and first-time initialization. Seeds should also be verified against existing records and repeated runs, for example whether names changed by an administrator are kept; transactions should be read again after deliberately triggering a failure, to confirm all writes rolled back. When an existing migration includes a data transformation, prepare the old data first, then check the upgrade result.

`NOCOBASE_TEST_DB_DIALECT` chooses the test dialect and defaults to SQLite. To verify a target database, install the matching driver, configure the test service it needs, and run the same tests. For example:

```bash
NOCOBASE_TEST_DB_DIALECT=postgres pnpm test --project node tests/database/app-statuses.test.ts
```

The test service must allow isolated databases or schemas to be created and cleaned up. Passing on SQLite does not mean other dialects such as PostgreSQL are verified. For connection settings, see the [database testing example](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/database/repository.md); for how to assert on transactions, see [Transactions and data consistency](transactions-and-consistency.md).

### CLI

Command tests go in `tests/cli/` and import the actual command classes from `cli/commands/`. Choose the fixture according to what the command needs:

| Command behavior | How to test |
| --- | --- |
| Parses arguments and works with files without starting the application | Bind a temporary application root and the command ID with `bindAppCommand()`, then run it with `runAppCommand()` |
| Needs real application services or a database | Prepare isolated configuration with `createTestAppConfig()`, bind the command with `bindTestAppCommand()`, run it, and call `config.dispose()` in `finally` |

Check the `error`, `result`, `stdout`, `stderr` and `json()` returned by `runAppCommand()`. On success, `exitCode` may be `undefined`; normalize it with `exitCode ?? 0`. Failing tests should also assert a nonzero exit code and the agreed error code.

Taking the status dictionary export from [Write application commands](application-commands.md) as an example, verify a normal export and the file contents, that a preview writes no file, an empty dictionary, that an existing file is not overwritten, and that resources are released after a failure. Checking only the help output or that the command can be discovered does not prove the export works.

Capturing command output involves process-wide state, so these tests should run sequentially; database commands also need the migrations and Seeds they actually require. For complete examples, see [file command tests](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/files.md) and [database command tests](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/command.md).

## Browser tests and functional acceptance

Browser tests go in `tests/playwright/`. The default template provides the Playwright configuration and commands, but the tests themselves must be added for the application's features. Start a separate test application first and use the complete `Local:` URL printed by `pnpm dev`, including base paths such as `/main/`. The in-process server fixture cannot serve as an address for the browser.

The sign-in check below assumes the application keeps the default English sign-in page and that the home page after sign-in has a level-one heading. Create `tests/playwright/sign-in.test.ts`, and adjust the locators if your interface differs:

```ts
import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('signs in and keeps the session after reload', async ({ page }) => {
  const entry = process.env.APP_URL;
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  if (!entry || !username || !password) {
    throw new Error('Set APP_URL, E2E_USERNAME and E2E_PASSWORD.');
  }
  const appUrl = new URL(`${entry.replace(/\/+$/, '')}/`);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(new URL('login', appUrl).href);
  await page.getByLabel('Username or email').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(
    (url) => !url.pathname.replace(/\/$/, '').endsWith('/login'),
  );
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const session = await page.request.get(
    new URL('api/auth/get-session', appUrl).href,
  );
  expect(session.status()).toBe(200);
  await expect(session.json()).resolves.toMatchObject({
    user: { id: expect.any(String) },
  });
  expect(pageErrors).toEqual([]);
});
```

Set the test application's `APP_URL`, `E2E_USERNAME` and `E2E_PASSWORD` in the terminal or CI environment, then run:

```bash
pnpm exec playwright install chromium
pnpm test:e2e tests/playwright/sign-in.test.ts
```

Chromium only needs to be installed the first time. `APP_URL` looks like `http://127.0.0.1:13000/main/`; use the application's actual address. The code uses the relative path `login` so the deployment base path is not lost. Use a dedicated test account and data, and pass credentials through environment variables. When several tests need to reuse a signed-in state, see the [example of saving and reusing a session](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/playwright/login.md).

The sign-in check is only a starting point. Business acceptance should also verify one complete operation: enter from the page, fill in and submit, confirm success, refresh and read again, then check rejection with an account that lacks permission. Depending on the change, add checks for browser Back, network failures, mobile layouts, keyboard focus and scrolling in dialogs. Automated assertions cover behavior, while manual acceptance checks layout, readability and the feel of the interaction.

## Build checks and delivery criteria

During development, run the affected test files first, and widen to related test groups once failures are fixed. Before delivering application code, run the following checks as the change and the project require:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

The default template's `pnpm check` combines package checks, lint, formatting, types, Vitest and the build, but browser tests still have to be run separately. If only documentation changed, checking the documentation's own links and build is enough; there is no need to rerun every business test.

When reporting acceptance results, record the commands actually run, the test files and results, the database dialect, the user roles and the key flows. List skipped and unverified items explicitly, such as testing only on SQLite, not running browser tests or not checking deployment artifacts, and never count them as passed.

**Done when**: the behavior, data and permissions touched by the change all have corresponding verification; type checks and the build pass as the project requires; flows that need confirmation in a browser have passed acceptance, and the remaining limitations are clearly recorded.
