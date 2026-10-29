# Agents plugin guide: fresh application verification

Date: 2026-10-29. Bilingual page: `core/using-plugins/agents-and-knowledge/agents.md`.
This record supersedes the earlier `agents-doc-demo` run and screenshots. The old
application was not modified or used as the test database.

## Environment and source

Created `/home/dev/NocoBase/docs-examples-v3/apps/agents-guide` through the public
create-app CLI, initialized fresh SQLite, registered Agents on all three sides,
previewed and applied migrations. App: `http://192.168.50.82:13130/main/`, matching
public origin, listening on `0.0.0.0`, default locale `en-US`.

- Node 24.21.0; pnpm 11.7.0; create-app 0.1.0-beta.34.
- Default template 1.0.0-beta.84; Agents 1.0.0-beta.29.
- DeepSeek `https://api.deepseek.com/v1`; live discovery returned `deepseek-flash`
  and `deepseek-v4-pro`, with only Flash enabled.
- Application CLI client 0.1.0-beta.17; Runner 0.1.0-beta.20;
  Codex 0.165.0, actual Runner model `gpt-6-astra`.

Source is prepared under the example repository's `apps/agents-guide` directory.
No published example commit is claimed. Until it is published, the existing
`public/assets/core/downloads/agents-doc-demo.zip` URL remains the source download;
its root directory and README now describe `agents-guide`. Do not invent a commit
link or replace deprecated repository URLs in unrelated guides.

## Actual walkthrough

1. Created and configured the independent app, retained original home/authentication
   and registered prepared user/permission administration. Composed five public
   Agents routes, Registry chat UI, translations, and account-keyed ChatProvider.
2. Signed into the fresh test account. Read the live authenticated OpenAPI before
   using its APIs. Model key was received privately and used through the model API;
   the database stores it encrypted. UI Fetch models and Test connection succeeded:
   `Connected: deepseek-flash answered.` Key field stayed empty in screenshots.
3. Sent the documented writing request through the real composer, received DeepSeek
   output, reloaded the application, and reopened saved history. Saved execution
   was idle/completed. The first prompt produced an incorrect configuration claim
   from page context; the revised supplied-facts prompt produced the three requested
   bullets. This is model behavior, not evidence of missing model configuration.
4. Used **Skills → Import** with the provided ZIP. Verified slug `release-notes`,
   `SKILL.md`, `references/style.md`, and version 1. Global attachment remained off.
5. Used the new **Draft release notes** header button to create a native conversation
   with scope `release-notes`. It selected the configured chat model and opened the
   composer. Sent the supplied release-note facts and 17-test writing material;
   output used Summary, Changes, and Verification without additional test claims.
6. Read original assistant parts with a read-only SQLite connection; no table writes.
   In conversation `394798229880832`, assistant `394798280212481` contains successful
   `tool-skill` with `{ name: 'release-notes' }`, `tool-bash` with
   `ls -R /skills/release-notes/`, and
   `cat /skills/release-notes/references/style.md`. All are output-available/ok true.
   Default public history omits these native raw tool parts, so an answer screenshot
   alone is not used as proof of Skill execution.
7. Connected a real personal Runner with an isolated local registration directory
   under ignored `storage/runner`, one slot and Codex selected. It reported online,
   authenticated, and eight available model choices. No recommended agent was
   automatically enabled; explicitly added an available combination.
8. Switched the real chat UI to Runner agents and sent a read-only workspace request.
   Initial run `394798607368194` failed preparation with `cliUnavailable`: the
   default CLI name `main` was not installed or served. Used UI Stop to cancel the
   retrying run and confirmed idle state. This tests queued Runner cancellation,
   not native model streaming Stop.
9. Added the application's own CLI declaration and matching server config section,
   built both universal distributions, restarted, and verified that both products
   resolve through the live distribution endpoint. Retried in the same conversation.
   Run `394799878242305` completed with actual model `gpt-6-astra`. Saved tool output
   confirms `pwd` and `ls -A1` in the conversation's `chat-394798607368192.task`
   directory. The directory was empty. No source project was attached, no source
   files were changed, and no project build/test was executed by the machine Agent.

## Problems found and changes

| Finding | Change or boundary |
| --- | --- |
| Registry installation downgraded Agents to 0.1.0-beta.14, incompatible with current chat integration | Restored 1.0.0-beta.29; put version/lockfile inspection and correction beside the install command |
| Imported Skill did not imply selection in ordinary chat; guide required an authenticated API detour | Added translated Draft release notes entry; documented separate scope, fresh conversation behavior, prerequisites and error handling |
| Plugin child pages lacked readable permission labels | Added labels for skills-new, skills-detail, runtimes-connect without changing authorization IDs |
| Template route test assumed a bare app | Updated exact expected grants and unique registration checks for the integrated app |
| Model inferred incorrect configuration from empty page context | Rewrote the writing prompt to use supplied facts; document that model assertions do not verify configuration |
| New app served no Runner distribution (404) | Added compatible dependencies and documented both universal distribution builds |
| Online Runner could not prepare work because application CLI was absent | Declared nocobase.cli.bin and matching agents.cli.name with served package; tested real retry |
| config set rejected agents.cli.name with UNKNOWN_KEY | Added server/config/agents.ts and registered it in index; documented that this section is required |
| Runner conversation starts in its own workspace, not app source | Added a read-only workspace check and clearly separated later project-context integration and code edits |
| A pending business-entry request could outlive account teardown | Abort and ignore async requests after unmount; component regression test |

