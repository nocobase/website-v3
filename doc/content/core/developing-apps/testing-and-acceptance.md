---
title: Testing
description: Test components, APIs, commands, and databases, then verify the UI and complete workflows with Playwright, an Agent, and manual checks.
---

## What to test in an application

After implementing a feature, verify its behavior during normal use, with restricted permissions, and when an operation fails. For product management, this means checking creation and publishing, preventing read-only users from making changes, and allowing retries after a failed save.

Tests need to check both code behavior and workflows in the running application:

| Scope | What to verify | Product management example |
| --- | --- | --- |
| client | Component interactions, request contents, and state feedback in a test environment | Submit the correct name and price; retain input on failure |
| server | APIs, business rules, identity, and permissions | Save new products as drafts; deny publishing to read-only users |
| cli | Command execution, output, and failure handling | Export published products; refuse to overwrite an existing file |
| database | Data operations, constraints, transactions, migrations, and seed data | Roll back failed writes; apply and reverse migrations |
| UI | Page behavior and complete workflows in a real browser | Sign in, create a draft, publish, and reload to check the result |

Use Vitest and app-testing for the first four categories. UI checks can run as Playwright scripts, autonomous Agent interactions, or manual checks. They complement each other: component tests check how a form handles requests, server tests check permissions and writes, and UI tests check whether a user can complete the workflow in the running application.

## Testing tools and helpers

### Vitest

