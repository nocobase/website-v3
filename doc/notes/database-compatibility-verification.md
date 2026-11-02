# Database compatibility documentation verification

## Scope and sources

Reviewed on 2026-11-01 for `core/getting-started/create-app` and `core/reference/compatibility` in Chinese, English and Japanese. The approved outline puts database support before configuration, database version limitations, runtime versions and deployment considerations. Article paths and menus are unchanged.

- Core: fetched `origin/v3-develop`, then inspected commit `09646a97a60ce0758b3635454cb483cb3f1a57c3`. The checkout at `/home/dev/NocoBase/nocobase` was on `fix/v3-embedded-app-manifest` with uncommitted changes, so it was not switched or merged. Reads used the fetched commit, not working-tree files.
- Commercial drivers: read the Dameng, KingbaseES and OceanBase READMEs through the repository API at `nocobase/nocobase3-pro` `develop` commit `8a2410fe860d8f269542d86a1d9d05249da83a60`. No private source links or implementation code were added to the public articles.
- Runtime driver list and loading: `packages/app/app-server/src/database/resolve-config.ts`; eight dialects, with optional Pro drivers requiring installation.
- Configuration: `packages/app/app-cli/src/commands/config/{init,check,set}.ts`, `src/lib/{config-init,database-config,commercial-database}.ts` and `tests/config-init.test.ts`; driver installation precedes initialization, interactive initialization prompts for connection settings, non-interactive initialization leaves placeholders, and connection checks do not run migrations.
- SQLite: `packages/libs/db-sqlite/src/index.ts` and `packages/templates/app-template-default/server/config/database.ts`; application configuration accepts `database` as well as `filename`, and resolves relative files under storage.
- Database versions: the PostgreSQL, MySQL/MariaDB, SQL Server and Oracle driver Docker Compose files. These define integration targets, not a complete supported-version range or evidence of a test run in this task.
- Feature restrictions: `packages/libs/db-mysql/README.md` for JSON filters and TEXT defaults; commercial driver READMEs for Dameng's experimental status, KingbaseES PostgreSQL mode and OceanBase's MySQL tenant and Repository-provided TEXT defaults.
- Runtime requirements: default-template and CLI package manifests; Node.js 24+, with pnpm selected from the application's `packageManager`.

## Validation scope

The initial documentation pass reviewed source without running database integration suites or application-level checks. The separately requested OceanBase runtime test is recorded below.

- `pnpm doc:test`: passed, 50 tests across 8 files.
- `pnpm doc:build`: passed, including internal links, anchors and search indexing.
- Confirmed that Bash command blocks and heading levels match across all three languages for both articles.
- `git diff --check`: passed.

The previous article recorded command checks on 2026-10-27 with default template beta.83, Node 24.21.0, pnpm 11.7.0, `@nocobase/db` 1.0.0-beta.22 and SQLite driver 0.1.0-beta.6. Its Core baseline was `015404ecd0dbed33cc46831f73907329c577d375` and commercial source baseline was `138665ffaaaa9e28596d85d4d329c05f78e641ac`. Those historical checks were not rerun or represented as new verification.

## Supplementary database creation guide

Added `core/getting-started/create-app-with-database` in all three languages after approval of its outline. It assumes supplied database connection details, with no dependency on Docker or a specific database hosting method. Each dialect has driver commands and a complete `database` configuration section; the surrounding instructions preserve generated secrets and distinguish an empty application database from connecting existing business tables.

Additional source reads at the same Core commit covered driver connection types and resolvers, `connectionEnvironment`, and the default template's database configuration. Commercial driver connection types, Dameng's resolver and `docs/database-drivers.md` were read at the same commercial commit. The examples use configurable service endpoints, database/schema/service names, account credentials and TLS options; no real external database credentials or services were used.

The `hidden` boolean belongs to a `page` entry in `meta.json`. Hidden pages retain content, section metadata, public routes, search, sitemap entries, Markdown copies and `llms.txt`; they are excluded from desktop/mobile sidebar links and previous/next navigation. All languages must agree on visibility. Hidden folder indexes do not create a folder-title link. Validation still rejects missing targets, duplicate registrations and non-boolean values.

