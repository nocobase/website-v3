# Frontend components tutorial verification

Verified the full workflow on 2026-10-27 using two independent temporary applications created from public npm packages. Neither App used a NocoBase source checkout or linked source-repository dependencies. Each had its own dependency install, SQLite configuration and runtime storage. English and Chinese executable example blocks match.

## Versions and test setup

| Tool or package | Verified version |
| --- | --- |
| Node.js | 24.21.0 |
| pnpm selected by generated Apps | 11.7.0 |
| `@nocobase/create-app` | 0.1.0-beta.34 |
| `@nocobase/app-template-default` | 1.0.0-beta.83 |
| `@nocobase/create-plugin` | 0.1.0-beta.26 |
| `@nocobase/app-client` | 4.0.0-beta.3 |
| `@nocobase/app-server` | 3.0.0-beta.3 |
| `@nocobase/app-cli` | 1.0.0-beta.29 |
| `@nocobase/app-skills` | 0.1.0-beta.53 |
| `@nocobase/dev-config` | 0.1.0-beta.25 |
| shadcn in generated Apps and plugins | 4.23.0 |
| shadcn pinned in the Registry package | 4.18.0 |

The test shell used pnpm 11.28.5 to launch creation; generated Apps selected their declared pnpm 11.7.0. Creation used public npm, with `NOCOBASE_REGISTRY` unset and `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` scoped to the test invocation to resolve the current beta. An invocation without that release-age override resolved create-plugin 0.1.0-beta.24 and failed looking for `packages/plugins`; the current beta's dry run and creation succeeded. These overrides are test setup, not a recommendation to change global package-manager policy.

## Author App and plugin

1. Ran `pnpm create @nocobase/app@beta author-app --template-tag=beta --json`; creation and installation succeeded. Initialized SQLite through `pnpm nocobase config init --dialect sqlite --json` and passed `config check`. Read the generated App's AGENTS and version-matched App and plugin Skills.
2. Previewed and ran `pnpm create @nocobase/plugin@beta announcements --with client.routes --with client.locales --with server.routes --json`. It created `packages/app-plugin-announcements/`, added the workspace dependency and installed it.
3. Extracted the actual first-plugin tutorial code blocks: shared type, public API and schema, authenticated page and menu, English/Chinese resources, and API/route/page tests. Preserved the remaining generated declarations and server test. This reproduces the tutorial's two-language example, not a separately published ten-language plugin.
4. Installed `@nocobase/page-container`, `@nocobase/page-header` and `card` with the real shadcn CLI and public registries. Reconciled Client runtime peers and reinstalled from the App root.
5. Extracted `AnnouncementList` and the page integration from the frontend-components article. The initial plugin check reported seven `TS9007` errors in generated Card functions. Added `React.ReactElement` return types to those exports while preserving their bodies, as the article now explicitly describes.
6. Passed formatting, lint, typecheck, **4 test files / 6 tests**, and declaration build. Tests cover the public router, response/documentation contract and unsupported writes, menu declaration, API-fed rendering, empty results and failure feedback.
7. Previewed and applied `pnpm nocobase plugin register @nocobase/app-plugin-announcements --no-install --json`, then started the App on an unused test port with a matching public origin.
8. In the collaborative browser, verified anonymous navigation redirects to login, signed in with the dedicated scratch App's initial test account, opened the announcements menu, and checked the real API response and Card. Switched English to Chinese and reloaded the direct page URL: the menu and heading became `公告栏`, while server data remained unchanged. Authenticated Swagger included `GET /api/announcements`, operation `announcementsList` and its explicit public security declaration. A separate request without cookies returned the public announcement.
9. Passed the complete author App `pnpm build`, including workspace plugin compilation, client/server checks, frontend assets, production dependency installation and deployment dependency verification.

## Independent Registry and receiving App

