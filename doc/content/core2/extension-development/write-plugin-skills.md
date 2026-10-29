---
title: Plugin Skills
description: Describe a plugin's public capabilities for Agents in the App, and maintain, synchronize and verify the plugin's Skills.
---

A plugin Skill is written for the Agents that use the plugin: which capabilities are already implemented, which public entry to call, who maintains the data, and how to tell whether an operation succeeded. It does not implement features, and it does not register the plugin automatically.

This guide covers the plugin's own usage instructions. `nocobase-app-plugin-development`, used when developing plugins, is provided by `@nocobase/app-skills`; do not copy it into a business plugin, and do not take that reserved name.

For the `AGENTS.md` used when changing and maintaining plugin source, see [Plugin development guidance (AGENTS.md)](plugin-development-guidance.md). This guide is for application Agents that use the plugin's capabilities, covering invocation examples, distribution and synchronization, and real verification.

## Use an Agent

```text
Write a Skill for notice-cli so an App Agent can preview notice text.
Describe only the implemented preview command, including input, output, errors and registration prerequisites.
Maintain it in plugin source and verify synchronization and invocation, without editing generated App copies.
```

## When a plugin needs a Skill

A Skill helps when Agents frequently call APIs, assemble public components, use services or diagnose configuration. If a plugin only has one ordinary page with no extra integration steps, there is no need to write a Skill just to fill out the directories.

Below, instructions are added for `notice-cli` from [Command-line extensions](extend-command-line.md). An existing plugin simply gets a `skills/` directory, without rerunning the generator. When creating a new plugin you can choose `--with skills`, but what is generated is only a draft and must be replaced with a description of the real capabilities.

## Maintain plugin-owned source

The Skill's location in the App is:

```text
packages/app-plugin-notice-cli/
├── cli/
├── skills/
│   └── nocobase-app-plugin-notice-cli/
│       └── SKILL.md
└── package.json
```

The name follows the package's ownership: `@nocobase/app-plugin-notice-cli` corresponds to `nocobase-app-plugin-notice-cli`. Custom scopes are kept in the prefix as well, for example `@acme/app-plugin-notice-cli` corresponds to `acme-app-plugin-notice-cli`. Several independent tasks can use the same prefix with different suffixes, but do not take another package's name.

Make sure `files` in the plugin's `package.json` includes `skills`, keeping existing entries such as `dist` and README. Skills need no TypeScript compilation, but they must be packed into the package when publishing.

## An executable Skill

Add `skills/nocobase-app-plugin-notice-cli/SKILL.md`:

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

`description` decides when the capability is used, and the body explains the shortest invocation flow and its result. Do not move the whole design of the plugin's source into it; when you need long API schemas or troubleshooting tables, split them into `references/` in the same directory and link to them from `SKILL.md`.

## Public entries and boundaries

| Explain | Do not ask App Agents to |
| --- | --- |
| Public package exports, APIs and CLI commands | Import the plugin's private source paths |
| Authentication identity, resources, actions and data scope | Use hidden buttons instead of server-side authorization |
| Data, configuration and registration the App must prepare | Assume a feature is enabled because a file exists |
| Stable error codes and results | Guess whether an operation succeeded from some line in a log |
| Capabilities actually supported | Describe unimplemented designs as callable features |

Importing a public component does not mean the Client plugin factory has been registered, and a Server Token must be imported as the original object from the public entry. Integration conditions that are easy to get wrong like these belong in the relevant Skill, rather than leaving every App to guess.

## Explain UI source assets

When a plugin provides source assets through shadcn UI Registry, the Skill should explain how to build the asset locally and its path, or the published URL; how to install it into an App or a plugin; its inputs and dependencies; and how to connect it to the plugin's public capabilities. Local assets can be added directly, without first setting up a Registry website. The Skill should also give examples of changeable layouts or interactions and verification methods, so an Agent can complete the composition in the target project.

Successfully installing component files does not mean the server plugin, language resources or routes are registered. State these prerequisites clearly, and explain that the installed source is maintained by the target project and is not updated automatically when the plugin package is upgraded. For a complete example, see [Write Agent usage instructions](frontend-components.md#write-agent-usage-instructions).

## Synchronize into the App

Run in the App root:

```bash
pnpm nocobase skills sync --package @nocobase/app-plugin-notice-cli
```

Registering a plugin also synchronizes its Skills by default. The result lives in the App's `.agents/skills/`, which is a generated copy rather than the maintained source; synchronizing again after editing it overwrites your changes. Whether an existing Agent session reloads automatically depends on the client; start a new session when needed.

## Verify delivery and behavior

First confirm that the synchronized copy exists, then have an Agent run `preview --text Hello --json` following the Skill, and check that the actual result is `Hello` with length 5. Also check that empty text returns a clear error, and that the Agent does not describe a "preview" as having saved or sent an announcement.

A successful file synchronization only proves the instructions arrived, not that they are correct. When publishing, use `pnpm --filter @nocobase/app-plugin-notice-cli pack` to check that the tarball contains `skills/` and the public runtime entries; for installing across Apps, see [Build and publish](publish-plugin.md).

When public commands, arguments, permissions or return values change later, update the source, tests and plugin Skill together. Applications get the new instructions by upgrading the package and synchronizing again; do not patch the generated copies one by one.
