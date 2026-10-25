---
title: Testing and acceptance
description: Choose tests for databases, APIs and pages, then verify business outcomes with real permissions and browser flows.
---

Tests should establish business behavior: data persists, invalid input does not write, permissions cannot be bypassed, and users can recover after failure. Types and builds prove only part of that; they do not replace real database and interaction checks.

This guide uses the published-npm example from [Build your first app](../tutorials/build-your-first-feature.md): default template `1.0.0-beta.81`, the `tasks` API, and its test layout. The historical project chapters use different tables and test configuration; follow their documented baseline when running those examples.

## With an agent

```text
Check task persistence, role permissions, and page interactions, and add any missing automated tests.
Use separate test data, preserve existing business data, fix issues you find, and report what passed and what remains unverified.
```

## Without an agent

### Choose a layer by behavior

| Behavior to prove | Appropriate test | Insufficient substitute |
| --- | --- | --- |
| Pure calculation or transformation | Unit test | Starting the whole app without checking edge cases |
| Fields, constraints, relations, transactions | Real test database | Mocking Repository return values |
| Migration preservation and intended rollback | `describeMigration()` | Importing the file or testing only an empty database |
| Authentication, authorization, validation, persistence | Real application endpoint test | Calling a function that bypasses middleware |
| Forms, loading, errors, retries | Actual component in an application test environment | Replacing API, translation and permission hooks wholesale |
| History, focus, cross-page flows | Browser test | Asserting layout positions in jsdom |

Use the smallest layer that proves the behavior. Authorization and persistence need real services. Controlled network failures can use a transport fixture in component tests, but those tests do not prove server authorization.

### Organize files and environments

Place business tests under `tests/`, organized by the code they verify:

```text
tests/
├── cli/          # Application commands (when needed)
├── client/       # Pages, components and client behavior
├── database/     # Repositories and migrations
├── fixtures/     # Test data and fixture resources
├── helpers/      # Shared test helpers
├── playwright/   # Browser flows against a running app
├── project/      # Configuration, source rules and builds
├── server/       # APIs, services and permissions
└── setup/        # Test environment setup
```

The current template defines two projects in `vitest.config.ts`: `node` discovers tests under `tests/{server,database,cli,project}/`, and `client` discovers `tests/client/` with its React/jsdom environment. `tests/playwright/` uses a separate Playwright configuration. Preserve aliases, setup, and database isolation; creating a directory alone does not configure test discovery.

Run from the application directory:

```bash
pnpm test
```

This runs the Vitest projects, not browser tests. Older applications may use `tests/logic/`, `tests/components/`, or `vitest.tutorial.config.ts`; follow their version-specific configuration and reconcile discovery rules when upgrading the template.

### Choose real database and application fixtures

Common `@nocobase/app-testing` entries are `/server`, `/client` and `/cli`; there are no separate `/database` or `/playwright` exports.

| Tool | Use | Considerations |
| --- | --- | --- |
| `createDatabaseTest()` | Repositories and transactions without application startup | Supply migrations; plugin Providers are not automatically composed |
| `describeMigration()` | Apply, roll back and reapply | Verify old data; do not edit merged migrations |
| `createAppTest()` | Actual routes, plugins, sign-in and authorization | Isolated storage; normally one app per test file |
| `createTestApp()` | Manually controlled application lifecycle | Close in `finally` |
| `renderWithApp()` | Components using real application client services | Keep hooks, routing and translations real; control necessary transport boundaries |

Database fixtures select the dialect through `NOCOBASE_TEST_DB_DIALECT`, defaulting to SQLite. Do not hard-code `:memory:` or a driver to bypass fixtures. Use `expectCollection()` for schema assertions instead of dialect-specific internal tables.

For production database constraints, queries or performance, test the target database with representative data volumes. Small SQLite cases do not establish execution plans or performance on another database.

### Verify persistence through the real API

This minimal example can go in `tests/server/tasks-persistence.test.ts` once task endpoints exist. It starts the application, signs in through the real route, creates a task and rereads it instead of mocking database results:

