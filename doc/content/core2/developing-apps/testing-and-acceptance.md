---
title: Testing and acceptance
description: Organize client, server, database, CLI and browser tests around the application, then complete build checks and functional acceptance.
---

Organize tests around the behavior you change: component tests cover interactions, server tests cover APIs and permissions, database tests cover schema and records, command tests cover CLI behavior, and browser tests cover complete user flows. Choose the test layer that can verify the behavior, then add application integration and manual checks where needed.

This guide uses the default application template's test configuration. Keep an existing project's configuration, aliases and setup files. Create the business files referenced by an example using the linked guide first.

## Test directories and commands

Keep tests under the application's root `tests/` directory, organized by the responsibility of the source code. Create directories as needed and name tests `*.test.ts` or `*.test.tsx`:

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

The default template's Vitest configuration has two projects: `client` uses a jsdom-based application environment and discovers tests in `tests/client/`; `node` discovers tests in `tests/server/`, `tests/database/`, `tests/cli/` and `tests/project/`. Playwright runs browser tests separately.

Run from the application root:

```bash
pnpm test
pnpm test --project client
pnpm test --project node tests/database/app-statuses.test.ts
pnpm test:watch
pnpm test:coverage
```

The third command targets the database test created below. Select other files by their actual paths; each category does not need its own configuration file.

`@nocobase/app-testing` provides these public entries:

| Entry | Main helpers | Purpose |
| --- | --- | --- |
| `/client` | `renderWithApp()`, `answerApi()` | Render components that use application services and control HTTP responses |
| `/server` | `createAppTest()`, `createTestApp()` | Start an application on isolated databases and test real APIs and plugin integration |
| `/server` | `createDatabaseTest()`, `describeMigration()` | Test database behavior and migrations without starting the full application |
| `/cli` | `bindAppCommand()`, `runAppCommand()`, `createTestAppConfig()`, `bindTestAppCommand()` | Run commands, capture output and supply isolated application configuration when needed |

There is no `/database` or `/playwright` entry. Browser tests use `@playwright/test` directly.

> [!NOTE]
> The default template lets Vitest exit successfully when it finds no tests, and `test:e2e` includes `--pass-with-no-tests`. A successful exit does not establish acceptance: check the report's file names, test count and skipped cases. CI that requires tests to run can disable the corresponding options.

## Client tests

Put tests in `tests/client/` and import the real page, component, Hook or service. For components that use application services, `renderWithApp()` supplies the client runtime, router, API Client and translation environment; `answerApi()` controls API responses.

Choose assertions that match the page's behavior:

| Scenario | What to verify |
| --- | --- |
| Loading and empty data | Loading is visible; an empty result has a clear message and does not display stale data |
| Successful submission | Request method, path and payload are correct; confirmation and list updates are correct |
| Failure and retry | The error is understandable; retry clears the old error and restores interaction after success |
| Pending submission | The button is disabled or duplicate requests are prevented; success is not shown early |
| Routes and filters | URL parameters, pagination and back navigation remain consistent |
| Permissions and sessions | Unavailable actions are handled correctly; an expired session prompts sign-in |
| Localization | Real language resources work in at least the application's main supported languages |

Keep `useApiClient()`, translations and routing real, and supply responses at the HTTP boundary. `answerApi()` receives paths below `/api/`, such as `tasks`; return a `Response` when selecting a status code. Fail unexpected requests explicitly so a wrong path cannot accidentally receive a successful response.

Call `renderWithApp()` inside a test; it shuts down the client application when the case ends. Keep the template's React environment and DOM cleanup, avoid wrapping the component in another Router, and keep strict translation checks enabled. Perform clicks outside `waitFor()` and use its callback only for assertions.

For a client business service, first construct an instance to test its methods, then use the real container to check registration, subscriptions and resource cleanup. Import the real React component when testing a React Provider. That integration differs from a ServiceProvider in the service container; see [Client business services](client-business-services.md) and [UI components and interactions](pages-and-interactions.md).

The [client testing example](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/client/page.md) includes complete request, retry and duplicate-submission checks. The template's `tests/client/page-harness.test.tsx` also demonstrates permissions, date formatting and route dialogs. Controlled-response component tests do not establish server authorization or database persistence; use real application tests for those boundaries.

## Server tests

Test service calculations and branches directly. When behavior depends on plugin registration, sign-in, authorization, migrations or HTTP middleware, start the real application with `createAppTest()`.

This example demonstrates the fixture using the default template's users API. It assumes the authentication, authorization and users plugins and the default administrator policy remain in place. Create `tests/server/users.test.ts`:

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

The secret and administrator configuration are for isolated tests only. The fixture installs application and plugin migrations and Seeds, provides temporary storage, and closes the application automatically. Requests run in process without a listening HTTP port; `request('/users')` reaches the application's API routes.

By default, `createAppTest()` shares one application and database within a file. Set `scope: 'test'` to install a separate application for every case. With shared state, use records owned by each case and avoid depending on test order. List every application-owned connection in `connections`, such as `['main', 'analytics']`; unlisted connections retain the application's configuration.

These two cases demonstrate the sign-in boundary only. For a business API, substitute its real routes and cover:

