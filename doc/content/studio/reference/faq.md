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

If the requester field or Quality workspace is missing, check your [Studio edition](../setup/index.md#choose-an-edition). To view quality data, you also need access to the project.

## Git connections

If GitHub rejects a private webhook URL, disable webhooks and use polling. If a newly created repository is inaccessible, check the GitHub App's installation scope. Grant access, then connect it as an [existing repository](../project/settings.md#connect-an-existing-repository).

A personal Git account with read-only repository access cannot push a PR. Grant write access or use the workspace connection according to team policy. See [Git platforms](../configure/git.md).

### Troubleshoot GitLab repository and pipeline access

| Symptom | What to check |
| --- | --- |
| Studio says the token cannot see the group | Compare the installation path and group spelling with the repository URL. Check the group that issued the token, its expiration date, and the `api` scope |
| Connection looks healthy but checkout reports `HTTP Basic: Access denied` | Expand the repositories on the connection. Check which connection the project uses and compare its clone URL. If the run uses a personal Git account, check that account’s access to the private repository |
| A task reports `glab: command not found` | On the runtime used for that run, check `glab --version` and the service PATH as the service user |
| The check failed but the log is missing | Confirm the check came from GitLab CI. Have the Agent look up the MR pipeline within the repository task run, then read the failed job by ID. For a 404, check the project path, IDs, and the run identity’s access |
| Cannot read an MR while linking it manually | Verify the repository path and MR number, then check that Studio’s GitLab connection can read it. Studio does not save the link if the MR is missing or unreadable. If the link is saved but checks are missing, check whether the connection can read the pipeline. |

For example, to inspect MR 12 and job 345 in `inventory-team/warehouse`, substitute your own project and IDs:

```bash
glab ci get --merge-request 12 -R inventory-team/warehouse
glab ci trace 345 -R inventory-team/warehouse
```

## Runtimes and tasks

| Symptom | Next action |
| --- | --- |
| Runtime offline | Run `nocobase-runner status` on the machine; check the service and network |
| Tool missing or signed out | Install and sign in as the service's system user, then check again |
| Tool works in a terminal but not the service | Run `nocobase-runner service install` from the correct terminal |
| Task does not start | Check status, predecessors, initialization, and queue reasons |
| Work pauses after many runs | Inspect the task run limit and repeated failures before continuing |
| Tool quota exhausted | Use the quota decision card to wait for recovery, change Agent, or change runtime. Unpushed work remains on the original runtime |

Use **Start** for backlog tasks. A task can legitimately queue while shared runtimes are busy. See [Follow progress](../use/follow-progress.md).

If a model stays queued, check the runtimes available to the task owner. At least one needs to be online, signed in to the matching tool and model, and have a free execution slot.

When Studio shows a request ID, copy it from the error details. Give the administrator the ID, task, runtime, and time of the error so they can export the relevant Studio and runtime logs. GitLab CI job logs are available on GitLab.

## Checks, previews, and merging

When results are missing, check the repository's selected source. Code-host CI, external CI, and Agent self-check do not combine their results. See [Configure repository checks](../configure/checks.md).

For missing previews, inspect build records, CI connectivity to Studio, required variables, and the `no-preview` label. Stopped or dormant previews restart when visited.

Resolve conflicts, draft state, or pending checks before merging. Overriding failed or missing checks requires permission and does not bypass code-host protection.

If a merged PR has not updated the task, allow time for synchronization and check whether all linked PRs have merged.

## Email and delivery

If invitation email fails, copy the invitation link. Invitations and password resets use the configured mailers; check SMTP credentials and the selected mailer in [Notifications and push](../admin/notifications.md).

If a deployment is awaiting approval, ask an environment approver to review the application and artifact in their inbox. After production deployment, the lead must [record the version](../project/release.md#record-the-production-version) before delivery marks update.
