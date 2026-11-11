# Multi-portal documentation verification

The four guides under `core/architecture/multi-portal/` follow the approved scope: creation, business development, access and permissions, and portal management. Chinese, English and Japanese use the same menu and page paths. No ordinary-user catalog feature is implemented by this documentation change.

## Sources

Fetched `nocobase/nocobase` `origin/v3-develop` at `57912f198246c7ed8c32589d6b07e20a748d8b75` and `nocobase/nocobase3-pro` `origin/develop` at `357a11db40509d716d850203c79a3f0d588a1c79`. Both primary checkouts contain other development work, so their working branches were not switched or reset; the fetched Git trees were read directly.

| Source | Behavior checked |
| --- | --- |
| OSS `packages/app/app-cli/src/plugins/define.ts` | Recognition of portal packages |
| Pro `packages/tools/create-portal/src/create.mjs` and `src/templates.mjs` | Generation, names, registration, layout, route defaults, connection declaration and installation seed |
| Pro `packages/templates/app-template-multi-portal/overrides/client/pages/workbench.tsx` | Workbench for unrestricted administrators; standard homepage for ordinary users |
| Pro template `overrides/client/layouts/portal-shell.tsx` and `overrides/.agents/rules/multi-portal.md` | Host layout responsibilities and shared shell |
| Pro plugin `client/portal-page.tsx`, `client/switcher.tsx`, `client/data.ts` and `server/routes/helpers.ts` | Default page and switcher use the administrator-only catalog; changing route authorization alone is insufficient |
| Pro plugin `server/tokens.ts`, `server/services/portal-center.ts` and `server/services/portal-lifecycle.ts` | Installation guard, lifecycle states, dependency checks, cleanup, failure and recovery |
| Pro plugin `docs/integration.md` and multi-connection tests | Named host connections, coordinated tasks and retained histories |

Repository README passages claiming these packages are unreleased are historical. For released behavior, also inspected the existing installation generated with create-app `0.1.0-beta.36`, template `0.1.0-beta.1`, portal plugin `0.0.2-beta.0` and create-portal `0.0.2-beta.0`. Its generated descriptor, route, manifest and Server declaration match the excerpts. Read `config init --help` from that installation. Registry instructions follow the released create-app scoped-registry fix and its current creation Skill.

## Validation boundaries

This documentation pass checks source contracts, generated files, Bash syntax for fenced commands, navigation/link integrity, documentation tests, the static build and HTTP responses from the existing documentation preview. It does not recreate the application, change its database, perform new browser interactions or claim that ordinary-user portal entry is already delivered. The installation used as evidence was created and smoke-tested in the preceding installation task; those application tests are not rerun for these prose changes.

The creation and development guides now include Agent and manual alternatives. Creation uses the global `nocobase-create-app` Skill after registry login in the Agent's execution environment; portal development uses the generated app's instructions and Skills. Prompts describe reader goals and keep registry, registration and security details in surrounding prose. The fetched OSS Skill still documents an older two-step installation path, while the local updated Skill uses create-app beta.36 automatic installation; the Agent guide does not require one specific installation sequence. These prompts were reviewed against the Skills and generated project guidance, not executed in a new Agent session.
