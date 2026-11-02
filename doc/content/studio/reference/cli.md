---
title: nb-studio commands
description: Install the Studio CLI and discover commands provided by your server.
---

`nb-studio` lets local Coding Agents, scripts, and CI call Studio. Business commands come from the connected server and reflect its version and the caller's identity.

For runner registration, logs, updates, and removal, see [nocobase-runner commands](../reference/runner.md).

## Install and sign in

Open **Use Studio in your agent** from the account menu and give the setup instructions to a local Coding Agent. See [Use a local Agent](../join/local-agent.md). Node.js 24 or later is required.

After installation, sign in with an address that includes `/main`:

```bash
nb-studio login --server https://studio.example.com/main
nb-studio whoami
nb-studio skills install
```

Keep the login command running while you check and approve the code in the browser. On a machine without a browser, add `--no-browser` and open the approval URL on another device.

## Discover commands

```bash
nb-studio docs
nb-studio issue --help
nb-studio whoami --missing
```

Use `docs` for current commands and `--help` for arguments. `whoami --missing` groups unavailable commands by the permissions they need. Add `--json` for structured output.

| Group | Purpose |
| --- | --- |
| `issue`, `comment`, `attachment` | Tasks, discussions, and attachments |
| `project`, `label` | Projects, membership, and labels |
| `project-manager`, `agent`, `runtime` | Dispatch, Agents, and runtimes |
| `skill`, `variable`, `run` | Skills, variables, and run history |
| `kb`, `memory` | Knowledge and project memory |
| `git`, `pr`, `commit` | Repositories, PRs, and checks |
| `quality` | Enabled quality plans and follow-up work |
| `app`, `deploy`, `env`, `release`, `build` | Applications, environments, artifacts, and delivery |
| `session`, `conversation` | Local sessions and Runner conversations |
| `user`, `access`, `api-key` | Authorized administration operations |

## Use multiple servers

```bash
nb-studio profile list
nb-studio profile use <profile-name>
nb-studio logout
```

Scripts and CI can use `NB_STUDIO_SERVER` and `NB_STUDIO_API_KEY` without browser sign-in. Store keys in the CI secret manager. See [API keys](../admin/api-keys.md).

## Update

```bash
nb-studio update --check
nb-studio update
```

Updates come from the current Studio and also synchronize installed skills. CLI sign-in approval and Git platform authorization still require their web pages. Agent run identities cannot accept tasks or merge PRs.
