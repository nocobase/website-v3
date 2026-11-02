---
title: Troubleshooting
description: Diagnose common installation, Git, runtime, task, and delivery problems.
---

Give a local Coding Agent the symptoms, related task, and error message to investigate. Keep passwords and tokens out of prompts. An Agent connected to Studio can query status with `nb-studio`.

## Installation and sign-in

| Problem | What to check |
| --- | --- |
| No sign-in page | Use `https://studio.example.com/main/`; check container health and the reverse proxy |
| Initial account cannot sign in | Check the original administrator username and password; changing environment variables does not reset an existing account |
| Container restarts repeatedly | Read `docker compose logs --tail=100 studio`; check configuration, database connectivity, and storage permissions |
| CLI approval did not sign in | Keep the login command running; retry with a new code after expiry |

See [Deploy Studio](../setup/install.md) and [Notifications and push](../admin/notifications.md) for password recovery.

## Git connections

If GitHub rejects a private webhook URL, disable webhooks and use polling. If a newly created repository is inaccessible, check the GitHub App's installation scope. Grant access, then connect it as an [existing repository](../project/settings.md#connect-an-existing-repository).

A personal Git account with read-only repository access cannot push a PR. Grant write access or use the workspace connection according to team policy. See [Git platforms](../configure/git.md).

## Runtimes and tasks

| Symptom | Next action |
| --- | --- |
| Runtime offline | Run `nocobase-runner status` on the machine; check the service and network |
| Tool missing or signed out | Install and sign in as the service's system user, then check again |
| Tool works in a terminal but not the service | Run `nocobase-runner service install` from the correct terminal |
| Task does not start | Check status, predecessors, initialization, and queue reasons |
| Work pauses after many runs | Inspect the task run limit and repeated failures before continuing |
| Tool quota exhausted | Wait for recovery or use another model; clear unknown-reset marks after recovery |

Use **Start** for backlog tasks. A task can legitimately queue while shared runtimes are busy. See [Follow progress](../use/follow-progress.md).

## Checks, previews, and merging

When results are missing, check the repository's selected source. Code-host CI, external CI, and Agent self-check do not combine their results. See [Checks and CI](../configure/checks.md).

For missing previews, inspect build records, CI connectivity to Studio, required variables, and the `no-preview` label. Stopped or dormant previews restart when visited.

Resolve conflicts, draft state, or pending checks before merging. Overriding failed or missing checks requires permission and does not bypass code-host protection.

If a merged PR has not updated the task, allow time for synchronization and check whether all linked PRs have merged.

## Email and delivery

If invitation email fails, copy the invitation link. Invitations and password resets use separate sender configuration; check each in [Notifications and push](../admin/notifications.md).

Deployments to protected test environments wait for approval. After production deployment, the lead must [record the version](../project/release.md#record-the-production-version) before delivery marks update.