```ts
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'tutorial-test-secret-at-least-32-characters',
      advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
    logging: { enabled: false },
  },
});

test('persists a task through the real API', async ({ testApp }) => {
  expect((await testApp.request('/tasks')).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const title = `Persistence ${randomUUID()}`;
  const created = await admin.fetch('/tasks', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify({ title }),
  });
  expect(created.status).toBe(201);
  const { data: task } = (await created.json()) as { data: { id: string } };

  const list = await admin.fetch(`/tasks?q=${encodeURIComponent(title)}`);
  expect(list.status).toBe(200);
  expect(await list.json()).toMatchObject({
    data: expect.arrayContaining([
      expect.objectContaining({ id: task.id, title }),
    ]),
  });
});
```

The fixed secret and administrator credentials belong only to this isolated test configuration. The fixture handles requests in process without opening a browser-accessible port. If `tests/server/tasks.test.ts` already covers this behavior, extend it instead of duplicating the example.

This establishes signed-out denial and administrator persistence, not ordinary-user data scopes. Create separate users and explicit roles, sign in through the real service, exercise allowed and denied requests and inspect database state after failure.

### Verify migrations and transactions

Apply historical migrations and insert an old task before testing the new migration. Check preserved fields, defaults and constraints, then roll back and reapply as designed. See [Data models and migrations](data-models-and-migrations.md) for complete code. Data dropped by `down()` is not restored automatically; explicitly verify the intended loss.

For transactions, write first, trigger a subsequent failure, then reread outside the transaction to prove earlier writes rolled back. An exception assertion alone does not establish that no partial data was saved.

### Verify components and interactions

Import real pages or components and provide client services with `renderWithApp()`. Preserve translations, the API client, routing, and permission hooks. In the current example, `tests/client/tasks.test.tsx` uses `tests/helpers/authenticated-client.tsx` to connect to a real test application, database, and login session. The template's `tests/client/page-harness.test.tsx` demonstrates general page-testing helpers.

Use `answerApi()` when pending requests, network failures or retries require controlled HTTP responses. Supply missing jsdom capabilities such as `ResizeObserver` at that boundary, but verify layout in a real browser. Do not replace the business behavior under test.

Assert user-visible behavior: field errors and focus, retained input, duplicate-submit prevention, retries and list updates after success. Internal call counts and whole-page snapshots alone are poor acceptance criteria.

### Verify browser flows and permissions

Start a separate test application and use its own test administrator account:

```bash
pnpm exec playwright install chromium
TUTORIAL_ORIGIN=http://127.0.0.1:13000 \
TUTORIAL_USERNAME='your-test-admin' TUTORIAL_PASSWORD='your-test-password' \
pnpm test:e2e
```

The current `tests/playwright/tasks.test.ts` uses English UI. `TUTORIAL_ORIGIN` contains only the scheme, host, and actual port; the script appends `/main`. It differs from the historical project example's `APP_URL`. If you change the application base path, update the test script as well. Install Chromium only before the first run.

Tests create users and tasks, and some accounts remain. Do not target production or put credentials in source, screenshots, or reports.

Acceptance includes:

- Authorized operations still have correct results after refresh or rereading.
- Page-only access does not authorize business API calls.
- Business-action-only access does not grant page entry; direct API results follow business permissions.
- Out-of-scope tasks and projects are not disclosed, including through list totals.
- Direct and inherited grants of the ordinary account are inspected so another role does not conceal a denial defect.
- Pending submission, network failure, deleted records, revoked permissions and browser Back receive appropriate behavior.

For permission initialization changes, also run `tests/server/authorization-assignment-safety.test.ts` against the isolated application's actual initialized grants. It does not replace per-operation authorization tests.

## Scope checks to the change

For task endpoint changes, start with server tests. For page interaction changes, add client and browser tests:

```bash
pnpm test --project node tests/server/tasks.test.ts
pnpm test --project client tests/client/tasks.test.tsx
```

Format and lint changed files and select the owning TypeScript project. Check build output and runtime paths when bundling, migrations or deployment change. Do not mechanically run full-application `pnpm check` after every small edit, or report zero tests, skipped tests or missing environments as passing.

## Record acceptance evidence

Record scope, commands and results, roles and workflows actually exercised, and unverified cases with reasons. Screenshots explain interfaces; assertions establish behavior. Routine tests should not merely save screenshots without judging outcomes.

Documentation edits normally need formatting, links and the documentation site's build. When application code is unchanged, repeating every business test adds no evidence. Expand verification for new changes, failures or concrete uncovered concerns.
