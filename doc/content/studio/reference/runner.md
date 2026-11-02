---
title: nocobase-runner commands
description: Register and maintain runners, inspect logs, and manage tools, variables, updates, and working directories.
---

`nocobase-runner` receives work from Studio and runs coding tools in a runtime. Use [nb-studio](cli.md) to manage projects and tasks; use these commands to maintain the runner.

Run commands on the runner machine as the system user that runs its service. Use `nocobase-runner --help`, or append `--help` to a command, to check your version's options. Most commands support `--json` for structured output; streaming commands such as `logs` do not.

## Install and register

For a first installation, generate the install command in **Agent management › Runtimes**. See [Connect a runtime](../setup/shared-runtimes.md). We recommend a separate container or virtual machine. Coding tools run with the runner user's permissions.

To connect an existing runner to another Studio, or reconnect after revocation, use a new one-time credential:

```bash
nocobase-runner register --server https://studio.example.com/main --token '<registration-token>'
```

| Option | Purpose |
| --- | --- |
| `--server` | Studio URL, including its application path, such as `/main` |
| `--token` | One-time credential from **Add runtime** |
| `--name` | Runner name; defaults to the hostname |
| `--force` | Replace an active registration with the same Studio; not needed for a revoked registration |

Start the runner after registration. If it is already running, stop and start it to load the new connection. One runner can connect to several Studios. Configure concurrency and tool limits in each Studio's runtime settings.

## Start, stop, and check status

```bash
nocobase-runner start
nocobase-runner status
nocobase-runner stop
```

`start` runs in the background by default; `start --foreground` runs in the current terminal. `status` shows connected Studios, the process, runs, and each connection's concurrency settings. Confirm that the runtime appears **Online** in Studio.

`stop` interrupts active work and reports it to Studio for subsequent scheduling. It waits up to 30 seconds by default. Use `stop --timeout 60` to allow more time.

## View logs

| Command | Purpose |
| --- | --- |
| `nocobase-runner logs` | Show the last 100 lines of the runner log |
| `nocobase-runner logs --lines 200` | Choose the number of lines |
| `nocobase-runner logs --follow` | Follow new log entries |
| `nocobase-runner logs --run '<run-id>'` | Show one run's log; get its ID from `status` |

The default runner log is `~/.nocobase-runner/logs/runner.log`.

## Configure tools and models

The runner provides its own Node.js and pnpm to Agents by default. To use the versions on the machine's PATH instead:

```bash
nocobase-runner config set agent-tools system
```

Use `config set agent-tools runner` to restore the default. Changes apply to new work. This setting does not install or sign in to coding tools such as Claude Code or Codex.

Models are normally detected through the coding tools. To adjust the reported list, replace `codex` and the model ID below with your tool and model:

| Command | Purpose |
| --- | --- |
| `nocobase-runner config models codex show` | Show manual overrides and the built-in fallback list |
| `nocobase-runner config models codex add '<model-id>'` | Include an additional model |
| `nocobase-runner config models codex remove '<model-id>'` | Stop reporting a model |
| `nocobase-runner config models codex reset` | Clear this tool's manual overrides |

Changes are reported on the next heartbeat. Adding a model only changes the list; the coding account must still have access to that model.

## Environment variables

Store a variable on the runner for work that requests it:

```bash
nocobase-runner env set API_BASE_URL https://api.example.com --server https://studio.example.com/main
nocobase-runner env list --server https://studio.example.com/main
nocobase-runner env unset API_BASE_URL --server https://studio.example.com/main
```

Without `--server`, the command applies to all registrations. Values stay on the machine; Studio receives only their names. `env list` also hides values. New or changed values take effect on the next heartbeat and subsequent runs.

Pass sensitive values through standard input. For example, if your credential manager has supplied `SERVICE_API_KEY` to the current shell:

```bash
printf '%s' "$SERVICE_API_KEY" | nocobase-runner env set SERVICE_API_KEY --server https://studio.example.com/main
```

To pass an existing shell variable, add `--pass-env NAME` to `start` or `service install`. Repeat the option for multiple variables.

| Runner environment variable | Purpose |
| --- | --- |
| `NOCOBASE_RUNNER_HOME` | State, registrations, caches, and logs; defaults to `~/.nocobase-runner` |
| `NOCOBASE_RUNNER_WORK_ROOT` | Agent working directories; defaults to `~/.nocobase-runner-work`, or the custom HOME path plus `-work` |

The state and work directories must not overlap. Use the same directory settings for service installation and later maintenance commands.

## Background service

```bash
nocobase-runner service install --dry-run
nocobase-runner service install
nocobase-runner service uninstall
```

`service install` installs and starts a user service: launchd on macOS or systemd on Linux. `--dry-run` previews the actions. Use `--label` for a custom service name. On Windows, run the Linux commands in WSL.

The service captures the current shell's PATH, proxy, CA, and `--pass-env` variable values at installation. If tools work in your terminal but not in the service, or those variables change, run `service install` again from the correct terminal.

`service uninstall` stops and removes the service definition. It keeps the runner program and data.

## Update and clean up

```bash
nocobase-runner update --check
nocobase-runner update
```

Updates use the version provided by a connected Studio and restart the runner, which can interrupt active work. When connected to several Studios, select the source with `--server`. Runners installed by the install script enable automatic updates by default. Use `update --auto off` to disable them or `update --auto on` to enable them, then restart the runner.

Inspect working directories and the cleanup plan before applying it:

```bash
nocobase-runner gc
nocobase-runner gc --ended --apply
```

`gc` only previews by default. `--apply` deletes directories. Filter with `--ended` for work Studio considers complete, `--older-than 14d` for idle time, or `--subject '<task-key>'` for a task. Combined filters must all match.

> [!WARNING] Cleanup deletes working directories
> Directories for completed work are deleted even if they contain uncommitted files or unpushed commits. Other directories with unpushed work require `--force`. Directories in use are never removed. Review the preview and push any changes you need to keep before applying cleanup.

Adjust automatic cleanup with `nocobase-runner config set <key> <value>`:

| Setting | Default | Purpose |
| --- | --- | --- |
| `min-free-disk` | `5G` | Free disk space to retain: a size such as `20G`, a percentage such as `10%`, or `off`. New work pauses if space remains low after cleanup |
| `artifact-ttl` | `24h` | How long a working directory stays idle before regenerable files are removed; accepts `30m`, `2d`, or `off` |
| `artifact-patterns` | `node_modules,.next,.turbo` | Comma-separated directory names to remove; `default` restores the defaults |

Artifact cleanup keeps the code checkout and removes only matching directories. These disk and cleanup settings do not require a restart.

## Unregister and uninstall

To disconnect one Studio:

```bash
nocobase-runner stop
nocobase-runner unregister --server https://studio.example.com/main
```

`unregister` removes the local connection record and credential, not the runtime in Studio. If other connections remain, run `start` to resume work. Revoke the credential and delete the unused runtime in Studio.

Preview removal before uninstalling the runner:

```bash
nocobase-runner uninstall --dry-run
nocobase-runner uninstall
```

`uninstall` stops the runner and removes the service and the program installed by the install script. It keeps registrations, caches, logs, and working directories. Add `--purge` to remove that data and Agent working directories too. Preview the full scope with `uninstall --purge --dry-run`.