- Anonymous, authenticated-but-unpermitted and permitted callers; evaluate public routes against their own access policy.
- Invalid arguments, missing records and disallowed states, including the actual error response structure.
- A fresh read after a write to confirm persistence of records and related data; no partial writes after failure.
- Data scopes across lists, details and statistics; ordinary users cannot access other users' data.

Hiding a page entry does not verify API authorization. When changing initial roles or authorization Seeds, also run the template's `tests/server/authorization-assignment-safety.test.ts`. See the [server testing example](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/server/routes.md) for complete identity and permission cases.

## Database and CLI tests

### Database

Put database tests in `tests/database/`. Use `describeMigration()` for migrations and `createDatabaseTest()` for queries, constraints, Seed results and transactions. Import both from `@nocobase/app-testing/server`.

After completing the `appStatuses` example in [Create tables and initialize data](data-models-and-migrations.md), create `tests/database/app-statuses.test.ts`:

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

`describeMigration()` applies the migration, rolls it back and applies it again on a real database; its `up` assertions run twice. By default, `createDatabaseTest()` resets the schema and runs the supplied migrations and Seeds before each case, then cleans up its databases. It does not load application plugins automatically. Supply prerequisite resource sources when they depend on plugin tables, or use a full application fixture.

This example verifies schema rollback and initial installation. Also test Seeds against existing records and on repeated execution, such as preserving an administrator's edited title. For transactions, trigger a failure and read again to confirm every write rolled back. For a data migration, prepare old records before checking the upgrade result.

`NOCOBASE_TEST_DB_DIALECT` selects the test dialect and defaults to SQLite. To verify another database, install its matching driver, configure the test server the driver requires, and run the same cases. For example:

```bash
NOCOBASE_TEST_DB_DIALECT=postgres pnpm test --project node tests/database/app-statuses.test.ts
```

The test server must allow isolated databases or schemas to be created and cleaned up. Passing on SQLite does not verify PostgreSQL or other dialects. See the [database testing example](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/database/repository.md) for connection settings and [Transactions and data consistency](transactions-and-consistency.md) for transaction assertions.

### CLI

Put command tests in `tests/cli/` and import the actual command class from `cli/commands/`. Choose the fixture according to what the command needs:

| Command behavior | Test setup |
| --- | --- |
| Parses arguments or works with files without opening an application | Bind a temporary application root and command ID with `bindAppCommand()`, then execute with `runAppCommand()` |
| Uses real application services or a database | Prepare isolated configuration with `createTestAppConfig()`, bind with `bindTestAppCommand()`, execute, and call `config.dispose()` in `finally` |

Check the returned `error`, `result`, `stdout`, `stderr` and `json()` from `runAppCommand()`. A successful `exitCode` can be `undefined`; normalize it with `exitCode ?? 0`. Failure cases should assert a nonzero exit and the documented error code.

For the status export in [Write application commands](application-commands.md), verify normal export and file contents, a dry run without writes, an empty dictionary, preservation of an existing file, and resource cleanup after failure. Command discovery or help output alone does not prove the export works.

Run command cases sequentially because output capture uses process-wide state. Database commands also need their actual migration and Seed sources. See the complete [file command tests](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/files.md) and [database command tests](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/command.md).

## Browser tests and functional acceptance

Put browser tests in `tests/playwright/`. The default template provides Playwright configuration and commands; add cases for the application's actual features. Start a dedicated test application first and use the complete `Local:` URL printed by `pnpm dev`, including any base path such as `/main/`. An in-process server fixture does not provide a browser-accessible URL.

This sign-in check assumes the default English login page and a level-one heading on the signed-in home page. Create `tests/playwright/sign-in.test.ts` and adapt locators if the UI differs:

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

Set `APP_URL`, `E2E_USERNAME` and `E2E_PASSWORD` for the test application in the shell or CI environment, then run:

```bash
pnpm exec playwright install chromium
pnpm test:e2e tests/playwright/sign-in.test.ts
```

Install Chromium on first use. An `APP_URL` might be `http://127.0.0.1:13000/main/`; use the application's actual address. The code resolves the relative path `login` to preserve the deployment prefix. Use a dedicated test account and data, passing credentials through the environment. To reuse sign-in across cases, see the [session storage example](https://github.com/nocobase/nocobase/blob/7fb8311d89fb59468d9fac3d6263c3379c8c6083/packages/app/app-skills/skills/nocobase-app-development/references/testing/playwright/login.md).

Sign-in is only the starting point. Business acceptance should cover a complete operation: navigate to the page, fill in and submit data, confirm success, reload and read it again, then check rejection with an unpermitted account. Add back navigation, network failure, mobile layout, keyboard focus and dialog scrolling checks according to the change. Automated assertions cover behavior; manual acceptance checks layout, readability and interaction quality.

## Build checks and delivery criteria

During development, run affected files first and expand to related test groups after resolving failures. Before delivering application code, perform checks appropriate to the change and the project's requirements:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

The default template's `pnpm check` combines package checks, lint, formatting, types, Vitest and the build; run browser tests separately. For documentation-only changes, check the documentation's links and build without repeating every application test.

Record the commands actually run, test files and results, database dialect, user roles and key flows. State skipped and unverified work explicitly, such as testing only SQLite, not running browser tests, or not checking deployment artifacts. Do not report those checks as passing.

**Done when**: changed behavior, data and permission boundaries have corresponding verification; required type and build checks pass; flows that need a browser have been accepted, with remaining limitations recorded.
