---
title: Quick install Studio
metaDescription: "Install Studio Community Edition and a first project on your computer with one command, open the application in the test environment, and hand the first task to an Agent."
---

Install Studio Community Edition and a first project on your computer with one command, then hand the first task to an Agent.

## Prerequisites

- macOS, Linux, or WSL on Windows with Docker Desktop
- Docker with Compose v2, running
- Node.js 24, Git and curl
- At least one coding tool installed and signed in: Claude Code, Codex, OpenCode, Pi and others

## Run the installer

```bash
curl -fsSL https://get.nocobase.com/studio | sh
```

For other options, such as the interface language, see [Installer options](../studio/setup/install.md#installer-options).

The installer sets up on this computer:

- Studio Community Edition, with its data in `~/.nocobase-studio/`
- Gitea, a local Git server for the project repositories
- This computer as a [personal runtime](../studio/join/personal-runtime.md), where Agents run tasks
- **My first project**, whose repository holds a NocoBase 3 application, deployed to a test environment

When it finishes, it prints Studio's address and the sign-in.

## Sign in to Studio

Studio runs at `http://127.0.0.1:13000/main`. Open the printed address, which leads to the first project's conversation, and sign in with the email and password the installer printed. Then change the password under **Account settings › Account and security**.

The conversation holds the Agent's plan for the project and a suggested task with **Start**.

## Open the application in the test environment

The Agent's first reply in the conversation starts with the test application's address, `http://127.0.0.1:13000/my-first-project-staging/`, and its sign-in. Open it and sign in with that email and password to open the NocoBase 3 application the installer created. The application stops after 10 minutes without visits and starts again on the next visit.

The test environment also shows under [Hosted environments](../studio/admin/environments.md) in Studio.

## Start the first task

Click **Start** on the suggested task's card. The Lead Agent hands the task to an Agent on your computer, which spends your model credits.

Progress, changes and check results are recorded in the task; see [Follow progress](../studio/use/follow-progress.md). When development and checks are done, the Agent opens a PR for you to [accept](../studio/use/accept.md).

## Next steps

- Upgrade, stop or uninstall Studio: see [Upgrade, stop and uninstall](../studio/setup/install.md#upgrade-stop-and-uninstall).
- Deploy Studio for a team: see [Installation overview](../studio/setup/index.md).
- See how a team raises requests, follows development and accepts results in Studio: see [Develop with Studio](collaborate-with-studio.md).
