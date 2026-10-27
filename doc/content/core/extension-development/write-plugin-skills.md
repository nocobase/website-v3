---
title: Write plugin skills
description: Describe public capabilities for App Agents and maintain, synchronize and verify plugin Skills.
---

A plugin Skill tells an App Agent which implemented capabilities exist, which public entries to call, who owns the data and how to verify success. It neither implements the feature nor registers the plugin automatically.

This article authors a plugin’s own usage instructions. The development guide `nocobase-app-plugin-development` belongs to `@nocobase/app-skills`; do not copy it into a business plugin or claim that reserved name.

## Use an Agent

```text
Write a Skill for notice-cli so an App Agent can preview notice text.
Describe only the implemented preview command, including input, output, errors and registration prerequisites.
Maintain it in plugin source and verify synchronization and invocation, without editing generated App copies.
```

## When a plugin needs a Skill

A Skill helps when Agents frequently call APIs, compose public components, use services or diagnose configuration. A plugin with one ordinary page and no special integration workflow need not add a Skill just to fill a directory.

This example documents `notice-cli` from [Extend the command line](extend-command-line.md). Add `skills/` to that existing plugin without rerunning creation. For a new plugin, `--with skills` generates a draft that must be replaced with implemented behavior.

## Maintain plugin-owned source

The App contains:

```text
packages/app-plugin-notice-cli/
├── cli/
├── skills/
│   └── nocobase-app-plugin-notice-cli/
│       └── SKILL.md
└── package.json
```

Names follow package ownership: `@nocobase/app-plugin-notice-cli` owns `nocobase-app-plugin-notice-cli`. Preserve custom scopes: `@acme/app-plugin-notice-cli` owns `acme-app-plugin-notice-cli`. Independent tasks can add suffixes to that prefix, without claiming another package’s name.

Include `skills` in the plugin’s `package.json` `files` list while preserving `dist`, README and other existing entries. Skills need no TypeScript compilation, but must be included in a published package.

## An executable Skill

Create `skills/nocobase-app-plugin-notice-cli/SKILL.md`:

````markdown
---
name: nocobase-app-plugin-notice-cli
description: Preview notice text with the installed notice-cli plugin when checking whitespace or character counts. Does not save, publish or send notices.
---

# Preview notice text

Work from the target App root. This Skill describes the public CLI of the installed plugin; do not import its private source files.

## Prerequisites

The App depends on `@nocobase/app-plugin-notice-cli` and registers its `./cli` export in `cli/plugins.ts`. If the command is unavailable, check the installed package exports and registration before retrying.

## Preview

Run:

```bash
pnpm nocobase notice-cli preview --text "Hello" --json
```

The command trims surrounding whitespace, accepts 1–200 UTF-16 code units after trimming, and returns `result.text` plus `result.length` counted in Unicode code points. It creates no records and starts no App background services. For deployment-only use, run the built CLI entry instead of pnpm.

A successful result has `ok: true`, `result.text: "Hello"` and `result.length: 5`. Blank or oversized text returns `error.code: "INVALID_TEXT"` and a nonzero exit status. Report the error and correct the input; do not retry unchanged input.

This capability does not store, publish or send notices. Those actions need a separate implemented capability and the user’s request.
````

`description` identifies when the capability applies. The body gives the shortest useful workflow and expected result. Keep implementation design elsewhere; put longer API schemas or troubleshooting tables in linked `references/` files beside the Skill.

## Public entries and boundaries

| Explain | Do not ask App Agents to do |
| --- | --- |
| Public package exports, APIs and CLI commands | Import private source paths |
| Authentication, resource/action permissions and data scope | Substitute hidden buttons for Server authorization |
| App-owned prerequisites, configuration and registration | Assume a file’s existence means a capability is enabled |
| Stable error codes and outcomes | Guess success from an incidental log message |
| Actually supported behavior | Call planned features as though implemented |

Importing a public component does not register a Client factory. Server consumers must import the original Token through its public entry. Document such integration conditions so every App need not rediscover them.

## Synchronize into the App

Run from the App root:

```bash
pnpm nocobase skills sync --package @nocobase/app-plugin-notice-cli
```

Plugin registration also synchronizes shipped Skills by default. The App’s `.agents/skills/` contains generated copies, not maintained source; another sync replaces edits there. Whether a running Agent reloads them depends on its client. Start a new session when needed.

## Verify delivery and behavior

First check the synchronized copy exists. Then have an Agent follow it and run `preview --text Hello --json`, expecting `Hello` and length 5. Check that blank text produces the documented error and that the Agent does not claim previewing saved or sent a notice.

Synchronization proves delivery, not correctness. Before publishing, inspect `pnpm --filter @nocobase/app-plugin-notice-cli pack` output for `skills/` and the public runtime entries. See [Publish a plugin](publish-plugin.md) for another App’s installation.

Update source, tests and Plugin Skills together when public commands, arguments, permissions or responses change. Apps receive updated guidance by upgrading the package and synchronizing, rather than patching generated copies individually.
