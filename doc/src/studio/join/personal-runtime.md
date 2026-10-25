---
title: Connect a personal runtime
description: Connect a machine of your own to Studio as a personal runtime. It uses the coding tools and subscriptions you've signed in to there, and runs only work done on your behalf.
---

An admin connects shared runtimes, which run work for everyone on the team. Members connect personal runtimes themselves, and a personal runtime runs only work done on your behalf: every step the coordinator agent arranges in issues you own, and your conversations with team agents in **My sessions**.

Common reasons to connect one:

- The shared runtimes are busy, and you want your own issues to move faster.
- You've signed in to a coding tool or model the team doesn't have yet, and you want to use it on your own issues first.
- You want to run your own issues on your own subscription and quota.

Talking to your own agent in **My sessions** is a different kind of connection. See [Connect your computer](connect-computer.md).

## What you need

The same as for a shared runtime: macOS or Linux (on Windows, Ubuntu on WSL), Node.js 24 or later and Git, the coding tools you want to use, installed and signed in, plus your code host's CLI and Chromium. For details, see [Connect a shared runtime](../setup/shared-runtimes.md#prepare-a-machine).

> [!WARNING] The runner is not a security boundary
> On this machine, agents work as the system user that runs the runner and can read and write everything that user can reach, including SSH keys and other credentials. Use a dedicated system user, a container, or a virtual machine for a personal runtime too, rather than the account you use every day.

## Add it

1. Open **Agent management › Runtimes** and click **Add runtime**. The dialog says the runtime will be personal.
2. Check the coding tools you want to use on this machine, and set the maximum concurrent runs to suit the machine and your quota.
3. Click **Generate install command** and choose the machine's operating system.
4. Give the **Prompt** to a coding tool on that machine and let it do the install, or switch to **Manual** and run the command yourself.

The command carries a one-time credential that works only once and expires within minutes. If it expires, generate a new one. For installation details and troubleshooting, see [Connect a shared runtime](../setup/shared-runtimes.md#install-on-the-machine).

## Check the connection

Within seconds, it appears in the runtime list as **Personal** and **Online**, and the coding tools you checked show **Signed in**. Open its details to see that you're the owner.

If the team has already enabled agents for the models this machine reports, **Where it runs** in **Agent management › Agents** counts your machine too, for example "1 shared · 1 personal".

**Done when**: the runtime shows **Personal** and **Online**, and the coding tools you want show **Signed in**.

## What work comes here

- **Issues you own**: every step the coordinator agent arranges, whether design, development, testing, or review, is done on behalf of the issue owner, so it can run on your personal runtime.
- **Your sessions**: your conversations with team agents in **My sessions**.
- **Agents that exist only on personal runtimes**: for example, a model that is signed in only on your machine. The coordinator agent uses it only in issues you own. When someone else's issue is waiting for such an agent, the **Now** line on the issue page says that only other people's personal runtimes are online.
- **Work that needs secrets**: variables marked **Shared runtimes only** in a project are never sent to personal runtimes, so work that uses them runs only on shared runtimes. Other variables go to whichever runtime takes the work. See [Project settings](../project/settings.md#agent-run-variables).

When someone else comments on an issue you own and the next piece of work needs your personal runtime, Studio asks you first. The issue page shows a request to continue on your personal runner. Click **Confirm** to let the work continue on your runtime, or **Reject** to stop it. See [Answer the agents’ questions](../use/answer.md#requests-to-use-your-personal-runtime).

## Manage it

- **Change it**: in the runtime's details, change the name and maximum concurrent runs, turn coding tools on or off, and set how many runs each tool can have at once. Only the owner can make changes.
- **Pause it**: run `nocobase-runner stop` on the machine, and `nocobase-runner start` to resume. A runner that hasn't contacted Studio for 150 seconds shows as offline, and the work it holds returns to the queue.
- **Variables from this machine**: values you want to keep on this machine only. Set them with `nocobase-runner env set NAME`, and Studio shows only their names.
- **Share it with the team**: to have it run everyone's work, ask an admin to change its usage scope to **Shared** in the details. After that, other people's work also runs on this machine, with their variables and secrets, and can read what's on the machine, so make sure that's acceptable first.
- **Stop using it**: revoke its credential in the details first, then delete it. Its run history is kept. On the machine, run `nocobase-runner uninstall` to remove the runner and its background service.
