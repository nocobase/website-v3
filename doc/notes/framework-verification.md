# Framework documentation verification

Verified on 2026-10-27. This record covers the 44 new Framework features topics in English and Simplified Chinese, plus navigation and overview integration. It does not assert that all framework implementations or supported deployment environments passed integration tests.

## Baseline

- Read-only Core source: `nocobase/nocobase` at `015404ecd0dbed33cc46831f73907329c577d375`. Public source links pin this commit.
- Isolated test workspace reuses dependencies from the previously created default-template beta.83 application; it does not change that application's source or data.
- Node 24.21.0, TypeScript 6.0.3. Existing compiler and tsx binaries were invoked directly, without changing dependency policy or installing new application packages.
- Installed packages: app-server 3.0.0-beta.3, app-client 4.0.0-beta.3, service-provider 0.0.2-beta.2, db 1.0.0-beta.22, db-sqlite 0.1.0-beta.6, jobs 0.1.0-beta.4, queue 0.1.0-beta.9, lifecycle/realtime/caching 0.1.0-beta.3, session 0.1.0-beta.3, secrets 0.1.0-beta.1, snowflake 1.0.0-beta.4, i18n 2.0.0-beta.1, document-extractor 0.1.0-beta.0, markdown-mermaid 0.1.0-beta.2.

## Example checks

Extracted all 42 TypeScript/TSX blocks from the English articles and checked them with strict TypeScript, NodeNext modules, ES2022 and React JSX. Host-provided `app`/`db` variables received ambient types, the jobs import used the preceding job block, and locale-loader examples received fixture locale modules. The English and Chinese code blocks were compared for parity. This verifies these examples against the installed contracts; `skipLibCheck` avoids rechecking dependency declarations.

Executed the following in an isolated harness using the extracted snippets:

- SQLite in-memory database: base schema, customer relationships, additional note migration, unchanged migration skips and rollback of the note migration. Verified Repository single-write result shapes, scoped filtering, pagination rejection and page totals, association-local filtering without removing empty parents, aggregation and grouping, serialized query builders, business-service reads, transaction rollback, post-commit failure reporting without undoing committed data, and seed history preventing duplicate execution.
- HTTP and services: container identity and duplicate binding rejection, Hono success and invalid-input responses with the host error handler, API Client envelope handling, and application configuration validation.
- Sessions and secrets: session persistence and removal, encryption/decryption, rejection with a different record binding, and decryption after retaining an old key during rotation. All keys were ephemeral test values.
- Background work: memory Job registration and execution, invalid payload rejection, schedule registration/start/shutdown, queue channel consumption and cleanup, and record-lifecycle guards and transitions. Cron firing over real calendar time was not exercised.
- Runtime support: cache load coalescing, TTL expiry and take; realtime user-topic subscription acknowledgement, anonymous refusal and authorized local delivery using fake sockets; filesystem write/read/delete in a temporary directory; distinct host-generated IDs; plain-text and minimal DOCX extraction plus output-budget failure; Mermaid code-block recognition.

Type checking caught a missing required schedule `payload`, which was added to both languages. Source review also clarified the jobs type import, numeric progress argument, encrypted session cookies, physical Query names, and connection-level transaction callback error handler.

The tests did not send real email, connect to Redis or cloud storage, exercise other database dialects, run real WebSocket proxy handshakes, verify Mermaid SVG rendering, or mount all React examples in a full application. Those topics were checked against their public contracts and source; deployment-dependent behavior still needs validation in its target environment.

## Documentation checks

- `cd doc && npm ci && node build.mjs`: successful; 272 pages, 136 in each language, with 90 Core pages per language.
- All 44 formerly planned Framework entries are registered pages. Framework also owns its overview and the existing shared ServiceProvider guide.
- Checked language-path parity, internal links, pinned source-file existence, source/code parity, generated HTML/Markdown files and whitespace.
- Previewed the framework overview and a nested database topic in the shared browser at desktop width; checked ancestor expansion and current-page highlighting. Also inspected the nested topic at 390 × 844 for mobile layout and code overflow containment.
- Build output remains ignored and uncommitted. No commit, push or publication is part of this verification.

## Repository data APIs follow-up

Added the shared `framework/http/repository-routes` topic in both languages on 2026-10-27, bringing the framework to 45 topic articles plus its overview and shared ServiceProvider guide. The public API in the pinned source and installed package is `defineRepositoryApiRoutes`, exported from `@nocobase/app-server/router`.

