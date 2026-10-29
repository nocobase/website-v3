---
title: Plugin development guidance (AGENTS.md)
description: Maintain plugin responsibilities, change conventions, compatibility requirements and verification steps in AGENTS.md for Agents working on plugin source.
---

A plugin's `AGENTS.md` guides Agents maintaining its source: what the plugin owns, which files a feature change affects, and how to verify the result. Keep conventions that remain useful across tasks alongside the plugin's code.

This article explains how to write those maintenance instructions. For Skills that help application Agents call, integrate and compose plugin capabilities, see [Plugin Skills](write-plugin-skills.md). Both can describe the same capability, while answering different questions.

## Where guidance lives

In an application workspace, development guidance lives at the plugin root:

```tree
my-app/
├── AGENTS.md                       # Application-wide development conventions
├── .agents/skills/                 # Development and usage guidance synchronized from dependencies
└── packages/
    └── app-plugin-notice-cli/
        ├── AGENTS.md              # This plugin's source maintenance conventions
        ├── CLAUDE.md              # References the adjacent AGENTS.md
        ├── README.md              # Plugin description and integration
        ├── cli/                   # Command implementations
        ├── tests/                 # Implementation tests
        └── skills/                # Consumer-facing Skills (optional)
```

The creation tool already generates `AGENTS.md` and `CLAUDE.md`; do not recreate a plugin to add guidance. The current template's `CLAUDE.md` contains:

```text
@AGENTS.md
```

Preserve this reference so development conventions have one maintained source in `AGENTS.md`. Before modifying a plugin, have the Agent read the application and plugin root guidance, then inspect the source relevant to the task.

The template also points to `.agents/skills/nocobase-app-plugin-development/SKILL.md` from the application's installed packages. That general development Skill comes from `@nocobase/app-skills`. The plugin's `AGENTS.md` adds its specific conventions without copying the entire shared development guide.

`pnpm nocobase skills sync` synchronizes package-provided Skills; it does not copy a plugin root's `AGENTS.md` into an application Skill. Keep source maintenance requirements in the plugin and consumer instructions in its `skills/` directory.

## What maintenance conventions to record

Prioritize information an Agent cannot infer from file names but needs when changing the implementation:

| Topic | What to explain |
| --- | --- |
| Responsibility and boundaries | Implemented capabilities; data, permissions and business rules owned by the application or other plugins |
| Key entries | Files implementing features and files declaring, registering or exposing them |
| Related changes | Declarations, dependencies, tests and documentation that must change with a capability |
| Compatibility | Public paths, arguments, response shapes, error codes and service Tokens used by consumers |
| Verification | Working directory, commands, expected results and whether a target application is required |
| Special conventions | Plugin-specific state rules, migration constraints, resource ownership or external service prerequisites |

Use concrete files and behavior. For example, “when changing `preview` response fields, check the CLI tests and plugin Skill” gives the Agent more direction than “ensure code quality.”

See [Plugin structure](plugin-structure.md) for the directory reference and [Plugin declarations and public exports](plugin-declarations.md) for entry points and contracts. Link existing explanations and add what is specific to the current plugin. For UI work, retain the convention of using shadcn primitives and consulting NocoBase UI Library first; source asset organization is covered in [Components and styles](frontend-components.md).

## Example: maintenance guidance for notice-cli

This example uses the completed `notice-cli` plugin from [Command-line extensions](extend-command-line.md): `preview` normalizes notice text and returns its character count. Its consumer Skill is described in [Plugin Skills](write-plugin-skills.md).

Append the section below to the plugin's existing `AGENTS.md`, preserving the template's shared Skill entry and applicable development rules. File paths are relative to the plugin root; commands run from the application root:

````markdown
## notice-cli maintenance

### Responsibility

This plugin previews text through `notice-cli preview`. It does not save,
publish or send notices, and the preview command does not start application services.

### Implementation and public contract

