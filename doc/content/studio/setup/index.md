---
title: Installation overview
description: Administrators deploy Studio, prepare projects and Agents, configure checks, and invite the team.
---

We recommend giving the [installation and configuration guide](with-agent.md) to your local Coding Agent to handle deployment, connections, and project setup. Follow its prompts when authorization or sign-in requires your participation.

If you already have an invitation, go to [Get started](../join/index.md).

This guide uses Docker Compose, GitHub, and one shared runtime. Keep using your existing coding tools and model accounts.

## Before you begin

- Obtain a Studio commercial image and access authorization. [Contact us](https://www.nocobase.com/contact/).
- Prepare Docker and Docker Compose. A local trial does not need a domain.
- Prepare a GitHub account or organization where you can create repositories and install a GitHub App.
- Prepare a machine with coding tools installed and signed in, such as Claude Code or Codex.

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

After [accepting an invitation and signing in](../join/sign-in.md), members [walk through their first request](first-request.md): submit a requirement, follow development, and accept the result. They can use the team's runtime without connecting their own computers.

## Adjust configuration

| Setting | Documentation |
| --- | --- |
| Model responsibilities, execution machines, and shared skills | Agent management: [Agents](../configure/agents.md), [Runtimes](../configure/runtimes.md), and [Skills](../project/skills.md) |
| Check sources and CI pipelines | Quality management: [Checks and CI](../configure/checks.md) |
| Project information, members, and default skills | Project management: [Project settings](../project/settings.md) |
| Git connections and other code platforms | Administration: [Code platforms](../configure/git.md) |
| Databases, access URLs, and deployment parameters | Reference: [Configuration](../reference/config.md) |
