---
title: nb-studio commands
description: nb-studio is Studio's command line, made mainly for your agent, such as Claude Code or Codex. Once it's installed, they can look up projects, create issues, follow progress, and configure Studio for you. Scripts and CI use it too.
---

The CLI has no business commands built in. After you sign in, it asks Studio which commands you can use, so the commands always match your Studio version and your permissions.

## Install and sign in

The easiest way: in the account menu at the top right of Studio, click **Use Studio in your agent** and give the setup instructions from **Connect a local Coding Agent** to your agent. It installs `nb-studio`, asks you to approve the sign-in in your browser, and installs the skill. See [Use Studio from your local coding agent](../join/local-agent.md).

To install it yourself, you need Node.js 24 or later:

```bash
curl -fsSL https://studio.example.com/main/api/agents/dist/installScript | sh -s -- --token <download credential>
nb-studio login --server https://studio.example.com/main
```

The download credential is in those setup instructions and is valid for 30 minutes. `nb-studio login` shows a code and opens the approval page. Check the code and click **Approve**. A sign-in lasts 7 days and renews itself as long as you keep using it.

| Command | What it does |
| --- | --- |
| `nb-studio login --server <address>` | Sign in. On a machine without a browser, add `--no-browser` and open the address somewhere else to approve |
| `nb-studio login --server <address> --api-key-stdin` | Sign in with your own API key, read from standard input |
| `nb-studio whoami` | Shows who you're signed in as, the server, and your permissions |
| `nb-studio skills install` | Installs the `nb-studio-cli` skill for Claude Code and Codex |
| `nb-studio docs` | Lists the available commands and how to use them |
| `nb-studio update` | Updates to the version Studio serves, along with the skill |
| `nb-studio logout` | Signs out |

When you use several Studios, each server is a profile: `nb-studio profile list` and `nb-studio profile use <name>`. In CI, skip the sign-in and use the `NB_STUDIO_SERVER` and `NB_STUDIO_API_KEY` environment variables.

## Find commands

- `nb-studio docs` lists the available commands, and `nb-studio <command> --help` shows a command's options.
- Add `--json` for machine-readable output, which suits scripts and agents.
- When you lack a permission, the command says which one it needs rather than claiming the command doesn't exist. `nb-studio whoami --missing` lists the commands you lack permissions for.

## Main command groups

| Group | What it covers |
| --- | --- |
| `issue`, `comment`, `attachment` | Issues: search, view, create, update status, comment, attachments |
| `project`, `label` | Projects, their initialization and members, and labels |
| `project-manager` | The coordinator agent's settings, and handing an issue to the coordinator agent to start |
| `agent`, `runtime`, `skill`, `variable` | Agents, runtimes and registration credentials, skills, and variables and secrets |
| `run`, `report` | Runs, dashboard figures, and usage |
| `kb`, `memory` | The knowledge base and project memory |
| `git`, `pr`, `commit` | Git connections, repositories, personal authorization, and PRs |
| `preview`, `app`, `deploy`, `env`, `release`, `build`, `registry` | Previews, apps, deployments and deployment requests, deploy environments, releases, CI, and registries |
| `inbox`, `follow-up` | The inbox and followed issues |
| `session`, `conversation` | Sessions |
| `user`, `access`, `api-key` | Accounts and invitations, roles, and API keys |

## What only the web page can do

There are no commands for the following. When an agent runs into one, the `nb-studio-cli` skill tells it where on the web page to ask you to do it:

| Task | Where |
| --- | --- |
| Approve `nb-studio login` | The approval page it opens |
| Sign in, reset your password, and accept an invitation | The sign-in page and the invitation link |
| Add a GitHub App connection | **Settings › Integrations › Git** |
| Change your own password | **Account settings › Account and security** |
| Language, theme, and sound reminder | **Account settings › Preferences** |

Also, only people can accept issues, merge PRs, and approve deployment requests. Agent runs can't do any of these.