- `cli/preview.ts` implements the preview command.
- `cli/index.ts` declares commands. Preserve the generated `info` command when adding commands.
- `package.json` exposes `./cli` for source and compiled consumers. Keep both mappings valid.
- Keep `preview --text ... --json` compatible with its documented callers.
- Input is trimmed and must contain 1–200 UTF-16 code units after trimming.
- `result.text` is the trimmed value; `result.length` counts Unicode code points.
- Blank or oversized text returns `INVALID_TEXT` with exit code 2.

### Changes and verification

When changing command behavior, update `tests/cli/preview.test.ts`, the README
and `skills/nocobase-app-plugin-notice-cli/SKILL.md` where affected.
Keep usage examples consistent with the actual command; maintain the Skill
in this package, not the synchronized copy in the application.

Run from the owning application root:

```bash
pnpm --filter @nocobase/app-plugin-notice-cli test tests/cli/preview.test.ts
pnpm --filter @nocobase/app-plugin-notice-cli typecheck
pnpm --filter @nocobase/app-plugin-notice-cli build
```

After the application's `cli/plugins.ts` registers this plugin, verify:

```bash
pnpm nocobase notice-cli preview --text " Hello " --json
```

Expect `ok: true`, `result.text: "Hello"` and `result.length: 5`.
For changes to exports, dependencies or CLI integration, also build the owning
application and verify the command through its built CLI entry.
````

The example records two easily confused rules: the input limit counts UTF-16 code units, while the result length counts Unicode code points. It also names the files affected by behavior changes and distinguishes the plugin build from invocation in its application.

The test file and Skill come from the linked tutorials. If your plugin does not have them, implement them first or use the actual paths. Add maintenance requirements when introducing Client, Server or database capabilities; remove references to entries that do not exist.

## Have an Agent follow the guidance

The task request describes the current work, while `AGENTS.md` supplies persistent maintenance conventions. Use them together, for example:

```prompt
Check the preview boundary tests in packages/app-plugin-notice-cli in this application.

Read the application and plugin AGENTS.md files and the synchronized plugin
development Skill. Inspect the existing implementation and uncommitted changes.

Check coverage for surrounding whitespace, blank text, the length limit
and Unicode character counts. Reuse existing coverage and add missing cases,
keeping the current command arguments and response structure compatible.
Check the README and plugin Skill against the implementation and correct stale guidance.

Run affected tests and necessary checks, then report results and unverified scope.
```

Maintainers need implementation files, registration points and compatibility requirements. Consumers need prerequisites, public commands and outcomes. Put the former in `AGENTS.md` and the latter in the plugin Skill to keep each document focused on its task.

## Verify that guidance works

Use a real maintenance task to assess the guidance, beyond checking that the file exists:

- Referenced paths exist and still have their documented responsibilities.
- Commands match current `package.json` scripts and identify their working directory.
- Named tests are discovered and executed, with results matching expectations.
- Feature changes prompt checks of related declarations, exports, dependencies and usage examples.
- Plugin tests and target application verification are distinguished, with unverified work recorded.

Use commands available in the current plugin and application. Do not copy NocoBase source-repository-only checks into guidance for an ordinary application's plugin. See [Testing and verification](testing-and-verification.md) for plugin tests and [Testing and acceptance](../developing-apps/testing-and-acceptance.md) for application acceptance.

For guidance-only edits, check paths, commands and descriptions. Run code checks when functionality or integration needs verification; do not repeat every unchanged business test just to verify a paragraph.

## Maintain guidance with the feature

When public commands, APIs, services or resource layouts change, check development guidance, the README, tests and plugin Skills together. Development guidance explains organization and maintenance constraints; the README and Skills describe current usage. Record compatibility changes according to the project's versioning and release conventions; see [Build and publish](publish-plugin.md).

Keep durable business decisions and maintenance conventions in the guidance. Remove temporary troubleshooting history, individual task logs and obsolete steps. Link longer explanations maintained within the plugin so `AGENTS.md` remains a clear reading entry.

**Done when**: an Agent taking over the plugin can locate the change, respect its public contracts, perform the relevant verification and identify the instructions that need updating.