- Extracted all three new TypeScript examples, checked English/Chinese code parity and compiled them with the existing strict TypeScript setup.
- Ran the extracted declarations and client function against Hono and SQLite in memory. Verified the exact serialized request example, exposure names versus Collection names, explicit action registration, read-field allowlists, default/max/zero pagination, missing records, malformed JSON, content type and body-size errors.
- Verified missing-principal refusal, owner-scoped reads and updates, rejection of hidden-field filters and caller-supplied ownership, server-provided creation defaults, mutation return shapes and NDJSON iteration. Identity was supplied by an isolated test resolver; no real authentication provider or authorization-plugin administration flow was exercised.
- Validation corrected the client selection example to use the supported selection builder and documented that an excessive limit is rejected, not clamped. The HTTP example matches the resulting JSON AST.
- Checked the sidebar entry and article in the shared desktop preview. Both app and plugin guides, the HTTP and database topics, framework overview and API reference link to the new page.
- `cd doc && npm ci && node build.mjs` succeeds with 272 pages (136 per language, 90 Core pages per language). Generated output remains ignored.

## Upstream Astro migration reconciliation

Merged upstream `c44264d0` and restored the in-progress documentation on 2026-10-27. Markdown now lives in `doc/content/`; bilingual `meta.json` files replace `SECTIONS` in the removed `doc/build.mjs`.

- Compared all 148 locally edited or new article bodies and titles against the pre-update backup: unchanged. Migrated 34 sidebar labels from `nav` front matter into menu entries.
- Compared both Core menu trees against the saved outline: identical page order, seven topic groups, nested groups and planned entries. Each language still contains 90 Core pages, including the merged frontend/Registry article and Repository data APIs.
- Retained the new Astro shell and ported folder-state persistence, current-page ancestor expansion, keyboard focus and planned-label wrapping to it. Removed the obsolete builder and browser-script conflict copies.
- `pnpm install --frozen-lockfile`, `pnpm doc:test` (41 tests), `pnpm doc:build`, `pnpm homepage:test` (34 tests) and `pnpm homepage:build` succeed. The docs output contains 272 content pages plus the 404 page; the website build contains 591 pages.
- Verified the new preview at port 4321, sidebar labels and expansion persistence across navigation, and Pagefind results for `defineRepositoryApiRoutes`.
- Local document work remains uncommitted; the update itself is recorded by a merge commit. The pre-update stash and filesystem backup are retained.

## Focused Framework structure and host integration

Updated on 2026-10-28 against the read-only Core checkout at `7fb8311d89fb59468d9fac3d6263c3379c8c6083`.

- Framework now has 36 pages per language under `core/framework/`, plus the shared ServiceProvider guide. Core has 102 pages per language. The menu has 12 direct entries, covering the overview, runtimes, dependency injection, HTTP, database and the priority packages.
- Nine articles per language were moved to unpublished drafts: configuration, localization, sessions, authorization, secrets, record lifecycle, email, document extraction and Markdown/Mermaid. Live links and the Core landing pages were updated. Client and server service articles were merged into `services/integration.md`; four bilingual old URLs have static HTML redirects.
- Extracted 12 TypeScript examples from caching, drive, jobs, scheduling, queues, realtime, logging, IDs and the combined service article into an isolated fixture. English and Chinese TypeScript/TSX blocks match. Strict TypeScript checking passed with ES2022, Bundler module resolution, React JSX and `skipLibCheck`, using dependencies from the source checkout without installing or modifying application packages.
- Eight runtime tests passed: shared cache load coalescing and invalidation; default filesystem write/read/delete in a temporary directory; actual memory Job execution; schedule registration with timezone and shutdown; queue publication, consumption and consumer cleanup; user-topic delivery isolation, anonymous refusal and topic cleanup through fake sockets; shared ID generation and clock rollback; client service registration, stable shared state and unsubscribe behavior.
- These checks exercise extracted helpers with real package instances bound to a test container. They do not establish full application/plugin startup, browser component rendering, real WebSocket transport, Redis, cloud storage or calendar-time Cron execution. Logging was type-checked; this follow-up did not retest rotation. Database code was unchanged; resource ownership and guide links were clarified.
- `pnpm doc:test` passed all 41 tests and `pnpm doc:build` passed, producing 296 Markdown copies and 297 content/404 pages, plus static redirects. Checked both language menus, live HTTP pages, old service redirects, new section anchors, and the absence of draft pages from generated content, sitemap, `llms.txt` and decoded Pagefind fragments.
- The prior development process returned HTTP 500 after the structure changes. Restarted port 4321 with `pnpm doc:preview`; the rebuilt Framework overview returns HTTP 200 on localhost and the LAN address.

The fixture and its logs remain outside the repository under `/tmp/nocobase-framework-focused-examples` and `/tmp/framework-*.log`. Build output is ignored. This update does not commit or publish the local work.