- `pnpm doc:test`: passed, 54 tests across 8 files, including hidden page navigation, validation, language parity and `llms.txt` coverage.
- `pnpm doc:build`: passed with 595 pages and 629 search-index entries, including internal link and anchor checks.
- All eight database YAML blocks parse; YAML and Bash blocks are identical across the three translations. These are syntax and source-contract checks, not successful database connections.
- Checked generated HTML in all three languages: both parent articles link to the guide; desktop/mobile sidebars and pagination omit it; the guide has no previous/next navigation. Markdown output and `llms.txt` include the new page.
- The running documentation preview serves the Chinese guide with HTTP 200 through both its LAN URL and the temporary public tunnel; responses match. Temporary review addresses are not embedded in the articles.

## OceanBase creation prompt runtime test

On 2026-11-01 the user requested execution of the creation workflow for a local NocoBase 3 application using OceanBase, followed by its URL and initial login details. Executed the published creation Skill's procedure directly; this was not a separate-agent prompt evaluation. The creation Skill was read from `nocobase/skills-v3` at `834cb9b7fb649cfcbef78552ebd554a10954245d`, followed by the generated application's own AGENTS.md, development Skill and configuration references.

Environment and packages:

- Linux x64, Node.js 24.21.0, pnpm 11.7.0.
- Public npm: `@nocobase/create-app` 0.1.0-beta.34, default template 1.0.0-beta.86, `@nocobase/app-cli` 1.0.0-beta.31, `@nocobase/app-server` 4.0.0-beta.0, `@nocobase/db` 1.0.0-beta.24.
- Pro registry: metadata access and installation of `@nocobase/db-oceanbase` 0.1.0-beta.4 succeeded. This version satisfies the runtime's declared driver range and its database peer range.
- A separate Docker container used `oceanbase/oceanbase-ce:4.4.2-lts` with the upstream integration fixture settings, a MySQL-compatible test tenant and a newly created test database. Only a loopback host port exposed the database. SQL reported `5.7.25-OceanBase_CE-v4.4.2.1`.

Executed creation into a new temporary project with `pnpm create @nocobase/app@beta oceanbase-app --template-tag=beta --json`, then installed the commercial driver, ran `config init --dialect oceanbase --json`, set connection fields and loaded the fixture password through `config set --from-env`. No credentials are recorded here. No application business code or installed package code was patched, and no alternative database was substituted.

Results:

- Creation: `ok: true`; dependencies installed and project Skills synchronized.
- Configuration: `ok: true`; `config check --json` reported connection `main`, dialect `oceanbase`, status `ok`, with no findings or warnings.
- Development startup: ready in 16.3 seconds. Used the actual server port and `/main/` path printed by the development command, with the machine's LAN address and a matching configured public origin.
- Runtime schema: 53 tables in the OceanBase test database. A subsequent `db apply --dry-run --json` had no pending migrations or seeds.
- Page and health requests: HTTP 200; health returned `ok: true`.
- Default administrator login: HTTP 200 using the configured initial administrator and the intended browser Origin header. The session endpoint returned the same username; authenticated OpenAPI access also returned HTTP 200. Tokens and cookies were kept out of output.
- This test verifies startup and HTTP authentication. It does not exercise browser rendering, business CRUD, or the full database integration suite.

Observed package warnings:

- The registry returned a deprecated marker for `@nocobase/db-oceanbase@0.1.0-beta.4` ("Package no longer supported"). Installation and runtime checks still succeeded; this test does not establish why the package metadata contains that marker or remove it.
- `pnpm peers check` reported that Tiptap bubble/floating menu extensions 3.32.2 expect core/pm 3.32.2, while the template installs core/pm 3.30.2. No OceanBase peer mismatch was reported. Editor behavior was not tested and those dependencies were left unchanged.

The test project and logs were retained in an isolated temporary directory for review. It is not a maintained example app or a published demo, and no temporary URL is added to reader-facing documentation.
