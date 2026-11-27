---
title: Installation overview
description: Try Studio on your computer with one command, or deploy it for a team, prepare projects and Agents, configure checks, and invite members.
---

To try Studio on your own computer, use the one-command install. To deploy Studio for a team, we recommend having a local Coding Agent, such as Claude Code or Codex, install and configure it. If you already have an invitation, go to [Get started](../join/index.md).

## Try Studio with one command

```bash
curl -fsSL https://get.nocobase.com/studio | sh
```

It installs Studio Community Edition with a local Git server, a runtime and a first project on this computer. See [Install with one command](install.md#install-with-one-command) for prerequisites and options. For the full walk-through from installing to delivering your first request, see [Install and use Studio](../../getting-started/collaborate-with-studio.md).

## Set up with an Agent

```prompt
Follow https://docs.nocobase.com/studio/setup/ to install NocoBase Studio and configure my first project.
```

The Agent checks the target environment, asks for missing information, and follows the steps below to configure and verify the setup. Follow its prompts when sign-in or authorization requires your participation.

## Choose an edition

| Edition | When to use it |
| --- | --- |
| Community (CE) | Use the Standard or Simple workflow for development. The task owner accepts delivery |
| Professional | Use the [workflow with a separate requester](../use/multi-role-workflow.md#requester) to split responsibilities. The requester confirms requirements and accepts delivery. The owner starts development and merges the changes |
| Enterprise (EE) | Includes Professional features and the Quality workspace for core scenarios, scheduled tests, reports, and follow-up work |

[Contact us](https://www.nocobase.com/contact/) for Professional or Enterprise images and licenses.

## Before you begin

For a team deployment, this guide uses Docker Compose, GitHub, and one shared runtime. Prepare:

- **Studio image**. Community Edition is available on [Docker Hub](https://hub.docker.com/r/nocobase/studio-ce) as `nocobase/studio-ce:latest`.
- **Deployment environment**: Server access and a URL for Studio. A local trial does not need a domain.
- **Git account**: A GitHub account or organization where you can create repositories and install a GitHub App.
- **Coding tools and model accounts**: For example, Claude Code or Codex. You can keep using existing accounts.

The Agent can install and configure the software. Reuse existing databases, reverse proxies, storage, or email services where suitable. The Agent asks for any missing information.

We recommend a separate container or virtual machine for the runtime, isolated from Studio. Install the coding tools and runner inside that environment.

## Prepare the team environment

| Step | Result |
| --- | --- |
| 1. [Deploy Studio](install.md) | Administrators can sign in |
| 2. [Connect a Git platform](git.md) | Studio can create repositories and submit code |
| 3. [Connect a runtime](shared-runtimes.md) | Coding tools are online and ready to work |
| 4. [Configure Agents](agents.md) | The Lead Agent can assign work |
| 5. [Create your first project](new-project.md) | The application code is initialized |
| 6. [Configure checks and previews](ci.md) | Select Agent self-checks or CI to verify changes |
| 7. [Invite members](invite.md) | Members can accept invitations and join the project |

## Members start work

After [accepting an invitation and signing in](../join/sign-in.md), members [walk through their first request](../../getting-started/collaborate-with-studio.md): submit a requirement, follow development, and accept the result. They can use the runtimes prepared by their team.

## Adjust configuration

| Setting | Documentation |
| --- | --- |
| Model responsibilities, execution machines, and shared skills | Agent management: [Agents](../configure/agents.md), [Runtimes](../configure/runtimes.md), and [Skills](../project/skills.md) |
| Check sources and CI pipelines | [Configure repository checks and CI](../configure/checks.md) |
| Repository preview builds | [Configure PR previews](../configure/pr-previews.md) |
| Project information and members | Project management: [Project settings](../project/settings.md) |
| Git connections and other code platforms | Administration: [Code platforms](../configure/git.md) |
| Databases, access URLs, and deployment parameters | Reference: [Configuration](../reference/config.md) |
