# Agents plugin guide: live verification

Date: 2026-10-29. The public bilingual page is
`core/using-plugins/agents-and-knowledge/agents.md`.

## Scope and environment

An independent application was created with the public create-app CLI in
`/home/dev/NocoBase/agents-doc-demo`, using SQLite in `storage/database.sqlite`.
No NocoBase source-workspace application or existing database was reused.
The App runs at port 13120, with its `/main/` base path and a matching LAN
`app.publicOrigin`. The documentation repository contains source downloads and
screenshots, not the running database or private configuration.

- Node.js 24.21.0, pnpm 11.7.0.
- `@nocobase/create-app`: 0.1.0-beta.34.
- Default template: 1.0.0-beta.84.
- `@nocobase/app-plugin-agents`: 1.0.0-beta.29 after the Registry correction below.
- DeepSeek provider, `https://api.deepseek.com/v1`, `deepseek-flash`.
- Model discovery returned `deepseek-flash` and `deepseek-v4-pro`; only Flash was enabled.

The guide has four chapters: capabilities, scenarios and examples, key principles
and implementation, and AI development constraints and verification. The
capability overview includes both connection methods; model configuration and
machine connection steps sit with the corresponding scenarios. Implementation
maps source changes to UI behavior. The final chapter focuses on Agents-specific
boundaries and checks, linking to the general Agent development workflow.
Development prompts and in-application conversation prompts are labeled separately. The machine-coding scenario is
integration guidance, not a claim of executed Runner work. Implementation follows
the source download, and reliability guidance distinguishes code-level boundaries
from checks actually performed; no automatic code review or sandbox guarantee is
attributed to the plugin.

## Executed

1. Created the default App, initialized SQLite configuration, checked configuration,
   registered Agents in Client/Server/CLI, previewed and applied migrations.
2. Composed the five exported pages, enabled prepared user/permission management,
   installed the public `agent-chat` Registry block, and mounted the identity-keyed
   provider, panel, launchers, and English/Chinese translations.
3. Signed in to the new example account with the user's explicit authorization.
   Retrieved the running authenticated OpenAPI document before using APIs.
4. Read the DeepSeek model list with the privately submitted credential. Created
   the encrypted model service through the authenticated API. Both API and UI
   connection checks returned success; the UI displayed
   `Connected: deepseek-flash answered.`
5. Sent the short demonstration prompt through the browser's actual composer.
   Received a real response and inspected saved history and completed execution.
6. Created `release-notes` with `SKILL.md` and `references/style.md` through the
   public Skill API. Registered the named `release-notes` native scope in the
   application's Provider, selecting only that slug through the public Skill service.
7. Created a conversation explicitly selecting that scope through the authenticated
   API, sent the supplied release-note facts, then reopened the real conversation
   in the browser. The service reported `idle` / `completed` and retained messages.
8. Inspected the stored original assistant tool parts with a read-only SQLite
   connection to verify execution, rather than trusting the model's assertion:
   `skill({ name: 'release-notes' })`, `ls -la /skills/release-notes/`, and
   `cat /skills/release-notes/references/style.md` all completed successfully.
   No plugin table was written directly. Raw default tool parts are omitted from
   public history by the current projection rules; screenshots show the public answer.
9. Inspected the Runner connection form without generating a registration token
   or connecting a machine.

The release-note prompt supplied a test count as sample input. The model did not
run the tests; the application route and locale checks were run separately.

## Artifacts

Six unmodified screenshots were saved from the live browser at 1440 × 1000:

- `public/assets/core/agents/models.png`: saved, enabled DeepSeek service.
- `public/assets/core/agents/model-configuration.png`: write-only credential field
  and successful connection test; no credential is visible.
- `public/assets/core/agents/chat.png`: actual browser-submitted chat and reply.
- `public/assets/core/agents/skill.png`: Skill body, file tree, and version.
- `public/assets/core/agents/skill-chat.png`: live model output after Skill reads.
- `public/assets/core/agents/runner-connection.png`: actual connection form before
  generating installation credentials.

Downloads are assembled from an allowlist of source directories and root files.
Exclude `config.yml`, `.env*`, `storage/`, dependency directories, generated
collections, build output, synchronized Skills, and sign-in cookies. The Skill
archive contains the same instructions and supporting file as the example.
Rebuild both archives when the corresponding source changes.

## Compatibility findings

The public Registry installation replaced the template-compatible Agents dependency
with 0.1.0-beta.14. Restoring the explicit 1.0.0-beta.29 dependency and synchronizing
Skills produced the verified setup. The public guide records this observed caveat;
it does not recommend an indefinite version pin.

The installed Registry block already had a narrow `react-hooks/static-components`
exception for selecting pre-registered tool renderers. The template also enables
`@eslint-react/static-components`, which flagged the same selection. The App copy
names both rules in that existing exception after confirming `useAIToolRenderer`
only looks up a component in context; it creates no component during render.
No runtime rendering behavior was changed.

Installed guidance contains older statements: its main Skill says native bash and
Skills are opt-in, while the installed native-sandbox guide and implementation enable
them by default; model-services.md still says Agents do not use model services.
The page follows the installed runtime and verified named-scope behavior.

A React script-tag diagnostic was present on the template login screen before any
Agents page loaded. It was not produced by a model operation. Startup also reports
single-process memory-job warnings and a deprecated plugin `queue.jobs` contribution;
this walkthrough is not production or multi-instance acceptance.

## Checks and limits

Passed client and server TypeScript checks, scoped ESLint, formatting, and the
client route and locale suites: 2 files, 10 tests. No authorization seeds were
changed or wildcard business grants added. Existing plugin route authorization
was retained. Documentation checks passed: `pnpm doc:test` (7 files, 41 tests),
`pnpm doc:build` (339 pages), and `git diff --check`. The live API denied
anonymous access to model services and Skills with HTTP 401.

Not verified: real Runner tasks, complete role/permission matrix, arbitrary business
writes, attachment parsing, every provider, production App build/deployment,
multi-instance behavior, mobile/dark-mode acceptance. No mock model responses or
invented tool execution results were used. No private model key, session cookie,
database, or private configuration is part of the public download.
