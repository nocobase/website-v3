---
title: Connect a shared runtime
description: Install a runner on a team server or virtual machine and connect it to Studio. The coding tools installed there join the agent team and run everyone's issues.
---

A runtime is a machine where agents work. Shared runtimes are what keep the agent team working around the clock. Connecting one needs admin permissions. To connect a machine of your own, see [Connect a personal runtime](../join/personal-runtime.md).

## Prepare a machine

| What | Requirements |
| --- | --- |
| Operating system | macOS or Linux. On Windows, run it in Ubuntu on WSL |
| Basic software | Node.js 24 or later, and Git. Projects that use the NocoBase app template also need pnpm, which you can turn on with Node.js's bundled corepack: `corepack enable` |
| Coding tools | Install and sign in the official way, for example Claude Code and Codex, as the system user that runs the runner. Have tools from two vendors so reviews can go to a model from another vendor |
| Code host CLI | Agents use it to open PRs: `gh` for GitHub, `glab` for GitLab, `gitee` for Gitee |
| A browser | When agents change the interface, they take screenshots in the running app for the delivery report. The runtime must be able to run Chromium. On Linux, install it along with its system dependencies, for example `npx playwright install --with-deps chromium` |
| Network access | The machine can reach Studio's address, and each coding tool can reach its model service |

> [!WARNING] The runner is not a security boundary
> On this machine, agents work as the system user that runs the runner and can read and write everything that user can reach, including SSH keys and other credentials. Use a dedicated system user, a container, or a virtual machine, and don't run it under the same user as Studio itself.

## Add the runtime

1. Open **Agent management › Runtimes** and click **Add runtime**.
2. Under **Usage scope**, choose **Shared**: it runs tasks started by any user and receives their variables and secrets.
3. Under **Coding tools**, check the tools you want to use on this machine. Only work for the checked tools is sent here.
4. **Max concurrent runs** is how many pieces of work the machine runs at once, 3 by default. Set it to match the machine's resources and your model quota. For tools whose subscription allows fewer sessions, set a separate limit under **Advanced: limits per coding tool**.
5. Click **Generate install command** and choose the machine's operating system.

You can change the tools and the concurrency later in the runtime's details.

::figure qs-add-runtime | Adding a shared runtime

## Install on the machine

There are two ways to install. Use either one.

**Prompt.** Copy the whole prompt from the dialog into a coding tool on that machine, such as Claude Code. It checks Node.js and the coding tools, runs the registration command, installs the runner as a background service, sorts out common problems such as PATH, proxies, and npm permissions, and finally tells you which sign-ins or network settings you still need to do yourself.

**Manual.** As the system user that will run the agents, run the command from the dialog on the machine, for example:

```bash
curl -fsSL https://studio.example.com/main/api/agents/dist/installScript | sh -s -- --runner --server https://studio.example.com/main --token <one-time credential>
```

The command downloads the runner, `nocobase-runner`, and the `nb-studio` CLI from your Studio, registers the runner, and sets it to start automatically after sign-in. If `nocobase-runner` is already installed on the machine, use the dialog's `nocobase-runner register` command instead.

**Windows.** Run `wsl --install` in PowerShell first and restart Windows. Then open Ubuntu and run the Linux command. Node.js and the coding tools all go inside Ubuntu on WSL. If WSL can't reach the internet, turn on WSL's mirrored networking.

The prompt and the command carry a one-time credential that works only once. The dialog shows when it expires, usually within a few minutes. If it expires, generate a new one. Give the prompt only to the coding tool on that machine and never pass it on to anyone else.

## Check the connection

Within seconds, the runtime appears in the list as **Online** with the number of runs in progress, such as "Online 0/3", along with the status of each coding tool you checked:

| Status | Meaning | What to do |
| --- | --- | --- |
| Signed in | Ready for work | Nothing |
| Login required | Installed but not signed in | On the machine, sign in to the tool as the system user that runs the runner, then click **Detect again** in the details |
| Not installed | The tool wasn't found | Install it. If it's installed and still shows as not installed, see Troubleshooting below |

**Done when**: the runtime is online and the coding tools you want show **Signed in**. **Agent management › Agents** then lists agents for the common models, and you can add other models with **Add agent**. Next, [enable agents](agents.md).

## Manage runtimes

Click a runtime in the list to open its details:

- **General**: the name, maximum concurrent runs, and usage scope.
- **Tools**: whether each coding tool is on, its status, quota, and how many runs it can have at once. Work for a tool that's turned off isn't sent here.
- **Local policy**: what work the machine's owner allows it to take, set on the machine itself. Studio only shows it.
- **Variables from this machine**: variables the machine can provide to runs. Only their names are shown, and the values stay on the machine. Set them with `nocobase-runner env set NAME`.
- **Workspaces** and **Runs**: the issue directories on this machine and the runs it has carried out.

The runner upgrades itself when no agent is running. To upgrade right away, run `nocobase-runner update` on the machine.

When you stop using a runtime, revoke its credential first. The runner stops on its next request, and the work it holds returns to the queue. After revoking, you can delete it, and its run history is kept. To connect it again, add it again.

## Troubleshooting

**The runtime shows as offline.** A runner that hasn't contacted Studio for 150 seconds shows as offline, and its work returns to the queue for other runtimes to pick up. Run `nocobase-runner status` on the machine to make sure the runner is running and the machine can reach Studio's address.

**The tool is installed but still shows as not installed.** The background service's PATH doesn't include the tool. In a terminal where `which claude` or `which codex` works, run `nocobase-runner service install` again, then restart the service.

**Downloading the runner fails.** If you need a proxy, set it up for both the download and the background service. If npm lacks permission for global installs, use an install directory your user owns or a Node version manager, rather than `sudo npm install`.