The original React script-tag diagnostic on the default login page is baseline.
Published packages also emit missing sourcemap warnings during tests. During the
CLI dependency install, the running development watcher briefly failed to resolve
a moved package; it was restarted after installation. This is not reported as a
model or Skill failure. Two preview Full width ref-click attempts timed out;
a DOM click in the same preview tab opened it. No alternate browser was used.

## Screenshots and archives

All six original screenshots were retaken from the fresh English application.
Two additional screenshots show the real Runner connection and task. Captured
viewport was 1440 × 1000; the preview tool saved PNGs at 1280 × 889. Images are
unmodified captures, not generated UI or edited model results.

- `public/assets/core/agents/models.png`: enabled model service.
- `model-configuration.png`: write-only key field and successful live test.
- `chat.png`: revised prompt and actual three-bullet response.
- `skill.png`: imported instructions, support file tree and version.
- `skill-chat.png`: actual business conversation in expanded chat.
- `runner-connection.png`: setup form before generating a one-time token.
- `runner-online.png`: personal runtime with signed-in Codex.
- `runner-chat.png`: real command output and final response after retry.

A 390 px light chat panel and a dark Runtimes page were additionally inspected;
these are local acceptance evidence, not a full mobile/theme matrix. English
screenshots are shared by both language pages.

Source ZIP uses an allowlist of source directories and root files. Excluded:
`config.yml`, `.env*`, `storage/`, databases, dependency directories, generated
collection caches, built output, synchronized Skills, private scripts, tokens and
sessions. `config.example.yml` is the template, not the local config. The separate
Skill ZIP contains the same two files imported during verification. Source README
covers versions, setup, model configuration, Skill import, Runner builds, code map,
checks and limitations. Template notes are `TEMPLATE.md` to avoid two README names
that differ only by case.

## Checks and limits

Passed:

- Client TypeScript, server TypeScript, tooling TypeScript; scoped ESLint and
  formatting. Tooling tsconfig does not include Vitest test sources.
- Four client test files, 23 tests: route loading, registration and exact grants;
  locale coverage; permission names; six business-entry tests (correct scope/model,
  pending duplicate prevention, no model, failed creation/retry, denied permission,
  no stale creation after unmount). Tests use real app/i18n/authorization/chat
  providers and deterministic API fixtures, not a mocked external-model transcript.
- Configuration check, migration preview/apply, actual model/Skill and Runner
  operations above. Both CLI/Runner universal builds and live product resolution.
- Anonymous model-service and Skill requests: HTTP 401.

Not verified: full `pnpm check`, production application build/deployment, complete
role matrix, browser multi-account switching/cross-owner conversation access,
Chinese IME/middle editing, full language/mobile/theme matrix, native streaming
Stop, business writes, attachment parsing, source-project editing/builds, other
model providers and multi-instance behavior. Scope/button permissions do not
replace server authorization. Prompts and Skills are not a sandbox or correctness
guarantee.

The configured model service, imported Skill, demonstration conversations, personal
runtime and enabled Agent remain as local test data. Their secrets and database
are excluded from the public example and download. Runner shutdown and any
remaining review findings are recorded with the final handover.

## Review and final documentation checks

Independent acceptance review inspected all ten local screenshots, the changed
integration code, the design/run record and 22 guideline checklist items; it also
ran two client suites independently (11 tests passed). The review requested visible
pending feedback and a recheck of focus from a covering Skill detail. Added the
shared Spinner, retained the accessible button name, and added its deferred-request
assertion. Six button tests passed again; scoped lint passed after correction.
The covering-detail recheck confirmed a focused TEXTAREA once the created
conversation loaded; the earlier header-focus observation was intermediate.
Application-owned shell rules now describe the shared identity-bound chat lifetime.

The broader acceptance matrix listed above remains unverified. This is a completed
documentation walkthrough with explicitly bounded evidence, not full application
security or production acceptance.

Documentation checks: `pnpm doc:test` passed (7 files, 41 tests), `pnpm doc:build`
passed (339 pages at that run), and `git diff --check` passed. Archive allowlist and
exact credential-content scan passed; the separate Skill archive matches its
imported source. Build page count can change with concurrent documentation work.

Handover: the application remains running on port 13130. The temporary verification
Runner was stopped after its completed task; no system service was installed or
existing Runner registration changed. Its saved entry will become offline after
heartbeat expiry. To resume only this example's Runner, from the example directory
run `NOCOBASE_RUNNER_HOME="$PWD/storage/runner" nocobase-runner start`.
Local review working files were removed after the findings were incorporated here;
local acceptance screenshots remain under `storage/ui-workflow/agents-guide/`.
They can be removed with `rm -r storage/ui-workflow/agents-guide` from the example
application. Public documentation screenshots are separate and remain available.