1. Extracted the article's manifest, `registry.json` and component into `author-app/packages/announcements-ui/`, alongside the runtime plugin. The asset imports React and the receiving project's Card alias, with no private plugin imports.
2. Ran `pnpm --filter announcements-ui build` with pinned shadcn 4.18.0. Confirmed the generated item embeds source content, declares `card`, and targets `client/components/announcement-list.tsx`. Added and verified `check: pnpm build` for App workspace-check compatibility; the verified manifest matches the article.
3. Created a second App with the same public create-app workflow. From its root, ran `pnpm exec shadcn add ../author-app/packages/announcements-ui/public/r/announcement-list.json`. The CLI created the App-owned component and preserved the existing Card after declining overwrite. **No HTTP server, dependency fixture or linked source dependency was used.**
4. Created a Client plugin, `announcement-preview`, in the receiving App using create-plugin's `client.routes` capability. Installed the same item with `pnpm --filter @nocobase/app-plugin-announcement-preview exec shadcn add <absolute-item-path>`. Its component and missing Card were generated inside the plugin. Reconciled peers and Card annotations as documented.
5. Added small test-only pages supplying data and empty text to the two installed copies, and registered the receiving Client plugin. Its formatting, lint, typecheck, **2 test files / 3 tests**, and declaration build passed. Tests exercise the lazy page loader and populated/empty rendering.
6. Passed the receiving App's complete `pnpm typecheck` and `pnpm build`. In the collaborative browser, the App page rendered supplied content and a Chinese empty state; the plugin page rendered its own supplied data. The receiving App has no announcements backend and its `/api/announcements` returns 404, confirming source installation does not install that backend.

## Changes resulting from verification

- Replaced the Python static-server step with built-item JSON installation, including same-workspace and sibling-App examples. Filtered plugin installation uses an absolute asset path because pnpm changes the working directory.
- Retained URL distribution as an optional step using existing static hosting. Clarified that local-path installation may still fetch Registry and npm dependencies.
- Updated Agent prompts and Skill instructions to use local assets without a publication prerequisite. Checked the pinned shadcn schema: the root manifest requires `homepage`, but that metadata does not select the asset installation address. Rebuilt with a generic project-homepage placeholder instead of a dedicated Registry domain.
- Made the seven Card return annotations and Registry package `check` script explicit.
- Added the old-generator `packages/plugins` error to both create-plugin troubleshooting tables.

## Sources and earlier checks

Package contracts were originally checked against `packages/tools/create-plugin/` and `ui-library/USAGE.md` in the local Core checkout at `015404ecd0dbed33cc46831f73907329c577d375`; the full run also checked installed public packages. Registry semantics were checked against official shadcn [Registry Item](https://ui.shadcn.com/docs/registry/registry-item-json), [getting started](https://ui.shadcn.com/docs/registry/getting-started) and [CLI](https://ui.shadcn.com/docs/cli#add) documentation.

Earlier focused checks covered HTTP installation with a local Card fixture, standalone declaration output and React DOM rendering. The full App workflow above supersedes their earlier integration limitation. Filesystem installation is now the tutorial's default.

## Scope and observations

This run covers creation, installation, registration, authentication, real API/browser integration, language switching, local Registry installation into both destinations, declaration generation and complete App production builds. Empty and failure states were checked in component tests; real browser checks used successful API data and a receiving page with an empty list.

The beta template emitted a React script-tag warning on the login page before the announcement page loaded, and again on receiving pages. Test setup reported a missing source-map source from installed dev-config. Builds emitted large-chunk and peer-dependency warnings but completed successfully. These observations were not fixed in this documentation task; the run was not warning-free.

Ran `npm ci` and `node build.mjs` in `doc/`: **164 pages generated, 82 per language**. Confirmed matching executable examples across languages and checked the rendered Chinese page, including the local-path commands and removal of the Python server step. `git diff --check` passed.

No npm package or UI asset was published externally, and production distributions were not deployed to a production server. Test Apps and logs remain outside the repository. Generated `doc/dist/` output is not committed.