Vitest discovers and runs tests. It provides `test`, `expect`, and `vi.fn()` to define cases, assert results, and record or mock function calls. It also supports watch mode and coverage reports. See the [Vitest documentation](https://vitest.dev/guide/) for general usage.

Import and test functions directly when they do not need an application environment. For pages, plugins, databases, and application commands, use app-testing to prepare the environment. A Vitest test can use both Vitest assertions and app-testing helpers.

### Playwright

Playwright opens a running application in a real browser to sign in, fill forms, click buttons, and reload pages. It is suited to complete workflows involving pages, APIs, sessions, and databases.

Playwright has its own test runner and is not provided by app-testing. In the example, `pnpm test` runs Vitest and `pnpm test:e2e` runs Playwright. Run them separately.

### app-testing

`@nocobase/app-testing` is NocoBase's application testing helper suite. It exposes three import entry points:

| Entry point | Main helpers | What they test |
| --- | --- | --- |
| `@nocobase/app-testing/client` | `renderWithApp()`, `answerApi()` | Render components in a client application, control API responses, and verify interactions |
| `@nocobase/app-testing/server` | `createAppTest()` | Start a server application with isolated databases to verify APIs, permissions, and persistence |
| `@nocobase/app-testing/server` | `createDatabaseTest()`, `describeMigration()` | Test database operations, schema, and migration rollback independently |
| `@nocobase/app-testing/cli` | `createTestAppConfig()`, `bindTestAppCommand()`, `runAppCommand()` | Prepare command configuration, execute commands, and read results and output |

These helpers reduce repeated application setup, database provisioning, and cleanup code. Tests still need explicit assertions for business outcomes, such as whether publishing is allowed or a read-only user is denied access.

## Organizing and running tests

### Test directories and configuration

Organize test files by scope under `tests/`:

```text
tests/
├── database/     # Database tests
├── server/       # Server tests
├── client/       # Page interaction tests
├── cli/          # Application command tests
└── playwright/   # Browser tests
```

`vitest.config.ts` configures the first four categories: the `client` project runs page tests, and the `node` project runs server, command, and database tests. `playwright.config.ts` configures browser tests separately.

### Running tests and reading results

Run these commands from the application root. They are defined in the default application template's `package.json`; existing projects should follow their own scripts.

```bash
# Run Vitest tests
pnpm test

# Watch for file changes and rerun tests
pnpm test:watch

# Generate a coverage report
pnpm test:coverage

# Run browser tests; start the test application first
pnpm test:e2e
```

Check the file count, test count, and failures in the terminal. Failure messages identify the assertion and its expected and actual values. Finding no tests or skipping tests does not verify the affected features.

After a change, run tests for the affected area, then check the pages, APIs, or commands that use it. Changes to authentication, shared services, or data structures also require checking key complete workflows. When fixing a defect, add a test that reproduces it and keep the test as regression coverage.

## Writing tests with Vitest

The following sections use one product management App throughout. See [Example source and setup](#example-source-and-setup) for source code and installation. Code blocks show key excerpts; the linked files contain the full data setup and helper functions.

Each test should prepare its environment or data, perform an operation, and assert the result. Choose the test scope based on the behavior you need to verify. Test standalone functions directly with Vitest; use app-testing for tests that need application services, pages, or databases.

### database: data and migrations

Database tests verify data operations, constraints, transactions, migrations, and seed data. When a test does not need the full application, load only the migrations and data it requires to reduce coupling to other modules.

**Prepare the database and test data operations**

Import `createDatabaseTest()` from `@nocobase/app-testing/server`, specify migration sources through `migrations`, and use `connection` from the test context to access the test database. These helpers come from `@nocobase/db-testing` and are re-exported through app-testing's server entry point.

By default, `createDatabaseTest()` uses `isolation: 'schema'`: it resets the test database schema for each case, runs the supplied migrations and seeds, and cleans up connections and databases afterward. It does not install the application or its plugins automatically. Supply seed sources through `seeds` when needed, or use `createAppTest()` when the test requires plugin services.

Query data again after a write to check field values and record counts. Constraint tests should verify both that an invalid write fails and that the original record remains unchanged. For transactions, trigger a failure partway through a multi-step operation, then query the database to confirm no partial writes remain.

**Verify migrations and seed data**

Use `describeMigration()` to specify migration sources and check results in its `up` and `down` callbacks. The helper applies, rolls back, and reapplies the migration, so assertions in `up` run twice. Your assertions must still check the expected schema, fields, and data changes.

Test seed data both on its first run and on repeated runs, for example to ensure it does not duplicate records or overwrite user edits. If initialization depends on authentication, authorization, or other plugin services, load the complete application in a server test.

**Select a test database**

`NOCOBASE_TEST_DB_DIALECT` selects the test dialect and defaults to SQLite. Before switching dialects, install a compatible driver and configure its required test service and connection parameters. The test account needs permission to create and clean up isolated databases or schemas. For example, after configuring a PostgreSQL test environment, run:

```bash
NOCOBASE_TEST_DB_DIALECT=postgres pnpm test --project node tests/database/catalog-data.test.ts
```

This command illustrates dialect selection; the product example was tested with SQLite. See [Database test environment setup](https://github.com/nocobase/nocobase/blob/6cc8acf0c9062e99c759ed0a9ca1d038c4145705/packages/app/app-skills/skills/nocobase-app-development/references/testing/database/repository.md) for connection configuration. The same environment selection applies to server and CLI tests that use the suite's isolated databases.

**Example: product transactions and migrations**

The database tests load only the product migrations:

```ts
import path from 'node:path';
import { createDatabaseTest } from '@nocobase/app-testing/server';
import metadata from '../../package.json' with { type: 'json' };

const test = createDatabaseTest({
  migrations: [{
    packageName: metadata.name,
    directory: path.resolve(import.meta.dirname, '../../database/main/migrations'),
  }],
});
```

This test throws after writing inside a transaction. The final record count should be zero:

```ts
test('rolls back every product write when the transaction fails', async ({
  connection,
}) => {
  await expect(
    connection.transaction(async (transaction) => {
      await transaction
        .repository('catalogProducts')
        .createOne({
          values: {
            id: 'rollback',
            name: 'Uncommitted',
            priceCents: 100,
            published: false,
          },
        });
      throw new Error('Simulated downstream failure');
    }),
  ).rejects.toThrow('Simulated downstream failure');
  expect(await connection.repository('catalogProducts').count()).toBe(0);
});
```

The migration test checks that a field exists, then verifies that the tables are removed after rollback:

```ts
describeMigration('202610310001_create_catalog', {
  sources: [
    {
      packageName: 'testing-acceptance',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('catalogProducts').toHaveField('published', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('catalogProducts').not.toExist();
    await expectCollection('catalogCategories').not.toExist();
  },
});
```

```bash
pnpm test --project node tests/database/catalog.test.ts tests/database/catalog-data.test.ts
```

[Data operation tests](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/database/catalog-data.test.ts) · [Migration tests](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/database/catalog.test.ts). Seed verification is in the server tests: run the sample seed, edit a product name, and run the seed again to confirm no records are added and the edit is preserved. The application does not populate products on startup by default.

### server: APIs and business rules

Server tests verify API responses, business rules, authentication, permissions, and persistence. Test independent calculations by calling the function directly. Load the actual application for behavior that depends on plugins or application services.

**Create a test application**

Import `createAppTest()` from `@nocobase/app-testing/server`. Pass the application's server factory through `createServer` and test-specific settings through `config`. It returns a Vitest `test` with application context:

| Context | Purpose |
| --- | --- |
| `request` | Send requests to application APIs |
| `testApp` | Access the test application, including Web routes through `fetch` |
| `app` | Access the application and its service container |
| `connection` | Query the test database to inspect operation results |

Requests run in process without an externally accessible HTTP server. By default, tests in one file share an application and database; set `scope: 'test'` for isolation per case. `connections` isolates `main` by default. List every application-owned connection when there are several; omitted connections retain the application's configuration. The suite closes the application and cleans up test databases when the scope ends.

**Verify responses, business outcomes, and permissions**

Prepare data, send real requests, and check status codes, response contents, and persisted results. Besides normal operations, cover invalid input, missing records, and state conflicts. APIs that support retries should also be checked for duplicate writes.

Use signed-out, signed-in but unauthorized, and authorized identities. Establish sessions through real authentication, then check permitted and denied operations. If access is limited to a record scope, verify consistency across lists, counts, details, and exports. Hiding a client-side button does not replace these assertions.

Tests sharing a database should create their own records and avoid relying on execution order.

**Example: product creation and access control**

The example loads the actual application with separate authentication settings for testing:

```ts
import { createAppTest } from '@nocobase/app-testing/server';
import { DEFAULT_ADMIN_CREDENTIALS, signIn } from '@nocobase/app-plugin-authentication/testing';
import { expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  server: { basePath: '/shop' },
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'catalog-test-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
      emailAndPassword: { disableSignUp: false },
    },
  },
});
```

The tests create a product, repeat a request with the same operation key, and query the database to confirm no duplicate write. Ordinary users can read only after an explicit grant; creation and publishing still return `403`. This excerpt groups the creation and retry assertions into one case to show how to access the test context and sign in. The source helpers `post()` and `key()` construct a JSON request and generate an operation key:

```ts
test('creates a draft without duplicating retries', async ({ testApp, connection, request }) => {
  expect((await request('/products')).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const values = { name: 'Catalog test lamp', priceCents: 3500 };
  const operation = key();
  const created = await admin.fetch('/products', post(values, operation));
  expect(created.status).toBe(201);
  const { data } = await created.json();
  expect(data).toMatchObject({ ...values, published: false });
  const repeated = await admin.fetch('/products', post(values, operation));
  expect(repeated.headers.get('Idempotency-Replayed')).toBe('true');
  expect(await connection.repository('catalogProducts').count({
    filter: { name: values.name },
  })).toBe(1);
});
```

```bash
pnpm test --project node tests/server/catalog.test.ts
```

[Complete tests, session setup, and permission assertions](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/server/catalog.test.ts).

### client: component interactions and state

Client tests check whether a component sends the correct request and displays the expected state after user interaction. They suit form input, button actions, data display, error feedback, and retries.

**Render application components**

Import `renderWithApp()` from `@nocobase/app-testing/client` to render the actual component in a client environment with application services, routing, and translations. Configure its translations with `namespace`, `namespaces`, and `locale`. Test components that depend on application context in this environment rather than replacing them with substitutes that bypass the actual logic.

`renderWithApp()` closes the client application at the end of the test. Testing Library finds UI elements, `userEvent` simulates input and clicks, and Vitest's `expect()` checks results.

**Control requests and check UI feedback**

Use `fetch: answerApi(handler)` to control responses. The handler can read the request's `method`, `path`, and `json`, and return a `Response` with a specific status and body. Wrap it with `vi.fn()` to inspect request contents and call counts.

Cover pending, successful, and failed requests: check that pending requests prevent duplicate actions, success updates the data and feedback, and failure shows an error while retaining input and allowing retries. Wait for asynchronous UI updates before asserting, and release delayed responses before the test ends.

Mock responses verify how a page handles results, not whether the server persisted data or enforced permissions. Use server tests for those behaviors and Playwright for complete workflows in a real browser.

**Example: product form submission and feedback**

The product form tests use the actual component with controlled responses. In this excerpt, each case supplies `respond`; `metadata` and `locales` come from the application:

```tsx
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';

const requests = vi.fn((call: ApiCall) =>
  call.method === 'POST' && call.path === 'products'
    ? respond()
    : new Response(null, { status: 404 }),
);
await renderWithApp(<ProductForm onCreated={onCreated} />, {
  namespace: metadata.name,
  namespaces: { [metadata.name]: locales },
  locale: 'en-US',
  fetch: answerApi(requests),
});
```

The success case checks the name and price in the request, input clearing, and callback counts. The failure case checks retained input and retry; the delayed case checks that the button is disabled while saving. Run:

```bash
pnpm test --project client tests/client/product-form.test.tsx
```

[Complete tests and helpers](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/client/product-form.test.tsx).

![The page after creating a product draft.](/assets/core/testing-acceptance/testing-products-draft.png)

![A failed save retains input and offers a retry.](/assets/core/testing-acceptance/testing-products-failure.png)

![The button is disabled while the request is pending.](/assets/core/testing-acceptance/testing-products-pending.png)

### cli: application commands

CLI tests verify argument handling, exit status, standard output, errors, and changes to data or files. Check actual side effects, such as reading an exported file back, rather than only checking whether the command throws.

**Prepare the command environment**

Import helpers from `@nocobase/app-testing/cli` and choose an environment based on whether the command starts an application:

| Command dependencies | Setup |
| --- | --- |
| Arguments or files only | Bind a temporary application root and command ID with `bindAppCommand()`, then execute with `runAppCommand()` |
| Application services or a database | Create isolated configuration with `createTestAppConfig()`, prepare data, bind the actual command class with `bindTestAppCommand()`, then execute |

Clean up temporary files created by the test and dispose of application configuration with `config.dispose()`. The product export below uses the second approach. See the [complete file-command example](https://github.com/nocobase/nocobase/blob/6cc8acf0c9062e99c759ed0a9ca1d038c4145705/packages/app/app-skills/skills/nocobase-app-development/references/testing/cli/files.md) for a command that does not start an application.

**Execute the command and check results**

Execute with `runAppCommand(Command, args)`. The return value includes `exitCode`, `stdout`, and `stderr`. A successful command may leave `exitCode` undefined; normalize it with `exitCode ?? 0`. For commands supporting JSON output, use `json()` to read the structured result. Alongside output assertions, query the database or read generated files to check their contents. For dry runs, verify that no writes occurred.

For invalid arguments, an existing destination, or execution failures, check the exit status, error contents, and integrity of existing data. Handled errors in JSON mode may not appear in `run.error`, so check both the exit code and error response.

Output capture affects process-wide state, so run these tests sequentially. Commands using `withApp()` close their application when finished; configurations created by tests still require `config.dispose()` in `finally`.

**Example: exporting published products**

The command exports published products from the actual database. The test prepares one published product and one draft, then binds the actual command. `config` is created with `createTestAppConfig()`; `createApp` and `runtime` come from application entry points:

```ts
const Command = bindTestAppCommand(ExportProducts, {
  rootDir, config, id: 'app:products:export', createApp,
  loadRuntime: () => resolveStandaloneAppRuntime(runtime, {
    rootDir,
    configPath: config.path,
    consoleLogStream: 'stderr',
    env: { APP_STORAGE_DIR: path.join(config.directory, 'storage') },
  }),
});
```

`consoleLogStream: 'stderr'` keeps logs out of JSON output, and the temporary configuration and storage paths remain aligned. Execution should report one exported record, with no draft in the file:

```ts
const run = await runAppCommand(Command, ['--output', file, '--json']);
expect(run.exitCode ?? 0).toBe(0);
expect(run.json()).toMatchObject({
  ok: true, result: { count: 1, written: true },
});
```

The tests also check that a dry run creates no file and an existing destination causes an error without changing its contents. Configuration is disposed of in `finally`.

```bash
pnpm test --project node tests/cli/export.test.ts
```

[Complete command tests](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/cli/export.test.ts) · [Export command implementation](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/cli/commands/products/export.ts).

Before exporting manually, stop the application process using the same storage. This example runs as a single process and requires the output directory to exist. The command refuses to export more than 500 public products.

```bash
pnpm nocobase app products export --output ./products.json --dry-run --json
pnpm nocobase app products export --output ./products.json --json
```

## UI testing

UI testing opens the actual application to check the combined behavior of pages, APIs, sessions, and data. Prepare an accessible application, accounts with the required roles, and distinguishable test data. Decide how to clean up data after the checks.

| Method | Suitable use | Evidence |
| --- | --- | --- |
| Playwright | Repeated verification and regression testing of stable workflows | Test cases, reports, and traces |
| Autonomous Agent verification | Checking changed UI during development, then fixing and rechecking issues | Actions performed, observations, issues, and recheck results |
| Manual verification | Checking workflows, terminology, and usability against real work | Scenarios, expected and actual results, and user feedback |

All three methods should cover key workflows, role differences, and relevant error states. Reload or revisit a page to confirm persistence. Restricted UI controls do not prove that the server rejects unauthorized access; API permission tests are still needed.

### Automated verification with Playwright

Playwright tests verify complete user journeys in a real browser, exercising pages, APIs, sessions, and databases together. Use them for sign-in, submission, navigation, reloading, and workflows spanning pages.

**Prepare the application, accounts, and data**

Start a separate test application, configure its address, and prepare accounts with different permissions. Establish sessions through real sign-in, use distinguishable test data, and decide whether to clean up or retain records so repeated runs do not interfere with each other.

Browser tests need a running service; they cannot directly use the in-process request environment of server tests. Install the required browser through Playwright, for example with `pnpm exec playwright install chromium`.

**Interact with pages and verify results**

Prefer locating elements by role, label, or accessible name. Use actions such as `fill()` and `click()`, then Playwright assertions to wait for the expected state.

Cover normal paths and relevant failure paths. Controlled network responses can reproduce temporary failures or delays to check feedback, retries, and duplicate submissions. Distinguish these controlled cases from normal workflows using real APIs.

**Inspect failures and reports**

Start with the case name, assertion location, and actual result. For further investigation, enable the HTML report and retain traces for failed cases:

```bash
pnpm test:e2e --reporter=html --trace=retain-on-failure
```

Configure the application address and accounts as required by the project. Reports are written to `playwright-report/`; traces help inspect page states and network requests around each action. See [Playwright reporters](https://playwright.dev/docs/test-reporters) and [Trace Viewer](https://playwright.dev/docs/trace-viewer-intro).

**Example: creating and publishing a product**

Start the application using [Example source and setup](#example-source-and-setup). `pnpm run setup` creates editor and read-only accounts and saves credentials locally in `storage/demo.json`. The example uses `APP_URL` for the full application address, including its base path. Replace the address below with your actual address:

```bash
pnpm exec playwright install chromium
APP_URL='http://<host>:13320/main' pnpm test:e2e tests/playwright/products.test.ts
```

The tests read local credentials and establish real sessions. They create a uniquely named product, reload to confirm the draft exists, then publish and reload again:

```ts
await page.getByLabel('Product name', { exact: true }).fill(name);
await page.getByLabel('Price in cents', { exact: true }).fill('2400');
await page.getByRole('button', { name: 'Create draft', exact: true }).click();
await expect(page.getByText('Draft created.', { exact: true })).toBeVisible();
await page.reload();
const row = page.getByRole('row').filter({ hasText: name });
await expect(row).toContainText('Draft');
await row.getByRole('button', { name: 'Publish', exact: true }).click();
await expect(row).toContainText('Published');
await page.reload();
await expect(row).toContainText('Published');
```

![The product remains Published after reloading.](/assets/core/testing-acceptance/testing-products-published.png)

The read-only account has no create or publish controls, and a direct request to the creation API returns `403`. Another case injects failures and delays to check retained input, retry, and pending state; see the [client tests](#client-component-interactions-and-state) for the page states.

![The read-only account can view products but cannot create or publish them.](/assets/core/testing-acceptance/testing-products-viewer.png)

The tests retain created products for inspection. Run them against a dedicated test instance. [Complete browser tests](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/tests/playwright/products.test.ts).

### Autonomous Agent verification

Autonomous Agent verification is a browser check during development. The Agent chooses actions based on the change and the current page state, observes results, fixes issues, and repeats the actions to verify the fix. It can use browser automation tools without first turning every path into a maintained Playwright test.

**Check proactively during development**

The NocoBase application development Skill's [frontend workflow](https://github.com/nocobase/nocobase/blob/139e754fd526313ec36b8a31c5f99ee45a06467f/packages/app/app-skills/skills/nocobase-app-development/references/frontend/ui-workflow.md) requires checking changed elements and affected interactions for runtime-visible changes. New pages also require verification of actual operations, persistence and reload, permissions, and relevant empty and error states.

In a development environment that follows this Skill and has browser tools and a signed-in session, page verification should therefore be part of completing development. The Agent should choose the scope from the change rather than wait for the user to list every click. Browser control comes from the Agent's environment, not app-testing.

**Interact, diagnose, and recheck**

For a change to the product creation form, the Agent should open the product page, fill and submit the form, check feedback and the list, then reload to confirm persistence. If permissions changed, it should also check the controls with a read-only account. Submission changes require checking pending, failure, and retry states; see the [client example](#client-component-interactions-and-state).

When a button does not respond, data fails to update, or the page errors, use page state, console errors, network requests, and server logs to diagnose the issue. Repeat the original reproduction steps after fixing it, then check affected neighboring interactions. Screenshots alone do not establish correct submission, persistence, or permission behavior.

**Record actual verification**

The Agent's handoff should list the pages visited, roles used, actions performed, observed results, and rechecks after fixes, with screenshots of relevant states where needed.

If no browser is available, startup fails, or no signed-in session is available, record the blocker and unverified items explicitly. Add fixed regression tests for issues found during this work that need ongoing protection.

### Manual verification

Developers, testers, or business users manually operate the application to judge whether workflows, controls, and feedback fit real work. Agent records can inform this process, but users should independently check the scenarios that matter to them.

**Walk through workflows by role**

Prepare the application version, environment, accounts, and data to verify. Use accounts with actual business roles, not only administrators. Define the prerequisites, actions, and expected result for each scenario, then complete the workflow in its normal order, including page transitions and handoffs between roles.

For product management, record scenarios such as these. The table lists expected results; fill in actual observations after executing them:

| Role and prerequisite | Action | Expected result |
| --- | --- | --- |
| Signed-in editor | Create a product and reload | The product remains and is a draft |
| Editor with a draft product | Publish it, then open the public catalog | Its state is published and it appears in the public catalog |
| Signed-in read-only account | Open the product page and view records | Products are visible, with no create or publish controls |

Check that UI feedback matches the data, and use different accounts to confirm that visible records match their responsibilities.

Record the action, expected result, actual result, and pass or fail status for each scenario. When reporting an issue, include the application version, role, relevant data, and reproduction steps. Add screenshots or error details when needed so a developer can reproduce it.

**Check usability and error handling**

In addition to normal workflows, try likely user actions and interruptions:

| Scenario | What to check |
| --- | --- |
| Missing required fields or invalid input | Does the feedback identify the problem and explain how to fix it? |
| Canceling, going back, or revisiting a page | Is the state correct, and is unsaved input handled appropriately? |
| Repeated clicks or slow requests | Is there pending feedback? Are duplicate submissions or records prevented? |
| Retrying after a failed request | Is input retained, is the error understandable, and can work continue after recovery? |
| Required screen sizes or keyboard operation | Is content complete, and are focus order and controls usable? |

Reproduce failures and delays in a controlled test environment, for example using browser developer tools to adjust network conditions, then restore the settings. The example's deterministic failures and delays are controlled by automated cases; see [client tests](#client-component-interactions-and-state) and [Playwright tests](#automated-verification-with-playwright).

Ask actual users to check terminology, action order, and feedback against daily work. Add new findings to the test scenarios. Turn stable, repeatable checks into automated cases when they need to be run regularly.

After a fix, retest the original issue, the related normal workflow, and affected roles. When the application version, configuration, database, or browser environment changes, recheck key scenarios in the target environment and update the records.

## Example source and setup

The [product management example App](https://github.com/nocobase/docs-examples-v3/tree/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance) lives in `nocobase/docs-examples-v3`. Links on this page use the same fixed commit. Use Node.js 24 and pnpm 11.7.0:

```bash
git clone https://github.com/nocobase/docs-examples-v3.git
cd docs-examples-v3
git checkout 3e886903c7965530dd6ca50c7840d6ae991f2799
cd apps/testing-acceptance
pnpm install --frozen-lockfile
pnpm run setup
pnpm dev
```

Open the full application URL printed by the development command and go to **Products**. Use an editor or read-only account from `storage/demo.json`. `setup` preserves existing configuration and accounts; rerunning it does not reset data. Do not commit generated credentials, configuration, or databases.

As an editor, enter **Product name** and **Price in cents**, click **Create draft**, then click **Publish** in the row. The page shows the first 50 products. The public catalog shows only published products, HTTP CSV export follows the current account's data permissions, and CLI JSON export includes only public products. Data persists across reloads and restarts.

The [README](https://github.com/nocobase/docs-examples-v3/blob/3e886903c7965530dd6ca50c7840d6ae991f2799/apps/testing-acceptance/README.md) covers LAN access, deployment builds, all test commands, and the mapping between documented usage, source, and verification results. The example was tested with SQLite; other databases, browser engines, and multi-process operation were not verified. Dependency versions, execution records, and screenshot instructions are also recorded there.
