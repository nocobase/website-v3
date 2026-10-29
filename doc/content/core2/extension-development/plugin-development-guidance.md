---
title: Plugin development guidance (AGENTS.md)
description: Maintain responsibilities, change conventions, compatibility requirements and verification methods in a plugin's AGENTS.md, so Agents can keep maintaining the plugin's source.
---

A plugin's `AGENTS.md` is for Agents maintaining its source: it tells them what the plugin is responsible for, which files to check when changing a capability, and how to verify the result. The guidance should record conventions that hold across tasks and be maintained together with the plugin's source.

This guide explains how to write those maintenance requirements. For Skills that let application Agents call, connect and combine the plugin's capabilities, see [Plugin Skills](write-plugin-skills.md). Both kinds of guidance may describe the same capability, but they answer different questions.

## Where the guidance lives

In an application workspace, a plugin's development guidance lives at the plugin root:

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

The generator already creates `AGENTS.md` and `CLAUDE.md`, so there is no need to recreate the plugin to add guidance. In the current template, `CLAUDE.md` contains:

```text
@AGENTS.md
```

Keep this reference so the development conventions are maintained in one place, `AGENTS.md`. When starting to change a plugin, have the Agent read the guidance at the application root and the plugin root first, then the source relevant to the task.

The template also points to `.agents/skills/nocobase-app-plugin-development/SKILL.md` from the application's installed version. This general development Skill comes from `@nocobase/app-skills`; the plugin's `AGENTS.md` only needs to add the plugin's actual conventions, not copy the whole general development guide.

`pnpm nocobase skills sync` synchronizes Skills provided by packages; it does not copy the plugin root's `AGENTS.md` into an application Skill. Source maintenance requirements stay inside the plugin, while explanations for users go in the plugin's `skills/`.

## Which maintenance conventions to record

Record first the information an Agent cannot tell from file names alone but must know when changing code:

| Topic | What to state clearly |
| --- | --- |
| Responsibilities and boundaries | The capabilities implemented; which data, permissions and business rules belong to the application or other plugins |
| Key entries | Which files implement features, and which declare, register and expose them |
| Related changes | Which declarations, dependencies, tests and documents must be updated together when adding or changing a capability |
| Compatibility requirements | Which public paths, arguments, response structures, error codes and service Tokens are already used externally |
| Verification | Which commands to run in which directory, the expected results, and whether a target application is needed |
| Special conventions | State rules, migration constraints, resource ownership or external service prerequisites unique to this plugin |

Use concrete file names and behavior requirements. For example, "when changing the fields `preview` returns, also check the CLI tests and the plugin Skill" helps an Agent far more than "ensure code quality".

For the full directory reference, see [Plugin structure](plugin-structure.md); for entries and public contracts, see [Plugin declarations and public exports](plugin-declarations.md). The guidance can link to these existing explanations and add only what is different about the current plugin. For UI work, keep the convention "primitives use shadcn; consult the NocoBase UI Library first", and see [Components and styles](frontend-components.md) for how source assets are organized.

## Example: add maintenance requirements for notice-cli

The example continues with the `notice-cli` plugin completed in [Command-line extensions](extend-command-line.md): the `preview` command tidies announcement text and returns its character count, and its companion Skill is in [Plugin Skills](write-plugin-skills.md).

Add the section below to the plugin's existing `AGENTS.md`, keeping the template's entry pointing to the general development Skill and the development rules that still apply. File paths are relative to the plugin root, while commands run from the application root:

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

This example records two rules that are easy to confuse: the input limit counts UTF-16 code units, while the result length counts Unicode code points. It also names the files that must change together with the behavior, and what the plugin's own build and the application's actual call each verify.

The test file and Skill in the example come from the corresponding tutorials; if your plugin does not have them yet, implement them first or change to the actual paths. After adding Client, Server or database capabilities, add the matching maintenance requirements, and never keep entries in the guidance that do not exist.

## Have the Agent change code following the guidance

The task description says what to do this time, and `AGENTS.md` provides the long-lived maintenance conventions; use them together, for example:

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

Maintainers need to know the implementation files, registration points and compatibility requirements, while users only need the prerequisites, public commands and results. Putting the former in `AGENTS.md` and the latter in the plugin Skill keeps the two from gradually merging into one long document.

## Verify that the guidance works

Check the guidance with a real maintenance task, not just by checking that the file exists:

- Every path in it can be found, and the file still has the responsibility described.
- The commands match the scripts in the current `package.json`, and the working directory is clear.
- The named tests are really discovered and run, with the expected results.
- After changing a feature, the related declarations, exports, dependencies and usage examples are checked together.
- Tests inside the plugin are distinguished from verification in the target application, and unverified parts are recorded.

The check commands follow the current plugin and application. Check scripts specific to the NocoBase source repository should not be copied into the plugin guidance of an ordinary application. For testing methods, see [Testing and verification](testing-and-verification.md); for application acceptance, see [Testing and acceptance](../developing-apps/testing-and-acceptance.md).

If only the development guidance changed, checking the paths, commands and descriptions is enough; run the corresponding code checks only when you need to verify a change to functionality or integration. Do not rerun every unchanged business test just to verify a piece of documentation.

## Maintain it together with the features

When public commands, APIs, services or resource layouts change, check the development guidance, README, tests and plugin Skill together. The development guidance records "why things are organized this way and what to follow when changing them", while the README and the Skill record current usage. For compatibility changes, record them according to the project's versioning and release conventions; see [Build and publish](publish-plugin.md).

Keep stable business decisions and maintenance conventions in the guidance; clean up temporary troubleshooting, logs from a single task and outdated steps promptly. When an explanation grows long, link to reference documents maintained in the plugin, so `AGENTS.md` stays a clear entry point for reading.

**Done when**: an Agent taking over the plugin can locate this change, follow the public contracts, complete the matching verification, and knows which explanations need updating together.
